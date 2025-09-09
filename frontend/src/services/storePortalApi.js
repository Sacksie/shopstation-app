/**
 * Store Portal API Service
 * 
 * Handles all API calls for the Store Portal functionality
 * - Authentication (login/logout)
 * - Dashboard data fetching
 * - Product management
 * - Analytics and reporting
 */

import config, { createApiUrl } from '../config/environments';

class StorePortalApiService {
  constructor() {
    this.baseUrl = config.api.baseUrl;
    this.timeout = config.api.timeout;
  }

  /**
   * Get authentication token from localStorage
   */
  getAuthToken() {
    return localStorage.getItem('storePortalToken');
  }

  /**
   * Set authentication token in localStorage
   */
  setAuthToken(token) {
    localStorage.setItem('storePortalToken', token);
  }

  /**
   * Remove authentication token from localStorage
   */
  removeAuthToken() {
    localStorage.removeItem('storePortalToken');
  }

  /**
   * Get headers for API requests
   */
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Make API request with error handling
   */
  async makeRequest(endpoint, options = {}) {
    const url = createApiUrl(endpoint);
    const defaultOptions = {
      headers: this.getHeaders(),
      timeout: this.timeout,
    };

    const requestOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Authentication Methods
   */

  /**
   * Login store user
   */
  async login(email, password) {
    const response = await this.makeRequest('/api/portal/login', {
      method: 'POST',
      headers: this.getHeaders(false), // Don't include auth for login
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.token) {
      this.setAuthToken(response.token);
      return response;
    }

    throw new Error(response.error || 'Login failed');
  }

  /**
   * Logout store user
   */
  logout() {
    this.removeAuthToken();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.getAuthToken();
  }

  /**
   * Dashboard Methods
   */

  /**
   * Get dashboard summary
   */
  async getDashboardSummary() {
    return await this.makeRequest('/api/portal/dashboard-summary');
  }

  /**
   * Get price intelligence report
   */
  async getPriceIntelligence() {
    return await this.makeRequest('/api/portal/price-intelligence');
  }

  /**
   * Get customer demand report
   */
  async getCustomerDemand() {
    return await this.makeRequest('/api/portal/customer-demand');
  }

  /**
   * Product Management Methods
   */

  /**
   * Get store products
   */
  async getMyProducts() {
    return await this.makeRequest('/api/portal/my-products');
  }

  /**
   * Update product price
   */
  async updateProductPrice(productId, price) {
    return await this.makeRequest(`/api/portal/my-products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ price: parseFloat(price) }),
    });
  }

  /**
   * Add new product
   */
  async addProduct(productData) {
    return await this.makeRequest('/api/portal/my-products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }

  /**
   * Delete product
   */
  async deleteProduct(productId) {
    return await this.makeRequest(`/api/portal/my-products/${productId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Analytics Methods
   */

  /**
   * Get search analytics
   */
  async getSearchAnalytics() {
    return await this.makeRequest('/api/portal/search-analytics');
  }

  /**
   * Get competitor analysis
   */
  async getCompetitorAnalysis() {
    return await this.makeRequest('/api/portal/competitor-analysis');
  }

  /**
   * Utility Methods
   */

  /**
   * Test API connection
   */
  async testConnection() {
    try {
      await this.makeRequest('/api/health');
      return true;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }

  /**
   * Get store information
   */
  async getStoreInfo() {
    return await this.makeRequest('/api/portal/store-info');
  }
}

// Create singleton instance
const storePortalApi = new StorePortalApiService();

export default storePortalApi;
