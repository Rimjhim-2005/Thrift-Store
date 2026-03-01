import { useState } from "react";
import { SHOPS, PRODUCTS } from "../data";
import "./ProductDetail.css";

const CONDITIONS = { Excellent: 5, "Very Good": 4, Good: 3 };
const CONDITION_DESC = {
  Excellent: "No visible wear. Like new.",
  "Very Good": "Minor signs of wear. Well cared for.",
  Good: "Normal wear consistent with age.",
};

export default function ProductDetail({ product, onBackToShop, onRelatedProduct, onShopClick, cart, setCart }) {
  const shop = SHOPS.find((s) => s.id === product.shopId);
  const relatedProducts = PRODUCTS.filter(
    (p) => p.shopId === product.shopId && p.id !== product.id
  ).slice(0, 3);

  const [activeImg, setActiveImg]     = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [qty, setQty]                 = useState(1);

  const thumbPalettes = [
    product.palette,
    product.palette.replace("135deg", "160deg"),
    product.palette.replace("0%", "15%"),
    product.palette.replace("100%", "90%"),
  ];

  const handleAddToCart = () => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) return prev.map((i) => i.id === product.id ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { ...product, qty }];
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  };

  const cartCount = cart.reduce((acc, i) => acc + i.qty, 0);

  return (
    <div className="product-detail-page">

      {/* ── Topbar ── */}
      <div className="pd-topbar">
        {/* FIXED: always goes back to shop */}
        <button className="pd-back-btn" onClick={onBackToShop}>
          ← Back to {shop.name}
        </button>
        <div className="pd-breadcrumb">
          <span className="pd-breadcrumb-link" onClick={() => onShopClick(shop)}>
            {shop.name}
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
                style={{ background: pal }}
                onClick={() => setActiveImg(i)}
              />
            ))}
          </div>
          <div className="pd-main-img" style={{ background: thumbPalettes[activeImg] }}>
            {product.tag && <span className="pd-img-tag">{product.tag}</span>}
            <div className="pd-img-label">📷 Placeholder Image</div>
          </div>
        </div>

        {/* ── Info ── */}
        <div className="pd-info">
          <div className="pd-info-header">
            <p className="pd-category">{product.category}</p>
            <h1 className="pd-product-name">{product.name}</h1>
            <div className="pd-price-row">
              <span className="pd-price">₱ {product.price.toLocaleString()}</span>
              <span className="pd-condition-badge">{product.condition}</span>
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
                <div key={c} className={`pd-condition-step ${CONDITIONS[product.condition] >= CONDITIONS[c] ? "filled" : ""}`} />
              ))}
            </div>
            <p className="pd-condition-desc">
              <strong>{product.condition}</strong> — {CONDITION_DESC[product.condition]}
            </p>
          </div>

          {/* Size */}
          <div className="pd-section">
            <p className="pd-section-label">Size</p>
            <div className="pd-size-options">
              <div className="pd-size-pill active">{product.size}</div>
              <p className="pd-size-note">One-of-a-kind — only 1 available.</p>
            </div>
          </div>

          {/* Qty */}
          <div className="pd-section">
            <p className="pd-section-label">Quantity</p>
            <div className="pd-qty-row">
              <button className="pd-qty-btn" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <span className="pd-qty-num">{qty}</span>
              <button className="pd-qty-btn" onClick={() => setQty(Math.min(1, qty + 1))}>+</button>
              <span className="pd-qty-note">Only 1 available</span>
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
            🌿 Contact the shop to arrange pickup or delivery. No platform fee — you deal directly.
          </p>

          {/* Description */}
          <div className="pd-description">
            <p className="pd-section-label">Description</p>
            <p className="pd-desc-text">{product.desc}</p>
          </div>

          {/* Details table */}
          <div className="pd-details-table">
            <p className="pd-section-label">Item Details</p>
            <div className="pd-details-grid">
              {[
                ["Category",  product.category],
                ["Size",      product.size],
                ["Condition", product.condition],
                ["Color",     product.color],
                ["Style",     product.style],
                ["Era",       product.era],
                ["Listed by", shop.name],
                ["Location",  shop.location],
              ].filter(([,v]) => v).map(([k, v]) => (
                <div key={k} className="pd-detail-row">
                  <span className="pd-detail-key">{k}</span>
                  <span className="pd-detail-val">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Shop card */}
          <div className="pd-shop-card" onClick={() => onShopClick(shop)}>
            <div className="pd-shop-logo">{shop.logo}</div>
            <div className="pd-shop-info">
              <p className="pd-shop-name">{shop.name}</p>
              <p className="pd-shop-location">📍 {shop.location}</p>
              <div className="pd-shop-rating">
                <span className="pd-shop-stars">{"★".repeat(Math.round(shop.rating))}</span>
                <span>{shop.rating} · {shop.reviews} reviews</span>
              </div>
            </div>
            <div className="pd-shop-arrow">→</div>
          </div>
        </div>
      </div>

      {/* ── Related products ── */}
      {relatedProducts.length > 0 && (
        <div className="pd-related">
          <h2 className="pd-related-title">More from <em>{shop.name}</em></h2>
          <div className="pd-related-grid">
            {relatedProducts.map((p) => (
              <div key={p.id} className="pd-related-card" onClick={() => onRelatedProduct(p)}>
                <div className="pd-related-img" style={{ background: p.palette }} />
                <div className="pd-related-info">
                  <p className="pd-related-category">{p.category}</p>
                  <p className="pd-related-name">{p.name}</p>
                  <p className="pd-related-price">₱ {p.price.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
