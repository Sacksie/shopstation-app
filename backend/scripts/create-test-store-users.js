#!/usr/bin/env node

/**
 * Create Test Store Users Script
 * 
 * BUSINESS CRITICAL: Creates test user accounts for the four Kosher stores
 * to enable testing of the Store Portal functionality.
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const database = require('../database/db-connection');

// Test store user data
const TEST_STORE_USERS = [
  {
    email: 'owner@koshercorner.com',
    password: 'koshercorner123',
    storeName: 'Kosher Corner',
    role: 'owner'
  },
  {
    email: 'manager@bkosher.com',
    password: 'bkosher123',
    storeName: 'B Kosher',
    role: 'manager'
  },
  {
    email: 'owner@tapuach.com',
    password: 'tapuach123',
    storeName: 'Tapuach',
    role: 'owner'
  },
  {
    email: 'staff@grodzinski.com',
    password: 'grodzinski123',
    storeName: 'Grodzinski',
    role: 'staff'
  }
];

async function createTestStoreUsers() {
  console.log('🏪 Creating test store users...\n');

  try {
    // Check if database is available
    if (!database.isAvailable()) {
      await database.connect();
      if (!database.isAvailable()) {
        console.error('❌ PostgreSQL database is not available. Please ensure your database is running and configured.');
        process.exit(1);
      }
    }

    // Get all stores to map store names to IDs
    const storesResult = await database.query(`
      SELECT id, name FROM stores WHERE is_active = true ORDER BY name
    `);
    
    const storeMap = {};
    storesResult.rows.forEach(store => {
      storeMap[store.name.toLowerCase()] = store.id;
    });

    console.log('📋 Available stores:');
    Object.entries(storeMap).forEach(([name, id]) => {
      console.log(`   ${id}: ${name}`);
    });
    console.log('');

    let createdCount = 0;
    let skippedCount = 0;

    for (const userData of TEST_STORE_USERS) {
      try {
        // Find store ID by name
        const storeId = storeMap[userData.storeName.toLowerCase()];
        
        if (!storeId) {
          console.log(`⚠️  Store "${userData.storeName}" not found in database. Skipping user creation.`);
          skippedCount++;
          continue;
        }

        // Check if user already exists
        const existingUser = await database.query(
          'SELECT id FROM store_users WHERE email = $1',
          [userData.email]
        );

        if (existingUser.rows.length > 0) {
          console.log(`⏭️  User ${userData.email} already exists. Skipping.`);
          skippedCount++;
          continue;
        }

        // Hash the password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(userData.password, saltRounds);

        // Create the user
        const result = await database.query(`
          INSERT INTO store_users (email, password_hash, store_id, role)
          VALUES ($1, $2, $3, $4)
          RETURNING id, email, role, created_at
        `, [userData.email, passwordHash, storeId, userData.role]);

        const newUser = result.rows[0];
        console.log(`✅ Created user: ${newUser.email} (${newUser.role}) for store ID ${storeId}`);
        createdCount++;

      } catch (error) {
        console.error(`❌ Error creating user ${userData.email}:`, error.message);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Created: ${createdCount} users`);
    console.log(`   Skipped: ${skippedCount} users`);
    console.log(`   Total: ${TEST_STORE_USERS.length} users processed`);

    if (createdCount > 0) {
      console.log(`\n🔐 Test Credentials:`);
      TEST_STORE_USERS.forEach(user => {
        console.log(`   ${user.email} / ${user.password} (${user.role})`);
      });
      
      console.log(`\n🧪 You can now test the Store Portal with these credentials.`);
      console.log(`   Login endpoint: POST /api/portal/login`);
      console.log(`   Example: curl -X POST http://localhost:3000/api/portal/login \\`);
      console.log(`     -H "Content-Type: application/json" \\`);
      console.log(`     -d '{"email":"owner@koshercorner.com","password":"koshercorner123"}'`);
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

async function listExistingUsers() {
  console.log('👥 Existing store users:\n');

  try {
    if (!database.isAvailable()) {
      await database.connect();
    }
    const result = await database.query(`
      SELECT 
        su.id,
        su.email,
        su.role,
        s.name as store_name,
        su.created_at
      FROM store_users su
      JOIN stores s ON su.store_id = s.id
      ORDER BY su.created_at DESC
    `);

    if (result.rows.length === 0) {
      console.log('   No store users found.');
      return;
    }

    result.rows.forEach(user => {
      console.log(`   ${user.email} (${user.role}) - ${user.store_name} - Created: ${user.created_at}`);
    });

  } catch (error) {
    console.error('❌ Error listing users:', error.message);
  }
}

async function deleteTestUsers() {
  console.log('🗑️  Deleting test store users:\n');

  try {
    if (!database.isAvailable()) {
      await database.connect();
    }
    const testEmails = TEST_STORE_USERS.map(user => user.email);
    
    const result = await database.query(`
      DELETE FROM store_users 
      WHERE email = ANY($1)
      RETURNING email
    `, [testEmails]);

    console.log(`✅ Deleted ${result.rows.length} test users:`);
    result.rows.forEach(user => {
      console.log(`   ${user.email}`);
    });

  } catch (error) {
    console.error('❌ Error deleting test users:', error.message);
  }
}

// Main execution
async function main() {
  const command = process.argv[2];

  if (!database.isAvailable()) {
    await database.connect();
  }

  switch (command) {
    case 'create':
      await createTestStoreUsers();
      break;
    case 'list':
      await listExistingUsers();
      break;
    case 'delete':
      await deleteTestUsers();
      break;
    default:
      console.log('🏪 Store Portal Test User Management\n');
      console.log('Usage:');
      console.log('  node scripts/create-test-store-users.js create  - Create test users');
      console.log('  node scripts/create-test-store-users.js list    - List existing users');
      console.log('  node scripts/create-test-store-users.js delete  - Delete test users');
      console.log('');
      console.log('Test users will be created for:');
      TEST_STORE_USERS.forEach(user => {
        console.log(`  ${user.email} (${user.role}) - ${user.storeName}`);
      });
      break;
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  createTestStoreUsers,
  listExistingUsers,
  deleteTestUsers,
  TEST_STORE_USERS
};