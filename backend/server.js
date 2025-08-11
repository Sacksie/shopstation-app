// server.js - Main backend server
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Mock grocery comparison endpoint (we'll add real scraping later)
app.post('/api/compare-groceries', async (req, res) => {
  try {
    const { groceryList } = req.body;
    
    if (!groceryList || !Array.isArray(groceryList) || groceryList.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid grocery list. Please provide an array of grocery items.' 
      });
    }

    console.log(`Processing grocery list: ${groceryList.join(', ')}`);
    
    // Mock results for testing
    const mockResults = [
      {
        name: 'ASDA',
        logo: '🏪',
        rating: 4.0,
        totalPrice: 15.50,
        savings: 0,
        items: groceryList.map(item => ({
          searchTerm: item,
          name: item,
          price: 2.00,
          available: true
        }))
      },
      {
        name: 'Tesco',
        logo: '🛒',
        rating: 4.2,
        totalPrice: 16.75,
        savings: -1.25,
        items: groceryList.map(item => ({
          searchTerm: item,
          name: item,
          price: 2.15,
          available: true
        }))
      }
    ];
    
    res.json({
      success: true,
      totalItems: groceryList.length,
      stores: mockResults,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error processing grocery comparison:', error);
    res.status(500).json({ 
      error: 'Failed to process grocery comparison',
      message: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Grocery comparison server running on port ${PORT}`);
});
