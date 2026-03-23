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
import AccountPage   from "./components/AccountPage";
import MessagesPage  from "./components/MessagesPage";
import { SHOPS } from "./data";

// page: "home" | "login" | "shop" | "product" | "search" | "list-item" | "messages" | "account"

export default function App() {
  const [page, setPage]                   = useState("home");
  const [activeShop, setActiveShop]       = useState(null);
  const [activeProduct, setActiveProduct] = useState(null);
  const [user, setUser]                   = useState(null);
  const API_BASE = "http://localhost:5000/api";

  // ---------- Auth persistence (Issue 1) ----------------------------------
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/auth/me`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(async (data) => {
        if (data?.user) {
          setUser(data.user);
          await loadCartFromServer();
        }
      })
      .catch(() => {})
      .finally(() => setAuthLoading(false));
  }, []);

  // ---------- Cart state -------------------------------------------------
  // cartItems: Array<{ _id, title, price, qty, images, shopName }>
  const [cartItems, setCartItems]   = useState([]);
  const [cartOpen, setCartOpen]     = useState(false);

  const [initialChatContext, setInitialChatContext] = useState(null);

  const normalizeCartItem = (item) => {
    const id = String(item?._id || item?.id || item?.productId || "").trim();
    return {
      _id: id,
      id,
      productId: id,
      title: item?.title || item?.name || "",
      name: item?.name || item?.title || "",
      price: Number(item?.price) || 0,
      qty: Math.max(1, Number(item?.qty || item?.quantity || 1)),
      images: Array.isArray(item?.images) ? item.images : item?.image ? [item.image] : [],
      shopName: item?.shopName || "",
      palette: item?.palette || "",
    };
  };

  const loadCartFromServer = async () => {
    const res = await fetch(`${API_BASE}/auth/cart`, { credentials: "include" });
    if (!res.ok) return;
    const data = await res.json();
    const serverCart = Array.isArray(data?.cart) ? data.cart.map(normalizeCartItem) : [];
    setCartItems(serverCart);
  };

  const syncCartToServer = async (items) => {
    if (!user) return;
    try {
      await fetch(`${API_BASE}/auth/cart`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          cart: items.map((item) => ({
            productId: String(item._id),
            name: item.title || item.name || "",
            price: Number(item.price) || 0,
            image: item.images?.[0] || "",
            shopName: item.shopName || "",
            quantity: Number(item.qty) || 1,
          })),
        }),
      });
    } catch (_) {
      // no-op: keep UI responsive even if sync fails
    }
  };

  // ---------- Navigation helpers -----------------------------------------
  const goHome     = ()     => { setPage("home");      window.scrollTo(0, 0); };
  const goLogin    = ()     => { setPage("login");     window.scrollTo(0, 0); };
  const goSearch   = ()     => { setPage("search");    window.scrollTo(0, 0); };
  const goListItem = ()     => { setPage("list-item"); window.scrollTo(0, 0); };
  const goMessages = (context = null) => { setInitialChatContext(context); setPage("messages"); window.scrollTo(0, 0); };
  const goAccount  = ()     => { setPage("account");   window.scrollTo(0, 0); };
  const goShop     = (shop) => { setActiveShop(shop);    setPage("shop");    window.scrollTo(0, 0); };
  const goProduct  = (prod) => { setActiveProduct(prod); setPage("product"); window.scrollTo(0, 0); };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    loadCartFromServer().catch(() => {});
    setPage("home");
    window.scrollTo(0, 0);
  };

  const handleLogout = async () => {
    try { await fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" }); } catch {}
    setUser(null);
    setCartItems([]);
    setInitialChatContext(null);
    setPage("home");
    window.scrollTo(0, 0);
  };

  // ---------- Cart helpers -----------------------------------------------
  const addToCart = (product) => {
    setCartItems(prev => {
      const normalized = normalizeCartItem(product);
      const existing = prev.find(i => i._id === normalized._id);
      const next = existing
        ? prev.map(i => i._id === normalized._id ? { ...i, qty: i.qty + 1 } : i)
        : [...prev, { ...normalized, qty: normalized.qty || 1 }];
      syncCartToServer(next);
      return next;
    });
    setCartOpen(true); // open drawer when item added
  };

  const removeFromCart = (id) => setCartItems(prev => {
    const next = prev.filter(i => i._id !== String(id));
    syncCartToServer(next);
    return next;
  });

  const changeQty = (id, qty) => {
    if (qty < 1) return;
    setCartItems(prev => {
      const next = prev.map(i => i._id === String(id) ? { ...i, qty } : i);
      syncCartToServer(next);
      return next;
    });
  };

  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0);

  // ---------- Profile helper ---------------------------------------------
  const handleProfileUpdate = (updatedUser) => setUser(updatedUser);

  const handleMessageSeller = async (shop, product) => {
    if (!user) { setPage("login"); return; }
    const context = {
      sellerId: `shop-${shop?.id || "unknown"}`,
      shopName: shop?.name || "",
      sellerEmail: shop?.email || "",
      productId: String(product?.id || ""),
      productName: product?.name || shop?.name || "Shop inquiry",
      productPrice: Number(product?.price) || 0,
      createIntentCard: !!product,
    };
    goMessages(context);
  };

  const handleBuyNow = async (product) => {
    if (!user) { setPage("login"); return; }
    const shopName = activeShop?.name || "";
    const context = {
      sellerId: `shop-${activeShop?.id || "unknown"}`,
      shopName,
      sellerEmail: activeShop?.email || "",
      productId: String(product?.id || ""),
      productName: product?.name || "Item",
      productPrice: Number(product?.price) || 0,
      createIntentCard: true,
    };
    addToCart({ ...product, _id: String(product.id), title: product.name, shopName });
    goMessages(context);
  };

  const handleCheckout = async () => {
    if (!user || !cartItems.length) return;
    const first = cartItems[0];
    const matchedShop = SHOPS.find((s) => s.name === first.shopName);
    const payload = {
      shopId: first.shopName || "",
      sellerEmail: matchedShop?.email || "",
      buyerContactInfo: {
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        email: user.email || "",
        phone: user.phone || "",
        address: "",
      },
      items: cartItems.map((i) => ({
        productId: i._id || i.id,
        name: i.title || i.name,
        price: i.price,
        quantity: i.qty,
        image: i.images?.[0] || "",
        shopName: i.shopName || "",
      })),
    };

    try {
      const res = await fetch(`${API_BASE}/auth/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) return;
      setCartItems([]);
      const context = {
        sellerId: first.shopName ? `shop-${first.shopName}` : "shop-unknown",
        shopName: first.shopName || "",
        sellerEmail: matchedShop?.email || "",
        productId: first._id || first.id || "",
        productName: first.title || first.name || "Item",
        productPrice: Number(first.price) || 0,
        createIntentCard: true,
      };
      goMessages(context);
    } catch (_) {}
  };

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
        onMessageSeller={handleMessageSeller}
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
        onAddToCart={addToCart}
        user={user}
        onUserUpdate={setUser}
        onMessageSeller={handleMessageSeller}
        onBuyNow={handleBuyNow}
      />
    );
  } else if (page === "messages") {
    pageContent = (
      <MessagesPage
        user={user}
        initialChatContext={initialChatContext}
        onBack={goHome}
      />
    );
  } else if (page === "account") {
    pageContent = (
      <AccountPage
        user={user}
        cartItems={cartItems}
        onQtyChange={changeQty}
        onRemoveFromCart={removeFromCart}
        onBack={goHome}
        onUserUpdate={handleProfileUpdate}
        onCheckout={handleCheckout}
        onOpenMessages={() => goMessages()}
        onLogout={handleLogout}
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
          cartCount={cartCount}
          onCartClick={() => setCartOpen(true)}
          onProfileClick={goAccount}
          onMessagesClick={() => goMessages()}
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
        onCheckout={handleCheckout}
      />
    </>
  );
}
