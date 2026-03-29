const express    = require("express");
const router     = express.Router();
const nodemailer = require("nodemailer");
const mongoose   = require("mongoose");
const User       = require("../models/User");
const Seller     = require("../models/Seller");
const Buyer      = require("../models/Buyer");
const Order      = require("../models/Order");
const Item       = require("../models/Item");

const SITE_NAME = "Thriftly";
const SITE_URL  = "http://localhost:5173";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// ── Startup config check ────────────────────────────────────
if (!process.env.EMAIL_PASS || process.env.EMAIL_PASS === "YOUR_GMAIL_APP_PASSWORD_HERE") {
  console.warn("⚠️  EMAIL_PASS is not set in .env — welcome emails will fail. Generate a Gmail App Password at: https://myaccount.google.com/apppasswords");
}

// Verify transporter config at startup (non-blocking)
transporter.verify()
  .then(() => console.log("✅ Email transporter is ready"))
  .catch((err) => console.error("❌ Email transporter config error:", err.message, "\n   → Make sure EMAIL_PASS is a Gmail App Password (16 chars), NOT your regular password."));

async function sendWelcomeEmail(toEmail, userName) {
  try {
    await transporter.sendMail({
      from:    `"${SITE_NAME}" <${process.env.EMAIL_USER}>`,
      to:      toEmail,
      subject: `You're in! Welcome to ${SITE_NAME} 👋`,
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;color:#2d2416;">
          <h2 style="margin:0 0 24px;font-size:22px;color:#2d2416;">Hi ${userName},</h2>
          <p style="font-size:15px;line-height:1.7;color:#4a3f2f;">
            Quick note to say welcome to <strong>${SITE_NAME}</strong>! We're so happy you decided to join our little corner of the internet.
          </p>
          <p style="font-size:15px;line-height:1.7;color:#4a3f2f;">
            Your account is officially live, which means you can now save your favourite finds and breeze through checkout.
            If you need a hand with anything at all, just hit reply — we're always happy to chat.
          </p>
          <div style="text-align:center;margin:32px 0;">
            <a href="${SITE_URL}" style="display:inline-block;padding:14px 32px;background:#5c6b3a;color:#faf6ec;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">
              Take a look around!
            </a>
          </div>
          <p style="font-size:15px;line-height:1.7;color:#4a3f2f;">Cheers,<br/>The ${SITE_NAME} Team</p>
          <hr style="border:none;border-top:1px solid #e5e0d5;margin:32px 0 16px;" />
          <p style="font-size:12px;color:#9a917f;">
            P.S: If you did not create an account please mail
            <a href="mailto:thriftly26@gmail.com" style="color:#5c6b3a;">thriftly26@gmail.com</a>
          </p>
        </div>
      `,
    });
    console.log(`✉️  Welcome email sent to ${toEmail}`);
  } catch (err) {
    console.error("Welcome email failed:", err.message);
  }
}

function cleanText(value = "") {
  return String(value).replace(/[<>]/g, "").trim();
}

function parseCartItem(item = {}) {
  return {
    itemId: cleanText(item.productId || item._id || item.itemId || item.id || ""),
    name: cleanText(item.name || item.title || "Item"),
    price: Number(item.price) || 0,
    quantity: Math.max(1, Number(item.quantity || item.qty || 1)),
    image: cleanText(item.image || item.images?.[0] || ""),
    shopName: cleanText(item.shopName || ""),
  };
}

async function sendOrderEmailToSeller({ sellerEmail, buyerName, buyerContactInfo, items, totalPrice }) {
  if (!sellerEmail) return;
  const rows = items
    .map((it) => `<li>${it.name} x${it.quantity} - P${(it.price * it.quantity).toLocaleString()}</li>`)
    .join("");

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#2d2416;">
      <h2>New Checkout Order</h2>
      <p><strong>${buyerName}</strong> has placed an order and wants to coordinate the sale.</p>
      <p><strong>Buyer Contact</strong><br/>
      Email: ${buyerContactInfo.email || "-"}<br/>
      Phone: ${buyerContactInfo.phone || "-"}<br/>
      Address: ${buyerContactInfo.address || "-"}</p>
      <p><strong>Items</strong></p>
      <ul>${rows}</ul>
      <p><strong>Total:</strong> P${Number(totalPrice || 0).toLocaleString()}</p>
      <p>Please log in to Thriftly to coordinate fulfillment.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"${SITE_NAME}" <${process.env.EMAIL_USER}>`,
      to: sellerEmail,
      subject: "New buyer checkout on Thriftly",
      html,
    });
  } catch (err) {
    console.error("Checkout seller email failed:", err.message);
  }
}

