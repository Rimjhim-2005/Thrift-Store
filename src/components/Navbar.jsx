import { useState, useEffect } from "react";
import "./Navbar.css";

export default function Navbar({
  onLoginClick, onSearchClick, onListItemClick,
  user, onCartClick, cartCount, onProfileClick, onMessagesClick,
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <a href="#" className="nav-logo">
        <div className="nav-logo-icon">♻</div>
        <span className="nav-logo-text">Thriftly</span>
      </a>

      <ul className="nav-links">
        <li><a href="#how-it-works">How It Works</a></li>
        <li><a href="#browse">Browse Shops</a></li>
        <li><a href="#signup">Contact</a></li>
      </ul>

      <div className="nav-actions">
        <button className="btn-nav-search" onClick={onSearchClick} title="Search products">
          🔍 Search
        </button>

        {user ? (
          <>
            {/* Cart button — only for buyers (or all logged-in users) */}
            <button
              className="btn-nav-cart"
              onClick={onCartClick}
              title="Your cart"
              style={{ position: "relative" }}
            >
              🛒
              {cartCount > 0 && (
                <span className="nav-cart-badge">{cartCount > 9 ? "9+" : cartCount}</span>
              )}
            </button>

            <button className="btn-nav-cart" onClick={onMessagesClick} title="Messages">
              💬
            </button>

            {user.role === "seller" && (
              <button className="btn-nav-fill" onClick={onListItemClick}>
                + List Item
              </button>
            )}

            {/* User avatar / profile button */}
            <button className="nav-user-btn" onClick={onProfileClick} title="My profile">
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
            <button className="btn-nav-ghost" onClick={onLoginClick}>Log In</button>
            <a href="#signup" className="btn-nav-fill">List Your Shop</a>
          </>
        )}
      </div>
    </nav>
  );
}
