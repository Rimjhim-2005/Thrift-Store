const express = require("express");
const router = express.Router();
const Item = require("../models/Item");
const Seller = require("../models/Seller");

// Utility: Create fuzzy regex pattern for typo tolerance
// e.g., "jea" will match "jeans", "jeaans", "jeens", etc.
function createFuzzyPattern(query) {
  const chars = query.split("");
  // Allow up to 1 character difference between each character
  // This handles: missing chars, extra chars, swapped adjacent chars
  const pattern = chars.map((c, i) => {
    const escaped = c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Each position can match the char, or be optional (for missing), or have extra char
    return `(?:${escaped}.)?${escaped}?`;
  }).join("");
  return new RegExp(pattern, "i");
}

// Utility: Calculate Levenshtein distance for fuzzy matching
function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// Utility: Check if strings are similar within threshold
function isFuzzyMatch(str, query, threshold = 2) {
  if (!str || !query) return false;
  const normalizedStr = str.toLowerCase();
  const normalizedQuery = query.toLowerCase();
  
  // Exact match
  if (normalizedStr.includes(normalizedQuery)) return true;
  
  // Check each word in the string
  const words = normalizedStr.split(/\s+/);
  for (const word of words) {
    // Allow for small typos based on word length
    const maxDistance = Math.min(threshold, Math.floor(word.length / 3) + 1);
    if (levenshteinDistance(word, normalizedQuery) <= maxDistance) {
      return true;
    }
    // Check if query is a substring with some tolerance
    if (word.length >= normalizedQuery.length) {
      for (let i = 0; i <= word.length - normalizedQuery.length; i++) {
        const substring = word.substr(i, normalizedQuery.length);
        if (levenshteinDistance(substring, normalizedQuery) <= 1) {
          return true;
        }
      }
    }
  }
  return false;
}

// Utility: Score an item based on search relevance
function scoreItem(item, query) {
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  
  const queryWords = q.split(/\s+/).filter(w => w.length > 0);
  let totalScore = 0;
  
  for (const word of queryWords) {
    let wordScore = 0;
    
    // Name matches (highest priority)
    if (item.name) {
      const name = item.name.toLowerCase();
      if (name === word) wordScore += 100;
      else if (name.startsWith(word)) wordScore += 80;
      else if (name.includes(word)) wordScore += 60;
      else if (isFuzzyMatch(item.name, word)) wordScore += 40;
    }
    
    // Category matches
    if (item.category) {
      const category = item.category.toLowerCase();
      if (category === word) wordScore += 70;
      else if (category.includes(word)) wordScore += 50;
      else if (isFuzzyMatch(item.category, word)) wordScore += 30;
    }
    
    // Description matches
    if (item.description) {
      const desc = item.description.toLowerCase();
      if (desc.includes(word)) wordScore += 30;
      else if (isFuzzyMatch(item.description, word)) wordScore += 15;
    }
    
    // Condition matches
    if (item.condition) {
      const condition = item.condition.toLowerCase();
      if (condition === word || condition.includes(word)) wordScore += 25;
    }
    
    totalScore += wordScore;
  }
  
  // Bonus for matching all words
  if (queryWords.length > 1) {
    const name = (item.name || "").toLowerCase();
    const allWordsMatch = queryWords.every(w => 
      name.includes(w) || isFuzzyMatch(item.name, w)
    );
    if (allWordsMatch) totalScore += 20;
  }
  
  return totalScore;
}

// GET /api/search?q=keyword&category=category&sort=sort
// Search items with fuzzy matching and typo tolerance
router.get("/", async (req, res) => {
  try {
    const { q, category, sort = "relevance" } = req.query;
    
    if (!q || q.trim().length === 0) {
      // Return all items if no query, optionally filtered by category
      let filter = {};
      if (category && category !== "All") {
        filter.category = category;
      }
      const items = await Item.find(filter)
        .populate("sellerId", "shopName")
        .sort({ viewCount: -1 })
        .limit(200);
      return res.status(200).json({ 
        items, 
        count: items.length,
        query: "",
        fuzzy: false 
      });
    }
    
    const query = q.trim();
    
    // First, try exact and fuzzy matches on name, description, category
    const allItems = await Item.find({})
      .populate("sellerId", "shopName")
      .lean();
    
    // Score and filter items
    let scoredItems = allItems.map(item => ({
      ...item,
      _score: scoreItem(item, query),
      _matched: scoreItem(item, query) > 0
    })).filter(item => item._matched);
    
    // Apply category filter if specified
    if (category && category !== "All") {
      scoredItems = scoredItems.filter(item => item.category === category);
    }
    
    // Sort based on sort parameter
    if (sort === "price-asc") {
      scoredItems.sort((a, b) => a.price - b.price);
    } else if (sort === "price-desc") {
      scoredItems.sort((a, b) => b.price - a.price);
    } else {
      // Default: relevance (score-based)
      scoredItems.sort((a, b) => b._score - a._score);
    }
    
    // If we have very few results, try broader fuzzy matching
    if (scoredItems.length < 3) {
      const broaderMatches = allItems
        .filter(item => !scoredItems.find(s => s._id.toString() === item._id.toString()))
        .map(item => ({
          ...item,
          _score: scoreItem(item, query) * 0.5, // Lower score for broader matches
          _matched: isFuzzyMatch(item.name, query, 3) || 
                    isFuzzyMatch(item.description, query, 3) ||
                    isFuzzyMatch(item.category, query, 3),
          _fuzzy: true
        }))
        .filter(item => item._matched);
      
      scoredItems = [...scoredItems, ...broaderMatches];
      scoredItems.sort((a, b) => b._score - a._score);
    }
    
    // Remove internal scoring fields before returning
    const results = scoredItems.map(({ _score, _matched, _fuzzy, ...item }) => ({
      ...item,
      _fuzzy: _fuzzy || false // Keep fuzzy flag to indicate typo match
    }));
    
    return res.status(200).json({
      items: results,
      count: results.length,
      query,
      fuzzy: results.some(r => r._fuzzy)
    });
    
  } catch (err) {
    console.error("Search error:", err);
    return res.status(500).json({ message: "Search failed. Please try again." });
  }
});

// GET /api/search/suggestions?q=keyword
// Get search suggestions as user types
router.get("/suggestions", async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(200).json({ suggestions: [] });
    }
    
    const query = q.trim().toLowerCase();
    
    // Get matching item names
    const items = await Item.find({})
      .select("name category")
      .limit(100);
    
    const suggestions = new Set();
    
    for (const item of items) {
      const name = (item.name || "").toLowerCase();
      const category = (item.category || "").toLowerCase();
      
      // Add name if it matches
      if (name.includes(query) || isFuzzyMatch(item.name, query)) {
        suggestions.add(item.name);
      }
      
      // Add category if it matches
      if (category.includes(query) || isFuzzyMatch(item.category, query)) {
        suggestions.add(item.category);
      }
    }
    
    return res.status(200).json({ 
      suggestions: Array.from(suggestions).slice(0, 10),
      query 
    });
    
  } catch (err) {
    console.error("Suggestions error:", err);
    return res.status(500).json({ suggestions: [] });
  }
});

module.exports = router;
