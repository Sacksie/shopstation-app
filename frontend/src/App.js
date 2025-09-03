import React, { useState, useEffect } from 'react';
import ReceiptUpload from './components/ReceiptUpload';
import GroceryAdminPanel from './components/GroceryAdminPanel';
import AnalyticsPage from './components/AnalyticsPage';
import CookieConsent from './components/CookieConsent';
import LegalPages from './components/LegalPages';
import NewShopstationLogo from './NewShopstationLogo.png';
import config from './config/environments';

const API_URL = config.api.baseUrl;

// Main shopping list page
const MainPage = ({ onAdminToggle }) => {
  const [groceryList, setGroceryList] = useState('');
  const [results, setResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isFormattedList, setIsFormattedList] = useState(false);
  const [detectedItems, setDetectedItems] = useState([]);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isLoadingUpdate, setIsLoadingUpdate] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Fetch last updated timestamp
  const fetchLastUpdated = async () => {
    setIsLoadingUpdate(true);
    try {
      const response = await fetch(`${API_URL}/api/last-updated`);
      if (response.ok) {
        const data = await response.json();
        setLastUpdated(data.lastUpdated);
      }
    } catch (error) {
      console.log('Could not fetch last updated time');
    } finally {
      setIsLoadingUpdate(false);
    }
  };

  // Load last updated on mount
  useEffect(() => {
    fetchLastUpdated();
  }, []);

  // Shopping list parsing and analysis functions
  const parseShoppingList = (text) => {
    if (!text.trim()) return [];

    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const items = [];

    lines.forEach((line, index) => {
      // Remove common prefixes (bullets, numbers, dashes)
      let cleanLine = line
        .replace(/^[-•*]\s*/, '') // Remove bullets
        .replace(/^\d+\.\s*/, '') // Remove numbered lists (1. 2. etc)
        .replace(/^\d+\)\s*/, '') // Remove numbered lists (1) 2) etc)
        .replace(/^[-–—]\s*/, '') // Remove various dashes
        .trim();

      if (!cleanLine) return;

      // Try to extract quantity and unit
      const quantityMatch = cleanLine.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]*)\s*(.+)$/);
      
      if (quantityMatch) {
        const [, quantity, possibleUnit, productName] = quantityMatch;
        items.push({
          id: index,
          originalText: line,
          quantity: parseFloat(quantity),
          unit: possibleUnit.toLowerCase() || 'item',
          productName: productName.trim(),
          cleanProductName: cleanProductName(productName.trim())
        });
      } else {
        // No quantity found, treat as single item
        items.push({
          id: index,
          originalText: line,
          quantity: 1,
          unit: 'item',
          productName: cleanLine,
          cleanProductName: cleanProductName(cleanLine)
        });
      }
    });

    return items;
  };

  // Clean and normalize product names for matching
  const cleanProductName = (name) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  };

  // Detect if the pasted content looks like a formatted shopping list
  const detectFormattedList = (text) => {
    if (!text || text.length < 10) return false;
    
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return false;

    let formattedLines = 0;
    
    lines.forEach(line => {
      // Check for common list formatting patterns
      if (line.match(/^[-•*]\s*/) ||           // Bullets
          line.match(/^\d+\.\s*/) ||           // Numbered (1. 2.)  
          line.match(/^\d+\)\s*/) ||           // Numbered (1) 2))
          line.match(/^[-–—]\s*/) ||           // Dashes
          line.match(/^\d+\s*[a-zA-Z]+\s*/) || // Quantity with unit (2 kg, 3 bottles)
          line.includes('x ') ||               // Multiply format (2x milk)
          line.includes(' - ') ||              // Item - description
          (line.includes(',') && lines.length > 3)) { // Comma separated (if multiple lines)
        formattedLines++;
      }
    });

    // If more than 30% of lines are formatted, consider it a formatted list
    return (formattedLines / lines.length) > 0.3;
  };

  // Helper functions for UI
  const getItemCount = () => {
    if (isFormattedList && detectedItems.length > 0) {
      return detectedItems.length;
    }
    return groceryList.split('\n').filter(line => line.trim()).length;
  };

  const getCharacterCount = () => {
    return groceryList.length;
  };

  const fillExampleList = () => {
    setGroceryList('Challah\nMilk\nEggs\nChicken\nGrape Juice');
    setError(null);
  };

  const clearList = () => {
    setGroceryList('');
    setError(null);
    setIsFormattedList(false);
    setDetectedItems([]);
  };

  // Handle textarea changes with smart detection
  const handleTextareaChange = (e) => {
    const newText = e.target.value;
    setGroceryList(newText);
    
    // Detect if this looks like a formatted shopping list
    const isFormatted = detectFormattedList(newText);
    setIsFormattedList(isFormatted);
    
    if (isFormatted) {
      const items = parseShoppingList(newText);
      setDetectedItems(items);
    } else {
      setDetectedItems([]);
    }
    
    setError(null);
  };

  // Handle paste events specifically
  const handlePaste = (e) => {
    // Let the paste happen first, then analyze
    setTimeout(() => {
      const text = e.target.value || groceryList;
      const isFormatted = detectFormattedList(text);
      setIsFormattedList(isFormatted);
      
      if (isFormatted) {
        const items = parseShoppingList(text);
        setDetectedItems(items);
      }
    }, 10);
  };

  const formatLastUpdated = (timestamp) => {
    if (!timestamp) return null;
    const now = new Date();
    const updated = new Date(timestamp);
    const diffMs = now - updated;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Less than an hour ago';
    }
  };

  const handleAnalyze = async (isRetry = false) => {
    if (!groceryList.trim()) {
      setError({
        type: 'validation',
        title: 'Oops! Your shopping list is empty',
        message: 'Please add some items to your list before comparing prices.',
        showRetry: false
      });
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    
    if (!isRetry) setRetryCount(0);

    try {
      const items = groceryList.split('\n')
        .map(item => item.trim())
        .filter(item => item.length > 0);

      if (items.length === 0) {
        setError({
          type: 'validation',
          title: 'Oops! Your shopping list is empty',
          message: 'Please add some items to your list before comparing prices.',
          showRetry: false
        });
        setIsAnalyzing(false);
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`${API_URL}/api/compare-groceries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ groceryList: items }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setResults({
          ...data,
          originalList: items
        });
        setError(null);
      } else {
        // Handle empty database or other business logic errors
        if (data.message && data.message.includes('no prices')) {
          setError({
            type: 'empty_database',
            title: 'We\'re adding prices now!',
            message: 'Our team is busy collecting prices from kosher stores. Check back in a few hours for the latest deals!',
            showRetry: true
          });
        } else {
          setError({
            type: 'business_error',
            title: 'Oops! Couldn\'t compare prices',
            message: data.message || 'Something went wrong while comparing prices. Please try again.',
            showRetry: true
          });
        }
      }
    } catch (error) {
      console.error('Error:', error);
      
      if (error.name === 'AbortError') {
        // Auto-retry for timeout errors (up to 3 times)
        if (retryCount < 3) {
          autoRetry(retryCount);
          return;
        }
        setError({
          type: 'timeout',
          title: 'This is taking longer than usual',
          message: 'The connection seems really slow. Please check your internet and try again.',
          showRetry: true
        });
      } else if (error.message.includes('fetch') || error.message.includes('Failed to fetch') || !navigator.onLine) {
        // Auto-retry for network errors (up to 2 times)
        if (retryCount < 2) {
          autoRetry(retryCount);
          return;
        }
        setError({
          type: 'network',
          title: 'Connection problem',
          message: 'We tried a few times but couldn\'t connect. Please check your internet and try again.',
          showRetry: true
        });
      } else {
        setError({
          type: 'unknown',
          title: 'Oops! Something went wrong',
          message: 'Please try again in a moment. If this keeps happening, please let us know.',
          showRetry: true
        });
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    handleAnalyze(true);
  };

  // Auto-retry function with exponential backoff
  const autoRetry = async (attemptNumber) => {
    if (attemptNumber >= 3) return; // Max 3 auto-retry attempts
    
    const delay = Math.min(1000 * Math.pow(2, attemptNumber), 10000); // Exponential backoff, max 10s
    
    setError(prevError => ({
      ...prevError,
      title: `Retrying automatically... (${attemptNumber + 1}/3)`,
      message: 'Please wait a moment while we try again.',
      showRetry: false
    }));
    
    setTimeout(() => {
      handleAnalyze(true);
    }, delay);
  };

  // Show admin panel if requested
  if (showAdmin) {
    return <GroceryAdminPanel onBack={() => {
      setShowAdmin(false);
      onAdminToggle(false);
    }} />;
  }

  // Show analytics page if requested
  if (showAnalytics) {
    return <AnalyticsPage onBack={() => { setShowAnalytics(false); setShowAdmin(true); }} />;
  }


  // Show results if available
  if (results) {
    return <ResultsPage results={results} onBack={() => setResults(null)} />;
  }

  // Main landing page
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* BETA Badge */}
        <div className="fixed top-4 right-4 z-20">
          <button
            onClick={() => setShowFeedbackModal(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg animate-pulse hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105 active:scale-95"
          >
            🚀 BETA - Help us improve!
          </button>
        </div>

        {/* Last Updated Info */}
        {lastUpdated && !isLoadingUpdate && (
          <div className="text-center mb-4">
            <div className="inline-flex items-center px-3 py-1 bg-white/80 backdrop-blur rounded-full border border-gray-200 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Prices last updated: {formatLastUpdated(lastUpdated)}
            </div>
          </div>
        )}

        {/* Post-it Note Container */}
        <div
          className="relative"
          style={{
            transform: 'rotate(-0.5deg)',
            filter: 'drop-shadow(8px 8px 20px rgba(0,0,0,0.15))'
          }}
        >
          {/* Tape effect */}
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-32 h-8 bg-white opacity-60 rotate-3 rounded shadow-md"></div>
          
          <div className="bg-gradient-to-b from-yellow-50 to-amber-50 border-t-8 border-amber-400 rounded-sm shadow-inner"
               style={{
                 backgroundImage: 'linear-gradient(to bottom, #fefce8 0%, #fef3c7 100%)',
                 borderTop: '8px solid #f59e0b'
               }}>
            {/* Header */}
            <div className="px-6 pt-8 pb-6">
              {/* Centered Logo */}
              <div className="flex justify-center mb-4">
                <div className="h-24">
                  <img 
                    src={NewShopstationLogo} 
                    alt="ShopStation" 
                    className="h-full w-auto object-contain" 
                    onError={(e) => {
                      console.log('Logo failed to load, trying fallback');
                      e.target.src = "/ShopStationLogo.jpg";
                    }}
                  />
                </div>
              </div>
              
              {/* Smart List Detection Badge */}
              {isFormattedList && (
                <div className="flex justify-center">
                  <div className="flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Smart list detected
                  </div>
                </div>
              )}
            </div>
            
            {/* Divider */}
            <div className="px-6">
              <div className="border-b border-amber-200/50"></div>
            </div>

            {/* Helper Buttons */}
            <div className="px-6 py-3 flex flex-wrap gap-2">
              <button
                onClick={fillExampleList}
                className="inline-flex items-center px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 text-sm font-medium rounded-lg border border-blue-200 transition-all transform hover:scale-105 active:scale-95"
              >
                <span className="mr-1">📝</span>
                Try Example List
              </button>
              <button
                onClick={clearList}
                disabled={!groceryList.trim()}
                className="inline-flex items-center px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg border border-gray-200 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <span className="mr-1">🗑️</span>
                Clear
              </button>
            </div>

            {/* Textarea */}
            <div className="px-6 py-2 relative">
              <div
                className="absolute inset-0 px-6"
                style={{
                  backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #f59e0b15 31px, #f59e0b15 32px)',
                  backgroundPosition: '0 10px',
                  pointerEvents: 'none'
                }}
              ></div>
              <textarea
                value={groceryList}
                onChange={handleTextareaChange}
                onPaste={handlePaste}
                placeholder="Write your shopping list here...&#10;&#10;🥛 Milk&#10;🍞 Challah&#10;🥚 Eggs&#10;🍗 Chicken&#10;🧈 Butter&#10;🍇 Grape Juice&#10;&#10;💡 Tip: Paste formatted lists from anywhere - I'll automatically detect and analyze them!"
                className="w-full h-80 py-2 bg-transparent border-none resize-none focus:outline-none text-gray-700 placeholder-amber-600/40 text-lg leading-8"
                style={{
                  fontFamily: 'Kalam, cursive',
                  lineHeight: '32px'
                }}
              />
            </div>
            
            {/* Character Count */}
            <div className="px-6 pb-2">
              <p className="text-xs text-amber-700/50 italic">
                {getCharacterCount()} characters, ~{getItemCount()} items
              </p>
            </div>

            {/* Smart List Detection Display */}
            {isFormattedList && detectedItems.length > 0 && (
              <div className="px-6 pb-4">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="font-semibold text-green-900 text-sm">🎯 Smart List Detected!</h3>
                    </div>
                    <span className="text-green-700 text-xs font-medium">
                      {detectedItems.length} items parsed
                    </span>
                  </div>
                  <p className="text-green-700 text-xs mb-3">
                    I automatically detected and cleaned up your formatted shopping list. Ready to find the best prices!
                  </p>
                  {detectedItems.length > 0 && (
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                      {detectedItems.slice(0, 8).map((item, idx) => (
                        <span key={idx} className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {item.quantity > 1 && `${item.quantity} `}{item.productName}
                        </span>
                      ))}
                      {detectedItems.length > 8 && (
                        <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{detectedItems.length - 8} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Help text for empty state */}
            {groceryList.trim().length === 0 && (
              <div className="px-6 pb-4">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-2xl mb-2">🛒</div>
                    <h3 className="font-semibold text-amber-900 text-sm mb-1">Start Your Smart Shopping</h3>
                    <p className="text-amber-700 text-xs">
                      Type or paste your shopping list. I'll automatically detect formatted lists and help you find the best prices across kosher stores!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom section */}
            <div className="px-6 pb-6 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-amber-700/70 font-medium">
                    {getItemCount()} item{getItemCount() !== 1 ? 's' : ''} ready
                  </span>
                </div>
              </div>
              <button
                onClick={handleAnalyze}
                disabled={!groceryList.trim() || isAnalyzing}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-full hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 
disabled:cursor-not-allowed font-bold shadow-lg transform transition-all hover:scale-105 active:scale-95 border-2 border-green-700/20"
              >
                {isAnalyzing ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Comparing...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <span className="mr-2">💰</span>
                    Compare Prices
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Tagline */}
        <div className="text-center mt-8">
          <p className="text-sm text-amber-700/60 font-medium">
            Smart kosher grocery shopping, simplified
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Compare prices across London's top kosher stores
          </p>
          
          {/* Discrete Admin Link */}
          <div className="mt-6">
            <button
              onClick={() => {
                setShowAdmin(true);
                onAdminToggle(true);
              }}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors underline"
            >
              Admin Access
            </button>
          </div>
        </div>

        {/* Error Handling */}
        {error && (
          <div className="mt-8 max-w-md mx-auto">
            <div className={`rounded-xl p-6 text-center shadow-lg border-2 ${
              error.type === 'empty_database' 
                ? 'bg-blue-50 border-blue-200' 
                : error.type === 'validation'
                ? 'bg-amber-50 border-amber-200'
                : 'bg-red-50 border-red-200'
            }`}>
              {/* Error Icon */}
              <div className="text-4xl mb-3">
                {error.type === 'empty_database' && '🏗️'}
                {error.type === 'validation' && '📝'}
                {error.type === 'network' && '📶'}
                {error.type === 'timeout' && '⏰'}
                {!['empty_database', 'validation', 'network', 'timeout'].includes(error.type) && '😊'}
              </div>
              
              {/* Error Title */}
              <h3 className={`text-xl font-bold mb-2 ${
                error.type === 'empty_database' 
                  ? 'text-blue-800' 
                  : error.type === 'validation'
                  ? 'text-amber-800'
                  : 'text-red-800'
              }`}>
                {error.title}
              </h3>
              
              {/* Error Message */}
              <p className={`text-sm mb-4 ${
                error.type === 'empty_database' 
                  ? 'text-blue-700' 
                  : error.type === 'validation'
                  ? 'text-amber-700'
                  : 'text-red-700'
              }`}>
                {error.message}
              </p>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {error.showRetry && (
                  <button
                    onClick={handleRetry}
                    disabled={isAnalyzing}
                    className={`px-6 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 active:scale-95 ${
                      error.type === 'empty_database'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    } disabled:bg-gray-400 disabled:cursor-not-allowed`}
                  >
                    {isAnalyzing ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        Trying again...
                      </span>
                    ) : (
                      <>🔄 Try Again{retryCount > 0 && ` (${retryCount + 1})`}</>
                    )}
                  </button>
                )}
                
                <button
                  onClick={() => setError(null)}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-all transform hover:scale-105 active:scale-95"
                >
                  ✕ Dismiss
                </button>
              </div>

              {/* Network Status for Network Errors */}
              {error.type === 'network' && (
                <div className="mt-4 p-3 bg-white rounded-lg border">
                  <div className="flex items-center justify-center text-sm">
                    <div className={`w-2 h-2 rounded-full mr-2 ${navigator.onLine ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-gray-600">
                      {navigator.onLine ? 'Internet connected' : 'No internet connection'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Receipt Upload */}
        <div className="mt-8">
          <ReceiptUpload onUploadSuccess={(data) => console.log('Receipt:', data)} />
        </div>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={showFeedbackModal} 
        onClose={() => setShowFeedbackModal(false)} 
      />
    </div>
  );
};

// Results page component
const ResultsPage = ({ results, onBack }) => {
  const [expandedStores, setExpandedStores] = useState(new Set());
  
  const toggleStore = (index) => {
    const newExpanded = new Set(expandedStores);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
      
      // Track shop selection for analytics
      const store = results.stores[index];
      if (store) {
        fetch(`${API_URL}/api/track-shop-selection`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            shopName: store.name,
            totalPrice: store.totalPrice || 0,
            itemsAvailable: (store.items || []).length
          })
        }).catch(error => {
          console.log('Analytics tracking failed:', error);
        });
      }
    }
    setExpandedStores(newExpanded);
  };

  // Calculate savings for celebration banner
  const calculateSavings = () => {
    if (!results.stores || results.stores.length < 2) return 0;
    const cheapest = Math.min(...results.stores.filter(s => s.totalPrice > 0).map(s => s.totalPrice));
    const mostExpensive = Math.max(...results.stores.filter(s => s.totalPrice > 0).map(s => s.totalPrice));
    return mostExpensive - cheapest;
  };

  const savings = calculateSavings();
  const bestStore = results.stores?.find(store => store.totalPrice > 0 && 
    store.totalPrice === Math.min(...results.stores.filter(s => s.totalPrice > 0).map(s => s.totalPrice)));

  const shareOnWhatsApp = () => {
    const message = `I just saved £${savings.toFixed(2)} on my kosher shopping with ShopStation! Try it: shopstation.vercel.app`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  // Save as image functionality
  const saveAsImage = () => {
    const element = document.getElementById('results-content');
    if (element) {
      // This would require html2canvas library - for now show a message
      alert('Save as Image feature coming soon! For now, you can screenshot this page.');
    }
  };

  const getStoreIcon = (storeName) => {
    const icons = {
      'B Kosher': '🕍',
      'Tapuach': '🍎',
      'Kosher Kingdom': '👑',
      'Kays': '🛒'
    };
    return icons[storeName] || '🛒';
  };


  // Handle missing data gracefully
  if (!results || !results.stores) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-amber-200">
            <div className="text-6xl mb-4">🤔</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Hmm, that's odd!</h2>
            <p className="text-gray-600 mb-6">
              We couldn't find any results to show you. This might be a temporary glitch.
            </p>
            <button
              onClick={onBack}
              className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all transform hover:scale-105 active:scale-95"
            >
              🔄 Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50" id="results-content">
      {/* Celebration Header */}
      <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            {/* Big Celebration Banner */}
            <div className="mb-6">
              <div className="text-6xl mb-4 animate-bounce">🎉</div>
              <h1 className="text-4xl md:text-6xl font-black mb-4">
                You'll save £{savings.toFixed(2)}!
              </h1>
              <p className="text-xl md:text-2xl font-semibold opacity-90">
                🏆 Your smart shopping just paid off!
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-white/20 backdrop-blur rounded-xl p-4">
                <div className="text-2xl md:text-3xl font-bold">{results.matchedItems || 0}</div>
                <div className="text-sm opacity-90">Items Found</div>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-xl p-4">
                <div className="text-2xl md:text-3xl font-bold">{results.stores.length}</div>
                <div className="text-sm opacity-90">Stores Compared</div>
              </div>
              <div className="bg-white/20 backdrop-blur rounded-xl p-4">
                <div className="text-2xl md:text-3xl font-bold">£{savings.toFixed(2)}</div>
                <div className="text-sm opacity-90">Money Saved</div>
              </div>
            </div>
            
            <button
              onClick={onBack}
              className="mt-6 inline-flex items-center px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur rounded-xl text-white font-semibold transition-all transform hover:scale-105"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              New Shopping List
            </button>
          </div>
        </div>
      </div>

      {/* Results Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Share Actions */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={shareOnWhatsApp}
            className="inline-flex items-center px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.886 3.75"/>
            </svg>
            📱 Share Success
          </button>
          <button
            onClick={saveAsImage}
            className="inline-flex items-center px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            📸 Save as Image
          </button>
        </div>
        
        {/* Show message if no prices in database */}
        {results.message && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8 text-center">
            <div className="text-4xl mb-3">🏗️</div>
            <h3 className="text-xl font-bold text-blue-800 mb-2">We're adding prices now!</h3>
            <p className="text-blue-700 mb-3">
              Our team is busy collecting prices from kosher stores. Check back in a few hours for the latest deals!
            </p>
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <p className="text-sm text-blue-600">
                💡 <strong>Tip:</strong> Bookmark this page and we'll have prices ready for you soon!
              </p>
            </div>
          </div>
        )}
        
        {/* Best Shop Highlight - Only show if we have valid prices */}
        {bestStore && (
          <div className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl p-8 mb-8 text-white shadow-2xl">
            <div className="text-center">
              <div className="text-4xl mb-4">🏆</div>
              <h2 className="text-3xl font-bold mb-2">Best Deal: {bestStore.name}</h2>
              <div className="text-5xl font-black mb-4">£{bestStore.totalPrice.toFixed(2)}</div>
              <p className="text-xl opacity-90 mb-4">
                🎯 This is your winning choice!
              </p>
              <div className="bg-white/20 backdrop-blur rounded-xl p-4 inline-block">
                <span className="text-lg font-semibold">
                  {getStoreIcon(bestStore.name)} {bestStore.name} has the best total price
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Price Breakdown Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <span className="text-3xl mr-3">📊</span>
            Price Breakdown by Item
          </h2>
          
          {/* Create item-by-item comparison table */}
          {results.stores && results.stores.length > 0 && results.stores[0].items && results.stores[0].items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-800">Item</th>
                    {results.stores.map((store, idx) => (
                      <th key={idx} className="text-center py-3 px-4 font-semibold text-gray-800">
                        {getStoreIcon(store.name)} {store.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Get unique items from all stores */}
                  {Array.from(new Set(
                    results.stores.flatMap(store => 
                      (store.items || []).map(item => item.name)
                    )
                  )).map((itemName, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-700">{itemName}</td>
                      {results.stores.map((store, storeIdx) => {
                        const item = (store.items || []).find(i => i.name === itemName);
                        const price = item?.price || 0;
                        const allPrices = results.stores
                          .map(s => (s.items || []).find(i => i.name === itemName)?.price || Infinity)
                          .filter(p => p !== Infinity && p > 0);
                        const isLowest = allPrices.length > 0 && price > 0 && price === Math.min(...allPrices);
                        
                        return (
                          <td key={storeIdx} className="py-3 px-4 text-center">
                            {price > 0 ? (
                              <span className={`font-semibold ${
                                isLowest ? 'text-green-600 bg-green-100 px-2 py-1 rounded-full' : 'text-gray-700'
                              }`}>
                                £{price.toFixed(2)}
                                {isLowest && ' 🏆'}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-sm">N/A</span>
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
            <p className="text-gray-500 text-center py-8">No detailed price breakdown available</p>
          )}
        </div>
        
        {/* Items We Couldn't Find */}
        {results.unmatchedItems && results.unmatchedItems.length > 0 && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-amber-800 mb-4 flex items-center">
              <span className="text-3xl mr-3">🔍</span>
              Items We Couldn't Find
            </h2>
            <p className="text-amber-700 mb-4">
              Don't worry! These items weren't in our database yet, but you can still find them at the stores:
            </p>
            <div className="flex flex-wrap gap-2">
              {results.unmatchedItems.map((item, idx) => (
                <span key={idx} className="bg-amber-200 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-4 p-4 bg-white rounded-xl border border-amber-200">
              <p className="text-sm text-amber-700">
                💡 <strong>Tip:</strong> These items are typically available at most kosher stores. Your total savings might be even higher!
              </p>
            </div>
          </div>
        )}
        
        {/* Store Cards - Simplified for secondary display */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.stores.map((store, index) => {
            const isExpanded = expandedStores.has(index);
            const isBest = bestStore && store.name === bestStore.name;

            return (
              <div
                key={store.name}
                className={`rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${
                  isBest 
                    ? 'bg-gradient-to-br from-green-100 to-emerald-100 border-2 border-green-400' 
                    : 'bg-white border border-gray-200'
                } ${
                  isExpanded ? 'md:col-span-2 lg:col-span-3' : ''
                }`}
              >
                {/* Store Header */}
                <button
                  onClick={() => toggleStore(index)}
                  className={`w-full p-6 text-left transition-colors ${
                    isBest ? 'hover:bg-green-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <span className="text-4xl mr-4">{getStoreIcon(store.name)}</span>
                      <div>
                        <h3 className={`text-xl font-bold ${
                          isBest ? 'text-green-800' : 'text-gray-800'
                        }`}>
                          {store.name}
                          {isBest && <span className="ml-2 text-2xl">👑</span>}
                        </h3>
                        <div className="flex items-center mt-1">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={i < Math.floor(store.rating || 4) ? 'text-yellow-400' : 'text-gray-300'}>
                              ★
                            </span>
                          ))}
                          <span className="ml-1 text-sm text-gray-600">({store.rating || '4.0'})</span>
                        </div>
                      </div>
                    </div>
                    {isBest && (
                      <span className="px-4 py-2 bg-green-500 text-white rounded-full text-sm font-bold">
                        💰 BEST DEAL
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-end justify-between">
                    <div>
                      <p className={`text-3xl font-bold ${
                        isBest ? 'text-green-600' : 'text-gray-700'
                      }`}>
                        £{(store.totalPrice || 0).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {store.totalPrice > 0 ? 'Total price' : 'No prices available'}
                      </p>
                    </div>
                    <div className="flex items-center text-gray-400">
                      <span className="text-sm mr-1">{isExpanded ? 'Hide' : 'View'} details</span>
                      <svg
                        className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-200">
                    <div className="p-6">
                      <h4 className="font-semibold text-gray-700 mb-4">Shopping List Breakdown</h4>
                      
                      {/* Items with prices */}
                      {store.items && store.items.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {store.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center py-2 px-3 hover:bg-gray-50 rounded">
                              <div>
                                <span className="text-gray-700">{item.name}</span>
                                {item.matchedName && item.matchedName !== item.name && (
                                  <span className="text-xs text-gray-500 ml-2">(matched as: {item.matchedName})</span>
                                )}
                              </div>
                              <div className="text-right">
                                <span className="font-semibold text-green-600">
                                  £{(item.price || 0).toFixed(2)}
                                </span>
                                {item.unit && (
                                  <span className="text-xs text-gray-500 ml-1">/{item.unit}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">No prices available for your items at this store</p>
                      )}
                      
                      {/* Missing items */}
                      {store.missingItems && store.missingItems.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-medium text-gray-700 mb-2">Items not found:</p>
                          <p className="text-sm text-gray-500">{store.missingItems.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl p-8 border border-amber-200">
            <h3 className="text-2xl font-bold text-amber-800 mb-4">🎉 Congratulations on your smart shopping!</h3>
            <p className="text-amber-700 mb-6">
              You've just saved money and time by comparing prices. Ready for your next shopping adventure?
            </p>
            <button
              onClick={onBack}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-105 active:scale-95"
            >
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              ✨ Create New Shopping List
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Feedback Modal Component
const FeedbackModal = ({ isOpen, onClose }) => {
  const [feedbackType, setFeedbackType] = useState('general');
  const [feedbackText, setFeedbackText] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const feedbackTypes = {
    bug: { emoji: '🐛', label: 'Bug Report', placeholder: 'Describe what went wrong...' },
    feature: { emoji: '💡', label: 'Feature Request', placeholder: 'What would you like to see added?' },
    general: { emoji: '💬', label: 'General Feedback', placeholder: 'Share your thoughts about ShopStation...' },
    pricing: { emoji: '💰', label: 'Pricing Issue', placeholder: 'Tell us about incorrect or missing prices...' }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    setIsSubmitting(true);
    
    // Simulate form submission (you can integrate with a real backend later)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubmitMessage('✅ Thank you! Your feedback has been sent.');
      setTimeout(() => {
        onClose();
        setFeedbackText('');
        setUserEmail('');
        setSubmitMessage('');
        setFeedbackType('general');
      }, 2000);
    } catch (error) {
      setSubmitMessage('❌ Something went wrong. Please try emailing us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEmail = () => {
    const subject = encodeURIComponent(`ShopStation Feedback - ${feedbackTypes[feedbackType].label}`);
    const body = encodeURIComponent(`Hi Gavriel,\n\n${feedbackText}\n\nBest regards,\n${userEmail || 'A ShopStation user'}`);
    window.open(`mailto:gavrielsacks21@gmail.com?subject=${subject}&body=${body}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">💌 Help Us Improve!</h2>
              <p className="text-purple-100 mt-1">Your feedback shapes ShopStation</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-all"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {submitMessage ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">
                {submitMessage.includes('✅') ? '🎉' : '😅'}
              </div>
              <p className="text-lg font-medium text-gray-800">{submitMessage}</p>
            </div>
          ) : (
            <>
              {/* Feedback Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  What type of feedback do you have?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(feedbackTypes).map(([key, type]) => (
                    <button
                      key={key}
                      onClick={() => setFeedbackType(key)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        feedbackType === key
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="text-lg">{type.emoji}</div>
                      <div className="text-sm font-medium">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Your Message
                  </label>
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder={feedbackTypes[feedbackType].placeholder}
                    rows={4}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Your Email (optional)
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="your@email.com (for follow-up)"
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col space-y-3 pt-4">
                  <button
                    type="submit"
                    disabled={!feedbackText.trim() || isSubmitting}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-bold hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      '📨 Send Feedback'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={openEmail}
                    className="w-full bg-blue-500 text-white py-3 rounded-lg font-bold hover:bg-blue-600 transition-all"
                  >
                    📧 Email Gavriel Directly
                  </button>

                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-2">Other ways to reach us:</p>
                    <div className="flex justify-center space-x-4">
                      <a
                        href="https://wa.me/447123456789"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        💬 WhatsApp
                      </a>
                      <a
                        href="https://twitter.com/intent/tweet?text=@ShopStation"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-600 text-sm font-medium"
                      >
                        🐦 Twitter
                      </a>
                    </div>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Main App
const App = () => {
  const [showLegalPages, setShowLegalPages] = useState(false);
  const [legalPageType, setLegalPageType] = useState('privacy');
  const [showAdmin, setShowAdmin] = useState(false);

  const openLegalPage = (pageType) => {
    setLegalPageType(pageType);
    setShowLegalPages(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        <MainPage onAdminToggle={setShowAdmin} />
      </div>
      
      {/* Footer - Hidden in admin mode */}
      {!showAdmin && (
        <footer className="bg-gray-50 border-t border-gray-200 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <p className="text-gray-600 text-sm">
                © {new Date().getFullYear()} ShopStation. All rights reserved.
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Helping London's kosher community save money since 2025
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-end gap-4 text-sm">
              <button
                onClick={() => openLegalPage('privacy')}
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => openLegalPage('terms')}
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                Terms of Service
              </button>
              <button
                onClick={() => openLegalPage('disclaimer')}
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                Price Disclaimer
              </button>
              <button
                onClick={() => openLegalPage('copyright')}
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                Copyright
              </button>
            </div>
          </div>
          
          {/* Price Disclaimer in Footer */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-xs text-center">
              ⚠️ <strong>Important:</strong> All prices are estimates and may not reflect current store prices. 
              Always verify prices in-store before purchasing.
            </p>
          </div>
        </div>
        </footer>
      )}

      {/* Legal Pages Modal */}
      {showLegalPages && (
        <LegalPages
          onClose={() => setShowLegalPages(false)}
          initialPage={legalPageType}
        />
      )}

      {/* Cookie Consent Banner */}
      <CookieConsent />
    </div>
  );
};

export default App;
