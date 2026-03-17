import { useState } from "react";
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
    try { await fetch("http://localhost:5000/api/auth/logout", { credentials: "include" }); } catch {}
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

  // -----------------------------------------------------------------------
  // Pages that replace the entire layout
  // -----------------------------------------------------------------------
  if (page === "login")     return <Login onBack={goHome} onLoginSuccess={handleLoginSuccess} />;
  if (page === "search")    return <SearchPage onBack={goHome} onProductClick={goProduct} />;
  if (page === "list-item") return <ListItem onBack={goHome} user={user} />;

  if (page === "shop") return (
    <ShopDetail
      shop={activeShop}
      onBack={goHome}
      onProductClick={goProduct}
    />
  );

  if (page === "product") return (
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

  // -----------------------------------------------------------------------
  // Home layout
  // -----------------------------------------------------------------------
  return (
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

      {/* Cart drawer — shown over any page */}
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
        />
      )}
    </>
  );
}
