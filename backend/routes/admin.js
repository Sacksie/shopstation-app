const express = require('express');
const { execFile } = require('child_process');
const path = require('path');
const adminAuth = require('../middleware/adminAuth');
const dbOps = require('../database/db-operations');

const router = express.Router();

// Middleware to protect all admin routes
router.use(adminAuth);

/**
 * POST /api/admin/create-store
 * 
 * Creates a new store and a store owner user.
 */
router.post('/create-store', async (req, res) => {
  const { storeName, ownerEmail, password } = req.body;

  if (!storeName || !ownerEmail || !password) {
    return res.status(400).json({ success: false, message: 'Store name, owner email, and password are required.' });
  }

  try {
    // This would be a transaction in a real app
    const newStore = await dbOps.createStore({ name: storeName, owner_email: ownerEmail });
    const newUser = await dbOps.createStoreUser({ email: ownerEmail, password, storeId: newStore.id, role: 'owner' });

    res.status(201).json({ success: true, store: newStore, user: newUser });
  } catch (error) {
    console.error('Error creating store:', error);
    res.status(500).json({ success: false, message: 'Failed to create store.' });
  }
});


/**
 * POST /api/admin/migrate-to-pg
 * 
 * Triggers the data migration script to move data from the JSON file
 * to the PostgreSQL database. This is a protected endpoint.
 */
router.post('/migrate-to-pg', (req, res) => {
  console.log('🔵 Received request to start JSON to PostgreSQL migration.');
  
  const scriptPath = path.join(__dirname, '..', 'scripts', 'migrate-json-to-pg.js');

  execFile('node', [scriptPath], (error, stdout, stderr) => {
    if (error) {
      console.error(`💥 Migration script error: ${error.message}`);
      console.error(`stderr: ${stderr}`);
      return res.status(500).json({ 
        success: false, 
        message: 'Migration script failed to execute.',
        error: error.message,
        stderr: stderr
      });
    }

    console.log('🟢 Migration script executed successfully.');
    console.log(`stdout: ${stdout}`);
    
    res.json({
      success: true,
      message: 'Migration process completed successfully!',
      output: stdout
    });
  });
});

module.exports = router;
