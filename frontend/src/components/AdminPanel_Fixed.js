import React, { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'https://grocery-backend-production-5c7e.up.railway.app';

// Authentication Gate Component
const AdminAuth = ({ onAuthenticated }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setError('');

    try {
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

// Button Select Component
const ButtonSelect = ({ options, value, onChange, label, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`px-4 py-2 rounded-lg border-2 transition-all font-medium ${
              value === option
                ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

// File Upload Component
const FileUpload = ({ onFileUpload, isUploading }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      onFileUpload(files[0]);
    }
  };

  const handleFileInput = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      onFileUpload(files[0]);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="font-medium text-gray-900 mb-4">Upload & Restore Backup</h3>
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-4xl mb-4">📁</div>
        <p className="text-gray-600 mb-4">
          {dragActive ? 'Drop your backup file here' : 'Drag and drop a backup file, or click to select'}
        </p>
        <input
          type="file"
          accept=".json"
          onChange={handleFileInput}
          className="hidden"
          id="backup-file-input"
          disabled={isUploading}
        />
        <label
          htmlFor="backup-file-input"
          className={`cursor-pointer inline-block bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors ${
            isUploading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isUploading ? 'Uploading...' : 'Choose File'}
        </label>
      </div>
    </div>
  );
};

// Simple Edit Product Modal (without advanced features for now)
const EditProductModal = ({ product, adminPassword, onSave, onClose }) => {
  const [editData, setEditData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const stores = ['B Kosher', 'Tapuach', 'Kosher Kingdom', 'Kays'];
  const commonUnits = ['item', 'kg', '500g', 'lb', 'litre', '2 pints', 'pint', 'dozen', 'pack', 'loaf', 'bottle'];

  useEffect(() => {
    const initialData = {};
    stores.forEach(store => {
      const storeData = product.prices[store];
      initialData[store] = {
        price: storeData?.price || '',
        unit: storeData?.unit || 'item',
        hasData: !!storeData
      };
    });
    setEditData(initialData);
  }, [product]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates = {};
      stores.forEach(store => {
        const data = editData[store];
        if (data.hasData && data.price) {
          updates[store] = {
            price: parseFloat(data.price),
            unit: data.unit
          };
        }
      });

      if (Object.keys(updates).length > 0) {
        await onSave(product.key, updates);
      }
      
      onClose();
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Edit Product: {product.displayName}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {stores.map(store => (
            <div key={store} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">{store}</h3>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editData[store]?.hasData || false}
                    onChange={(e) => setEditData(prev => ({
                      ...prev,
                      [store]: { ...prev[store], hasData: e.target.checked }
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Has pricing data</span>
                </label>
              </div>

              {editData[store]?.hasData && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (£)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editData[store]?.price || ''}
                      onChange={(e) => setEditData(prev => ({
                        ...prev,
                        [store]: { ...prev[store], price: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  <ButtonSelect
                    label="Unit"
                    options={commonUnits}
                    value={editData[store]?.unit || 'item'}
                    onChange={(unit) => setEditData(prev => ({
                      ...prev,
                      [store]: { ...prev[store], unit }
                    }))}
                  />
                </div>
              )}
            </div>
          ))}
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
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Admin Panel Component
const AdminPanel = ({ onBack, onShowAnalytics }) => {
  const [adminPassword, setAdminPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Main state
  const [store, setStore] = useState('');
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('item');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState('form');
  const [recentProducts, setRecentProducts] = useState([]);
  const [successAnimation, setSuccessAnimation] = useState(false);
  
  // Inventory state
  const [inventoryData, setInventoryData] = useState(null);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Backup state
  const [backupStatus, setBackupStatus] = useState(null);
  const [backupLoading, setBackupLoading] = useState(false);
  const [uploadingBackup, setUploadingBackup] = useState(false);

  const stores = ['B Kosher', 'Tapuach', 'Kosher Kingdom', 'Kays'];
  const commonUnits = ['item', 'kg', '500g', 'lb', 'litre', '2 pints', 'pint', 'dozen', 'pack', 'loaf', 'bottle'];

  // Fetch inventory data
  const fetchInventoryData = useCallback(async () => {
    if (!adminPassword) return;
    setInventoryLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/manual/inventory`, {
        headers: {
          'x-admin-password': adminPassword
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setInventoryData(data);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setInventoryLoading(false);
    }
  }, [adminPassword]);

  // Fetch backup status
  const fetchBackupStatus = useCallback(async () => {
    if (!adminPassword) return;
    try {
      const response = await fetch(`${API_URL}/api/backup/status`, {
        headers: {
          'x-admin-password': adminPassword
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBackupStatus(data.data);
      }
    } catch (error) {
      console.error('Error fetching backup status:', error);
    }
  }, [adminPassword]);

  // Load initial data
  useEffect(() => {
    if (isAuthenticated && view === 'inventory' && !inventoryData) {
      fetchInventoryData();
    }
  }, [isAuthenticated, view, inventoryData, fetchInventoryData]);

  useEffect(() => {
    if (isAuthenticated && view === 'backup' && !backupStatus) {
      fetchBackupStatus();
    }
  }, [isAuthenticated, view, backupStatus, fetchBackupStatus]);

  // Authentication handler
  const handleAuthenticated = (password) => {
    setAdminPassword(password);
    setIsAuthenticated(true);
    setMessage('✅ Admin access granted!');
    setTimeout(() => setMessage(''), 3000);
  };

  // Show auth gate if not authenticated
  if (!isAuthenticated) {
    return <AdminAuth onAuthenticated={handleAuthenticated} />;
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!store || !productName || !price) {
      setMessage('❌ Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setMessage('');
    
    try {
      const response = await fetch(`${API_URL}/api/manual/add-price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword
        },
        body: JSON.stringify({
          store,
          productName,
          price: parseFloat(price),
          unit
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessage(`✅ Price added: ${productName} - £${price} (${unit}) at ${store}`);
        setSuccessAnimation(true);
        setTimeout(() => setSuccessAnimation(false), 1000);
        
        // Add to recent products
        setRecentProducts(prev => [
          { productName, price, unit, store, timestamp: Date.now() },
          ...prev.slice(0, 4)
        ]);
        
        // Clear form
        setProductName('');
        setPrice('');
        
        // Refresh inventory if viewing
        if (inventoryData) {
          fetchInventoryData();
        }
      } else {
        setMessage(`❌ ${result.error || 'Failed to add price'}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle edit product
  const handleEditProduct = (product) => {
    setEditingProduct(product);
  };

  // Handle save product
  const handleSaveProduct = async (productKey, updates) => {
    try {
      const response = await fetch(`${API_URL}/api/manual/update-product`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword
        },
        body: JSON.stringify({
          productKey,
          updates
        })
      });

      if (response.ok) {
        setMessage('✅ Product updated successfully');
        fetchInventoryData(); // Refresh data
      } else {
        throw new Error('Failed to update product');
      }
    } catch (error) {
      setMessage(`❌ Error updating product: ${error.message}`);
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

  // Create backup
  const createBackup = async () => {
    setBackupLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/backup/create`, {
        method: 'POST',
        headers: {
          'x-admin-password': adminPassword
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setMessage(`✅ Backup created successfully`);
        fetchBackupStatus(); // Refresh backup status
      }
    } catch (error) {
      setMessage(`❌ Backup failed: ${error.message}`);
    } finally {
      setBackupLoading(false);
    }
  };

  // Handle backup file upload
  const handleBackupUpload = async (file) => {
    setUploadingBackup(true);
    try {
      const formData = new FormData();
      formData.append('backupFile', file);

      const response = await fetch(`${API_URL}/api/backup/upload-restore`, {
        method: 'POST',
        headers: {
          'x-admin-password': adminPassword
        },
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage(`✅ ${result.message}`);
        // Refresh data
        fetchInventoryData();
        fetchBackupStatus();
      } else {
        setMessage(`❌ Upload failed: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Upload error: ${error.message}`);
    } finally {
      setUploadingBackup(false);
    }
  };

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
            <h1 className="text-2xl font-bold text-gray-900">ShopStation Admin</h1>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Authenticated</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <nav className="p-4 space-y-2">
            <button
              onClick={() => setView('form')}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                view === 'form' 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">📝</span>
                <span>Add Prices</span>
              </div>
            </button>

            <button
              onClick={() => setView('inventory')}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                view === 'inventory' 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">📦</span>
                <span>Inventory & Edit</span>
              </div>
            </button>

            <button
              onClick={() => setView('backup')}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                view === 'backup' 
                  ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">💾</span>
                <span>Backup System</span>
              </div>
            </button>

            <button
              onClick={onShowAnalytics}
              className="w-full text-left px-4 py-3 rounded-lg font-medium transition-colors text-gray-700 hover:bg-gray-100"
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">📊</span>
                <span>Analytics</span>
              </div>
            </button>
          </nav>

          {/* Quick Stats */}
          <div className="p-4 border-t border-gray-200 mt-8">
            <div className="bg-gray-50 rounded-lg p-3">
              <h3 className="font-medium text-gray-900 mb-2">Quick Stats</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div>🏪 {stores.length} stores</div>
                <div>📦 {inventoryData?.data?.products ? Object.keys(inventoryData.data.products).length : '...'} products</div>
                <div>🔄 Auto-backup: Active</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
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

          {/* Add Prices Form */}
          {view === 'form' && (
            <div className="max-w-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Add Product Prices</h2>
                {successAnimation && (
                  <div className="text-2xl animate-bounce">🎉</div>
                )}
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <ButtonSelect
                    label="Store *"
                    options={stores}
                    value={store}
                    onChange={setStore}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter product name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (£) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <ButtonSelect
                    label="Unit"
                    options={commonUnits}
                    value={unit}
                    onChange={setUnit}
                  />

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    {isLoading ? 'Adding Price...' : 'Add Price'}
                  </button>
                </form>
              </div>

              {/* Recent Additions */}
              {recentProducts.length > 0 && (
                <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="font-medium text-gray-900 mb-4">Recent Additions</h3>
                  <div className="space-y-2">
                    {recentProducts.map((product, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                        <div>
                          <div className="font-medium text-sm">{product.productName}</div>
                          <div className="text-xs text-gray-500">{product.store}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-sm">£{product.price}</div>
                          <div className="text-xs text-gray-500">{product.unit}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Inventory View */}
          {view === 'inventory' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Product Inventory</h2>
                <button
                  onClick={fetchInventoryData}
                  disabled={inventoryLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {inventoryLoading ? 'Refreshing...' : 'Refresh Data'}
                </button>
              </div>

              {/* Search */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {inventoryLoading ? (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <div className="text-gray-500">Loading inventory data...</div>
                </div>
              ) : !inventoryData?.data?.products ? (
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                  <div className="text-gray-500">No inventory data available.</div>
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
                                onClick={() => handleEditProduct(product)}
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
          )}

          {/* Backup View */}
          {view === 'backup' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Backup System</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Create Backup */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="font-medium text-gray-900 mb-4">Manual Backup</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Create a manual backup of all your price data and settings.
                  </p>
                  <button
                    onClick={createBackup}
                    disabled={backupLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    {backupLoading ? 'Creating Backup...' : 'Create Backup Now'}
                  </button>
                </div>

                {/* Upload Backup */}
                <FileUpload
                  onFileUpload={handleBackupUpload}
                  isUploading={uploadingBackup}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          adminPassword={adminPassword}
          onSave={handleSaveProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}
    </div>
  );
};

export default AdminPanel;