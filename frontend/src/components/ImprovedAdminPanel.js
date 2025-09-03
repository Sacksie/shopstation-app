import React, { useState, useEffect, useCallback } from 'react';
import config from '../config/environments';

const API_URL = config.api.baseUrl;

// Authentication Component
const AdminAuth = ({ onAuthenticated }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setError('');

    try {
      // Test authentication by fetching inventory
      const response = await fetch(`${API_URL}/api/manual/inventory`, {
        method: 'GET',
        headers: {
          'x-admin-password': password
        }
      });

      if (response.ok) {
        onAuthenticated(password);
      } else if (response.status === 401) {
        setError('Invalid admin password. Please try again.');
      } else {
        setError('Connection error. Please check your internet and try again.');
      }
    } catch (err) {
      setError('Connection error. Please check your internet and try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-900">Admin Access</h2>
            <p className="text-gray-600 mt-2">Enter your admin password to continue</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter admin password"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              {isAuthenticating ? 'Authenticating...' : 'Access Admin Panel'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Add/Edit Product Modal
const ProductModal = ({ product, adminPassword, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    productName: '',
    displayName: '',
    category: 'dairy'
  });
  const [storePrices, setStorePrices] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const stores = ['B Kosher', 'Tapuach', 'Kosher Kingdom', 'Kays'];
  const categories = ['dairy', 'meat', 'bakery', 'beverages', 'produce', 'pantry', 'frozen', 'snacks', 'household'];
  const commonUnits = ['item', 'kg', '500g', 'lb', 'litre', '2 pints', 'pint', 'dozen', 'pack', 'loaf', 'bottle'];

  useEffect(() => {
    if (product) {
      setFormData({
        productName: product.key || '',
        displayName: product.displayName || '',
        category: product.category || 'dairy'
      });

      const initialPrices = {};
      stores.forEach(store => {
        const storeData = product.prices?.[store];
        initialPrices[store] = {
          price: storeData?.price?.toString() || '',
          unit: storeData?.unit || 'item',
          enabled: !!storeData
        };
      });
      setStorePrices(initialPrices);
    } else {
      // New product
      const initialPrices = {};
      stores.forEach(store => {
        initialPrices[store] = {
          price: '',
          unit: 'item',
          enabled: false
        };
      });
      setStorePrices(initialPrices);
    }
  }, [product]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.productName.trim()) {
      newErrors.productName = 'Product name is required';
    }
    
    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }

    // Check if at least one store has pricing
    const hasAnyPrice = Object.values(storePrices).some(store => 
      store.enabled && store.price.trim() && parseFloat(store.price) > 0
    );
    
    if (!hasAnyPrice) {
      newErrors.prices = 'At least one store must have a price';
    }

    // Validate individual store prices
    Object.entries(storePrices).forEach(([storeName, storeData]) => {
      if (storeData.enabled) {
        if (!storeData.price.trim()) {
          newErrors[`${storeName}_price`] = 'Price required';
        } else if (isNaN(parseFloat(storeData.price)) || parseFloat(storeData.price) <= 0) {
          newErrors[`${storeName}_price`] = 'Invalid price';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    try {
      // Prepare the data for saving
      const enabledPrices = {};
      Object.entries(storePrices).forEach(([storeName, storeData]) => {
        if (storeData.enabled && storeData.price.trim() && parseFloat(storeData.price) > 0) {
          enabledPrices[storeName] = {
            price: parseFloat(storeData.price),
            unit: storeData.unit
          };
        }
      });

      const productData = {
        key: formData.productName.toLowerCase().replace(/\s+/g, '_'),
        displayName: formData.displayName,
        category: formData.category,
        prices: enabledPrices
      };

      await onSave(productData);
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      setErrors({ submit: 'Failed to save product. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const updateStorePrice = (storeName, field, value) => {
    setStorePrices(prev => ({
      ...prev,
      [storeName]: {
        ...prev[storeName],
        [field]: value
      }
    }));
    
    // Clear errors for this field
    setErrors(prev => ({
      ...prev,
      [`${storeName}_${field}`]: undefined
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              {product ? `Edit: ${product.displayName}` : 'Add New Product'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Product Information */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h3 className="font-medium text-gray-900">Product Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name (Key) *
                </label>
                <input
                  type="text"
                  value={formData.productName}
                  onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.productName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., milk, challah, chicken"
                />
                {errors.productName && <p className="text-red-500 text-xs mt-1">{errors.productName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.displayName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Milk (2 pint), Challah Bread"
                />
                {errors.displayName && <p className="text-red-500 text-xs mt-1">{errors.displayName}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Store Pricing */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-gray-900">Store Pricing</h3>
              {errors.prices && <p className="text-red-500 text-sm">{errors.prices}</p>}
            </div>
            {stores.map(store => (
              <div key={store} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{store}</h4>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={storePrices[store]?.enabled || false}
                      onChange={(e) => updateStorePrice(store, 'enabled', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">Has pricing</span>
                  </label>
                </div>

                {storePrices[store]?.enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price (£)</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={storePrices[store]?.price || ''}
                        onChange={(e) => updateStorePrice(store, 'price', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          errors[`${store}_price`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="0.00"
                      />
                      {errors[`${store}_price`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`${store}_price`]}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                      <select
                        value={storePrices[store]?.unit || 'item'}
                        onChange={(e) => updateStorePrice(store, 'unit', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        {commonUnits.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {errors.submit}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg"
          >
            {isSaving ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Admin Panel
const ImprovedAdminPanel = ({ onBack }) => {
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inventoryData, setInventoryData] = useState(null);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Authentication handler
  const handleAuthenticated = (password) => {
    setAdminPassword(password);
    setIsAuthenticated(true);
    setMessage('✅ Admin access granted!');
    setTimeout(() => setMessage(''), 3000);
    fetchInventoryData(password);
  };

  // Fetch inventory data
  const fetchInventoryData = useCallback(async (password = adminPassword) => {
    if (!password) return;
    setInventoryLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/manual/inventory`, {
        headers: {
          'x-admin-password': password
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Inventory data received:', data);
        setInventoryData(data);
        setMessage('✅ Inventory loaded successfully');
        setTimeout(() => setMessage(''), 2000);
      } else {
        throw new Error('Failed to fetch inventory');
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setMessage('❌ Failed to load inventory data');
    } finally {
      setInventoryLoading(false);
    }
  }, [adminPassword]);

  // Save product (add or edit)
  const handleSaveProduct = async (productData) => {
    try {
      if (productData.key) {
        // Save each store price individually
        for (const [storeName, priceData] of Object.entries(productData.prices)) {
          const response = await fetch(`${API_URL}/api/manual/add-price`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-admin-password': adminPassword
            },
            body: JSON.stringify({
              store: storeName,
              productName: productData.displayName,
              price: priceData.price,
              unit: priceData.unit
            })
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save price');
          }
        }

        // Update product info if needed
        if (editingProduct) {
          await fetch(`${API_URL}/api/manual/update-product-info`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'x-admin-password': adminPassword
            },
            body: JSON.stringify({
              productKey: productData.key,
              displayName: productData.displayName,
              category: productData.category
            })
          });
        }

        setMessage('✅ Product saved successfully');
        fetchInventoryData(); // Refresh data
      }
    } catch (error) {
      console.error('Error saving product:', error);
      setMessage(`❌ Error saving product: ${error.message}`);
      throw error;
    }
  };

  // Process inventory data for display
  const getProcessedInventoryData = () => {
    if (!inventoryData?.data?.products) return [];
    
    let processed = Object.entries(inventoryData.data.products).map(([key, data]) => ({
      key,
      displayName: data.displayName || key,
      category: data.category || 'Uncategorized',
      prices: data.prices || {}
    }));

    // Filter by search term
    if (searchTerm) {
      processed = processed.filter(product =>
        product.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort alphabetically
    processed.sort((a, b) => a.displayName.localeCompare(b.displayName));

    return processed;
  };

  const stores = ['B Kosher', 'Tapuach', 'Kosher Kingdom', 'Kays'];

  // Show auth gate if not authenticated
  if (!isAuthenticated) {
    return <AdminAuth onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Product & Price Management</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              + Add Product
            </button>
            <button
              onClick={() => fetchInventoryData()}
              disabled={inventoryLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium"
            >
              {inventoryLoading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.includes('✅') 
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {message}
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Inventory Table */}
        {inventoryLoading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="text-gray-500">Loading inventory data...</div>
          </div>
        ) : !inventoryData?.data?.products ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="text-gray-500">No inventory data available.</div>
            <button
              onClick={() => fetchInventoryData()}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Try Loading Again
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    {stores.map(store => (
                      <th key={store} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {store}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getProcessedInventoryData().map((product, index) => (
                    <tr key={product.key} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.displayName}</div>
                          <div className="text-sm text-gray-500">{product.key}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {product.category}
                        </span>
                      </td>
                      {stores.map(store => {
                        const storeData = product.prices[store];
                        return (
                          <td key={store} className="px-6 py-4 whitespace-nowrap">
                            {storeData ? (
                              <div>
                                <div className="text-sm font-medium text-gray-900">£{storeData.price}</div>
                                <div className="text-sm text-gray-500">{storeData.unit}</div>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">No price</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Product Modals */}
      {editingProduct && (
        <ProductModal
          product={editingProduct}
          adminPassword={adminPassword}
          onSave={handleSaveProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}

      {showAddModal && (
        <ProductModal
          product={null}
          adminPassword={adminPassword}
          onSave={handleSaveProduct}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
};

export default ImprovedAdminPanel;