async function sendPurchaseIntentEmailToSeller({ sellerEmail, buyerUsername, itemName }) {
  if (!sellerEmail) return;
  try {
    await transporter.sendMail({
      from: `"${SITE_NAME}" <${process.env.EMAIL_USER}>`,
      to: sellerEmail,
      subject: "Buyer purchase intent",
      text: `@${buyerUsername} wants to buy ${itemName}. Please log in to the website to coordinate the sale.`,
    });
  } catch (err) {
    console.error("Purchase intent email failed:", err.message);
  }
}

// ── POST /api/auth/register ────────────────────────────────
// Buyers only — sellers are created via /api/shop/approve
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const user = new User({ firstName, lastName, email, password, role: "buyer" });
    await user.save();

    // Create buyer profile doc
    try {
      const buyer = new Buyer({ userId: user._id });
      await buyer.save();
    } catch (_) { /* Buyer model may not exist yet — non-fatal */ }

    // Welcome email (fire-and-forget)
    sendWelcomeEmail(email, firstName);

    // Auto-login via session
    req.session.userId = user._id;
    req.session.email  = user.email;
    req.session.role   = user.role;

    return res.status(201).json({
      message: "Account created successfully.",
      user: {
        id: user._id, firstName: user.firstName, lastName: user.lastName,
        email: user.email, role: user.role,
        phone: user.phone, bio: user.bio, avatarUrl: user.avatarUrl,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
});

// ── POST /api/auth/login ───────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid email or password." });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password." });

    req.session.userId = user._id;
    req.session.email  = user.email;
    req.session.role   = user.role;

    const responseUser = {
      id: user._id, firstName: user.firstName, lastName: user.lastName,
      email: user.email, role: user.role,
      phone: user.phone || "", bio: user.bio || "", avatarUrl: user.avatarUrl || "",
    };

    if (user.role === "seller") {
      const seller = await Seller.findOne({ userId: user._id });
      if (seller) {
        responseUser.shopName  = seller.shopName;
        responseUser.isApproved = seller.isApproved;
      }
    }

    return res.status(200).json({ message: "Logged in successfully.", user: responseUser });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
});

// ── POST /api/auth/logout ──────────────────────────────────
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ message: "Could not log out." });
    res.clearCookie("connect.sid");
    return res.status(200).json({ message: "Logged out successfully." });
  });
});

// ── GET /api/auth/logout  (from old GET calls) ─────────────
router.get("/logout", (req, res) => {
  req.session.destroy(() => {});
  res.clearCookie("connect.sid");
  return res.redirect("http://localhost:5173");
});

// ── GET /api/auth/me ───────────────────────────────────────
router.get("/me", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: "Not logged in." });
  try {
    const user = await User.findById(req.session.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });

    const responseUser = {
      id: user._id, firstName: user.firstName, lastName: user.lastName,
      email: user.email, role: user.role,
      phone: user.phone || "", bio: user.bio || "", avatarUrl: user.avatarUrl || "",
      wishlist: (user.wishlist || []).map((id) => String(id)),
    };

    if (user.role === "seller") {
      const seller = await Seller.findOne({ userId: user._id });
      if (seller) {
        responseUser.shopName   = seller.shopName;
        responseUser.isApproved = seller.isApproved;
      }
    }

    return res.status(200).json({ user: responseUser });
  } catch (err) {
    return res.status(500).json({ message: "Server error." });
  }
});

