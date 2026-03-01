import { useState, useEffect, useRef } from "react";
import { SHOPS } from "../data";
import "./BrowseShops.css";

const FILTERS = ["All", "Vintage", "Streetwear", "Luxury Resale", "Kids & Baby", "Accessories", "Near Me"];

function ShopCard({ shop, delay, onShopClick }) {
  return (
    <div className={`shop-card reveal reveal-delay-${delay}`} onClick={() => onShopClick(shop)}>
      <div className={`shop-card-banner ${shop.banner}`}>
        <div className="shop-logo">{shop.logo}</div>
      </div>
      <div className="shop-card-body">
        <h3 className="shop-name">{shop.name}</h3>
        <p className="shop-location">📍 {shop.location}</p>
        <p className="shop-desc">{shop.desc}</p>
        <div className="shop-tags">
          {shop.tags.map((tag) => <span key={tag} className="shop-tag">{tag}</span>)}
        </div>
        <div className="shop-footer">
          <p className="shop-items"><span>{shop.items}</span> items listed</p>
          <button className="shop-cta" onClick={(e) => { e.stopPropagation(); onShopClick(shop); }}>
            View Shop
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BrowseShops({ onShopClick }) {
  const [activeFilter, setActiveFilter] = useState("All");
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); } }),
      { threshold: 0.1 }
    );
    sectionRef.current?.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="browse" ref={sectionRef}>
      <div className="browse-header reveal">
        <div>
          <span className="section-eyebrow">Directory</span>
          <h2 className="section-title-lg">Browse <em>Thrift Shops</em></h2>
        </div>
        <a href="#" className="browse-view-all">View all shops →</a>
      </div>

      <div className="browse-filters reveal">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`filter-btn ${activeFilter === f ? "active" : ""}`}
            onClick={() => setActiveFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="shops-grid">
        {SHOPS.map((shop, i) => (
          <ShopCard key={shop.id} shop={shop} delay={(i % 3) + 1} onShopClick={onShopClick} />
        ))}
      </div>

      <div className="browse-load-more reveal">
        <button className="btn-load-more">Load More Shops</button>
      </div>
    </section>
  );
}
