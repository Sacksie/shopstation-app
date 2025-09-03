const stringSimilarity = require('string-similarity');
const db = require('../database/kosher-db');
const analytics = require('./analytics');

class EnhancedFuzzyMatcher {
  constructor() {
    // Common kosher brands for extraction
    this.kosherBrands = [
      'kedem', 'bartenura', 'manischewitz', 'osem', 'lieber', 'gefen', 'golden flow',
      'chalav', 'yeo valley', 'mehadrin', 'kedassia', 'beth din', 'ou', 'ok',
      'heinz', 'coca cola', 'pepsi', 'nestle', 'cadbury', 'mars', 'ferrero'
    ];

    // Common quantity words to extract
    this.quantityWords = [
      'large', 'small', 'medium', 'big', 'mini', 'jumbo', 'family', 'individual',
      'fresh', 'frozen', 'organic', 'free range', 'wholemeal', 'white', 'brown',
      '1kg', '500g', '2kg', '1l', '2l', '500ml', '1litre', '2litre', '1lb', '2lb',
      'dozen', 'half dozen', 'pack', 'bottle', 'jar', 'tin', 'can', 'box', 'bag'
    ];

    // Common typo corrections
    this.typoCorrections = {
      'chiken': 'chicken', 'chickn': 'chicken', 'chkn': 'chicken',
      'tomatoe': 'tomato', 'tomatos': 'tomatoes', 'tomattos': 'tomatoes',
      'potaoe': 'potato', 'potatos': 'potatoes', 'potatos': 'potatoes',
      'onyons': 'onions', 'onoin': 'onion', 'onyon': 'onion',
      'chese': 'cheese', 'ches': 'cheese', 'chesse': 'cheese',
      'buttter': 'butter', 'butr': 'butter', 'bttr': 'butter',
      'mlk': 'milk', 'mlik': 'milk',
      'brd': 'bread', 'bred': 'bread',
      'egss': 'eggs', 'egs': 'eggs', 'eg': 'egg',
      'challa': 'challah', 'chalah': 'challah', 'halla': 'challah',
      'grp': 'grape', 'graep': 'grape',
      'bef': 'beef', 'beaf': 'beef',
      'fsh': 'fish', 'fih': 'fish'
    };

    // Plural/singular mappings
    this.pluralMappings = {
      'tomatoes': 'tomato', 'potatoes': 'potato', 'onions': 'onion',
      'eggs': 'egg', 'apples': 'apple', 'bananas': 'banana',
      'carrots': 'carrot', 'peppers': 'pepper'
    };

    // Product categories for context-aware matching
    this.categories = {
      dairy: ['milk', 'cheese', 'butter', 'yogurt', 'cream', 'eggs'],
      meat: ['chicken', 'beef', 'lamb', 'turkey', 'fish', 'salmon'],
      bakery: ['bread', 'challah', 'bagel', 'roll', 'pitta', 'naan'],
      produce: ['apple', 'banana', 'tomato', 'potato', 'onion', 'carrot'],
      pantry: ['rice', 'pasta', 'oil', 'flour', 'sugar', 'salt'],
      beverages: ['milk', 'juice', 'water', 'soda', 'wine', 'beer']
    };

    // Enhanced synonym database (will be auto-populated from analytics)
    this.synonymDatabase = this.loadSynonyms();
  }

