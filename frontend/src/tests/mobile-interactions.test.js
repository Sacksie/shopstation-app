/**
 * Mobile Interaction Tests
 * 
 * Tests touch-friendly interactions and mobile-specific features
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock mobile viewport
const mockMobileViewport = () => {
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
};

import ComprehensiveAdminPanel from '../components/ComprehensiveAdminPanel';

describe('📱 Mobile Interactions', () => {
  beforeEach(() => {
    mockMobileViewport();
    global.fetch = jest.fn();
    
    // Mock authentication and data
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { products: {}, stores: {} } })
    });
  });

  describe('Touch Target Sizes', () => {
    test('should have minimum 44px touch targets', async () => {
      render(<ComprehensiveAdminPanel />);
      
      // Authenticate
      const input = screen.getByPlaceholderText(/enter pin or password/i);
      fireEvent.change(input, { target: { value: '050625' } });
      fireEvent.click(screen.getByText('Access Admin Panel'));
      
      await waitFor(() => {
        // Check button sizes
        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          const styles = window.getComputedStyle(button);
          const height = parseInt(styles.height);
          expect(height).toBeGreaterThanOrEqual(44);
        });
      });
    });

    test('should have large input fields for mobile', async () => {
      render(<ComprehensiveAdminPanel />);
      
      const input = screen.getByPlaceholderText(/enter pin or password/i);
      expect(input).toHaveClass('py-3', 'text-lg');
    });
  });

  describe('Mobile Navigation', () => {
    test('should show mobile-optimized navigation tabs', async () => {
      render(<ComprehensiveAdminPanel />);
      
      // Authenticate
      const input = screen.getByPlaceholderText(/enter pin or password/i);
      fireEvent.change(input, { target: { value: '050625' } });
      fireEvent.click(screen.getByText('Access Admin Panel'));
      
      await waitFor(() => {
        // Should show short names for mobile
        expect(screen.getByText('Products')).toBeInTheDocument();
        expect(screen.getByText('Stats')).toBeInTheDocument();
        expect(screen.getByText('Add')).toBeInTheDocument();
      });
    });

    test('should switch to card view on mobile', async () => {
      render(<ComprehensiveAdminPanel />);
      
      // Authenticate
      const input = screen.getByPlaceholderText(/enter pin or password/i);
      fireEvent.change(input, { target: { value: '050625' } });
      fireEvent.click(screen.getByText('Access Admin Panel'));
      
      await waitFor(() => {
        // Click card view
        fireEvent.click(screen.getByText('📱 Cards'));
        
        // Should show card view
        expect(screen.getByText('📱 Cards')).toHaveClass('bg-blue-600');
      });
    });
  });

  describe('Responsive Design', () => {
    test('should adapt to different screen sizes', async () => {
      // Test tablet size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(<ComprehensiveAdminPanel />);
      
      // Authenticate
      const input = screen.getByPlaceholderText(/enter pin or password/i);
      fireEvent.change(input, { target: { value: '050625' } });
      fireEvent.click(screen.getByText('Access Admin Panel'));
      
      await waitFor(() => {
        // Should show full tab names on tablet
        expect(screen.getByText('Inventory')).toBeInTheDocument();
        expect(screen.getByText('Analytics')).toBeInTheDocument();
      });
    });
  });
});
