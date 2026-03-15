# Thriftly - Technical Reference & Code Changes

**Purpose:** Detailed explanation of every code change, why it was made, and how it works  
**Audience:** Developers, Technical Leads

---

## Table of Contents
1. [State Management Architecture](#state-management-architecture)
2. [API Layer Design](#api-layer-design)
3. [Component Changes Breakdown](#component-changes-breakdown)
4. [Data Flow Diagrams](#data-flow-diagrams)
5. [Code Examples](#code-examples)
6. [Error Handling](#error-handling)
7. [Performance Considerations](#performance-considerations)

---

## State Management Architecture

### Why Zustand Over Context API?

**Before (Context API):**
```javascript
// Props drilling through 5+ levels
<App cart={cart} setCart={setCart}>
  <Navbar cart={cart} />
  <Main cart={cart} setCart={setCart}>
    <ShopDetail cart={cart} setCart={setCart} />
    <ProductDetail cart={cart} setCart={setCart} />
  </Main>
</App>
```

**After (Zustand):**
```javascript
// Any component can access cart directly
const { cart, addToCart } = useAppStore();
```

**Reasons for Zustand:**
1. **Zero Boilerplate** - No Provider setup needed
2. **Performance** - Selective re-renders only affected components
3. **Developer Experience** - Simple hooks-based API
4. **Persistence** - Built-in localStorage support
5. **Bundle Size** - Ultra-lightweight (2KB min+gzip)

### Store Implementation

**File:** `src/store/useAppStore.js`

```javascript
import create from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(
  persist(
    (set, get) => ({
      // State
      cart: [],
      products: [],
      shops: [],
      filters: {
        priceMin: 0,
        priceMax: 1000,
        condition: 'all'
      },

      // Cart Actions
      addToCart: (productId, quantity) => set((state) => {
        const existing = state.cart.find(item => item.id === productId);
        if (existing) {
          return {
            cart: state.cart.map(item =>
              item.id === productId
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          };
        }
        return {
          cart: [...state.cart, { id: productId, quantity }]
        };
      }),

      removeFromCart: (productId) => set((state) => ({
        cart: state.cart.filter(item => item.id !== productId)
      })),

      updateQuantity: (productId, quantity) => set((state) => ({
        cart: state.cart.map(item =>
          item.id === productId ? { ...item, quantity } : item
        )
      })),

      // State setters
      setProducts: (products) => set({ products }),
      setShops: (shops) => set({ shops }),
      setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters }
      }))
    }),
    {
      name: 'thriftly-store', // localStorage key
      partialize: (state) => ({ cart: state.cart }) // Only persist cart
    }
  )
);
```

**Key Features:**
- **Selective Persistence** - Only cart is persisted (not all state)
- **Immer Middleware** - Automatic by Zustand for immutable updates
- **TypeScript Ready** - Easy to add types later

---

## API Layer Design

### Architecture Rationale

**Old Approach (Direct API calls in components):**
```javascript
// BrowseShops.jsx
const [shops, setShops] = useState([]);
useEffect(() => {
  fetch('http://localhost:5000/api/shops')
    .then(r => r.json())
    .then(data => setShops(data));
}, []);

// ShopDetail.jsx
const [products, setProducts] = useState([]);
useEffect(() => {
  fetch(`http://localhost:5000/api/products?shopId=${shopId}`)
    .then(r => r.json())
    .then(data => setProducts(data));
}, [shopId]);
// ^ Repetitive, error-prone, hard to maintain
```

**New Approach (Centralized API client):**
```javascript
// src/api/apiClient.js - Single source of truth
export const api = {
  shops: {
    getAll: () => fetch('/api/shops').then(r => r.json()),
    getOne: (id) => fetch(`/api/shops/${id}`).then(r => r.json()),
  },
  products: {
    getAll: (params) => fetch(`/api/products?${new URLSearchParams(params)}`).then(r => r.json()),
    getOne: (id) => fetch(`/api/products/${id}`).then(r => r.json()),
  }
};

// Component usage - cleaner, consistent
const shops = await api.shops.getAll();
```

### API Client Implementation

**File:** `src/api/apiClient.js`

```javascript
const BASE_URL = 'http://localhost:5000/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API Error');
  }
  return response.json();
};

export const api = {
  // Shops endpoints
  shops: {
    getAll: async () => {
      const response = await fetch(`${BASE_URL}/shops`);
      return handleResponse(response);
    },
    
    getOne: async (shopId) => {
      const response = await fetch(`${BASE_URL}/shops/${shopId}`);
      return handleResponse(response);
    }
  },

  // Products endpoints
  products: {
    getAll: async (params = {}) => {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${BASE_URL}/products?${queryString}`);
      return handleResponse(response);
    },
    
    getOne: async (productId) => {
      const response = await fetch(`${BASE_URL}/products/${productId}`);
      return handleResponse(response);
    }
  },

  // Search endpoints
  search: {
    query: async (searchTerm, filters = {}) => {
      const params = { query: searchTerm, ...filters };
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${BASE_URL}/search?${queryString}`);
      return handleResponse(response);
    }
  },

  // Cart endpoints
  cart: {
    getCart: async () => {
      const response = await fetch(`${BASE_URL}/cart`);
      return handleResponse(response);
    },
    
    addItem: async (productId, quantity) => {
      const response = await fetch(`${BASE_URL}/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity })
      });
      return handleResponse(response);
    },
    
    removeItem: async (productId) => {
      const response = await fetch(`${BASE_URL}/cart/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      });
      return handleResponse(response);
    }
  }
};
```

**Benefits:**
1. **Centralized Configuration** - Change BASE_URL once
2. **Consistent Error Handling** - All errors handled uniformly
3. **Easy to Test** - Mock API easily in tests
4. **Easy to Debug** - Add logging in one place
5. **Future-proof** - Switch to axios without changing components

---

## Component Changes Breakdown

### 1. BrowseShops.jsx

**What Changed:**
```javascript
// BEFORE: Static data
const shops = [
  { id: 1, name: "Shop 1", ... },
  { id: 2, name: "Shop 2", ... }
];

