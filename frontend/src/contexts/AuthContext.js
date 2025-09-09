/**
 * Authentication Context for Store Portal
 * 
 * Manages authentication state and provides login/logout functionality
 * for store owners and managers.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import storePortalApi from '../services/storePortalApi';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Check if user is authenticated on app load
   */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (storePortalApi.isAuthenticated()) {
          // Try to get store info to validate token
          const storeInfo = await storePortalApi.getStoreInfo();
          if (storeInfo.success) {
            setUser(storeInfo.data);
          } else {
            // Token is invalid, remove it
            storePortalApi.logout();
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        storePortalApi.logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  /**
   * Login function
   */
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await storePortalApi.login(email, password);
      
      if (response.success) {
        setUser(response.user);
        return { success: true };
      } else {
        setError(response.error || 'Login failed');
        return { success: false, error: response.error };
      }
    } catch (error) {
      const errorMessage = error.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout function
   */
  const logout = () => {
    storePortalApi.logout();
    setUser(null);
    setError(null);
  };

  /**
   * Clear error
   */
  const clearError = () => {
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    clearError,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
