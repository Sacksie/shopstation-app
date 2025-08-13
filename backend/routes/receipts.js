const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// Store extracted prices (use database later)
let priceDatabase = {};

router.post('/upload', async (req, res) => {
  try {
    const { image, userStore, userDate } = req.body;
    
    // Call Taggun API
    const taggunResponse = await 
fetch('https://api.taggun.io/v1/receipt/v1/simple', {
      method: 'POST',
      headers: {
        'Authorization': 'e3f1c6c4ac914f68ac232f6e4c76b35c',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        base64Image: image,
        refresh: false,
        incognito: false
      })
    });
    
    const receiptData = await taggunResponse.json();
    
    // Extract store name and items
    const store = receiptData.merchantName || userStore;
    const items = receiptData.lineItems || [];
    
    // Process each item
    items.forEach(item => {
      const productName = item.description;
      const price = item.amount;
      
      if (!priceDatabase[productName]) {
        priceDatabase[productName] = {};
      }
      
      priceDatabase[productName][store] = {
        price: price,
        date: new Date(),
        source: 'receipt'
      };
    });
    
    res.json({
      success: true,
      store: store,
      itemsExtracted: items.length,
      data: items
    });
    
  } catch (error) {
    console.error('Receipt processing error:', error);
    res.status(500).json({ error: 'Failed to process receipt' });
  }
});

module.exports = router;
