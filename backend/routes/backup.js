const express = require('express');
const router = express.Router();
const multer = require('multer');
const backupManager = require('../utils/backupManager');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are allowed'), false);
    }
  }
});

// Get backup status and recent backups
router.get('/status', (req, res) => {
  try {
    const recentBackups = backupManager.getRecentBackups();
    const lastBackup = recentBackups.length > 0 ? recentBackups[0] : null;
    
    res.json({
      success: true,
      data: {
        lastBackup: lastBackup,
        recentBackups: recentBackups,
        totalBackups: backupManager.getBackupList().length,
        backupsDirectory: backupManager.BACKUPS_DIR
      }
    });
  } catch (error) {
    console.error('Error getting backup status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create manual backup
router.post('/create', (req, res) => {
  try {
    const result = backupManager.manualBackup();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Backup created successfully',
        backup: result
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error creating backup:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Download backup file
router.get('/download/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const result = backupManager.getBackupFile(filename);
    
    if (result.success) {
      res.set({
        'Content-Type': result.mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': result.size
      });
      
      res.send(result.data);
    } else {
      res.status(404).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error downloading backup:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Restore from backup file
router.post('/restore/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const result = backupManager.restoreFromBackup(filename);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        safetyBackup: result.safetyBackup
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Upload and restore backup
router.post('/upload-restore', upload.single('backupFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No backup file uploaded'
      });
    }
    
    const uploadedData = req.file.buffer.toString('utf8');
    const originalName = req.file.originalname;
    
    const result = backupManager.restoreFromUpload(uploadedData, originalName);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        safetyBackup: result.safetyBackup
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error uploading and restoring backup:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get list of all backups
router.get('/list', (req, res) => {
  try {
    const backups = backupManager.getBackupList();
    res.json({
      success: true,
      data: {
        backups: backups,
        count: backups.length
      }
    });
  } catch (error) {
    console.error('Error getting backup list:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Pre-bulk operation backup
router.post('/pre-bulk/:operation', (req, res) => {
  try {
    const { operation } = req.params;
    const result = backupManager.autoBackupBeforeBulk(operation);
    
    if (result.success) {
      res.json({
        success: true,
        message: `Auto-backup created before ${operation}`,
        backup: result
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error creating pre-bulk backup:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handler for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 10MB.'
      });
    }
  }
  
  res.status(400).json({
    success: false,
    error: error.message
  });
});

module.exports = router;