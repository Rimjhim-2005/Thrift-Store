const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    senderId: { type: String, required: true },
    senderRole: { type: String, enum: ["buyer", "seller", "system"], default: "buyer" },
    text: { type: String, default: "" },
    meta: {
      type: {
        cardType: { type: String, default: "" },
        productId: { type: String, default: "" },
        productName: { type: String, default: "" },
        productPrice: { type: Number, default: 0 },
      },
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
