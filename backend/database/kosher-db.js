const fs = require('fs');
const path = require('path');

class KosherPriceDB {
  constructor() {
    this.dbPath = path.join(__dirname, 'kosher-prices.json');
    this.loadDatabase();
  }
  
  loadDatabase() {
    try {
      const data = fs.readFileSync(this.dbPath, 'utf8');
      this.db = JSON.parse(data);
    } catch (error) {
      // Initialize with kosher stores
      this.db = {
        stores: {
          'B Kosher': { 
            location: 'Address here', 
            phone: '',
            hours: 'Sun-Thu: 9-7, Fri: 9-2' 
          },
          'Tapuach': { 
            location: 'Address here', 
            phone: '',
            hours: 'Sun-Thu: 8-8, Fri: 8-3'
          },
          'Kosher Kingdom': { 
            location: 'Address here', 
            phone: '',
            hours: 'Sun-Thu: 9-7, Fri: 9-2'
          },
          'Kays': { 
            location: 'Address here', 
            phone: '',
            hours: 'Sun-Thu: 9-6, Fri: 9-1'
          }
        },
        products: {},
        receipts: [],
        priceHistory: [],
        lastUpdated: new Date()
      };
      this.saveDatabase();
    }
  }
  
  saveDatabase() {
    fs.writeFileSync(this.dbPath, JSON.stringify(this.db, null, 2));
  }
  
  // Add a single price
  addPrice(store, productName, price, unit = 'each', category = 'General', brand = null) {
    const key = productName.toLowerCase().trim();
    
    if (!this.db.products[key]) {
      this.db.products[key] = {
        displayName: productName,
        category: category,
        brand: brand,
        prices: {},
        priceHistory: []
      };
    }
    
    // Save old price to history if it exists and changed
    if (this.db.products[key].prices[store]) {
      const oldPrice = this.db.products[key].prices[store].price;
      if (oldPrice !== price) {
        this.db.products[key].priceHistory.push({
          store: store,
          oldPrice: oldPrice,
          newPrice: price,
          date: new Date()
        });
      }
    }
    
    this.db.products[key].prices[store] = {
      price: parseFloat(price),
      unit: unit,
      lastUpdated: new Date(),
      source: 'manual'
    };
    
    this.db.lastUpdated = new Date();
    this.saveDatabase();
    return true;
  }
  
  // Add prices from a receipt
  addReceipt(store, items, total, date = new Date()) {
    const receipt = {
      id: Date.now(),
      store: store,
      items: items,
      total: total,
      date: date,
      uploadedAt: new Date()
    };
    
    this.db.receipts.push(receipt);
    
    // Update individual prices
    items.forEach(item => {
      if (item.name && item.price) {
        this.addPrice(store, item.name, item.price, item.unit || 'each', item.category || 'General');
      }
    });
    
    this.saveDatabase();
    return receipt;
  }
  
  // Get prices for shopping list comparison
  compareShops(shoppingList) {
    const comparison = {};
    
    ['B Kosher', 'Tapuach', 'Kosher Kingdom', 'Kays'].forEach(store => {
      comparison[store] = {
        available: [],
        missing: [],
        total: 0
      };
      
      shoppingList.forEach(requestedItem => {
        const itemKey = requestedItem.toLowerCase().trim();
        const product = this.db.products[itemKey];
        
        if (product && product.prices[store]) {
          comparison[store].available.push({
            name: product.displayName,
            price: product.prices[store].price,
            unit: product.prices[store].unit
          });
          comparison[store].total += product.prices[store].price;
        } else {
          comparison[store].missing.push(requestedItem);
        }
      });
      
      comparison[store].total = parseFloat(comparison[store].total.toFixed(2));
    });
    
    return comparison;
  }
  
  // Get all prices for a specific store
  getStorePrices(storeName) {
    const prices = [];
    
    Object.entries(this.db.products).forEach(([key, product]) => {
      if (product.prices[storeName]) {
        prices.push({
          name: product.displayName,
          price: product.prices[storeName].price,
          unit: product.prices[storeName].unit,
          category: product.category,
          lastUpdated: product.prices[storeName].lastUpdated
        });
      }
    });
    
    return prices.sort((a, b) => a.name.localeCompare(b.name));
  }
  
  // Quick bulk add for manual entry
  bulkAddPrices(store, priceList) {
    let added = 0;
    priceList.forEach(item => {
      if (this.addPrice(store, item.name, item.price, item.unit, item.category, item.brand)) {
        added++;
      }
    });
    return added;
  }
}

module.exports = new KosherPriceDB();
