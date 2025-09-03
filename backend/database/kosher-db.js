const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'kosher-prices.json');
const LOCK_FILE = path.join(__dirname, 'kosher-prices.lock');

// Simple file-based locking to prevent race conditions
let writeLock = false;
const acquireLock = () => {
  if (writeLock) {
    return false;
  }
  writeLock = true;
  return true;
};

const releaseLock = () => {
  writeLock = false;
};

// Wait for lock with timeout
const waitForLock = (timeout = 5000) => {
  const start = Date.now();
  while (writeLock && (Date.now() - start) < timeout) {
    // Wait for lock to be released
  }
  return !writeLock;
};

// Initialize with sample data if file doesn't exist
const initializeDB = () => {
  const initialData = {
    stores: {
      'B Kosher': {
        location: 'Hendon Brent Stree',
        phone: '020 3210 4000',
        hours: 'Sun: 8am-10pm, Mon-Wed: 730am-10pm, Thu: 7am-11pm, Fri: 7am-3pm',
        rating: 4.2
      },
      'Tapuach': {
        location: 'Hendon',
        phone: '020 8202 5700',
        hours: 'Sun: 8am-10pm, Mon-Wed: 7am-11pm, Thu: 7am-12am, Fri: 8am-530pm',
        rating: 4.0
      },
      'Kosher Kingdom': {
        location: 'Golders Green',
        phone: '020 8455 1429',
        hours: 'Sun-Tue: 7am-10pm, Wed-Thu: 7am-12am, Fri: 7am-6.30pm',
        rating: 4.5
      },
      'Kays': {
        location: 'Hendon',
        phone: '020 8202 9999',
        hours: 'Sun-Thu: 8am-9pm, Fri: 8am-2pm',
        rating: 3.8
      }
    },
    products: {
      // Sample products - will be populated via admin panel
      'milk': {
        displayName: 'Milk (2 pint)',
        category: 'dairy',
        synonyms: ['fresh milk', '2 pint milk', 'whole milk', 'semi skimmed milk'],
        commonBrands: ['Golden Flow', 'Chalav'],
        prices: {}
      },
      'challah': {
        displayName: 'Challah',
        category: 'bakery',
        synonyms: ['challa', 'challah bread', 'shabbat bread', 'plaited bread'],
        commonBrands: ['Jerusalem Bakery', 'Grodzinski'],
        prices: {}
      },
      'chicken': {
        displayName: 'Chicken (whole)',
        category: 'meat',
        synonyms: ['whole chicken', 'roasting chicken', 'fresh chicken'],
        commonBrands: ['Tesco', 'Asda', 'Empire Kosher'],
        prices: {}
      },
      'eggs': {
        displayName: 'Eggs (dozen)',
        category: 'dairy',
        synonyms: ['dozen eggs', 'large eggs', 'medium eggs', 'free range eggs'],
        commonBrands: ['Happy Egg Co', 'Clarence Court'],
        prices: {}
      },
      'chicken_breast': {
        displayName: 'Chicken Breast',
        category: 'meat',
        synonyms: ['chicken breasts', 'boneless chicken', 'chicken fillet'],
        commonBrands: ['Tesco', 'Empire Kosher'],
        prices: {}
      },
      'butter': {
        displayName: 'Butter',
        category: 'dairy',
        synonyms: ['unsalted butter', 'salted butter', 'block butter'],
        commonBrands: ['Anchor', 'Lurpak', 'Kerrygold'],
        prices: {}
      },
      'grape_juice': {
        displayName: 'Grape Juice',
        category: 'beverages',
        synonyms: ['red grape juice', 'white grape juice', 'kosher grape juice'],
        commonBrands: ['Kedem', 'Bartenura'],
        prices: {}
      }
    },
    categories: {
      dairy: {
        name: 'Dairy & Eggs',
        description: 'Milk, cheese, butter, eggs and dairy products',
        icon: '🥛'
      },
      meat: {
        name: 'Meat & Fish',
        description: 'Fresh meat, poultry and fish products',
        icon: '🍗'
      },
      bakery: {
        name: 'Bakery',
        description: 'Bread, challah, bagels and baked goods',
        icon: '🍞'
      },
      produce: {
        name: 'Fruit & Vegetables',
        description: 'Fresh fruits and vegetables',
        icon: '🥕'
      },
      pantry: {
        name: 'Pantry',
        description: 'Rice, pasta, oils and store cupboard essentials',
        icon: '🍚'
      },
      beverages: {
        name: 'Beverages',
        description: 'Juices, soft drinks and beverages',
        icon: '🧃'
      }
    },
    aliases: {
      // Legacy aliases - enhanced matching now handles most variations
      'mlk': 'milk',
      'milk 2pt': 'milk',
      'challa': 'challah',
      'chalah': 'challah',
      'halla': 'challah',
      'chicken breast': 'chicken_breast',
      'chkn brst': 'chicken_breast',
      'grape juice': 'grape_juice',
      'grp juice': 'grape_juice'
    }
  };

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    console.log('Database initialized with sample data');
  }
};

