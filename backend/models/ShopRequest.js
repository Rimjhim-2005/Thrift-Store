const mongoose = require("mongoose");

const shopRequestSchema = new mongoose.Schema(
  {
    firstName:   { type: String, required: true, trim: true },
    lastName:    { type: String, required: true, trim: true },
    email:       { type: String, required: true, lowercase: true, trim: true },
    shopName:    { type: String, required: true, trim: true },
    location:    { type: String, default: "" },
    category:    { type: String, default: "" },
    description: { type: String, default: "" },
    token:       { type: String, required: true, unique: true },
    rejectToken: { type: String, unique: true, sparse: true },
    status:      { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ShopRequest", shopRequestSchema);
