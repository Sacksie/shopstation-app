/**
 * Performance Tests
 * 
 * Tests component rendering performance and optimization
 */

import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

import ComprehensiveAdminPanel from '../components/ComprehensiveAdminPanel';

describe('⚡ Performance Tests', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { products: {}, stores: {} } })
    });
  });

  describe('Component Rendering', () => {
    test('should render authentication screen quickly', () => {
      const startTime = performance.now();
      render(<ComprehensiveAdminPanel />);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(100); // Should render in <100ms
    });

    test('should handle large product lists efficiently', async () => {
      // Mock large dataset
      const largeProductList = {};
      for (let i = 0; i < 1000; i++) {
        largeProductList[`product-${i}`] = {
          displayName: `Product ${i}`,
          category: 'test',
          prices: {}
        };
      }

      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { products: largeProductList, stores: {} }
        })
      });

      const startTime = performance.now();
      render(<ComprehensiveAdminPanel />);
      
      // Authenticate to load data
      const input = screen.getByPlaceholderText(/enter pin or password/i);
      fireEvent.change(input, { target: { value: '050625' } });
      fireEvent.click(screen.getByText('Access Admin Panel'));
      
      await waitFor(() => {
        expect(screen.getByText('Product 0')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should handle 1000 products in <1s
    });
  });

  describe('Memory Usage', () => {
    test('should not leak memory on component unmount', () => {
      const { unmount } = render(<ComprehensiveAdminPanel />);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const initialMemory = process.memoryUsage();
      unmount();
      
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      
      // Memory should not increase significantly
      expect(finalMemory.heapUsed - initialMemory.heapUsed).toBeLessThan(1024 * 1024); // <1MB
    });
  });
});
