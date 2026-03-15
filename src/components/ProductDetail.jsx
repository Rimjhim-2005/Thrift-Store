import { useState } from "react";
import useAppStore from "../store/useAppStore";
import "./ProductDetail.css";

const CONDITIONS = { Excellent: 5, "Very Good": 4, Good: 3 };
const CONDITION_DESC = {
  Excellent: "No visible wear. Like new.",
  "Very Good": "Minor signs of wear. Well cared for.",
  Good: "Normal wear consistent with age.",
};

export default function ProductDetail({ product, onBackToShop, onRelatedProduct, onShopClick, cart, setCart }) {
  const [activeImg, setActiveImg]     = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [qty, setQty]                 = useState(1);

  // Get store functions
  const { addToCart } = useAppStore();

  const thumbPalettes = [
    product.image,
    product.image,
    product.image,
    product.image,
  ];

  const handleAddToCart = async () => {
    const result = await addToCart(product._id, qty);
    if (result.success) {
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2500);
      setQty(1);
    }
  };

  const cartCount = cart.reduce((acc, i) => acc + (i.qty || i.quantity || 1), 0);

  // Get related products - same category
  const relatedProducts = [];

  return (
    <div className="product-detail-page">

      {/* ── Topbar ── */}
      <div className="pd-topbar">
        <button className="pd-back-btn" onClick={onBackToShop}>
          ← Back to Items
        </button>
        <div className="pd-breadcrumb">
          <span className="pd-breadcrumb-link" onClick={() => onShopClick(product)}>
            {product.category}
          </span>
          <span className="pd-breadcrumb-sep">›</span>
          <span>{product.name}</span>
        </div>
        {cartCount > 0 && (
          <div className="pd-cart-indicator">
            🛍 <span>{cartCount}</span> in cart
          </div>
        )}
      </div>

      <div className="pd-body">
        {/* ── Gallery ── */}
        <div className="pd-gallery">
          <div className="pd-thumbs">
            {thumbPalettes.map((pal, i) => (
              <div
                key={i}
                className={`pd-thumb ${activeImg === i ? "active" : ""}`}
                style={{ backgroundImage: `url(${pal})`, backgroundSize: 'cover' }}
                onClick={() => setActiveImg(i)}
              />
            ))}
          </div>
          <div className="pd-main-img" style={{ backgroundImage: `url(${thumbPalettes[activeImg]})`, backgroundSize: 'cover' }}>
            {product.tag && <span className="pd-img-tag">{product.tag}</span>}
            <div className="pd-img-label">📷 Product Image</div>
          </div>
        </div>

        {/* ── Info ── */}
        <div className="pd-info">
          <div className="pd-info-header">
            <p className="pd-category">{product.category}</p>
            <h1 className="pd-product-name">{product.name}</h1>
            <div className="pd-price-row">
              <span className="pd-price">₱ {(product.price || 0).toLocaleString()}</span>
              <span className="pd-condition-badge">{product.condition || "Good"}</span>
            </div>
          </div>

          {/* Tags */}
          {product.tags?.length > 0 && (
            <div className="pd-tags-section">
              <p className="pd-section-label">Tags</p>
              <div className="pd-tags-list">
                {product.tags.map((t) => (
                  <span key={t} className="pd-tag-pill">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Condition */}
          <div className="pd-condition-section">
            <p className="pd-section-label">Condition</p>
            <div className="pd-condition-bar">
              {["Good","Very Good","Excellent"].map((c) => (
                <div key={c} className={`pd-condition-step ${CONDITIONS[product.condition || "Good"] >= CONDITIONS[c] ? "filled" : ""}`} />
              ))}
            </div>
            <p className="pd-condition-desc">
              <strong>{product.condition || "Good"}</strong> — {CONDITION_DESC[product.condition || "Good"]}
            </p>
          </div>

          {/* Size */}
          <div className="pd-section">
            <p className="pd-section-label">Availability</p>
            <div className="pd-size-options">
              <div className="pd-size-pill active">{product.stock || 1} in stock</div>
              <p className="pd-size-note">Limited availability.</p>
            </div>
          </div>

          {/* Qty */}
          <div className="pd-section">
            <p className="pd-section-label">Quantity</p>
            <div className="pd-qty-row">
              <button className="pd-qty-btn" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <span className="pd-qty-num">{qty}</span>
              <button className="pd-qty-btn" onClick={() => setQty(Math.min(product.stock || 1, qty + 1))}>+</button>
              <span className="pd-qty-note">Max {product.stock || 1}</span>
            </div>
          </div>

          {/* CTA */}
          <div className="pd-cta-row">
            <button
              className={`pd-add-to-cart ${addedToCart ? "added" : ""}`}
              onClick={handleAddToCart}
              disabled={addedToCart}
            >
              {addedToCart ? "✓ Added to Cart!" : "Add to Cart"}
            </button>
            <button className="pd-wishlist-btn" title="Save to wishlist">♡</button>
          </div>

          <p className="pd-shipping-note">
            🌿 Contact the seller to arrange pickup or delivery. No platform fee — you deal directly.
          </p>

          {/* Description */}
          <div className="pd-description">
            <p className="pd-section-label">Description</p>
            <p className="pd-desc-text">{product.description || product.desc || "No description available."}</p>
          </div>

          {/* Details table */}
          <div className="pd-details-table">
            <p className="pd-section-label">Item Details</p>
            <div className="pd-details-grid">
              {[
                ["Category",  product.category],
                ["Seller",    product.seller],
                ["Condition", product.condition || "Good"],
                ["Stock",     product.stock || 1],
                ["Listed",    new Date(product.createdAt).toLocaleDateString()],
                ["ID",        product._id?.substring(0, 8)],
              ].filter(([,v]) => v).map(([k, v]) => (
                <div key={k} className="pd-detail-row">
                  <span className="pd-detail-key">{k}</span>
                  <span className="pd-detail-val">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
