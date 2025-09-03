const express = require('express');
const router = express.Router();
const db = require('../database/kosher-db');
const { matchGroceryList, recordUserFeedback } = require('../utils/enhancedFuzzyMatch');
const analytics = require('../utils/analytics');

router.post('/compare-groceries', async (req, res) => {
  try {
    const { groceryList } = req.body;
    
    console.log('Received grocery list:', groceryList);
    
    if (!groceryList || !Array.isArray(groceryList)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a grocery list as an array'
      });
    }

    // Get all products and stores
    const products = db.getAllProducts();
    const stores = db.getStores();
    
    console.log('Products in database:', Object.keys(products).length);
    console.log('Stores:', Object.keys(stores));
    
    // If no products in database, return a helpful message
    if (Object.keys(products).length === 0) {
      // Still log the search attempt for analytics
      try {
        analytics.logSearch({
          items: groceryList,
          matchedItems: 0,
          unmatchedItems: groceryList,
          storesCompared: Object.keys(stores).length,
          savings: 0,
          cheapestStore: null,
          mostExpensiveStore: null
        });
      } catch (analyticsError) {
        console.error('Analytics logging failed:', analyticsError);
      }
      
      return res.json({
        success: true,
        stores: Object.keys(stores).map(storeName => ({
          name: storeName,
          ...stores[storeName],
          totalPrice: 0,
          items: [],
          missingItems: groceryList,
          availability: 0
        })),
        totalItems: groceryList.length,
        matchedItems: 0,
        unmatchedItems: groceryList,
        message: 'No prices in database yet. Please add prices via admin panel.',
        timestamp: new Date().toISOString()
      });
    }
    
    // Match items using enhanced fuzzy matching
    const matchResults = matchGroceryList(groceryList);
    
    console.log('Enhanced match results:', {
      matched: matchResults.matched.length,
      unmatched: matchResults.unmatched.length,
      methods: matchResults.matched.reduce((acc, m) => {
        acc[m.method] = (acc[m.method] || 0) + 1;
        return acc;
      }, {})
    });
    
    console.log('Match results:', matchResults);
    
    // Calculate prices for each store
    const storeResults = [];
    
    for (const [storeName, storeInfo] of Object.entries(stores)) {
      let totalPrice = 0;
      const items = [];
      const missingItems = [];
      
      for (const matchedItem of matchResults.matched) {
        const product = products[matchedItem.matched];
        
        if (product && product.prices && product.prices[storeName]) {
          const priceInfo = product.prices[storeName];
          items.push({
            name: matchedItem.original,
            matchedName: product.displayName,
            price: priceInfo.price,
            unit: priceInfo.unit
          });
          totalPrice += priceInfo.price;
        } else {
          missingItems.push(matchedItem.original);
        }
      }
      
      // Add unmatched items to missing items
      matchResults.unmatched.forEach(item => {
        missingItems.push(item);
      });
      
      storeResults.push({
        name: storeName,
        ...storeInfo,
        totalPrice: totalPrice,
        items: items,
        missingItems: missingItems,
        availability: groceryList.length > 0 ? items.length / groceryList.length : 0
      });
    }
    
    // Sort by total price (cheapest first)
    storeResults.sort((a, b) => {
      // If both have no items, sort alphabetically
      if (a.totalPrice === 0 && b.totalPrice === 0) {
        return a.name.localeCompare(b.name);
      }
      // Stores with items come first
      if (a.totalPrice === 0) return 1;
      if (b.totalPrice === 0) return -1;
      // Sort by price
      return a.totalPrice - b.totalPrice;
    });
    
    // Calculate savings for analytics
    const validStores = storeResults.filter(store => store.totalPrice > 0);
    let savings = 0;
    let cheapestStore = null;
    let mostExpensiveStore = null;
    
    if (validStores.length >= 2) {
      const prices = validStores.map(store => store.totalPrice).sort((a, b) => a - b);
      savings = prices[prices.length - 1] - prices[0];
      cheapestStore = validStores.find(store => store.totalPrice === prices[0]).name;
      mostExpensiveStore = validStores.find(store => store.totalPrice === prices[prices.length - 1]).name;
    }

    // Log search analytics
    try {
      analytics.logSearch({
        items: groceryList,
        matchedItems: matchResults.matched.length,
        unmatchedItems: matchResults.unmatched,
        storesCompared: storeResults.length,
        savings,
        cheapestStore,
        mostExpensiveStore
      });
    } catch (analyticsError) {
      console.error('Analytics logging failed:', analyticsError);
    }

    res.json({
      success: true,
      stores: storeResults,
      totalItems: groceryList.length,
      matchedItems: matchResults.matched.length,
      unmatchedItems: matchResults.unmatched,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error comparing groceries:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to compare groceries'
    });
  }
});

// Track shop selection (when user clicks to expand a store)
router.post('/track-shop-selection', (req, res) => {
  try {
    const { shopName, totalPrice, itemsAvailable } = req.body;
    
    analytics.logShopSelection({
      shopName,
      totalPrice: totalPrice || 0,
      itemsAvailable: itemsAvailable || 0
    });
    
    res.json({ success: true, message: 'Shop selection tracked' });
  } catch (error) {
    console.error('Error tracking shop selection:', error);
    res.status(500).json({ success: false, error: 'Failed to track selection' });
  }
});

// Get analytics data (protected endpoint)
router.get('/analytics', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const summary = analytics.getAnalyticsSummary(days);
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to get analytics' });
  }
});

// User feedback for match corrections
router.post('/feedback-match', (req, res) => {
  try {
    const { originalQuery, suggestedMatch, userCorrection, wasAccepted } = req.body;
    
    if (!originalQuery) {
      return res.status(400).json({ success: false, error: 'Original query is required' });
    }
    
    const feedback = recordUserFeedback(originalQuery, suggestedMatch, userCorrection, wasAccepted);
    
    res.json({ 
      success: true, 
      message: 'Feedback recorded successfully',
      feedback: feedback
    });
  } catch (error) {
    console.error('Error recording match feedback:', error);
    res.status(500).json({ success: false, error: 'Failed to record feedback' });
  }
});

// Get last updated timestamp for main page
router.get('/last-updated', (req, res) => {
  try {
    const products = db.getAllProducts();
    let lastUpdated = null;
    
    // Find the most recent price update
    Object.values(products).forEach(product => {
      if (product.prices) {
        Object.values(product.prices).forEach(priceInfo => {
          if (priceInfo.lastUpdated) {
            const updated = new Date(priceInfo.lastUpdated);
            if (!lastUpdated || updated > lastUpdated) {
              lastUpdated = updated;
            }
          }
        });
      }
    });
    
    res.json({ 
      success: true, 
      lastUpdated: lastUpdated ? lastUpdated.toISOString() : null 
    });
  } catch (error) {
    console.error('Error getting last updated:', error);
    res.status(500).json({ success: false, error: 'Failed to get last updated' });
  }
});

// Get all products (public endpoint for shopping list analyzer)
router.get('/products', (req, res) => {
  try {
    const products = db.getAllProducts();
    const stores = db.getStores();
    
    res.json({
      success: true,
      products,
      stores,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
});

module.exports = router;
