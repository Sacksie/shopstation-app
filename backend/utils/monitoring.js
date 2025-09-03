/**
 * Business Monitoring & Error Tracking
 * 
 * CRITICAL: This prevents customer issues from going unnoticed
 * 
 * Features:
 * - Error logging with context
 * - Performance monitoring
 * - Business metric tracking
 * - Automated alerts for critical issues
 */

const fs = require('fs');
const path = require('path');
const config = require('../config/environments');

class BusinessMonitoring {
  constructor() {
    this.errorLog = [];
    this.performanceLog = [];
    this.businessMetrics = {
      apiCalls: 0,
      errors: 0,
      priceUpdates: 0,
      adminLogins: 0,
      startTime: new Date()
    };
    
    // Ensure logs directory exists
    this.logsDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
    
    // Set up periodic reporting
    this.setupPeriodicReporting();
  }

  /**
   * Log critical business errors
   * BUSINESS IMPACT: Know immediately when customers can't use your app
   */
  logError(error, context = {}) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      message: error.message || error,
      stack: error.stack,
      environment: config.environment,
      context: context,
      severity: this.determineSeverity(error, context)
    };

    // Add to in-memory log
    this.errorLog.push(errorInfo);
    
    // Keep only last 100 errors in memory and clean up old entries
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }

    // Clean up old error logs from filesystem periodically
    this.cleanupOldLogFiles();

    // Write to file for persistence
    this.writeErrorToFile(errorInfo);

    // Update business metrics
    this.businessMetrics.errors++;

    // Send immediate alerts for critical errors
    if (errorInfo.severity === 'CRITICAL') {
      this.sendCriticalAlert(errorInfo);
    }

    console.error(`🚨 ${errorInfo.severity} ERROR:`, errorInfo.message, errorInfo.context);
  }

  /**
   * Track API performance
   * BUSINESS IMPACT: Slow APIs = customers leave
   */
  trackPerformance(operation, duration, metadata = {}) {
    const perfInfo = {
      timestamp: new Date().toISOString(),
      operation,
      duration,
      metadata,
      environment: config.environment
    };

    this.performanceLog.push(perfInfo);
    
    // Keep only last 1000 performance entries and clean up old entries
    if (this.performanceLog.length > 1000) {
      this.performanceLog = this.performanceLog.slice(-1000);
    }

    // Clean up old performance logs from filesystem periodically
    this.cleanupOldLogFiles();

    // Alert on slow operations
    if (duration > 5000) { // 5 seconds
      this.logError(new Error(`Slow operation detected: ${operation}`), {
        duration,
        metadata,
        type: 'PERFORMANCE'
      });
    }

    // Log extremely slow operations
    if (duration > 500) {
      console.warn(`⚠️  Slow operation: ${operation} took ${duration}ms`);
    }
  }

  /**
   * Track business metrics
   * BUSINESS IMPACT: Understanding app usage and growth
   */
  trackBusinessEvent(event, data = {}) {
    const businessEvent = {
      timestamp: new Date().toISOString(),
      event,
      data,
      environment: config.environment
    };

    // Update relevant counters
    switch (event) {
      case 'api_call':
        this.businessMetrics.apiCalls++;
        break;
      case 'price_update':
        this.businessMetrics.priceUpdates++;
        break;
      case 'admin_login':
        this.businessMetrics.adminLogins++;
        break;
    }

    // Log significant business events
    if (config.environment === 'production') {
      console.log(`📊 Business Event: ${event}`, data);
    }
  }

  /**
   * Get current system health
   * BUSINESS IMPACT: Quick overview of app status
   */
  getSystemHealth() {
    const uptime = new Date() - this.businessMetrics.startTime;
    const recentErrors = this.errorLog.filter(
      error => new Date() - new Date(error.timestamp) < 60 * 60 * 1000 // Last hour
    );
    const avgPerformance = this.calculateAveragePerformance();

    return {
      status: recentErrors.length === 0 ? 'HEALTHY' : 'DEGRADED',
      uptime: Math.floor(uptime / 1000), // seconds
      environment: config.environment,
      metrics: this.businessMetrics,
      recentErrors: recentErrors.length,
      averageResponseTime: avgPerformance,
      lastUpdate: new Date().toISOString()
    };
  }

  /**
   * Private helper methods
   */
  determineSeverity(error, context) {
    // Critical: Database failures, authentication issues
    if (error.message?.includes('database') || 
        error.message?.includes('auth') ||
        context.type === 'DATABASE' ||
        context.type === 'AUTH') {
      return 'CRITICAL';
    }

    // High: API failures, performance issues
    if (error.message?.includes('API') || 
        context.type === 'PERFORMANCE') {
      return 'HIGH';
    }

    // Medium: General application errors
    return 'MEDIUM';
  }

  writeErrorToFile(errorInfo) {
    try {
      const logFile = path.join(this.logsDir, `errors-${new Date().toISOString().split('T')[0]}.log`);
      const logLine = `${errorInfo.timestamp} [${errorInfo.severity}] ${errorInfo.message}\n`;
      
      fs.appendFileSync(logFile, logLine);
    } catch (err) {
      console.error('Failed to write error log:', err);
    }
  }

  sendCriticalAlert(errorInfo) {
    // In a real production system, this would:
    // - Send email/SMS alerts
    // - Post to Slack/Discord
    // - Update status page
    // - Create support tickets
    
    console.error(`🚨🚨🚨 CRITICAL ALERT 🚨🚨🚨`);
    console.error(`Error: ${errorInfo.message}`);
    console.error(`Environment: ${errorInfo.environment}`);
    console.error(`Time: ${errorInfo.timestamp}`);
    console.error(`Context:`, errorInfo.context);
    
    // For now, just ensure it's prominently logged
    // Future: integrate with email service, Slack webhooks, etc.
  }

  calculateAveragePerformance() {
    if (this.performanceLog.length === 0) return 0;
    
    const recentPerf = this.performanceLog.slice(-50); // Last 50 operations
    const total = recentPerf.reduce((sum, entry) => sum + entry.duration, 0);
    return Math.round(total / recentPerf.length);
  }

  setupPeriodicReporting() {
    // Report system status every hour in production
    if (config.environment === 'production') {
      setInterval(() => {
        const health = this.getSystemHealth();
        console.log('📊 Hourly System Health Report:', health);
        
        // Write daily summary to file
        this.writeDailySummary();
      }, 60 * 60 * 1000); // 1 hour
    }
  }

  writeDailySummary() {
    try {
      const summaryFile = path.join(this.logsDir, `summary-${new Date().toISOString().split('T')[0]}.json`);
      const summary = {
        date: new Date().toISOString().split('T')[0],
        health: this.getSystemHealth(),
        topErrors: this.getTopErrors(),
        slowestOperations: this.getSlowestOperations()
      };
      
      fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
    } catch (err) {
      console.error('Failed to write daily summary:', err);
    }
  }

  getTopErrors() {
    const errorCounts = {};
    this.errorLog.forEach(error => {
      const key = error.message;
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    });
    
    return Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([error, count]) => ({ error, count }));
  }

  getSlowestOperations() {
    return this.performanceLog
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10)
      .map(entry => ({
        operation: entry.operation,
        duration: entry.duration,
        timestamp: entry.timestamp
      }));
  }

  /**
   * Clean up old log files to prevent disk space issues
   * BUSINESS IMPACT: Prevents server crashes from disk space exhaustion
   */
  cleanupOldLogFiles() {
    try {
      // Only run cleanup every 100 operations to avoid performance impact
      if (Math.random() > 0.01) {
        return;
      }

      const files = fs.readdirSync(this.logsDir)
        .filter(file => file.endsWith('.json'))
        .map(file => ({
          name: file,
          path: path.join(this.logsDir, file),
          stats: fs.statSync(path.join(this.logsDir, file))
        }))
        .sort((a, b) => b.stats.mtime - a.stats.mtime);

      // Keep only last 30 log files
      if (files.length > 30) {
        const filesToDelete = files.slice(30);
        filesToDelete.forEach(file => {
          try {
            fs.unlinkSync(file.path);
            console.log(`🗑️ Cleaned up old log file: ${file.name}`);
          } catch (unlinkError) {
            console.warn(`⚠️ Failed to delete old log file ${file.name}:`, unlinkError.message);
          }
        });
      }
    } catch (error) {
      console.warn('⚠️ Log cleanup failed:', error.message);
    }
  }
}

// Create global instance
const monitor = new BusinessMonitoring();

// Express middleware for automatic request tracking
const requestTrackingMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  monitor.trackBusinessEvent('api_call', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent')
  });

  // Track response time when request finishes
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    monitor.trackPerformance(`${req.method} ${req.url}`, duration, {
      statusCode: res.statusCode,
      contentLength: res.get('Content-Length')
    });
  });

  next();
};

// Global error handler for unhandled errors
process.on('uncaughtException', (error) => {
  monitor.logError(error, { type: 'UNCAUGHT_EXCEPTION' });
});

process.on('unhandledRejection', (reason, promise) => {
  monitor.logError(new Error(`Unhandled Rejection: ${reason}`), { 
    type: 'UNHANDLED_REJECTION',
    promise: promise.toString()
  });
});

module.exports = {
  monitor,
  requestTrackingMiddleware
};