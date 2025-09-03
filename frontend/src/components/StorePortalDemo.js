import React, { useState } from 'react';

const StorePortalDemo = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showWaitlistSuccess, setShowWaitlistSuccess] = useState(false);
  const [demoData] = useState({
    storeName: 'Kosher Corner',
    location: 'Golders Green, London',
    totalProducts: 1247,
    totalViews: 15420,
    totalSearches: 8923,
    recentProducts: [
      { name: 'Organic Almond Milk', price: '£2.49', lastUpdated: '2 hours ago' },
      { name: 'Challah Bread', price: '£3.99', lastUpdated: '1 day ago' },
      { name: 'Kosher Chicken Breast', price: '£8.99', lastUpdated: '2 days ago' },
      { name: 'Matzo Ball Soup', price: '£4.50', lastUpdated: '3 days ago' }
    ],
    popularSearches: [
      'milk', 'bread', 'chicken', 'fish', 'cheese', 'yogurt', 'eggs', 'butter'
    ],
    comingSoon: [
      'Bulk import/export (CSV/Excel)',
      'Advanced analytics dashboard',
      'Customer behavior insights',
      'Automated price updates',
      'Inventory management',
      'Promotional campaign tools',
      'Mobile app for store staff',
      'API integration with POS systems'
    ]
  });

  const formatNumber = (num) => {
    return num.toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleJoinWaitlist = () => {
    // In a real app, this would send data to a backend
    console.log('Joining waitlist for store portal...');
    setShowWaitlistSuccess(true);
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowWaitlistSuccess(false);
    }, 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Store Portal Demo</h2>
              <p className="text-blue-100">See what your store could look like on ShopStation</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: '📊' },
              { id: 'products', label: 'Products', icon: '🛍️' },
              { id: 'analytics', label: 'Analytics', icon: '📈' },
              { id: 'coming-soon', label: 'Coming Soon', icon: '🚀' }
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

        {/* Content */}
        <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 text-sm font-medium">Total Products</p>
                      <p className="text-3xl font-bold text-blue-900">{formatNumber(demoData.totalProducts)}</p>
                    </div>
                    <div className="text-blue-400">
                      <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 text-sm font-medium">Total Views</p>
                      <p className="text-3xl font-bold text-green-900">{formatNumber(demoData.totalViews)}</p>
                    </div>
                    <div className="text-green-400">
                      <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 text-sm font-medium">Total Searches</p>
                      <p className="text-3xl font-bold text-purple-900">{formatNumber(demoData.totalSearches)}</p>
                    </div>
                    <div className="text-purple-400">
                      <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Product Updates</h3>
                  <div className="space-y-3">
                    {demoData.recentProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-500">Updated {product.lastUpdated}</p>
                        </div>
                        <span className="text-lg font-bold text-green-600">{product.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Customer Searches</h3>
                  <div className="flex flex-wrap gap-2">
                    {demoData.popularSearches.map((search, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {search}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-3">
                    These are the most common searches from your customers. 
                    Use this data to optimize your product catalog.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Product Management</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                  + Add Product
                </button>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                    <div className="col-span-4">Product Name</div>
                    <div className="col-span-2">Category</div>
                    <div className="col-span-2">Price</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">Actions</div>
                  </div>
                </div>

                <div className="divide-y divide-gray-200">
                  {demoData.recentProducts.map((product, index) => (
                    <div key={index} className="px-6 py-4 hover:bg-gray-50">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-4">
                          <p className="font-medium text-gray-900">{product.name}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-sm text-gray-600">Dairy</span>
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium text-gray-900">{product.price}</span>
                        </div>
                        <div className="col-span-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor('active')}`}>
                            Active
                          </span>
                        </div>
                        <div className="col-span-2">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                            <button className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Search Analytics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">Top Search Terms</h4>
                    <div className="space-y-2">
                      {demoData.popularSearches.slice(0, 5).map((search, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-gray-600">{search}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${80 - (index * 15)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-500">{80 - (index * 15)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">Customer Insights</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 rounded-md">
                        <p className="text-sm text-blue-800">
                          <strong>Trend:</strong> Searches for "organic" products increased 23% this month
                        </p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-md">
                        <p className="text-sm text-green-800">
                          <strong>Opportunity:</strong> 45% of customers search for products you don't carry
                        </p>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded-md">
                        <p className="text-sm text-yellow-800">
                          <strong>Alert:</strong> 12 products haven't been updated in over 30 days
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Coming Soon Tab */}
          {activeTab === 'coming-soon' && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🚀</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Exciting Features Coming Soon!</h3>
                <p className="text-gray-600">We're building powerful tools to help your store grow</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {demoData.comingSoon.map((feature, index) => (
                  <div key={index} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-3">
                      <div className="text-2xl">✨</div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">{feature}</h4>
                        <p className="text-sm text-gray-600">
                          This feature will help you manage your store more efficiently and provide better service to your customers.
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200 text-center">
                <h4 className="text-lg font-semibold text-blue-900 mb-2">Get Early Access</h4>
                <p className="text-blue-700 mb-4">
                  Be among the first to try these new features when they launch!
                </p>
                <button 
                  onClick={handleJoinWaitlist}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  {showWaitlistSuccess ? '✓ Joined!' : 'Join Waitlist'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <p>This is a demo of what your store portal could look like.</p>
              <p>Contact us to get started with your own portal!</p>
            </div>
            <div className="flex space-x-3">
              <button className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors">
                Learn More
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StorePortalDemo;
