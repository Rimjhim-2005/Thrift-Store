const mongoose = require("mongoose");

const buyerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    cart: [
      {
        itemId:   { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
        quantity: { type: Number, default: 1 },
      },
    ],
    purchaseHistory: [
      {
        itemId:      { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
        purchasedAt: { type: Date, default: Date.now },
        price:       { type: Number },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Buyer", buyerSchema);
