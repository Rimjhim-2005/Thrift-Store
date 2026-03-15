import axios from "axios";

// Create axios instance with baseURL
const API = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true, // Include cookies in requests
});

// Request interceptor for adding auth headers if needed
API.interceptors.request.use(
  (config) => {
    // Cookies are sent automatically with withCredentials: true
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Extract error message from response
    const message =
      error.response?.data?.message ||
      error.message ||
      "An error occurred";

    return Promise.reject({
      status: error.response?.status,
      message,
      data: error.response?.data,
    });
  }
);

// ============= AUTH ENDPOINTS =============
export const authAPI = {
  register: (email, password) =>
    API.post("/auth/register", { email, password }),
  login: (email, password) =>
    API.post("/auth/login", { email, password }),
};

// ============= PRODUCT ENDPOINTS =============
export const productAPI = {
  getAllProducts: () =>
    API.get("/products"),
  getProductById: (id) =>
    API.get(`/products/${id}`),
  createProduct: (formData) =>
    API.post("/products/add", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteProduct: (id) =>
    API.delete(`/products/${id}`),
};

// ============= SEARCH ENDPOINTS =============
export const searchAPI = {
  searchByText: (query) =>
    API.get(`/search`, { params: { q: query } }),
  searchByImage: (formData) =>
    API.post("/search/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

// ============= CART ENDPOINTS =============
export const cartAPI = {
  getCart: () =>
    API.get("/cart"),
  addToCart: (productId, quantity = 1) =>
    API.post("/cart/add", { productId, quantity }),
  removeFromCart: (cartItemId) =>
    API.delete(`/cart/remove/${cartItemId}`),
  updateCart: (cartItemId, quantity) =>
    API.put(`/cart/update/${cartItemId}`, { quantity }),
};

export default API;
