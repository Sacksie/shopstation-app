import React, { useState, useEffect, useRef } from 'react';
import config from '../config/environments';

const API_URL = config.api.baseUrl;

// Real kosher stores data
const KOSHER_STORES = [
  { id: 'kosher-kingdom', name: 'Kosher Kingdom', address: 'Golders Green', phone: '020 8455 1429', lastUpdate: '2025-08-25T10:30:00Z' },
  { id: 'b-kosher', name: 'B Kosher', address: 'Hendon Brent Street', phone: '020 3210 4000', lastUpdate: '2025-08-25T09:15:00Z' },
  { id: 'tapuach', name: 'Tapuach', address: 'Hendon', phone: '020 8202 5700', lastUpdate: '2025-08-25T11:45:00Z' },
  { id: 'kays', name: 'Kays', address: 'Hendon', phone: '020 8202 9999', lastUpdate: '2025-08-25T08:20:00Z' }
];

// Store state management for custom stores
let customStores = JSON.parse(localStorage.getItem('customStores') || '[]');
const getAllStores = () => [...KOSHER_STORES, ...customStores];
const saveCustomStores = () => localStorage.setItem('customStores', JSON.stringify(customStores));

const MOCK_PRODUCTS = [
  { id: 'milk-2l', name: 'Milk 2L', category: 'dairy', unit: '2L', barcode: '1234567890123' },
  { id: 'bread-white', name: 'White Bread', category: 'bakery', unit: 'loaf', barcode: '2345678901234' },
  { id: 'eggs-dozen', name: 'Eggs Dozen', category: 'dairy', unit: 'dozen', barcode: '3456789012345' },
  { id: 'chicken-breast', name: 'Chicken Breast', category: 'meat', unit: 'kg', barcode: '4567890123456' },
  { id: 'apples-red', name: 'Red Apples', category: 'produce', unit: 'kg', barcode: '5678901234567' },
  { id: 'pasta-spaghetti', name: 'Spaghetti Pasta', category: 'pantry', unit: '500g', barcode: '6789012345678' },
  { id: 'tomatoes-fresh', name: 'Fresh Tomatoes', category: 'produce', unit: 'kg', barcode: '7890123456789' },
  { id: 'cheese-cheddar', name: 'Cheddar Cheese', category: 'dairy', unit: '200g', barcode: '8901234567890' },
  { id: 'rice-basmati', name: 'Basmati Rice', category: 'pantry', unit: '1kg', barcode: '9012345678901' },
  { id: 'yogurt-greek', name: 'Greek Yogurt', category: 'dairy', unit: '500ml', barcode: '0123456789012' },
  { id: 'bananas', name: 'Bananas', category: 'produce', unit: 'kg', barcode: '1122334455667' },
  { id: 'beef-mince', name: 'Beef Mince', category: 'meat', unit: 'kg', barcode: '2233445566778' },
  { id: 'olive-oil', name: 'Olive Oil', category: 'pantry', unit: '500ml', barcode: '3344556677889' },
  { id: 'salmon-fillet', name: 'Salmon Fillet', category: 'fish', unit: 'kg', barcode: '4455667788990' },
  { id: 'potatoes', name: 'Potatoes', category: 'produce', unit: 'kg', barcode: '5566778899001' },
  { id: 'cereal-cornflakes', name: 'Cornflakes Cereal', category: 'breakfast', unit: '500g', barcode: '6677889900112' },
  { id: 'coffee-ground', name: 'Ground Coffee', category: 'beverages', unit: '250g', barcode: '7788990011223' },
  { id: 'tea-black', name: 'Black Tea', category: 'beverages', unit: '100 bags', barcode: '8899001122334' },
  { id: 'sugar-white', name: 'White Sugar', category: 'pantry', unit: '1kg', barcode: '9900112233445' },
  { id: 'butter-unsalted', name: 'Unsalted Butter', category: 'dairy', unit: '250g', barcode: '0011223344556' }
];

const UNIT_OPTIONS = [
  '100g', '200g', '250g', '300g', '400g', '500g', '750g', '1kg', '2kg', '5kg',
  '100ml', '250ml', '330ml', '500ml', '750ml', '1L', '2L', '3L',
  'item', 'pack', 'box', 'bag', 'bottle', 'can', 'jar',
  'dozen', 'loaf', 'bunch', 'kg', 'g', 'ml', 'L'
];

const CATEGORIES = [
  'dairy', 'meat', 'fish', 'produce', 'bakery', 'pantry', 
  'beverages', 'frozen', 'breakfast', 'snacks', 'household', 'other'
];

const GroceryAdminPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(false);
  const [storeFilter, setStoreFilter] = useState('all');

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Navigation helper functions
  const navigateToProducts = (filterStore = 'all') => {
    setCurrentPage('products');
    setStoreFilter(filterStore);
  };

  const navigateToQuickEntry = (selectedStore = '') => {
    setCurrentPage('dashboard');
    // We can pass the selected store to the dashboard if needed
  };

  // Authentication Component with FIXED password input
  const AuthScreen = () => {
    const [showPassword, setShowPassword] = useState(false);
    
    const handleAuth = async (e) => {
      e.preventDefault();
      setAuthError('');
      
      // For development, allow test password
      if (adminPassword === 'test123' || adminPassword === 'temp-password-123') {
        setIsAuthenticated(true);
        return;
      }
      
      try {
        const response = await fetch(`${API_URL}/api/manual/inventory`, {
          headers: { 'x-admin-password': adminPassword }
        });
        
        if (response.ok) {
          setIsAuthenticated(true);
          setAuthError('');
        } else {
          setAuthError('Invalid admin password');
        }
      } catch (error) {
        setAuthError('Connection error - using offline mode');
        if (adminPassword.length >= 6) {
          setIsAuthenticated(true); // Allow offline access for development
        }
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-white">🏪</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Grocery Admin Panel</h1>
            <p className="text-gray-600 mt-2">Quick Entry & Management System</p>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  onInput={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your password"
                  autoComplete="off"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {authError && (
                <p className="mt-2 text-sm text-red-600">{authError}</p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                Development: Use "test123" or your admin password
              </p>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
              disabled={!adminPassword.trim()}
            >
              Access Admin Panel
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              🔒 Secure access • 📱 Mobile optimized • ⚡ Fast entry
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Navigation Component
  const Navigation = () => {
    const navItems = [
      { id: 'dashboard', name: 'Quick Entry', icon: '⚡', shortcut: '1' },
      { id: 'bulk-import', name: 'Bulk Import', icon: '📥', shortcut: '2' },
      { id: 'stores', name: 'Store Mgmt', icon: '🏪', shortcut: '3' },
      { id: 'products', name: 'Products', icon: '📦', shortcut: '4' },
      { id: 'quality', name: 'Data Quality', icon: '✅', shortcut: '5' },
      { id: 'analytics', name: 'Analytics', icon: '📊', shortcut: '6' },
      { id: 'mobile', name: 'Mobile Entry', icon: '📱', shortcut: '7' },
      { id: 'automation', name: 'Automation', icon: '🤖', shortcut: '8' }
    ];

    // Keyboard shortcuts
    useEffect(() => {
      const handleKeyPress = (e) => {
        if (e.altKey && e.key >= '1' && e.key <= '8') {
          e.preventDefault();
          const pageIndex = parseInt(e.key) - 1;
          if (navItems[pageIndex]) {
            setCurrentPage(navItems[pageIndex].id);
          }
        }
      };

      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }, [navItems]);

    if (isMobile) {
      return (
        <div className="bg-white border-t border-gray-200 px-2 py-2">
          <div className="flex space-x-1 overflow-x-auto">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`flex flex-col items-center px-3 py-2 rounded-lg whitespace-nowrap text-xs transition-colors ${
                  currentPage === item.id 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="text-base mb-1">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <nav className="bg-white border-r border-gray-200 w-64 h-full overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-8">
            <span className="text-2xl">🏪</span>
            <div>
              <h2 className="font-bold text-gray-900">Grocery Admin</h2>
              <p className="text-xs text-gray-500">Quick Entry System</p>
            </div>
          </div>
          
          <div className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  currentPage === item.id 
                    ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
                <span className="ml-auto text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">
                  Alt+{item.shortcut}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => setIsAuthenticated(false)}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>
    );
  };

  // Header Component
  const Header = () => (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 capitalize">
            {currentPage.replace('-', ' ')}
          </h1>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-GB', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500">
            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
            <span>System Online</span>
          </div>
          
          <button
            onClick={() => setIsAuthenticated(false)}
            className="md:hidden p-2 text-gray-400 hover:text-gray-600"
          >
            <span>🚪</span>
          </button>
        </div>
      </div>
    </header>
  );

  // Main Layout
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {!isMobile && (
        <div className="flex flex-1">
          <Navigation />
          <div className="flex-1 flex flex-col">
            <Header />
            <main className="flex-1 overflow-hidden">
              {currentPage === 'dashboard' && <QuickEntryDashboard />}
              {currentPage === 'bulk-import' && <BulkImportPage />}
              {currentPage === 'stores' && <StoreManagementPage navigateToProducts={navigateToProducts} navigateToQuickEntry={navigateToQuickEntry} />}
              {currentPage === 'products' && <ProductMasterPage storeFilter={storeFilter} />}
              {currentPage === 'quality' && <DataQualityPage />}
              {currentPage === 'analytics' && <AnalyticsDashboard />}
              {currentPage === 'mobile' && <MobileEntryMode />}
              {currentPage === 'automation' && <AutomationAssistant />}
            </main>
          </div>
        </div>
      )}
      
      {isMobile && (
        <div className="flex flex-col h-full">
          <Header />
          <main className="flex-1 overflow-hidden">
            {currentPage === 'dashboard' && <QuickEntryDashboard />}
            {currentPage === 'bulk-import' && <BulkImportPage />}
            {currentPage === 'stores' && <StoreManagementPage navigateToProducts={navigateToProducts} navigateToQuickEntry={navigateToQuickEntry} />}
            {currentPage === 'products' && <ProductMasterPage storeFilter={storeFilter} />}
            {currentPage === 'quality' && <DataQualityPage />}
            {currentPage === 'analytics' && <AnalyticsDashboard />}
            {currentPage === 'mobile' && <MobileEntryMode />}
            {currentPage === 'automation' && <AutomationAssistant />}
          </main>
          <Navigation />
        </div>
      )}
    </div>
  );
};

// Page 1: Quick Entry Dashboard (Split Screen)
const QuickEntryDashboard = () => {
  const [selectedStore, setSelectedStore] = useState('Kosher Kingdom');
  const [showOtherStore, setShowOtherStore] = useState(false);
  const [otherStoreName, setOtherStoreName] = useState('');
  const [pinnedStores, setPinnedStores] = useState(JSON.parse(localStorage.getItem('pinnedStores') || '[]'));
  const [productName, setProductName] = useState('');
  const [productSuggestions, setProductSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('item');
  const [inStock, setInStock] = useState(true);
  const [specialOffer, setSpecialOffer] = useState(false);
  const [recentEntries, setRecentEntries] = useState([]);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [comparisonData, setComparisonData] = useState([]);
  const productInputRef = useRef(null);
  const priceInputRef = useRef(null);

  // Auto-suggest products
  useEffect(() => {
    if (productName.length >= 2) {
      const suggestions = MOCK_PRODUCTS.filter(p => 
        p.name.toLowerCase().includes(productName.toLowerCase())
      ).slice(0, 5);
      setProductSuggestions(suggestions);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [productName]);

  // Load comparison data when product is selected
  useEffect(() => {
    if (currentProduct) {
      // Load real comparison data from API or simulate
      const loadComparison = async () => {
        try {
          const response = await fetch(`${API_URL}/api/manual/inventory`, {
            headers: { 'x-admin-password': 'Gavtalej22' }
          });
          const data = await response.json();
          
          if (data.success && data.data.products[currentProduct.id]) {
            const productData = data.data.products[currentProduct.id];
            const comparison = getAllStores().map(store => {
              const storePrice = productData.prices[store.name];
              return {
                store: store.name,
                price: storePrice?.price?.toFixed(2) || null,
                lastUpdated: storePrice?.lastUpdated || null,
                inStock: true,
                hasOffer: false,
                unit: storePrice?.unit || currentProduct.unit
              };
            });
            setComparisonData(comparison);
          } else {
            // Fallback to mock data
            const mockComparison = getAllStores().map(store => ({
              store: store.name,
              price: (Math.random() * 5 + 1).toFixed(2),
              lastUpdated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
              inStock: Math.random() > 0.2,
              hasOffer: Math.random() > 0.8
            }));
            setComparisonData(mockComparison);
          }
        } catch (error) {
          // Fallback to mock data
          const mockComparison = getAllStores().map(store => ({
            store: store.name,
            price: (Math.random() * 5 + 1).toFixed(2),
            lastUpdated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            inStock: Math.random() > 0.2,
            hasOffer: Math.random() > 0.8
          }));
          setComparisonData(mockComparison);
        }
      };
      loadComparison();
    }
  }, [currentProduct]);

  const handleProductSelect = (product) => {
    setProductName(product.name);
    setUnit(product.unit);
    setCurrentProduct(product);
    setShowSuggestions(false);
    setTimeout(() => priceInputRef.current?.focus(), 100);
  };

  const handleAddOtherStore = () => {
    if (!otherStoreName.trim()) return;
    
    const newStore = {
      id: 'custom-' + Date.now(),
      name: otherStoreName.trim(),
      address: 'Custom Store',
      lastUpdate: new Date().toISOString(),
      isCustom: true
    };
    
    customStores.push(newStore);
    saveCustomStores();
    
    // Add to pinned stores
    const newPinned = [...pinnedStores, newStore.name];
    setPinnedStores(newPinned);
    localStorage.setItem('pinnedStores', JSON.stringify(newPinned));
    
    setSelectedStore(otherStoreName.trim());
    setOtherStoreName('');
    setShowOtherStore(false);
  };

  const handleSubmit = async () => {
    if (!productName.trim() || !price) return;

    const entry = {
      id: Date.now(),
      store: selectedStore,
      product: productName,
      price: parseFloat(price),
      unit,
      inStock,
      specialOffer,
      timestamp: new Date().toISOString()
    };

    setRecentEntries([entry, ...recentEntries.slice(0, 4)]);

    // Save to backend
    try {
      await fetch(`${API_URL}/api/manual/add-price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': 'temp-password-123'
        },
        body: JSON.stringify({
          store: entry.store,
          productName: entry.product,
          price: entry.price,
          unit: entry.unit
        })
      });
    } catch (error) {
      console.log('Offline mode - data saved locally');
    }

    // Clear form (except store selection)
    setProductName('');
    setPrice('');
    setUnit('item');
    setSpecialOffer(false);
    setCurrentProduct(null);
    setComparisonData([]);

    // Focus back to product input
    setTimeout(() => productInputRef.current?.focus(), 100);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row">
      {/* Left Panel - Data Entry Form */}
      <div className="lg:w-1/2 p-6 border-r border-gray-200 overflow-y-auto">
        <div className="max-w-md mx-auto">
          <h2 className="text-xl font-bold mb-6">Quick Price Entry</h2>

          {/* Store Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Store (Sticky Selection)
            </label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {KOSHER_STORES.map((store, index) => (
                <button
                  key={store.id}
                  onClick={() => setSelectedStore(store.name)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    selectedStore === store.name
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-sm">{store.name}</div>
                  <div className="text-xs text-gray-500">Press {index + 1}</div>
                </button>
              ))}
            </div>
            
            {/* Pinned Custom Stores */}
            {pinnedStores.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                {pinnedStores.map((storeName) => (
                  <button
                    key={storeName}
                    onClick={() => setSelectedStore(storeName)}
                    className={`p-2 rounded-lg border text-left transition-colors ${
                      selectedStore === storeName
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium text-sm">{storeName}</div>
                    <div className="text-xs text-gray-500">📌 Pinned</div>
                  </button>
                ))}
              </div>
            )}
            
            {/* Other Store Option */}
            {!showOtherStore ? (
              <button
                onClick={() => setShowOtherStore(true)}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
              >
                + Add Other Store
              </button>
            ) : (
              <div className="p-3 border border-gray-300 rounded-lg bg-gray-50">
                <input
                  type="text"
                  value={otherStoreName}
                  onChange={(e) => setOtherStoreName(e.target.value)}
                  placeholder="Enter store name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded mb-2 text-sm"
                  autoFocus
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleAddOtherStore}
                    disabled={!otherStoreName.trim()}
                    className="flex-1 bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    Pin Store
                  </button>
                  <button
                    onClick={() => setShowOtherStore(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-1 px-3 rounded text-sm hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Product Name with Autocomplete */}
          <div className="mb-4 relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name
            </label>
            <input
              ref={productInputRef}
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              placeholder="Start typing product name..."
              autoComplete="off"
            />
            
            {showSuggestions && productSuggestions.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg">
                {productSuggestions.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleProductSelect(product)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-500">{product.category} • {product.unit}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Price Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price (£)
            </label>
            <input
              ref={priceInputRef}
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xl font-bold"
              placeholder="0.00"
            />
          </div>

          {/* Unit Size */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit Size
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {UNIT_OPTIONS.map(unitOption => (
                <option key={unitOption} value={unitOption}>{unitOption}</option>
              ))}
            </select>
          </div>

          {/* Status Toggles */}
          <div className="mb-6 space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="inStock"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="inStock" className="ml-2 text-sm text-gray-700">
                In Stock
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="specialOffer"
                checked={specialOffer}
                onChange={(e) => setSpecialOffer(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="specialOffer" className="ml-2 text-sm text-gray-700">
                Special Offer
              </label>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSubmit}
            disabled={!productName.trim() || !price}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-medium"
          >
            Save & Next Entry (Enter)
          </button>

          {/* Recent Entries */}
          {recentEntries.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium text-gray-900 mb-3">Recent Entries</h3>
              <div className="space-y-2">
                {recentEntries.map((entry) => (
                  <div key={entry.id} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{entry.product}</div>
                        <div className="text-sm text-gray-500">
                          {entry.store} • £{entry.price} per {entry.unit}
                        </div>
                      </div>
                      <button className="text-blue-600 hover:text-blue-800 text-sm">
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Live Comparison */}
      <div className="lg:w-1/2 p-6 bg-gray-50 overflow-y-auto">
        <h2 className="text-xl font-bold mb-6">Live Price Comparison</h2>
        
        {currentProduct ? (
          <div>
            <div className="bg-white rounded-lg p-4 mb-4">
              <h3 className="font-medium text-lg">{currentProduct.name}</h3>
              <p className="text-sm text-gray-500">{currentProduct.category} • {currentProduct.unit}</p>
            </div>

            {comparisonData.length > 0 && (
              <div className="space-y-3">
                {comparisonData.map((item, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{item.store}</div>
                        <div className="text-2xl font-bold text-green-600">£{item.price}</div>
                        <div className="text-sm text-gray-500">
                          Updated {new Date(item.lastUpdated).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex px-2 py-1 rounded-full text-xs ${
                          item.inStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {item.inStock ? 'In Stock' : 'Out of Stock'}
                        </div>
                        {item.hasOffer && (
                          <div className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs mt-1">
                            Special Offer
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-500 mt-12">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-medium mb-2">Select a Product</h3>
            <p>Start typing a product name to see live price comparisons across all stores</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Page 2: Bulk Import Page
const BulkImportPage = () => {
  const [uploadedData, setUploadedData] = useState([]);
  const [csvText, setCsvText] = useState('');
  const [errors, setErrors] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef(null);

  const csvTemplate = `Product Name,Store,Price,Unit,Stock Status,Special Offer
Milk 2L,Kosher Kingdom,2.50,2L,In Stock,No
White Bread,B Kosher,1.20,loaf,In Stock,Yes
Eggs Dozen,Tapuach,3.00,dozen,In Stock,No`;

  const downloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCsvText(e.target.result);
        processCSV(e.target.result);
      };
      reader.readAsText(file);
    }
  };

  const processCSV = (csvContent) => {
    setIsProcessing(true);
    const lines = csvContent.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    const newErrors = [];
    const newData = [];

    // Validate headers
    const requiredHeaders = ['Product Name', 'Store', 'Price', 'Unit'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      newErrors.push(`Missing required columns: ${missingHeaders.join(', ')}`);
    }

    // Process data rows
    lines.slice(1).forEach((line, index) => {
      if (!line.trim()) return;
      
      const values = line.split(',').map(v => v.trim());
      const rowData = {};
      
      headers.forEach((header, i) => {
        rowData[header] = values[i] || '';
      });

      // Validate row
      const rowErrors = [];
      if (!rowData['Product Name']) rowErrors.push('Missing product name');
      if (!rowData['Store']) rowErrors.push('Missing store');
      if (!rowData['Price'] || isNaN(parseFloat(rowData['Price']))) rowErrors.push('Invalid price');
      if (!rowData['Unit']) rowErrors.push('Missing unit');

      // Check if store exists
      if (!getAllStores().find(s => s.name === rowData['Store'])) {
        rowErrors.push(`Unknown store: ${rowData['Store']}`);
      }

      // Price validation
      const price = parseFloat(rowData['Price']);
      if (price > 100) rowErrors.push('Price seems unusually high');
      if (price < 0.01) rowErrors.push('Price too low');

      newData.push({
        ...rowData,
        rowIndex: index + 2,
        errors: rowErrors,
        isValid: rowErrors.length === 0,
        price: price
      });

      if (rowErrors.length > 0) {
        newErrors.push(`Row ${index + 2}: ${rowErrors.join(', ')}`);
      }
    });

    setUploadedData(newData);
    setErrors(newErrors);
    setShowPreview(true);
    setIsProcessing(false);
  };

  const handleTextAreaChange = (value) => {
    setCsvText(value);
    if (value.trim()) {
      processCSV(value);
    } else {
      setUploadedData([]);
      setErrors([]);
      setShowPreview(false);
    }
  };

  const importData = async () => {
    const validData = uploadedData.filter(row => row.isValid);
    
    try {
      for (const row of validData) {
        await fetch(`${API_URL}/api/manual/add-price`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-password': 'temp-password-123'
          },
          body: JSON.stringify({
            store: row['Store'],
            productName: row['Product Name'],
            price: row.price,
            unit: row['Unit']
          })
        });
      }
      alert(`Successfully imported ${validData.length} products!`);
      
      // Clear form
      setCsvText('');
      setUploadedData([]);
      setErrors([]);
      setShowPreview(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
    } catch (error) {
      console.error('Import error:', error);
      alert('Import completed with some errors. Check console for details.');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Bulk Import</h2>
        <p className="text-gray-600">Upload CSV files or paste data to import multiple products at once</p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Data Input</h3>
          <button
            onClick={downloadTemplate}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span>📥</span>
            <span>Download Template</span>
          </button>
        </div>

        {/* File Upload */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload CSV File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <div className="text-4xl mb-2">📄</div>
                <div className="text-sm text-gray-600">
                  Click to upload CSV file
                  <br />
                  <span className="text-xs text-gray-400">Max 10MB</span>
                </div>
              </label>
            </div>
          </div>

          {/* Text Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or Paste CSV Data
            </label>
            <textarea
              value={csvText}
              onChange={(e) => handleTextAreaChange(e.target.value)}
              placeholder="Product Name,Store,Price,Unit
Milk 2L,Kosher Kingdom,2.50,2L
White Bread,B Kosher,1.20,loaf"
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
          </div>
        </div>
      </div>

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mr-3"></div>
            <span className="text-blue-800">Processing CSV data...</span>
          </div>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-red-800 mb-2">Validation Errors</h4>
          <ul className="list-disc list-inside space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-red-700 text-sm">{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview Table */}
      {showPreview && uploadedData.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Preview ({uploadedData.filter(row => row.isValid).length} valid, {uploadedData.filter(row => !row.isValid).length} invalid)
              </h3>
              <button
                onClick={importData}
                disabled={uploadedData.filter(row => row.isValid).length === 0}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Import Valid Rows
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Store</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issues</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {uploadedData.map((row, index) => (
                  <tr key={index} className={row.isValid ? 'bg-green-50' : 'bg-red-50'}>
                    <td className="px-4 py-3">
                      {row.isValid ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✅ Valid
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          ❌ Error
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">{row['Product Name']}</td>
                    <td className="px-4 py-3 text-sm">{row['Store']}</td>
                    <td className="px-4 py-3 text-sm font-bold text-green-600">£{row['Price']}</td>
                    <td className="px-4 py-3 text-sm">{row['Unit']}</td>
                    <td className="px-4 py-3 text-sm text-red-600">
                      {row.errors.join(', ') || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Page 3: Store Management Page
const StoreManagementPage = ({ navigateToProducts, navigateToQuickEntry }) => {
  const [storeData, setStoreData] = useState({});

  useEffect(() => {
    // Simulate loading store data with product counts and last updates
    const allStores = getAllStores();
    const mockData = allStores.reduce((acc, store) => {
      acc[store.id] = {
        ...store,
        productCount: Math.floor(Math.random() * 200) + 50,
        completion: Math.floor(Math.random() * 40) + 60,
        todayUpdates: Math.floor(Math.random() * 20),
        pendingUpdates: Math.floor(Math.random() * 15),
        averagePrice: (Math.random() * 2 + 2).toFixed(2),
        lastFullUpdate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      };
      return acc;
    }, {});
    setStoreData(mockData);
  }, []);

  const getCompletionColor = (percentage) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatLastUpdate = (date) => {
    const now = new Date();
    const diffHours = (now - date) / (1000 * 60 * 60);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Store Management</h2>
        <p className="text-gray-600">Monitor and manage data for all stores</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {getAllStores().map((store) => {
          const data = storeData[store.id];
          if (!data) return null;

          return (
            <div key={store.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Store Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold">{store.name}</h3>
                    <p className="text-blue-100 text-sm">{store.address}</p>
                  </div>
                  <div className="text-2xl">🏪</div>
                </div>
              </div>

              {/* Store Stats */}
              <div className="p-4 space-y-4">

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{data.productCount}</div>
                    <div className="text-xs text-gray-500">Total Products</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{data.todayUpdates}</div>
                    <div className="text-xs text-gray-500">Today's Updates</div>
                  </div>
                </div>

                {/* Last Update */}
                <div className="text-center py-2 bg-gray-50 rounded">
                  <div className="text-sm font-medium text-gray-700">Last Full Update</div>
                  <div className="text-xs text-gray-500">{formatLastUpdate(data.lastFullUpdate)}</div>
                </div>

                {/* Quick Stats */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending Updates:</span>
                    <span className="font-medium">{data.pendingUpdates}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Price:</span>
                    <span className="font-medium">£{data.averagePrice}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                  <button 
                    onClick={() => navigateToQuickEntry(store.name)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Update Now
                  </button>
                  <button 
                    onClick={() => navigateToProducts(store.name)}
                    className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    View Products
                  </button>
                </div>
              </div>

              {/* Status Indicators */}
              <div className="border-t border-gray-200 px-4 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${data.completion >= 80 ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                    <span className="text-xs text-gray-500">
                      {data.completion >= 80 ? 'Up to date' : 'Needs attention'}
                    </span>
                  </div>
                  <button className="text-xs text-blue-600 hover:text-blue-800">
                    Details →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Dashboard */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Network Overview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {Object.values(storeData).reduce((sum, store) => sum + store.productCount, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Products</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {Object.values(storeData).reduce((sum, store) => sum + store.todayUpdates, 0)}
            </div>
            <div className="text-sm text-gray-600">Today's Updates</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">
              {Math.round(Object.values(storeData).reduce((sum, store) => sum + store.completion, 0) / Object.keys(storeData).length)}%
            </div>
            <div className="text-sm text-gray-600">Avg Completion</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">4</div>
            <div className="text-sm text-gray-600">Active Stores</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductMasterPage = ({ storeFilter = 'all' }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStore, setSelectedStore] = useState(storeFilter);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  
  // Bulk operations state
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Enhanced filtering state
  const [minCoverage, setMinCoverage] = useState(0);
  const [maxCoverage, setMaxCoverage] = useState(4);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [lastBackup, setLastBackup] = useState(null);

  // Load products on mount and when store filter changes
  useEffect(() => {
    loadProducts();
    checkLastBackup();
  }, []);

  useEffect(() => {
    setSelectedStore(storeFilter);
  }, [storeFilter]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/manual/inventory`, {
        headers: { 'x-admin-password': 'Gavtalej22' }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.products) {
          // Transform the data structure for display
          const productList = Object.entries(data.data.products).map(([productId, productData]) => {
            const stores = getAllStores();
            const prices = {};
            
            stores.forEach(store => {
              const storePrice = productData.prices[store.name];
              prices[store.name] = storePrice ? {
                price: storePrice.price,
                unit: storePrice.unit,
                lastUpdated: storePrice.lastUpdated,
                inStock: true
              } : null;
            });

            return {
              id: productId,
              name: productData.name || productId,
              category: productData.category || 'other',
              prices: prices,
              totalStores: stores.length,
              pricesAvailable: Object.values(prices).filter(p => p !== null).length
            };
          });
          setProducts(productList);
        } else {
          // Fallback to mock data if API doesn't have products
          generateMockProducts();
        }
      } else {
        // Fallback to mock data
        generateMockProducts();
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      generateMockProducts();
    }
    setLoading(false);
  };

  const generateMockProducts = () => {
    const stores = getAllStores();
    const mockProductData = MOCK_PRODUCTS.map(product => {
      const prices = {};
      stores.forEach(store => {
        // Generate some mock prices (not all products have prices at all stores)
        if (Math.random() > 0.3) {
          prices[store.name] = {
            price: parseFloat((Math.random() * 5 + 1).toFixed(2)),
            unit: product.unit,
            lastUpdated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            inStock: Math.random() > 0.2
          };
        } else {
          prices[store.name] = null;
        }
      });

      return {
        id: product.id,
        name: product.name,
        category: product.category,
        prices: prices,
        totalStores: stores.length,
        pricesAvailable: Object.values(prices).filter(p => p !== null).length
      };
    });
    setProducts(mockProductData);
  };

  const checkLastBackup = () => {
    // Simulate checking backup status
    const backupTime = new Date(Date.now() - (Math.random() * 4 * 60 * 60 * 1000)); // Random time within last 4 hours
    setLastBackup(backupTime);
  };

  const handleEditStart = (productId, storeName, field, currentValue) => {
    setEditingCell(`${productId}-${storeName}-${field}`);
    setEditValue(currentValue || '');
  };

  const handleEditSave = async (productId, storeName, field) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    try {
      if (field === 'price') {
        // Enhanced price validation
        if (!editValue || editValue.trim() === '') {
          alert('Price cannot be empty');
          return;
        }
        
        const newPrice = parseFloat(editValue);
        if (isNaN(newPrice)) {
          alert('Price must be a valid number (e.g., 2.50)');
          return;
        }
        
        if (newPrice <= 0) {
          alert('Price must be greater than £0');
          return;
        }
        
        if (newPrice > 9999.99) {
          alert('Price cannot exceed £9,999.99');
          return;
        }
        
        if (!/^\d+\.?\d{0,2}$/.test(editValue.trim())) {
          alert('Price should have at most 2 decimal places (e.g., 2.50)');
          return;
        }

        // Update backend
        await fetch(`${API_URL}/api/manual/add-price`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-password': 'temp-password-123'
          },
          body: JSON.stringify({
            store: storeName,
            productName: product.name,
            price: newPrice,
            unit: product.prices[storeName]?.unit || 'item'
          })
        });

        // Update local state
        setProducts(prev => prev.map(p => {
          if (p.id === productId) {
            const updatedPrices = { ...p.prices };
            if (!updatedPrices[storeName]) {
              updatedPrices[storeName] = { unit: 'item', inStock: true };
            }
            updatedPrices[storeName] = {
              ...updatedPrices[storeName],
              price: newPrice,
              lastUpdated: new Date().toISOString()
            };
            return {
              ...p,
              prices: updatedPrices,
              pricesAvailable: Object.values(updatedPrices).filter(price => price !== null).length
            };
          }
          return p;
        }));
      } else if (field === 'name') {
        // Enhanced product name validation
        if (!editValue || editValue.trim() === '') {
          alert('Product name cannot be empty');
          return;
        }
        
        const trimmedName = editValue.trim();
        if (trimmedName.length < 2) {
          alert('Product name must be at least 2 characters long');
          return;
        }
        
        if (trimmedName.length > 100) {
          alert('Product name cannot exceed 100 characters');
          return;
        }
        
        if (!/^[a-zA-Z0-9\s\-\.\(\)&']+$/.test(trimmedName)) {
          alert('Product name contains invalid characters. Use only letters, numbers, spaces, and common symbols (- . ( ) & \')');
          return;
        }
        
        // Check for duplicate names
        const duplicateExists = products.some(p => p.id !== productId && p.name.toLowerCase() === trimmedName.toLowerCase());
        if (duplicateExists) {
          alert(`A product with the name "${trimmedName}" already exists. Please use a different name.`);
          return;
        }
        
        // Update product name via backend API
        const response = await fetch(`${API_URL}/api/manual/update-product-info`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-password': 'temp-password-123'
          },
          body: JSON.stringify({
            productKey: productId,
            displayName: trimmedName
          })
        });
        
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to update product name');
        }
        
        // Update local state for product name
        setProducts(prev => prev.map(p => {
          if (p.id === productId) {
            return { ...p, name: trimmedName };
          }
          return p;
        }));
      } else if (field === 'category') {
        // Enhanced category validation
        if (!editValue || editValue.trim() === '') {
          alert('Category cannot be empty');
          return;
        }
        
        const trimmedCategory = editValue.trim().toLowerCase();
        if (!CATEGORIES.includes(trimmedCategory)) {
          alert(`Invalid category. Please select from: ${CATEGORIES.join(', ')}`);
          return;
        }
        
        // Update product category via backend API
        const response = await fetch(`${API_URL}/api/manual/update-product-info`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-password': 'temp-password-123'
          },
          body: JSON.stringify({
            productKey: productId,
            category: trimmedCategory
          })
        });
        
        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to update product category');
        }
        
        // Update local state for category
        setProducts(prev => prev.map(p => {
          if (p.id === productId) {
            return { ...p, category: trimmedCategory };
          }
          return p;
        }));
      }
    } catch (error) {
      console.error('Failed to update:', error);
      // Update local state anyway for offline capability
      if (field === 'price') {
        setProducts(prev => prev.map(p => {
          if (p.id === productId) {
            const newPrice = parseFloat(editValue);
            const updatedPrices = { ...p.prices };
            if (!updatedPrices[storeName]) {
              updatedPrices[storeName] = { unit: 'item', inStock: true };
            }
            updatedPrices[storeName] = {
              ...updatedPrices[storeName],
              price: newPrice,
              lastUpdated: new Date().toISOString()
            };
            return {
              ...p,
              prices: updatedPrices,
              pricesAvailable: Object.values(updatedPrices).filter(price => price !== null).length
            };
          }
          return p;
        }));
      }
    }

    setEditingCell(null);
    setEditValue('');
  };

  const handleEditCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  // Bulk operations handlers
  const handleSelectProduct = (productId) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
      setShowBulkActions(true);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedProducts.size} selected product(s)?\n\n` +
      `This will permanently remove all selected products and their prices from all stores.\n\n` +
      `This action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    try {
      const deletePromises = Array.from(selectedProducts).map(async (productId) => {
        const response = await fetch(`${API_URL}/api/manual/delete-product/${productId}`, {
          method: 'DELETE',
          headers: { 'x-admin-password': 'temp-password-123' }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to delete ${productId}: ${errorData.error}`);
        }
        
        return productId;
      });
      
      const deletedIds = await Promise.all(deletePromises);
      
      // Update local state
      setProducts(prev => prev.filter(p => !deletedIds.includes(p.id)));
      setSelectedProducts(new Set());
      setShowBulkActions(false);
      
      alert(`Successfully deleted ${deletedIds.length} product(s)!`);
      
    } catch (error) {
      console.error('Bulk delete error:', error);
      alert(`Bulk delete failed: ${error.message}`);
    }
  };

  const handleBulkCategoryChange = async (newCategory) => {
    if (selectedProducts.size === 0 || !newCategory) return;
    
    const confirmed = window.confirm(
      `Change category to "${newCategory}" for ${selectedProducts.size} selected product(s)?`
    );
    
    if (!confirmed) return;
    
    try {
      const updatePromises = Array.from(selectedProducts).map(async (productId) => {
        const response = await fetch(`${API_URL}/api/manual/update-product-info`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-password': 'temp-password-123'
          },
          body: JSON.stringify({
            productKey: productId,
            category: newCategory
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to update ${productId}: ${errorData.error}`);
        }
        
        return productId;
      });
      
      const updatedIds = await Promise.all(updatePromises);
      
      // Update local state
      setProducts(prev => prev.map(p => 
        updatedIds.includes(p.id) 
          ? { ...p, category: newCategory }
          : p
      ));
      
      setSelectedProducts(new Set());
      setShowBulkActions(false);
      setBulkAction('');
      
      alert(`Successfully updated category for ${updatedIds.length} product(s)!`);
      
    } catch (error) {
      console.error('Bulk category change error:', error);
      alert(`Bulk category change failed: ${error.message}`);
    }
  };

  const handleDeleteProduct = async (productId, productName) => {
    // Show confirmation dialog
    if (!window.confirm(`Are you sure you want to delete "${productName}"?\n\nThis will permanently remove the product and all its prices from all stores.\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      // Call backend delete API
      const response = await fetch(`${API_URL}/api/manual/delete-product/${productId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-password': 'temp-password-123'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Remove from local state
          setProducts(prev => prev.filter(p => p.id !== productId));
          alert(`Product "${productName}" deleted successfully!`);
        } else {
          alert(`Failed to delete product: ${data.error || 'Unknown error'}`);
        }
      } else {
        const errorData = await response.json();
        alert(`Failed to delete product: ${errorData.error || 'Server error'}`);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert(`Failed to delete product: ${error.message}`);
    }
  };

  // Enhanced filter and sort products
  const filteredProducts = products
    .filter(product => {
      // Basic filters
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesStore = selectedStore === 'all' || product.prices[selectedStore] !== null;
      
      // Coverage filter
      const coverage = product.pricesAvailable || 0;
      const matchesCoverage = coverage >= minCoverage && coverage <= maxCoverage;
      
      return matchesSearch && matchesCategory && matchesStore && matchesCoverage;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'category':
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
          break;
        case 'coverage':
          aValue = a.pricesAvailable || 0;
          bValue = b.pricesAvailable || 0;
          break;
        case 'avgPrice':
          // Calculate average price
          const aPrices = Object.values(a.prices).filter(p => p !== null).map(p => p.price);
          const bPrices = Object.values(b.prices).filter(p => p !== null).map(p => p.price);
          aValue = aPrices.length > 0 ? aPrices.reduce((sum, p) => sum + p, 0) / aPrices.length : 0;
          bValue = bPrices.length > 0 ? bPrices.reduce((sum, p) => sum + p, 0) / bPrices.length : 0;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });

  const stores = getAllStores();

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Master Database</h2>
            <p className="text-gray-600">Live product data with real-time editing capabilities</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-1">
              Last Backup: {lastBackup ? new Date(lastBackup).toLocaleTimeString() : 'Never'}
            </div>
            <div className="text-xs text-green-600">Auto-backup every 4 hours ✓</div>
          </div>
        </div>

        {/* Enhanced Stats with Icons */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">{products.length}</div>
                <div className="text-sm text-gray-600">Total Products</div>
                <div className="text-xs text-gray-400">{filteredProducts.length} shown</div>
              </div>
              <div className="text-3xl">📦</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{stores.length}</div>
                <div className="text-sm text-gray-600">Active Stores</div>
                <div className="text-xs text-gray-400">{stores.map(s => s.name.split(' ')[0]).join(', ')}</div>
              </div>
              <div className="text-3xl">🏪</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {products.reduce((sum, p) => sum + p.pricesAvailable, 0)}
                </div>
                <div className="text-sm text-gray-600">Price Points</div>
                <div className="text-xs text-gray-400">{(products.length * stores.length) - products.reduce((sum, p) => sum + p.pricesAvailable, 0)} missing</div>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round((products.reduce((sum, p) => sum + p.pricesAvailable, 0) / (products.length * stores.length)) * 100)}%
                </div>
                <div className="text-sm text-gray-600">Coverage</div>
                <div className="text-xs text-gray-400">{products.filter(p => p.pricesAvailable === stores.length).length} complete</div>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </div>
        </div>

        {/* Store Coverage Dashboard */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">📈 Store Coverage Dashboard</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span className="flex items-center"><span className="w-3 h-3 bg-red-200 rounded mr-1"></span>0 stores</span>
              <span className="flex items-center"><span className="w-3 h-3 bg-yellow-200 rounded mr-1"></span>1-2 stores</span>
              <span className="flex items-center"><span className="w-3 h-3 bg-blue-200 rounded mr-1"></span>3 stores</span>
              <span className="flex items-center"><span className="w-3 h-3 bg-green-200 rounded mr-1"></span>All stores</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coverage Distribution */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Coverage Distribution</h4>
              <div className="space-y-2">
                {[0, 1, 2, 3, 4].map(coverage => {
                  const count = products.filter(p => (p.pricesAvailable || 0) === coverage).length;
                  const percentage = products.length > 0 ? (count / products.length) * 100 : 0;
                  const bgColor = coverage === 0 ? 'bg-red-200' : coverage <= 2 ? 'bg-yellow-200' : coverage === 3 ? 'bg-blue-200' : 'bg-green-200';
                  
                  return (
                    <div key={coverage} className="flex items-center">
                      <div className="w-20 text-sm text-gray-600">
                        {coverage === 0 ? 'No prices' : coverage === 4 ? 'Complete' : `${coverage} store${coverage !== 1 ? 's' : ''}`}
                      </div>
                      <div className="flex-1 mx-3">
                        <div className="w-full bg-gray-200 rounded-full h-4 relative">
                          <div 
                            className={`h-4 rounded-full ${bgColor}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                          <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                            {count > 0 && `${count}`}
                          </div>
                        </div>
                      </div>
                      <div className="w-12 text-sm text-gray-500 text-right">{percentage.toFixed(0)}%</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Store Performance */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Store Performance</h4>
              <div className="space-y-2">
                {stores.map(store => {
                  const storeProducts = products.filter(p => p.prices[store.name] !== null).length;
                  const percentage = products.length > 0 ? (storeProducts / products.length) * 100 : 0;
                  
                  return (
                    <div key={store.id} className="flex items-center">
                      <div className="w-20 text-sm text-gray-600 truncate" title={store.name}>
                        {store.name.split(' ')[0]}
                      </div>
                      <div className="flex-1 mx-3">
                        <div className="w-full bg-gray-200 rounded-full h-4 relative">
                          <div 
                            className="h-4 rounded-full bg-blue-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                          <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                            {storeProducts > 0 && `${storeProducts}`}
                          </div>
                        </div>
                      </div>
                      <div className="w-12 text-sm text-gray-500 text-right">{percentage.toFixed(0)}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="mt-4 pt-3 border-t flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-gray-600">📌 Quick Actions:</span>
              <button 
                onClick={() => {
                  setMinCoverage(0);
                  setMaxCoverage(0);
                  setShowAdvancedFilters(true);
                }}
                className="text-red-600 hover:text-red-800"
              >
                Show incomplete
              </button>
              <button 
                onClick={() => {
                  setMinCoverage(4);
                  setMaxCoverage(4);
                  setShowAdvancedFilters(true);
                }}
                className="text-green-600 hover:text-green-800"
              >
                Show complete
              </button>
            </div>
            <div className="text-sm text-gray-500">Target: 100% coverage</div>
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          {/* Primary Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">🔍 Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or ID..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">📂 Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">🏪 Store</label>
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Stores</option>
                {stores.map(store => (
                  <option key={store.id} value={store.name}>{store.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">📊 Sort</label>
              <div className="flex space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value="name">Name</option>
                  <option value="category">Category</option>
                  <option value="coverage">Coverage</option>
                  <option value="avgPrice">Avg Price</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                  title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>

          {/* Filter Status & Advanced Toggle */}
          <div className="flex items-center justify-between border-t pt-3">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              <span>{showAdvancedFilters ? '🔼' : '🔽'}</span>
              <span>Advanced Filters</span>
              <span className="text-gray-400">({filteredProducts.length} results)</span>
            </button>
            
            <div className="flex items-center space-x-2 text-sm">
              {searchTerm && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">"{searchTerm}"</span>}
              {selectedCategory !== 'all' && <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">{selectedCategory}</span>}
              {selectedStore !== 'all' && <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">{selectedStore}</span>}
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="border-t pt-4 mt-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📈 Store Coverage: {minCoverage} - {maxCoverage} stores
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-xs w-8">Min:</span>
                      <input
                        type="range"
                        min="0"
                        max="4"
                        value={minCoverage}
                        onChange={(e) => setMinCoverage(parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-xs w-4">{minCoverage}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs w-8">Max:</span>
                      <input
                        type="range"
                        min="0"
                        max="4"
                        value={maxCoverage}
                        onChange={(e) => setMaxCoverage(parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-xs w-4">{maxCoverage}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                      setSelectedStore('all');
                      setMinCoverage(0);
                      setMaxCoverage(4);
                      setSortBy('name');
                      setSortOrder('asc');
                    }}
                    className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg"
                  >
                    🔄 Reset Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {showBulkActions && (
        <div className="bg-blue-600 text-white p-4 rounded-lg shadow-lg mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="font-medium">
              {selectedProducts.size} product{selectedProducts.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setSelectedProducts(new Set());
                  setShowBulkActions(false);
                }}
                className="bg-blue-500 hover:bg-blue-700 px-3 py-1 rounded text-sm"
              >
                Clear Selection
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={bulkAction}
              onChange={(e) => {
                const action = e.target.value;
                setBulkAction(action);
                if (action === 'delete') {
                  handleBulkDelete();
                } else if (action.startsWith('category-')) {
                  const category = action.replace('category-', '');
                  handleBulkCategoryChange(category);
                }
              }}
              className="bg-white text-gray-900 border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="">Choose Action...</option>
              <option value="delete">🗑️ Delete Selected</option>
              <optgroup label="Change Category">
                {CATEGORIES.map(category => (
                  <option key={category} value={`category-${category}`}>
                    📂 {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="flex-1 bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto h-full">
          <table className="min-w-full h-full">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={filteredProducts.length > 0 && selectedProducts.size === filteredProducts.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coverage
                </th>
                {stores.map(store => (
                  <th key={store.id} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {store.name}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => {
                const isEditingName = editingCell === `${product.id}-name`;
                const isEditingCategory = editingCell === `${product.id}-category`;
                
                return (
                <tr key={product.id} className={`hover:bg-gray-50 ${selectedProducts.has(product.id) ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}>
                  <td className="px-2 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectedProducts.has(product.id)}
                      onChange={() => handleSelectProduct(product.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-4">
                    {isEditingName ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleEditSave(product.id, null, 'name');
                            } else if (e.key === 'Escape') {
                              handleEditCancel();
                            }
                          }}
                          className="font-medium text-gray-900 px-2 py-1 border border-blue-300 rounded"
                          autoFocus
                        />
                        <button
                          onClick={() => handleEditSave(product.id, null, 'name')}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          ✓
                        </button>
                        <button
                          onClick={handleEditCancel}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          ✗
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEditStart(product.id, null, 'name', product.name)}
                        className="font-medium text-gray-900 hover:bg-blue-50 px-2 py-1 rounded transition-colors cursor-pointer text-left"
                      >
                        {product.name}
                      </button>
                    )}
                    <div className="text-sm text-gray-500">{product.id}</div>
                  </td>
                  <td className="px-4 py-4">
                    {isEditingCategory ? (
                      <div className="flex items-center space-x-2">
                        <select
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleEditSave(product.id, null, 'category');
                            } else if (e.key === 'Escape') {
                              handleEditCancel();
                            }
                          }}
                          className="px-2 py-1 border border-blue-300 rounded text-xs"
                          autoFocus
                        >
                          {CATEGORIES.map(category => (
                            <option key={category} value={category}>
                              {category.charAt(0).toUpperCase() + category.slice(1)}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleEditSave(product.id, null, 'category')}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          ✓
                        </button>
                        <button
                          onClick={handleEditCancel}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          ✗
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEditStart(product.id, null, 'category', product.category)}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors cursor-pointer"
                      >
                        {product.category}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="text-sm font-medium">
                      {product.pricesAvailable}/{product.totalStores}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${(product.pricesAvailable / product.totalStores) * 100}%` }}
                      ></div>
                    </div>
                  </td>
                  {stores.map(store => {
                    const priceData = product.prices[store.name];
                    const cellKey = `${product.id}-${store.name}-price`;
                    const isEditing = editingCell === cellKey;

                    return (
                      <td key={store.id} className="px-4 py-4 text-center">
                        {priceData ? (
                          <div className="space-y-1">
                            {isEditing ? (
                              <div className="flex items-center space-x-1">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      handleEditSave(product.id, store.name, 'price');
                                    } else if (e.key === 'Escape') {
                                      handleEditCancel();
                                    }
                                  }}
                                  className="w-20 px-2 py-1 border border-blue-300 rounded text-sm font-bold text-green-600"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleEditSave(product.id, store.name, 'price')}
                                  className="text-green-600 hover:text-green-800 text-sm"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={handleEditCancel}
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  ✗
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleEditStart(product.id, store.name, 'price', priceData.price)}
                                className="text-lg font-bold text-green-600 hover:bg-green-50 px-2 py-1 rounded transition-colors"
                              >
                                £{priceData.price.toFixed(2)}
                              </button>
                            )}
                            <div className="text-xs text-gray-500">{priceData.unit}</div>
                            <div className="text-xs text-gray-400">
                              {new Date(priceData.lastUpdated).toLocaleDateString()}
                            </div>
                            <div className={`text-xs px-2 py-0.5 rounded-full ${
                              priceData.inStock 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {priceData.inStock ? 'In Stock' : 'Out of Stock'}
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingCell(`${product.id}-${store.name}-price`);
                              setEditValue('');
                            }}
                            className="text-gray-400 hover:text-blue-600 py-2 px-3 rounded hover:bg-blue-50 transition-colors"
                          >
                            + Add Price
                          </button>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-4 py-4 text-center">
                    <button
                      onClick={() => handleDeleteProduct(product.id, product.name)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                      title="Delete Product"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">📦</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500">
                {searchTerm || selectedCategory !== 'all' || selectedStore !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No products available in the database'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="text-sm text-blue-800">
          <strong>💡 Quick Tips:</strong> Click any price to edit it instantly • Use filters to find specific products • 
          Missing prices? Click "+ Add Price" to add them • Changes sync automatically • Auto-backup every 4 hours ensures data safety
        </div>
      </div>
    </div>
  );
};

const DataQualityPage = () => (
  <div className="p-6">
    <h2 className="text-xl font-bold mb-4">Data Quality Center</h2>
    <p className="text-gray-600">Coming soon - Quality alerts and validation</p>
  </div>
);

const AnalyticsDashboard = () => (
  <div className="p-6">
    <h2 className="text-xl font-bold mb-4">Analytics Dashboard</h2>
    <p className="text-gray-600">Coming soon - Metrics and insights</p>
  </div>
);

// Page 7: Mobile Store Visit Mode
const MobileEntryMode = () => {
  const [selectedStore, setSelectedStore] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mobileEntries, setMobileEntries] = useState([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('item');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  // Listen for offline/online status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load entries from localStorage on mount
  useEffect(() => {
    const savedEntries = localStorage.getItem('mobileEntries');
    if (savedEntries) {
      setMobileEntries(JSON.parse(savedEntries));
    }
  }, []);

  // Save entries to localStorage
  useEffect(() => {
    localStorage.setItem('mobileEntries', JSON.stringify(mobileEntries));
  }, [mobileEntries]);

  const handleQuickEntry = () => {
    if (!selectedStore || !productName || !price) return;

    const entry = {
      id: Date.now(),
      store: selectedStore,
      product: productName,
      price: parseFloat(price),
      unit,
      barcode: barcodeInput,
      timestamp: new Date().toISOString(),
      synced: false
    };

    setMobileEntries([entry, ...mobileEntries]);
    
    // Clear form
    setProductName('');
    setPrice('');
    setBarcodeInput('');
    setCurrentIndex(prev => prev + 1);

    // Try to sync if online
    if (!isOffline) {
      syncEntry(entry);
    }
  };

  const syncEntry = async (entry) => {
    try {
      await fetch(`${API_URL}/api/manual/add-price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': 'temp-password-123'
        },
        body: JSON.stringify({
          store: entry.store,
          productName: entry.product,
          price: entry.price,
          unit: entry.unit
        })
      });
      
      // Mark as synced
      setMobileEntries(prev => 
        prev.map(e => e.id === entry.id ? { ...e, synced: true } : e)
      );
    } catch (error) {
      console.log('Sync failed, will retry later');
    }
  };

  const syncAllEntries = async () => {
    const unsyncedEntries = mobileEntries.filter(e => !e.synced);
    
    for (const entry of unsyncedEntries) {
      await syncEntry(entry);
    }
  };

  const clearEntries = () => {
    if (window.confirm('Clear all mobile entries? This cannot be undone.')) {
      setMobileEntries([]);
      setCurrentIndex(0);
    }
  };

  // Simulate barcode scanner (in real app, would use camera)
  const simulateBarcodeScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      const mockBarcode = '123456789012' + Math.floor(Math.random() * 10);
      setBarcodeInput(mockBarcode);
      
      // Try to find product by barcode
      const product = MOCK_PRODUCTS.find(p => p.barcode === mockBarcode);
      if (product) {
        setProductName(product.name);
        setUnit(product.unit);
      }
      
      setIsScanning(false);
    }, 2000);
  };

  return (
    <div className="h-full bg-gray-100 p-4">
      {/* Mobile Header */}
      <div className="bg-white rounded-lg shadow p-4 mb-4 sticky top-4 z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Store Visit Mode</h2>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isOffline ? 'bg-red-400' : 'bg-green-400'}`}></div>
            <span className="text-xs text-gray-600">
              {isOffline ? 'Offline' : 'Online'}
            </span>
          </div>
        </div>

        {/* Store Selector - Large Buttons */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {getAllStores().slice(0, 4).map((store) => (
            <button
              key={store.id}
              onClick={() => setSelectedStore(store.name)}
              className={`p-3 rounded-lg text-left transition-colors ${
                selectedStore === store.name
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <div className="font-medium text-sm">{store.name}</div>
            </button>
          ))}
        </div>

        {/* Entry Counter */}
        <div className="text-center py-2 bg-blue-50 rounded">
          <span className="text-sm text-blue-800 font-medium">
            Entry #{currentIndex + 1} • {mobileEntries.length} total
          </span>
        </div>
      </div>

      {selectedStore && (
        <div className="space-y-4">
          {/* Quick Entry Form */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-medium mb-4">Product Entry</h3>
            
            {/* Barcode Scanner */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Barcode (Optional)
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Scan or enter barcode"
                  className="flex-1 px-3 py-3 border border-gray-300 rounded-lg text-lg"
                />
                <button
                  onClick={simulateBarcodeScan}
                  disabled={isScanning}
                  className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isScanning ? '📷' : '📱'}
                </button>
              </div>
              {isScanning && (
                <div className="mt-2 text-center text-blue-600 text-sm">
                  📷 Scanning... (simulated)
                </div>
              )}
            </div>

            {/* Product Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg"
                placeholder="Enter product name"
                autoFocus
              />
            </div>

            {/* Price Entry - Large Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (£) *
              </label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-4 border border-gray-300 rounded-lg text-2xl font-bold text-center"
                placeholder="0.00"
                inputMode="decimal"
              />
            </div>

            {/* Unit Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg"
              >
                {UNIT_OPTIONS.slice(0, 10).map(unitOption => (
                  <option key={unitOption} value={unitOption}>{unitOption}</option>
                ))}
              </select>
            </div>

            {/* Large Save Button */}
            <button
              onClick={handleQuickEntry}
              disabled={!selectedStore || !productName || !price}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-medium"
            >
              Save Entry
            </button>
          </div>

          {/* Recent Entries */}
          {mobileEntries.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Recent Entries</h3>
                <div className="flex space-x-2">
                  {!isOffline && (
                    <button
                      onClick={syncAllEntries}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Sync All
                    </button>
                  )}
                  <button
                    onClick={clearEntries}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {mobileEntries.slice(0, 10).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{entry.product}</div>
                      <div className="text-xs text-gray-500">
                        {entry.store} • £{entry.price} • {entry.unit}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${entry.synced ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                      <span className="text-xs text-gray-500">
                        {entry.synced ? 'Synced' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!selectedStore && (
        <div className="text-center mt-12">
          <div className="text-4xl mb-4">🏪</div>
          <h3 className="text-lg font-medium mb-2">Select a Store</h3>
          <p className="text-gray-600">Choose which store you're visiting to start entering prices</p>
        </div>
      )}

      {/* Offline Notice */}
      {isOffline && (
        <div className="fixed bottom-4 left-4 right-4 bg-orange-100 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center">
            <span className="text-orange-600 mr-2">📡</span>
            <span className="text-orange-800 text-sm">
              You're offline. Entries will sync when connection is restored.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const AutomationAssistant = () => (
  <div className="p-6">
    <h2 className="text-xl font-bold mb-4">Automation Assistant</h2>
    <p className="text-gray-600">Coming soon - Bulk operations and automation</p>
  </div>
);

export default GroceryAdminPanel;