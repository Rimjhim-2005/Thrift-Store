import { useEffect, useState, useCallback } from "react";
import "./AllShopsDirectory.css";

const API = "http://localhost:5000/api";

export default function AllShopsDirectory({ onBack, onShopClick, filterTag = null }) {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTags, setActiveTags] = useState(filterTag ? [filterTag] : []);
  const [searching, setSearching] = useState(false);

  // Sync when parent changes filterTag (e.g. different dropdown click)
  useEffect(() => {
    setActiveTags(filterTag ? [filterTag] : []);
  }, [filterTag]);

  const toggleTag = (tag) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const loadShops = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      activeTags.forEach((t) => params.append("tag", t));
      const qs = params.toString() ? `?${params.toString()}` : "";
      const res = await fetch(`${API}/shops${qs}`);
      const data = await res.json();
      setShops(data.shops || []);
    } catch {
      setShops([]);
    } finally {
      setLoading(false);
    }
  }, [activeTags]);

  useEffect(() => {
    loadShops();
  }, [loadShops]);

  const runSearch = async () => {
    const q = search.trim();
    if (!q) {
      loadShops();
      return;
    }
    setSearching(true);
    try {
      const params = new URLSearchParams({ q });
      activeTags.forEach((t) => params.append("tag", t));
      const res = await fetch(`${API}/shops/search?${params}`);
      const data = await res.json();
      setShops(data.shops || []);
    } catch {
      setShops([]);
    } finally {
      setSearching(false);
    }
  };

  const allTags = ["Vintage", "Streetwear", "Sustainable", "Sneakers", "Luxury Resale", "Kids & Baby", "Accessories"];

  return (
    <div className="allshops-page">
      <header className="allshops-top">
        <button type="button" className="allshops-back" onClick={onBack}>← Back</button>
        <div>
          <p className="allshops-eyebrow">Directory</p>
          <h1 className="allshops-title">All shops</h1>
          <p className="allshops-sub">Sorted by best sellers, then popularity.</p>
        </div>
      </header>

      <div className="allshops-search-row">
        <input
          className="allshops-search-input"
          placeholder="Search shop name or product (finds shops that carry it)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runSearch()}
        />
        <button type="button" className="allshops-search-btn" onClick={runSearch} disabled={searching}>
          {searching ? "…" : "Search"}
        </button>
        <button
          type="button"
          className="allshops-clear-btn"
          onClick={() => { setSearch(""); loadShops(); }}
        >
          Clear
        </button>
      </div>

      <div className="allshops-tags" role="group" aria-label="Filter by tag">
        <button
          type="button"
          className={`allshops-tag ${activeTags.length === 0 ? "active" : ""}`}
          onClick={() => setActiveTags([])}
          aria-pressed={activeTags.length === 0}
        >
          All
        </button>
        {allTags.map((t) => (
          <button
            key={t}
            type="button"
            className={`allshops-tag ${activeTags.includes(t) ? "active" : ""}`}
            onClick={() => toggleTag(t)}
            aria-pressed={activeTags.includes(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="allshops-loading">Loading shops…</p>
      ) : (
        <div className="allshops-grid">
          {shops.map((s) => (
            <article
              key={s._id || s.id}
              className="allshops-card"
              role="button"
              tabIndex={0}
              onClick={() =>
                onShopClick({
                  id: s.id,
                  _id: s.id,
                  name: s.shopName,
                  shopName: s.shopName,
                  slug: s.slug,
                  desc: s.shopDescription,
                  location: s.location || "",
                  tags: s.tags || [],
                  itemCount: s.itemCount,
                  headerImageUrl: s.headerImageUrl,
                  shopLogoUrl: s.shopLogoUrl,
                  orderCount: s.orderCount,
                  dbShop: true,
                })}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                onShopClick({
                  id: s.id,
                  _id: s.id,
                  name: s.shopName,
                  shopName: s.shopName,
                  slug: s.slug,
                  desc: s.shopDescription,
                  location: s.location || "",
                  tags: s.tags || [],
                  itemCount: s.itemCount,
                  headerImageUrl: s.headerImageUrl,
                  shopLogoUrl: s.shopLogoUrl,
                  orderCount: s.orderCount,
                  dbShop: true,
                });
              }}
            >
              {s.headerImageUrl ? (
                <div className="allshops-card-banner" style={{ backgroundImage: `url(${s.headerImageUrl})` }} />
              ) : (
                <div className="allshops-card-banner allshops-card-banner-placeholder" />
              )}
              <div className="allshops-card-body">
                {s.shopLogoUrl ? (
                  <img src={s.shopLogoUrl} alt="" className="allshops-card-logoimg" />
                ) : (
                  <div className="allshops-card-logo">🏪</div>
                )}
                <h2 className="allshops-card-name">{s.shopName}</h2>
                <p className="allshops-card-meta">
                  {s.itemCount ?? 0} listings · {s.orderCount ?? 0} orders
                </p>
                <p className="allshops-card-desc">{(s.shopDescription || "").slice(0, 120)}{(s.shopDescription || "").length > 120 ? "…" : ""}</p>
                <div className="allshops-card-tags">
                  {(s.tags || []).slice(0, 4).map((tag) => (
                    <span key={tag} className="allshops-mini-tag">{tag}</span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && !shops.length && (
        <p className="allshops-empty">No shops match. Try another search or tag.</p>
      )}
    </div>
  );
}