// Read database
const readDB = () => {
  try {
    initializeDB();
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    initializeDB();
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  }
};

// Write to database
const writeDB = (data) => {
  try {
    // Wait for lock with timeout
    if (!waitForLock(5000)) {
      console.error('Timeout waiting for database lock');
      return false;
    }
    
    // Acquire lock
    if (!acquireLock()) {
      console.error('Could not acquire database lock');
      return false;
    }
    
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
      return true;
    } finally {
      // Always release lock
      releaseLock();
    }
  } catch (error) {
    console.error('Error writing to database:', error);
    releaseLock(); // Ensure lock is released on error
    return false;
  }
};

// Add or update product prices
const updateProductPrice = (productName, store, price, unit) => {
  const db = readDB();
  
  // Normalize product name
  const normalizedName = productName.toLowerCase().replace(/\s+/g, '_');
  
  // Create product if it doesn't exist
  if (!db.products[normalizedName]) {
    db.products[normalizedName] = {
      displayName: productName,
      category: 'uncategorized',
      prices: {}
    };
  }
  
  // Update price
  db.products[normalizedName].prices[store] = {
    price: parseFloat(price),
    unit: unit,
    lastUpdated: new Date().toISOString()
  };
  
  return writeDB(db);
};

// Update product info (display name, category)
const updateProductInfo = (productKey, updates) => {
  try {
    const db = readDB();
    
    if (!db.products[productKey]) {
      console.warn(`Product ${productKey} not found`);
      return false;
    }
    
    // Update display name if provided
    if (updates.displayName) {
      db.products[productKey].displayName = updates.displayName;
    }
    
    // Update category if provided
    if (updates.category) {
      db.products[productKey].category = updates.category;
    }
    
    // Save changes
    const success = writeDB(db);
    if (success) {
      console.log(`✅ Updated product info: ${productKey}`);
    }
    return success;
  } catch (error) {
    console.error('Error updating product info:', error);
    return false;
  }
};

// Get all products and prices
const getAllProducts = () => {
  const db = readDB();
  return db.products;
};

// Get store information
const getStores = () => {
  const db = readDB();
  return db.stores;
};

// Delete product
const deleteProduct = (productKey) => {
  try {
    const db = readDB();
    
    if (!db.products[productKey]) {
      console.warn(`Product ${productKey} not found`);
      return false;
    }
    
    // Remove from products
    delete db.products[productKey];
    
    // Remove from aliases if any point to this product
    Object.keys(db.aliases).forEach(alias => {
      if (db.aliases[alias] === productKey) {
        delete db.aliases[alias];
      }
    });
    
    // Save changes
    const success = writeDB(db);
    if (success) {
      console.log(`✅ Deleted product: ${productKey}`);
    }
    return success;
  } catch (error) {
    console.error('Error deleting product:', error);
    return false;
  }
};

// Add alias for fuzzy matching
const addAlias = (alias, productName) => {
  const db = readDB();
  db.aliases[alias.toLowerCase()] = productName.toLowerCase();
  return writeDB(db);
};

module.exports = {
  readDB,
  writeDB,
  updateProductPrice,
  updateProductInfo,
  getAllProducts,
  getStores,
  deleteProduct,
  addAlias
};
