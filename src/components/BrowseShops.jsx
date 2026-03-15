import { useState, useEffect, useRef } from "react";
import "./BrowseShops.css";

const FILTERS = ["All", "Vintage", "Streetwear", "Luxury Resale", "Kids & Baby", "Accessories", "Near Me"];

function ProductCard({ product, delay, onProductClick }) {
  return (
    <div className={`shop-card reveal reveal-delay-${delay}`} onClick={() => onProductClick(product)}>
      <div className={`shop-card-banner`} style={{ backgroundImage: `url(${product.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="shop-logo">{product.category?.[0]?.toUpperCase()}</div>
      </div>
      <div className="shop-card-body">
        <h3 className="shop-name">{product.name}</h3>
        <p className="shop-location">📍 {product.location || "Location TBA"}</p>
        <p className="shop-desc">{product.description?.substring(0, 60) || "No description"}...</p>
        <div className="shop-tags">
          {product.tags?.slice(0, 2).map((tag) => <span key={tag} className="shop-tag">{tag}</span>)}
        </div>
        <div className="shop-footer">
          <p className="shop-items"><span>${product.price}</span></p>
          <button className="shop-cta" onClick={(e) => { e.stopPropagation(); onProductClick(product); }}>
            View Item
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BrowseShops({ onShopClick, products = [] }) {
  const [activeFilter, setActiveFilter] = useState("All");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); } }),
      { threshold: 0.1 }
    );
    sectionRef.current?.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Filter products based on selected filter
  useEffect(() => {
    if (activeFilter === "All") {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter((p) => p.tags?.includes(activeFilter) || p.category === activeFilter));
    }
  }, [activeFilter, products]);

  return (
    <section id="browse" ref={sectionRef}>
      <div className="browse-header reveal">
        <div>
          <span className="section-eyebrow">Directory</span>
          <h2 className="section-title-lg">Browse <em>Thrift Shops</em></h2>
        </div>
        <a href="#" className="browse-view-all">View all items →</a>
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
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product, i) => (
            <ProductCard key={product._id} product={product} delay={(i % 3) + 1} onProductClick={onShopClick} />
          ))
        ) : (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "2rem", color: "#999" }}>
            No items found. Please try a different filter.
          </div>
        )}
      </div>

      <div className="browse-load-more reveal">
        <button className="btn-load-more">Load More Items</button>
      </div>
    </section>
  );
}
