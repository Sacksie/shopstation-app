const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Load environment-specific configuration
const config = require('./config/environments');

// Initialize business-critical systems
const backupManager = require('./utils/backupManager');
const { monitor, requestTrackingMiddleware } = require('./utils/monitoring');
const { cloudBackup } = require('./utils/cloudBackup');

const app = express();
const PORT = config.port;

// Business monitoring middleware (must be first)
app.use(requestTrackingMiddleware);

// Environment-aware middleware
app.use(cors(config.cors));
app.use(express.json({ limit: '10mb' }));

// Add environment info to all responses (development only)
if (config.environment === 'development') {
  app.use((req, res, next) => {
    res.setHeader('X-Environment', config.environment);
    next();
  });
}

// Import routes
const compareRoutes = require('./routes/compare');
const manualEntryRoutes = require('./routes/manual-entry');
const receiptRoutes = require('./routes/receipts');
const backupRoutes = require('./routes/backup');
const gdprRoutes = require('./routes/gdpr');

// Use routes
app.use('/api', compareRoutes);
app.use('/api/manual', manualEntryRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/gdpr', gdprRoutes);

// Enhanced health check with business monitoring
app.get('/api/health', (req, res) => {
  const systemHealth = monitor.getSystemHealth();
  
  res.json({ 
    status: systemHealth.status,
    timestamp: new Date().toISOString(),
    environment: config.environment,
    version: '1.2.0',
    deployment: 'Auto-Deploy from GitHub',
    features: config.common.features,
    monitoring: {
      uptime: systemHealth.uptime,
      recentErrors: systemHealth.recentErrors,
      averageResponseTime: systemHealth.averageResponseTime,
      totalRequests: systemHealth.metrics.apiCalls
    },
    // Only show detailed info in development
    ...(config.environment === 'development' && {
      config_summary: {
        cors_origins: config.cors.origin,
        backup_interval: config.database.backup_interval,
        logging_level: config.logging.level
      }
    })
  });
});

// Business monitoring endpoints
app.get('/api/system/status', (req, res) => {
  const health = monitor.getSystemHealth();
  res.json(health);
});

app.get('/api/system/backups', async (req, res) => {
  try {
    const backups = cloudBackup.listBackups();
    res.json({
      success: true,
      backups: backups.slice(0, 20), // Last 20 backups
      totalCount: backups.length
    });
  } catch (error) {
    monitor.logError(error, { type: 'BACKUP_LIST_API' });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve backup list'
    });
  }
});

app.post('/api/system/backup', async (req, res) => {
  try {
    const { reason = 'manual' } = req.body;
    monitor.trackBusinessEvent('manual_backup_requested', { reason });
    
    const result = await cloudBackup.createFullBackup(reason);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    monitor.logError(error, { type: 'MANUAL_BACKUP_API' });
    res.status(500).json({
      success: false,
      error: 'Failed to create backup'
    });
  }
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  monitor.logError(err, { 
    type: 'EXPRESS_ERROR',
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent')
  });
  
  res.status(500).json({ 
    success: false,
    error: 'Internal server error', 
    message: config.environment === 'development' ? err.message : 'An error occurred'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Initialize automatic backup system
  console.log('🔄 Initializing backup system...');
  backupManager.setupAutomaticBackups();
  
  // Create initial backup on startup
  setTimeout(() => {
    const initialBackup = backupManager.createBackup('startup');
    if (initialBackup.success) {
      console.log('📋 Initial backup created successfully');
    }
  }, 2000);
});
