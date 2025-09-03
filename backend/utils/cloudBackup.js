/**
 * Cloud Backup System - BUSINESS CRITICAL
 * 
 * DISASTER RECOVERY: Protects your business from total data loss
 * 
 * Features:
 * - Automatic daily backups to multiple locations
 * - Data integrity verification
 * - Easy restoration process
 * - Monitoring and alerts
 */

const fs = require('fs');
const path = require('path');
const config = require('../config/environments');
const { monitor } = require('./monitoring');

class CloudBackupSystem {
  constructor() {
    this.backupDir = path.join(__dirname, '../backups');
    this.cloudBackupDir = path.join(__dirname, '../cloud-backups');
    
    // Ensure directories exist
    [this.backupDir, this.cloudBackupDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Set up automatic backups
    this.setupAutomaticBackups();
  }

  /**
   * Create a complete business data backup
   * BUSINESS IMPACT: Protects against total data loss
   */
  async createFullBackup(reason = 'scheduled') {
    const startTime = Date.now();
    monitor.trackBusinessEvent('backup_started', { reason });

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupId = `full-backup-${timestamp}-${reason}`;
      
      console.log(`📋 Creating full backup: ${backupId}`);

      // 1. Backup database
      const databaseBackup = await this.backupDatabase();
      
      // 2. Backup configuration
      const configBackup = await this.backupConfiguration();
      
      // 3. Backup logs and monitoring data
      const logsBackup = await this.backupLogs();

      // 4. Create comprehensive backup package
      const backupPackage = {
        id: backupId,
        timestamp: new Date().toISOString(),
        reason,
        environment: config.environment,
        version: '1.1.0',
        data: {
          database: databaseBackup,
          configuration: configBackup,
          logs: logsBackup
        },
        integrity: {
          checksum: this.calculateChecksum(databaseBackup + configBackup),
          recordCount: this.countRecords(databaseBackup),
          fileSize: JSON.stringify(databaseBackup).length
        }
      };

      // 5. Save to local backup directory
      const localBackupPath = path.join(this.backupDir, `${backupId}.json`);
      fs.writeFileSync(localBackupPath, JSON.stringify(backupPackage, null, 2));

      // 6. Save to "cloud" backup directory (simulated cloud storage)
      const cloudBackupPath = path.join(this.cloudBackupDir, `${backupId}.json`);
      fs.writeFileSync(cloudBackupPath, JSON.stringify(backupPackage, null, 2));

      // 7. Verify backup integrity
      const verified = await this.verifyBackupIntegrity(backupPackage);
      
      if (!verified) {
        throw new Error('Backup integrity verification failed');
      }

      // 8. Clean up old backups
      await this.cleanupOldBackups();

      const duration = Date.now() - startTime;
      monitor.trackPerformance('full_backup', duration);
      monitor.trackBusinessEvent('backup_completed', { 
        backupId, 
        duration,
        recordCount: backupPackage.integrity.recordCount,
        fileSize: backupPackage.integrity.fileSize
      });

      console.log(`✅ Backup completed successfully: ${backupId} (${duration}ms)`);
      
      return {
        success: true,
        backupId,
        duration,
        integrity: backupPackage.integrity,
        paths: {
          local: localBackupPath,
          cloud: cloudBackupPath
        }
      };

    } catch (error) {
      monitor.logError(error, { type: 'BACKUP_FAILURE', reason });
      
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Backup database with all product and price data
   */
  async backupDatabase() {
    try {
      const db = require('../database/kosher-db');
      const databaseData = db.readDB();
      
      return {
        timestamp: new Date().toISOString(),
        data: databaseData,
        statistics: {
          productCount: Object.keys(databaseData.products || {}).length,
          aliasCount: Object.keys(databaseData.aliases || {}).length,
          totalPrices: this.countTotalPrices(databaseData)
        }
      };
    } catch (error) {
      monitor.logError(error, { type: 'DATABASE_BACKUP_FAILURE' });
      return { error: error.message };
    }
  }

  /**
   * Backup configuration and environment settings
   */
  async backupConfiguration() {
    try {
      return {
        timestamp: new Date().toISOString(),
        environment: config.environment,
        // Don't backup sensitive data, just structure
        configStructure: {
          hasValidConfig: !!config.port,
          environmentDetected: true,
          corsConfigured: !!config.cors,
          featuresEnabled: Object.keys(config.common?.features || {}).length
        }
      };
    } catch (error) {
      monitor.logError(error, { type: 'CONFIG_BACKUP_FAILURE' });
      return { error: error.message };
    }
  }

  /**
   * Backup logs and monitoring data
   */
  async backupLogs() {
    try {
      const logsDir = path.join(__dirname, '../logs');
      const logFiles = [];
      
      if (fs.existsSync(logsDir)) {
        const files = fs.readdirSync(logsDir);
        files.forEach(file => {
          if (file.endsWith('.log') || file.endsWith('.json')) {
            const content = fs.readFileSync(path.join(logsDir, file), 'utf8');
            logFiles.push({
              filename: file,
              content: content,
              size: content.length,
              modified: fs.statSync(path.join(logsDir, file)).mtime
            });
          }
        });
      }

      return {
        timestamp: new Date().toISOString(),
        files: logFiles,
        totalFiles: logFiles.length,
        totalSize: logFiles.reduce((sum, file) => sum + file.size, 0)
      };
    } catch (error) {
      monitor.logError(error, { type: 'LOGS_BACKUP_FAILURE' });
      return { error: error.message };
    }
  }

  /**
   * Verify backup integrity
   */
  async verifyBackupIntegrity(backupPackage) {
    try {
      // Check required fields
      if (!backupPackage.id || !backupPackage.data || !backupPackage.integrity) {
        return false;
      }

      // Verify checksum
      const currentChecksum = this.calculateChecksum(
        JSON.stringify(backupPackage.data.database) + 
        JSON.stringify(backupPackage.data.configuration)
      );
      
      if (currentChecksum !== backupPackage.integrity.checksum) {
        monitor.logError(new Error('Backup checksum mismatch'), { 
          type: 'BACKUP_INTEGRITY_FAILURE',
          expected: backupPackage.integrity.checksum,
          actual: currentChecksum
        });
        return false;
      }

      // Verify record count
      const currentRecordCount = this.countRecords(backupPackage.data.database);
      if (currentRecordCount !== backupPackage.integrity.recordCount) {
        monitor.logError(new Error('Backup record count mismatch'), {
          type: 'BACKUP_INTEGRITY_FAILURE',
          expected: backupPackage.integrity.recordCount,
          actual: currentRecordCount
        });
        return false;
      }

      return true;
    } catch (error) {
      monitor.logError(error, { type: 'BACKUP_VERIFICATION_FAILURE' });
      return false;
    }
  }

  /**
   * Restore from backup
   * BUSINESS IMPACT: Quick recovery from disasters
   */
  async restoreFromBackup(backupId) {
    try {
      console.log(`🔄 Attempting to restore from backup: ${backupId}`);

      // Find backup file
      let backupPath = path.join(this.backupDir, `${backupId}.json`);
      
      if (!fs.existsSync(backupPath)) {
        // Try cloud backup
        backupPath = path.join(this.cloudBackupDir, `${backupId}.json`);
      }
      
      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup not found: ${backupId}`);
      }

      // Load backup
      const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
      
      // Verify integrity before restoring
      const verified = await this.verifyBackupIntegrity(backupData);
      if (!verified) {
        throw new Error('Backup integrity verification failed during restore');
      }

      // Create safety backup before restore
      const safetyBackup = await this.createFullBackup('pre-restore-safety');
      if (!safetyBackup.success) {
        throw new Error('Failed to create safety backup before restore');
      }

      // Restore database
      if (backupData.data.database && !backupData.data.database.error) {
        const db = require('../database/kosher-db');
        db.writeDB(backupData.data.database.data);
        console.log(`✅ Database restored from ${backupData.timestamp}`);
      }

      monitor.trackBusinessEvent('backup_restored', {
        backupId,
        originalTimestamp: backupData.timestamp,
        safetyBackupId: safetyBackup.backupId
      });

      return {
        success: true,
        backupId,
        originalTimestamp: backupData.timestamp,
        safetyBackupId: safetyBackup.backupId,
        recordsRestored: this.countRecords(backupData.data.database)
      };

    } catch (error) {
      monitor.logError(error, { type: 'RESTORE_FAILURE', backupId });
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * List available backups
   */
  listBackups() {
    try {
      const backups = [];
      
      // Check local backups
      if (fs.existsSync(this.backupDir)) {
        const localFiles = fs.readdirSync(this.backupDir)
          .filter(file => file.endsWith('.json'))
          .map(file => {
            const stats = fs.statSync(path.join(this.backupDir, file));
            return {
              id: file.replace('.json', ''),
              location: 'local',
              size: stats.size,
              created: stats.mtime,
              path: path.join(this.backupDir, file)
            };
          });
        backups.push(...localFiles);
      }

      // Check cloud backups
      if (fs.existsSync(this.cloudBackupDir)) {
        const cloudFiles = fs.readdirSync(this.cloudBackupDir)
          .filter(file => file.endsWith('.json'))
          .map(file => {
            const stats = fs.statSync(path.join(this.cloudBackupDir, file));
            return {
              id: file.replace('.json', ''),
              location: 'cloud',
              size: stats.size,
              created: stats.mtime,
              path: path.join(this.cloudBackupDir, file)
            };
          });
        backups.push(...cloudFiles);
      }

      return backups.sort((a, b) => new Date(b.created) - new Date(a.created));
    } catch (error) {
      monitor.logError(error, { type: 'BACKUP_LIST_FAILURE' });
      return [];
    }
  }

  /**
   * Set up automatic backup schedule
   */
  setupAutomaticBackups() {
    if (config.environment === 'production') {
      // Daily backups at 2 AM
      const cron = require('node-cron');
      
      cron.schedule('0 2 * * *', () => {
        console.log('🕒 Starting scheduled daily backup...');
        this.createFullBackup('daily-scheduled');
      });

      // Weekly backups on Sunday at 1 AM
      cron.schedule('0 1 * * 0', () => {
        console.log('🕒 Starting scheduled weekly backup...');
        this.createFullBackup('weekly-scheduled');
      });

      console.log('📅 Automatic backup schedule configured');
    }
  }

  /**
   * Clean up old backups to save space
   */
  async cleanupOldBackups() {
    try {
      const backups = this.listBackups();
      const maxLocalBackups = 10;  // Keep 10 local backups
      const maxCloudBackups = 30;  // Keep 30 cloud backups
      
      // Clean up local backups
      const localBackups = backups.filter(b => b.location === 'local');
      if (localBackups.length > maxLocalBackups) {
        const toDelete = localBackups.slice(maxLocalBackups);
        toDelete.forEach(backup => {
          fs.unlinkSync(backup.path);
          console.log(`🗑️  Cleaned up old local backup: ${backup.id}`);
        });
      }

      // Clean up cloud backups
      const cloudBackups = backups.filter(b => b.location === 'cloud');
      if (cloudBackups.length > maxCloudBackups) {
        const toDelete = cloudBackups.slice(maxCloudBackups);
        toDelete.forEach(backup => {
          fs.unlinkSync(backup.path);
          console.log(`🗑️  Cleaned up old cloud backup: ${backup.id}`);
        });
      }

    } catch (error) {
      monitor.logError(error, { type: 'BACKUP_CLEANUP_FAILURE' });
    }
  }

  /**
   * Helper methods
   */
  calculateChecksum(data) {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(data).digest('hex');
  }

  countRecords(databaseBackup) {
    if (!databaseBackup || !databaseBackup.data || !databaseBackup.data.products) {
      return 0;
    }
    return Object.keys(databaseBackup.data.products).length;
  }

  countTotalPrices(databaseData) {
    if (!databaseData || !databaseData.products) return 0;
    
    let totalPrices = 0;
    Object.values(databaseData.products).forEach(product => {
      if (product.prices) {
        totalPrices += Object.keys(product.prices).length;
      }
    });
    
    return totalPrices;
  }
}

// Create global instance
const cloudBackup = new CloudBackupSystem();

module.exports = {
  cloudBackup
};