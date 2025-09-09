import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StorePortal from '../components/StorePortal';

// Mock the AuthContext
const mockLogin = jest.fn();
const mockLogout = jest.fn();

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    login: mockLogin,
    logout: mockLogout,
    loading: false,
    error: null
  })
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock the API URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

describe('StorePortal', () => {
  const mockProducts = [
    {
      id: 1,
      name: 'Milk',
      price: 2.5,
      unit: '2 pints',
      in_stock: true
    },
    {
      id: 2,
      name: 'Challah',
      price: 3.5,
      unit: 'loaf',
      in_stock: true
    }
  ];

  const mockDashboardData = {
    storeName: 'Kosher Corner',
    winsTracker: {
      newCustomers: 15,
      reason: 'competitive pricing strategy',
      period: 'this week'
    },
    priceIntelligence: {
      cheapestItems: 8,
      mostExpensiveItems: 3
    },
    demandAnalytics: {
      topSearches: ['milk', 'challah', 'chicken'],
      missedOpportunities: ['organic apples', 'fresh herbs']
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockClear();
    mockLogin.mockClear();
    mockLogout.mockClear();
  });

  describe('Auto-login functionality', () => {
    it('should attempt auto-login for demo user on mount', async () => {
      render(<StorePortal />);
      
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('owner@koshercorner.com', 'password');
      });
    });

    it('should not attempt auto-login if user is already logged in', () => {
      // Mock user being already logged in
      jest.doMock('../contexts/AuthContext', () => ({
        useAuth: () => ({
          user: { id: 1, email: 'owner@koshercorner.com' },
          login: mockLogin,
          logout: mockLogout,
          loading: false,
          error: null
        })
      }));

      render(<StorePortal />);
      
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should not attempt auto-login if auth is loading', () => {
      jest.doMock('../contexts/AuthContext', () => ({
        useAuth: () => ({
          user: null,
          login: mockLogin,
          logout: mockLogout,
          loading: true,
          error: null
        })
      }));

      render(<StorePortal />);
      
      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  describe('Rendering', () => {
    it('should render the store portal with navigation tabs', () => {
      render(<StorePortal />);
      
      expect(screen.getByText('📊 Dashboard')).toBeInTheDocument();
      expect(screen.getByText('🛍️ Product Management')).toBeInTheDocument();
      expect(screen.getByText('💰 Price Intelligence')).toBeInTheDocument();
      expect(screen.getByText('📈 Customer Demand')).toBeInTheDocument();
    });

    it('should start with Dashboard tab active', () => {
      render(<StorePortal />);
      
      expect(screen.getByText('📊 Dashboard')).toHaveClass('bg-green-600');
    });
  });

  describe('Tab Navigation', () => {
    it('should switch to Product Management tab when clicked', async () => {
      const user = userEvent.setup();
      render(<StorePortal />);
      
      const productTab = screen.getByText('🛍️ Product Management');
      await user.click(productTab);
      
      expect(productTab).toHaveClass('bg-green-600');
      expect(screen.getByText('📊 Dashboard')).not.toHaveClass('bg-green-600');
    });

    it('should switch to Price Intelligence tab when clicked', async () => {
      const user = userEvent.setup();
      render(<StorePortal />);
      
      const priceTab = screen.getByText('💰 Price Intelligence');
      await user.click(priceTab);
      
      expect(priceTab).toHaveClass('bg-green-600');
      expect(screen.getByText('📊 Dashboard')).not.toHaveClass('bg-green-600');
    });
  });

  describe('Dashboard', () => {
    beforeEach(() => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDashboardData
      });
    });

    it('should load and display dashboard data', async () => {
      render(<StorePortal />);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(`${API_URL}/api/store-portal/dashboard`);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Kosher Corner')).toBeInTheDocument();
        expect(screen.getByText('15')).toBeInTheDocument(); // new customers
        expect(screen.getByText('8')).toBeInTheDocument(); // cheapest items
        expect(screen.getByText('3')).toBeInTheDocument(); // most expensive items
      });
    });

    it('should display wins tracker information', async () => {
      render(<StorePortal />);
      
      await waitFor(() => {
        expect(screen.getByText('15 new customers')).toBeInTheDocument();
        expect(screen.getByText('competitive pricing strategy')).toBeInTheDocument();
        expect(screen.getByText('this week')).toBeInTheDocument();
      });
    });
  });

  describe('Product Management', () => {
    beforeEach(() => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProducts
      });
    });

    it('should load and display products when tab is active', async () => {
      const user = userEvent.setup();
      render(<StorePortal />);
      
      const productTab = screen.getByText('🛍️ Product Management');
      await user.click(productTab);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(`${API_URL}/api/store-portal/products`);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Milk')).toBeInTheDocument();
        expect(screen.getByText('Challah')).toBeInTheDocument();
        expect(screen.getByText('2.5')).toBeInTheDocument();
        expect(screen.getByText('3.5')).toBeInTheDocument();
      });
    });

    it('should allow price updates', async () => {
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

      render(<StorePortal />);
      
      const productTab = screen.getByText('🛍️ Product Management');
      await user.click(productTab);
      
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
          `${API_URL}/api/store-portal/products/1/price`,
          expect.objectContaining({
            method: 'PUT',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              'Authorization': expect.any(String)
            }),
            body: expect.stringContaining('"price":2.99')
          })
        );
      });
    });

    it('should handle stock status updates', async () => {
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

      render(<StorePortal />);
      
      const productTab = screen.getByText('🛍️ Product Management');
      await user.click(productTab);
      
      await waitFor(() => {
        expect(screen.getByText('Milk')).toBeInTheDocument();
      });

      // Find and click the stock status toggle
      const stockToggle = screen.getByRole('checkbox', { name: /stock status/i });
      await user.click(stockToggle);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          `${API_URL}/api/store-portal/products/1/stock`,
          expect.objectContaining({
            method: 'PUT',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              'Authorization': expect.any(String)
            }),
            body: expect.stringContaining('"in_stock":false')
          })
        );
      });
    });
  });

  describe('Price Intelligence', () => {
    const mockPriceReport = {
      keyItems: [
        {
          id: 1,
          name: 'Milk',
          category: 'dairy',
          myPrice: 2.5,
          competitors: {
            'Tapuach': 2.75,
            'Kosher Kingdom': 2.4
          }
        }
      ]
    };

    beforeEach(() => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockPriceReport
      });
    });

    it('should load and display competitive price report', async () => {
      const user = userEvent.setup();
      render(<StorePortal />);
      
      const priceTab = screen.getByText('💰 Price Intelligence');
      await user.click(priceTab);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(`${API_URL}/api/store-portal/price-intelligence`);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Milk')).toBeInTheDocument();
        expect(screen.getByText('2.5')).toBeInTheDocument(); // my price
        expect(screen.getByText('2.75')).toBeInTheDocument(); // competitor price
        expect(screen.getByText('2.4')).toBeInTheDocument(); // competitor price
      });
    });

    it('should highlight competitive advantages', async () => {
      const user = userEvent.setup();
      render(<StorePortal />);
      
      const priceTab = screen.getByText('💰 Price Intelligence');
      await user.click(priceTab);
      
      await waitFor(() => {
        expect(screen.getByText('Milk')).toBeInTheDocument();
      });

      // Check if competitive advantage is highlighted
      const myPriceElement = screen.getByText('2.5');
      expect(myPriceElement).toHaveClass('text-green-600'); // Assuming cheaper prices are green
    });
  });

  describe('Customer Demand', () => {
    const mockDemandReport = {
      topSearches: [
        { term: 'milk', searches: 150, conversionRate: 0.65 },
        { term: 'challah', searches: 120, conversionRate: 0.58 }
      ],
      missedOpportunities: [
        { term: 'organic apples', searches: 45 },
        { term: 'fresh herbs', searches: 32 }
      ],
      peakTimes: [
        { day: 'Thursday', hour: '6 PM', activity: 95 },
        { day: 'Friday', hour: '11 AM', activity: 88 }
      ]
    };

    beforeEach(() => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDemandReport
      });
    });

    it('should load and display customer demand report', async () => {
      const user = userEvent.setup();
      render(<StorePortal />);
      
      const demandTab = screen.getByText('📈 Customer Demand');
      await user.click(demandTab);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(`${API_URL}/api/store-portal/customer-demand`);
      });
      
      await waitFor(() => {
        expect(screen.getByText('milk')).toBeInTheDocument();
        expect(screen.getByText('challah')).toBeInTheDocument();
        expect(screen.getByText('organic apples')).toBeInTheDocument();
        expect(screen.getByText('fresh herbs')).toBeInTheDocument();
      });
    });

    it('should display search statistics', async () => {
      const user = userEvent.setup();
      render(<StorePortal />);
      
      const demandTab = screen.getByText('📈 Customer Demand');
      await user.click(demandTab);
      
      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument(); // milk searches
        expect(screen.getByText('120')).toBeInTheDocument(); // challah searches
        expect(screen.getByText('65%')).toBeInTheDocument(); // conversion rate
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API call fails', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));
      
      render(<StorePortal />);
      
      await waitFor(() => {
        expect(screen.getByText(/error loading dashboard/i)).toBeInTheDocument();
      });
    });

    it('should display error message when product update fails', async () => {
      const user = userEvent.setup();
      
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockProducts
        })
        .mockRejectedValueOnce(new Error('Update failed'));

      render(<StorePortal />);
      
      const productTab = screen.getByText('🛍️ Product Management');
      await user.click(productTab);
      
      await waitFor(() => {
        expect(screen.getByText('Milk')).toBeInTheDocument();
      });

      const priceCell = screen.getByText('2.5');
      await user.doubleClick(priceCell);
      
      const input = screen.getByDisplayValue('2.5');
      await user.clear(input);
      await user.type(input, '2.99');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText(/update failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner while fetching dashboard data', () => {
      fetch.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<StorePortal />);
      
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should show loading state during product updates', async () => {
      const user = userEvent.setup();
      
      fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockProducts
        })
        .mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<StorePortal />);
      
      const productTab = screen.getByText('🛍️ Product Management');
      await user.click(productTab);
      
      await waitFor(() => {
        expect(screen.getByText('Milk')).toBeInTheDocument();
      });

      const priceCell = screen.getByText('2.5');
      await user.doubleClick(priceCell);
      
      const input = screen.getByDisplayValue('2.5');
      await user.clear(input);
      await user.type(input, '2.99');
      await user.keyboard('{Enter}');

      expect(screen.getByText(/updating/i)).toBeInTheDocument();
    });
  });
});
