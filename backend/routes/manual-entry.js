const express = require('express');
const router = express.Router();
const dbOps = require('../database/db-operations');
const adminAuth = require('../middleware/adminAuth');
const backupManager = require('../utils/backupManager');

// Add single price (for admin panel)
router.post('/add-price', adminAuth, async (req, res) => {
  try {
    const { store, productName, price, unit } = req.body;
    
    if (!store || !productName || !price || !unit) {
      return res.status(400).json({
        success: false,
        error: 'Please provide store, productName, price, and unit'
      });
    }
    
    const productSlug = productName.toLowerCase().replace(/\s+/g, '-');
    let result;
    
    try {
      result = await dbOps.updateProductPrice(productSlug, store, { 
        price: parseFloat(price), 
        unit, 
        updatedBy: 'admin' 
      });
    } catch (error) {
      // Product might not exist, try to add it first
      try {
        await dbOps.addProduct({ name: productName, slug: productSlug });
        result = await dbOps.updateProductPrice(productSlug, store, { 
          price: parseFloat(price), 
          unit, 
          updatedBy: 'admin' 
        });
      } catch (addError) {
        result = { success: false };
      }
    }
    
    res.json({
      success: result.success,
      message: result.success ? `Price added: ${productName} - £${price} (${unit}) at ${store}` : 'Failed to add price'
    });
    
  } catch (error) {
    console.error('Error adding price:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add price'
    });
  }
});

// Quick add single product
router.post('/quick', adminAuth, async (req, res) => {
  try {
    const { store, products } = req.body;
    
    if (!store || !products || !Array.isArray(products)) {
      return res.status(400).json({
        error: 'Please provide store name and products array'
      });
    }
    
    // Create backup before bulk add (if more than 3 products)
    if (products.length > 3) {
      console.log(`📋 Creating backup before adding ${products.length} products`);
      const backup = backupManager.autoBackupBeforeBulk(`quick-add-${products.length}-products`);
      if (!backup.success) {
        console.warn('⚠️ Backup failed but continuing with operation');
      }
    }
    
    const stores = await dbOps.getStores();
    const storeExists = stores.find(s => s.name === store || s.slug === store);
    if (!storeExists) {
      return res.status(400).json({
        error: `Store "${store}" not found`
      });
    }
    
    const results = [];
    for (const product of products) {
      const { name, displayName, price, unit } = product;
      
      if (!name || !price || !unit) {
        results.push({
          name: name,
          success: false,
          error: 'Missing required fields'
        });
        continue;
      }
      
      // First ensure product exists
      const productSlug = (displayName || name).toLowerCase().replace(/\s+/g, '-');
      let success = false;
      try {
        const result = await dbOps.updateProductPrice(productSlug, store, { price, unit, updatedBy: 'admin' });
        success = result.success;
      } catch (error) {
        // Product might not exist, try to add it first
        try {
          await dbOps.addProduct({ name: displayName || name, slug: productSlug });
          const result = await dbOps.updateProductPrice(productSlug, store, { price, unit, updatedBy: 'admin' });
          success = result.success;
        } catch (addError) {
          success = false;
        }
      }
      
      results.push({
        name: name,
        success: success || false
      });
    }
    
    res.json({
      success: true,
      message: `Added ${results.filter(r => r.success).length} products`,
      results: results
    });
    
  } catch (error) {
    console.error('Error adding products:', error);
    res.status(500).json({
      error: 'Failed to add products'
    });
  }
});

