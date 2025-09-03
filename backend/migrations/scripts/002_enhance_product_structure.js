/**
 * Migration: Enhanced Product Structure
 * Version: 002
 * Created: 2025-09-03
 * 
 * BUSINESS IMPACT: Adds category, kosher status, and nutrition data fields
 * to support advanced filtering and better customer experience
 */

/**
 * Apply this migration - enhance product data structure
 * @param {Object} database - Current database state
 * @returns {Object} - Updated database state
 */
async function up(database) {
  console.log('Applying migration: Enhanced Product Structure');
  
  const enhancedProducts = {};
  let enhancedCount = 0;

  // Enhance each product with new fields
  Object.entries(database.products || {}).forEach(([key, product]) => {
    enhancedProducts[key] = {
      ...product,
      category: product.category || this.inferCategory(product.name),
      kosherStatus: product.kosherStatus || 'certified', // Default for kosher stores
      nutritionData: product.nutritionData || {},
      tags: product.tags || [],
      lastPriceUpdate: product.lastPriceUpdate || new Date().toISOString()
    };
    enhancedCount++;
  });

  const migratedDatabase = {
    ...database,
    products: enhancedProducts,
    metadata: {
      ...database.metadata,
      schemaVersion: 2,
      lastUpdated: new Date().toISOString(),
      enhancements: {
        categoriesAdded: true,
        kosherStatusAdded: true,
        nutritionDataAdded: true,
        tagsAdded: true,
        lastPriceUpdateAdded: true
      }
    }
  };

  console.log(`✅ Enhanced ${enhancedCount} products with category, kosher status, and nutrition fields`);
  
  return migratedDatabase;
}

/**
 * Helper function to infer category from product name
 */
function inferCategory(productName) {
  if (!productName) return 'general';
  
  const name = productName.toLowerCase();
  
  if (name.includes('milk') || name.includes('cheese') || name.includes('yogurt') || name.includes('butter')) {
    return 'dairy';
  }
  if (name.includes('bread') || name.includes('challah') || name.includes('bagel')) {
    return 'bakery';
  }
  if (name.includes('chicken') || name.includes('beef') || name.includes('meat') || name.includes('fish')) {
    return 'meat';
  }
  if (name.includes('apple') || name.includes('banana') || name.includes('orange') || name.includes('fruit')) {
    return 'produce';
  }
  if (name.includes('pasta') || name.includes('rice') || name.includes('cereal') || name.includes('flour')) {
    return 'pantry';
  }
  
  return 'general';
}

/**
 * Rollback this migration - remove enhanced fields
 * @param {Object} database - Current database state  
 * @returns {Object} - Rolled back database state
 */
async function down(database) {
  console.log('Rolling back migration: Enhanced Product Structure');
  
  const simplifiedProducts = {};
  let simplifiedCount = 0;

  // Remove enhanced fields from each product
  Object.entries(database.products || {}).forEach(([key, product]) => {
    const { category, kosherStatus, nutritionData, tags, lastPriceUpdate, ...coreProduct } = product;
    simplifiedProducts[key] = coreProduct;
    simplifiedCount++;
  });

  const rolledBackDatabase = {
    ...database,
    products: simplifiedProducts,
    metadata: {
      ...database.metadata,
      schemaVersion: 1,
      lastUpdated: new Date().toISOString()
    }
  };

  // Remove enhancement metadata
  if (rolledBackDatabase.metadata.enhancements) {
    delete rolledBackDatabase.metadata.enhancements;
  }

  console.log(`✅ Removed enhanced fields from ${simplifiedCount} products`);
  
  return rolledBackDatabase;
}

module.exports = { up, down };