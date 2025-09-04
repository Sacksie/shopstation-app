/**
 * Authentication Component Tests
 * 
 * Tests the new PIN-based authentication UI components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock fetch
global.fetch = jest.fn();

// Mock environment config
jest.mock('../config/environments', () => ({
  __esModule: true,
  default: {
    api: { baseUrl: 'http://localhost:3001' }
  }
}));

import ComprehensiveAdminPanel from '../components/ComprehensiveAdminPanel';

describe('🔐 Authentication Components', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('PIN Input Detection', () => {
    test('should detect PIN input and change input type', async () => {
      render(<ComprehensiveAdminPanel />);
      
      const input = screen.getByPlaceholderText(/enter pin or password/i);
      
      // Type a PIN
      fireEvent.change(input, { target: { value: '050625' } });
      
      // Should show PIN detected
      expect(screen.getByText('PIN detected')).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
    });

    test('should switch back to password for non-PIN input', async () => {
      render(<ComprehensiveAdminPanel />);
      
      const input = screen.getByPlaceholderText(/enter pin or password/i);
      
      // Type a password
      fireEvent.change(input, { target: { value: 'test123' } });
      
      expect(input).toHaveAttribute('type', 'password');
      expect(screen.queryByText('PIN detected')).not.toBeInTheDocument();
    });
  });

  describe('PIN Authentication Flow', () => {
    test('should authenticate with valid PIN 050625', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      render(<ComprehensiveAdminPanel />);
      
      const input = screen.getByPlaceholderText(/enter pin or password/i);
      const submitButton = screen.getByText('Access Admin Panel');
      
      fireEvent.change(input, { target: { value: '050625' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          'http://localhost:3001/api/manual/inventory',
          expect.objectContaining({
            headers: { 'x-admin-password': '050625' }
          })
        );
      });
    });

    test('should show failsafe option after 2 failed PIN attempts', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      render(<ComprehensiveAdminPanel />);
      
      const input = screen.getByPlaceholderText(/enter pin or password/i);
      const submitButton = screen.getByText('Access Admin Panel');
      
      // First failed attempt
      fireEvent.change(input, { target: { value: '123456' } });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/invalid pin/i)).toBeInTheDocument();
      });

      // Second failed attempt
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/failsafe access/i)).toBeInTheDocument();
        expect(screen.getByText('test123')).toBeInTheDocument();
      });
    });
  });

  describe('Visual Feedback', () => {
    test('should show valid PINs in UI', () => {
      render(<ComprehensiveAdminPanel />);
      
      expect(screen.getByText('050625 • 331919')).toBeInTheDocument();
    });

    test('should show mobile-optimized styling', () => {
      render(<ComprehensiveAdminPanel />);
      
      const input = screen.getByPlaceholderText(/enter pin or password/i);
      expect(input).toHaveClass('text-center', 'text-lg', 'font-mono');
    });
  });
});
