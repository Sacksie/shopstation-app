const express = require('express');
const router = express.Router();
const db = require('../database/kosher-db');

// Quick entry for when you're in the shop
router.post('/quick-add', (req, res) => {
  const { store, product, price, unit, category } = req.body;
  
  db.addPrice(store, product, price, unit, category);
  
  res.json({ 
    success: true, 
    message: `Added ${product} at ${store} for £${price}`
  });
});

// Bulk entry for multiple items
router.post('/bulk-add', (req, res) => {
  const { store, items } = req.body;
  
  items.forEach(item => {
    db.addPrice(store, item.product, item.price, item.unit, item.category);
  });
  
  res.json({ 
    success: true, 
    message: `Added ${items.length} prices for ${store}`
  });
});

module.exports = router;