  // Load and auto-update synonyms from analytics data
  loadSynonyms() {
    const basesynonyms = {
      'milk': ['mlk', 'milk2pt', 'milk2pint', 'milkpint', '2 pint milk', '1 litre milk', 'fresh milk'],
      'bread': ['brd', 'loaf', 'sliced bread', 'white bread', 'brown bread'],
      'challah': ['challa', 'chalah', 'halla', 'challah bread', 'shabbat bread'],
      'eggs': ['egg', 'egss', 'dozen eggs', 'large eggs', 'medium eggs', 'free range eggs'],
      'chicken': ['chkn', 'chickn', 'whole chicken', 'roasting chicken'],
      'chicken breast': ['chicken breast', 'chkn brst', 'breast', 'chicken breasts'],
      'grape juice': ['grape juice', 'grp juice', 'kedem grape juice', 'red grape juice'],
      'butter': ['bttr', 'butr', 'unsalted butter', 'salted butter'],
      'cheese': ['ches', 'chse', 'cheddar', 'mild cheddar', 'mature cheddar'],
      'beef': ['ground beef', 'mince', 'minced beef', 'beef mince'],
      'wine': ['kiddush wine', 'kidush wine', 'red wine', 'sweet wine'],
      'potatoes': ['potato', 'potatos', 'spuds', 'new potatoes', 'baking potatoes'],
      'tomatoes': ['tomato', 'tomatos', 'cherry tomatoes', 'plum tomatoes'],
      'onions': ['onion', 'onyons', 'white onions', 'red onions'],
      'oil': ['olive oil', 'vegetable oil', 'sunflower oil', 'cooking oil'],
      'rice': ['basmati rice', 'long grain rice', 'jasmine rice', 'white rice'],
      'fish': ['salmon', 'cod', 'fresh fish', 'white fish'],
      'apple': ['apples', 'red apples', 'green apples', 'gala apples'],
      'banana': ['bananas', 'ripe bananas'],
      'yogurt': ['yoghurt', 'greek yogurt', 'natural yogurt']
    };

    // Auto-learn from analytics unmatched items
    try {
      const analyticsData = analytics.readAnalytics();
      const unmatchedItems = {};

      // Collect frequently unmatched items
      analyticsData.searches.forEach(search => {
        if (search.unmatchedItems) {
          search.unmatchedItems.forEach(item => {
            const normalized = this.normalize(item);
            unmatchedItems[normalized] = (unmatchedItems[normalized] || 0) + 1;
          });
        }
      });

      // Auto-add frequently unmatched items as synonyms for similar products
      Object.entries(unmatchedItems).forEach(([item, count]) => {
        if (count >= 2) { // If unmatched 2+ times, try to learn
          this.autoLearnSynonym(item, basesynonyms);
        }
      });
    } catch (error) {
      console.log('Analytics auto-learning skipped:', error.message);
    }

    return basesynonyms;
  }

  // Auto-learn synonyms from unmatched items
  autoLearnSynonym(unmatchedItem, synonyms) {
    const normalized = this.normalize(unmatchedItem);
    
    // Find the most similar existing product
    let bestMatch = null;
    let bestSimilarity = 0;

    Object.keys(synonyms).forEach(product => {
      const similarity = stringSimilarity.compareTwoStrings(normalized, this.normalize(product));
      if (similarity > bestSimilarity && similarity > 0.7) {
        bestSimilarity = similarity;
        bestMatch = product;
      }
    });

    // Add as synonym if we found a good match
    if (bestMatch) {
      if (!synonyms[bestMatch].includes(unmatchedItem.toLowerCase())) {
        synonyms[bestMatch].push(unmatchedItem.toLowerCase());
        console.log(`Auto-learned: "${unmatchedItem}" → "${bestMatch}"`);
      }
    }
  }

  // Enhanced normalize function
  normalize(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Keep spaces for better processing
      .replace(/\s+/g, ' ')         // Normalize spaces
      .trim();
  }

  // Extract and remove brand names
  extractBrand(text) {
    const normalized = this.normalize(text);
    let extractedBrand = null;
    let cleanText = normalized;

    // Check for brand names
    this.kosherBrands.forEach(brand => {
      const brandPattern = new RegExp(`\\b${brand}\\b`, 'gi');
      if (brandPattern.test(normalized)) {
        extractedBrand = brand;
        cleanText = cleanText.replace(brandPattern, '').trim();
      }
    });

    return { brand: extractedBrand, cleanText: cleanText || normalized };
  }

  // Extract and remove quantity/size descriptors
  extractQuantity(text) {
    let cleanText = text;
    let extractedQuantity = null;

    // Extract numeric quantities (2kg, 500g, etc.)
    const numericPattern = /\b(\d+(?:\.\d+)?)\s*(kg|g|l|litre|lb|oz|ml|pint|pt)\b/gi;
    const numericMatch = cleanText.match(numericPattern);
    if (numericMatch) {
      extractedQuantity = numericMatch[0];
      cleanText = cleanText.replace(numericPattern, '').trim();
    }

    // Remove descriptive quantity words
    this.quantityWords.forEach(word => {
      const pattern = new RegExp(`\\b${word}\\b`, 'gi');
      if (pattern.test(cleanText)) {
        cleanText = cleanText.replace(pattern, '').trim();
      }
    });

    return { quantity: extractedQuantity, cleanText: cleanText || text };
  }

