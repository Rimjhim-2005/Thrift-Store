const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    buyerId: { type: String, required: true, index: true },
    sellerId: { type: String, required: true, index: true },
    shopName: { type: String, default: "" },
    productId: { type: String, default: "" },
    productName: { type: String, default: "" },
    productPrice: { type: Number, default: 0 },
    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

conversationSchema.index({ buyerId: 1, sellerId: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model("Conversation", conversationSchema);
