/**
 * Database Operations Layer
 * 
 * BUSINESS CRITICAL: Unified interface for all database operations
 * - Uses PostgreSQL for all data storage and retrieval
 * - Provides consistent API for the application
 * - Handles your existing kosher store data
 */

const database = require('./db-connection');
const bcrypt = require('bcrypt');

class DatabaseOperations {
  /**
   * Create a new store user with a hashed password
   */
  async createStoreUser({ email, password, storeId, role = 'staff' }) {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const result = await database.query(`
      INSERT INTO store_users (email, password_hash, store_id, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, role, created_at
    `, [email, passwordHash, storeId, role]);

    return result.rows[0];
  }

  /**
   * Find a store user by email
   */
  async findStoreUserByEmail(email) {
    const result = await database.query(
      'SELECT * FROM store_users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  /**
   * Verify a user's password
   */
  async verifyUserPassword(password, passwordHash) {
    return bcrypt.compare(password, passwordHash);
  }

  /**
   * Create a new store
   */
  async createStore({ name, owner_email }) {
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const result = await database.query(`
      INSERT INTO stores (name, slug, owner_email)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [name, slug, owner_email]);
    return result.rows[0];
  }

  /**
   * Find a store by name
   */
  async findStoreByName(name) {
    const result = await database.query(
      'SELECT * FROM stores WHERE name = $1 OR slug = $1',
      [name]
    );
    return result.rows[0];
  }

  /**
   * Find a product by slug
   */
  async findProductBySlug(slug) {
    const result = await database.query(
      'SELECT * FROM products WHERE slug = $1 AND is_active = true',
      [slug]
    );
    return result.rows[0];
  }

  /**
   * Get all stores
   */
  async getStores() {
    const result = await database.query(`
      SELECT * FROM stores 
      WHERE is_active = true 
      ORDER BY name
    `);
    return result.rows;
  }

  /**
   * Get all products for a specific store
   */
  async getProductsByStore(storeId) {
    const result = await database.query(`
      SELECT 
        p.id,
        p.name,
        p.slug,
        c.name as category_name,
        sp.price,
        sp.unit,
        sp.in_stock
      FROM products p
      JOIN store_products sp ON p.id = sp.product_id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE sp.store_id = $1 AND p.is_active = true
      ORDER BY p.name;
    `, [storeId]);
    return result.rows;
  }

  /**
   * Get a competitive price report for a store
   */
  async getCompetitivePriceReport(storeId) {
    // This is a complex query that does the following:
    // 1. Finds all products for the given store (s1).
    // 2. For each of those products, it finds the prices at all *other* stores (s2).
    // 3. It aggregates the competitor prices into a JSON object.
    const result = await database.query(`
      WITH my_store_products AS (
        -- Select all products for the logged-in store
        SELECT product_id, price
        FROM store_products
        WHERE store_id = $1
      )
      SELECT
        p.id,
        p.name,
        c.name as category,
        msp.price as "myPrice",
        (
          -- This subquery finds competitor prices for each product
          SELECT json_object_agg(s.name, sp.price)
          FROM store_products sp
          JOIN stores s ON sp.store_id = s.id
          WHERE sp.product_id = p.id AND sp.store_id != $1
        ) as competitors
      FROM products p
      JOIN my_store_products msp ON p.id = msp.product_id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true
      ORDER BY p.name;
    `, [storeId]);
    
    // The query returns competitors as a JSON object, which is exactly what the frontend needs.
    // We filter out any items that don't have competitor prices for a cleaner report.
    return { keyItems: result.rows.filter(row => row.competitors) };
  }

  /**
   * Get a customer demand report for a store
   */
  async getCustomerDemandReport(storeId) {
    // This query is in two parts:
    // 1. Get the top 10 most frequent search terms from the analytics table.
    // 2. For each term, check if a product with a similar name exists for the given store.
    const result = await database.query(`
      WITH top_searches AS (
        SELECT 
          search_term,
          SUM(search_count) as total_searches
        FROM search_analytics
        GROUP BY search_term
        ORDER BY total_searches DESC
        LIMIT 10
      ),
      store_products_normalized AS (
        -- Get a list of all product names and synonyms for the current store
        SELECT name, synonyms FROM products p
        JOIN store_products sp ON p.id = sp.product_id
        WHERE sp.store_id = $1
      )
      SELECT
        ts.search_term,
        ts.total_searches,
        EXISTS (
          -- Check if the search term matches any product name or synonym in the store
          SELECT 1 FROM store_products_normalized
          WHERE 
            LOWER(ts.search_term) LIKE '%' || LOWER(name) || '%'
            OR
            EXISTS (
              SELECT 1 FROM unnest(synonyms) as s WHERE LOWER(ts.search_term) LIKE '%' || LOWER(s) || '%'
            )
        ) as is_stocked
      FROM top_searches ts;
    `, [storeId]);
    
    const topSearches = [];
    const missedOpportunities = [];

    result.rows.forEach(row => {
      const item = {
        term: row.search_term,
        searches: parseInt(row.total_searches, 10)
      };
      if (row.is_stocked) {
        // Placeholder for conversion rate, as we don't track that yet
        topSearches.push({ ...item, conversionRate: 0.65 }); 
      } else {
        missedOpportunities.push(item);
      }
    });

    // Placeholder for peak times, as we don't have enough data to calculate this yet
    const peakTimes = [
      { day: 'Thursday', hour: '6 PM', activity: 95 },
      { day: 'Friday', hour: '11 AM', activity: 88 },
      { day: 'Sunday', hour: '2 PM', activity: 75 },
    ];

    return { topSearches, missedOpportunities, peakTimes };
  }

  /**
   * Get dashboard summary data for a store
   */
  async getDashboardSummary(storeId) {
    try {
      // Get store name
      const storeResult = await database.query('SELECT name FROM stores WHERE id = $1', [storeId]);
      const storeName = storeResult.rows[0]?.name || 'Unknown Store';

      // Get competitive price data
      const priceReport = await this.getCompetitivePriceReport(storeId);
      let cheapestItems = 0;
      let mostExpensiveItems = 0;

      priceReport.keyItems.forEach(item => {
        const competitorPrices = Object.values(item.competitors || {});
        if (competitorPrices.length > 0) {
          const minPrice = Math.min(...competitorPrices);
          const maxPrice = Math.max(...competitorPrices);
          
          if (item.myPrice < minPrice) {
            cheapestItems++;
          } else if (item.myPrice > maxPrice) {
            mostExpensiveItems++;
          }
        }
      });

      // Get customer demand data
      const demandReport = await this.getCustomerDemandReport(storeId);

      // Calculate wins tracker (placeholder for now - this would need more complex analytics)
      const winsTracker = {
        newCustomers: Math.floor(Math.random() * 20) + 5, // Placeholder
        reason: 'competitive pricing strategy',
        period: 'this week'
      };

      return {
        storeName,
        winsTracker,
        priceIntelligence: {
          cheapestItems,
          mostExpensiveItems
        },
        demandAnalytics: {
          topSearches: demandReport.topSearches.slice(0, 3).map(item => item.term),
          missedOpportunities: demandReport.missedOpportunities.slice(0, 2).map(item => item.term)
        }
      };

    } catch (error) {
      console.error('Error generating dashboard summary:', error);
      throw error;
    }
  }

  /**
   * Get all products with prices
   */
  async getProducts() {
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
  }

  /**
   * Search products by name or synonyms
   */
  async searchProducts(searchTerm) {
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
  }

  /**
   * Add new product
   */
  async addProduct(productData) {
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
  }

  /**
   * Update product price for a store
   */
  async updateProductPrice(productSlug, storeName, priceData) {
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
  }

  /**
   * Update product price for a specific store and product ID
   */
  async updateStoreProductPrice(storeId, productId, newPrice) {
    const result = await database.query(`
      UPDATE store_products
      SET price = $1, last_updated = NOW()
      WHERE store_id = $2 AND product_id = $3
      RETURNING store_id, product_id, price, last_updated;
    `, [parseFloat(newPrice), storeId, productId]);

    if (result.rowCount === 0) {
      throw new Error('Product not found for this store, or price was not changed.');
    }

    return { success: true, updatedProduct: result.rows[0] };
  }

  /**
   * Update product information (display name, category, etc.)
   */
  async updateProductInfo(productSlug, updates) {
    const setClause = [];
    const values = [];
    let paramIndex = 1;

    // Correctly handle displayName or name
    if (updates.displayName) {
      setClause.push(`name = $${paramIndex++}`);
      values.push(updates.displayName);
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

    const result = await database.query(`
      UPDATE products 
      SET ${setClause.join(', ')}
      WHERE slug = $${paramIndex}
    `, values);

    if (result.rowCount === 0) {
      return { success: false, error: 'Product not found or no changes made' };
    }

    return { success: true };
  }

  /**
   * Delete product
   */
  async deleteProduct(productSlug) {
    await database.query('UPDATE products SET is_active = false WHERE slug = $1', [productSlug]);
    return { success: true };
  }

  /**
   * Add product request
   */
  async addProductRequest(requestData) {
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
  }

  /**
   * Get product requests for admin
   */
  async getProductRequests() {
    const result = await database.query(`
      SELECT * FROM product_requests 
      ORDER BY created_at DESC
    `);
    return result.rows;
  }
}

// Create singleton instance
const dbOps = new DatabaseOperations();

module.exports = dbOps;