const fs = require('fs');
const path = require('path');

class Analytics {
  constructor() {
    this.analyticsFile = path.join(__dirname, '../data/analytics.json');
    this.ensureAnalyticsFile();
  }

  ensureAnalyticsFile() {
    // Create data directory if it doesn't exist
    const dataDir = path.dirname(this.analyticsFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Create analytics file if it doesn't exist
    if (!fs.existsSync(this.analyticsFile)) {
      const initialData = {
        searches: [],
        shopSelections: [],
        dailyUsers: {},
        errors: [] // Initialize errors array
      };
      fs.writeFileSync(this.analyticsFile, JSON.stringify(initialData, null, 2));
    }
  }

  readAnalytics() {
    try {
      const data = fs.readFileSync(this.analyticsFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading analytics file:', error);
      return { searches: [], shopSelections: [], dailyUsers: {}, errors: [] };
    }
  }

  writeAnalytics(data) {
    try {
      fs.writeFileSync(this.analyticsFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error writing analytics file:', error);
    }
  }

  // Track a search
  logSearch(searchData) {
    const analytics = this.readAnalytics();
    const timestamp = new Date().toISOString();
    const today = new Date().toISOString().split('T')[0];
    
    // Generate simple user ID based on timestamp and items (for basic tracking)
    const userId = this.generateUserId(searchData.items, timestamp);
    
    const searchEntry = {
      timestamp,
      userId,
      items: searchData.items,
      matchedItems: searchData.matchedItems || 0,
      unmatchedItems: searchData.unmatchedItems || [],
      storesCompared: searchData.storesCompared || 0,
      savings: searchData.savings || 0,
      cheapestStore: searchData.cheapestStore || null,
      mostExpensiveStore: searchData.mostExpensiveStore || null,
      day: today
    };

    analytics.searches.push(searchEntry);

    // Track daily active users
    if (!analytics.dailyUsers[today]) {
      analytics.dailyUsers[today] = [];
    }
    
    // Add user if not already in today's list
    if (!analytics.dailyUsers[today].includes(userId)) {
      analytics.dailyUsers[today].push(userId);
    }

    this.writeAnalytics(analytics);
    return searchEntry;
  }

  // Track shop selection (when user expands a store for details)
  logShopSelection(shopData) {
    const analytics = this.readAnalytics();
    const timestamp = new Date().toISOString();
    
    const selectionEntry = {
      timestamp,
      shopName: shopData.shopName,
      totalPrice: shopData.totalPrice || 0,
      itemsAvailable: shopData.itemsAvailable || 0,
      day: new Date().toISOString().split('T')[0]
    };

    analytics.shopSelections.push(selectionEntry);
    this.writeAnalytics(analytics);
    return selectionEntry;
  }

  // Track errors for monitoring
  logError(error, context = {}) {
    const analytics = this.readAnalytics();
    const timestamp = new Date().toISOString();
    
    if (!analytics.errors) {
      analytics.errors = [];
    }
    
    const errorEntry = {
      timestamp,
      error: error.message || String(error),
      stack: error.stack,
      context,
      day: new Date().toISOString().split('T')[0]
    };

    analytics.errors.push(errorEntry);
    
    // Keep only last 100 errors to prevent file from growing too large
    if (analytics.errors.length > 100) {
      analytics.errors = analytics.errors.slice(-100);
    }
    
    this.writeAnalytics(analytics);
    return errorEntry;
  }

  // Generate a simple user ID for basic tracking
  generateUserId(items, timestamp) {
    const itemsStr = items.join('');
    const hash = this.simpleHash(itemsStr + timestamp.slice(0, 16)); // Use date+time but not seconds
    return `user_${hash}`;
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).slice(0, 8);
  }

  // Get analytics summary
  getAnalyticsSummary(days = 30) {
    const analytics = this.readAnalytics();
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const today = now.toISOString().split('T')[0];

    // Filter recent searches
    const recentSearches = analytics.searches.filter(search => 
      new Date(search.timestamp) > cutoffDate
    );

    // Today's searches
    const todaySearches = analytics.searches.filter(search => search.day === today);

    // Most searched items
    const itemCounts = {};
    recentSearches.forEach(search => {
      search.items.forEach(item => {
        const normalizedItem = item.toLowerCase().trim();
        itemCounts[normalizedItem] = (itemCounts[normalizedItem] || 0) + 1;
      });
    });

    const mostSearchedItems = Object.entries(itemCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([item, count]) => ({ item, count }));

    // Items we need to add (unmatched items)
    const unmatchedCounts = {};
    recentSearches.forEach(search => {
      if (search.unmatchedItems && Array.isArray(search.unmatchedItems)) {
        search.unmatchedItems.forEach(item => {
          const normalizedItem = item.toLowerCase().trim();
          unmatchedCounts[normalizedItem] = (unmatchedCounts[normalizedItem] || 0) + 1;
        });
      }
    });

    const itemsToAdd = Object.entries(unmatchedCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .map(([item, count]) => ({ item, count }));

    // Average savings
    const searchesWithSavings = recentSearches.filter(search => search.savings > 0);
    const averageSavings = searchesWithSavings.length > 0
      ? searchesWithSavings.reduce((sum, search) => sum + search.savings, 0) / searchesWithSavings.length
      : 0;

    // Daily active users for today
    const todayUsers = analytics.dailyUsers[today] ? analytics.dailyUsers[today].length : 0;

    // Shop selection stats
    const recentSelections = analytics.shopSelections.filter(selection =>
      new Date(selection.timestamp) > cutoffDate
    );

    const shopStats = {};
    recentSelections.forEach(selection => {
      if (!shopStats[selection.shopName]) {
        shopStats[selection.shopName] = { selections: 0, totalRevenue: 0 };
      }
      shopStats[selection.shopName].selections++;
      shopStats[selection.shopName].totalRevenue += selection.totalPrice;
    });

    const popularShops = Object.entries(shopStats)
      .sort(([,a], [,b]) => b.selections - a.selections)
      .map(([name, stats]) => ({ name, ...stats }));

    return {
      summary: {
        totalSearches: recentSearches.length,
        todaySearches: todaySearches.length,
        dailyActiveUsers: todayUsers,
        averageSavings: Math.round(averageSavings * 100) / 100,
        totalItemsSearched: recentSearches.reduce((sum, search) => sum + search.items.length, 0)
      },
      mostSearchedItems,
      itemsToAdd,
      popularShops,
      recentActivity: {
        searches: recentSearches.slice(-10).reverse(), // Last 10 searches
        selections: recentSelections.slice(-10).reverse()
      }
    };
  }
}

module.exports = new Analytics();