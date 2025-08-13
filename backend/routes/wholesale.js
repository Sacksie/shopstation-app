const express = require('express');
const router = express.Router();

// Markup multipliers based on store type
const MARKUP_MULTIPLIERS = {
  'Tesco': 1.35,       // Standard markup
  'Sainsburys': 1.38,  // Slightly premium
  'ASDA': 1.30,        // Value positioning
  'Aldi': 1.20,        // Discount markup
  'Lidl': 1.20,        // Discount markup
  'Waitrose': 1.45,    // Premium markup
  'Co-op': 1.42        // Convenience premium
};

// Key indicator products with wholesale base prices
// These are rough UK wholesale prices as of late 2024
const INDICATOR_PRODUCTS = {
  // Dairy
  'milk_2_pints': { wholesale: 1.10, unit: '2 pints', category: 'dairy', 
name: 'Semi-Skimmed Milk' },
  'butter_250g': { wholesale: 1.85, unit: '250g', category: 'dairy', name: 
'Butter' },
  'eggs_6': { wholesale: 1.20, unit: '6 large', category: 'dairy', name: 
'Free Range Eggs' },
  
  // Bread & Bakery
  'bread_white': { wholesale: 0.65, unit: '800g loaf', category: 'bakery', 
name: 'White Bread' },
  'bread_wholemeal': { wholesale: 0.70, unit: '800g loaf', category: 
'bakery', name: 'Wholemeal Bread' },
  
  // Meat
  'chicken_breast': { wholesale: 4.50, unit: 'per kg', category: 'meat', 
name: 'Chicken Breast' },
  'beef_mince': { wholesale: 3.80, unit: '500g', category: 'meat', name: 
'Beef Mince' },
  
  // Student Essentials
  'pasta_500g': { wholesale: 0.55, unit: '500g', category: 'pantry', name: 
'Penne Pasta' },
  'rice_1kg': { wholesale: 1.20, unit: '1kg', category: 'pantry', name: 
'Long Grain Rice' },
  'baked_beans': { wholesale: 0.45, unit: '415g tin', category: 'pantry', 
name: 'Baked Beans' },
  'instant_noodles': { wholesale: 0.35, unit: 'pack', category: 'pantry', 
name: 'Instant Noodles' },
  
  // Fruit & Veg
  'bananas': { wholesale: 0.90, unit: 'per kg', category: 'produce', name: 
'Bananas' },
  'potatoes': { wholesale: 0.80, unit: '2.5kg', category: 'produce', name: 
'White Potatoes' },
  'onions': { wholesale: 0.85, unit: 'per kg', category: 'produce', name: 
'Brown Onions' },
  
  // Student Favorites
  'pizza_frozen': { wholesale: 1.80, unit: 'each', category: 'frozen', 
name: 'Frozen Pizza' },
  'beer_4pack': { wholesale: 3.20, unit: '4x440ml', category: 'alcohol', 
name: 'Lager 4-Pack' },
  'crisps_multipack': { wholesale: 1.35, unit: '6 pack', category: 
'snacks', name: 'Crisps Multipack' }
};

// Get estimated prices for all stores
router.get('/estimates', (req, res) => {
  const estimates = {};
  
  Object.keys(MARKUP_MULTIPLIERS).forEach(store => {
    estimates[store] = {
      items: {},
      totalSample: 0,
      confidence: 'estimated',
      lastUpdated: new Date()
    };
    
    Object.entries(INDICATOR_PRODUCTS).forEach(([key, data]) => {
      const estimatedPrice = (data.wholesale * 
MARKUP_MULTIPLIERS[store]).toFixed(2);
      estimates[store].items[key] = {
        name: data.name,
        price: parseFloat(estimatedPrice),
        unit: data.unit,
        category: data.category,
        confidence: 'wholesale_estimate'
      };
      estimates[store].totalSample += parseFloat(estimatedPrice);
    });
    
    estimates[store].totalSample = 
estimates[store].totalSample.toFixed(2);
  });
  
  res.json({
    success: true,
    estimates: estimates,
    productCount: Object.keys(INDICATOR_PRODUCTS).length,
    disclaimer: 'Prices are estimates based on typical retail markups'
  });
});

// Get estimate for specific items
router.post('/estimate-list', (req, res) => {
  const { items } = req.body; // Array of item names
  const results = {};
  
  Object.keys(MARKUP_MULTIPLIERS).forEach(store => {
    results[store] = {
      items: [],
      estimatedTotal: 0
    };
    
    items.forEach(itemName => {
      // Try to match item to our indicator products
      const match = findBestMatch(itemName);
      if (match) {
        const price = (match.wholesale * 
MARKUP_MULTIPLIERS[store]).toFixed(2);
        results[store].items.push({
          requested: itemName,
          matched: match.name,
          price: parseFloat(price),
          unit: match.unit,
          confidence: match.exact ? 'high' : 'medium'
        });
        results[store].estimatedTotal += parseFloat(price);
      } else {
        results[store].items.push({
          requested: itemName,
          matched: null,
          price: null,
          confidence: 'no_match'
        });
      }
    });
    
    results[store].estimatedTotal = 
results[store].estimatedTotal.toFixed(2);
  });
  
  res.json({
    success: true,
    results: results
  });
});

// Helper function to match user input to our products
function findBestMatch(itemName) {
  const searchTerm = itemName.toLowerCase();
  
  // First try exact match
  for (const [key, product] of Object.entries(INDICATOR_PRODUCTS)) {
    if (product.name.toLowerCase() === searchTerm) {
      return { ...product, exact: true };
    }
  }
  
  // Then try partial match
  for (const [key, product] of Object.entries(INDICATOR_PRODUCTS)) {
    if (product.name.toLowerCase().includes(searchTerm) || 
        searchTerm.includes(product.name.toLowerCase()) ||
        key.includes(searchTerm.replace(/\s+/g, '_'))) {
      return { ...product, exact: false };
    }
  }
  
  // Special cases for common alternatives
  const commonMappings = {
    'milk': 'milk_2_pints',
    'eggs': 'eggs_6',
    'bread': 'bread_white',
    'chicken': 'chicken_breast',
    'pasta': 'pasta_500g',
    'rice': 'rice_1kg',
    'beer': 'beer_4pack',
    'pizza': 'pizza_frozen',
    'noodles': 'instant_noodles',
    'crisps': 'crisps_multipack',
    'chips': 'crisps_multipack',
    'beans': 'baked_beans'
  };
  
  if (commonMappings[searchTerm]) {
    return { ...INDICATOR_PRODUCTS[commonMappings[searchTerm]], exact: 
false };
  }
  
  return null;
}

module.exports = router;
