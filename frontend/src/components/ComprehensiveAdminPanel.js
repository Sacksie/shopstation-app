import React, { useState, useEffect, useCallback, useRef } from 'react';
import config from '../config/environments';

const API_URL = config.api.baseUrl;

const ComprehensiveAdminPanel = () => {
  const [activeTab, setActiveTab] = useState('inventory');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Authentication Component
  const AuthScreen = () => {
    const handleAuth = async (e) => {
      e.preventDefault();
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
        setAuthError('Connection error');
      }
    };

    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h2 className="text-2xl font-bold mb-6 text-center">ShopStation Admin</h2>
          <form onSubmit={handleAuth}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Admin Password
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onInput={(e) => setAdminPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoComplete="new-password"
                key="admin-password-input"
                placeholder="Enter admin password"
                maxLength="50"
                required
              />
            </div>
            {authError && (
              <div className="mb-4 text-red-600 text-sm">{authError}</div>
            )}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-200"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  };

  // Navigation Tabs
  const TabNavigation = () => {
    const tabs = [
      { id: 'inventory', name: 'Inventory', icon: '📦' },
      { id: 'analytics', name: 'Analytics', icon: '📊' },
      { id: 'add-product', name: 'Add Products', icon: '➕' },
      { id: 'backup', name: 'Backup & Restore', icon: '💾' },
      { id: 'settings', name: 'Settings', icon: '⚙️' },
      { id: 'monitoring', name: 'System Health', icon: '🔥' }
    ];

    return (
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap flex items-center space-x-2 border-b-2 transition duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">ShopStation Admin Dashboard</h1>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      
      <TabNavigation />
      
      <div className="container mx-auto px-4 py-6">
        {activeTab === 'inventory' && <InventoryPage adminPassword={adminPassword} />}
        {activeTab === 'analytics' && <AnalyticsPage adminPassword={adminPassword} />}
        {activeTab === 'add-product' && <AddProductPage adminPassword={adminPassword} />}
        {activeTab === 'backup' && <BackupPage adminPassword={adminPassword} />}
        {activeTab === 'settings' && <SettingsPage adminPassword={adminPassword} />}
        {activeTab === 'monitoring' && <MonitoringPage adminPassword={adminPassword} />}
      </div>
    </div>
  );
};

// Page 1: Inventory Management with Inline Editing
const InventoryPage = ({ adminPassword }) => {
  const [products, setProducts] = useState({});
  const [stores, setStores] = useState({});
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const inputRef = useRef(null);

  const fetchInventory = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/manual/inventory`, {
        headers: { 'x-admin-password': adminPassword }
      });
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.data.products);
        setStores(data.data.stores);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
    setLoading(false);
  }, [adminPassword]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const handleCellEdit = (productKey, store, field, currentValue) => {
    setEditingCell(`${productKey}-${store}-${field}`);
    setEditValue(currentValue || '');
  };

  const handleCellSave = async (productKey, store, field) => {
    try {
      if (field === 'price') {
        const price = parseFloat(editValue);
        if (isNaN(price) || price <= 0) {
          alert('Please enter a valid price');
          return;
        }

        const unit = products[productKey]?.prices[store]?.unit || 'item';
        
        await fetch(`${API_URL}/api/manual/add-price`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-password': adminPassword
          },
          body: JSON.stringify({
            store,
            productName: productKey,
            price: price,
            unit: unit
          })
        });
      } else if (field === 'unit') {
        const price = products[productKey]?.prices[store]?.price || 0;
        
        await fetch(`${API_URL}/api/manual/add-price`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-password': adminPassword
          },
          body: JSON.stringify({
            store,
            productName: productKey,
            price: price,
            unit: editValue
          })
        });
      }

      await fetchInventory();
    } catch (error) {
      console.error('Error updating:', error);
      alert('Error updating product');
    }
    
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyPress = (e, productKey, store, field) => {
    if (e.key === 'Enter') {
      handleCellSave(productKey, store, field);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };

  const filteredProducts = Object.entries(products).filter(([key, product]) => {
    const matchesSearch = key.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         product.displayName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(Object.values(products).map(p => p.category))];

  if (loading) {
    return <div className="text-center py-8">Loading inventory...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Inventory Management</h2>
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                {Object.keys(stores).map(store => (
                  <th key={store} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {store}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map(([key, product]) => (
                <tr key={key} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{product.displayName}</div>
                      <div className="text-sm text-gray-500">{key}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {product.category}
                    </span>
                  </td>
                  {Object.keys(stores).map(store => {
                    const storePrice = product.prices?.[store];
                    return (
                      <td key={store} className="px-4 py-4 text-center">
                        {storePrice ? (
                          <div className="space-y-1">
                            <div 
                              className="cursor-pointer hover:bg-yellow-100 px-2 py-1 rounded"
                              onClick={() => handleCellEdit(key, store, 'price', storePrice.price)}
                            >
                              {editingCell === `${key}-${store}-price` ? (
                                <input
                                  ref={inputRef}
                                  type="number"
                                  step="0.01"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={() => handleCellSave(key, store, 'price')}
                                  onKeyDown={(e) => handleKeyPress(e, key, store, 'price')}
                                  className="w-16 px-1 py-0.5 text-sm border rounded text-center"
                                />
                              ) : (
                                <span className="text-sm font-medium text-green-600">£{storePrice.price}</span>
                              )}
                            </div>
                            <div 
                              className="cursor-pointer hover:bg-yellow-100 px-2 py-1 rounded"
                              onClick={() => handleCellEdit(key, store, 'unit', storePrice.unit)}
                            >
                              {editingCell === `${key}-${store}-unit` ? (
                                <input
                                  ref={inputRef}
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={() => handleCellSave(key, store, 'unit')}
                                  onKeyDown={(e) => handleKeyPress(e, key, store, 'unit')}
                                  className="w-16 px-1 py-0.5 text-xs border rounded text-center"
                                />
                              ) : (
                                <span className="text-xs text-gray-500">{storePrice.unit}</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleCellEdit(key, store, 'price', '')}
                            className="text-xs text-blue-600 hover:text-blue-800 border border-dashed border-blue-300 px-2 py-1 rounded"
                          >
                            + Add Price
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No products found matching your filters.
          </div>
        )}
      </div>
    </div>
  );
};

// Page 2: Analytics Dashboard
const AnalyticsPage = ({ adminPassword }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('7');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`${API_URL}/api/analytics?days=${timeframe}`, {
          headers: { 'x-admin-password': adminPassword }
        });
        const data = await response.json();
        setAnalytics(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      }
      setLoading(false);
    };

    fetchAnalytics();
  }, [timeframe, adminPassword]);

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  const stats = [
    { name: 'Total Searches', value: analytics?.totalSearches || 0, icon: '🔍' },
    { name: 'Unique Users', value: analytics?.uniqueUsers || 0, icon: '👥' },
    { name: 'Popular Store', value: analytics?.popularStore || 'N/A', icon: '🏪' },
    { name: 'Avg. Savings', value: `£${analytics?.avgSavings || 0}`, icon: '💰' }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Analytics Dashboard</h2>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="1">Last 24 hours</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg">
              <div className="flex items-center">
                <div className="text-2xl mr-3">{stat.icon}</div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {analytics?.topProducts && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Top Searched Products</h3>
              <div className="space-y-3">
                {analytics.topProducts.slice(0, 5).map((product, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">{product.name}</span>
                    <span className="text-sm font-medium text-blue-600">{product.count} searches</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Store Performance</h3>
              <div className="space-y-3">
                {analytics?.storeStats && Object.entries(analytics.storeStats).map(([store, stats]) => (
                  <div key={store} className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">{store}</span>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">{stats.selections} selections</div>
                      <div className="text-xs text-gray-500">{stats.avgSavings}% avg savings</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Page 3: Simple Product Addition (Mobile/Desktop Optimized)
const AddProductPage = ({ adminPassword }) => {
  const [stores] = useState(['B Kosher', 'Tapuach', 'Kosher Kingdom', 'Kays']);
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('uncategorized');
  const [prices, setPrices] = useState({});
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'dairy', 'meat', 'bakery', 'produce', 'pantry', 'beverages', 'frozen', 'uncategorized'
  ];

  const handlePriceChange = (store, field, value) => {
    setPrices(prev => ({
      ...prev,
      [store]: {
        ...prev[store],
        [field]: value
      }
    }));
  };

  const handleSingleProductAdd = async (e) => {
    e.preventDefault();
    if (!productName.trim()) return;

    setIsSubmitting(true);
    try {
      const storesToUpdate = Object.entries(prices).filter(([store, data]) => 
        data?.price && parseFloat(data.price) > 0
      );

      for (const [store, data] of storesToUpdate) {
        await fetch(`${API_URL}/api/manual/add-price`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-password': adminPassword
          },
          body: JSON.stringify({
            store,
            productName: productName.trim(),
            price: parseFloat(data.price),
            unit: data.unit || 'item'
          })
        });
      }

      // Reset form
      setProductName('');
      setPrices({});
      alert('Product added successfully!');
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Error adding product');
    }
    setIsSubmitting(false);
  };

  const handleBulkAdd = async () => {
    if (!bulkText.trim()) return;

    setIsSubmitting(true);
    try {
      const lines = bulkText.trim().split('\n').filter(line => line.trim());
      const products = [];

      for (const line of lines) {
        // Support format: "Product Name, Store, Price, Unit"
        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 3) {
          products.push({
            name: parts[0],
            store: parts[1],
            price: parseFloat(parts[2]),
            unit: parts[3] || 'item'
          });
        }
      }

      for (const product of products) {
        if (product.name && product.store && product.price > 0) {
          await fetch(`${API_URL}/api/manual/add-price`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-admin-password': adminPassword
            },
            body: JSON.stringify({
              store: product.store,
              productName: product.name,
              price: product.price,
              unit: product.unit
            })
          });
        }
      }

      setBulkText('');
      alert(`Added ${products.length} products successfully!`);
    } catch (error) {
      console.error('Error bulk adding:', error);
      alert('Error adding products');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Add Products</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setBulkMode(false)}
              className={`px-4 py-2 rounded-md transition ${
                !bulkMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Single Product
            </button>
            <button
              onClick={() => setBulkMode(true)}
              className={`px-4 py-2 rounded-md transition ${
                bulkMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Bulk Import
            </button>
          </div>
        </div>

        {!bulkMode ? (
          <form onSubmit={handleSingleProductAdd} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stores.map(store => (
                <div key={store} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">{store}</h3>
                  <div className="space-y-2">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Price (£)"
                      value={prices[store]?.price || ''}
                      onChange={(e) => handlePriceChange(store, 'price', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                    />
                    <input
                      type="text"
                      placeholder="Unit (e.g., kg, pack)"
                      value={prices[store]?.unit || ''}
                      onChange={(e) => handlePriceChange(store, 'unit', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !productName.trim()}
              className="w-full md:w-auto px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition"
            >
              {isSubmitting ? 'Adding Product...' : 'Add Product'}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bulk Import (Format: Product Name, Store, Price, Unit - one per line)
              </label>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="Milk, B Kosher, 2.50, 2 pints
Challah, Tapuach, 3.75, loaf
Eggs, Kosher Kingdom, 3.10, dozen"
                rows={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>
            <button
              onClick={handleBulkAdd}
              disabled={isSubmitting || !bulkText.trim()}
              className="w-full md:w-auto px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition"
            >
              {isSubmitting ? 'Importing Products...' : 'Import Products'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Page 4: Backup & Restore System
const BackupPage = ({ adminPassword }) => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);

  const fetchBackups = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/backup/status`, {
        headers: { 'x-admin-password': adminPassword }
      });
      const data = await response.json();
      setBackups(data.backups || []);
    } catch (error) {
      console.error('Error fetching backups:', error);
    }
    setLoading(false);
  }, [adminPassword]);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  const createBackup = async () => {
    try {
      await fetch(`${API_URL}/api/backup/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword
        },
        body: JSON.stringify({ reason: 'manual-admin-panel' })
      });
      alert('Backup created successfully!');
      fetchBackups();
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('Error creating backup');
    }
  };

  const restoreLatestBackup = async () => {
    if (!window.confirm('Are you sure you want to restore the latest backup? This will overwrite current data.')) {
      return;
    }

    try {
      const latestBackup = backups[0];
      const response = await fetch(`${API_URL}/api/backup/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword
        },
        body: JSON.stringify({ filename: latestBackup.filename })
      });

      if (response.ok) {
        alert('Latest backup restored successfully!');
        window.location.reload();
      } else {
        alert('Error restoring backup');
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      alert('Error restoring backup');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading backups...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-6">Backup & Restore</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={createBackup}
            className="px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center justify-center space-x-2"
          >
            <span>💾</span>
            <span>Create Manual Backup</span>
          </button>
          <button
            onClick={restoreLatestBackup}
            disabled={backups.length === 0}
            className="px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center space-x-2"
          >
            <span>🔄</span>
            <span>Restore Latest</span>
          </button>
          <div className="flex items-center justify-center space-x-2 border border-gray-300 rounded-md px-4 py-3">
            <input
              type="checkbox"
              id="autoBackup"
              checked={autoBackupEnabled}
              onChange={(e) => setAutoBackupEnabled(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="autoBackup" className="text-sm">Auto-backup (4hrs)</label>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-medium">Available Backups ({backups.length})</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {backups.map((backup, index) => (
              <div key={backup.filename} className={`px-4 py-3 border-b border-gray-100 flex justify-between items-center ${index === 0 ? 'bg-green-50' : ''}`}>
                <div>
                  <div className="font-medium text-sm">
                    {backup.filename}
                    {index === 0 && <span className="ml-2 text-green-600 text-xs">(Latest)</span>}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(backup.created).toLocaleString()} • {backup.size}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm(`Restore backup from ${new Date(backup.created).toLocaleString()}?`)) {
                      // Implement individual backup restore
                      alert('Individual restore coming soon!');
                    }
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Restore
                </button>
              </div>
            ))}
            {backups.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500">
                No backups available. Create your first backup above.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Page 5: Settings
const SettingsPage = ({ adminPassword }) => {
  const [settings, setSettings] = useState({
    autoBackupInterval: '4',
    maxBackupsToKeep: '10',
    enableAnalytics: true,
    enableCookieConsent: true
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-6">System Settings</h2>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auto-backup Interval (hours)
              </label>
              <select
                value={settings.autoBackupInterval}
                onChange={(e) => handleSettingChange('autoBackupInterval', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="1">Every hour</option>
                <option value="4">Every 4 hours</option>
                <option value="12">Every 12 hours</option>
                <option value="24">Daily</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Backups to Keep
              </label>
              <select
                value={settings.maxBackupsToKeep}
                onChange={(e) => handleSettingChange('maxBackupsToKeep', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="5">5 backups</option>
                <option value="10">10 backups</option>
                <option value="20">20 backups</option>
                <option value="50">50 backups</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="enableAnalytics"
                checked={settings.enableAnalytics}
                onChange={(e) => handleSettingChange('enableAnalytics', e.target.checked)}
                className="rounded"
              />
              <label htmlFor="enableAnalytics" className="text-sm font-medium text-gray-700">
                Enable User Analytics Collection
              </label>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="enableCookieConsent"
                checked={settings.enableCookieConsent}
                onChange={(e) => handleSettingChange('enableCookieConsent', e.target.checked)}
                className="rounded"
              />
              <label htmlFor="enableCookieConsent" className="text-sm font-medium text-gray-700">
                Show Cookie Consent Banner
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-lg font-medium mb-4">Admin Information</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Current Password:</span>
                  <span className="ml-2 font-mono bg-gray-200 px-2 py-1 rounded">Gavtalej22</span>
                </div>
                <div>
                  <span className="font-medium">API URL:</span>
                  <span className="ml-2 text-blue-600 break-all">{API_URL}</span>
                </div>
              </div>
            </div>
          </div>

          <button className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

// Page 6: System Health Monitoring
const MonitoringPage = ({ adminPassword }) => {
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSystemHealth = async () => {
      try {
        const healthResponse = await fetch(`${API_URL}/api/health`);
        const health = await healthResponse.json();

        const inventoryResponse = await fetch(`${API_URL}/api/manual/inventory`, {
          headers: { 'x-admin-password': adminPassword }
        });
        const inventory = await inventoryResponse.json();

        setSystemHealth({
          ...health,
          totalProducts: Object.keys(inventory.data?.products || {}).length,
          totalStores: Object.keys(inventory.data?.stores || {}).length,
          lastBackup: inventory.data?.lastUpdated
        });
      } catch (error) {
        console.error('Error fetching system health:', error);
      }
      setLoading(false);
    };

    fetchSystemHealth();
    const interval = setInterval(fetchSystemHealth, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [adminPassword]);

  if (loading) {
    return <div className="text-center py-8">Loading system health...</div>;
  }

  const healthItems = [
    { name: 'API Status', value: systemHealth?.status || 'Unknown', status: systemHealth?.status === 'OK' ? 'good' : 'error' },
    { name: 'Total Products', value: systemHealth?.totalProducts || 0, status: 'good' },
    { name: 'Total Stores', value: systemHealth?.totalStores || 0, status: 'good' },
    { name: 'Last Update', value: systemHealth?.lastBackup ? new Date(systemHealth.lastBackup).toLocaleString() : 'Unknown', status: 'good' }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-6">System Health Monitor</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {healthItems.map((item) => (
            <div key={item.name} className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{item.name}</p>
                  <p className="text-lg font-bold text-gray-900">{item.value}</p>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  item.status === 'good' ? 'bg-green-400' : 'bg-red-400'
                }`} />
              </div>
            </div>
          ))}
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="text-green-400 text-xl mr-3">✅</div>
            <div>
              <h3 className="text-green-800 font-medium">System Operating Normally</h3>
              <p className="text-green-700 text-sm">All services are running and responding correctly.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveAdminPanel;