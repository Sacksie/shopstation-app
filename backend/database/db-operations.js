/**
 * Database Operations Layer
 * 
 * BUSINESS CRITICAL: Unified interface for all database operations
 * - Automatically uses PostgreSQL when available
 * - Falls back to JSON for development/testing
 * - Provides consistent API regardless of backend
 * - Handles your existing kosher store data
 */

const database = require('./db-connection');
const fs = require('fs').promises;
const path = require('path');

class DatabaseOperations {
  constructor() {
    this.jsonPath = path.join(__dirname, 'kosher-prices.json');
    this.usePostgreSQL = false;
  }

  /**
   * Initialize database operations
   */
  async initialize() {
    if (database.isAvailable()) {
      this.usePostgreSQL = true;
      console.log('✅ Using PostgreSQL database');
    } else {
      this.usePostgreSQL = false;
      console.log('ℹ️  Using JSON database (development mode)');
    }
  }

  /**
   * Get all stores
   */
  async getStores() {
    if (this.usePostgreSQL) {
      const result = await database.query(`
        SELECT * FROM stores 
        WHERE is_active = true 
        ORDER BY name
      `);
      return result.rows;
    } else {
      const data = await this.readJSONData();
      return Object.entries(data.stores || {}).map(([slug, store]) => ({
        slug,
        name: store.name || slug,
        location: store.location,
        phone: store.phone,
        hours: store.hours,
        rating: store.rating
      }));
    }
  }

  /**
   * Get all products with prices
   */
  async getProducts() {
    if (this.usePostgreSQL) {
      const result = await database.query(`
        SELECT 
          p.id, p.name, p.slug, p.synonyms, p.common_brands,
          c.name as category_name, c.slug as category_slug,
          json_agg(
            json_build_object(
              'store_name', s.name,
              'store_slug', s.slug, 
              'price', sp.price,
              'unit', sp.unit,
              'in_stock', sp.in_stock,
              'last_updated', sp.last_updated
            )
          ) as prices
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN store_products sp ON p.id = sp.product_id
        LEFT JOIN stores s ON sp.store_id = s.id
        WHERE p.is_active = true
        GROUP BY p.id, p.name, p.slug, c.name, c.slug
        ORDER BY p.name
      `);
      return result.rows;
    } else {
      const data = await this.readJSONData();
      return Object.entries(data.products || {}).map(([slug, product]) => ({
        slug,
        name: product.displayName || product.name || slug,
        synonyms: product.synonyms,
        common_brands: product.commonBrands,
        category_name: product.category,
        prices: Object.entries(product.prices || {}).map(([store, priceData]) => ({
          store_name: store,
          price: priceData.price,
          unit: priceData.unit,
          last_updated: priceData.lastUpdated
        }))
      }));
    }
  }

