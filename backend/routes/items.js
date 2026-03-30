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

// Auth middleware — must be logged in as a seller
function requireApprovedSeller(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Please log in first." });
  }
  if (req.session.role !== "seller") {
    return res.status(403).json({ message: "Only sellers can manage items." });
  }
  next();
}

// ── GET /api/items ─────────────────────────────────────────
// Public: list all items (optionally filtered by ?sellerId=, ?category=)
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.sellerId) filter.sellerId = req.query.sellerId;
    if (req.query.category) filter.category = req.query.category;
    const items = await Item.find(filter).sort({ createdAt: -1 }).limit(200);
    return res.status(200).json({ items });
  } catch (err) {
    return res.status(500).json({ message: "Server error." });
  }
});

// ── POST /api/items/ai-search ──────────────────────────────
// Server-side proxy: keeps Anthropic API key out of the browser
router.post("/ai-search", express.json({ limit: "10mb" }), async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ message: "AI search is not configured on this server." });
  }

  const { base64Image, mediaType } = req.body;
  if (!base64Image || !mediaType) {
    return res.status(400).json({ message: "base64Image and mediaType are required." });
  }

  try {
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-20250514",
        max_tokens: 500,
        system: `You are a fashion analysis AI for a thrift shop directory called Thriftly.
Given an image of clothing or an outfit, identify the key visual characteristics and return a JSON object with these fields:
{
  "searchTerms": ["array", "of", "relevant", "search", "keywords"],
  "colors": ["dominant colors"],
  "styles": ["e.g. casual, streetwear, vintage, minimal, formal, grunge"],
  "categories": ["e.g. tops, bottoms, outerwear, dresses, sneakers, accessories"],
  "era": "approximate fashion era (e.g. 70s, 80s, 90s, modern, classic)",
  "description": "brief 1-sentence description of the style"
}
Focus on: silhouette, color palette, fabric texture cues, style era, and overall aesthetic.
Return ONLY valid JSON, no markdown or explanation.`,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64Image },
            },
            { type: "text", text: "Analyze this clothing/outfit image and return the JSON." },
          ],
        }],
      }),
    });

    const data = await anthropicRes.json();
    return res.status(anthropicRes.status).json(data);
  } catch (err) {
    console.error("AI search proxy error:", err);
    return res.status(500).json({ message: "AI search failed." });
  }
});

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

// ── GET /api/items/:id ─────────────────────────────────────
// Public: get a single item by ID (increments view count)
router.get("/:id", async (req, res) => {
  try {
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    ).populate("sellerId", "shopName businessName");
    
    if (!item) return res.status(404).json({ message: "Item not found." });
    return res.status(200).json({ item });
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

// ── PUT /api/items/:id ─────────────────────────────────────
// Update an existing item (seller only)
router.put("/:id", requireApprovedSeller, upload.array("images", 5), async (req, res) => {
  try {
    const seller = await Seller.findOne({ userId: req.session.userId });
    if (!seller) return res.status(404).json({ message: "Seller not found." });

    const { name, description, price, category, condition, stock, imagesToKeep } = req.body;

    // Find existing item
    const item = await Item.findOne({ _id: req.params.id, sellerId: seller._id });
    if (!item) return res.status(404).json({ message: "Item not found." });

    // Parse images to keep (existing images that weren't deleted)
    const keepImages = imagesToKeep ? JSON.parse(imagesToKeep) : item.images;

    // Add new uploaded images
    const newImages = req.files ? req.files.map((f) => `/uploads/${f.filename}`) : [];

    // Combine kept images with new images (max 5 total)
    const updatedImages = [...keepImages, ...newImages].slice(0, 5);

    // Update item fields
    item.name = name || item.name;
    item.description = description !== undefined ? description : item.description;
    item.price = price !== undefined ? Number(price) : item.price;
    item.category = category !== undefined ? category : item.category;
    item.condition = condition !== undefined ? condition : item.condition;
    item.stock = stock !== undefined ? Number(stock) : item.stock;
    item.images = updatedImages;

    await item.save();

    return res.status(200).json({ message: "Item updated successfully!", item });
  } catch (err) {
    console.error("Update item error:", err);
    return res.status(500).json({ message: "Failed to update item. Please try again." });
  }
});

module.exports = router;
