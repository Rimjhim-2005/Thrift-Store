import { useState, useEffect } from "react";
import "./Navbar.css";

export default function Navbar({ onLoginClick, onSearchClick }) {
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
        <button className="btn-nav-ghost" onClick={onLoginClick}>Log In</button>
        <a href="#signup" className="btn-nav-fill">List Your Shop</a>
      </div>
    </nav>
  );
}
