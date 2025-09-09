/**
 * Database Connection Manager
 * 
 * BUSINESS CRITICAL: Professional PostgreSQL connection for ShopStation
 * - Handles Railway PostgreSQL connection
 * - Includes connection pooling for performance
 * - Environment-aware configuration
 * - Automatic reconnection handling
 */

require('dotenv').config();
const { Pool } = require('pg');
const config = require('../config/environments');

class DatabaseManager {
  constructor() {
    this.pool = null;
    this.isConnected = false;
  }

  /**
   * Initialize database connection
   */
  async connect() {
    try {
      // Railway provides DATABASE_URL automatically when PostgreSQL is added
      const databaseUrl = process.env.DATABASE_URL;
      
      if (!databaseUrl) {
        console.warn('⚠️  DATABASE_URL not found, falling back to JSON database for development');
        return null;
      }

      this.pool = new Pool({
        connectionString: databaseUrl,
        ssl: config.environment === 'production' ? { rejectUnauthorized: false } : false,
        max: 20, // Maximum number of connections in pool
        idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
        connectionTimeoutMillis: 2000, // Timeout connection attempts after 2 seconds
      });

      // Test connection
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW()');
      client.release();

      this.isConnected = true;
      console.log('✅ PostgreSQL connected successfully');
      console.log(`📅 Database time: ${result.rows[0].now}`);
      
      // Set up connection event handlers
      this.pool.on('error', (err) => {
        console.error('💥 Unexpected database error:', err);
        this.isConnected = false;
      });

      this.pool.on('connect', () => {
        console.log('🔌 New database connection established');
      });

      return this.pool;

    } catch (error) {
      console.error('💥 Database connection failed:', error.message);
      console.warn('⚠️  Falling back to JSON database for development');
      this.isConnected = false;
      return null;
    }
  }

  /**
   * Execute a query
   */
  async query(text, params = []) {
    if (!this.pool || !this.isConnected) {
      throw new Error('Database not connected. Call connect() first.');
    }

    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      if (config.environment === 'development') {
        console.log('📊 Query executed:', { 
          query: text.substring(0, 100) + (text.length > 100 ? '...' : ''), 
          duration: `${duration}ms`,
          rows: result.rowCount 
        });
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.error('💥 Database query error:', {
        error: error.message,
        query: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration: `${duration}ms`
      });
      throw error;
    }
  }

  /**
   * Execute a transaction
   */
  async transaction(queries) {
    if (!this.pool || !this.isConnected) {
      throw new Error('Database not connected. Call connect() first.');
    }

    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const results = [];
      for (const { query, params = [] } of queries) {
        const result = await client.query(query, params);
        results.push(result);
      }
      
      await client.query('COMMIT');
      console.log(`✅ Transaction completed with ${queries.length} queries`);
      return results;
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('💥 Transaction failed, rolled back:', error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get connection info for debugging
   */
  getConnectionInfo() {
    return {
      isConnected: this.isConnected,
      totalCount: this.pool ? this.pool.totalCount : 0,
      idleCount: this.pool ? this.pool.idleCount : 0,
      waitingCount: this.pool ? this.pool.waitingCount : 0
    };
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
      console.log('🔌 Database connection closed');
      this.isConnected = false;
    }
  }

  /**
   * Check if database is available
   */
  isAvailable() {
    return this.isConnected && this.pool;
  }

  /**
   * Get parsed database configuration
   */
  getDbConfig() {
    const url = require('url');
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) return null;
    
    const dbParams = url.parse(dbUrl);
    const [user, password] = dbParams.auth.split(':');

    return {
      user,
      password,
      host: dbParams.hostname,
      port: dbParams.port,
      database: dbParams.pathname.split('/')[1]
    };
  }
}

// Create singleton instance
const database = new DatabaseManager();

// Initialize connection on startup
database.connect().catch(error => {
  console.error('Failed to initialize database:', error.message);
});

module.exports = database;