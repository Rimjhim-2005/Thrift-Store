const mongoose = require("mongoose");

const buyerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    cart: [
      {
        productId: { type: String, required: true },
        name:      { type: String, default: "" },
        price:     { type: Number, default: 0 },
        image:     { type: String, default: "" },
        shopName:  { type: String, default: "" },
        quantity:  { type: Number, default: 1, min: 1 },
        stock:     { type: Number, default: null },
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
