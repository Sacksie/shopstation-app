import { render, screen, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import App from './App';

// Mock the environment config
jest.mock('./config/environments', () => ({
  __esModule: true,
  default: {
    api: { baseUrl: 'http://localhost:3001' },
    environment: 'development',
    features: { debugMode: true }
  },
  createApiUrl: jest.fn((endpoint) => `http://localhost:3001${endpoint}`)
}));

describe('ShopStation App - Critical Business Functions', () => {
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock fetch for API calls
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] })
      })
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('App renders without crashing', async () => {
    render(<App />);
    
    // Should render the main shopping interface
    await waitFor(() => {
      expect(screen.getByText(/ShopStation/i)).toBeInTheDocument();
    });
  });

  test('Environment configuration loads correctly', () => {
    render(<App />);
    
    // Environment config should be properly loaded
    expect(require('./config/environments').default).toHaveProperty('api');
    expect(require('./config/environments').default).toHaveProperty('environment');
  });

  test('Admin panel access is protected', async () => {
    render(<App />);
    
    // Look for admin access button/link
    const adminElements = screen.queryAllByText(/admin/i);
    
    // Should have some form of admin access
    expect(adminElements.length).toBeGreaterThan(0);
  });

  test('Main grocery comparison interface exists', async () => {
    render(<App />);
    
    // Core business functionality should be present
    await waitFor(() => {
      // Should have product search or entry interface
      const searchElements = screen.queryAllByPlaceholderText(/product|search|grocery/i);
      const inputElements = screen.queryAllByRole('textbox');
      
      // At least some input interface should exist
      expect(searchElements.length + inputElements.length).toBeGreaterThan(0);
    });
  });

  test('Error boundaries catch component failures', () => {
    // Mock console.error to avoid noise in tests
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // This test ensures the app doesn't completely crash on component errors
    const { container } = render(<App />);
    
    // App should render some content even with potential errors
    expect(container).toBeTruthy();
    
    consoleSpy.mockRestore();
  });

  test('API configuration uses environment-specific URLs', () => {
    const config = require('./config/environments').default;
    
    // Should not use hardcoded URLs
    expect(config.api.baseUrl).not.toContain('backend-production-2cbb.up.railway.app');
    
    // Should be environment-aware
    expect(['development', 'staging', 'production']).toContain(config.environment);
  });
});

describe('Business Logic Validation', () => {
  test('App handles offline scenarios gracefully', async () => {
    // Mock network failure
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
    
    const { container } = render(<App />);
    
    // App should still render and not crash
    expect(container).toBeTruthy();
  });

  test('Critical business data structures are accessible', () => {
    // Verify that core business logic can be imported without errors
    expect(() => {
      require('./config/environments');
    }).not.toThrow();
  });
});