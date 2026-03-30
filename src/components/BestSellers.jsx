import { useState, useEffect, useRef } from "react";
import "./BestSellers.css";

const API = "http://localhost:5000/api";

function ItemCard({ item, delay, onItemClick }) {
  const displayItem = {
    name: item.itemName || item.name,
    price: item.itemPrice || item.price,
    category: item.itemCategory || item.category,
    viewCount: item.itemViewCount || item.viewCount || 0,
    image: item.images?.[0] || "",
    seller: item.sellerId?.shopName || "Shop",
    ...item,
  };

  return (
    <div className={`bestseller-card reveal reveal-delay-${delay}`} onClick={() => onItemClick?.(item)}>
      <div className="bestseller-card-image">
        {displayItem.image ? (
          <img src={`http://localhost:5000${displayItem.image}`} alt={displayItem.name} />
        ) : (
          <div className="bestseller-card-placeholder">📦</div>
        )}
        <div className="bestseller-badge">🔥 Hot</div>
      </div>
      <div className="bestseller-card-body">
        <h3 className="bestseller-name">{displayItem.name}</h3>
        <p className="bestseller-category">{displayItem.category}</p>
        <p className="bestseller-seller">{displayItem.seller}</p>
        <div className="bestseller-footer">
          <span className="bestseller-price">₹ {Number(displayItem.price || 0).toLocaleString()}</span>
          <button className="bestseller-view-btn" onClick={(e) => { e.stopPropagation(); onItemClick?.(item); }}>
            View
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BestSellers({ onItemClick }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef(null);

  // Fetch top most viewed items
  useEffect(() => {
    const fetchTopItems = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/analytics/top-items?limit=6`, { credentials: "include" });
        const data = await res.ok ? await res.json() : { items: [] };
        // Sort by viewCount descending (most viewed first)
        const sorted = (data.items || []).sort((a, b) => (b.itemViewCount || b.viewCount || 0) - (a.itemViewCount || a.viewCount || 0));
        setItems(sorted);
      } catch (err) {
        console.error("Failed to fetch top items:", err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTopItems();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); } }),
      { threshold: 0.1 }
    );
    sectionRef.current?.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  return (
    <section id="bestsellers" className="bestsellers-section" ref={sectionRef}>
      <div className="bestsellers-header reveal">
        <div>
          <span className="section-eyebrow">Trending Now</span>
          <h2 className="section-title-lg">Hot <em>Items</em></h2>
        </div>
        <p className="bestsellers-sub">The hottest items people are eyeing on Thriftly right now</p>
      </div>

      <div className="bestsellers-grid">
        {loading ? (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 20px", color: "#666" }}>
            <p>⏳ Loading best items...</p>
          </div>
        ) : items.length > 0 ? (
          items.map((item, i) => (
            <ItemCard key={item._id || item.id} item={item} delay={(i % 3) + 1} onItemClick={onItemClick} />
          ))
        ) : (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 20px", color: "#666" }}>
            <p>No items available yet. Check back soon!</p>
          </div>
        )}
      </div>
    </section>
  );
}
