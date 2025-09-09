const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { exec } = require('child_process');
const database = require('../database/db-connection');

const BACKUPS_DIR = path.join(__dirname, '../backups');

if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
  console.log('Created backups directory:', BACKUPS_DIR);
}

const createBackup = (reason = 'manual', callback) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilename = `backup-${timestamp}-${reason}.sql`;
  const backupPath = path.join(BACKUPS_DIR, backupFilename);

  const dbConfig = database.getDbConfig();
  if (!dbConfig) {
    return callback({ success: false, error: 'Database not configured.' });
  }

  const command = `pg_dump "postgresql://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}" > "${backupPath}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Backup creation failed: ${error.message}`);
      return callback({ success: false, error: error.message });
    }
    if (stderr) {
      console.error(`❌ Backup command stderr: ${stderr}`);
    }
    
    const stats = fs.statSync(backupPath);
    console.log(`✅ Backup created: ${backupFilename} (${(stats.size / 1024).toFixed(2)} KB)`);
    cleanupOldBackups();
    callback({
      success: true,
      filename: backupFilename,
      path: backupPath,
      size: stats.size,
      timestamp: new Date().toISOString()
    });
  });
};

const cleanupOldBackups = () => {
    try {
        const files = fs.readdirSync(BACKUPS_DIR)
            .filter(file => file.endsWith('.sql'))
            .map(file => ({
                name: file,
                path: path.join(BACKUPS_DIR, file),
                time: fs.statSync(path.join(BACKUPS_DIR, file)).mtime.getTime(),
            }))
            .sort((a, b) => b.time - a.time);

        if (files.length > 30) {
            files.slice(30).forEach(file => {
                fs.unlinkSync(file.path);
                console.log(`🗑️ Deleted old backup: ${file.name}`);
            });
        }
    } catch (error) {
        console.error('⚠️ Cleanup failed:', error);
    }
};

const getBackupList = () => {
  try {
    return fs.readdirSync(BACKUPS_DIR)
      .filter(file => file.endsWith('.sql'))
      .map(file => {
        const stats = fs.statSync(path.join(BACKUPS_DIR, file));
        return {
          filename: file,
          size: stats.size,
          created: stats.birthtime,
        };
      })
      .sort((a, b) => b.created - a.created);
  } catch (error) {
    console.error('❌ Failed to get backup list:', error);
    return [];
  }
};

const getRecentBackups = () => getBackupList().slice(0, 5);

const restoreFromBackup = (filename, callback) => {
  const backupPath = path.join(BACKUPS_DIR, filename);
  if (!fs.existsSync(backupPath)) {
    return callback({ success: false, error: 'Backup file not found.' });
  }

  const dbConfig = database.getDbConfig();
  if (!dbConfig) {
    return callback({ success: false, error: 'Database not configured.' });
  }
  const command = `psql "postgresql://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}" < "${backupPath}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Restore failed: ${error.message}`);
      return callback({ success: false, error: error.message });
    }
    console.log(`✅ Database restored from: ${filename}`);
    callback({ success: true, message: `Database restored from ${filename}` });
  });
};


const setupAutomaticBackups = () => {
  cron.schedule('0 */4 * * *', () => {
    console.log('🔄 Running automatic 4-hour backup...');
    createBackup('auto-4hr', (result) => {
        if (!result.success) console.error('Auto backup failed:', result.error);
    });
  });
  console.log('⏰ Automatic backups enabled (every 4 hours).');
};

const manualBackup = (callback) => {
    console.log('📋 Creating manual backup...');
    createBackup('manual', callback);
};

module.exports = {
  getBackupList,
  getRecentBackups,
  restoreFromBackup,
  setupAutomaticBackups,
  manualBackup,
  BACKUPS_DIR
};