// ── PATCH /api/auth/profile ─────────────────────────────────
// Update name, phone, bio, avatarUrl, password
router.patch("/profile", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: "Not logged in." });
  try {
    const { firstName, lastName, phone, bio, avatarUrl, newPassword } = req.body;
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (firstName)  user.firstName = firstName;
    if (lastName)   user.lastName  = lastName;
    if (phone  !== undefined) user.phone     = phone;
    if (bio    !== undefined) user.bio       = bio;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    if (newPassword) {
      if (newPassword.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters." });
      user.password = newPassword; // hashed by pre-save hook
    }

    await user.save();
    return res.status(200).json({
      message: "Profile updated.",
      user: {
        id: user._id, firstName: user.firstName, lastName: user.lastName,
        email: user.email, role: user.role,
        phone: user.phone, bio: user.bio, avatarUrl: user.avatarUrl,
      },
    });
  } catch (err) {
    console.error("Profile update error:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

// ── POST /api/auth/wishlist/:itemId ────────────────────────
router.post("/wishlist/:itemId", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: "Not logged in." });
  try {
    const user = await User.findById(req.session.userId);
    const itemId = String(req.params.itemId);
    if (!user.wishlist.some((id) => String(id) === itemId)) {
      user.wishlist.push(itemId);
      await user.save();
    }
    return res.status(200).json({ message: "Added to wishlist.", wishlist: user.wishlist });
  } catch (err) {
    return res.status(500).json({ message: "Server error." });
  }
});

// ── DELETE /api/auth/wishlist/:itemId ──────────────────────
router.delete("/wishlist/:itemId", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: "Not logged in." });
  try {
    const user = await User.findById(req.session.userId);
    user.wishlist = user.wishlist.filter(id => id.toString() !== req.params.itemId);
    await user.save();
    return res.status(200).json({ message: "Removed from wishlist.", wishlist: user.wishlist });
  } catch (err) {
    return res.status(500).json({ message: "Server error." });
  }
});

