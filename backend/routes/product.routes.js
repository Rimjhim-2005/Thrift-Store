const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload.middleware");

const {
  createProduct,
  getAllProducts,
  getProductById,
  deleteProduct,
} = require("../controllers/product.controller");

// Upload product with image
router.post("/upload", upload.single("image"), createProduct);

// Get all products
router.get("/", getAllProducts);

// Get single product
router.get("/:id", getProductById);

// Delete product
router.delete("/:id", deleteProduct);

module.exports = router;
