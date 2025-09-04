/**
 * Auto-complete and Validation Tests
 * 
 * Tests the new auto-complete and validation features
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock fetch
global.fetch = jest.fn();

import ComprehensiveAdminPanel from '../components/ComprehensiveAdminPanel';

describe('🔍 Auto-complete and Validation', () => {
  beforeEach(() => {
    fetch.mockClear();
    
    // Mock authentication
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });
    
    // Mock inventory for suggestions
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          products: {
            'milk-2l': { displayName: 'Milk 2L' },
            'milk-1l': { displayName: 'Milk 1L' },
            'bread-white': { displayName: 'White Bread' }
          }
        }
      })
    });
  });

  describe('Product Name Auto-complete', () => {
    test('should show suggestions when typing product name', async () => {
      render(<ComprehensiveAdminPanel />);
      
      // Authenticate
      const input = screen.getByPlaceholderText(/enter pin or password/i);
      fireEvent.change(input, { target: { value: '050625' } });
      fireEvent.click(screen.getByText('Access Admin Panel'));
      
      await waitFor(() => {
        // Go to Add Products tab
        fireEvent.click(screen.getByText('Add Products'));
        
        // Type in product name
        const productInput = screen.getByPlaceholderText(/enter product name/i);
        fireEvent.change(productInput, { target: { value: 'milk' } });
        
        // Should show suggestions
        expect(screen.getByText('Milk 2L')).toBeInTheDocument();
        expect(screen.getByText('Milk 1L')).toBeInTheDocument();
      });
    });

    test('should select suggestion on click', async () => {
      render(<ComprehensiveAdminPanel />);
      
      // Authenticate and navigate to add products
      const input = screen.getByPlaceholderText(/enter pin or password/i);
      fireEvent.change(input, { target: { value: '050625' } });
      fireEvent.click(screen.getByText('Access Admin Panel'));
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Add Products'));
        
        const productInput = screen.getByPlaceholderText(/enter product name/i);
        fireEvent.change(productInput, { target: { value: 'milk' } });
        
        // Click suggestion
        fireEvent.click(screen.getByText('Milk 2L'));
        
        // Input should be filled
        expect(productInput).toHaveValue('Milk 2L');
      });
    });
  });

  describe('Form Validation', () => {
    test('should validate required fields', async () => {
      render(<ComprehensiveAdminPanel />);
      
      // Authenticate and navigate to add products
      const input = screen.getByPlaceholderText(/enter pin or password/i);
      fireEvent.change(input, { target: { value: '050625' } });
      fireEvent.click(screen.getByText('Access Admin Panel'));
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Add Products'));
        
        // Try to submit without product name
        fireEvent.click(screen.getByText('Add Product'));
        
        // Should show validation error
        expect(screen.getByText('Product name is required')).toBeInTheDocument();
      });
    });

    test('should validate price format', async () => {
      render(<ComprehensiveAdminPanel />);
      
      // Authenticate and navigate to add products
      const input = screen.getByPlaceholderText(/enter pin or password/i);
      fireEvent.change(input, { target: { value: '050625' } });
      fireEvent.click(screen.getByText('Access Admin Panel'));
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Add Products'));
        
        // Add product name
        const productInput = screen.getByPlaceholderText(/enter product name/i);
        fireEvent.change(productInput, { target: { value: 'Test Product' } });
        
        // Add invalid price
        const priceInput = screen.getByPlaceholderText('Price (£)');
        fireEvent.change(priceInput, { target: { value: 'invalid' } });
        
        // Try to submit
        fireEvent.click(screen.getByText('Add Product'));
        
        // Should show validation error
        expect(screen.getByText('Invalid price')).toBeInTheDocument();
      });
    });
  });

  describe('Success Feedback', () => {
    test('should show success message after adding product', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      render(<ComprehensiveAdminPanel />);
      
      // Authenticate and navigate to add products
      const input = screen.getByPlaceholderText(/enter pin or password/i);
      fireEvent.change(input, { target: { value: '050625' } });
      fireEvent.click(screen.getByText('Access Admin Panel'));
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Add Products'));
        
        // Fill form
        const productInput = screen.getByPlaceholderText(/enter product name/i);
        fireEvent.change(productInput, { target: { value: 'Test Product' } });
        
        const priceInput = screen.getByPlaceholderText('Price (£)');
        fireEvent.change(priceInput, { target: { value: '3.99' } });
        
        // Submit
        fireEvent.click(screen.getByText('Add Product'));
        
        // Should show success message
        await waitFor(() => {
          expect(screen.getByText(/product.*added successfully/i)).toBeInTheDocument();
        });
      });
    });
  });
});
