import { useState, useEffect, useMemo } from "react";
import { assetUrl } from "../utils/assetUrl";
import "./ShopDetail.css";

const API = "http://localhost:5000/api";

const CONDITIONS = { Excellent: 5, "Very Good": 4, Good: 3, "New with tags": 5, "Like new": 4, "Like New": 4, Fair: 2, "Well loved": 2 };

const CATEGORIES = ["All", "Tops", "Bottoms", "Outerwear", "Dresses", "Sneakers", "Accessories"];

const FALLBACK_PALETTES = [
  "linear-gradient(135deg,#C9B99A 0%,#A08060 100%)",
  "linear-gradient(135deg,#2C2824 0%,#4A3728 100%)",
  "linear-gradient(135deg,#8A9E6B 0%,#5C6B3A 100%)",
  "linear-gradient(135deg,#6B8A9E 0%,#3A5C6B 100%)",
];

export default function ShopDetail({ shop, user, onUserUpdate, onBack, onProductClick, onMessageSeller }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [sort, setSort] = useState("default");
  const [localSearch, setLocalSearch] = useState("");
  const [remoteItems, setRemoteItems] = useState([]);
  const [remoteShop, setRemoteShop] = useState(null);
  const [fetchFailed, setFetchFailed] = useState(false);

  const storeKey = useMemo(() => {
    const k = shop?.slug || shop?.shopName || shop?.name || "";
    return k ? encodeURIComponent(k) : "";
  }, [shop?.slug, shop?.shopName, shop?.name]);

  useEffect(() => {
    if (!storeKey) {
      setRemoteItems([]);
      setRemoteShop(null);
      return;
    }
    let cancelled = false;
    fetch(`${API}/shops/store/${storeKey}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.shop) {
          if (!cancelled && data == null) setFetchFailed(true);
          return;
        }
        setFetchFailed(false);
        setRemoteShop(data.shop);
        const mapped = (data.items || []).map((it, i) => ({
          ...it,
          id: it.id || it._id,
          _id: it._id || it.id,
          palette: FALLBACK_PALETTES[i % FALLBACK_PALETTES.length],
          size: it.size || "—",
          tag: it.category || null,
          desc: it.description || "",
        }));
        setRemoteItems(mapped);
      })
      .catch(() => {
        if (!cancelled) setFetchFailed(true);
      });
    return () => { cancelled = true; };
  }, [storeKey]);

  useEffect(() => {
    if (!remoteShop?.id) return;
    const viewed = sessionStorage.getItem(`shop-view-${remoteShop.id}`);
    if (viewed) return;
    sessionStorage.setItem(`shop-view-${remoteShop.id}`, "1");
    fetch(`${API}/shops/${remoteShop.id}/view`, { method: "POST" }).catch(() => {});
  }, [remoteShop?.id]);

  const products = remoteItems;

  const filtered = products
    .filter((p) => activeCategory === "All" || p.category === activeCategory)
    .filter((p) => {
      if (!localSearch.trim()) return true;
      const q = localSearch.toLowerCase();
      return (p.name || "").toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "name") return (a.name || "").localeCompare(b.name || "");
      return 0;
    });

  const availableCategories = ["All", ...new Set(products.map((p) => p.category).filter(Boolean))];

  const display = {
    ...shop,
    name: remoteShop?.shopName || shop?.name,
    longDesc: remoteShop?.shopDescription || shop?.longDesc || "",
    tags: (remoteShop?.tags?.length ? remoteShop.tags : shop?.tags) || [],
    location: remoteShop?.location || shop?.location || "",
    items: remoteShop?.itemCount ?? shop?.items,
  };

  const headerStyle = remoteShop?.headerImageUrl
    ? {
        backgroundImage: `url(${assetUrl(remoteShop.headerImageUrl)})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : null;

  const wishlistIds = useMemo(() => new Set((user?.wishlist || []).map(String)), [user?.wishlist]);
  const [wishPopId, setWishPopId] = useState(null);

  const toggleWishlist = async (e, product) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) return;
    const pid = String(product._id || product.id);
    if (!pid) return;
    const inList = wishlistIds.has(pid);
    try {
      const res = await fetch(`${API}/auth/wishlist/${encodeURIComponent(pid)}`, {
        method: inList ? "DELETE" : "POST",
        credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json();
      onUserUpdate?.({ ...user, wishlist: data.wishlist || [] });
      if (!inList) {
        setWishPopId(pid);
        window.setTimeout(() => setWishPopId((cur) => (cur === pid ? null : cur)), 500);
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="shop-detail-page">

      <div className="sd-topbar">
        <button type="button" className="sd-back-btn" onClick={onBack}>← Back to Shops</button>
        <div className="sd-breadcrumb">
          <span onClick={onBack} className="sd-breadcrumb-link" role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onBack()}>Browse Shops</span>
          <span className="sd-breadcrumb-sep">›</span>
          <span>{display.name}</span>
        </div>
      </div>

      <div
        className={`sd-banner ${!headerStyle ? shop?.banner || "" : ""}`}
        style={headerStyle || undefined}
      >
        <div className="sd-banner-overlay" />
      </div>

      <div className="sd-header-wrap">
        <div className="sd-header">
          <div className="sd-logo-wrap">
            {remoteShop?.shopLogoUrl ? (
              <img src={assetUrl(remoteShop.shopLogoUrl)} alt="" className="sd-logo-img" />
            ) : (
              <div className="sd-logo">{shop?.logo || "🏪"}</div>
            )}
          </div>
          <div className="sd-header-info">
            <div className="sd-header-top">
              <div>
                <h1 className="sd-shop-name">{display.name}</h1>
                <p className="sd-shop-location">📍 {display.location || "—"}</p>
              </div>
              <div className="sd-header-badges">
                <div className="sd-rating">
                  <span className="sd-stars">{"★".repeat(Math.round(shop?.rating || 4.8))}</span>
                  <span className="sd-rating-num">{shop?.rating ?? 4.8}</span>
                  <span className="sd-rating-count">({shop?.reviews ?? 0} reviews)</span>
                </div>
                <div className="sd-verified">✓ Verified Shop</div>
              </div>
            </div>
            <div className="sd-shop-tags">
              {display.tags.map((t) => (
                <span key={t} className="sd-tag">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="sd-body">

        <aside className="sd-sidebar">
          <div className="sd-sidebar-card">
            <h3 className="sd-sidebar-title">About the Shop</h3>
            <p className="sd-about-text">{display.longDesc || "—"}</p>
            {fetchFailed && remoteItems.length === 0 && (
              <p className="sd-api-hint">No live listings yet — check back soon.</p>
            )}
          </div>

          <div className="sd-sidebar-card">
            <h3 className="sd-sidebar-title">Shop Details</h3>
            <div className="sd-detail-list">
              <div className="sd-detail-row">
                <span className="sd-detail-icon">📍</span>
                <span>{shop?.address || display.location || "—"}</span>
              </div>
              <div className="sd-detail-row">
                <span className="sd-detail-icon">🕐</span>
                <span>{shop?.hours || "—"}</span>
              </div>
              <div className="sd-detail-row">
                <span className="sd-detail-icon">📞</span>
                <span>{shop?.phone || "—"}</span>
              </div>
              <div className="sd-detail-row">
                <span className="sd-detail-icon">✉️</span>
                <span>{shop?.email || "—"}</span>
              </div>
              <div className="sd-detail-row">
                <span className="sd-detail-icon">📅</span>
                <span>Est. {shop?.since || "—"}</span>
              </div>
            </div>
          </div>

          <div className="sd-sidebar-card sd-stat-card">
            <div className="sd-stat">
              <span className="sd-stat-num">{display.items ?? products.length}</span>
              <span className="sd-stat-label">Listed Items</span>
            </div>
            <div className="sd-stat">
              <span className="sd-stat-num">{shop?.reviews ?? "—"}</span>
              <span className="sd-stat-label">Reviews</span>
            </div>
            <div className="sd-stat">
              <span className="sd-stat-num">{shop?.since ?? "—"}</span>
              <span className="sd-stat-label">Est.</span>
            </div>
          </div>

          <div className="sd-contact-row">
            <button type="button" className="sd-contact-btn" onClick={() => onMessageSeller?.(shop, null)}>Message Shop Owner</button>
          </div>
        </aside>

        <div className="sd-products">
          <div className="sd-shop-search">
            <input
              type="search"
              className="sd-shop-search-input"
              placeholder="Filter items in this shop…"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </div>
          <div className="sd-products-header">
            <div className="sd-category-filters">
              {availableCategories.filter((c) => c === "All" || CATEGORIES.includes(c)).map((cat) => (
                <button
                  key={cat}
                  type="button"
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
            {filtered.map((product) => {
              const rawImg = product.images?.[0];
              const imgStyle = rawImg
                ? { backgroundImage: `url(${assetUrl(rawImg)})`, backgroundSize: "cover", backgroundPosition: "center" }
                : { background: product.palette };
              const condNum = CONDITIONS[product.condition] || 3;
              const pid = String(product._id || product.id);
              const liked = wishlistIds.has(pid);
              return (
                <div
                  key={product.id || product._id}
                  className="sd-product-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => onProductClick(product)}
                  onKeyDown={(e) => e.key === "Enter" && onProductClick(product)}
                >
                  <div className="sd-product-img" style={imgStyle}>
                    {product.tag && <span className="sd-product-tag">{product.tag}</span>}
                    {user && (
                      <button
                        type="button"
                        className={`sd-wish-btn ${liked ? "liked" : ""} ${wishPopId === pid ? "wish-pop" : ""}`}
                        title={liked ? "Remove from wishlist" : "Save to wishlist"}
                        aria-pressed={liked}
                        onClick={(e) => toggleWishlist(e, product)}
                      >
                        <span className="sd-wish-icon">{liked ? "♥" : "♡"}</span>
                      </button>
                    )}
                    <div className="sd-product-img-overlay">
                      <span className="sd-product-view-btn">View Product</span>
                    </div>
                  </div>
                  <div className="sd-product-info">
                    <p className="sd-product-category">{product.category}</p>
                    <h3 className="sd-product-name">{product.name}</h3>
                    <div className="sd-product-meta">
                      <span className="sd-product-size">Size: {product.size}</span>
                      <span className={`sd-condition sd-condition-${condNum}`}>
                        {product.condition}
                      </span>
                    </div>
                    <div className="sd-product-footer">
                      <span className="sd-product-price">₹ {Number(product.price).toLocaleString()}</span>
                      <button
                        type="button"
                        className="sd-add-btn"
                        onClick={(e) => { e.stopPropagation(); onProductClick(product); }}
                      >
                        View →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
