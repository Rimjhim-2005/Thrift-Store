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

function isMongoId(val) {
  return /^[a-f\d]{24}$/i.test(String(val || ""));
}

function emitChat(io, conversation, messageDoc) {
  if (!io) return;
  const cid = String(conversation._id);
  io.to(`conversation:${cid}`).emit("chat:message", messageDoc);
  io.to(`user:${conversation.buyerId}`).emit("chat:conversation-updated", conversation);
  const sid = String(conversation.sellerId);
  if (isMongoId(sid)) io.to(`user:${sid}`).emit("chat:conversation-updated", conversation);
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
    const buyerId = String(req.session.userId);
    const shopName = sanitizeText(req.body?.shopName);
    const sellerEmailFallback = sanitizeText(req.body?.sellerEmail);
    let rawSellerId = sanitizeText(req.body?.sellerId);

    // Phase 1: Improved conversation initialization with proper seller ID lookup
    let sellerRecord = null;
    if (shopName) sellerRecord = await Seller.findOne({ shopName });
    if (!sellerRecord && rawSellerId && isMongoId(rawSellerId)) {
      sellerRecord = await Seller.findOne({ userId: rawSellerId });
    }

    let conversationSellerId;
    // Priority: Always prefer actual userId from seller record
    if (sellerRecord?.userId) {
      conversationSellerId = String(sellerRecord.userId);
    } else if (rawSellerId && isMongoId(rawSellerId) && !rawSellerId.startsWith("shop")) {
      // Direct ObjectID passed
      conversationSellerId = rawSellerId;
    } else if (shopName) {
      // Last resort: For non-ObjectID shop identifiers
      conversationSellerId = `shop:${shopName}`;
    } else {
      conversationSellerId = `shop:unknown`;
    }

    const createCheckoutSummary = !!req.body?.createCheckoutSummary;
    const checkoutItems = Array.isArray(req.body?.checkoutItems) ? req.body.checkoutItems : [];
    const checkoutTotal = Number(req.body?.checkoutTotal) || 0;
    const orderId = sanitizeText(req.body?.orderId || "");

    let productId = sanitizeText(req.body?.productId || "");
    const productName = sanitizeText(req.body?.productName);
    const productPrice = Number(req.body?.productPrice) || 0;
    const createIntentCard = !!req.body?.createIntentCard;

    if (createCheckoutSummary) {
      productId = orderId ? `order-${orderId}` : `checkout-${buyerId}`;
    }

    let conversation = await Conversation.findOne({ buyerId, sellerId: conversationSellerId, productId });
    if (!conversation) {
      conversation = await Conversation.create({
        buyerId,
        sellerId: conversationSellerId,
        shopName: shopName || sellerRecord?.shopName || "",
        productId,
        productName: createCheckoutSummary
          ? `Checkout (${checkoutItems.length || 0} items)`
          : productName,
        productPrice: createCheckoutSummary ? checkoutTotal : productPrice,
      });
    } else if (!conversation.shopName && (shopName || sellerRecord?.shopName)) {
      conversation.shopName = shopName || sellerRecord?.shopName || "";
      await conversation.save();
    }

    const io = req.app.locals.io;

    if (createCheckoutSummary && checkoutItems.length) {
      const lineItems = checkoutItems
        .map((row) => ({
          productId: sanitizeText(row.productId || row._id || row.id || ""),
          name: sanitizeText(row.name || row.title || "Item"),
          price: Number(row.price) || 0,
          quantity: Math.max(1, Number(row.quantity || row.qty || 1)),
        }))
        .filter((r) => r.name || r.productId);

      const already = await Message.findOne({
        conversationId: conversation._id,
        "meta.cardType": "checkout_summary",
        ...(orderId ? { "meta.orderId": orderId } : {}),
      });

      if (!already && lineItems.length) {
        // Format checkout message with detailed item information
        const itemDetails = lineItems
          .map((l) => {
            const itemTotal = l.price * l.quantity;
            const qtyText = l.quantity > 1 ? ` (qty: ${l.quantity})` : "";
            return `Item: ${l.name} (ID: ${l.productId})\nPrice: ₹${itemTotal.toLocaleString()}${qtyText}`;
          })
          .join("\n");
        
        const summary = lineItems.length === 1 
          ? `Purchase intent: ${lineItems[0].name} (ID: ${lineItems[0].productId}) - ₹${(lineItems[0].price * lineItems[0].quantity).toLocaleString()}`
          : `Purchase intent: Order for ${lineItems.length} items - ₹${checkoutTotal.toLocaleString()}`;
        
        const text = `${summary}\n${itemDetails}`;
        const firstMessage = await Message.create({
          conversationId: conversation._id,
          senderId: buyerId,
          senderRole: "buyer",
          text,
          meta: {
            cardType: "checkout_summary",
            lineItems,
            totalPrice: checkoutTotal,
            orderId,
          },
        });

        conversation.lastMessage = text;
        conversation.lastMessageAt = firstMessage.createdAt;
        await conversation.save();

        emitChat(io, conversation, firstMessage);

        (async () => {
          try {
            let sellerEmail = sellerEmailFallback;
            if (!sellerEmail && isMongoId(conversationSellerId)) {
              const u = await User.findById(conversationSellerId);
              sellerEmail = u?.email || "";
            }
            if (sellerEmail) {
              const lines = lineItems
                .map((l) => `• ${l.name} x${l.quantity} — P${(l.price * l.quantity).toLocaleString()}`)
                .join("\n");
              await transporter.sendMail({
                from: `"Thriftly" <${process.env.EMAIL_USER}>`,
                to: sellerEmail,
                subject: "New checkout from a buyer",
                text: `A buyer completed checkout and sent this cart:\n\n${lines}\n\nTotal: P${checkoutTotal.toLocaleString()}\n\nPlease log in to Thriftly to coordinate the sale.`,
              });
            }
          } catch (emailErr) {
            console.error("Checkout summary email failed:", emailErr.message);
          }
        })();
      }
    } else if (createIntentCard) {
      const alreadyHasCard = await Message.findOne({
        conversationId: conversation._id,
        "meta.cardType": "purchase_intent",
      });

      if (!alreadyHasCard) {
        const text = `Purchase intent: ${productName || "Item"} (ID: ${sanitizeText(req.body?.productId || "") || "N/A"}) - P${productPrice.toLocaleString()}`;
        const firstMessage = await Message.create({
          conversationId: conversation._id,
          senderId: buyerId,
          senderRole: "buyer",
          text,
          meta: {
            cardType: "purchase_intent",
            productId: sanitizeText(req.body?.productId || ""),
            productName,
            productPrice,
          },
        });

        conversation.lastMessage = text;
        conversation.lastMessageAt = firstMessage.createdAt;
        await conversation.save();

        emitChat(io, conversation, firstMessage);

        (async () => {
          try {
            let sellerEmail = sellerEmailFallback;
            if (!sellerEmail && isMongoId(conversationSellerId)) {
              const sellerUser = await User.findById(conversationSellerId);
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

    emitChat(req.app.locals.io, conversation, message);

    return res.status(201).json({ message });
  } catch (err) {
    console.error("Message send error:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
