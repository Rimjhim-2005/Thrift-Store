import { useState, useEffect, useRef } from "react";
import "./Navbar.css";

const API = "http://localhost:5000/api";

/* ── Static mega-menu data ───────────────────────────────────── */
const ITEM_SECTIONS = [
  {
    heading: "BY CATEGORY",
    items: ["All Items", "Tops", "Bottoms", "Dresses", "Outerwear", "Sneakers", "Accessories", "Bags"],
  },
  {
    heading: "BY STYLE",
    items: ["Vintage", "Streetwear", "Sustainable", "Denim", "Casual", "Formal", "Boho", "Minimalist"],
  },
];

const SHOP_SECTIONS = [
  {
    heading: "BROWSE SHOPS",
    items: ["All Shops", "New Arrivals", "Top Rated", "Recently Added"],
  },
  {
    heading: "BY STYLE",
    items: ["Vintage", "Streetwear", "Sustainable", "Sneakers", "Luxury Resale", "Kids & Baby", "Accessories"],
  },
];

/* ── Hero images (gradient placeholders) ─────────────────────── */
const ITEM_HERO = {
  gradient: "linear-gradient(160deg, #c9b99a 0%, #8a7055 50%, #5c6b3a 100%)",
  label: "NEW DROPS",
  sub: "Fresh thrift finds daily",
};
const SHOP_HERO = {
  gradient: "linear-gradient(160deg, #7a9e7e 0%, #5c6b3a 50%, #3a4d2a 100%)",
  label: "EXPLORE SHOPS",
  sub: "Handpicked local sellers",
};

/* ── MegaMenu panel ──────────────────────────────────────────── */
function MegaMenu({ hero, sections, onAllClick, onItemClick, onShopTagClick }) {
  return (
    <div className="mega-menu">
      {/* Left: lifestyle image */}
      <div
        className="mega-hero"
        style={{ background: hero.gradient }}
        onClick={onAllClick}
      >
        <div className="mega-hero-label">{hero.label}</div>
        <div className="mega-hero-sub">{hero.sub}</div>
      </div>

      {/* Right: columns */}
      <div className="mega-cols">
        {sections.map((sec) => (
          <div key={sec.heading} className="mega-col">
            <div className="mega-col-heading">{sec.heading}</div>
            <ul className="mega-col-list">
              {sec.items.map((item) => (
                <li key={item}>
                  <button
                    className="mega-col-link"
                    onClick={() => onItemClick(item)}
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Navbar ──────────────────────────────────────────────────── */
export default function Navbar({
  onLoginClick, onSearchClick, onListItemClick,
  user, onCartClick, cartCount, onProfileClick, onMessagesClick,
  onAllShopsClick, onAllItemsClick, onAboutClick,
  onShopsByTag, onItemsByCategory,
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(null); // "shops" | "items" | null
  const navRef = useRef(null);

  /* scroll shadow */
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  /* outside click → close */
  useEffect(() => {
    const h = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setOpen(null);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const toggle = (key) => setOpen((o) => (o === key ? null : key));
  const close  = () => setOpen(null);

  /* handlers forwarded to App */
  const handleItemClick = (label) => {
    close();
    if (label === "All Items") { onAllItemsClick?.(); return; }
    onItemsByCategory?.(label);
  };

  const handleShopClick = (label) => {
    close();
    if (label === "All Shops" || label === "New Arrivals" || label === "Top Rated") {
      onAllShopsClick?.(); return;
    }
    onShopsByTag?.(label);
  };

  return (
    <>
      {/* ── Nav bar ──────────────────────────────────── */}
      <nav ref={navRef} className={`navbar ${scrolled ? "scrolled" : ""} ${open ? "menu-open" : ""}`} onMouseLeave={close}>
        {/* Logo */}
        <a href="#" className="nav-logo" onClick={close}>
          <div className="nav-logo-icon">♻</div>
          <span className="nav-logo-text">Thriftly</span>
        </a>

        {/* Centre links */}
        <ul className="nav-links">
          {!user && (
            <li onMouseEnter={close}><a href="#how-it-works" onClick={close}>How It Works</a></li>
          )}

          {/* Shops */}
          <li className={`nav-mega-trigger ${open === "shops" ? "active" : ""}`} onMouseEnter={() => setOpen("shops")}>
            <button onClick={() => toggle("shops")}>
              Shops <span className="nav-arrow">{open === "shops" ? "▴" : "▾"}</span>
            </button>
          </li>

          {/* Items */}
          <li className={`nav-mega-trigger ${open === "items" ? "active" : ""}`} onMouseEnter={() => setOpen("items")}>
            <button onClick={() => toggle("items")}>
              Items <span className="nav-arrow">{open === "items" ? "▴" : "▾"}</span>
            </button>
          </li>

          <li onMouseEnter={close}>
            <button className="nav-link-btn" onClick={() => { close(); onAboutClick?.(); }}>
              About Us
            </button>
          </li>
        </ul>

        {/* Right actions */}
        <div className="nav-actions">
          <button className="btn-nav-search" onClick={() => { close(); onSearchClick(); }} title="Search products">
            🔍 Search
          </button>

          {user ? (
            <>
              <button className="btn-nav-cart" onClick={() => { close(); onCartClick(); }} title="Cart" style={{ position: "relative" }}>
                🛒
                {cartCount > 0 && (
                  <span className="nav-cart-badge">{cartCount > 9 ? "9+" : cartCount}</span>
                )}
              </button>
              <button className="btn-nav-cart" onClick={() => { close(); onMessagesClick(); }} title="Messages">💬</button>
              {user.role === "seller" && (
                <button className="btn-nav-fill" onClick={() => { close(); onListItemClick(); }}>+ List Item</button>
              )}
              <button className="nav-user-btn" onClick={() => { close(); onProfileClick(); }} title="My profile">
                <div className="nav-avatar">
                  {user.avatarUrl
                    ? <img src={user.avatarUrl} alt="avatar" />
                    : (user.firstName?.[0] || "U").toUpperCase()}
                </div>
                <span className="nav-user-name-text">{user.firstName || user.email}</span>
              </button>
            </>
          ) : (
            <>
              <button className="btn-nav-ghost" onClick={() => { close(); onLoginClick(); }}>Log In</button>
              <a href="#signup" className="btn-nav-fill" onClick={close}>List Your Shop</a>
            </>
          )}
        </div>

        {/* ── Mega-menu panels ───────────────────────── */}
        {open === "shops" && (
          <MegaMenu
            hero={SHOP_HERO}
            sections={SHOP_SECTIONS}
            onAllClick={() => { close(); onAllShopsClick?.(); }}
            onItemClick={handleShopClick}
          />
        )}
        {open === "items" && (
          <MegaMenu
            hero={ITEM_HERO}
            sections={ITEM_SECTIONS}
            onAllClick={() => { close(); onAllItemsClick?.(); }}
            onItemClick={handleItemClick}
          />
        )}
      </nav>

      {/* ── Backdrop when mega menu is open ──────────── */}
      {open && <div className="mega-backdrop" onClick={close} />}
    </>
  );
}