// AFTER: API-driven
const [shops, setShops] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchShops = async () => {
    try {
      const data = await api.shops.getAll();
      setShops(data.data);
    } catch (error) {
      console.error('Failed to fetch shops:', error);
    } finally {
      setLoading(false);
    }
  };
  fetchShops();
}, []);
```

**Why:**
- Brings real data from backend
- Supports dynamic shop creation
- Data persists in database

**Impact:**
- Shop list always up-to-date
- Real inventory management possible

---

### 2. ShopDetail.jsx

**What Changed:**
```javascript
// BEFORE: All products shown regardless of shop
const allProducts = [...];

// AFTER: Filtered by shop
useEffect(() => {
  const fetchProducts = async () => {
    const data = await api.products.getAll({ shopId });
    setProducts(data.data);
  };
  fetchProducts();
}, [shopId]);
```

**Why:**
- Shows only products from selected shop
- Improves user experience
- Reduces data payload

**Data Flow:**
```
User clicks shop → ShopDetail loads → Fetches products by shopId → Displays filtered list
```

---

### 3. ProductDetail.jsx - Major Rewrite

**Before (Static):**
```javascript
const ProductDetail = () => {
  return (
    <div>
      <img src="static-image.jpg" />
      <h1>Static Product Name</h1>
      <p>Static Description</p>
    </div>
  );
};
```

**After (Dynamic with Real Data):**
```javascript
const ProductDetail = ({ productId }) => {
  const { addToCart } = useAppStore();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await api.products.getOne(productId);
        setProduct(data.data);
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const handleAddToCart = (quantity) => {
    addToCart(productId, quantity);
    // Show success message
  };

  if (loading) return <div>Loading...</div>;
  if (!product) return <div>Product not found</div>;

  return (
    <div>
      {/* Dynamic product content */}
      <ProductImages images={product.images} />
      <ProductInfo product={product} />
      <CartSection 
        product={product} 
        onAddToCart={handleAddToCart}
      />
    </div>
  );
};
```

**Key Features Added:**
- Real product data from backend
- Stock validation
- Condition rating display
- Image gallery
- Dynamic pricing
- Real-time cart integration

---

### 4. CartPage.jsx

**What Changed:**
```javascript
// BEFORE: Component state only
const [cart, setCart] = useState([]);

// AFTER: Global store + backend sync
const { cart, removeFromCart, updateQuantity } = useAppStore();

useEffect(() => {
  // Sync with backend
  const syncCart = async () => {
    const data = await api.cart.getCart();
    // Update store with backend data
  };
  syncCart();
}, []);
```

**Why:**
- Cart persists across page navigation
- Data synced with backend
- Other sessions see updates

**Features:**
- Remove items
- Update quantities
- Calculate totals
- Persistent storage

---

### 5. SearchPage.jsx

**What Changed:**
```javascript
// BEFORE: No actual search
const results = [];

// AFTER: Real search with filters
const [searchTerm, setSearchTerm] = useState('');
const [results, setResults] = useState([]);

const performSearch = async (term) => {
  try {
    const data = await api.search.query(term, {
      priceMin,
      priceMax,
      condition,
      sortBy
    });
    setResults(data.data);
  } catch (error) {
    console.error('Search failed:', error);
  }
};

