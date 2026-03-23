const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    shopId: { type: String, default: "" },
    buyerContactInfo: {
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      address: { type: String, default: "" },
    },
    items: [
      {
        itemId:   { type: String, default: "" },
        name:     { type: String, required: true },
        price:    { type: Number, required: true },
        quantity: { type: Number, default: 1 },
        image:    { type: String, default: "" },
      },
    ],
    totalPrice:   { type: Number, required: true },
    total: { type: Number, default: 0 },
    status:  { type: String, enum: ["pending", "confirmed", "shipped", "delivered"], default: "pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