// Bulk import
router.post('/bulk', adminAuth, async (req, res) => {
  try {
    const { store, csvData } = req.body;
    
    if (!store || !csvData) {
      return res.status(400).json({
        error: 'Please provide store name and CSV data'
      });
    }
    
    // Create backup before bulk operation
    console.log('📋 Creating backup before bulk CSV import');
    const backup = backupManager.autoBackupBeforeBulk(`csv-import-${store.replace(/\s+/g, '-').toLowerCase()}`);
    if (!backup.success) {
      console.warn('⚠️ Backup failed but continuing with bulk import');
    }
    
    // Parse CSV (format: product,price,unit)
    const lines = csvData.split('\n').filter(line => line.trim());
    const results = [];
    
    for (const line of lines) {
      const [product, price, unit] = line.split(',').map(s => s.trim());
      
      if (product && price && unit) {
        const productSlug = product.toLowerCase().replace(/\s+/g, '-');
        let success = false;
        try {
          const result = await dbOps.updateProductPrice(productSlug, store, { price: parseFloat(price), unit, updatedBy: 'admin' });
          success = result.success;
        } catch (error) {
          // Product might not exist, try to add it first
          try {
            await dbOps.addProduct({ name: product, slug: productSlug });
            const result = await dbOps.updateProductPrice(productSlug, store, { price: parseFloat(price), unit, updatedBy: 'admin' });
            success = result.success;
          } catch (addError) {
            success = false;
          }
        }
        results.push({
          product,
          success
        });
      }
    }
    
    res.json({
      success: true,
      message: `Imported ${results.filter(r => r.success).length} products`,
      results
    });
    
  } catch (error) {
    console.error('Error bulk importing:', error);
    res.status(500).json({
      error: 'Failed to bulk import'
    });
  }
});

// Get all products (for admin view)
router.get('/products', adminAuth, async (req, res) => {
  try {
    const products = await dbOps.getProducts();
    const stores = await dbOps.getStores();
    
    res.json({
      success: true,
      products,
      stores
    });
    
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      error: 'Failed to fetch products'
    });
  }
});

// Get inventory data (for admin panel)
router.get('/inventory', adminAuth, async (req, res) => {
  try {
    const products = await dbOps.getProducts();
    const stores = await dbOps.getStores();
    
    res.json({
      success: true,
      data: {
        products,
        stores,
        lastUpdated: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({
      error: 'Failed to fetch inventory'
    });
  }
});

// Update product (for editing)
router.put('/update-product', adminAuth, async (req, res) => {
  try {
    const { productKey, updates } = req.body;
    
    if (!productKey || !updates) {
      return res.status(400).json({
        error: 'Product key and updates are required'
      });
    }
    
    // Update each store's price data
    for (const [store, data] of Object.entries(updates)) {
      if (data && data.price && data.unit) {
        await dbOps.updateProductPrice(productKey, store, {
          price: parseFloat(data.price),
          unit: data.unit,
          updatedBy: 'admin'
        });
      }
    }
    
    res.json({
      success: true,
      message: 'Product updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      error: 'Failed to update product'
    });
  }
});

// Update product info (display name, category)
router.put('/update-product-info', adminAuth, async (req, res) => {
  try {
    const { productKey, displayName, category } = req.body;
    
    if (!productKey) {
      return res.status(400).json({
        error: 'Product key is required'
      });
    }
    
    const result = await dbOps.updateProductInfo(productKey, { displayName, category });
    const success = result.success;
    
    if (success) {
      res.json({
        success: true,
        message: 'Product info updated successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to update product info'
      });
    }
    
  } catch (error) {
    console.error('Error updating product info:', error);
    res.status(500).json({
      error: 'Failed to update product info'
    });
  }
});

// Delete product
router.delete('/delete-product/:productKey', adminAuth, async (req, res) => {
  try {
    const { productKey } = req.params;
    
    if (!productKey) {
      return res.status(400).json({
        success: false,
        error: 'Product key is required'
      });
    }
    
    // Create backup before deletion
    console.log(`📋 Creating backup before deleting product: ${productKey}`);
    const backup = backupManager.autoBackupBeforeBulk(`delete-product-${productKey}`);
    if (!backup.success) {
      console.warn('⚠️ Backup failed but continuing with deletion');
    }
    
    const result = await dbOps.deleteProduct(productKey);
    const success = result.success;
    
    if (success) {
      res.json({
        success: true,
        message: 'Product deleted successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to delete product'
      });
    }
    
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete product'
    });
  }
});

module.exports = router;
