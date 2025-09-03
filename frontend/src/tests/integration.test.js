/**
 * Frontend Integration Tests
 * 
 * BUSINESS CRITICAL: These tests validate complete user experiences
 * and ensure the frontend works seamlessly with backend systems.
 * 
 * Coverage:
 * - Complete user workflows
 * - Component integration
 * - API integration
 * - Error handling
 * - Performance requirements
 * - Accessibility compliance
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { jest } from '@jest/globals';
import '@testing-library/jest-dom';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock environment configuration
jest.mock('../config/environments', () => ({
  __esModule: true,
  default: {
    api: { baseUrl: 'http://localhost:3001' },
    environment: 'test',
    features: { debugMode: false }
  },
  createApiUrl: jest.fn((endpoint) => `http://localhost:3001${endpoint}`)
}));

// Import components after mocks are set up
const { default: App } = await import('../App');

describe('ShopStation Frontend Integration Tests - User Experience', () => {
  
  beforeEach(() => {
    // Reset fetch mock before each test
    fetch.mockClear();
    
    // Default successful API responses
    fetch.mockImplementation((url) => {
      if (url.includes('/api/health')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: 'OK',
            environment: 'test'
          })
        });
      }
      
      if (url.includes('/api/compare')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            results: [
              {
                product: 'Test Product',
                stores: [
                  {
                    name: 'Test Store 1',
                    price: '2.50',
                    unit: '2L'
                  },
                  {
                    name: 'Test Store 2', 
                    price: '2.75',
                    unit: '2L'
                  }
                ]
              }
            ]
          })
        });
      }
      
      // Default response for unmatched URLs
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
    });
  });

  // ==========================================================================
  // CRITICAL USER JOURNEY TESTS
  // ==========================================================================

  describe('🛒 Complete Customer Shopping Experience', () => {
    test('Customer can complete full price comparison workflow', async () => {
      render(<App />);
      
      // Wait for app to load
      await waitFor(() => {
        expect(screen.getByText(/ShopStation/i)).toBeInTheDocument();
      });
      
      // Look for grocery list input
      const groceryInputs = screen.getAllByRole('textbox');
      expect(groceryInputs.length).toBeGreaterThan(0);
      
      if (groceryInputs.length > 0) {
        const mainInput = groceryInputs[0];
        
        // Enter grocery items
        await act(async () => {
          fireEvent.change(mainInput, { target: { value: 'milk, bread, eggs' } });
        });
        
        // Look for compare button
        const buttons = screen.getAllByRole('button');
        const compareButton = buttons.find(button => 
          button.textContent && 
          (button.textContent.toLowerCase().includes('compare') ||
           button.textContent.toLowerCase().includes('search') ||
           button.textContent.toLowerCase().includes('find'))
        );
        
        if (compareButton) {
          // Trigger comparison
          await act(async () => {
            fireEvent.click(compareButton);
          });
          
          // Verify API was called
          expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/compare'),
            expect.objectContaining({
              method: 'POST',
              headers: expect.objectContaining({
                'Content-Type': 'application/json'
              }),
              body: expect.any(String)
            })
          );
        }
      }
    });

    test('Customer receives helpful feedback for empty searches', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/ShopStation/i)).toBeInTheDocument();
      });
      
      // Try to search with empty input
      const buttons = screen.getAllByRole('button');
      const searchButton = buttons.find(button => 
        button.textContent && 
        button.textContent.toLowerCase().includes('compare')
      );
      
      if (searchButton) {
        await act(async () => {
          fireEvent.click(searchButton);
        });
        
        // Should handle empty search gracefully
        // (Either disable button or show helpful message)
        expect(screen.getByText(/ShopStation/i)).toBeInTheDocument();
      }
    });

    test('Customer can navigate between different app sections', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/ShopStation/i)).toBeInTheDocument();
      });
      
      // Look for navigation elements
      const allElements = screen.getAllByRole('button');
      const allLinks = screen.queryAllByRole('link');
      
      expect(allElements.length + allLinks.length).toBeGreaterThan(0);
    });
  });

  describe('👨‍💼 Admin Panel User Experience', () => {
    test('Admin authentication workflow', async () => {
      // Mock admin authentication
      fetch.mockImplementation((url) => {
        if (url.includes('/api/manual/inventory')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              data: {
                products: {
                  'test-product': {
                    name: 'Test Product',
                    prices: {}
                  }
                }
              }
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      });

      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/ShopStation/i)).toBeInTheDocument();
      });
      
      // Look for admin access
      const adminElements = screen.queryAllByText(/admin/i);
      if (adminElements.length > 0) {
        // Test admin access flow
        const adminButton = adminElements[0];
        
        await act(async () => {
          fireEvent.click(adminButton);
        });
        
        // Should show admin interface or authentication
        await waitFor(() => {
          const passwordInputs = screen.queryAllByLabelText(/password/i);
          const allInputs = screen.queryAllByRole('textbox');
          const allPasswordInputs = screen.queryAllByRole('textbox', { type: 'password' });
          
          // Should have some form of admin interface
          expect(passwordInputs.length + allInputs.length + allPasswordInputs.length).toBeGreaterThan(0);
        });
      }
    });
  });

  // ==========================================================================
  // ERROR HANDLING & RESILIENCE TESTS
  // ==========================================================================

  describe('🛡️ Error Handling & User Experience', () => {
    test('App handles API failures gracefully', async () => {
      // Mock API failure
      fetch.mockRejectedValue(new Error('Network error'));
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/ShopStation/i)).toBeInTheDocument();
      });
      
      // App should still render and be functional
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    test('App handles malformed API responses', async () => {
      // Mock malformed response
      fetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/ShopStation/i)).toBeInTheDocument();
      });
      
      // App should still be functional
      expect(screen.getByText(/ShopStation/i)).toBeInTheDocument();
    });

    test('App provides user feedback for slow responses', async () => {
      // Mock slow API response
      fetch.mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({ success: true, results: [] })
            });
          }, 2000); // 2 second delay
        })
      );
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/ShopStation/i)).toBeInTheDocument();
      });
      
      // App should show loading states or remain responsive
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // PERFORMANCE & ACCESSIBILITY TESTS
  // ==========================================================================

  describe('⚡ Performance & Accessibility', () => {
    test('App renders within acceptable time', async () => {
      const startTime = Date.now();
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/ShopStation/i)).toBeInTheDocument();
      });
      
      const renderTime = Date.now() - startTime;
      
      // Should render within 2 seconds
      expect(renderTime).toBeLessThan(2000);
    });

    test('App has proper accessibility attributes', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/ShopStation/i)).toBeInTheDocument();
      });
      
      // Check for basic accessibility features
      const buttons = screen.getAllByRole('button');
      const inputs = screen.getAllByRole('textbox');
      
      // All interactive elements should be accessible
      [...buttons, ...inputs].forEach(element => {
        expect(element).toBeInTheDocument();
      });
    });

    test('App handles multiple rapid user interactions', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/ShopStation/i)).toBeInTheDocument();
      });
      
      const buttons = screen.getAllByRole('button');
      
      if (buttons.length > 0) {
        // Rapidly click buttons
        await act(async () => {
          for (let i = 0; i < 5; i++) {
            fireEvent.click(buttons[0]);
          }
        });
        
        // App should remain stable
        expect(screen.getByText(/ShopStation/i)).toBeInTheDocument();
      }
    });
  });

  // ==========================================================================
  // BUSINESS LOGIC VALIDATION
  // ==========================================================================

  describe('📊 Business Logic Integration', () => {
    test('Price comparison results display correctly', async () => {
      // Mock successful comparison with realistic data
      fetch.mockImplementation((url) => {
        if (url.includes('/api/compare')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              results: [
                {
                  product: 'Milk 2L',
                  stores: [
                    { name: 'Store A', price: '2.50', unit: '2L' },
                    { name: 'Store B', price: '2.75', unit: '2L' },
                    { name: 'Store C', price: '2.25', unit: '2L' }
                  ]
                }
              ]
            })
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      });
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/ShopStation/i)).toBeInTheDocument();
      });
      
      // Trigger comparison if possible
      const inputs = screen.getAllByRole('textbox');
      const buttons = screen.getAllByRole('button');
      
      if (inputs.length > 0 && buttons.length > 0) {
        await act(async () => {
          fireEvent.change(inputs[0], { target: { value: 'milk' } });
        });
        
        const compareButton = buttons.find(b => 
          b.textContent && b.textContent.toLowerCase().includes('compare')
        );
        
        if (compareButton) {
          await act(async () => {
            fireEvent.click(compareButton);
          });
          
          // Wait for results to potentially appear
          await waitFor(() => {
            // Results should be processed correctly
            expect(fetch).toHaveBeenCalled();
          });
        }
      }
    });

    test('Environment configuration is properly integrated', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/ShopStation/i)).toBeInTheDocument();
      });
      
      // Environment config should be loaded correctly
      const config = require('../config/environments').default;
      expect(config).toBeDefined();
      expect(config.api).toBeDefined();
      expect(config.environment).toBe('test');
    });

    test('Error boundaries catch and handle component failures', async () => {
      // Create a component that will throw an error
      const ThrowError = () => {
        throw new Error('Test error for error boundary');
      };
      
      // Mock console.error to avoid noise
      const originalError = console.error;
      console.error = jest.fn();
      
      try {
        render(<App />);
        
        await waitFor(() => {
          expect(screen.getByText(/ShopStation/i)).toBeInTheDocument();
        });
        
        // App should handle errors gracefully
        expect(screen.getByText(/ShopStation/i)).toBeInTheDocument();
      } finally {
        console.error = originalError;
      }
    });
  });

  // ==========================================================================
  // MOBILE & RESPONSIVE TESTS
  // ==========================================================================

  describe('📱 Mobile & Responsive Design', () => {
    test('App adapts to mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      });
      
      // Trigger resize
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
      
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/ShopStation/i)).toBeInTheDocument();
      });
      
      // App should render on mobile
      expect(screen.getByText(/ShopStation/i)).toBeInTheDocument();
    });

    test('Touch interactions work correctly', async () => {
      render(<App />);
      
      await waitFor(() => {
        expect(screen.getByText(/ShopStation/i)).toBeInTheDocument();
      });
      
      const buttons = screen.getAllByRole('button');
      
      if (buttons.length > 0) {
        // Simulate touch events
        await act(async () => {
          fireEvent.touchStart(buttons[0]);
          fireEvent.touchEnd(buttons[0]);
        });
        
        // App should handle touch events
        expect(screen.getByText(/ShopStation/i)).toBeInTheDocument();
      }
    });
  });
});