// ── GET /api/auth/orders ──────────────────────────────────
router.get("/orders", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: "Not logged in." });
  try {
    const orders = await Order.find({ userId: req.session.userId }).sort({ createdAt: -1 });
    return res.status(200).json({ orders });
  } catch (err) {
    console.error("Orders fetch error:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

// ── POST /api/auth/checkout ────────────────────────────────
router.post("/checkout", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: "Not logged in." });
  try {
    const buyer = await Buyer.findOne({ userId: req.session.userId });
    const bodyItems = Array.isArray(req.body?.items) ? req.body.items : [];
    const sourceItems = bodyItems.length ? bodyItems : (buyer?.cart || []);
    const items = sourceItems.map(parseCartItem).filter((i) => i.itemId || i.name);

    if (!items.length) return res.status(400).json({ message: "Cart is empty." });

    // Phase 3: Validate single-shop checkout enforcement
    const shopNames = [...new Set(items.map((i) => i.shopName).filter(Boolean))];
    if (shopNames.length > 1) {
      return res.status(400).json({ message: "Single shop checkout only." });
    }

    const buyerContactInfo = {
      name: cleanText(req.body?.buyerContactInfo?.name),
      email: cleanText(req.body?.buyerContactInfo?.email),
      phone: cleanText(req.body?.buyerContactInfo?.phone),
      address: cleanText(req.body?.buyerContactInfo?.address),
    };

    const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const shopId = cleanText(req.body?.shopId || items[0]?.shopName || "");
    const sellerEmailFallback = cleanText(req.body?.sellerEmail || "");

    const order = await Order.create({
      userId: req.session.userId,
      shopId,
      buyerContactInfo,
      items: items.map((i) => ({
        itemId: i.itemId,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        image: i.image,
      })),
      totalPrice,
      total: totalPrice,
      status: "pending",
    });

    const shopsToBump = new Set();
    for (const i of items) {
      if (i.shopName) shopsToBump.add(i.shopName);
    }
    if (shopId) shopsToBump.add(shopId);
    for (const name of shopsToBump) {
      await Seller.updateMany(
        { isApproved: true, shopName: name },
        { $inc: { orderCount: 1 } }
      );
    }

    if (buyer) {
      buyer.cart = [];
      await buyer.save();
    }

    const user = await User.findById(req.session.userId);
    const sellerProfile = await Seller.findOne({ shopName: shopId });
    let sellerUser = null;
    if (sellerProfile) sellerUser = await User.findById(sellerProfile.userId);

    sendOrderEmailToSeller({
      sellerEmail: sellerUser?.email || sellerEmailFallback,
      buyerName: `${user?.firstName || "Buyer"} ${user?.lastName || ""}`.trim(),
      buyerContactInfo,
      items,
      totalPrice,
    });

    return res.status(201).json({ message: "Checkout complete.", order });
  } catch (err) {
    console.error("Checkout error:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

// ── GET /api/auth/wishlist/items  — resolve DB + passthrough ids ─────────
router.get("/wishlist/items", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: "Not logged in." });
  try {
    const user = await User.findById(req.session.userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    const ids = user.wishlist || [];
    const items = [];
    for (const raw of ids) {
      const sid = String(raw);
      if (mongoose.Types.ObjectId.isValid(sid)) {
        const it = await Item.findById(sid).populate("sellerId", "shopName").lean();
        if (it) {
          const pics = (it.images || []).map((url) =>
            String(url).startsWith("http") ? url : `http://localhost:5000${url.startsWith("/") ? "" : "/"}${url}`
          );
          items.push({
            id: String(it._id),
            _id: String(it._id),
            name: it.name,
            title: it.name,
            price: it.price,
            images: pics,
            shopName: it.sellerId?.shopName || "",
          });
          continue;
        }
      }
      items.push({ id: sid, _id: sid, name: "", title: "", price: 0, images: [], shopName: "", fallbackId: sid });
    }
    return res.status(200).json({ items });
  } catch (err) {
    console.error("wishlist items error:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

// ── POST /api/auth/purchase-intent-email ───────────────────
router.post("/purchase-intent-email", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: "Not logged in." });
  try {
    let sellerId = cleanText(req.body?.sellerId);
    const shopName = cleanText(req.body?.shopName);
    const sellerEmailFallback = cleanText(req.body?.sellerEmail);
    const itemName = cleanText(req.body?.itemName || "an item");
    if ((!sellerId || sellerId.startsWith("shop-")) && shopName) {
      const seller = await Seller.findOne({ shopName });
      if (seller?.userId) sellerId = String(seller.userId);
    }
    if ((!sellerId || sellerId.startsWith("shop-")) && !sellerEmailFallback) {
      return res.status(400).json({ message: "sellerId required." });
    }

    const buyerUser = await User.findById(req.session.userId);
    const sellerUser = await User.findById(sellerId);
    sendPurchaseIntentEmailToSeller({
      sellerEmail: sellerUser?.email || sellerEmailFallback,
      buyerUsername: buyerUser?.firstName || buyerUser?.email || "buyer",
      itemName,
    });

    return res.status(200).json({ message: "Seller email notification queued." });
  } catch (err) {
    console.error("Purchase intent email route error:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

// ── GET /api/auth/cart ─────────────────────────────────────
router.get("/cart", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: "Not logged in." });
  try {
    let buyer = await Buyer.findOne({ userId: req.session.userId });
    if (!buyer) {
      buyer = await Buyer.create({ userId: req.session.userId, cart: [] });
    }
    return res.status(200).json({ cart: buyer.cart || [] });
  } catch (err) {
    console.error("Cart fetch error:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

// ── PUT /api/auth/cart ─────────────────────────────────────
router.put("/cart", async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: "Not logged in." });
  try {
    const payload = Array.isArray(req.body?.cart) ? req.body.cart : [];

    const normalized = payload
      .map((item) => ({
        productId: String(item.productId || item._id || item.id || "").trim(),
        name: String(item.name || item.title || "").trim(),
        price: Number(item.price) || 0,
        image: String(item.image || item.images?.[0] || "").trim(),
        shopName: String(item.shopName || "").trim(),
        quantity: Math.max(1, Number(item.quantity || item.qty || 1)),
        stock:
          item.stock === undefined || item.stock === null || item.stock === ""
            ? null
            : Math.max(0, Math.floor(Number(item.stock))),
      }))
      .filter((item) => item.productId);

    let buyer = await Buyer.findOne({ userId: req.session.userId });
    if (!buyer) {
      buyer = new Buyer({ userId: req.session.userId, cart: normalized });
    } else {
      buyer.cart = normalized;
    }

    await buyer.save();
    return res.status(200).json({ message: "Cart updated.", cart: buyer.cart });
  } catch (err) {
    console.error("Cart update error:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;

