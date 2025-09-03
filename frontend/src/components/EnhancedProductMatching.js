import React, { useState, useEffect, useRef } from 'react';

const EnhancedProductMatching = ({ 
  searchTerm, 
  onProductSelect, 
  products = [], 
  userPreferences = {} 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchValue, setSearchValue] = useState(searchTerm || '');
  const dropdownRef = useRef(null);

  // Load user preferences from localStorage
  useEffect(() => {
    const savedPreferences = localStorage.getItem('shopstation_preferences');
    if (savedPreferences) {
      try {
        const prefs = JSON.parse(savedPreferences);
        // Merge with passed preferences
        Object.assign(userPreferences, prefs);
      } catch (error) {
        console.error('Error loading user preferences:', error);
      }
    }
  }, []);

  // Filter products based on search term and user preferences
  useEffect(() => {
    if (!searchValue.trim()) {
      setFilteredProducts([]);
      setIsOpen(false);
      return;
    }

    const searchLower = searchValue.toLowerCase();
    let filtered = products.filter(product => {
      // Check if product name matches search
      const nameMatch = product.name.toLowerCase().includes(searchLower);
      
      // Check synonyms
      const synonymMatch = product.synonyms?.some(synonym => 
        synonym.toLowerCase().includes(searchLower)
      ) || false;

      // Check category
      const categoryMatch = product.category_name?.toLowerCase().includes(searchLower) || false;

      return nameMatch || synonymMatch || categoryMatch;
    });

    // Apply user preference filtering
    if (userPreferences.dietaryRestrictions) {
      filtered = filtered.filter(product => {
        // This is a simplified filter - you can expand this logic
        const restrictions = userPreferences.dietaryRestrictions;
        if (restrictions.includes('kosher') && product.category_name === 'meat') {
          return true; // Show kosher meat options
        }
        if (restrictions.includes('vegetarian') && product.category_name === 'meat') {
          return false; // Hide meat for vegetarians
        }
        return true;
      });
    }

    // Sort by relevance and user preferences
    filtered.sort((a, b) => {
      // Exact name matches first
      const aExact = a.name.toLowerCase() === searchLower;
      const bExact = b.name.toLowerCase() === searchLower;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      // Then by user brand preference
      if (userPreferences.preferredBrands) {
        const aBrandMatch = userPreferences.preferredBrands.some(brand => 
          a.common_brands?.includes(brand)
        );
        const bBrandMatch = userPreferences.preferredBrands.some(brand => 
          b.common_brands?.includes(brand)
        );
        if (aBrandMatch && !bBrandMatch) return -1;
        if (!aBrandMatch && bBrandMatch) return 1;
      }

      // Then alphabetically
      return a.name.localeCompare(b.name);
    });

    setFilteredProducts(filtered);
    setIsOpen(filtered.length > 0);
    setSelectedIndex(-1);
  }, [searchValue, products, userPreferences]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredProducts.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredProducts.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && filteredProducts[selectedIndex]) {
            handleProductSelect(filteredProducts[selectedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredProducts]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProductSelect = (product) => {
    // Save user preference for this product type
    const preferences = JSON.parse(localStorage.getItem('shopstation_preferences') || '{}');
    
    if (!preferences.recentProducts) {
      preferences.recentProducts = [];
    }
    
    // Add to recent products (keep only last 10)
    preferences.recentProducts = [
      product.name,
      ...preferences.recentProducts.filter(p => p !== product.name)
    ].slice(0, 10);

    // Save brand preference if available
    if (product.common_brands && product.common_brands.length > 0) {
      if (!preferences.preferredBrands) {
        preferences.preferredBrands = [];
      }
      // Add brand if not already in preferences
      product.common_brands.forEach(brand => {
        if (!preferences.preferredBrands.includes(brand)) {
          preferences.preferredBrands.push(brand);
        }
      });
    }

    localStorage.setItem('shopstation_preferences', JSON.stringify(preferences));

    // Call parent handler
    onProductSelect(product);
    setIsOpen(false);
    setSearchValue('');
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    
    // If input is cleared, close dropdown
    if (!value.trim()) {
      setIsOpen(false);
    }
  };

  const getProductDisplayName = (product) => {
    let displayName = product.name;
    
    // Add category info if helpful
    if (product.category_name && product.category_name !== 'other') {
      displayName += ` (${product.category_name})`;
    }
    
    // Add brand info if available
    if (product.common_brands && product.common_brands.length > 0) {
      displayName += ` - ${product.common_brands[0]}`;
    }
    
    return displayName;
  };

  const getProductSubtitle = (product) => {
    const parts = [];
    
    if (product.common_brands && product.common_brands.length > 1) {
      parts.push(`Brands: ${product.common_brands.slice(0, 3).join(', ')}`);
    }
    
    if (product.synonyms && product.synonyms.length > 0) {
      parts.push(`Also known as: ${product.synonyms.slice(0, 2).join(', ')}`);
    }
    
    return parts.join(' • ');
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (filteredProducts.length > 0) setIsOpen(true);
          }}
          placeholder="Search for products (e.g., milk, bread, chicken)..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
        />
        
        {/* Search Icon */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
          {filteredProducts.length === 0 ? (
            <div className="px-4 py-3 text-gray-500 text-center">
              No products found. Try a different search term.
            </div>
          ) : (
            <div className="py-2">
              {filteredProducts.map((product, index) => (
                <div
                  key={product.id || product.slug}
                  className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                    index === selectedIndex ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                  onClick={() => handleProductSelect(product)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="font-medium text-gray-900">
                    {getProductDisplayName(product)}
                  </div>
                  
                  {getProductSubtitle(product) && (
                    <div className="text-sm text-gray-600 mt-1">
                      {getProductSubtitle(product)}
                    </div>
                  )}
                  
                  {/* Price Range */}
                  {product.prices && product.prices.length > 0 && (
                    <div className="text-sm text-green-600 mt-1">
                      From £{Math.min(...product.prices.map(p => p.price)).toFixed(2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* User Preferences Display */}
      {userPreferences.recentProducts && userPreferences.recentProducts.length > 0 && (
        <div className="mt-3">
          <div className="text-sm text-gray-600 mb-2">Recently searched:</div>
          <div className="flex flex-wrap gap-2">
            {userPreferences.recentProducts.slice(0, 5).map((product, index) => (
              <button
                key={index}
                onClick={() => setSearchValue(product)}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              >
                {product}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedProductMatching;
