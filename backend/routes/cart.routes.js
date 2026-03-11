const express = require("express");
const router = express.Router();

const {
  addToCart,
  getCart,
  removeFromCart,
} = require("../controllers/cart.controller");

// Add product to cart
router.post("/", addToCart);

// Get cart items
router.get("/", getCart);

// Remove item from cart
router.delete("/:id", removeFromCart);

module.exports = router;
