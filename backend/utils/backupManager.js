const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const db = require('../database/kosher-db');

const BACKUPS_DIR = path.join(__dirname, '../backups');
const MAX_BACKUPS = 30; // Keep 30 days of backups

// Ensure backups directory exists
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  console.log('Created backups directory:', BACKUPS_DIR);
}

// Create backup with timestamp
const createBackup = (reason = 'manual') => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                      new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    const backupFilename = `backup-${timestamp}-${reason}.json`;
    const backupPath = path.join(BACKUPS_DIR, backupFilename);
    
    // Read current database
    const currentData = db.readDB();
    
    // Add backup metadata
    const backupData = {
      ...currentData,
      backupMetadata: {
        timestamp: new Date().toISOString(),
        reason: reason,
        version: '1.0',
        originalFilename: 'kosher-prices.json'
      }
    };
    
    // Write backup
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    
    const stats = fs.statSync(backupPath);
    console.log(`✅ Backup created: ${backupFilename} (${(stats.size / 1024).toFixed(2)} KB)`);
    
    // Clean up old backups
    cleanupOldBackups();
    
    return {
      success: true,
      filename: backupFilename,
      path: backupPath,
      size: stats.size,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Backup creation failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Clean up old backups (keep only MAX_BACKUPS most recent)
const cleanupOldBackups = () => {
  try {
    const files = fs.readdirSync(BACKUPS_DIR)
      .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
      .map(file => {
        try {
          const filePath = path.join(BACKUPS_DIR, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            path: filePath,
            stats: stats
          };
        } catch (statError) {
          console.warn(`⚠️ Could not stat backup file ${file}:`, statError.message);
          return null;
        }
      })
      .filter(file => file !== null) // Remove files that couldn't be stat'd
      .sort((a, b) => b.stats.mtime - a.stats.mtime); // Sort by modification time, newest first
    
    // Remove old backups if we exceed MAX_BACKUPS
    if (files.length > MAX_BACKUPS) {
      const filesToDelete = files.slice(MAX_BACKUPS);
      filesToDelete.forEach(file => {
        try {
          fs.unlinkSync(file.path);
          console.log(`🗑️ Deleted old backup: ${file.name}`);
        } catch (unlinkError) {
          console.error(`❌ Failed to delete backup ${file.name}:`, unlinkError.message);
        }
      });
    }
  } catch (error) {
    console.error('⚠️ Cleanup failed:', error);
  }
};

// Get list of available backups
const getBackupList = () => {
  try {
    const files = fs.readdirSync(BACKUPS_DIR)
      .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(BACKUPS_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          path: filePath,
          size: stats.size,
          sizeKB: (stats.size / 1024).toFixed(2),
          created: stats.birthtime.toISOString(),
          modified: stats.mtime.toISOString(),
          reason: file.includes('-manual') ? 'manual' : 
                  file.includes('-auto') ? 'auto' : 
                  file.includes('-bulk') ? 'bulk operation' : 'unknown'
        };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created)); // Sort by creation time, newest first
    
    return files;
  } catch (error) {
    console.error('❌ Failed to get backup list:', error);
    return [];
  }
};

// Get last 5 backups for admin panel
const getRecentBackups = () => {
  return getBackupList().slice(0, 5);
};

// Restore from backup
const restoreFromBackup = (backupFilename) => {
  try {
    const backupPath = path.join(BACKUPS_DIR, backupFilename);
    
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupFilename}`);
    }
    
    // Create a safety backup before restore
    const safetyBackup = createBackup('pre-restore-safety');
    if (!safetyBackup.success) {
      throw new Error('Failed to create safety backup before restore');
    }
    
    // Read and validate backup data
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    // Validate backup structure
    if (!backupData.stores || !backupData.products) {
      throw new Error('Invalid backup file structure');
    }
    
    // Remove backup metadata before restore
    const { backupMetadata, ...dataToRestore } = backupData;
    
    // Write restored data
    const success = db.writeDB(dataToRestore);
    
    if (success) {
      console.log(`✅ Database restored from backup: ${backupFilename}`);
      return {
        success: true,
        message: `Database restored from ${backupFilename}`,
        safetyBackup: safetyBackup.filename
      };
    } else {
      throw new Error('Failed to write restored data to database');
    }
  } catch (error) {
    console.error('❌ Restore failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Auto-backup before bulk operations
const autoBackupBeforeBulk = (operationName) => {
  console.log(`🔄 Creating auto-backup before bulk operation: ${operationName}`);
  return createBackup(`bulk-${operationName}`);
};

// Setup automatic backups
const setupAutomaticBackups = () => {
  // Run every 4 hours (0, 4, 8, 12, 16, 20)
  const cronJob4Hours = cron.schedule('0 */4 * * *', () => {
    console.log('🔄 Running automatic 4-hour backup...');
    createBackup('auto-4hr');
  }, {
    scheduled: false,
    timezone: "Europe/London" // UK timezone
  });
  
  // Also keep the daily midnight backup for long-term retention
  const cronJobDaily = cron.schedule('0 0 * * *', () => {
    console.log('🕛 Running automatic daily backup...');
    createBackup('auto-daily');
  }, {
    scheduled: false,
    timezone: "Europe/London" // UK timezone
  });
  
  // Start both cron jobs
  cronJob4Hours.start();
  cronJobDaily.start();
  console.log('⏰ Automatic backups enabled:');
  console.log('   - Every 4 hours (00:00, 04:00, 08:00, 12:00, 16:00, 20:00)');
  console.log('   - Daily at midnight (00:00 UK time)');
  
  return { fourHourly: cronJob4Hours, daily: cronJobDaily };
};

// Manual backup for admin use
const manualBackup = () => {
  console.log('📋 Creating manual backup...');
  return createBackup('manual');
};

// Get backup file for download
const getBackupFile = (filename) => {
  try {
    const backupPath = path.join(BACKUPS_DIR, filename);
    
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${filename}`);
    }
    
    const stats = fs.statSync(backupPath);
    const data = fs.readFileSync(backupPath);
    
    return {
      success: true,
      data: data,
      filename: filename,
      size: stats.size,
      mimeType: 'application/json'
    };
  } catch (error) {
    console.error('❌ Failed to get backup file:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Upload and restore from uploaded file
const restoreFromUpload = (uploadedData, originalName) => {
  try {
    // Parse uploaded JSON
    const backupData = JSON.parse(uploadedData);
    
    // Validate structure
    if (!backupData.stores || !backupData.products) {
      throw new Error('Invalid backup file structure');
    }
    
    // Create safety backup first
    const safetyBackup = createBackup('pre-upload-restore');
    if (!safetyBackup.success) {
      throw new Error('Failed to create safety backup before restore');
    }
    
    // Remove backup metadata if present
    const { backupMetadata, ...dataToRestore } = backupData;
    
    // Write restored data
    const success = db.writeDB(dataToRestore);
    
    if (success) {
      console.log(`✅ Database restored from upload: ${originalName}`);
      return {
        success: true,
        message: `Database restored from uploaded file: ${originalName}`,
        safetyBackup: safetyBackup.filename
      };
    } else {
      throw new Error('Failed to write restored data to database');
    }
  } catch (error) {
    console.error('❌ Upload restore failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  createBackup,
  getBackupList,
  getRecentBackups,
  restoreFromBackup,
  autoBackupBeforeBulk,
  setupAutomaticBackups,
  manualBackup,
  getBackupFile,
  restoreFromUpload,
  BACKUPS_DIR
};