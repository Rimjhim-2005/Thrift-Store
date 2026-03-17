import { useState, useEffect } from "react";
import "./styles/globals.css";
import Navbar        from "./components/Navbar";
import Hero          from "./components/Hero";
import HowItWorks    from "./components/HowItWorks";
import BrowseShops   from "./components/BrowseShops";
import Signup        from "./components/Signup";
import Footer        from "./components/Footer";
import Login         from "./components/Login";
import ShopDetail    from "./components/ShopDetail";
import ProductDetail from "./components/ProductDetail";
import SearchPage    from "./components/SearchPage";
import ListItem      from "./components/ListItem";
import Cart          from "./components/Cart";
import UserProfile   from "./components/UserProfile";

// page: "home" | "login" | "shop" | "product" | "search" | "list-item"

export default function App() {
  const [page, setPage]                   = useState("home");
  const [activeShop, setActiveShop]       = useState(null);
  const [activeProduct, setActiveProduct] = useState(null);
  const [user, setUser]                   = useState(null);

  // ---------- Auth persistence (Issue 1) ----------------------------------
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/auth/me", { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.user) setUser(data.user); })
      .catch(() => {})
      .finally(() => setAuthLoading(false));
  }, []);

  // ---------- Cart state -------------------------------------------------
  // cartItems: Array<{ _id, title, price, qty, images, shopName }>
  const [cartItems, setCartItems]   = useState([]);
  const [cartOpen, setCartOpen]     = useState(false);

  // ---------- Profile modal state ----------------------------------------
  const [profileOpen, setProfileOpen] = useState(false);

  // ---------- Navigation helpers -----------------------------------------
  const goHome     = ()     => { setPage("home");      window.scrollTo(0, 0); };
  const goLogin    = ()     => { setPage("login");     window.scrollTo(0, 0); };
  const goSearch   = ()     => { setPage("search");    window.scrollTo(0, 0); };
  const goListItem = ()     => { setPage("list-item"); window.scrollTo(0, 0); };
  const goShop     = (shop) => { setActiveShop(shop);    setPage("shop");    window.scrollTo(0, 0); };
  const goProduct  = (prod) => { setActiveProduct(prod); setPage("product"); window.scrollTo(0, 0); };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setPage("home");
    window.scrollTo(0, 0);
  };

  const handleLogout = async () => {
    try { await fetch("http://localhost:5000/api/auth/logout", { method: "POST", credentials: "include" }); } catch {}
    setUser(null);
    setCartItems([]);
    setPage("home");
    window.scrollTo(0, 0);
  };

  // ---------- Cart helpers -----------------------------------------------
  const addToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(i => i._id === product._id);
      if (existing) return prev.map(i => i._id === product._id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    setCartOpen(true); // open drawer when item added
  };

  const removeFromCart = (id) => setCartItems(prev => prev.filter(i => i._id !== id));

  const changeQty = (id, qty) => {
    if (qty < 1) return;
    setCartItems(prev => prev.map(i => i._id === id ? { ...i, qty } : i));
  };

  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0);

  // ---------- Profile helper ---------------------------------------------
  const handleProfileUpdate = (updatedUser) => setUser(updatedUser);

  // ---------- Auth loading spinner ---------------------------------------
  if (authLoading) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100vh", background: "#faf6ec",
        fontFamily: "'DM Sans', sans-serif", color: "#7c6a50",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>♻</div>
          <p>Loading…</p>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Build page content based on current route
  // -----------------------------------------------------------------------
  let pageContent = null;

  if (page === "login") {
    pageContent = <Login onBack={goHome} onLoginSuccess={handleLoginSuccess} />;
  } else if (page === "search") {
    pageContent = <SearchPage onBack={goHome} onProductClick={goProduct} />;
  } else if (page === "list-item") {
    pageContent = <ListItem onBack={goHome} user={user} />;
  } else if (page === "shop") {
    pageContent = (
      <ShopDetail
        shop={activeShop}
        onBack={goHome}
        onProductClick={goProduct}
      />
    );
  } else if (page === "product") {
    pageContent = (
      <ProductDetail
        product={activeProduct}
        onBackToShop={() => goShop(activeShop)}
        onRelatedProduct={goProduct}
        onShopClick={goShop}
        cart={cartItems}
        setCart={setCartItems}
        onAddToCart={addToCart}
      />
    );
  } else {
    // Home layout
    pageContent = (
      <>
        <Navbar
          onLoginClick={goLogin}
          onSearchClick={goSearch}
          onListItemClick={goListItem}
          user={user}
          onLogout={handleLogout}
          cartCount={cartCount}
          onCartClick={() => setCartOpen(true)}
          onProfileClick={() => setProfileOpen(true)}
        />
        <Hero onLoginClick={goLogin} />
        <HowItWorks />
        <BrowseShops onShopClick={goShop} />
        <Signup user={user} />
        <Footer />
      </>
    );
  }

  // -----------------------------------------------------------------------
  // Render: page content + always-present Cart drawer + UserProfile modal
  // -----------------------------------------------------------------------
  return (
    <>
      {pageContent}

      {/* Cart drawer — always rendered so it works on every page (Issue 3) */}
      <Cart
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cartItems}
        onRemove={removeFromCart}
        onQtyChange={changeQty}
      />

      {/* User profile modal */}
      {profileOpen && user && (
        <UserProfile
          user={user}
          onClose={() => setProfileOpen(false)}
          onUpdate={handleProfileUpdate}
          cartItems={cartItems}
          onRemoveFromCart={removeFromCart}
          onQtyChange={changeQty}
        />
      )}
    </>
  );
}
