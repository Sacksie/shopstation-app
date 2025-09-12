export const storePortalSampleData = {
  storeName: "The Corner Shop (Demo)",
  winsTracker: {
    newCustomers: 14,
    reason: "best price on Heinz Baked Beans",
  },
  priceIntelligence: {
    cheapestItems: 52,
    mostExpensiveItems: 12,
    competitorPriceChanges: [
      { competitor: "Tesco Express", name: "Hovis Bread", newPrice: "£1.10" },
      { competitor: "Sainsbury's Local", name: "Coca-Cola 2L", newPrice: "£2.00" },
    ],
  },
  demandAnalytics: {
    topSearches: ["Milk", "Bread", "Eggs", "Wine", "Beer"],
    missedOpportunities: ["Organic Avocados", "Gluten-Free Flour", "Craft Gin"],
  },
  priceIntelligenceReport: {
    keyItems: [
      { id: 1, name: "Heinz Baked Beans", category: "Tinned Goods", myPrice: 0.90, competitors: { "Tesco Express": 0.95, "Sainsbury's Local": 0.95 } },
      { id: 2, name: "Hovis Bread", category: "Bakery", myPrice: 1.20, competitors: { "Tesco Express": 1.10, "Sainsbury's Local": 1.15 } },
      { id: 3, name: "Free-Range Eggs (6)", category: "Dairy & Eggs", myPrice: 1.50, competitors: { "Tesco Express": 1.50, "Sainsbury's Local": 1.55 } },
      { id: 4, name: "Coca-Cola 2L", category: "Drinks", myPrice: 2.10, competitors: { "Tesco Express": 2.00, "Sainsbury's Local": 2.00 } },
    ]
  },
  demandAnalyticsReport: {
    topSearches: [
        { term: 'Milk', searches: 212, conversionRate: 0.85 },
        { term: 'Bread', searches: 198, conversionRate: 0.92 },
        { term: 'Eggs', searches: 150, conversionRate: 0.78 },
    ],
    missedOpportunities: [
        { term: 'Organic Avocados', searches: 45 },
        { term: 'Gluten-Free Flour', searches: 32 },
    ],
    peakTimes: [
        { day: 'Mon', hour: '5pm', activity: 60 },
        { day: 'Wed', hour: '6pm', activity: 85 },
        { day: 'Fri', hour: '5pm', activity: 100 },
        { day: 'Sat', hour: '11am', activity: 90 },
    ]
  },
  products: [
    { id: 1, name: "Heinz Baked Beans", category: "Tinned Goods", price: 0.90 },
    { id: 2, name: "Hovis Bread", category: "Bakery", price: 1.20 },
    { id: 3, name: "Free-Range Eggs (6)", category: "Dairy & Eggs", price: 1.50 },
    { id: 4, name: "Coca-Cola 2L", category: "Drinks", price: 2.10 },
    { id: 5, name: "Cheddar Cheese", category: "Dairy & Eggs", price: 2.50 },
  ],
  // Data for "Live Inventory & Restock Advisor" Demo
  inventory: {
    lowStockItems: [
      { id: 4, name: "Coca-Cola 2L", stock: 8, capacity: 100, weeklySale: 70 },
      { id: 2, name: "Hovis Bread", stock: 12, capacity: 80, weeklySale: 65 },
    ],
    restockAdvisory: [
      { id: 4, name: "Coca-Cola 2L", suggestion: "Order 8 cases", reason: "High velocity, risk of weekend stockout." },
      { id: 2, name: "Hovis Bread", suggestion: "Order 6 trays", reason: "Consistent seller, below safety stock level." },
      { id: 1, name: "Heinz Baked Beans", suggestion: "Order 5 cases", reason: "On promotion next week, anticipate demand spike." }
    ],
    inventorySummary: {
      totalItems: 1253,
      inStockPercentage: 96.5,
      outOfStockItems: 44,
      estimatedWeeklyProfit: 4250.75,
    }
  },
  // Data for "Dynamic Pricing Engine" Demo
  pricingEngine: {
    rules: [
      { id: 1, name: "Key Item Price Matching", description: "Match Tesco's price on bread, milk, and eggs.", active: true },
      { id: 2, name: "Snacks & Confectionery Margin", description: "Maintain a minimum 40% margin on all snacks.", active: true },
      { id: 3, name: "Weekend Drinks Promotion", description: "10% off all soft drinks from Friday to Sunday.", active: false },
    ],
    suggestions: [
      { productId: 4, name: "Coca-Cola 2L", currentPrice: 2.10, suggestedPrice: 1.99, reason: "Competitor Sainsbury's Local lowered their price. Match to stay competitive." },
      { productId: 5, name: "Cheddar Cheese", currentPrice: 2.50, suggestedPrice: 2.65, reason: "You are the cheapest in the area by £0.20. Opportunity to increase margin." },
    ]
  },
  // Data for "Smart Receipt Scanner" Demo
  costOfGoods: {
    recentUploads: [
      { id: 'inv-00123', supplier: 'Booker Wholesale', date: '2025-09-11', total: 1245.60, status: 'Processed' },
      { id: 'inv-00122', supplier: 'Bestway', date: '2025-09-09', total: 876.25, status: 'Processed' },
      { id: 'img-98345', supplier: 'Local Farm Produce', date: '2025-09-08', total: 210.50, status: 'Queued' },
    ],
    marginAnalysis: {
      averageStoreMargin: 32.5,
      highestMarginCategory: { name: "Household Goods", margin: 48.2 },
      lowestMarginCategory: { name: "Dairy & Eggs", margin: 19.5 },
    }
  }
};
