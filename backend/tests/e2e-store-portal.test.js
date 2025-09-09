const request = require('supertest');
const { app } = require('../server');
const { pool } = require('../database/db-pg');
const { execSync } = require('child_process');

describe('🆕 Store Portal E2E Tests', () => {
  let productId;
  let originalPrice;
  let authToken;

  beforeAll(async () => {
    // Generate auth token for the test user
    try {
      authToken = execSync('node backend/scripts/generate-test-token.js owner@koshercorner.com').toString().trim();
    } catch (error) {
      console.error("Could not generate auth token. Make sure the test user 'owner@koshercorner.com' exists.");
      process.exit(1);
    }
    
    // 1. Get a product to update
    const { rows } = await pool.query("SELECT p.id, pr.price FROM products p JOIN prices pr ON p.id = pr.product_id WHERE p.name = 'Milk' LIMIT 1");
    if (rows.length > 0) {
      productId = rows[0].id;
      originalPrice = rows[0].price;
    } else {
      // If milk isn't there, create a product to ensure test can run
      const insertProduct = await pool.query("INSERT INTO products (name, category) VALUES ('E2E Store Portal Product', 'dairy') RETURNING id");
      productId = insertProduct.rows[0].id;
      const { rows: storeRows } = await pool.query("SELECT id FROM stores WHERE name = 'B Kosher'");
      const storeId = storeRows[0].id;
      await pool.query("INSERT INTO prices (product_id, store_id, price, unit) VALUES ($1, $2, 5.55, 'item')", [productId, storeId]);
      originalPrice = 5.55;
    }
  });

  afterAll(async () => {
    // Clean up: restore original price
    if (productId && originalPrice) {
       const { rows: storeRows } = await pool.query("SELECT id FROM stores WHERE name = 'B Kosher'");
       const storeId = storeRows[0].id;
       await pool.query('UPDATE prices SET price = $1 WHERE product_id = $2 AND store_id = $3', [originalPrice, productId, storeId]);
    }
    await pool.query("DELETE FROM products WHERE name = 'E2E Store Portal Product'");
    await pool.end();
  });

  test('Store Portal user can update a price and verify it in PostgreSQL', async () => {
    const newPrice = 1.99;

    // 2. Update a product's price from the Store Portal
    const response = await request(app)
      .put(`/api/portal/my-products/${productId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ price: newPrice });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // 3. Verify the change in the PostgreSQL database
    const { rows } = await pool.query(
      `SELECT price FROM prices WHERE product_id = $1`,
      [productId]
    );

    expect(rows.length).toBeGreaterThan(0);
    expect(parseFloat(rows[0].price)).toBe(newPrice);
  });
});

describe('🆕 Migration E2E Test', () => {
    test('Should run the "Migrate JSON data to PostgreSQL" tool and verify it completes without errors', async () => {
        const response = await request(app)
            .post('/api/admin/migrate-to-pg')
            .set('x-admin-password', 'test123'); // Using failsafe password

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.error).toBeUndefined();
        expect(response.body.output).toContain("Migration completed successfully");
    });
});
