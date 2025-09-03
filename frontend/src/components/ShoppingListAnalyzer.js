import React, { useState, useEffect } from 'react';
import config from '../config/environments';

const API_URL = config.api.baseUrl;

const ShoppingListAnalyzer = ({ onBack }) => {
  const [listText, setListText] = useState('');
  const [parsedItems, setParsedItems] = useState([]);
  const [matchedProducts, setMatchedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [totalComparison, setTotalComparison] = useState(null);
  const [availableProducts, setAvailableProducts] = useState({});

  // Fetch available products on component mount
  useEffect(() => {
    fetchAvailableProducts();
  }, []);

  const fetchAvailableProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/products`);
      if (response.ok) {
        const data = await response.json();
        setAvailableProducts(data.products || {});
      } else {
        console.warn('Products API not available, using demo mode');
        // Use demo products for testing
        setAvailableProducts(getDemoProducts());
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      console.warn('Using demo products for offline mode');
      setAvailableProducts(getDemoProducts());
    }
  };

  // Demo products for testing when API is not available
  const getDemoProducts = () => ({
    milk: {
      displayName: "Milk (2 pint)",
      category: "dairy",
      synonyms: ["fresh milk", "2 pint milk", "whole milk", "semi skimmed milk", "2pt milk", "milk 2pt"],
      prices: {
        "B Kosher": { price: 2.5, unit: "2 pints" },
        "Tapuach": { price: 2.75, unit: "2 pints" },
        "Kosher Kingdom": { price: 2.4, unit: "2 pints" },
        "Kays": { price: 2.65, unit: "2 pints" }
      }
    },
    challah: {
      displayName: "Challah",
      category: "bakery", 
      synonyms: ["challa", "challah bread", "shabbat bread", "plaited bread", "chalah", "halla"],
      prices: {
        "B Kosher": { price: 3.5, unit: "loaf" },
        "Tapuach": { price: 3.75, unit: "loaf" },
        "Kays": { price: 3.25, unit: "loaf" }
      }
    },
    eggs: {
      displayName: "Eggs (dozen)",
      category: "dairy",
      synonyms: ["dozen eggs", "large eggs", "medium eggs", "free range eggs", "x12", "12 eggs"],
      prices: {
        "B Kosher": { price: 2.95, unit: "dozen" },
        "Tapuach": { price: 3.2, unit: "dozen" },
        "Kosher Kingdom": { price: 3.1, unit: "dozen" },
        "Kays": { price: 3.3, unit: "dozen" }
      }
    },
    chicken: {
      displayName: "Chicken (whole)",
      category: "meat",
      synonyms: ["whole chicken", "roasting chicken", "fresh chicken"],
      prices: {
        "B Kosher": { price: 8.99, unit: "kg" },
        "Kosher Kingdom": { price: 9.5, unit: "kg" }
      }
    },
    chicken_breast: {
      displayName: "Chicken Breast", 
      category: "meat",
      synonyms: ["chicken breasts", "boneless chicken", "chicken fillet"],
      prices: {
        "B Kosher": { price: 12.99, unit: "kg" },
        "Tapuach": { price: 13.5, unit: "kg" }
      }
    },
    butter: {
      displayName: "Butter",
      category: "dairy",
      synonyms: ["unsalted butter", "salted butter", "block butter", "butter block"],
      prices: {
        "B Kosher": { price: 4.2, unit: "pack" },
        "Tapuach": { price: 3.95, unit: "pack" }
      }
    },
    grape_juice: {
      displayName: "Grape Juice",
      category: "beverages",
      synonyms: ["red grape juice", "white grape juice", "kosher grape juice"],
      prices: {
        "Kosher Kingdom": { price: 5.5, unit: "bottle" },
        "Kays": { price: 5.25, unit: "bottle" }
      }
    }
  });

  // Smart shopping list parser
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

  // Advanced product matching using fuzzy logic
  const findBestMatch = (searchName, availableProducts) => {
    const cleanSearch = cleanProductName(searchName);
    let bestMatch = null;
    let bestScore = 0;

    Object.entries(availableProducts).forEach(([key, product]) => {
      let score = 0;
      const productName = cleanProductName(product.displayName);
      
      // Exact match (highest score)
      if (productName === cleanSearch) {
        score = 100;
      }
      // Contains search term
      else if (productName.includes(cleanSearch)) {
        score = 80;
      }
      // Search term contains product name
      else if (cleanSearch.includes(productName)) {
        score = 70;
      }
      // Check synonyms
      else if (product.synonyms) {
        for (const synonym of product.synonyms) {
          const cleanSynonym = cleanProductName(synonym);
          if (cleanSynonym === cleanSearch) {
            score = 90;
            break;
          } else if (cleanSynonym.includes(cleanSearch) || cleanSearch.includes(cleanSynonym)) {
            score = Math.max(score, 60);
          }
        }
      }

      // Word-by-word matching for compound products
      if (score === 0) {
        const searchWords = cleanSearch.split(' ');
        const productWords = productName.split(' ');
        let wordMatches = 0;
        
        searchWords.forEach(searchWord => {
          productWords.forEach(productWord => {
            if (searchWord === productWord) {
              wordMatches++;
            } else if (searchWord.includes(productWord) || productWord.includes(searchWord)) {
              wordMatches += 0.5;
            }
          });
        });
        
        if (wordMatches > 0) {
          score = (wordMatches / Math.max(searchWords.length, productWords.length)) * 50;
        }
      }

      if (score > bestScore && score >= 30) { // Minimum threshold
        bestScore = score;
        bestMatch = {
          key,
          product,
          confidence: score
        };
      }
    });

    return bestMatch;
  };

  // Process the shopping list
  const handleAnalyze = async () => {
    if (!listText.trim()) {
      setError('Please paste your shopping list');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const items = parseShoppingList(listText);
      setParsedItems(items);

      // Match each item with available products
      const matched = items.map(item => {
        const match = findBestMatch(item.productName, availableProducts);
        return {
          ...item,
          match: match,
          status: match ? (match.confidence >= 70 ? 'good' : 'partial') : 'not_found'
        };
      });

      setMatchedProducts(matched);

      // Calculate total comparison if we have matches
      calculateTotalComparison(matched.filter(item => item.match));

    } catch (error) {
      setError('Error analyzing shopping list: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate total costs per store
  const calculateTotalComparison = (matchedItems) => {
    const stores = ['B Kosher', 'Tapuach', 'Kosher Kingdom', 'Kays'];
    const storeTotals = {};

    stores.forEach(store => {
      let total = 0;
      let itemsWithPrices = 0;

      matchedItems.forEach(item => {
        if (item.match && item.match.product.prices[store]) {
          const storePrice = item.match.product.prices[store].price;
          total += storePrice * item.quantity;
          itemsWithPrices++;
        }
      });

      if (itemsWithPrices > 0) {
        storeTotals[store] = {
          total: total.toFixed(2),
          itemCount: itemsWithPrices,
          percentage: Math.round((itemsWithPrices / matchedItems.length) * 100)
        };
      }
    });

    // Find cheapest store
    const cheapestStore = Object.entries(storeTotals).reduce((min, [store, data]) => {
      return !min || parseFloat(data.total) < parseFloat(min.total) ? { store, ...data } : min;
    }, null);

    setTotalComparison({
      storeTotals,
      cheapest: cheapestStore,
      totalItems: matchedItems.length
    });
  };

  // Example shopping lists for demonstration
  const exampleLists = [
    {
      name: "Weekly Essentials",
      list: `2 pints Milk
Dozen eggs
Challah bread
1kg Chicken
Butter
Grape juice`
    },
    {
      name: "Shabbat Prep",
      list: `• Challah
• 2 bottles grape juice  
• Chicken (whole)
• 2 pints milk
• Eggs (dozen)
• Butter block`
    },
    {
      name: "WhatsApp Shopping List",
      list: `Mum's shopping list 📝
- milk (2 pints)
- eggs x12
- challah for shabbat
- chicken breast
- butter (unsalted)
- red grape juice`
    },
    {
      name: "Notes App Format",
      list: `Shopping List - Friday
1. Milk 2pt
2. Eggs dozen
3. Challa
4. Whole chicken
5. Butter
6. Grape juice (kosher)`
    }
  ];

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
            <h1 className="text-2xl font-bold text-gray-900">Shopping List Analyzer</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Input Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Paste Your Shopping List</h2>
              <p className="text-gray-600 text-sm mb-4">
                Copy and paste your shopping list from anywhere - notes app, WhatsApp, email, etc. 
                We'll automatically detect products and find the best prices.
              </p>
              
              <textarea
                value={listText}
                onChange={(e) => setListText(e.target.value)}
                placeholder="Paste your shopping list here...

Example:
• 2 pints milk
• dozen eggs  
• challah bread
• 1kg chicken
• butter"
                className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />

              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <button
                  onClick={handleAnalyze}
                  disabled={loading || !listText.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  {loading ? 'Analyzing...' : 'Analyze Shopping List'}
                </button>
                <button
                  onClick={() => setListText('')}
                  className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Example Lists */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold mb-3">Try These Examples</h3>
              <div className="space-y-2">
                {exampleLists.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setListText(example.list)}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-sm">{example.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {example.list.split('\n').length} items
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            
            {/* Total Comparison */}
            {totalComparison && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold mb-4">💰 Total Cost Comparison</h2>
                
                {totalComparison.cheapest && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-green-800">Best Deal: {totalComparison.cheapest.store}</div>
                        <div className="text-sm text-green-600">
                          {totalComparison.cheapest.itemCount} items available ({totalComparison.cheapest.percentage}% of list)
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-green-800">
                        £{totalComparison.cheapest.total}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {Object.entries(totalComparison.storeTotals)
                    .sort(([,a], [,b]) => parseFloat(a.total) - parseFloat(b.total))
                    .map(([store, data]) => (
                    <div key={store} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <div className="font-medium">{store}</div>
                        <div className="text-sm text-gray-500">
                          {data.itemCount} items ({data.percentage}% coverage)
                        </div>
                      </div>
                      <div className="text-lg font-semibold">£{data.total}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Matched Products */}
            {matchedProducts.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold mb-4">📋 Product Matches</h2>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {matchedProducts.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium">{item.originalText}</div>
                          <div className="text-sm text-gray-500">
                            Quantity: {item.quantity} {item.unit}
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          item.status === 'good' 
                            ? 'bg-green-100 text-green-800' 
                            : item.status === 'partial'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.status === 'good' ? 'Good Match' : 
                           item.status === 'partial' ? 'Partial Match' : 'No Match'}
                        </div>
                      </div>

                      {item.match ? (
                        <div>
                          <div className="text-sm font-medium text-blue-600 mb-2">
                            ➤ {item.match.product.displayName}
                            <span className="text-gray-500 ml-2">({item.match.confidence}% confidence)</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(item.match.product.prices).map(([store, priceData]) => (
                              <div key={store} className="text-xs bg-gray-50 p-2 rounded">
                                <div className="font-medium">{store}</div>
                                <div>£{(priceData.price * item.quantity).toFixed(2)} ({priceData.unit})</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          Product not found in our database. Consider adding it manually.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {parsedItems.length > 0 && matchedProducts.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-2">⚡</div>
                  <p>Processing your shopping list...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShoppingListAnalyzer;