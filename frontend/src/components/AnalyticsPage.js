import React, { useState, useEffect } from 'react';
import config from '../config/environments';

const API_URL = config.api.baseUrl;

const AnalyticsPage = ({ onBack }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/analytics?days=${timeframe}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch analytics');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => `£${amount.toFixed(2)}`;
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getBadgeColor = (index) => {
    if (index === 0) return 'bg-yellow-500';
    if (index === 1) return 'bg-gray-400';
    if (index === 2) return 'bg-amber-600';
    return 'bg-gray-300';
  };

  const getPriorityColor = (count) => {
    if (count >= 10) return 'bg-red-200 text-red-800';
    if (count >= 5) return 'bg-amber-200 text-amber-800';
    return 'bg-yellow-200 text-yellow-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 shadow-lg">
          <div className="flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          <p className="text-gray-600 text-center">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl p-8 shadow-lg max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Analytics Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={fetchAnalytics}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all"
            >
              🔄 Try Again
            </button>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-all"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-4 shadow-md">
                <span className="text-white font-bold text-xl">📊</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-gray-600 mt-1">User behavior and product insights</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Timeframe selector */}
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
              <button
                onClick={onBack}
                className="flex items-center px-4 py-2 text-gray-600 hover:text-blue-600 font-medium transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Back to Admin
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Searches</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.summary.todaySearches}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Daily Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.summary.dailyActiveUsers}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-amber-100 text-amber-600 mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Average Savings</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.summary.averageSavings)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Searches</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.summary.totalSearches}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Most Searched Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-3">🔥</span>
              Most Searched Items
            </h2>
            {analytics.mostSearchedItems.length > 0 ? (
              <div className="space-y-3">
                {analytics.mostSearchedItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3 ${getBadgeColor(index)}`}>
                        {index + 1}
                      </div>
                      <span className="font-medium text-gray-900 capitalize">{item.item}</span>
                    </div>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                      {item.count} searches
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No search data available yet</p>
            )}
          </div>

          {/* Popular Shops */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-3">🏪</span>
              Popular Shops
            </h2>
            {analytics.popularShops.length > 0 ? (
              <div className="space-y-3">
                {analytics.popularShops.map((shop, index) => (
                  <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{shop.name}</p>
                      <p className="text-sm text-gray-600">{shop.selections} selections</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{formatCurrency(shop.totalRevenue)}</p>
                      <p className="text-xs text-gray-500">total value</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No shop selection data yet</p>
            )}
          </div>
        </div>

        {/* Items to Add - Priority Section */}
        <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border-2 border-red-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-red-800 mb-4 flex items-center">
            <span className="text-3xl mr-3">🚨</span>
            Items We Need to Add to Database
          </h2>
          <p className="text-red-700 mb-6">
            These are the most frequently searched items that we don't have prices for. 
            <strong>Priority: Add these items first!</strong>
          </p>
          
          {analytics.itemsToAdd.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analytics.itemsToAdd.slice(0, 12).map((item, index) => (
                <div key={index} className="bg-white rounded-lg p-4 border border-red-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 capitalize">{item.item}</span>
                    <div className="flex items-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${getPriorityColor(item.count)}`}>
                        {item.count} requests
                      </span>
                      {item.count >= 10 && <span className="ml-2 text-red-500 text-xl">🔥</span>}
                    </div>
                  </div>
                  {item.count >= 10 && (
                    <p className="text-xs text-red-600 mt-2 font-medium">HIGH PRIORITY</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg p-8 border border-red-200 text-center">
              <div className="text-4xl mb-4">🎉</div>
              <p className="text-gray-600">Great! All searched items are in your database.</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="text-2xl mr-3">📈</span>
            Recent Search Activity
          </h2>
          {analytics.recentActivity.searches.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {analytics.recentActivity.searches.map((search, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-2">{formatDate(search.timestamp)}</p>
                      <div className="flex flex-wrap gap-2">
                        {search.items.slice(0, 5).map((item, i) => (
                          <span key={i} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                            {item}
                          </span>
                        ))}
                        {search.items.length > 5 && (
                          <span className="text-gray-500 text-sm">+{search.items.length - 5} more</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-medium text-gray-900">
                        {search.matchedItems}/{search.items.length} matched
                      </p>
                      {search.savings > 0 && (
                        <p className="text-sm text-green-600 font-semibold">
                          {formatCurrency(search.savings)} saved
                        </p>
                      )}
                    </div>
                  </div>
                  {search.unmatchedItems.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <p className="text-xs text-red-600 mb-1">Missing items:</p>
                      <div className="flex flex-wrap gap-1">
                        {search.unmatchedItems.slice(0, 3).map((item, i) => (
                          <span key={i} className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                            {item}
                          </span>
                        ))}
                        {search.unmatchedItems.length > 3 && (
                          <span className="text-red-500 text-xs">+{search.unmatchedItems.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No recent search activity</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;