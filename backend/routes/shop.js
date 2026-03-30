const express    = require("express");
const router     = express.Router();
const crypto     = require("crypto");
const path       = require("path");
const fs         = require("fs");
const multer     = require("multer");
const nodemailer = require("nodemailer");
const ShopRequest = require("../models/ShopRequest");
const Seller     = require("../models/Seller");
const User       = require("../models/User");

const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});
const uploadBranding = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error("Only image files are allowed."));
  },
});

function slugifyBase(name) {
  return (
    String(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "shop"
  );
}

async function ensureSellerSlug(seller) {
  if (seller.slug) return;
  let base = slugifyBase(seller.shopName);
  let candidate = base;
  let n = 0;
  while (true) {
    const exists = await Seller.findOne({ slug: candidate, _id: { $ne: seller._id } });
    if (!exists) {
      seller.slug = candidate;
      return;
    }
    n += 1;
    candidate = `${base}-${n}`;
  }
}

const SITE_NAME = "Thriftly";
const SITE_URL  = process.env.APP_URL || "http://localhost:5000";
const API_PUBLIC = process.env.API_PUBLIC_URL || "http://localhost:5000";
const ADMIN_EMAIL = process.env.EMAIL_USER; // admin gets approval emails at this address

function absUploadUrl(url) {
  if (!url) return "";
  if (String(url).startsWith("http")) return url;
  return `${API_PUBLIC}${String(url).startsWith("/") ? "" : "/"}${url}`;
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

async function sendApprovedSellerEmail({ email, firstName, shopName, tempPassword }) {
  try {
    await transporter.sendMail({
      from: `"${SITE_NAME}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Your shop "${shopName}" is approved`,
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;color:#2d2416;">
          <h2 style="color:#5c6b3a;margin:0 0 8px;">Your shop has been approved</h2>
          <p style="font-size:15px;line-height:1.7;color:#4a3f2f;">
            Hi ${firstName}, your shop <strong>"${shopName}"</strong> is approved and now live on Thriftly.
          </p>
          <p style="font-size:15px;line-height:1.7;color:#4a3f2f;">Login credentials:</p>
          <div style="background:#f5f0e8;border-radius:8px;padding:16px 20px;margin:16px 0;">
            <p style="margin:4px 0;font-size:14px;"><strong>Email:</strong> ${email}</p>
            <p style="margin:4px 0;font-size:14px;"><strong>Temporary Password:</strong> <code style="background:#fff;padding:2px 6px;border-radius:4px;">${tempPassword}</code></p>
          </div>
          <p style="font-size:14px;color:#c0392b;">Please change your password after first login.</p>
          <div style="text-align:center;margin:32px 0;">
            <a href="http://localhost:5173" style="display:inline-block;padding:14px 32px;background:#5c6b3a;color:#faf6ec;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;">Login to Thriftly</a>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error("Seller approval email failed:", err.message);
  }
}

async function requireApprovedSellerApi(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ message: "Not logged in." });
  if (req.session.role !== "seller") return res.status(403).json({ message: "Seller only." });
  try {
    const seller = await Seller.findOne({ userId: req.session.userId });
    if (!seller) return res.status(404).json({ message: "Seller profile not found." });
    if (!seller.isApproved) return res.status(403).json({ message: "Shop not approved yet." });
    req.sellerRecord = seller;
    return next();
  } catch (e) {
    return res.status(500).json({ message: "Server error." });
  }
}

// ── GET /api/shop/my  — seller storefront settings + user PFP reference ──
router.get("/my", requireApprovedSellerApi, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select("-password");
    const s = req.sellerRecord;
    return res.status(200).json({
      seller: {
        shopName: s.shopName,
        slug: s.slug || slugifyBase(s.shopName),
        shopDescription: s.shopDescription || "",
        tags: s.tags || [],
        location: s.location || "",
        hours: s.hours || "",
        phone: s.phone || "",
        shopEmail: s.shopEmail || "",
        since: s.since || "",
        headerImageUrl: absUploadUrl(s.headerImageUrl || ""),
        shopLogoUrl: absUploadUrl(s.shopLogoUrl || ""),
      },
      user: {
        avatarUrl: user?.avatarUrl || "",
        firstName: user?.firstName,
        lastName: user?.lastName,
      },
    });
  } catch (err) {
    console.error("shop my get:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

// ── PATCH /api/shop/my  — description + tags ──────────────────────────────
router.patch("/my", requireApprovedSellerApi, async (req, res) => {
  try {
    const seller = req.sellerRecord;
    if (req.body.shopDescription !== undefined) {
      seller.shopDescription = String(req.body.shopDescription || "").replace(/[<>]/g, "").trim().slice(0, 5000);
    }
    if (Array.isArray(req.body.tags)) {
      seller.tags = req.body.tags
        .map((t) => String(t).replace(/[<>]/g, "").trim())
        .filter(Boolean)
        .slice(0, 20);
    }
    const sanitize = (v) => String(v || "").replace(/[<>]/g, "").trim().slice(0, 300);
    if (req.body.location  !== undefined) seller.location  = sanitize(req.body.location);
    if (req.body.hours     !== undefined) seller.hours     = sanitize(req.body.hours);
    if (req.body.phone     !== undefined) seller.phone     = sanitize(req.body.phone);
    if (req.body.shopEmail !== undefined) seller.shopEmail = sanitize(req.body.shopEmail);
    if (req.body.since     !== undefined) seller.since     = sanitize(req.body.since);
    await seller.save();
    return res.status(200).json({
      message: "Saved.",
      seller: {
        shopDescription: seller.shopDescription,
        tags: seller.tags,
        location: seller.location,
        hours: seller.hours,
        phone: seller.phone,
        shopEmail: seller.shopEmail,
        since: seller.since,
      },
    });
  } catch (err) {
    console.error("shop my patch:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

// ── POST /api/shop/my/branding  — header + logo images ───────────────────
router.post(
  "/my/branding",
  requireApprovedSellerApi,
  (req, res, next) => {
    uploadBranding.fields([
      { name: "header", maxCount: 1 },
      { name: "logo", maxCount: 1 },
    ])(req, res, (err) => {
      if (err) return res.status(400).json({ message: err.message || "Upload failed." });
      next();
    });
  },
  async (req, res) => {
    try {
      const seller = req.sellerRecord;
      if (req.files?.header?.[0]) seller.headerImageUrl = `/uploads/${req.files.header[0].filename}`;
      if (req.files?.logo?.[0]) seller.shopLogoUrl = `/uploads/${req.files.logo[0].filename}`;
      await seller.save();
      return res.status(200).json({
        message: "Uploads saved.",
        headerImageUrl: seller.headerImageUrl,
        shopLogoUrl: seller.shopLogoUrl,
      });
    } catch (err) {
      console.error("shop branding:", err);
      return res.status(500).json({ message: "Server error." });
    }
  }
);

// ────────────────────────────────────────────────────────────
// POST /api/shop/request  — new shop application from homepage form
// ────────────────────────────────────────────────────────────
router.post("/request", async (req, res) => {
  try {
    const { firstName, lastName, email, shopName, location, category, description } = req.body;

    if (!firstName || !lastName || !email || !shopName) {
      return res.status(400).json({ message: "Name, email, and shop name are required." });
    }

    // Prevent duplicate pending / approved requests for same email
    const existing = await ShopRequest.findOne({ email, status: { $in: ["pending", "approved"] } });
    if (existing) {
      return res.status(409).json({ message: "A shop request for this email is already pending or approved." });
    }

    const token       = crypto.randomBytes(32).toString("hex");
    const rejectToken = crypto.randomBytes(32).toString("hex");

    const shopReq = new ShopRequest({
      firstName, lastName, email, shopName,
      location:    location    || "",
      category:    category    || "",
      description: description || "",
      token,
      rejectToken,
    });
    await shopReq.save();

    const approveUrl = `${SITE_URL}/api/shop/approve/${token}`;
    const rejectUrl  = `${SITE_URL}/api/shop/reject/${rejectToken}`;

    // ── Admin notification email ────────────────────────────
    await transporter.sendMail({
      from:    `"${SITE_NAME} Admin" <${process.env.EMAIL_USER}>`,
      to:      ADMIN_EMAIL,
      subject: `🛍️ New Shop Request: ${shopName}`,
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:620px;margin:0 auto;padding:32px 24px;color:#2d2416;">
          <h2 style="color:#5c6b3a;margin:0 0 24px;">New Shop Listing Request</h2>

          <table style="width:100%;border-collapse:collapse;font-size:15px;">
            <tr style="background:#f5f0e8;"><td style="padding:10px 14px;font-weight:600;width:130px;">Name</td><td style="padding:10px 14px;">${firstName} ${lastName}</td></tr>
            <tr><td style="padding:10px 14px;font-weight:600;">Email</td><td style="padding:10px 14px;">${email}</td></tr>
            <tr style="background:#f5f0e8;"><td style="padding:10px 14px;font-weight:600;">Shop Name</td><td style="padding:10px 14px;">${shopName}</td></tr>
            <tr><td style="padding:10px 14px;font-weight:600;">Location</td><td style="padding:10px 14px;">${location || "Not specified"}</td></tr>
            <tr style="background:#f5f0e8;"><td style="padding:10px 14px;font-weight:600;">Category</td><td style="padding:10px 14px;">${category || "Not specified"}</td></tr>
            <tr><td style="padding:10px 14px;font-weight:600;vertical-align:top;">Description</td><td style="padding:10px 14px;">${description || "Not provided"}</td></tr>
          </table>

          <div style="margin-top:36px;display:flex;gap:16px;">
            <a href="${approveUrl}"
               style="display:inline-block;padding:14px 32px;background:#5c6b3a;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;margin-right:12px;">
              ✅ Verify &amp; Approve
            </a>
            <a href="${rejectUrl}"
               style="display:inline-block;padding:14px 32px;background:#c0392b;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">
              ❌ Reject
            </a>
          </div>

          <p style="margin-top:16px;font-size:12px;color:#9a917f;">
            Approve URL: ${approveUrl}<br/>
            Reject URL: ${rejectUrl}
          </p>
        </div>
      `,
    });

    return res.status(200).json({ message: "Shop listing request submitted! We'll review it shortly." });
  } catch (err) {
    console.error("Shop request error:", err);
    return res.status(500).json({ message: "Failed to submit request. Please try again." });
  }
});

// ────────────────────────────────────────────────────────────
// GET /api/shop/approve/:token  — admin clicks "Verify" in email
// ────────────────────────────────────────────────────────────
router.get("/approve/:token", async (req, res) => {
  try {
    const shopReq = await ShopRequest.findOne({ token: req.params.token });

    if (!shopReq) {
      return res.status(400).send(page("❌ Invalid or expired approval link.", "#c0392b"));
    }
    if (shopReq.status === "approved") {
      return res.status(200).send(page(`✅ "${shopReq.shopName}" is already approved!`, "#5c6b3a"));
    }
    if (shopReq.status === "rejected") {
      return res.status(400).send(page("This request was already rejected.", "#c0392b"));
    }

    // Generate a temporary password
    const tempPassword = crypto.randomBytes(5).toString("hex"); // e.g. "a1b2c3d4e5"

    // Check if user already exists (e.g. they were a buyer before)
    let user = await User.findOne({ email: shopReq.email });
    if (user) {
      // Upgrade to seller
      user.role = "seller";
      user.password = tempPassword; // will be hashed by pre-save hook
      await user.save();
    } else {
      user = new User({
        firstName: shopReq.firstName,
        lastName:  shopReq.lastName,
        email:     shopReq.email,
        password:  tempPassword,
        role:      "seller",
      });
      await user.save();
    }

    // Create or update seller profile
    let seller = await Seller.findOne({ userId: user._id });
    if (!seller) {
      seller = new Seller({
        userId:          user._id,
        shopName:        shopReq.shopName,
        shopDescription: shopReq.description,
        location:        shopReq.location,
        category:        shopReq.category,
        isApproved:      true,
        approvedAt:      new Date(),
      });
    } else {
      seller.shopName        = shopReq.shopName;
      seller.shopDescription = shopReq.description;
      seller.location        = shopReq.location;
      seller.category        = shopReq.category;
      seller.isApproved      = true;
      seller.approvedAt      = new Date();
    }
    await ensureSellerSlug(seller);
    await seller.save();

    // Mark request as approved
    shopReq.status = "approved";
    await shopReq.save();

    // Send seller approval email asynchronously so approval never fails due to mail issues.
    sendApprovedSellerEmail({
      email: shopReq.email,
      firstName: shopReq.firstName,
      shopName: shopReq.shopName,
      tempPassword,
    });

    return res.status(200).send(page(
      `✅ Shop Approved! "${shopReq.shopName}" is now live. An email has been sent to ${shopReq.email} with login credentials.`,
      "#5c6b3a"
    ));
  } catch (err) {
    console.error("Approve error:", err);
    return res.status(500).send(page("Server error. Check logs.", "#c0392b"));
  }
});

// ────────────────────────────────────────────────────────────
// GET /api/shop/reject/:token  — admin clicks "Reject" in email
// ────────────────────────────────────────────────────────────
router.get("/reject/:rejectToken", async (req, res) => {
  try {
    const shopReq = await ShopRequest.findOne({ rejectToken: req.params.rejectToken });

    if (!shopReq) {
      return res.status(400).send(page("❌ Invalid or expired rejection link.", "#c0392b"));
    }
    if (shopReq.status !== "pending") {
      return res.status(400).send(page(`This request has already been ${shopReq.status}.`, "#c0392b"));
    }

    shopReq.status = "rejected";
    await shopReq.save();

    // ── Email the applicant ─────────────────────────────────
    await transporter.sendMail({
      from:    `"${SITE_NAME}" <${process.env.EMAIL_USER}>`,
      to:      shopReq.email,
      subject: `Update on your shop application — ${SITE_NAME}`,
      html: `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;color:#2d2416;">
          <h2 style="color:#2d2416;margin:0 0 16px;">Hi ${shopReq.firstName},</h2>
          <p style="font-size:15px;line-height:1.7;color:#4a3f2f;">
            Thank you for applying to list <strong>"${shopReq.shopName}"</strong> on <strong>${SITE_NAME}</strong>.
            We carefully considered your application, but unfortunately we're unable to approve it at this time.
          </p>
          <p style="font-size:15px;line-height:1.7;color:#4a3f2f;">
            <em>[We'll be in touch if this changes, or feel free to reach out to us directly.]</em>
          </p>
          <p style="font-size:15px;line-height:1.7;color:#4a3f2f;">
            We appreciate your interest and hope you'll consider applying again in the future.
          </p>
          <p style="font-size:15px;line-height:1.7;color:#4a3f2f;">
            Warm regards,<br/>The ${SITE_NAME} Team
          </p>
          <hr style="border:none;border-top:1px solid #e5e0d5;margin:32px 0 16px;" />
          <p style="font-size:12px;color:#9a917f;">
            Questions? Email us at <a href="mailto:thriftly26@gmail.com" style="color:#5c6b3a;">thriftly26@gmail.com</a>
          </p>
        </div>
      `,
    });

    return res.status(200).send(page(
      `❌ Shop request rejected. A notification email has been sent to ${shopReq.email}.`,
      "#4a3f2f"
    ));
  } catch (err) {
    console.error("Reject error:", err);
    return res.status(500).send(page("Server error. Check logs.", "#c0392b"));
  }
});

// ────────────────────────────────────────────────────────────
// helper: simple HTML page for admin feedback
// ────────────────────────────────────────────────────────────
function page(message, color = "#2d2416") {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${SITE_NAME}</title></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#faf6ec;">
  <div style="text-align:center;padding:60px 40px;background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08);max-width:480px;">
    <div style="font-size:48px;margin-bottom:16px;">♻️</div>
    <h2 style="color:${color};margin:0 0 12px;">${message}</h2>
    <a href="http://localhost:5173" style="color:#5c6b3a;font-size:14px;">← Back to Thriftly</a>
  </div>
</body></html>`;
}

module.exports = router;
