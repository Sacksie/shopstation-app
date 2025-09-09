const express = require('express');
const { execFile } = require('child_process');
const path = require('path');
const adminAuth = require('../adminAuth');

const router = express.Router();

// Middleware to protect all admin routes
router.use(adminAuth);

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
