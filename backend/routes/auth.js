const express    = require("express");
const router     = express.Router();
const nodemailer = require("nodemailer");
const User       = require("../models/User");
const Seller     = require("../models/Seller");
const Buyer      = require("../models/Buyer");

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
      wishlist: user.wishlist || [],
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
    if (!user.wishlist.includes(req.params.itemId)) {
      user.wishlist.push(req.params.itemId);
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

module.exports = router;
