const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        itemId:   { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
        name:     { type: String, required: true },
        price:    { type: Number, required: true },
        quantity: { type: Number, default: 1 },
        image:    { type: String, default: "" },
      },
    ],
    total:   { type: Number, required: true },
    status:  { type: String, enum: ["pending", "confirmed", "shipped", "delivered"], default: "pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
