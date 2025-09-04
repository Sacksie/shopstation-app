/**
 * Inline Editing Component Tests
 * 
 * Tests the new mobile-first inline editing functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock fetch
global.fetch = jest.fn();

// Mock the ComprehensiveAdminPanel with inline editing
import ComprehensiveAdminPanel from '../components/ComprehensiveAdminPanel';

describe('✏️ Inline Editing System', () => {
  beforeEach(() => {
    fetch.mockClear();
    
    // Mock successful authentication
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });
    
    // Mock inventory data
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          products: {
            'test-milk': {
              displayName: 'Test Milk',
              category: 'dairy',
              prices: {
                'B Kosher': { price: 2.50, unit: '2L' },
                'Tapuach': { price: 2.75, unit: '2L' }
              }
            }
          },
          stores: {
            'B Kosher': { name: 'B Kosher' },
            'Tapuach': { name: 'Tapuach' }
          }
        }
      })
    });
  });

  describe('InlineEditableCell Component', () => {
    test('should render editable cell with value', async () => {
      render(<ComprehensiveAdminPanel />);
      
      // Authenticate first
      const input = screen.getByPlaceholderText(/enter pin or password/i);
      fireEvent.change(input, { target: { value: '050625' } });
      fireEvent.click(screen.getByText('Access Admin Panel'));
      
      await waitFor(() => {
        expect(screen.getByText('Test Milk')).toBeInTheDocument();
      });
    });

    test('should enter edit mode on click', async () => {
      render(<ComprehensiveAdminPanel />);
      
      // Authenticate and load data
      const input = screen.getByPlaceholderText(/enter pin or password/i);
      fireEvent.change(input, { target: { value: '050625' } });
      fireEvent.click(screen.getByText('Access Admin Panel'));
      
      await waitFor(() => {
        const productName = screen.getByText('Test Milk');
        fireEvent.click(productName);
        
        // Should show input field
        expect(screen.getByDisplayValue('Test Milk')).toBeInTheDocument();
      });
    });

    test('should save changes on blur', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      render(<ComprehensiveAdminPanel />);
      
      // Authenticate and load data
      const input = screen.getByPlaceholderText(/enter pin or password/i);
      fireEvent.change(input, { target: { value: '050625' } });
      fireEvent.click(screen.getByText('Access Admin Panel'));
      
      await waitFor(() => {
        const productName = screen.getByText('Test Milk');
        fireEvent.click(productName);
        
        const editInput = screen.getByDisplayValue('Test Milk');
        fireEvent.change(editInput, { target: { value: 'Updated Milk' } });
        fireEvent.blur(editInput);
        
        // Should show success animation
        expect(screen.getByText('Updated Milk')).toBeInTheDocument();
      });
    });
  });

  describe('Quick Price Entry Modal', () => {
    test('should open quick price modal for empty price cells', async () => {
      render(<ComprehensiveAdminPanel />);
      
      // Authenticate and load data
      const input = screen.getByPlaceholderText(/enter pin or password/i);
      fireEvent.change(input, { target: { value: '050625' } });
      fireEvent.click(screen.getByText('Access Admin Panel'));
      
      await waitFor(() => {
        // Find a store without price and click "Add Price"
        const addPriceButton = screen.getByText('+ Add Price');
        fireEvent.click(addPriceButton);
        
        // Should show modal
        expect(screen.getByText('Add Price')).toBeInTheDocument();
      });
    });

    test('should save price through quick modal', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      render(<ComprehensiveAdminPanel />);
      
      // Authenticate and load data
      const input = screen.getByPlaceholderText(/enter pin or password/i);
      fireEvent.change(input, { target: { value: '050625' } });
      fireEvent.click(screen.getByText('Access Admin Panel'));
      
      await waitFor(() => {
        const addPriceButton = screen.getByText('+ Add Price');
        fireEvent.click(addPriceButton);
        
        // Fill in price
        const priceInput = screen.getByPlaceholderText('0.00');
        fireEvent.change(priceInput, { target: { value: '3.99' } });
        
        // Save
        fireEvent.click(screen.getByText('Save Price'));
        
        // Modal should close
        expect(screen.queryByText('Add Price')).not.toBeInTheDocument();
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    test('should show card view on mobile', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<ComprehensiveAdminPanel />);
      
      // Authenticate and load data
      const input = screen.getByPlaceholderText(/enter pin or password/i);
      fireEvent.change(input, { target: { value: '050625' } });
      fireEvent.click(screen.getByText('Access Admin Panel'));
      
      await waitFor(() => {
        // Should show card view button
        expect(screen.getByText('📱 Cards')).toBeInTheDocument();
        
        // Click card view
        fireEvent.click(screen.getByText('📱 Cards'));
        
        // Should show cards instead of table
        expect(screen.getByText('Test Milk')).toBeInTheDocument();
      });
    });

    test('should have touch-friendly button sizes', async () => {
      render(<ComprehensiveAdminPanel />);
      
      // Authenticate and load data
      const input = screen.getByPlaceholderText(/enter pin or password/i);
      fireEvent.change(input, { target: { value: '050625' } });
      fireEvent.click(screen.getByText('Access Admin Panel'));
      
      await waitFor(() => {
        const addPriceButtons = screen.getAllByText('+ Add Price');
        addPriceButtons.forEach(button => {
          expect(button).toHaveClass('min-h-[44px]');
        });
      });
    });
  });
});