  // Fix common typos
  fixTypos(text) {
    let corrected = text.toLowerCase();
    
    // Apply typo corrections
    Object.entries(this.typoCorrections).forEach(([typo, correction]) => {
      const pattern = new RegExp(`\\b${typo}\\b`, 'gi');
      corrected = corrected.replace(pattern, correction);
    });

    return corrected;
  }

  // Handle plural/singular
  handlePlurals(text) {
    const words = text.split(' ');
    const correctedWords = words.map(word => {
      // Check if it's a known plural
      if (this.pluralMappings[word.toLowerCase()]) {
        return this.pluralMappings[word.toLowerCase()];
      }
      return word;
    });
    return correctedWords.join(' ');
  }

  // Get product category
  getCategory(productName) {
    for (const [category, products] of Object.entries(this.categories)) {
      if (products.some(product => 
        productName.includes(product) || product.includes(productName)
      )) {
        return category;
      }
    }
    return 'other';
  }

  // Multi-level matching system
  findBestMatch(query, database = null) {
    if (!database) {
      const dbData = db.readDB();
      database = dbData.products;
      console.log('Available products:', Object.keys(database));
    }

    const originalQuery = query;
    
    // Step 1: Process the query through all enhancement stages
    query = this.normalize(query);
    query = this.fixTypos(query);
    query = this.handlePlurals(query);
    
    const { brand, cleanText: noBrandText } = this.extractBrand(query);
    const { quantity, cleanText: finalCleanText } = this.extractQuantity(noBrandText);
    
    const processedQuery = finalCleanText;

    console.log(`Matching "${originalQuery}" → "${processedQuery}" (brand: ${brand}, qty: ${quantity})`);

    // Step 2: Exact match check
    if (database[processedQuery]) {
      return {
        matched: processedQuery,
        confidence: 1.0,
        method: 'exact',
        brand: brand,
        quantity: quantity
      };
    }
    
    // Also check display names
    for (const [key, product] of Object.entries(database)) {
      if (this.normalize(product.displayName) === processedQuery) {
        return {
          matched: key,
          confidence: 1.0,
          method: 'exact_display',
          brand: brand,
          quantity: quantity
        };
      }
    }

    // Step 3: Synonym database check
    for (const [product, synonyms] of Object.entries(this.synonymDatabase)) {
      if (synonyms.some(synonym => this.normalize(synonym) === processedQuery)) {
        if (database[product]) {
          return {
            matched: product,
            confidence: 0.95,
            method: 'synonym',
            brand: brand,
            quantity: quantity
          };
        }
      }
    }
    
    // Check database product synonyms
    for (const [key, product] of Object.entries(database)) {
      if (product.synonyms) {
        if (product.synonyms.some(synonym => this.normalize(synonym) === processedQuery)) {
          return {
            matched: key,
            confidence: 0.95,
            method: 'db_synonym',
            brand: brand,
            quantity: quantity
          };
        }
      }
    }

    // Step 4: Partial matching within categories
    const queryCategory = this.getCategory(processedQuery);
    const categoryMatches = [];
    
    Object.keys(database).forEach(productName => {
      const productCategory = this.getCategory(productName);
      
      // Boost similarity if same category
      let similarity = stringSimilarity.compareTwoStrings(processedQuery, this.normalize(productName));
      if (queryCategory === productCategory && queryCategory !== 'other') {
        similarity *= 1.2; // 20% boost for same category
      }
      
      // Check partial matches
      const normalizedProduct = this.normalize(productName);
      if (normalizedProduct.includes(processedQuery) || processedQuery.includes(normalizedProduct)) {
        similarity = Math.max(similarity, 0.8); // High score for partial matches
      }
      
      if (similarity > 0.5) {
        categoryMatches.push({
          name: productName,
          similarity: similarity,
          category: productCategory
        });
      }
    });

    // Sort by similarity
    categoryMatches.sort((a, b) => b.similarity - a.similarity);

    // Step 5: Return best match if above threshold
    if (categoryMatches.length > 0) {
      const bestMatch = categoryMatches[0];
      
      // Determine confidence based on similarity and method
      let confidence = bestMatch.similarity;
      if (confidence > 0.9) confidence = 0.9; // Cap fuzzy matches at 90%
      
      return {
        matched: bestMatch.name,
        confidence: confidence,
        method: bestMatch.similarity > 0.8 ? 'partial' : 'fuzzy',
        brand: brand,
        quantity: quantity,
        category: bestMatch.category
      };
    }

    // Step 6: No match found
    return null;
  }

