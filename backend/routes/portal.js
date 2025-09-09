const express = require('express');
const router = express.Router();
const dbOps = require('../database/db-operations');
// We will create this middleware in a later step
const { requireStoreAuth, createToken } = require('../middleware/storeAuth'); 
const jwt = require('jsonwebtoken'); // Added for the new login logic

//
// MOCK DATA - This will be replaced with real database calls
//
const MOCK_STORE_ID = 1; // Assuming the logged-in user is for store "Kosher Corner"

const MOCK_DATA = {
  dashboardSummary: {
    storeName: 'Kosher Corner',
    winsTracker: {
      newCustomers: 12,
      reason: 'best price on Challah bread',
      period: 'this week'
    },
    priceIntelligence: {
      cheapestItems: 8,
      mostExpensiveItems: 2,
    },
    demandAnalytics: {
      topSearches: ['chicken soup', 'rugelach', 'kugel'],
      missedOpportunities: ['herring', 'gefilte fish (jar)']
    }
  },
  priceIntelligence: {
      keyItems: [
        { id: 1, name: 'Challah Bread', category: 'Bakery', myPrice: 3.99, competitors: { 'Grodzinski': 4.10, 'B Kosher': 3.95, 'Tapuach': 4.25 } },
        { id: 2, name: 'Organic Almond Milk', category: 'Dairy', myPrice: 2.49, competitors: { 'Grodzinski': 2.49, 'B Kosher': 2.60, 'Tapuach': 2.55 } },
        { id: 3, name: 'Kosher Chicken Breast (1kg)', category: 'Meat', myPrice: 8.99, competitors: { 'Grodzinski': 9.20, 'B Kosher': 8.90, 'Tapuach': 9.10 } },
      ]
  },
  customerDemand: {
      topSearches: [
            { term: 'chicken soup', searches: 120, conversionRate: 0.75 },
            { term: 'rugelach', searches: 95, conversionRate: 0.60 },
      ],
      missedOpportunities: [
            { term: 'herring', searches: 58 },
            { term: 'gefilte fish (jar)', searches: 45 },
      ],
      peakTimes: [
            { day: 'Thursday', hour: '6 PM', activity: 95 },
            { day: 'Friday', hour: '11 AM', activity: 88 },
      ]
  },
  myProducts: [
        { id: 1, name: 'Challah Bread', category: 'Bakery', price: 3.99, stock: 50 },
        { id: 2, name: 'Organic Almond Milk', category: 'Dairy', price: 2.49, stock: 120 },
        { id: 3, name: 'Kosher Chicken Breast (1kg)', category: 'Meat', price: 8.99, stock: 30 },
  ]
};


// 1. Store Owner Authentication
router.post('/login', async (req, res) => {
  const { password } = req.body;

  // Simplified login for demo purposes
  if (password === 'test123') {
    try {
      // For the demo, log in as a specific, known user to get a valid token
      const demoUserEmail = 'owner@koshercorner.com';
      const user = await dbOps.findStoreUserByEmail(demoUserEmail);

      if (user) {
        const token = jwt.sign(
          { userId: user.id, storeId: user.store_id, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: '8h' }
        );
        
        // Omit password hash from user object sent to frontend
        const { password_hash, ...userWithoutPassword } = user;

        res.json({ success: true, token, user: userWithoutPassword });
      } else {
        // This case handles if the demo user hasn't been created yet
        res.status(401).json({ success: false, message: 'Invalid credentials or demo user not found. Please run the user creation script.' });
      }
    } catch (error) {
      console.error('Portal login error:', error);
      res.status(500).json({ success: false, message: 'An internal server error occurred.' });
    }
  } else {
    // Keep the original logic as a fallback, but the primary demo path is the one above.
    const { email } = req.body; // In a real scenario, you'd still have the email.
    if (!email) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    try {
      const user = await dbOps.findStoreUserByEmail(email);
      if (user && await dbOps.verifyUserPassword(password, user.password_hash)) {
        const token = jwt.sign(
          { userId: user.id, storeId: user.store_id, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: '8h' }
        );
        const { password_hash, ...userWithoutPassword } = user;
        res.json({ success: true, token, user: userWithoutPassword });
      } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
    } catch (error) {
      console.error('Portal login error:', error);
      res.status(500).json({ success: false, message: 'An internal server error occurred' });
    }
  }
});


// PROTECTED ROUTES (requireStoreAuth middleware will be added)

// 2. Dashboard Summary
router.get('/dashboard-summary', requireStoreAuth, async (req, res) => {
    try {
        const storeId = req.user.storeId;
        const summary = await dbOps.getDashboardSummary(storeId);
        res.json({ success: true, data: summary });
    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch dashboard summary.' });
    }
});

// 3. Price Intelligence
router.get('/price-intelligence', requireStoreAuth, async (req, res) => {
  try {
    const storeId = req.user.storeId;
    const report = await dbOps.getCompetitivePriceReport(storeId);
    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Error fetching price intelligence report:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch price intelligence data.' });
  }
});

// 4. Customer Demand
router.get('/customer-demand', requireStoreAuth, async (req, res) => {
  try {
    const storeId = req.user.storeId;
    const report = await dbOps.getCustomerDemandReport(storeId);
    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Error fetching customer demand report:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch customer demand data.' });
  }
});

// 5. My Products List
router.get('/my-products', requireStoreAuth, async (req, res) => {
  try {
    // The user's store_id is attached to the request by the requireStoreAuth middleware
    const storeId = req.user.storeId;
    const products = await dbOps.getProductsByStore(storeId);
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Error fetching products for store:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch products.' });
  }
});

// 6. Update Product Price
router.put('/my-products/:productId', requireStoreAuth, async (req, res) => {
  try {
    const storeId = req.user.storeId;
    const { productId } = req.params;
    const { price } = req.body;

    // Validate product ID
    if (!productId || isNaN(parseInt(productId))) {
        return res.status(400).json({ success: false, error: 'Valid product ID is required.' });
    }

    // Validate price
    if (price === undefined || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
        return res.status(400).json({ success: false, error: 'Valid price is required.' });
    }

    const result = await dbOps.updateStoreProductPrice(storeId, productId, price);

    res.json(result);
    
  } catch (error) {
    console.error('Failed to update product price:', error);
    res.status(500).json({ success: false, error: 'Failed to update product price.' });
  }
});


module.exports = router;
