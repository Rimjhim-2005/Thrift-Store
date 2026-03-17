const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Item = require("../models/Item");
const Seller = require("../models/Seller");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer config for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error("Only image files are allowed."));
  },
});

// Auth middleware — must be logged in as an approved seller
function requireApprovedSeller(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Please log in first." });
  }
  if (req.session.role !== "seller") {
    return res.status(403).json({ message: "Only sellers can manage items." });
  }
  next();
}

// ── POST /api/items ────────────────────────────────────────
// Seller lists a new item
router.post("/", requireApprovedSeller, upload.array("images", 5), async (req, res) => {
  try {
    const seller = await Seller.findOne({ userId: req.session.userId });
    if (!seller) {
      return res.status(404).json({ message: "Seller profile not found." });
    }
    if (!seller.isApproved) {
      return res.status(403).json({ message: "Your shop must be approved before listing items." });
    }

    const { name, description, price, category, condition, stock } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: "Item name and price are required." });
    }

    const images = req.files ? req.files.map((f) => `/uploads/${f.filename}`) : [];

    const item = new Item({
      sellerId: seller._id,
      name,
      description: description || "",
      price: Number(price),
      category: category || "",
      condition: condition || "Good",
      images,
      stock: stock ? Number(stock) : 1,
    });

    await item.save();

    return res.status(201).json({ message: "Item listed successfully!", item });
  } catch (err) {
    console.error("Add item error:", err);
    return res.status(500).json({ message: "Failed to list item. Please try again." });
  }
});

// ── GET /api/items/my ──────────────────────────────────────
// Returns items for the logged-in seller
router.get("/my", requireApprovedSeller, async (req, res) => {
  try {
    const seller = await Seller.findOne({ userId: req.session.userId });
    if (!seller) return res.status(404).json({ message: "Seller not found." });

    const items = await Item.find({ sellerId: seller._id }).sort({ createdAt: -1 });
    return res.status(200).json({ items });
  } catch (err) {
    return res.status(500).json({ message: "Server error." });
  }
});

// ── DELETE /api/items/:id ──────────────────────────────────
router.delete("/:id", requireApprovedSeller, async (req, res) => {
  try {
    const seller = await Seller.findOne({ userId: req.session.userId });
    if (!seller) return res.status(404).json({ message: "Seller not found." });

    const item = await Item.findOneAndDelete({ _id: req.params.id, sellerId: seller._id });
    if (!item) return res.status(404).json({ message: "Item not found." });

    return res.status(200).json({ message: "Item deleted." });
  } catch (err) {
    return res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
