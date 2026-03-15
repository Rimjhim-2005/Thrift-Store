import { create } from "zustand";
import { authAPI, productAPI, searchAPI, cartAPI } from "../services/api";

const useAppStore = create((set, get) => ({
  // ============= AUTH STATE =============
  auth: {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  },

  // ============= PRODUCTS STATE =============
  products: {
    items: [],
    isLoading: false,
    error: null,
  },

  // ============= CART STATE =============
  cart: {
    items: [],
    isLoading: false,
    error: null,
  },

  // ============= SEARCH STATE =============
  search: {
    results: [],
    isLoading: false,
    error: null,
  },

  // ============= AUTH ACTIONS =============
  registerUser: async (email, password, shopDetails = {}) => {
    set((state) => ({
      auth: { ...state.auth, isLoading: true, error: null },
    }));
    try {
      const response = await authAPI.register(email, password);

      set((state) => ({
        auth: {
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        },
      }));

      return { success: true, data: response.data };
    } catch (error) {
      set((state) => ({
        auth: {
          ...state.auth,
          isLoading: false,
          error: error.message,
        },
      }));
      return { success: false, error: error.message };
    }
  },

  loginUser: async (email, password) => {
    set((state) => ({
      auth: { ...state.auth, isLoading: true, error: null },
    }));
    try {
      const response = await authAPI.login(email, password);

      set((state) => ({
        auth: {
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        },
      }));

      return { success: true, data: response.data };
    } catch (error) {
      set((state) => ({
        auth: {
          ...state.auth,
          isLoading: false,
          error: error.message,
        },
      }));
      return { success: false, error: error.message };
    }
  },

  logoutUser: () => {
    set((state) => ({
      auth: {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      },
      cart: { items: [], isLoading: false, error: null },
    }));
  },

  // ============= PRODUCT ACTIONS =============
  fetchAllProducts: async () => {
    set((state) => ({
      products: { ...state.products, isLoading: true, error: null },
    }));
    try {
      const response = await productAPI.getAllProducts();

      set((state) => ({
        products: {
          items: response.data,
          isLoading: false,
          error: null,
        },
      }));

      return { success: true, data: response.data };
    } catch (error) {
      set((state) => ({
        products: {
          ...state.products,
          isLoading: false,
          error: error.message,
        },
      }));
      return { success: false, error: error.message };
    }
  },

  fetchProductById: async (id) => {
    try {
      const response = await productAPI.getProductById(id);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  createProduct: async (formData) => {
    set((state) => ({
      products: { ...state.products, isLoading: true, error: null },
    }));
    try {
      const response = await productAPI.createProduct(formData);

      // Add newly created product to products list
      set((state) => ({
        products: {
          items: [...state.products.items, response.data],
          isLoading: false,
          error: null,
        },
      }));

      return { success: true, data: response.data };
    } catch (error) {
      set((state) => ({
        products: {
          ...state.products,
          isLoading: false,
          error: error.message,
        },
      }));
      return { success: false, error: error.message };
    }
  },

  deleteProduct: async (id) => {
    try {
      await productAPI.deleteProduct(id);

      // Remove deleted product from state
      set((state) => ({
        products: {
          ...state.products,
          items: state.products.items.filter((p) => p._id !== id),
        },
      }));

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // ============= SEARCH ACTIONS =============
  searchByText: async (query) => {
    set((state) => ({
      search: { ...state.search, isLoading: true, error: null },
    }));
    try {
      const response = await searchAPI.searchByText(query);

      set((state) => ({
        search: {
          results: response.data,
          isLoading: false,
          error: null,
        },
      }));

      return { success: true, data: response.data };
    } catch (error) {
      set((state) => ({
        search: {
          ...state.search,
          isLoading: false,
          error: error.message,
        },
      }));
      return { success: false, error: error.message };
    }
  },

  searchByImage: async (formData) => {
    set((state) => ({
      search: { ...state.search, isLoading: true, error: null },
    }));
    try {
      const response = await searchAPI.searchByImage(formData);

      set((state) => ({
        search: {
          results: response.data,
          isLoading: false,
          error: null,
        },
      }));

      return { success: true, data: response.data };
    } catch (error) {
      set((state) => ({
        search: {
          ...state.search,
          isLoading: false,
          error: error.message,
        },
      }));
      return { success: false, error: error.message };
    }
  },

  // ============= CART ACTIONS =============
  fetchCart: async () => {
    set((state) => ({
      cart: { ...state.cart, isLoading: true, error: null },
    }));
    try {
      const response = await cartAPI.getCart();

      set((state) => ({
        cart: {
          items: response.data,
          isLoading: false,
          error: null,
        },
      }));

      return { success: true, data: response.data };
    } catch (error) {
      set((state) => ({
        cart: {
          ...state.cart,
          isLoading: false,
          error: error.message,
        },
      }));
      return { success: false, error: error.message };
    }
  },

  addToCart: async (productId, quantity = 1) => {
    set((state) => ({
      cart: { ...state.cart, isLoading: true, error: null },
    }));
    try {
      const response = await cartAPI.addToCart(productId, quantity);

      // Add item to cart
      set((state) => ({
        cart: {
          items: [...state.cart.items, response.data],
          isLoading: false,
          error: null,
        },
      }));

      return { success: true, data: response.data };
    } catch (error) {
      set((state) => ({
        cart: {
          ...state.cart,
          isLoading: false,
          error: error.message,
        },
      }));
      return { success: false, error: error.message };
    }
  },

  removeFromCart: async (cartItemId) => {
    set((state) => ({
      cart: { ...state.cart, isLoading: true, error: null },
    }));
    try {
      await cartAPI.removeFromCart(cartItemId);

      // Remove item from cart
      set((state) => ({
        cart: {
          items: state.cart.items.filter((item) => item._id !== cartItemId),
          isLoading: false,
          error: null,
        },
      }));

      return { success: true };
    } catch (error) {
      set((state) => ({
        cart: {
          ...state.cart,
          isLoading: false,
          error: error.message,
        },
      }));
      return { success: false, error: error.message };
    }
  },

  updateCartQuantity: async (cartItemId, quantity) => {
    try {
      const response = await cartAPI.updateCart(cartItemId, quantity);

      // Update quantity in cart
      set((state) => ({
        cart: {
          ...state.cart,
          items: state.cart.items.map((item) =>
            item._id === cartItemId ? { ...item, quantity } : item
          ),
        },
      }));

      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // ============= UTILITY ACTIONS =============
  clearError: (errorType = "auth") => {
    set((state) => ({
      [errorType]: { ...state[errorType], error: null },
    }));
  },
}));

export default useAppStore;
