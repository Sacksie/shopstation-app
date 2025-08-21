const stringSimilarity = require('string-similarity');
const db = require('../database/kosher-db');

// Normalize text for comparison
const normalize = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove special characters
    .replace(/\s+/g, '');       // Remove spaces
};

// Common product variations
const commonVariations = {
  'milk': ['mlk', 'milk2pt', 'milk2pint', 'milkpint'],
  'bread': ['brd', 'loaf'],
  'challah': ['challa', 'chalah', 'halla', 'challahbread'],
  'eggs': ['egg', 'egss', 'dozen eggs'],
  'chicken': ['chkn', 'chickn', 'whole chicken'],
  'chicken_breast': ['chicken breast', 'chkn brst', 'breast'],
  'grape_juice': ['grape juice', 'grp juice', 'kedem'],
  'butter': ['bttr', 'butr'],
  'cheese': ['ches', 'chse', 'cheddar'],
  'beef': ['ground beef', 'mince', 'minced beef'],
  'wine': ['kiddush wine', 'kidush wine'],
  'potatoes': ['potato', 'potatos', 'spuds'],
  'tomatoes': ['tomato', 'tomatos'],
  'onions': ['onion', 'onyons']
};

// Find best matching product
const findBestMatch = (query) => {
  const database = db.readDB();
  const products = database.products;
  const aliases = database.aliases;
  
  // Normalize query
  const normalizedQuery = normalize(query);
  
  // Check aliases first
  if (aliases[query.toLowerCase()]) {
    return aliases[query.toLowerCase()];
  }
  
  // Check exact match
  if (products[query.toLowerCase()]) {
    return query.toLowerCase();
  }
  
  // Check common variations
  for (const [product, variations] of Object.entries(commonVariations)) {
    if (variations.some(v => normalize(v) === normalizedQuery)) {
      return product;
    }
  }
  
  // Use string similarity for fuzzy matching
  const productNames = Object.keys(products);
  const similarities = productNames.map(name => ({
    name: name,
    similarity: stringSimilarity.compareTwoStrings(normalizedQuery, normalize(name))
  }));
  
  // Sort by similarity
  similarities.sort((a, b) => b.similarity - a.similarity);
  
  // Return best match if similarity is above threshold
  if (similarities[0] && similarities[0].similarity > 0.6) {
    return similarities[0].name;
  }
  
  // Try partial matching
  for (const productName of productNames) {
    if (normalize(productName).includes(normalizedQuery) || 
        normalizedQuery.includes(normalize(productName))) {
      return productName;
    }
  }
  
  return null;
};

// Process a list of items and find matches
const matchGroceryList = (items) => {
  const results = {
    matched: [],
    unmatched: []
  };
  
  for (const item of items) {
    const match = findBestMatch(item);
    if (match) {
      results.matched.push({
        original: item,
        matched: match
      });
    } else {
      results.unmatched.push(item);
    }
  }
  
  return results;
};

module.exports = {
  findBestMatch,
  matchGroceryList,
  normalize
};
