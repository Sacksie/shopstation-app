const request = require('supertest');
const { app } = require('../server'); // Import the actual app
const { pool } = require('../database/db-pg'); // Import PG pool for verification

describe('🆕 New E2E Tests', () => {

  afterAll(async () => {
    // Clean up test data
    await pool.query("DELETE FROM products WHERE name = 'E2E Test Product'");
    await pool.end();
  });

  test('Master Admin can add a price and verify it in PostgreSQL', async () => {
    // 1. Access Master Admin Panel and add a new price
    const productName = 'E2E Test Product';
    const storeName = 'B Kosher';
    const price = 9.99;
    const unit = 'item';

    const response = await request(app)
      .post('/api/manual/add-price')
      .set('x-admin-password', 'test123') // Using failsafe password for tests
      .send({
        store: storeName,
        productName: productName,
        price: price,
        unit: unit
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // 2. Verify the new price is in the PostgreSQL database
    const { rows } = await pool.query(
      `SELECT p.name, s.name as store_name, pr.price, pr.unit 
       FROM prices pr
       JOIN products p ON pr.product_id = p.id
       JOIN stores s ON pr.store_id = s.id
       WHERE p.name = $1 AND s.name = $2`,
      [productName, storeName]
    );

    expect(rows.length).toBe(1);
    expect(rows[0].store_name).toBe(storeName);
    expect(parseFloat(rows[0].price)).toBe(price);
    expect(rows[0].unit).toBe(unit);
  });
});
