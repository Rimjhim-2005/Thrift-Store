const mongoose = require("mongoose");

const lineItemSchema = new mongoose.Schema(
  {
    productId: { type: String, default: "" },
    name: { type: String, default: "" },
    price: { type: Number, default: 0 },
    quantity: { type: Number, default: 1 },
  },
  { _id: false }
);

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
        lineItems: { type: [lineItemSchema], default: undefined },
        totalPrice: { type: Number, default: 0 },
        orderId: { type: String, default: "" },
      },
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
