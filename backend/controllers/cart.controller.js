const Cart = require("../models/cart.model");

// ADD PRODUCT TO CART
exports.addToCart = async (req, res) => {
  try {
    const cartItem = new Cart(req.body);

    const savedItem = await cartItem.save();

    res.status(201).json(savedItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET CART ITEMS
exports.getCart = async (req, res) => {
  try {
    const cartItems = await Cart.find().populate("productId");

    res.json(cartItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// REMOVE ITEM FROM CART
exports.removeFromCart = async (req, res) => {
  try {
    const deletedItem = await Cart.findByIdAndDelete(req.params.id);

    if (!deletedItem) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    res.json({ message: "Item removed from cart" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
