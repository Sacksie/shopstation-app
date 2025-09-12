const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// --- DIAGNOSTIC PROBE ---
console.log('--- Vercel Environment Variable Diagnostics ---');
console.log(`'ADMIN_PASSWORD' exists: ${!!process.env.ADMIN_PASSWORD}`);
if (process.env.ADMIN_PASSWORD) {
  console.log(`'ADMIN_PASSWORD' length: ${process.env.ADMIN_PASSWORD.length}`);
}
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log('-------------------------------------------');

// CRITICAL SECURITY CHECK for Admin Password
if (process.env.NODE_ENV === 'production' && (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD === 'temp-password-123' || process.env.ADMIN_PASSWORD.length < 10)) {
  console.error('FATAL ERROR: ADMIN_PASSWORD is not set, is insecure, or is too short.');
  console.error('Please set a strong, unique ADMIN_PASSWORD in your .env file for production environments.');
  process.exit(1); // Exit with failure code
}

// Load environment-specific configuration
const config = require('./config/environments');

// Initialize business-critical systems
const backupManager = require('./utils/backupManager');
const { monitor, requestTrackingMiddleware } = require('./utils/monitoring');
const { cloudBackup } = require('./utils/cloudBackup');

// Initialize database connection
const database = require('./database/db-connection');

// Railway deployment system
const { RailwayDeployment } = require('./scripts/railway-deployment');

const app = express();
const PORT = config.port;

// Business monitoring middleware (must be first)
app.use(requestTrackingMiddleware);

// Environment-aware middleware with dynamic CORS
const corsOptions = {
  ...config.cors,
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (config.cors.origin.includes(origin)) {
      return callback(null, true);
    }
    
    // Allow Vercel preview deployments
    if (origin.includes('.vercel.app')) {
      console.log('🌐 Allowing Vercel deployment:', origin);
      return callback(null, true);
    }
    
    // Log blocked origins for debugging
    console.log('🚫 Blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
};

app.use(cors(corsOptions));
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
const productRequestRoutes = require('./routes/product-requests');
const productRoutes = require('./routes/products');
const portalRoutes = require('./routes/portal'); // Import the new portal routes
const adminRoutes = require('./routes/admin'); // Import the new admin routes

// Use routes
app.use('/api', compareRoutes);
app.use('/api/manual', manualEntryRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/gdpr', gdprRoutes);
app.use('/api/requests', productRequestRoutes);
app.use('/api/products', productRoutes);
app.use('/api/portal', portalRoutes); // Use the new portal routes
app.use('/api/admin', adminRoutes); // Use the new admin routes

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
    cors: {
      allowedOrigins: config.cors.origin,
      currentOrigin: req.get('Origin'),
      corsEnabled: true
    },
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

// Simple connectivity test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Backend is reachable!',
    timestamp: new Date().toISOString(),
    environment: config.environment,
    cors: {
      allowedOrigins: config.cors.origin,
      currentOrigin: req.get('Origin')
    }
  });
});

// Simple ping endpoint for basic connectivity
app.get('/api/ping', (req, res) => {
  res.json({ 
    success: true, 
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

// Business monitoring endpoints
app.get('/api/system/status', (req, res) => {
  const health = monitor.getSystemHealth();
  res.json(health);
});

// Debug endpoint for database testing
app.get('/api/debug/database', async (req, res) => {
  try {
    const dbOps = require('./database/db-operations');
    const products = await dbOps.getProducts();
    res.json({
      success: true,
      databaseConnected: true,
      productCount: products.length,
      products: products.slice(0, 3) // First 3 products for debugging
    });
  } catch (error) {
    res.json({
      success: false,
      databaseConnected: false,
      error: error.message,
      stack: error.stack
    });
  }
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

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  // Initialize database connection
  console.log('🗄️ Initializing database connection...');
  try {
    await database.connect();
    console.log('✅ Database connection established');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.log('ℹ️  Server will continue with JSON database fallback');
  }

  // Railway deployment system - automatic migration on first deploy
  if (process.env.RAILWAY_ENVIRONMENT === 'production' && process.env.DATABASE_URL) {
    console.log('🚂 Railway deployment detected - checking migration status...');
    setTimeout(async () => {
      try {
        const deployment = new RailwayDeployment();
        const result = await deployment.deploy();
        if (result.success) {
          console.log('✅ Railway deployment completed successfully');
        } else {
          console.error('❌ Railway deployment failed:', result.error);
        }
      } catch (error) {
        console.error('❌ Railway deployment error:', error.message);
      }
    }, 3000); // Wait 3 seconds for database to be ready
  }
  
  // Initialize automatic backup system
  console.log('🔄 Initializing backup system...');
  backupManager.setupAutomaticBackups();
  
  // Create initial backup on startup
  setTimeout(async () => {
    try {
      const initialBackup = await backupManager.createBackup('startup');
      if (initialBackup.success) {
        console.log('📋 Initial backup created successfully');
      } else {
        console.warn('⚠️ Initial backup failed:', initialBackup.error);
      }
    } catch (error) {
      console.error('❌ Critical error during initial backup:', error);
      // Don't crash the server, but log the error
      monitor.logError(error, { type: 'STARTUP_BACKUP_FAILED' });
    }
  }, 2000);
});
