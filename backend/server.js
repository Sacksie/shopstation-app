const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Initialize backup system
const backupManager = require('./utils/backupManager');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error', 
    message: err.message 
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