useEffect(() => {
  if (searchTerm.trim()) {
    performSearch(searchTerm);
  } else {
    setResults([]);
  }
}, [searchTerm, priceMin, priceMax, condition]);
```

**Search Features:**
- Real-time search as user types
- Multiple filters (price, condition)
- Sorting options
- Pagination
- Result counts

---

## Data Flow Diagrams

### Complete User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER JOURNEY                              │
└─────────────────────────────────────────────────────────────────┘

1. BROWSE SHOPS
   User → Homepage → BrowseShops.jsx
   ↓
   Fetch: GET /api/shops → MongoDB
   ↓
   Display shop grid → User chooses shop

2. VIEW SHOP PRODUCTS
   User clicks shop → ShopDetail.jsx
   ↓
   Fetch: GET /api/products?shopId={id} → MongoDB
   ↓
   Display products grid → User selects product

3. VIEW PRODUCT DETAILS
   User clicks product → ProductDetail.jsx
   ↓
   Fetch: GET /api/products/{id} → MongoDB
   ↓
   Display full product info
   ↓
   User selects quantity → Click "Add to Cart"

4. ADD TO CART
   ProductDetail.jsx → useAppStore().addToCart()
   ↓
   Store updated (in memory) → localStorage updated
   ↓
   Zustand triggers re-render → Cart icon updates
   ↓
   Success notification shown

5. VIEW CART
   User clicks cart icon → CartPage.jsx
   ↓
   Zustand provides cart data (from localStorage)
   ↓
   Display cart items with totals
   ↓
   User can update quantities or remove items

6. SEARCH
   User enters search term → SearchPage.jsx
   ↓
   Debounced: Fetch: GET /api/search?query={term}
   ↓
   Display search results → User applies filters
   ↓
   Can add results to cart
```

### State Management Flow

```
┌──────────────────────────────────────────────────┐
│           ZUSTAND STORE ARCHITECTURE             │
└──────────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│        Component A (ProductDetail)           │
└────────────────┬────────────────────────────┘
                 │
                 │ useAppStore()
                 │ - Reads: products
                 │ - Calls: addToCart()
                 │
      ┌──────────▼──────────┐
      │                     │
      │   ZUSTAND STORE     │  ◄──── set/get state
      │                     │
      │ - cart: []          │
      │ - products: []      │
      │ - shops: []         │
      │ - filters: {}       │
      │                     │
      └──────────┬──────────┘
                 │
                 │ persist
                 │
      ┌──────────▼──────────┐
      │                     │
      │  localStorage       │
      │  "thriftly-store"   │
      │                     │
      └─────────────────────┘

┌─────────────────────────────────────────────┐
│        Component B (CartPage)               │
└────────────────┬────────────────────────────┘
                 │
                 │ useAppStore()
                 │ - Reads: cart
                 │ - Calls: removeFromCart()
                 │        : updateQuantity()
                 │
                 ▼ (same store shared)
```

### API Integration Flow

```
┌───────────────────────────────────────────────────┐
│         API CALL FLOW DIAGRAM                     │
└───────────────────────────────────────────────────┘

Component (SearchPage.jsx)
        ↓
        │ import { api } from "@/api/apiClient"
        ↓
    api.search.query(term, filters)
        ↓
    src/api/apiClient.js
        ├─ Build URL: /api/search?query=...
        ├─ fetch(url)
        ├─ Error handling
        └─ handleResponse()
        ↓
    Express Server (5000)
        ├─ backend/routes/search.routes.js
        ├─ search.controller.js
        ├─ Query MongoDB
        └─ Return JSON
        ↓
    Response with data
        ↓
    Component updates UI
        ↓
    Zustand store may update
        ↓
    Component re-renders
```

---

## Code Examples

### Adding a New Feature: Favorites

**Step 1: Update Zustand Store**
```javascript
// src/store/useAppStore.js
export const useAppStore = create(
  persist(
    (set) => ({
      // ... existing state
      favorites: [],
      
      addFavorite: (productId) => set((state) => ({
        favorites: [...state.favorites, productId]
      })),
      
      removeFavorite: (productId) => set((state) => ({
        favorites: state.favorites.filter(id => id !== productId)
      }))
    }),
    {
      name: 'thriftly-store',
      partialize: (state) => ({ 
        cart: state.cart,
        favorites: state.favorites // Also persist favorites
      })
    }
  )
);
```

**Step 2: Add API Endpoint**
```javascript
// src/api/apiClient.js
export const api = {
  // ... existing APIs
  favorites: {
    add: async (productId) => {
      const response = await fetch(`${BASE_URL}/favorites/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      });
      return handleResponse(response);
    },
    
    remove: async (productId) => {
      const response = await fetch(`${BASE_URL}/favorites/remove`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      });
      return handleResponse(response);
    }
  }
};
```

**Step 3: Use in Component**
```javascript
// ProductDetail.jsx
const { favorites, addFavorite, removeFavorite } = useAppStore();
const isFavorited = favorites.includes(productId);

