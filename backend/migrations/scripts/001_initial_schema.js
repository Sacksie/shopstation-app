/**
 * Migration: Initial Database Schema
 * Version: 001
 * Created: 2025-09-03
 * 
 * BUSINESS IMPACT: Establishes baseline schema for price comparison system
 */

/**
 * Apply this migration - establish initial schema
 * @param {Object} database - Current database state
 * @returns {Object} - Updated database state
 */
async function up(database) {
  console.log('Applying migration: Initial Schema Setup');
  
  // Ensure core data structures exist
  const migratedDatabase = {
    ...database,
    products: database.products || {},
    aliases: database.aliases || {},
    metadata: {
      schemaVersion: 1,
      lastUpdated: new Date().toISOString(),
      totalProducts: Object.keys(database.products || {}).length,
      stores: []
    }
  };

  // Extract unique store names for metadata
  const storeSet = new Set();
  Object.values(migratedDatabase.products).forEach(product => {
    if (product.prices) {
      Object.keys(product.prices).forEach(store => storeSet.add(store));
    }
  });
  migratedDatabase.metadata.stores = Array.from(storeSet);

  console.log(`✅ Initial schema established with ${migratedDatabase.metadata.totalProducts} products across ${migratedDatabase.metadata.stores.length} stores`);
  
  return migratedDatabase;
}

/**
 * Rollback this migration - remove schema metadata
 * @param {Object} database - Current database state  
 * @returns {Object} - Rolled back database state
 */
async function down(database) {
  console.log('Rolling back migration: Initial Schema Setup');
  
  // Remove metadata added by this migration
  const { metadata, ...rolledBackDatabase } = database;
  
  console.log('✅ Schema metadata removed');
  
  return rolledBackDatabase;
}

module.exports = { up, down };