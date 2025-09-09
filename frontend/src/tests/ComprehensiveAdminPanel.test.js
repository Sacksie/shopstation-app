import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ComprehensiveAdminPanel from '../components/ComprehensiveAdminPanel';

// Mock fetch globally
global.fetch = jest.fn();

// Mock the API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

describe('ComprehensiveAdminPanel', () => {
  const mockProducts = [
    {
      id: 1,
      name: 'Milk',
      slug: 'milk',
      category_name: 'dairy',
      prices: [
        { store_name: 'B Kosher', price: 2.5, unit: '2 pints' },
        { store_name: 'Tapuach', price: 2.75, unit: '2 pints' }
      ]
    }
  ];

  const mockBackups = [
    {
      filename: 'backup-2025-01-01T00-00-00-manual.sql',
      size: 1024,
      created: new Date('2025-01-01T00:00:00Z')
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
  });

  describe('Rendering', () => {
    it('should render the admin panel with navigation tabs', () => {
      render(<ComprehensiveAdminPanel />);
      
      expect(screen.getByText('📊 Inventory Management')).toBeInTheDocument();
      expect(screen.getByText('➕ Add Product')).toBeInTheDocument();
      expect(screen.getByText('💾 Backup & Restore')).toBeInTheDocument();
      expect(screen.getByText('📈 Analytics')).toBeInTheDocument();
    });

    it('should start with Inventory tab active', () => {
      render(<ComprehensiveAdminPanel />);
      
      expect(screen.getByText('📊 Inventory Management')).toHaveClass('bg-blue-600');
    });
  });

  describe('Tab Navigation', () => {
    it('should switch to Add Product tab when clicked', async () => {
      const user = userEvent.setup();
      render(<ComprehensiveAdminPanel />);
      
      const addProductTab = screen.getByText('➕ Add Product');
      await user.click(addProductTab);
      
      expect(addProductTab).toHaveClass('bg-blue-600');
      expect(screen.getByText('📊 Inventory Management')).not.toHaveClass('bg-blue-600');
    });

    it('should switch to Backup & Restore tab when clicked', async () => {
      const user = userEvent.setup();
      render(<ComprehensiveAdminPanel />);
      
      const backupTab = screen.getByText('💾 Backup & Restore');
      await user.click(backupTab);
      
      expect(backupTab).toHaveClass('bg-blue-600');
      expect(screen.getByText('📊 Inventory Management')).not.toHaveClass('bg-blue-600');
    });
  });

  describe('Inventory Management', () => {
    beforeEach(() => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProducts
      });
    });

    it('should load and display products', async () => {
      render(<ComprehensiveAdminPanel />);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(`${API_URL}/api/products`);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Milk')).toBeInTheDocument();
        expect(screen.getByText('B Kosher')).toBeInTheDocument();
        expect(screen.getByText('Tapuach')).toBeInTheDocument();
      });
    });

    it('should handle price updates', async () => {
      const user = userEvent.setup();
      
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockProducts
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true })
        });

      render(<ComprehensiveAdminPanel />);
      
      await waitFor(() => {
        expect(screen.getByText('Milk')).toBeInTheDocument();
      });

      // Find and click on a price cell to edit
      const priceCell = screen.getByText('2.5');
      await user.doubleClick(priceCell);
      
      // Type new price
      const input = screen.getByDisplayValue('2.5');
      await user.clear(input);
      await user.type(input, '2.99');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          `${API_URL}/api/manual/add-price`,
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              'x-admin-password': expect.any(String)
            }),
            body: expect.stringContaining('"price":2.99')
          })
        );
      });
    });

    it('should handle search functionality', async () => {
      const user = userEvent.setup();
      
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockProducts
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [mockProducts[0]]
        });

      render(<ComprehensiveAdminPanel />);
      
      await waitFor(() => {
        expect(screen.getByText('Milk')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search products...');
      await user.type(searchInput, 'milk');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(`${API_URL}/api/products/search?q=milk`);
      });
    });
  });

  describe('Add Product', () => {
    it('should render add product form when tab is active', async () => {
      const user = userEvent.setup();
      render(<ComprehensiveAdminPanel />);
      
      const addProductTab = screen.getByText('➕ Add Product');
      await user.click(addProductTab);
      
      expect(screen.getByLabelText('Product Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Category')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add Product' })).toBeInTheDocument();
    });

    it('should submit new product form', async () => {
      const user = userEvent.setup();
      
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, id: 2 })
      });

      render(<ComprehensiveAdminPanel />);
      
      const addProductTab = screen.getByText('➕ Add Product');
      await user.click(addProductTab);
      
      const nameInput = screen.getByLabelText('Product Name');
      const categorySelect = screen.getByLabelText('Category');
      const submitButton = screen.getByRole('button', { name: 'Add Product' });
      
      await user.type(nameInput, 'New Product');
      await user.selectOptions(categorySelect, 'dairy');
      await user.click(submitButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          `${API_URL}/api/manual/add-product`,
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              'x-admin-password': expect.any(String)
            }),
            body: expect.stringContaining('"name":"New Product"')
          })
        );
      });
    });

    it('should show validation errors for empty form', async () => {
      const user = userEvent.setup();
      render(<ComprehensiveAdminPanel />);
      
      const addProductTab = screen.getByText('➕ Add Product');
      await user.click(addProductTab);
      
      const submitButton = screen.getByRole('button', { name: 'Add Product' });
      await user.click(submitButton);
      
      expect(screen.getByText('Product name is required')).toBeInTheDocument();
    });
  });

  describe('Backup & Restore', () => {
    beforeEach(() => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, backups: mockBackups })
      });
    });

    it('should load and display backup list', async () => {
      const user = userEvent.setup();
      render(<ComprehensiveAdminPanel />);
      
      const backupTab = screen.getByText('💾 Backup & Restore');
      await user.click(backupTab);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(`${API_URL}/api/backup/list`);
      });
      
      await waitFor(() => {
        expect(screen.getByText('backup-2025-01-01T00-00-00-manual.sql')).toBeInTheDocument();
      });
    });

    it('should create manual backup', async () => {
      const user = userEvent.setup();
      
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, backups: mockBackups })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, message: 'Backup created successfully' })
        });

      render(<ComprehensiveAdminPanel />);
      
      const backupTab = screen.getByText('💾 Backup & Restore');
      await user.click(backupTab);
      
      await waitFor(() => {
        expect(screen.getByText('backup-2025-01-01T00-00-00-manual.sql')).toBeInTheDocument();
      });

      const createBackupButton = screen.getByRole('button', { name: /create backup/i });
      await user.click(createBackupButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          `${API_URL}/api/backup/create`,
          expect.objectContaining({
            method: 'POST'
          })
        );
      });
    });

    it('should restore from latest backup', async () => {
      const user = userEvent.setup();
      
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, backups: mockBackups })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, message: 'Database restored successfully' })
        });

      render(<ComprehensiveAdminPanel />);
      
      const backupTab = screen.getByText('💾 Backup & Restore');
      await user.click(backupTab);
      
      await waitFor(() => {
        expect(screen.getByText('backup-2025-01-01T00-00-00-manual.sql')).toBeInTheDocument();
      });

      const restoreButton = screen.getByRole('button', { name: /restore latest/i });
      await user.click(restoreButton);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          `${API_URL}/api/backup/restore-latest`,
          expect.objectContaining({
            method: 'POST'
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API call fails', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));
      
      render(<ComprehensiveAdminPanel />);
      
      await waitFor(() => {
        expect(screen.getByText(/error loading products/i)).toBeInTheDocument();
      });
    });

    it('should display error message when backup creation fails', async () => {
      const user = userEvent.setup();
      
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, backups: mockBackups })
        })
        .mockRejectedValueOnce(new Error('Backup failed'));

      render(<ComprehensiveAdminPanel />);
      
      const backupTab = screen.getByText('💾 Backup & Restore');
      await user.click(backupTab);
      
      await waitFor(() => {
        expect(screen.getByText('backup-2025-01-01T00-00-00-manual.sql')).toBeInTheDocument();
      });

      const createBackupButton = screen.getByRole('button', { name: /create backup/i });
      await user.click(createBackupButton);

      await waitFor(() => {
        expect(screen.getByText(/backup creation failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner while fetching products', () => {
      fetch.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<ComprehensiveAdminPanel />);
      
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should show loading state during backup creation', async () => {
      const user = userEvent.setup();
      
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, backups: mockBackups })
        })
        .mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<ComprehensiveAdminPanel />);
      
      const backupTab = screen.getByText('💾 Backup & Restore');
      await user.click(backupTab);
      
      await waitFor(() => {
        expect(screen.getByText('backup-2025-01-01T00-00-00-manual.sql')).toBeInTheDocument();
      });

      const createBackupButton = screen.getByRole('button', { name: /create backup/i });
      await user.click(createBackupButton);

      expect(screen.getByText(/creating backup/i)).toBeInTheDocument();
    });
  });
});
