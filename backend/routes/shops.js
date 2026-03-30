const express = require("express");
const router = express.Router();
const Seller = require("../models/Seller");
const Item = require("../models/Item");

const API_PUBLIC = process.env.API_PUBLIC_URL || "http://localhost:5000";

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function slugFromShopName(name) {
  const base = String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return base || "shop";
}

function absUploadUrl(url) {
  if (!url) return "";
  if (String(url).startsWith("http")) return url;
  return `${API_PUBLIC}${url.startsWith("/") ? "" : "/"}${url}`;
}

/** Collect tags from ?tags=a,b&tags=c or repeated ?tag= — excludes "All". */
function parseTagsFromQuery(query) {
  const out = [];
  if (query.tags != null && query.tags !== "") {
    const raw = Array.isArray(query.tags) ? query.tags : String(query.tags).split(",");
    for (const t of raw) {
      const s = String(t).trim();
      if (s && s.toLowerCase() !== "all") out.push(s);
    }
  }
  if (query.tag != null && query.tag !== "") {
    const single = query.tag;
    if (Array.isArray(single)) {
      for (const t of single) {
        const s = String(t).trim();
        if (s && s.toLowerCase() !== "all") out.push(s);
      }
    } else {
      const s = String(single).trim();
      if (s && s.toLowerCase() !== "all") out.push(s);
    }
  }
  return [...new Set(out)];
}

function sellerMatchesAnyTag(seller, tagFilters) {
  if (!tagFilters.length) return true;
  const shopTags = (seller.tags || []).map((x) => String(x).toLowerCase());
  return tagFilters.some((t) => shopTags.includes(String(t).toLowerCase()));
}

async function publicShopDoc(seller, itemCount) {
  const slug = seller.slug || slugFromShopName(seller.shopName);
  return {
    id: String(seller._id),
    _id: String(seller._id),
    shopName: seller.shopName,
    slug,
    tags: seller.tags || [],
    shopDescription: seller.shopDescription || "",
    location: seller.location || "",
    hours: seller.hours || "",
    phone: seller.phone || "",
    shopEmail: seller.shopEmail || "",
    since: seller.since || "",
    headerImageUrl: absUploadUrl(seller.headerImageUrl),
    shopLogoUrl: absUploadUrl(seller.shopLogoUrl),
    orderCount: seller.orderCount ?? 0,
    viewCount: seller.viewCount ?? 0,
    itemCount,
    averageRating: seller.averageRating ?? 0,
    reviewCount: seller.reviewCount ?? 0,
  };
}

// GET /api/shops/search?q=  (register before /:id routes)
router.get("/search", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.status(200).json({ shops: [] });

    const tagFilters = parseTagsFromQuery(req.query);

    const regex = new RegExp(escapeRegex(q), "i");
    const nameMatches = await Seller.find({ isApproved: true, shopName: regex })
      .sort({ orderCount: -1, viewCount: -1, createdAt: -1 })
      .lean();

    const itemSellerIds = await Item.find({
      $or: [{ name: regex }, { category: regex }],
    }).distinct("sellerId");

    const fromProducts = await Seller.find({
      _id: { $in: itemSellerIds },
      isApproved: true,
    })
      .sort({ orderCount: -1, viewCount: -1, createdAt: -1 })
      .lean();

    const seen = new Set();
    const merged = [];
    for (const s of [...nameMatches, ...fromProducts]) {
      const id = String(s._id);
      if (seen.has(id)) continue;
      seen.add(id);
      merged.push(s);
    }

    const afterTags = tagFilters.length ? merged.filter((s) => sellerMatchesAnyTag(s, tagFilters)) : merged;

    const shops = [];
    for (const s of afterTags) {
      const itemCount = await Item.countDocuments({ sellerId: s._id });
      shops.push(await publicShopDoc(s, itemCount));
    }
    return res.status(200).json({ shops });
  } catch (err) {
    console.error("shops search error:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

// GET /api/shops/store/:slug — public storefront + items
router.get("/store/:slug", async (req, res) => {
  try {
    const param = decodeURIComponent(req.params.slug || "").trim();
    let seller = await Seller.findOne({ slug: param, isApproved: true }).lean();
    if (!seller) {
      seller = await Seller.findOne({
        shopName: new RegExp(`^${escapeRegex(param)}$`, "i"),
        isApproved: true,
      }).lean();
    }
    if (!seller) {
      return res.status(404).json({ message: "Shop not found." });
    }

    const items = await Item.find({ sellerId: seller._id }).sort({ createdAt: -1 }).lean();
    const mapped = items.map((it) => ({
      id: String(it._id),
      _id: String(it._id),
      name: it.name,
      title: it.name,
      description: it.description || "",
      price: it.price,
      category: it.category || "",
      condition: it.condition || "",
      images: (it.images || []).map((url) => absUploadUrl(url)),
      shopId: String(seller._id),
      shopName: seller.shopName,
      stock: it.stock != null ? Math.max(0, Math.floor(Number(it.stock))) : 1,
    }));

    const doc = await publicShopDoc(seller, items.length);
    return res.status(200).json({ shop: doc, items: mapped });
  } catch (err) {
    console.error("shop store error:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

// POST /api/shops/:sellerId/view — bump view count
router.post("/:sellerId/view", async (req, res) => {
  try {
    const id = req.params.sellerId;
    if (!id || id === "search" || id === "store") {
      return res.status(400).json({ message: "Invalid seller id." });
    }
    await Seller.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("view bump error:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

// GET /api/shops — directory (?tag= repeated and/or ?tags=a,b) — shop must match any selected tag
router.get("/", async (req, res) => {
  try {
    const tagFilters = parseTagsFromQuery(req.query);
    const filter = { isApproved: true };
    if (tagFilters.length) filter.tags = { $in: tagFilters };

    const sellers = await Seller.find(filter)
      .sort({ orderCount: -1, viewCount: -1, createdAt: -1 })
      .lean();

    const shops = [];
    for (const s of sellers) {
      const itemCount = await Item.countDocuments({ sellerId: s._id });
      shops.push(await publicShopDoc(s, itemCount));
    }
    return res.status(200).json({ shops });
  } catch (err) {
    console.error("shops list error:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
