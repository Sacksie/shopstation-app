const express = require('express');
const router = express.Router();
const dbOperations = require('../database/db-operations');

/**
 * Products API - Provides product data for enhanced matching
 * Used by the frontend for smart product search and suggestions
 */

// Get all products with enhanced data
router.get('/', async (req, res) => {
  try {
    let products;
    
    if (dbOperations.usePostgreSQL) {
      // PostgreSQL implementation
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
        ORDER BY p.name ASC
      `;
      const result = await dbOperations.query(query);
      products = result.rows;
    } else {
      // JSON fallback for development
      const data = await dbOperations.readJSONData();
      products = data.products || [];
      
      // Ensure all products have the required fields
      products = products.map(product => ({
        id: product.id || Date.now().toString(),
        name: product.name || product.product_name || 'Unknown Product',
        category_name: product.category_name || product.category || 'General',
        description: product.description || '',
        synonyms: product.synonyms || [],
        common_brands: product.common_brands || [],
        dietary_info: product.dietary_info || {},
        created_at: product.created_at || new Date().toISOString(),
        updated_at: product.updated_at || new Date().toISOString()
      }));
    }

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
