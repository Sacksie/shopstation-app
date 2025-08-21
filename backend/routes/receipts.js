const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Receipt upload endpoint
router.post('/upload', upload.single('receipt'), async (req, res) => {
  try {
    // For MVP, return a message that this feature is coming soon
    res.json({
      success: false,
      message: 'Receipt scanning coming soon! For now, use the admin panel to add prices manually.',
      error: 'Feature not yet implemented'
    });
    
    // Clean up uploaded file if it exists
    if (req.file) {
      const fs = require('fs').promises;
      await fs.unlink(req.file.path).catch(() => {});
    }
    
  } catch (error) {
    console.error('Receipt processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Receipt processing not yet available'
    });
  }
});

module.exports = router;
