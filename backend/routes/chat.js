const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Seller = require("../models/Seller");
const User = require("../models/User");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

function requireAuth(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ message: "Not logged in." });
  next();
}

function sanitizeText(value = "") {
  return String(value).replace(/[<>]/g, "").trim();
}

router.use(requireAuth);

// GET /api/chat/conversations
router.get("/conversations", async (req, res) => {
  try {
    const userId = String(req.session.userId);
    const conversations = await Conversation.find({
      $or: [{ buyerId: userId }, { sellerId: userId }],
    }).sort({ lastMessageAt: -1 });
    return res.status(200).json({ conversations });
  } catch (err) {
    console.error("Conversations fetch error:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

// POST /api/chat/conversations/get-or-create
router.post("/conversations/get-or-create", async (req, res) => {
  try {
    const buyerId = sanitizeText(req.body?.buyerId || req.session.userId);
    let sellerId = sanitizeText(req.body?.sellerId);
    const shopName = sanitizeText(req.body?.shopName);
    const sellerEmailFallback = sanitizeText(req.body?.sellerEmail);
    const productId = sanitizeText(req.body?.productId);
    const productName = sanitizeText(req.body?.productName);
    const productPrice = Number(req.body?.productPrice) || 0;
    const createIntentCard = !!req.body?.createIntentCard;

    if ((!sellerId || sellerId.startsWith("shop-")) && shopName) {
      const seller = await Seller.findOne({ shopName });
      if (seller?.userId) sellerId = String(seller.userId);
    }

    if (!sellerId || sellerId.startsWith("shop-")) {
      sellerId = `shop:${shopName || "unknown"}`;
    }

    let conversation = await Conversation.findOne({ buyerId, sellerId, productId });
    if (!conversation) {
      conversation = await Conversation.create({
        buyerId,
        sellerId,
        productId,
        productName,
        productPrice,
      });
    }

    if (createIntentCard) {
      const alreadyHasCard = await Message.findOne({
        conversationId: conversation._id,
        "meta.cardType": "purchase_intent",
      });

      if (!alreadyHasCard) {
        const text = `Purchase intent: ${productName || "Item"} (ID: ${productId || "N/A"}) - P${productPrice.toLocaleString()}`;
        const firstMessage = await Message.create({
          conversationId: conversation._id,
          senderId: buyerId,
          senderRole: "buyer",
          text,
          meta: { cardType: "purchase_intent", productId, productName, productPrice },
        });

        conversation.lastMessage = text;
        conversation.lastMessageAt = firstMessage.createdAt;
        await conversation.save();

        req.app.locals.io?.to(`conversation:${conversation._id}`).emit("chat:message", firstMessage);
        req.app.locals.io?.to(`user:${buyerId}`).emit("chat:conversation-updated", conversation);
        req.app.locals.io?.to(`user:${sellerId}`).emit("chat:conversation-updated", conversation);

        // Notify seller asynchronously (app notification + email).
        (async () => {
          try {
            let sellerEmail = sellerEmailFallback;
            if (!sellerEmail && sellerId && !sellerId.startsWith("shop:")) {
              const sellerUser = await User.findById(sellerId);
              sellerEmail = sellerUser?.email || "";
            }
            if (sellerEmail) {
              await transporter.sendMail({
                from: `"Thriftly" <${process.env.EMAIL_USER}>`,
                to: sellerEmail,
                subject: "Buyer purchase intent",
                text: `A buyer wants to buy ${productName || "an item"}. Please log in to Thriftly to coordinate the sale.`,
              });
            }
          } catch (emailErr) {
            console.error("Purchase intent email from chat failed:", emailErr.message);
          }
        })();
      }
    }

    return res.status(200).json({ conversation });
  } catch (err) {
    console.error("Conversation create/get error:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

// GET /api/chat/conversations/:conversationId/messages
router.get("/conversations/:conversationId/messages", async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found." });

    const userId = String(req.session.userId);
    if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
      return res.status(403).json({ message: "Forbidden." });
    }

    const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 });
    return res.status(200).json({ conversation, messages });
  } catch (err) {
    console.error("Messages fetch error:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

// POST /api/chat/conversations/:conversationId/messages
router.post("/conversations/:conversationId/messages", async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) return res.status(404).json({ message: "Conversation not found." });

    const senderId = String(req.session.userId);
    if (conversation.buyerId !== senderId && conversation.sellerId !== senderId) {
      return res.status(403).json({ message: "Forbidden." });
    }

    const senderRole = req.session.role === "seller" ? "seller" : "buyer";
    const text = sanitizeText(req.body?.text);
    if (!text) return res.status(400).json({ message: "Message text is required." });

    const message = await Message.create({
      conversationId: conversation._id,
      senderId,
      senderRole,
      text,
    });

    conversation.lastMessage = text;
    conversation.lastMessageAt = message.createdAt;
    await conversation.save();

    req.app.locals.io?.to(`conversation:${conversation._id}`).emit("chat:message", message);
    req.app.locals.io?.to(`user:${conversation.buyerId}`).emit("chat:conversation-updated", conversation);
    req.app.locals.io?.to(`user:${conversation.sellerId}`).emit("chat:conversation-updated", conversation);

    return res.status(201).json({ message });
  } catch (err) {
    console.error("Message send error:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
