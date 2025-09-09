import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import storePortalApi from '../services/storePortalApi';

const StorePortal = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [storeData, setStoreData] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, login, logout, loading: authLoading, error: authError } = useAuth();
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);

  // Auto-login effect for demo purposes
  useEffect(() => {
    // If there's no user, we're not in an auth loading state, and we haven't tried to log in yet...
    if (!user && !authLoading && !autoLoginAttempted) {
      // Set that we've attempted the login to prevent loops
      setAutoLoginAttempted(true);
      console.log("Attempting automatic login for demo user 'owner@koshercorner.com'...");
      // Fire the login request (password is not needed for this temporary solution)
      login('owner@koshercorner.com', 'test123').then(result => {
        console.log('Auto-login result:', result);
      }).catch(error => {
        console.error('Auto-login error:', error);
      });
    }
  }, [user, authLoading, login, autoLoginAttempted]);

  // Load data when component mounts or tab changes, but only if a user is successfully logged in.
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [activeTab, user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load dashboard data
      if (activeTab === 'dashboard') {
        const dashboardData = await storePortalApi.getDashboardSummary();
        if (dashboardData.success) {
          setStoreData(dashboardData.data);
        }
      }
      
      // Load price intelligence data
      if (activeTab === 'pricing') {
        const priceData = await storePortalApi.getPriceIntelligence();
        if (priceData.success) {
          setStoreData(prev => ({ ...prev, priceIntelligenceReport: priceData.data }));
        }
      }
      
      // Load customer demand data
      if (activeTab === 'demand') {
        const demandData = await storePortalApi.getCustomerDemand();
        if (demandData.success) {
          setStoreData(prev => ({ ...prev, demandAnalyticsReport: demandData.data }));
        }
      }
      
      // Load products data
      if (activeTab === 'products') {
        const productsData = await storePortalApi.getMyProducts();
        if (productsData.success) {
          setProducts(productsData.data);
        }
      }

    } catch (error) {
      console.error('Failed to load data:', error);
      setError(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handlePriceUpdate = async (productId, newPrice) => {
    try {
      const result = await storePortalApi.updateProductPrice(productId, newPrice);
      if (result.success) {
        // Update local state
        setProducts(products.map(p => p.id === productId ? { ...p, price: parseFloat(newPrice) } : p));
      } else {
        setError(result.error || 'Failed to update price');
      }
    } catch (error) {
      console.error('Price update failed:', error);
      setError(error.message || 'Failed to update price');
    }
  };

  const formatNumber = (num) => {
    return num.toLocaleString();
  };

  // Handle various loading and error states for authentication and data fetching.
  if (authLoading) {
    return <div className="text-center p-8">Authenticating...</div>;
  }

  if (authError && !user) {
    console.log('StorePortal: authError detected:', authError);
    console.log('StorePortal: user state:', user);
    console.log('StorePortal: authLoading state:', authLoading);
    return (
      <div className="text-center p-8 text-red-500">
        <h2 className="text-xl font-bold mb-2">Store Portal Access Denied</h2>
        <p>We couldn't automatically log you in as the demo user.</p>
        <p className="text-sm mt-2 font-mono bg-red-100 p-2 rounded">Error: {authError}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry Login
        </button>
      </div>
    );
  }
  
  if (!user) {
    // This state can be reached briefly before auto-login triggers or if it fails.
    // The authError check above provides a better failure message.
    return <div className="text-center p-8">Please wait, authenticating demo user...</div>;
  }

  if (loading) {
    return <div className="text-center p-8">Loading Store Portal...</div>;
  }
  
  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-md">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {user?.storeName || storeData?.storeName || 'Store'} Portal
              </h2>
              <p className="text-blue-100">Your store's command center for growth.</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-blue-100">
                Welcome, {user?.email || 'Store Owner'}
              </span>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-gray-200 bg-gray-50">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '📊' },
              { id: 'pricing', label: 'Price Intelligence', icon: '🏷️' },
              { id: 'demand', label: 'Customer Demand', icon: '📈' },
              { id: 'products', label: 'My Products', icon: '🛍️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading data...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-400">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error Loading Data
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {error}
                </div>
                <div className="mt-4">
                  <button
                    onClick={loadData}
                    className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-md hover:bg-red-200"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Tab */}
        {!loading && !error && activeTab === 'dashboard' && storeData && (
          <div className="space-y-6">
            
            {/* Phase 1.4: The Wins Tracker */}
            <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6 rounded-lg shadow-lg">
                <h3 className="text-2xl font-bold mb-2">Your Weekly Wins! 🎉</h3>
                <p className="text-lg">
                    This week, <span className="font-bold text-yellow-300 text-xl">{storeData.winsTracker.newCustomers} new customers</span> chose your store because you had the {storeData.winsTracker.reason}.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Phase 1.2: Competitive Price Intelligence Summary */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Intelligence Summary</h3>
                <div className="space-y-3">
                    <p>You have the best price on <span className="font-bold text-green-600">{storeData.priceIntelligence.cheapestItems}</span> key items.</p>
                    <p>You are most expensive for <span className="font-bold text-red-600">{storeData.priceIntelligence.mostExpensiveItems}</span> key items.</p>
                    <div className="pt-2">
                        <h4 className="font-medium text-gray-700">Recent Competitor Changes:</h4>
                        {storeData.priceIntelligence.competitorPriceChanges.map((item, index) => (
                            <p key={index} className="text-sm text-gray-600">{item.competitor} lowered the price of {item.name} to {item.newPrice}.</p>
                        ))}
                    </div>
                </div>
                <button onClick={() => setActiveTab('pricing')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium">
                  View Full Report
                </button>
              </div>

              {/* Phase 1.3: Customer Demand Analytics Summary */}
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Demand Summary</h3>
                <div className="space-y-3">
                    <div>
                        <h4 className="font-medium text-gray-700">Top Customer Searches:</h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                           {storeData.demandAnalytics.topSearches.map((search, index) => (
                             <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">{search}</span>
                           ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-medium text-gray-700">Missed Opportunities (Searched but not stocked):</h4>
                         <div className="flex flex-wrap gap-2 mt-2">
                           {storeData.demandAnalytics.missedOpportunities.map((search, index) => (
                             <span key={index} className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">{search}</span>
                           ))}
                        </div>
                    </div>
                </div>
                <button onClick={() => setActiveTab('demand')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium">
                  Explore Demand
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Phase 1.2: Competitive Price Intelligence Tab */}
        {!loading && !error && activeTab === 'pricing' && storeData?.priceIntelligenceReport && (
          <PriceIntelligenceDashboard data={storeData.priceIntelligenceReport} />
        )}

        {/* Phase 1.3: Customer Demand Analytics Tab */}
        {!loading && !error && activeTab === 'demand' && storeData?.demandAnalyticsReport && (
            <CustomerDemandDashboard data={storeData.demandAnalyticsReport} />
        )}

        {/* Phase 1.5: My Products Tab */}
        {!loading && !error && activeTab === 'products' && (
            <MyProductsDashboard 
                products={products} 
                onPriceUpdate={handlePriceUpdate}
            />
        )}

        {/* Placeholder for other tabs */}
        {activeTab !== 'dashboard' && activeTab !== 'pricing' && activeTab !== 'demand' && activeTab !== 'products' && (
            <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
                <h3 className="text-2xl font-bold text-gray-800">Feature Coming Soon!</h3>
                <p className="text-gray-600 mt-2">This section is part of our planned rollout. We're building it!</p>
            </div>
        )}
      </div>
    </div>
  );
};

// Sub-component for My Products Dashboard
const MyProductsDashboard = ({ products, onPriceUpdate }) => {
    const [editingId, setEditingId] = useState(null);
    const [newPrice, setNewPrice] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const handleEdit = (product) => {
        setEditingId(product.id);
        setNewPrice(product.price.toFixed(2));
    };

    const handleSave = async (productId) => {
        await onPriceUpdate(productId, newPrice);
        setEditingId(null);
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">My Product Inventory</h3>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
                      + Add New Product
                    </button>
                </div>
                
                <input 
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 mb-4 border border-gray-300 rounded-md"
                />

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredProducts.map(product => (
                                <tr key={product.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700">
                                        {editingId === product.id ? (
                                            <input 
                                                type="number"
                                                value={newPrice}
                                                onChange={(e) => setNewPrice(e.target.value)}
                                                className="w-24 p-1 text-right border border-blue-400 rounded-md"
                                                autoFocus
                                            />
                                        ) : (
                                            `£${product.price.toFixed(2)}`
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {editingId === product.id ? (
                                            <>
                                                <button onClick={() => handleSave(product.id)} className="text-green-600 hover:text-green-900">Save</button>
                                                <button onClick={() => setEditingId(null)} className="text-gray-600 hover:text-gray-900 ml-4">Cancel</button>
                                            </>
                                        ) : (
                                            <button onClick={() => handleEdit(product)} className="text-blue-600 hover:text-blue-900">Edit Price</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// Sub-component for the Customer Demand Dashboard
const CustomerDemandDashboard = ({ data }) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Searched Products */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Top Customer Searches</h3>
                    <ul className="space-y-3">
                        {data.topSearches.map((item, index) => (
                            <li key={index} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50">
                                <div>
                                    <span className="font-medium text-gray-800">{item.term}</span>
                                    <span className="text-sm text-gray-500 ml-2">({item.searches} searches)</span>
                                </div>
                                <span className="text-sm font-semibold text-green-600">
                                    {Math.round(item.conversionRate * 100)}% conversion
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Missed Opportunities */}
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Missed Opportunities</h3>
                    <p className="text-sm text-gray-600 mb-4">Customers searched for these items, but you don't stock them. Consider adding them to your inventory!</p>
                    <ul className="space-y-3">
                        {data.missedOpportunities.map((item, index) => (
                            <li key={index} className="flex justify-between items-center p-2 bg-yellow-50 rounded-md">
                                <span className="font-medium text-yellow-800">{item.term}</span>
                                <span className="text-sm font-semibold text-yellow-700">{item.searches} searches</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

             {/* Peak Shopping Times */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Peak Shopping Times</h3>
                 <p className="text-sm text-gray-600 mb-4">This is when customers are most actively searching and comparing in your area.</p>
                <div className="flex justify-around items-end h-48 p-4 bg-gray-50 rounded-lg">
                    {/* This is a simplified bar chart for demonstration */}
                    {data.peakTimes.map((time, index) => (
                        <div key={index} className="text-center">
                            <div className="bg-blue-500 rounded-t-lg" style={{ height: `${time.activity}%`, width: '50px' }}></div>
                            <div className="text-xs font-medium mt-1">{time.day}</div>
                            <div className="text-xs text-gray-500">{time.hour}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


// Sub-component for the Price Intelligence Dashboard
const PriceIntelligenceDashboard = ({ data }) => {

  const getPricePosition = (myPrice, competitorPrices) => {
    const prices = Object.values(competitorPrices);
    if (myPrice < Math.min(...prices)) return { text: 'Cheapest', color: 'text-green-600', bg: 'bg-green-100' };
    if (myPrice > Math.max(...prices)) return { text: 'Most Expensive', color: 'text-red-600', bg: 'bg-red-100' };
    if (myPrice === Math.min(...prices)) return { text: 'Tied for Cheapest', color: 'text-blue-600', bg: 'bg-blue-100' };
    const uniquePrices = [...new Set(prices)];
    if (uniquePrices.length === 1 && myPrice === uniquePrices[0]) return { text: 'Same Price', color: 'text-gray-600', bg: 'bg-gray-100' };
    return { text: 'Mid-Range', color: 'text-yellow-600', bg: 'bg-yellow-100' };
  };

  const getPriceSuggestion = (myPrice, competitorPrices) => {
    const prices = Object.values(competitorPrices);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    if (myPrice > minPrice) {
      const targetPrice = minPrice - 0.01;
      return `Match opportunity: Lower to £${targetPrice.toFixed(2)} to be the cheapest.`;
    }
    if (myPrice < minPrice) {
       return `Margin opportunity: You are the cheapest. Could potentially raise price slightly.`;
    }
    return 'Your pricing is competitive.';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Price Positioning Dashboard</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Your Price</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Competitors</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Suggestion</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.keyItems.map((item) => {
                const position = getPricePosition(item.myPrice, item.competitors);
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-blue-600">£{item.myPrice.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                        {Object.entries(item.competitors).map(([name, price]) => (
                            <div key={name}>{name}: £{price.toFixed(2)}</div>
                        ))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${position.bg} ${position.color}`}>
                        {position.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {getPriceSuggestion(item.myPrice, item.competitors)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StorePortal;
