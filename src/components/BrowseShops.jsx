import { useState, useEffect, useRef } from "react";
import "./BrowseShops.css";

const API = "http://localhost:5000/api";
const IMG_BASE = "http://localhost:5000";
const FILTERS = ["All", "Vintage", "Streetwear", "Luxury Resale", "Kids & Baby", "Accessories", "Near Me"];

function imgSrc(url) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${IMG_BASE}${url}`;
}

function ShopCard({ shop, delay, onShopClick }) {
  // Map API shop structure to display fields
  const displayShop = {
    name: shop.shopName,
    location: shop.location || "Location not specified",
    desc: shop.shopDescription || "Browse our curated collection",
    tags: shop.tags && shop.tags.length > 0 ? shop.tags : ["Thrifted"],
    items: 0,
    ...shop,
  };

  const bannerUrl = imgSrc(shop.headerImageUrl);
  const logoUrl = imgSrc(shop.shopLogoUrl);

  return (
    <div className={`shop-card reveal reveal-delay-${delay}`} onClick={() => onShopClick(displayShop)}>
      <div
        className={`shop-card-banner ${!bannerUrl ? "banner-default" : ""}`}
        style={bannerUrl ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      >
        {logoUrl ? (
          <img src={logoUrl} alt="" className="shop-logo-img" />
        ) : (
          <div className="shop-logo">🛍️</div>
        )}
      </div>
      <div className="shop-card-body">
        <h3 className="shop-name">{displayShop.name}</h3>
        <p className="shop-location">📍 {displayShop.location}</p>
        <p className="shop-desc">{displayShop.desc}</p>
        <div className="shop-tags">
          {displayShop.tags.slice(0, 3).map((tag) => <span key={tag} className="shop-tag">{tag}</span>)}
        </div>
        <div className="shop-footer">
          <p className="shop-items"><span>{displayShop.viewCount || 0}</span> views · <span>{displayShop.orderCount || 0}</span> orders</p>
          <button className="shop-cta" onClick={(e) => { e.stopPropagation(); onShopClick(displayShop); }}>
            View Shop
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BrowseShops({ onShopClick, onViewAll }) {
  const [activeFilter, setActiveFilter] = useState("All");
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef(null);

  // Fetch top shops from API
  useEffect(() => {
    const fetchTopShops = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/shops`, { credentials: "include" });
        const data = res.ok ? await res.json() : { shops: [] };
        // Sort by viewCount descending (most viewed first), take top 6
        const sorted = (data.shops || [])
          .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
          .slice(0, 6);
        setShops(sorted);
      } catch (err) {
        console.error("Failed to fetch top shops:", err);
        setShops([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTopShops();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); } }),
      { threshold: 0.1 }
    );
    sectionRef.current?.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [shops]);

  return (
    <section id="browse" ref={sectionRef}>
      <div className="browse-header reveal">
        <div>
          <span className="section-eyebrow">Directory</span>
          <h2 className="section-title-lg">Browse <em>Thrift Shops</em></h2>
        </div>
        <button type="button" className="browse-view-all" onClick={() => onViewAll?.()}>View all shops →</button>
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
        {loading ? (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 20px", color: "#666" }}>
            <p>Loading best shops...</p>
          </div>
        ) : shops.length > 0 ? (
          shops.map((shop, i) => (
            <ShopCard key={shop._id || shop.id} shop={shop} delay={(i % 3) + 1} onShopClick={onShopClick} />
          ))
        ) : (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 20px", color: "#666" }}>
            <p>No shops available yet. Check back soon!</p>
          </div>
        )}
      </div>

      <div className="browse-load-more reveal">
        <button type="button" className="btn-load-more" onClick={() => onViewAll?.()}>Load More Shops</button>
      </div>
    </section>
  );
}
