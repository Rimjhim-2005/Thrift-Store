const mongoose = require("mongoose");

const sellerSchema = new mongoose.Schema(
  {
    userId:          { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    shopName:        { type: String, required: true, trim: true },
    shopDescription: { type: String, default: "" },
    location:        { type: String, default: "" },
    category:        { type: String, default: "" },
    isApproved:      { type: Boolean, default: false },
    approvalToken:   { type: String },
    approvedAt:      { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Seller", sellerSchema);
