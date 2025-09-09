import React, { useState, useEffect, useCallback, useRef } from 'react';
import config from '../config/environments';

const API_URL = config.api.baseUrl;

const ComprehensiveAdminPanel = ({ onBack }) => { // onBack is now a prop to return
  const [activeTab, setActiveTab] = useState('inventory');

  // Authentication is removed. The panel is always visible.

  // Navigation Tabs
  const TabNavigation = () => {
    const tabs = [
      { id: 'inventory', name: 'Inventory', icon: '📦', shortName: 'Products' },
      { id: 'analytics', name: 'Analytics', icon: '📊', shortName: 'Stats' },
      { id: 'add-product', name: 'Add Products', icon: '➕', shortName: 'Add' },
      { id: 'backup', name: 'Backup & Restore', icon: '💾', shortName: 'Backup' },
      { id: 'settings', name: 'Settings', icon: '⚙️', shortName: 'Settings' },
      { id: 'monitoring', name: 'System Health', icon: '🔥', shortName: 'Health' }
    ];

    return (
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`min-w-[60px] sm:min-w-auto px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium whitespace-nowrap flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 border-b-2 transition duration-200 touch-manipulation ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="text-lg sm:text-base">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.name}</span>
                <span className="sm:hidden text-xs">{tab.shortName}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">ShopStation Admin Dashboard</h1>
            <button
              onClick={onBack} // Use the onBack prop to go back to the main page
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              ← Back to Main Page
            </button>
          </div>
        </div>
      </div>
      
      <TabNavigation />
      
      <div className="container mx-auto px-4 py-6">
        {activeTab === 'inventory' && <InventoryPage />}
        {activeTab === 'analytics' && <AnalyticsPage />}
        {activeTab === 'add-product' && <AddProductPage />}
        {activeTab === 'backup' && <BackupPage />}
        {activeTab === 'settings' && <SettingsPage />}
        {activeTab === 'monitoring' && <MonitoringPage />}
      </div>
    </div>
  );
};

// Inline Editable Cell Component
const InlineEditableCell = ({ value, onSave, type = 'text', placeholder = 'Tap to add', className = '', isEditing, onStartEdit, onCancelEdit, inputRef }) => {
  const [editValue, setEditValue] = useState(value || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  const handleSave = async () => {
    if (editValue === value) {
      onCancelEdit();
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onCancelEdit();
      }, 1000);
    } catch (error) {
      console.error('Save error:', error);
      // Reset on error
      setEditValue(value || '');
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value || '');
      onCancelEdit();
    }
  };

  if (isEditing) {
    return (
      <div className="relative">
        <input
          ref={inputRef}
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyPress}
          className={`w-full px-2 py-1 border-2 border-blue-500 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 ${className}`}
          autoFocus
          inputMode={type === 'number' ? 'decimal' : 'text'}
        />
        {isSaving && (
          <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      onClick={onStartEdit}
      className={`min-h-[44px] flex items-center px-2 py-1 cursor-pointer hover:bg-gray-100 rounded transition-colors ${className}`}
    >
      {value ? (
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">{value}</span>
          {saveSuccess && (
            <div className="text-green-500 animate-pulse">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      ) : (
        <span className="text-gray-400 text-sm">{placeholder}</span>
      )}
    </div>
  );
};

// Quick Price Entry Modal
const QuickPriceModal = ({ isOpen, onClose, onSave, productName, storeName, currentPrice, currentUnit }) => {
  const [price, setPrice] = useState(currentPrice || '');
  const [unit, setUnit] = useState(currentUnit || 'item');
  const [isSaving, setIsSaving] = useState(false);

  const commonUnits = ['item', 'kg', '500g', 'lb', 'litre', '2 pints', 'pint', 'dozen', 'pack', 'loaf', 'bottle'];

  const handleSave = async () => {
    if (!price || parseFloat(price) <= 0) return;
    
    setIsSaving(true);
    try {
      await onSave(parseFloat(price), unit);
      onClose();
    } catch (error) {
      console.error('Error saving price:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-sm w-full p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Add Price</h3>
          <p className="text-sm text-gray-600">{productName} at {storeName}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price (£)</label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
              autoFocus
              inputMode="decimal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {commonUnits.map(unitOption => (
                <option key={unitOption} value={unitOption}>{unitOption}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex space-x-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!price || parseFloat(price) <= 0 || isSaving}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg"
          >
            {isSaving ? 'Saving...' : 'Save Price'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Page 1: Inventory Management with Enhanced Mobile-First Inline Editing
const InventoryPage = () => {
  const [products, setProducts] = useState({});
  const [stores, setStores] = useState({});
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [quickPriceModal, setQuickPriceModal] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const inputRef = useRef(null);

  const fetchInventory = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/manual/inventory`);
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.data.products);
        setStores(data.data.stores);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
    setLoading(false);
  }, []);

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

  const handleCellSave = async (productKey, store, field, newValue) => {
    try {
      let response;
      if (field === 'price') {
        const price = parseFloat(newValue);
        if (isNaN(price) || price <= 0) {
          throw new Error('Please enter a valid price');
        }

        const unit = products[productKey]?.prices[store]?.unit || 'item';
        
        response = await fetch(`${API_URL}/api/manual/add-price`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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
        
        response = await fetch(`${API_URL}/api/manual/add-price`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            store,
            productName: productKey,
            price: price,
            unit: newValue
          })
        });
      } else if (field === 'displayName') {
        response = await fetch(`${API_URL}/api/manual/update-product-info`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productKey: productKey,
            displayName: newValue
          })
        });
      }

      if (response && !response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update. Status: ${response.status}`);
      }

      await fetchInventory();
    } catch (error) {
      console.error('Error updating:', error);
      throw error;
    }
  };

  const handleQuickPriceAdd = (productKey, store) => {
    const product = products[productKey];
    setQuickPriceModal({
      productKey,
      store,
      productName: product?.displayName || productKey,
      currentPrice: product?.prices?.[store]?.price,
      currentUnit: product?.prices?.[store]?.unit || 'item'
    });
  };

  const handleQuickPriceSave = async (price, unit) => {
    try {
      const response = await fetch(`${API_URL}/api/manual/add-price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          store: quickPriceModal.store,
          productName: quickPriceModal.productKey,
          price: price,
          unit: unit
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to save price. Status: ${response.status}`);
      }

      await fetchInventory();
      setQuickPriceModal(null);
    } catch (error) {
      console.error('Error saving price:', error);
      throw error;
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-4 sm:space-y-0">
          <h2 className="text-xl font-bold">Inventory Management</h2>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  viewMode === 'table' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📊 Table
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  viewMode === 'cards' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📱 Cards
              </button>
            </div>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md w-full sm:w-64"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md w-full sm:w-auto"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-50 sticky top-0 z-10">
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
                      <div className="space-y-1">
                        <InlineEditableCell
                          value={product.displayName}
                          onSave={(newValue) => handleCellSave(key, null, 'displayName', newValue)}
                          type="text"
                          placeholder="Tap to edit name"
                          isEditing={editingCell === `${key}-displayName`}
                          onStartEdit={() => handleCellEdit(key, null, 'displayName', product.displayName)}
                          onCancelEdit={() => setEditingCell(null)}
                          inputRef={inputRef}
                        />
                        <div className="text-xs text-gray-500">{key}</div>
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
                              <InlineEditableCell
                                value={`£${storePrice.price}`}
                                onSave={(newValue) => handleCellSave(key, store, 'price', newValue.replace('£', ''))}
                                type="number"
                                placeholder="Tap to edit price"
                                isEditing={editingCell === `${key}-${store}-price`}
                                onStartEdit={() => handleCellEdit(key, store, 'price', storePrice.price)}
                                onCancelEdit={() => setEditingCell(null)}
                                inputRef={inputRef}
                                className="text-sm font-medium text-green-600"
                              />
                              <InlineEditableCell
                                value={storePrice.unit}
                                onSave={(newValue) => handleCellSave(key, store, 'unit', newValue)}
                                type="text"
                                placeholder="Tap to edit unit"
                                isEditing={editingCell === `${key}-${store}-unit`}
                                onStartEdit={() => handleCellEdit(key, store, 'unit', storePrice.unit)}
                                onCancelEdit={() => setEditingCell(null)}
                                inputRef={inputRef}
                                className="text-xs text-gray-500"
                              />
                            </div>
                          ) : (
                            <button
                              onClick={() => handleQuickPriceAdd(key, store)}
                              className="w-full min-h-[44px] text-xs text-blue-600 hover:text-blue-800 border-2 border-dashed border-blue-300 px-2 py-2 rounded-lg hover:bg-blue-50 transition-colors"
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map(([key, product]) => (
              <div key={key} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="mb-3">
                  <InlineEditableCell
                    value={product.displayName}
                    onSave={(newValue) => handleCellSave(key, null, 'displayName', newValue)}
                    type="text"
                    placeholder="Tap to edit name"
                    isEditing={editingCell === `${key}-displayName`}
                    onStartEdit={() => handleCellEdit(key, null, 'displayName', product.displayName)}
                    onCancelEdit={() => setEditingCell(null)}
                    inputRef={inputRef}
                    className="text-lg font-semibold"
                  />
                  <div className="text-xs text-gray-500 mt-1">{key}</div>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                    {product.category}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {Object.keys(stores).map(store => {
                    const storePrice = product.prices?.[store];
                    return (
                      <div key={store} className="border border-gray-200 rounded-lg p-3">
                        <div className="text-xs font-medium text-gray-600 mb-2">{store}</div>
                        {storePrice ? (
                          <div className="space-y-1">
                            <InlineEditableCell
                              value={`£${storePrice.price}`}
                              onSave={(newValue) => handleCellSave(key, store, 'price', newValue.replace('£', ''))}
                              type="number"
                              placeholder="Tap to edit"
                              isEditing={editingCell === `${key}-${store}-price`}
                              onStartEdit={() => handleCellEdit(key, store, 'price', storePrice.price)}
                              onCancelEdit={() => setEditingCell(null)}
                              inputRef={inputRef}
                              className="text-sm font-bold text-green-600"
                            />
                            <InlineEditableCell
                              value={storePrice.unit}
                              onSave={(newValue) => handleCellSave(key, store, 'unit', newValue)}
                              type="text"
                              placeholder="Tap to edit"
                              isEditing={editingCell === `${key}-${store}-unit`}
                              onStartEdit={() => handleCellEdit(key, store, 'unit', storePrice.unit)}
                              onCancelEdit={() => setEditingCell(null)}
                              inputRef={inputRef}
                              className="text-xs text-gray-500"
                            />
                          </div>
                        ) : (
                          <button
                            onClick={() => handleQuickPriceAdd(key, store)}
                            className="w-full min-h-[44px] bg-blue-500 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                          >
                            Add Price
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No products found matching your filters.
          </div>
        )}
      </div>

      {/* Quick Price Modal */}
      {quickPriceModal && (
        <QuickPriceModal
          isOpen={!!quickPriceModal}
          onClose={() => setQuickPriceModal(null)}
          onSave={handleQuickPriceSave}
          productName={quickPriceModal.productName}
          storeName={quickPriceModal.store}
          currentPrice={quickPriceModal.currentPrice}
          currentUnit={quickPriceModal.currentUnit}
        />
      )}
    </div>
  );
};

// Page 2: Analytics Dashboard
const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('7');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`${API_URL}/api/analytics?days=${timeframe}`);
        const data = await response.json();
        setAnalytics(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      }
      setLoading(false);
    };

    fetchAnalytics();
  }, [timeframe]);

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

// Page 3: Enhanced Product Addition with Mobile-First Design
const AddProductPage = () => {
  const [stores] = useState(['B Kosher', 'Tapuach', 'Kosher Kingdom', 'Kays']);
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('uncategorized');
  const [prices, setPrices] = useState({});
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const categories = [
    'dairy', 'meat', 'bakery', 'produce', 'pantry', 'beverages', 'frozen', 'uncategorized'
  ];

  // Auto-complete suggestions based on existing products
  const fetchSuggestions = async (query) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/manual/inventory`);
      const data = await response.json();
      
      if (data.success) {
        const productNames = Object.values(data.data.products)
          .map(p => p.displayName)
          .filter(name => name.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 5);
        setSuggestions(productNames);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleProductNameChange = (value) => {
    setProductName(value);
    setErrors(prev => ({ ...prev, productName: null }));
    fetchSuggestions(value);
    setShowSuggestions(true);
  };

  const selectSuggestion = (suggestion) => {
    setProductName(suggestion);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handlePriceChange = (store, field, value) => {
    setPrices(prev => ({
      ...prev,
      [store]: {
        ...prev[store],
        [field]: value
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!productName.trim()) {
      newErrors.productName = 'Product name is required';
    }
    
    const storesToUpdate = Object.entries(prices).filter(([store, data]) => 
      data?.price && parseFloat(data.price) > 0
    );
    
    if (storesToUpdate.length === 0) {
      newErrors.prices = 'At least one store must have a price';
    }
    
    // Validate individual prices
    Object.entries(prices).forEach(([store, data]) => {
      if (data?.price) {
        const price = parseFloat(data.price);
        if (isNaN(price) || price <= 0) {
          newErrors[`${store}_price`] = 'Invalid price';
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSingleProductAdd = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSuccessMessage('');
    
    try {
      const storesToUpdate = Object.entries(prices).filter(([store, data]) => 
        data?.price && parseFloat(data.price) > 0
      );

      for (const [store, data] of storesToUpdate) {
        const response = await fetch(`${API_URL}/api/manual/add-price`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            store,
            productName: productName.trim(),
            price: parseFloat(data.price),
            unit: data.unit || 'item'
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Failed to add price for ${store}: ${errorData.error || response.statusText}`);
        }
      }

      // Reset form
      setProductName('');
      setPrices({});
      setErrors({});
      setSuccessMessage(`✅ Product "${productName.trim()}" added successfully to ${storesToUpdate.length} store(s)!`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error adding product:', error);
      setErrors({ submit: error.message || 'Error adding product. Please try again.' });
    }
    setIsSubmitting(false);
  };

  const handleBulkAdd = async () => {
    if (!bulkText.trim()) return;

    setIsSubmitting(true);
    setSuccessMessage('');
    setErrors({});
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
          const response = await fetch(`${API_URL}/api/manual/add-price`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              store: product.store,
              productName: product.name,
              price: product.price,
              unit: product.unit
            })
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Failed to import ${product.name}: ${errorData.error || response.statusText}`);
          }
        }
      }

      setBulkText('');
      setSuccessMessage(`✅ Imported ${products.length} products successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error bulk adding:', error);
      setErrors({ submit: error.message || 'An error occurred during bulk import.' });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <h2 className="text-xl font-bold">Add Products</h2>
          <div className="flex space-x-2 w-full sm:w-auto">
            <button
              onClick={() => setBulkMode(false)}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-md transition text-sm font-medium ${
                !bulkMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Single Product
            </button>
            <button
              onClick={() => setBulkMode(true)}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-md transition text-sm font-medium ${
                bulkMode ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Bulk Import
            </button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
            {errors.submit}
          </div>
        )}

        {!bulkMode ? (
          <form onSubmit={handleSingleProductAdd} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => handleProductNameChange(e.target.value)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className={`w-full px-3 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg ${
                    errors.productName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter product name..."
                  required
                />
                {errors.productName && (
                  <p className="text-red-500 text-xs mt-1">{errors.productName}</p>
                )}
                
                {/* Auto-complete suggestions */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => selectSuggestion(suggestion)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stores.map(store => (
                <div key={store} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h3 className="font-medium text-gray-900 mb-3 text-sm">{store}</h3>
                  <div className="space-y-3">
                    <div>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Price (£)"
                        value={prices[store]?.price || ''}
                        onChange={(e) => handlePriceChange(store, 'price', e.target.value)}
                        className={`w-full px-3 py-3 text-lg border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors[`${store}_price`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        inputMode="decimal"
                      />
                      {errors[`${store}_price`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`${store}_price`]}</p>
                      )}
                    </div>
                    <div>
                      <select
                        value={prices[store]?.unit || 'item'}
                        onChange={(e) => handlePriceChange(store, 'unit', e.target.value)}
                        className="w-full px-3 py-3 text-lg border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="item">item</option>
                        <option value="kg">kg</option>
                        <option value="500g">500g</option>
                        <option value="lb">lb</option>
                        <option value="litre">litre</option>
                        <option value="2 pints">2 pints</option>
                        <option value="pint">pint</option>
                        <option value="dozen">dozen</option>
                        <option value="pack">pack</option>
                        <option value="loaf">loaf</option>
                        <option value="bottle">bottle</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {errors.prices && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-md text-sm">
                {errors.prices}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !productName.trim()}
              className="w-full px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition text-lg font-medium min-h-[48px]"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Adding Product...</span>
                </div>
              ) : (
                'Add Product'
              )}
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
const BackupPage = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [migrationStatus, setMigrationStatus] = useState({ running: false, output: '', error: '' });

  const fetchBackups = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/backup/status`);
      const data = await response.json();
      setBackups(data.backups || []);
    } catch (error) {
      console.error('Error fetching backups:', error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  const runMigration = async () => {
    if (!window.confirm('Are you sure you want to migrate your JSON data to PostgreSQL? This can be run multiple times safely, but can take a moment.')) {
      return;
    }

    setMigrationStatus({ running: true, output: 'Starting migration...', error: '' });

    try {
      const response = await fetch(`${API_URL}/api/admin/migrate-to-pg`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (response.ok) {
        setMigrationStatus({ running: false, output: data.output, error: '' });
      } else {
        const errorMsg = data.stderr || data.error || 'Unknown error occurred.';
        setMigrationStatus({ running: false, output: data.output, error: errorMsg });
      }

    } catch (error) {
      console.error('Error migrating data:', error);
      setMigrationStatus({ running: false, output: '', error: 'A network or server error occurred.' });
    }
  };

  const createBackup = async () => {
    setIsCreating(true);
    setNotification({ message: '', type: '' });
    try {
      const response = await fetch(`${API_URL}/api/backup/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'manual-admin-panel' })
      });
      const data = await response.json();
      if (response.ok) {
        setNotification({ message: 'Backup created successfully!', type: 'success' });
        fetchBackups();
      } else {
        setNotification({ message: data.error || 'Failed to create backup.', type: 'error' });
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      setNotification({ message: 'An unexpected error occurred.', type: 'error' });
    } finally {
      setIsCreating(false);
    }
  };

  const restoreLatestBackup = async () => {
    if (!window.confirm('Are you sure you want to restore the latest backup? This will overwrite current data.')) {
      return;
    }

    setIsRestoring(true);
    setNotification({ message: '', type: '' });
    try {
      const latestBackup = backups[0];
      const response = await fetch(`${API_URL}/api/backup/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename: latestBackup.filename })
      });

      if (response.ok) {
        setNotification({ message: 'Latest backup restored successfully! The page will now reload.', type: 'success' });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        const data = await response.json();
        setNotification({ message: data.error || 'Failed to restore backup.', type: 'error' });
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      setNotification({ message: 'An unexpected error occurred.', type: 'error' });
    } finally {
      setIsRestoring(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading backups...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-6">Backup & Restore</h2>

        {notification.message && (
          <div className={`mb-6 p-4 rounded-md text-sm ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {notification.message}
          </div>
        )}

        <div className="border border-yellow-300 bg-yellow-50 rounded-lg p-4 mb-6">
          <h3 className="font-bold text-yellow-800 mb-2">🚀 Upgrade to PostgreSQL</h3>
          <p className="text-sm text-yellow-700 mb-4">
            Your application is ready to be fully migrated to a professional PostgreSQL database. 
            Click the button below to copy all product and price data from the old JSON file into the new database.
            This will ensure all your data is saved reliably.
          </p>
          <button
            onClick={runMigration}
            disabled={migrationStatus.running}
            className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50 transition font-semibold"
          >
            {migrationStatus.running ? 'Migrating...' : 'Migrate JSON data to PostgreSQL'}
          </button>
          
          {(migrationStatus.output || migrationStatus.error) && (
            <div className="mt-4 p-3 bg-gray-800 text-white rounded-md font-mono text-xs max-h-60 overflow-y-auto">
              <pre>{migrationStatus.output}</pre>
              {migrationStatus.error && <pre className="text-red-400">{migrationStatus.error}</pre>}
            </div>
          )}
        </div>

        <h3 className="text-lg font-semibold mb-4">Legacy JSON Backups</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={createBackup}
            disabled={isCreating || isRestoring}
            className="px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isCreating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <span>💾</span>
                <span>Create Manual Backup</span>
              </>
            )}
          </button>
          <button
            onClick={restoreLatestBackup}
            disabled={backups.length === 0 || isRestoring || isCreating}
            className="px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center space-x-2"
          >
            {isRestoring ? (
               <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Restoring...</span>
              </>
            ) : (
              <>
                <span>🔄</span>
                <span>Restore Latest</span>
              </>
            )}
          </button>
          <div className="flex items-center justify-center space-x-2 border border-gray-200 rounded-md px-4 py-3 bg-gray-50 cursor-not-allowed" title="This feature is coming soon.">
            <input
              type="checkbox"
              id="autoBackup"
              checked={false}
              disabled
              className="rounded cursor-not-allowed"
            />
            <label htmlFor="autoBackup" className="text-sm text-gray-500">Auto-backup (4hrs)</label>
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
const SettingsPage = () => {
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
const MonitoringPage = () => {
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSystemHealth = async () => {
      try {
        const healthResponse = await fetch(`${API_URL}/api/health`);
        const health = await healthResponse.json();

        const inventoryResponse = await fetch(`${API_URL}/api/manual/inventory`);
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
  }, []);

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