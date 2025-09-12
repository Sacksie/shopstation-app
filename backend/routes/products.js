const express = require('express');
const router = express.Router();
const dbOperations = require('../database/db-operations');
const multer = require('multer');
const csv = require('csv-parser');
const { Readable } = require('stream');

const upload = multer({ storage: multer.memoryStorage() });

// Test route to verify the router is working
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Products router is working' });
});

/**
 * POST /upload
 * Handles CSV file upload for inventory import.
 * This is a multi-stage process:
 * 1. Receives the file and parses headers.
 * 2. Returns headers to the client for column mapping.
 * 3. Receives mapping and file again to process and import data.
 */
router.post('/upload', upload.single('inventoryFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded.' });
    }

    const { stage, mapping } = req.body;

    // STAGE 1: Parse headers and send back for mapping
    if (stage === 'parseHeaders') {
      const headers = await getCsvHeaders(req.file.buffer);
      return res.json({ success: true, headers });
    }

    // STAGE 2: Process the file with user-provided mapping
    if (stage === 'processData') {
      if (!mapping) {
        return res.status(400).json({ success: false, error: 'Column mapping is required.' });
      }

      // In a real app, you would have a robust job queue for this.
      // For now, we process it directly.
      const results = await processCsvWithMapping(req.file.buffer, JSON.parse(mapping));

      // Placeholder: In a real implementation, you'd save this to the database.
      console.log('--- Imported Data ---');
      console.log(results);
      console.log('---------------------');
      
      return res.json({ 
        success: true, 
        message: 'Import successful!',
        summary: {
          totalRows: results.length,
          // other stats can be added here
        }
      });
    }
    
    return res.status(400).json({ success: false, error: 'Invalid stage provided.' });

  } catch (error) {
    console.error('Error processing inventory upload:', error);
    res.status(500).json({ success: false, error: 'Failed to process file.' });
  }
});

// Helper function to get CSV headers
const getCsvHeaders = (buffer) => {
  return new Promise((resolve, reject) => {
    const readableStream = Readable.from(buffer.toString());
    readableStream
      .pipe(csv())
      .on('headers', (headers) => {
        readableStream.destroy(); // Stop reading after headers are found
        resolve(headers);
      })
      .on('error', (error) => reject(error));
  });
};

// Helper function to process CSV with mapping
const processCsvWithMapping = (buffer, mapping) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const readableStream = Readable.from(buffer.toString());
    
    readableStream
      .pipe(csv({
        mapHeaders: ({ header }) => {
          // Find the new header name from the mapping provided by the user
          for (const key in mapping) {
            if (mapping[key] === header) {
              return key; // This is our internal field name (e.g., 'productName')
            }
          }
          return null; // Ignore columns that are not mapped
        }
      }))
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

/**
 * Products API - Provides product data for enhanced matching
 * Used by the frontend for smart product search and suggestions
 */

// Get all products with enhanced data
router.get('/', async (req, res) => {
  console.log('=== PRODUCTS ROUTE CALLED ===');
  try {
    console.log('Products route: Starting to fetch products...');
    // Use the new database operations
    const products = await dbOperations.getProducts();
    console.log('Products route: Successfully fetched', products.length, 'products');

    res.json({
      success: true,
      products: products,
      total: products.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products',
      message: 'Unable to retrieve product information. Please try again later.'
    });
  }
});

// Search products by name, category, or synonyms
router.get('/search', async (req, res) => {
  try {
    const { q: query, category, limit = 20 } = req.query;
    
    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    let products;
    
    if (dbOperations.usePostgreSQL) {
      // PostgreSQL implementation with full-text search
      const searchQuery = `
        SELECT 
          p.id,
          p.name,
          p.category_name,
          p.description,
          p.synonyms,
          p.common_brands,
          p.dietary_info,
          p.created_at,
          p.updated_at
        FROM products p
        WHERE 
          p.name ILIKE $1 OR
          p.category_name ILIKE $1 OR
          p.synonyms::text ILIKE $1 OR
          p.description ILIKE $1
        ${category ? 'AND p.category_name ILIKE $2' : ''}
        ORDER BY 
          CASE WHEN p.name ILIKE $1 THEN 1 ELSE 2 END,
          p.name ASC
        LIMIT $${category ? '3' : '2'}
      `;
      
      const values = category 
        ? [`%${query.trim()}%`, `%${category}%`, parseInt(limit)]
        : [`%${query.trim()}%`, parseInt(limit)];
      
      const result = await dbOperations.query(searchQuery, values);
      products = result.rows;
    } else {
      // JSON fallback for development - use the proper method
      products = await dbOperations.getProducts();
      
      // Filter products based on search query
      const searchLower = query.toLowerCase().trim();
      products = products.filter(product => {
        const nameMatch = product.name?.toLowerCase().includes(searchLower);
        const categoryMatch = product.category_name?.toLowerCase().includes(searchLower);
        const synonymMatch = product.synonyms?.some(synonym => 
          synonym.toLowerCase().includes(searchLower)
        );
        
        return nameMatch || categoryMatch || synonymMatch;
      });
      
      // Apply category filter if specified
      if (category) {
        products = products.filter(product => 
          product.category_name?.toLowerCase().includes(category.toLowerCase())
        );
      }
      
      // Sort by relevance (exact name matches first)
      products.sort((a, b) => {
        const aExact = a.name?.toLowerCase() === searchLower;
        const bExact = b.name?.toLowerCase() === searchLower;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        return a.name?.localeCompare(b.name) || 0;
      });
      
      // Apply limit
      products = products.slice(0, parseInt(limit));
    }

    res.json({
      success: true,
      products: products,
      total: products.length,
      query: query.trim(),
      category: category || null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search products',
      message: 'Unable to search products. Please try again later.'
    });
  }
});

// Get products by category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 50 } = req.query;
    
    let products;
    
    if (dbOperations.usePostgreSQL) {
      const query = `
        SELECT 
          p.id,
          p.name,
          p.category_name,
          p.description,
          p.synonyms,
          p.common_brands,
          p.dietary_info,
          p.created_at,
          p.updated_at
        FROM products p
        WHERE p.category_name ILIKE $1
        ORDER BY p.name ASC
        LIMIT $2
      `;
      const result = await dbOperations.query(query, [`%${category}%`, parseInt(limit)]);
      products = result.rows;
    } else {
      // JSON fallback for development - use the proper method
      products = await dbOperations.getProducts();
      
      products = products.filter(product => 
        product.category_name?.toLowerCase().includes(category.toLowerCase())
      );
      
      products.sort((a, b) => a.name?.localeCompare(b.name) || 0);
      products = products.slice(0, parseInt(limit));
    }

    res.json({
      success: true,
      products: products,
      total: products.length,
      category: category,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products by category',
      message: 'Unable to retrieve products. Please try again later.'
    });
  }
});

// Get product suggestions for autocomplete
router.get('/suggestions', async (req, res) => {
  try {
    const { q: query, limit = 10 } = req.query;
    
    if (!query || !query.trim()) {
      return res.json({
        success: true,
        suggestions: [],
        total: 0
      });
    }

    let suggestions;
    
    if (dbOperations.usePostgreSQL) {
      const query = `
        SELECT DISTINCT
          p.name,
          p.category_name,
          p.synonyms
        FROM products p
        WHERE 
          p.name ILIKE $1 OR
          p.synonyms::text ILIKE $1
        ORDER BY 
          CASE WHEN p.name ILIKE $1 THEN 1 ELSE 2 END,
          p.name ASC
        LIMIT $2
      `;
      const result = await dbOperations.query(query, [`%${query.trim()}%`, parseInt(limit)]);
      suggestions = result.rows;
    } else {
      // JSON fallback for development - use the proper method
      const allProducts = await dbOperations.getProducts();
      
      const searchLower = query.toLowerCase().trim();
      suggestions = allProducts
        .filter(product => {
          const nameMatch = product.name?.toLowerCase().includes(searchLower);
          const synonymMatch = product.synonyms?.some(synonym => 
            synonym.toLowerCase().includes(searchLower)
          );
          return nameMatch || synonymMatch;
        })
        .map(product => ({
          name: product.name,
          category_name: product.category_name,
          synonyms: product.synonyms || []
        }))
        .sort((a, b) => {
          const aExact = a.name?.toLowerCase() === searchLower;
          const bExact = b.name?.toLowerCase() === searchLower;
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;
          return a.name?.localeCompare(b.name) || 0;
        })
        .slice(0, parseInt(limit));
    }

    res.json({
      success: true,
      suggestions: suggestions,
      total: suggestions.length,
      query: query.trim(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching product suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product suggestions',
      message: 'Unable to get product suggestions. Please try again later.'
    });
  }
});

module.exports = router;