  /**
   * Search products by name or synonyms
   */
  async searchProducts(searchTerm) {
    if (this.usePostgreSQL) {
      const result = await database.query(`
        SELECT 
          p.id, p.name, p.slug, p.synonyms,
          json_agg(
            json_build_object(
              'store_name', s.name,
              'price', sp.price,
              'unit', sp.unit,
              'in_stock', sp.in_stock
            )
          ) FILTER (WHERE s.id IS NOT NULL) as prices
        FROM products p
        LEFT JOIN store_products sp ON p.id = sp.product_id
        LEFT JOIN stores s ON sp.store_id = s.id AND s.is_active = true
        WHERE p.is_active = true 
          AND (
            LOWER(p.name) LIKE LOWER($1) 
            OR EXISTS (
              SELECT 1 FROM unnest(p.synonyms) AS syn 
              WHERE LOWER(syn) LIKE LOWER($1)
            )
          )
        GROUP BY p.id, p.name, p.slug
        ORDER BY p.name
      `, [`%${searchTerm}%`]);
      
      return result.rows.map(product => ({
        ...product,
        prices: product.prices || []
      }));
    } else {
      // JSON fallback with your existing fuzzy matching logic
      const data = await this.readJSONData();
      const stringSimilarity = require('string-similarity');
      const results = [];

      Object.entries(data.products || {}).forEach(([slug, product]) => {
        const productName = product.displayName || product.name || slug;
        const synonyms = product.synonyms || [];
        
        // Check direct matches
        const searchTerms = [productName, ...synonyms];
        const similarity = stringSimilarity.findBestMatch(searchTerm.toLowerCase(), 
          searchTerms.map(term => term.toLowerCase()));
        
        if (similarity.bestMatch.rating > 0.3) {
          results.push({
            slug,
            name: productName,
            synonyms: product.synonyms,
            prices: Object.entries(product.prices || {}).map(([store, priceData]) => ({
              store_name: store,
              price: priceData.price,
              unit: priceData.unit,
              in_stock: true
            }))
          });
        }
      });

      return results.sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  /**
   * Add new product
   */
  async addProduct(productData) {
    if (this.usePostgreSQL) {
      return await database.transaction([
        {
          query: `
            INSERT INTO products (name, slug, category_id, synonyms, common_brands)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
          `,
          params: [
            productData.name,
            productData.slug || productData.name.toLowerCase().replace(/\s+/g, '-'),
            productData.categoryId || null,
            productData.synonyms || null,
            productData.commonBrands || null
          ]
        }
      ]);
    } else {
      // JSON fallback
      const data = await this.readJSONData();
      const slug = productData.slug || productData.name.toLowerCase().replace(/\s+/g, '-');
      
      data.products = data.products || {};
      data.products[slug] = {
        displayName: productData.name,
        category: productData.category || 'general',
        synonyms: productData.synonyms || [],
        commonBrands: productData.commonBrands || [],
        prices: {}
      };
      
      await this.writeJSONData(data);
      return { success: true, slug };
    }
  }

  /**
   * Update product price for a store
   */
  async updateProductPrice(productSlug, storeName, priceData) {
    if (this.usePostgreSQL) {
      // Get product and store IDs
      const productResult = await database.query('SELECT id FROM products WHERE slug = $1', [productSlug]);
      const storeResult = await database.query('SELECT id FROM stores WHERE name = $1 OR slug = $1', [storeName]);
      
      if (!productResult.rows[0] || !storeResult.rows[0]) {
        throw new Error('Product or store not found');
      }

      await database.query(`
        INSERT INTO store_products (store_id, product_id, price, unit, last_updated, updated_by)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)
        ON CONFLICT (store_id, product_id) DO UPDATE SET
          price = EXCLUDED.price,
          unit = EXCLUDED.unit,
          last_updated = EXCLUDED.last_updated,
          updated_by = EXCLUDED.updated_by
      `, [
        storeResult.rows[0].id,
        productResult.rows[0].id,
        parseFloat(priceData.price),
        priceData.unit || 'item',
        priceData.updatedBy || 'admin'
      ]);

      return { success: true };
    } else {
      // JSON fallback
      const data = await this.readJSONData();
      
      if (!data.products[productSlug]) {
        throw new Error('Product not found');
      }

      data.products[productSlug].prices = data.products[productSlug].prices || {};
      data.products[productSlug].prices[storeName] = {
        price: parseFloat(priceData.price),
        unit: priceData.unit || 'item',
        lastUpdated: new Date().toISOString()
      };

      await this.writeJSONData(data);
      return { success: true };
    }
  }

  /**
   * Update product information (display name, category, etc.)
   */
  async updateProductInfo(productSlug, updates) {
    if (this.usePostgreSQL) {
      const setClause = [];
      const values = [];
      let paramIndex = 1;

      if (updates.name || updates.displayName) {
        setClause.push(`name = $${paramIndex++}`);
        values.push(updates.name || updates.displayName);
      }
      
      if (updates.synonyms) {
        setClause.push(`synonyms = $${paramIndex++}`);
        values.push(updates.synonyms);
      }
      
      if (updates.commonBrands) {
        setClause.push(`common_brands = $${paramIndex++}`);
        values.push(updates.commonBrands);
      }
      
      if (updates.categoryId) {
        setClause.push(`category_id = $${paramIndex++}`);
        values.push(updates.categoryId);
      }

      if (setClause.length === 0) {
        return { success: true, message: 'No updates provided' };
      }

      setClause.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(productSlug);

      await database.query(`
        UPDATE products 
        SET ${setClause.join(', ')}
        WHERE slug = $${paramIndex}
      `, values);

      return { success: true };
    } else {
      const data = await this.readJSONData();
      
      if (!data.products[productSlug]) {
        return { success: false, error: 'Product not found' };
      }

      if (updates.displayName || updates.name) {
        data.products[productSlug].displayName = updates.displayName || updates.name;
      }
      
      if (updates.category) {
        data.products[productSlug].category = updates.category;
      }
      
      if (updates.synonyms) {
        data.products[productSlug].synonyms = updates.synonyms;
      }
      
      if (updates.commonBrands) {
        data.products[productSlug].commonBrands = updates.commonBrands;
      }

      await this.writeJSONData(data);
      return { success: true };
    }
  }

  /**
   * Delete product
   */
  async deleteProduct(productSlug) {
    if (this.usePostgreSQL) {
      await database.query('UPDATE products SET is_active = false WHERE slug = $1', [productSlug]);
      return { success: true };
    } else {
      const data = await this.readJSONData();
      if (data.products && data.products[productSlug]) {
        delete data.products[productSlug];
        await this.writeJSONData(data);
      }
      return { success: true };
    }
  }

  /**
   * Add product request
   */
  async addProductRequest(requestData) {
    if (this.usePostgreSQL) {
      const result = await database.query(`
        INSERT INTO product_requests (user_name, user_email, product_name, category_suggestion, description)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, created_at
      `, [
        requestData.userName || null,
        requestData.userEmail || null,
        requestData.productName,
        requestData.categorySuggestion || null,
        requestData.description || null
      ]);

      return { 
        success: true, 
        requestId: result.rows[0].id,
        createdAt: result.rows[0].created_at
      };
    } else {
      // JSON fallback - add to a requests array
      const data = await this.readJSONData();
      data.productRequests = data.productRequests || [];
      
      const request = {
        id: data.productRequests.length + 1,
        ...requestData,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      data.productRequests.push(request);
      await this.writeJSONData(data);
      
      return { success: true, requestId: request.id };
    }
  }

  /**
   * Get product requests for admin
   */
  async getProductRequests() {
    if (this.usePostgreSQL) {
      const result = await database.query(`
        SELECT * FROM product_requests 
        ORDER BY created_at DESC
      `);
      return result.rows;
    } else {
      const data = await this.readJSONData();
      return data.productRequests || [];
    }
  }

  /**
   * Read JSON data (fallback method)
   */
  async readJSONData() {
    try {
      const content = await fs.readFile(this.jsonPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.warn('Could not read JSON data, returning empty structure');
      return { stores: {}, products: {}, productRequests: [] };
    }
  }

  /**
   * Write JSON data (fallback method)
   */
  async writeJSONData(data) {
    await fs.writeFile(this.jsonPath, JSON.stringify(data, null, 2));
  }

  /**
   * Get database type for debugging
   */
  getDatabaseType() {
    return this.usePostgreSQL ? 'PostgreSQL' : 'JSON';
  }
}

// Create singleton instance
const dbOps = new DatabaseOperations();

// Initialize on module load
dbOps.initialize().catch(error => {
  console.error('Failed to initialize database operations:', error.message);
});

module.exports = dbOps;