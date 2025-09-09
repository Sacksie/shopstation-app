const fs = require('fs').promises;
const path = require('path');
const { pool } = require('../database/db-pg');
const { slugify } = require('../utils/slugify');

const jsonPath = path.join(__dirname, '../database/kosher-prices.json');

async function verifyMigration() {
  console.log('🚀 Starting PostgreSQL data verification...');
  let issuesFound = 0;
  let successCount = 0;

  try {
    // 1. Read JSON data
    const jsonData = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
    const { products: jsonProducts, stores: jsonStores } = jsonData;

    // 2. Verify Stores
    console.log('\n🔍 Verifying Stores...');
    for (const storeName in jsonStores) {
      const { rows } = await pool.query('SELECT * FROM stores WHERE name = $1', [storeName]);
      if (rows.length === 0) {
        console.error(`❌ Store not found in PG: ${storeName}`);
        issuesFound++;
      } else {
        console.log(`✅ Store verified: ${storeName}`);
        successCount++;
      }
    }

    // 3. Verify Products and Prices
    console.log('\n🔍 Verifying Products and Prices...');
    for (const productKey in jsonProducts) {
      const productData = jsonProducts[productKey];
      const productSlug = slugify(productKey);

      // Verify product exists
      const { rows: productRows } = await pool.query('SELECT id, name, category FROM products WHERE slug = $1', [productSlug]);
      if (productRows.length === 0) {
        console.error(`❌ Product not found in PG: ${productData.displayName} (slug: ${productSlug})`);
        issuesFound++;
        continue;
      }
      
      const productId = productRows[0].id;
      console.log(`✅ Product verified: ${productData.displayName}`);
      successCount++;
      
      // Verify prices for the product
      for (const storeName in productData.prices) {
        const priceInfo = productData.prices[storeName];

        const { rows: priceRows } = await pool.query(
          `SELECT pr.price, pr.unit 
           FROM prices pr
           JOIN stores s ON pr.store_id = s.id
           WHERE pr.product_id = $1 AND s.name = $2`,
          [productId, storeName]
        );

        if (priceRows.length === 0) {
          console.error(`  ❌ Price not found for ${productData.displayName} at ${storeName}`);
          issuesFound++;
        } else {
          const pgPrice = parseFloat(priceRows[0].price);
          const jsonPrice = parseFloat(priceInfo.price);

          if (pgPrice !== jsonPrice || priceRows[0].unit !== priceInfo.unit) {
            console.error(`  ❌ Price mismatch for ${productData.displayName} at ${storeName}`);
            console.error(`    - JSON: Price ${jsonPrice}, Unit ${priceInfo.unit}`);
            console.error(`    - PG:   Price ${pgPrice}, Unit ${priceRows[0].unit}`);
            issuesFound++;
          } else {
            console.log(`  ✅ Price verified for ${productData.displayName} at ${storeName}`);
            successCount++;
          }
        }
      }
    }

  } catch (error) {
    console.error('An error occurred during verification:', error);
    issuesFound++;
  } finally {
    console.log('\n--------------------');
    console.log('📊 Verification Summary:');
    console.log(`  - ${successCount} checks passed.`);
    console.log(`  - ${issuesFound} issues found.`);
    if (issuesFound === 0) {
      console.log('\n🎉 SUCCESS: All data verified. The migration is 100% successful!');
    } else {
      console.log('\n⚠️ ATTENTION: Discrepancies found. Please review the logs above.');
    }
    await pool.end();
  }
}

verifyMigration();