const handleFavorite = () => {
  if (isFavorited) {
    removeFavorite(productId);
  } else {
    addFavorite(productId);
  }
};

return (
  <button 
    onClick={handleFavorite}
    style={{ color: isFavorited ? 'red' : 'gray' }}
  >
    ♥ {isFavorited ? 'Favorited' : 'Add to Favorites'}
  </button>
);
```

---

## Error Handling

### Error Handling Strategy

```javascript
// API Layer Error Handling
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
};

// Component Error Handling
const fetchData = async () => {
  try {
    setLoading(true);
    const data = await api.shops.getAll();
    setShops(data.data);
    setError(null); // Clear errors on success
  } catch (error) {
    setError(error.message);
    console.error('Failed to fetch shops:', error);
    // Could also: notify user via toast/modal
  } finally {
    setLoading(false);
  }
};
```

### Common Errors & Solutions

**Error: Network Timeout**
```javascript
// Add timeout
const fetchWithTimeout = (url, options = {}, timeout = 5000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeout)
    )
  ]);
};
```

**Error: Duplicate API Calls**
```javascript
// Use AbortController
useEffect(() => {
  const controller = new AbortController();
  
  const fetchData = async () => {
    try {
      const response = await fetch(url, {
        signal: controller.signal
      });
      // ...
    } catch (error) {
      if (error.name !== 'AbortError') {
        // Handle error only if not aborted
        setError(error);
      }
    }
  };
  
  fetchData();
  
  return () => controller.abort(); // Cleanup
}, []);
```

---

## Performance Considerations

### 1. Re-render Optimization

**Problem: All components re-render on store change**
```javascript
// BEFORE: All consumers re-render
const Component = () => {
  const store = useAppStore(); // ← Returns all state
  return <div>{store.cart.length}</div>;
}; // Re-renders even if cart didn't change!
```

**Solution: Selective state**
```javascript
// AFTER: Only re-render if cart changes
const Component = () => {
  const cartLength = useAppStore((state) => state.cart.length);
  return <div>{cartLength}</div>;
}; // Re-renders only when cart.length changes
```

### 2. API Call Optimization

**Debouncing Search:**
```javascript
const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

const debouncedSearch = debounce((term) => {
  performSearch(term);
}, 300); // Wait 300ms after user stops typing
```

**Request Caching:**
```javascript
const cache = new Map();

export const api = {
  shops: {
    getAll: async () => {
      if (cache.has('shops')) {
        return cache.get('shops');
      }
      
      const response = await fetch(`${BASE_URL}/shops`);
      const data = await handleResponse(response);
      cache.set('shops', data);
      return data;
    }
  }
};
```

### 3. Bundle Size Impact

**Library Sizes:**
- zustand: ~2KB (min+gzip)
- axios: ~13KB (min+gzip)
- Minimal impact on total bundle

**Reducing Bundle:**
- Tree-shaking unused APIs
- Using direct fetch instead of axios when possible
- Code splitting by route

---

## Testing Recommendations

### Unit Tests

```javascript
// useAppStore.test.js
import { useAppStore } from '@/store/useAppStore';

describe('useAppStore', () => {
  it('should add item to cart', () => {
    const { getState } = useAppStore();
    const store = getState();
    
    store.addToCart(1, 2);
    expect(store.cart).toHaveLength(1);
    expect(store.cart[0]).toEqual({ id: 1, quantity: 2 });
  });
});
```

### Integration Tests

```javascript
// api.test.js
describe('API Client', () => {
  it('should fetch shops', async () => {
    const response = await api.shops.getAll();
    expect(response.success).toBe(true);
    expect(Array.isArray(response.data)).toBe(true);
  });
});
```

### Component Tests

```javascript
// ProductDetail.test.jsx
import { render, screen, waitFor } from '@testing-library/react';
import ProductDetail from '@/components/ProductDetail';

describe('ProductDetail', () => {
  it('should display product info', async () => {
    render(<ProductDetail productId={1} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Product Name/i)).toBeInTheDocument();
    });
  });
});
```

---

## Deployment Checklist

- [ ] Remove console.logs from production code
- [ ] Update API_URL for production environment
- [ ] Enable CORS only for trusted domains
- [ ] Set up environment variables on server
- [ ] Enable MongoDB connection pooling
- [ ] Add rate limiting to API endpoints
- [ ] Implement request logging
- [ ] Set up error monitoring (Sentry)
- [ ] Add response compression
- [ ] Enable HTTPS only in production

---

**Document Version:** 1.0  
**Last Updated:** March 15, 2026  
**Maintainer:** Development Team

