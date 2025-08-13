require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

// Import routes
const receiptRoutes = require('./routes/receipts');
const wholesaleRoutes = require('./routes/wholesale');
const db = require('./database/kosher-db');
const manualEntryRoutes = require('./routes/manual-entry');

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images

// Use routes
app.use('/api/receipts', receiptRoutes);
app.use('/api/wholesale', wholesaleRoutes);
app.use('/api/manual', manualEntryRoutes);

// Main grocery comparison endpoint using database
app.post('/api/compare-groceries', (req, res) => {
  const { groceryList } = req.body;
  
  // Use database for comparison
  const comparison = db.compareShops(groceryList);
  
  // Format for frontend
  const stores = Object.entries(comparison).map(([storeName, data], index) => ({
    name: storeName,
    logo: storeName === 'B Kosher' ? '🕍' : 
          storeName === 'Tapuach' ? '🍎' :
          storeName === 'Kosher Kingdom' ? '👑' : '🛒',
    rating: 4.0 + Math.random() * 0.5,
    totalPrice: data.total,
    items: data.available,
    missing: data.missing
  }));
  
  // Sort by price
  stores.sort((a, b) => a.totalPrice - b.totalPrice);
  
  res.json({
    success: true,
    totalItems: groceryList.length,
    stores: stores
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
