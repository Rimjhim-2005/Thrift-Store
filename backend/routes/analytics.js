const express = require("express");
const router = express.Router();
const Analytics = require("../models/Analytics");
const Seller = require("../models/Seller");
const Item = require("../models/Item");

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
function absUrl(url) {
  if (!url) return "";
  return url.startsWith("http") ? url : `${BASE_URL}${url}`;
}

// ── GET /api/analytics/top-shops ────────────────────────────────────────
// Get the most viewed shops (bestsellers)
router.get("/top-shops", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    
    // Get most viewed sellers directly from Seller model
    const topShops = await Seller.find({ isApproved: true })
      .sort({ viewCount: -1, orderCount: -1, createdAt: -1 })
      .limit(limit)
      .select("shopName slug shopDescription location shopLogoUrl headerImageUrl tags viewCount orderCount rating");

    const shops = topShops.map((s) => ({
      _id: s._id,
      shopName: s.shopName,
      slug: s.slug,
      shopDescription: s.shopDescription,
      location: s.location,
      shopLogoUrl: absUrl(s.shopLogoUrl),
      headerImageUrl: absUrl(s.headerImageUrl),
      tags: s.tags || [],
      viewCount: s.viewCount,
      orderCount: s.orderCount,
      rating: s.rating,
    }));

    return res.status(200).json({ shops });
  } catch (err) {
    console.error("Top shops error:", err);
    return res.status(500).json({ message: "Failed to fetch top shops." });
  }
});


// ── GET /api/analytics/top-items ────────────────────────────────────────
// Get the most viewed items overall
router.get("/top-items", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    
    // Get most viewed items overall
    const topItems = await Item.find()
      .sort({ viewCount: -1, createdAt: -1 })
      .limit(limit)
      .populate("sellerId", "shopName");

    return res.status(200).json({ items: topItems });
  } catch (err) {
    console.error("Top items error:", err);
    return res.status(500).json({ message: "Failed to fetch top items." });
  }
});

// ── GET /api/analytics/top-items-by-shop/:shopId ─────────────────────────
// Get the most viewed items for a specific shop
router.get("/top-items-by-shop/:shopId", async (req, res) => {
  try {
    const { shopId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    // Get most viewed items from a specific shop
    const items = await Item.find({ sellerId: shopId })
      .sort({ viewCount: -1, createdAt: -1 })
      .limit(limit);

    return res.status(200).json({ items });
  } catch (err) {
    console.error("Shop items error:", err);
    return res.status(500).json({ message: "Failed to fetch shop items." });
  }
});

// ── POST /api/analytics/sync ────────────────────────────────────────────
// Sync analytics data from Seller and Item models to Analytics collection
// This can be called periodically or on demand
router.post("/sync", async (req, res) => {
  try {
    const sellers = await Seller.find({ isApproved: true }).select("_id shopName viewCount orderCount");
    const items = await Item.find().select("_id sellerId name price category viewCount");

    // Clear existing analytics
    await Analytics.deleteMany({});

    // Sync shop analytics
    const shopAnalytics = sellers.map((seller) => ({
      shopId: seller._id,
      shopName: seller.shopName,
      shopViewCount: seller.viewCount,
      totalOrders: seller.orderCount,
      lastUpdated: Date.now(),
    }));

    // Sync item analytics
    const itemAnalytics = items.map((item) => {
      const seller = sellers.find((s) => String(s._id) === String(item.sellerId));
      return {
        shopId: item.sellerId,
        shopName: seller?.shopName || "",
        itemId: item._id,
        itemName: item.name,
        itemViewCount: item.viewCount,
        itemPrice: item.price,
        itemCategory: item.category,
        lastUpdated: Date.now(),
      };
    });

    if (shopAnalytics.length > 0) {
      await Analytics.insertMany(shopAnalytics);
    }
    if (itemAnalytics.length > 0) {
      await Analytics.insertMany(itemAnalytics);
    }

    return res.status(200).json({
      message: "Analytics synced successfully.",
      shopCount: shopAnalytics.length,
      itemCount: itemAnalytics.length,
    });
  } catch (err) {
    console.error("Sync analytics error:", err);
    return res.status(500).json({ message: "Failed to sync analytics." });
  }
});

// ── GET /api/analytics/dashboard ────────────────────────────────────────
// Get overall dashboard stats
router.get("/dashboard", async (req, res) => {
  try {
    const topShops = await Seller.find({ isApproved: true })
      .sort({ viewCount: -1, orderCount: -1 })
      .limit(5)
      .select("shopName slug shopLogoUrl viewCount orderCount");

    const topItems = await Item.find()
      .sort({ viewCount: -1 })
      .limit(5)
      .populate("sellerId", "shopName");

    const totalShops = await Seller.countDocuments({ isApproved: true });
    const totalItems = await Item.countDocuments();
    const totalShopViews = await Seller.aggregate([
      { $match: { isApproved: true } },
      { $group: { _id: null, totalViews: { $sum: "$viewCount" } } },
    ]);
    const totalItemViews = await Item.aggregate([
      { $group: { _id: null, totalViews: { $sum: "$viewCount" } } },
    ]);

    return res.status(200).json({
      topShops,
      topItems,
      stats: {
        totalShops,
        totalItems,
        totalShopViews: totalShopViews[0]?.totalViews || 0,
        totalItemViews: totalItemViews[0]?.totalViews || 0,
      },
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    return res.status(500).json({ message: "Failed to fetch dashboard." });
  }
});

module.exports = router;
