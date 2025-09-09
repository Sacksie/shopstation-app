const backupManager = require('../../utils/backupManager');
const database = require('../../database/db-connection');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Mock dependencies
jest.mock('../../database/db-connection');
jest.mock('child_process');
jest.mock('fs');

describe('Backup Manager', () => {
  const mockDbConfig = {
    user: 'testuser',
    password: 'testpass',
    host: 'localhost',
    port: '5432',
    database: 'testdb'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    database.getDbConfig.mockReturnValue(mockDbConfig);
  });

  describe('getBackupList', () => {
    it('should return list of SQL backup files', () => {
      const mockFiles = [
        'backup-2025-01-01T00-00-00-manual.sql',
        'backup-2025-01-01T04-00-00-auto-4hr.sql'
      ];

      const mockStats = {
        size: 1024,
        birthtime: new Date('2025-01-01T00:00:00Z')
      };

      fs.readdirSync.mockReturnValue(mockFiles);
      fs.statSync.mockReturnValue(mockStats);

      const result = backupManager.getBackupList();

      expect(fs.readdirSync).toHaveBeenCalledWith(expect.stringContaining('backups'));
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        filename: 'backup-2025-01-01T00-00-00-manual.sql',
        size: 1024,
        created: mockStats.birthtime
      });
    });

    it('should return empty array if no backups exist', () => {
      fs.readdirSync.mockReturnValue([]);

      const result = backupManager.getBackupList();

      expect(result).toEqual([]);
    });
  });

  describe('getRecentBackups', () => {
    it('should return only the 5 most recent backups', () => {
      const mockFiles = Array.from({ length: 10 }, (_, i) => 
        `backup-2025-01-01T${i.toString().padStart(2, '0')}-00-00-manual.sql`
      );

      const mockStats = {
        size: 1024,
        birthtime: new Date()
      };

      fs.readdirSync.mockReturnValue(mockFiles);
      fs.statSync.mockReturnValue(mockStats);

      const result = backupManager.getRecentBackups();

      expect(result).toHaveLength(5);
    });
  });

  describe('manualBackup', () => {
    it('should create a manual backup successfully', (done) => {
      const mockStats = {
        size: 2048
      };

      fs.statSync.mockReturnValue(mockStats);
      exec.mockImplementation((command, callback) => {
        callback(null, 'Backup completed', '');
      });

      backupManager.manualBackup((result) => {
        expect(result.success).toBe(true);
        expect(result.filename).toMatch(/backup-.*-manual\.sql/);
        expect(result.size).toBe(2048);
        expect(exec).toHaveBeenCalledWith(
          expect.stringContaining('pg_dump'),
          expect.any(Function)
        );
        done();
      });
    });

    it('should handle backup creation failure', (done) => {
      exec.mockImplementation((command, callback) => {
        callback(new Error('pg_dump failed'), '', 'Error message');
      });

      backupManager.manualBackup((result) => {
        expect(result.success).toBe(false);
        expect(result.error).toBe('pg_dump failed');
        done();
      });
    });

    it('should handle missing database configuration', (done) => {
      database.getDbConfig.mockReturnValue(null);

      backupManager.manualBackup((result) => {
        expect(result.success).toBe(false);
        expect(result.error).toBe('Database not configured.');
        done();
      });
    });
  });

  describe('restoreFromBackup', () => {
    it('should restore from backup successfully', (done) => {
      const filename = 'backup-2025-01-01T00-00-00-manual.sql';
      const backupPath = path.join(__dirname, '../../backups', filename);

      fs.existsSync.mockReturnValue(true);
      exec.mockImplementation((command, callback) => {
        callback(null, 'Restore completed', '');
      });

      backupManager.restoreFromBackup(filename, (result) => {
        expect(result.success).toBe(true);
        expect(result.message).toBe(`Database restored from ${filename}`);
        expect(exec).toHaveBeenCalledWith(
          expect.stringContaining('psql'),
          expect.any(Function)
        );
        done();
      });
    });

    it('should handle restore failure', (done) => {
      const filename = 'backup-2025-01-01T00-00-00-manual.sql';

      fs.existsSync.mockReturnValue(true);
      exec.mockImplementation((command, callback) => {
        callback(new Error('psql failed'), '', 'Error message');
      });

      backupManager.restoreFromBackup(filename, (result) => {
        expect(result.success).toBe(false);
        expect(result.error).toBe('psql failed');
        done();
      });
    });

    it('should handle missing backup file', (done) => {
      const filename = 'nonexistent.sql';

      fs.existsSync.mockReturnValue(false);

      backupManager.restoreFromBackup(filename, (result) => {
        expect(result.success).toBe(false);
        expect(result.error).toBe('Backup file not found.');
        done();
      });
    });

    it('should handle missing database configuration', (done) => {
      const filename = 'backup-2025-01-01T00-00-00-manual.sql';

      fs.existsSync.mockReturnValue(true);
      database.getDbConfig.mockReturnValue(null);

      backupManager.restoreFromBackup(filename, (result) => {
        expect(result.success).toBe(false);
        expect(result.error).toBe('Database not configured.');
        done();
      });
    });
  });

  describe('setupAutomaticBackups', () => {
    it('should set up automatic backup scheduling', () => {
      const mockSchedule = jest.fn();
      const cron = require('node-cron');
      cron.schedule = mockSchedule;

      backupManager.setupAutomaticBackups();

      expect(mockSchedule).toHaveBeenCalledWith(
        '0 */4 * * *',
        expect.any(Function)
      );
    });
  });
});