  // Process grocery list with enhanced matching
  matchGroceryList(items) {
    const results = {
      matched: [],
      unmatched: [],
      matchDetails: [] // For analytics and debugging
    };

    const database = db.readDB().products;

    for (const item of items) {
      const matchResult = this.findBestMatch(item, database);
      
      if (matchResult && matchResult.confidence > 0.6) {
        results.matched.push({
          original: item,
          matched: matchResult.matched,
          confidence: matchResult.confidence,
          method: matchResult.method,
          brand: matchResult.brand,
          quantity: matchResult.quantity
        });
        
        results.matchDetails.push({
          query: item,
          result: matchResult,
          success: true
        });
      } else {
        results.unmatched.push(item);
        results.matchDetails.push({
          query: item,
          result: matchResult,
          success: false
        });
      }
    }

    // Log matching performance for analytics
    this.logMatchingPerformance(results);

    return results;
  }

  // Log matching performance for continuous improvement
  logMatchingPerformance(results) {
    try {
      const performance = {
        timestamp: new Date().toISOString(),
        totalItems: results.matched.length + results.unmatched.length,
        matchedItems: results.matched.length,
        matchRate: results.matched.length / (results.matched.length + results.unmatched.length),
        methodBreakdown: {
          exact: results.matched.filter(m => m.method === 'exact').length,
          synonym: results.matched.filter(m => m.method === 'synonym').length,
          partial: results.matched.filter(m => m.method === 'partial').length,
          fuzzy: results.matched.filter(m => m.method === 'fuzzy').length
        },
        averageConfidence: results.matched.reduce((sum, m) => sum + m.confidence, 0) / results.matched.length,
        unmatchedItems: results.unmatched
      };

      // In a production system, this would go to a separate analytics table
      console.log('Match Performance:', JSON.stringify(performance, null, 2));
      
    } catch (error) {
      console.log('Performance logging failed:', error.message);
    }
  }

  // User feedback system for match corrections
  recordUserFeedback(originalQuery, suggestedMatch, userCorrection, wasAccepted) {
    try {
      const feedback = {
        timestamp: new Date().toISOString(),
        originalQuery: originalQuery,
        suggestedMatch: suggestedMatch,
        userCorrection: userCorrection,
        wasAccepted: wasAccepted
      };

      // Log feedback for learning
      console.log('User Feedback:', feedback);

      // If user provided a correction, learn from it
      if (userCorrection && !wasAccepted) {
        this.learnFromCorrection(originalQuery, suggestedMatch, userCorrection);
      }

      return feedback;
    } catch (error) {
      console.error('Failed to record user feedback:', error);
    }
  }

  // Learn from user corrections
  learnFromCorrection(query, wrongMatch, correctMatch) {
    // Add to synonym database
    if (!this.synonymDatabase[correctMatch]) {
      this.synonymDatabase[correctMatch] = [];
    }
    
    const normalizedQuery = this.normalize(query);
    if (!this.synonymDatabase[correctMatch].includes(normalizedQuery)) {
      this.synonymDatabase[correctMatch].push(normalizedQuery);
      console.log(`Learned from user: "${query}" → "${correctMatch}"`);
    }

    // Remove from wrong match if it was there
    if (this.synonymDatabase[wrongMatch]) {
      const index = this.synonymDatabase[wrongMatch].indexOf(normalizedQuery);
      if (index > -1) {
        this.synonymDatabase[wrongMatch].splice(index, 1);
      }
    }
  }
}

// Create singleton instance
const enhancedMatcher = new EnhancedFuzzyMatcher();

module.exports = {
  findBestMatch: (query) => enhancedMatcher.findBestMatch(query),
  matchGroceryList: (items) => enhancedMatcher.matchGroceryList(items),
  recordUserFeedback: (query, suggested, correction, accepted) => 
    enhancedMatcher.recordUserFeedback(query, suggested, correction, accepted),
  normalize: (text) => enhancedMatcher.normalize(text),
  
  // Export the class for testing
  EnhancedFuzzyMatcher
};