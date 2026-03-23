import { useState } from "react";
import { PRODUCTS } from "../data";
import "./ShopDetail.css";

const CONDITIONS = { Excellent: 5, "Very Good": 4, Good: 3 };

const CATEGORIES = ["All", "Tops", "Bottoms", "Outerwear", "Dresses", "Sneakers", "Accessories"];

export default function ShopDetail({ shop, onBack, onProductClick, onMessageSeller }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [sort, setSort] = useState("default");

  const products = PRODUCTS.filter((p) => p.shopId === shop.id);

  const filtered = products
    .filter((p) => activeCategory === "All" || p.category === activeCategory)
    .sort((a, b) => {
      if (sort === "price-asc")  return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "name")       return a.name.localeCompare(b.name);
      return 0;
    });

  const availableCategories = ["All", ...new Set(products.map((p) => p.category))];

  return (
    <div className="shop-detail-page">

      {/* ── Top bar ── */}
      <div className="sd-topbar">
        <button className="sd-back-btn" onClick={onBack}>← Back to Shops</button>
        <div className="sd-breadcrumb">
          <span onClick={onBack} className="sd-breadcrumb-link">Browse Shops</span>
          <span className="sd-breadcrumb-sep">›</span>
          <span>{shop.name}</span>
        </div>
      </div>

      {/* ── Banner ── */}
      <div className={`sd-banner ${shop.banner}`}>
        <div className="sd-banner-overlay" />
      </div>

      {/* ── Shop header ── */}
      <div className="sd-header-wrap">
        <div className="sd-header">
          <div className="sd-logo-wrap">
            <div className="sd-logo">{shop.logo}</div>
          </div>
          <div className="sd-header-info">
            <div className="sd-header-top">
              <div>
                <h1 className="sd-shop-name">{shop.name}</h1>
                <p className="sd-shop-location">📍 {shop.location}</p>
              </div>
              <div className="sd-header-badges">
                <div className="sd-rating">
                  <span className="sd-stars">{"★".repeat(Math.round(shop.rating))}</span>
                  <span className="sd-rating-num">{shop.rating}</span>
                  <span className="sd-rating-count">({shop.reviews} reviews)</span>
                </div>
                <div className="sd-verified">✓ Verified Shop</div>
              </div>
            </div>
            <div className="sd-shop-tags">
              {shop.tags.map((t) => <span key={t} className="sd-tag">{t}</span>)}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body: sidebar + products ── */}
      <div className="sd-body">

        {/* Sidebar */}
        <aside className="sd-sidebar">
          <div className="sd-sidebar-card">
            <h3 className="sd-sidebar-title">About the Shop</h3>
            <p className="sd-about-text">{shop.longDesc}</p>
          </div>

          <div className="sd-sidebar-card">
            <h3 className="sd-sidebar-title">Shop Details</h3>
            <div className="sd-detail-list">
              <div className="sd-detail-row">
                <span className="sd-detail-icon">📍</span>
                <span>{shop.address}</span>
              </div>
              <div className="sd-detail-row">
                <span className="sd-detail-icon">🕐</span>
                <span>{shop.hours}</span>
              </div>
              <div className="sd-detail-row">
                <span className="sd-detail-icon">📞</span>
                <span>{shop.phone}</span>
              </div>
              <div className="sd-detail-row">
                <span className="sd-detail-icon">✉️</span>
                <span>{shop.email}</span>
              </div>
              <div className="sd-detail-row">
                <span className="sd-detail-icon">📅</span>
                <span>Est. {shop.since}</span>
              </div>
            </div>
          </div>

          <div className="sd-sidebar-card sd-stat-card">
            <div className="sd-stat">
              <span className="sd-stat-num">{shop.items}</span>
              <span className="sd-stat-label">Listed Items</span>
            </div>
            <div className="sd-stat">
              <span className="sd-stat-num">{shop.reviews}</span>
              <span className="sd-stat-label">Reviews</span>
            </div>
            <div className="sd-stat">
              <span className="sd-stat-num">{shop.since}</span>
              <span className="sd-stat-label">Est.</span>
            </div>
          </div>

          <button className="sd-contact-btn" onClick={() => onMessageSeller?.(shop, null)}>Message Shop Owner</button>
        </aside>

        {/* Products grid */}
        <div className="sd-products">
          <div className="sd-products-header">
            <div className="sd-category-filters">
              {availableCategories.filter(c => CATEGORIES.includes(c)).map((cat) => (
                <button
                  key={cat}
                  className={`sd-cat-btn ${activeCategory === cat ? "active" : ""}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="sd-sort-wrap">
              <span className="sd-results-count">{filtered.length} items</span>
              <select
                className="sd-sort-select"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="default">Sort: Default</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name">Name: A–Z</option>
              </select>
            </div>
          </div>

          <div className="sd-product-grid">
            {filtered.map((product) => (
              <div
                key={product.id}
                className="sd-product-card"
                onClick={() => onProductClick(product)}
              >
                {/* Placeholder image */}
                <div className="sd-product-img" style={{ background: product.palette }}>
                  {product.tag && <span className="sd-product-tag">{product.tag}</span>}
                  <div className="sd-product-img-overlay">
                    <span className="sd-product-view-btn">View Product</span>
                  </div>
                </div>
                <div className="sd-product-info">
                  <p className="sd-product-category">{product.category}</p>
                  <h3 className="sd-product-name">{product.name}</h3>
                  <div className="sd-product-meta">
                    <span className="sd-product-size">Size: {product.size}</span>
                    <span className={`sd-condition sd-condition-${CONDITIONS[product.condition]}`}>
                      {product.condition}
                    </span>
                  </div>
                  <div className="sd-product-footer">
                    <span className="sd-product-price">₱ {product.price.toLocaleString()}</span>
                    <button
                      className="sd-add-btn"
                      onClick={(e) => { e.stopPropagation(); onProductClick(product); }}
                    >
                      View →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
