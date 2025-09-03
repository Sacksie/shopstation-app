const express = require('express');
const router = express.Router();
const dbOps = require('../database/db-operations');
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

    // Validate and sanitize each grocery item
    if (groceryList.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Grocery list cannot be empty'
      });
    }

    if (groceryList.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Grocery list cannot exceed 100 items'
      });
    }

    // Sanitize and validate each item
    const sanitizedList = groceryList
      .filter(item => item !== null && item !== undefined)
      .map(item => {
        if (typeof item === 'string') {
          // Trim whitespace and limit length
          return item.trim().substring(0, 200);
        }
        return String(item).trim().substring(0, 200);
      })
      .filter(item => item.length > 0); // Remove empty items

    if (sanitizedList.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid items found in grocery list'
      });
    }

    // Get all products and stores from the new database layer
    const stores = await dbOps.getStores();
    const products = await dbOps.getProducts();
    
    console.log('Products in database:', products.length);
    console.log('Stores:', stores.length);
    
    // If no products in database, return a helpful message
    if (products.length === 0) {
      // Still log the search attempt for analytics
      try {
        analytics.logSearch({
          items: sanitizedList,
          matchedItems: 0,
          unmatchedItems: sanitizedList,
          storesCompared: stores.length,
          savings: 0,
          cheapestStore: null,
          mostExpensiveStore: null
        });
      } catch (analyticsError) {
        console.error('Analytics logging failed:', analyticsError);
      }
      
      return res.json({
        success: true,
        stores: stores.map(store => ({
          name: store.name,
          location: store.location,
          phone: store.phone,
          hours: store.hours,
          rating: store.rating,
          totalPrice: 0,
          items: [],
          missingItems: sanitizedList,
          availability: 0
        })),
        totalItems: sanitizedList.length,
        matchedItems: 0,
        unmatchedItems: sanitizedList,
        message: 'No prices in database yet. Please add prices via admin panel.',
        timestamp: new Date().toISOString()
      });
    }
    
    // Enhanced search for each grocery item
    const searchResults = [];
    const unmatchedItems = [];

    for (const item of sanitizedList) {
      const matches = await dbOps.searchProducts(item);
      if (matches.length > 0) {
        // Take the best match for now
        searchResults.push({
          original: item,
          matched: matches[0]
        });
      } else {
        unmatchedItems.push(item);
      }
    }
    
    console.log('Search results:', {
      matched: searchResults.length,
      unmatched: unmatchedItems.length
    });
    
    // Calculate prices for each store
    const storeResults = [];
    
    for (const store of stores) {
      let totalPrice = 0;
      const items = [];
      const missingItems = [];
      
      for (const searchResult of searchResults) {
        const product = searchResult.matched;
        
        // Find price for this store
        const storePricing = product.prices?.find(p => 
          p.store_name === store.name && p.in_stock !== false
        );
        
        if (storePricing) {
          items.push({
            name: searchResult.original,
            matchedName: product.name,
            price: storePricing.price,
            unit: storePricing.unit
          });
          totalPrice += storePricing.price;
        } else {
          missingItems.push(searchResult.original);
        }
      }
      
      // Add unmatched items to missing items
      unmatchedItems.forEach(item => {
        missingItems.push(item);
      });
      
      storeResults.push({
        name: store.name,
        location: store.location,
        phone: store.phone,
        hours: store.hours,
        rating: store.rating,
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
        matchedItems: searchResults.length,
        unmatchedItems: unmatchedItems,
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
      matchedItems: searchResults.length,
      unmatchedItems: unmatchedItems,
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

// New endpoint for product requests
router.post('/request-product', async (req, res) => {
  try {
    const { productName, userName, userEmail, categorySuggestion, description } = req.body;
    
    if (!productName || productName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Product name is required'
      });
    }

    const result = await dbOps.addProductRequest({
      productName: productName.trim(),
      userName: userName?.trim() || null,
      userEmail: userEmail?.trim() || null,
      categorySuggestion: categorySuggestion?.trim() || null,
      description: description?.trim() || null
    });

    console.log(`📝 New product request: "${productName}" from ${userName || userEmail || 'anonymous user'}`);

    res.json({
      success: true,
      message: 'Product request submitted successfully! We\'ll add it soon.',
      requestId: result.requestId,
      timestamp: result.createdAt || new Date().toISOString()
    });

  } catch (error) {
    console.error('Error submitting product request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit product request. Please try again.'
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
router.get('/last-updated', async (req, res) => {
  try {
    const products = await dbOps.getProducts();
    let lastUpdated = null;
    
    // Find the most recent price update
    products.forEach(product => {
      if (product.prices) {
        product.prices.forEach(priceInfo => {
          if (priceInfo.last_updated) {
            const updated = new Date(priceInfo.last_updated);
            if (!lastUpdated || updated > lastUpdated) {
              lastUpdated = updated;
            }
          }
        });
      }
    });
    
    res.json({ 
      success: true, 
      lastUpdated: lastUpdated ? lastUpdated.toISOString() : null,
      databaseType: dbOps.getDatabaseType()
    });
  } catch (error) {
    console.error('Error getting last updated:', error);
    res.status(500).json({ success: false, error: 'Failed to get last updated' });
  }
});

// Get all products (public endpoint for shopping list analyzer)
router.get('/products', async (req, res) => {
  try {
    const products = await dbOps.getProducts();
    const stores = await dbOps.getStores();
    
    res.json({
      success: true,
      products,
      stores,
      databaseType: dbOps.getDatabaseType(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
});

module.exports = router;