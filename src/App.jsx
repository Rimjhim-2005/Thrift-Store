import { useState, useEffect } from "react";
import "./styles/globals.css";
import Navbar        from "./components/Navbar";
import Hero          from "./components/Hero";
import HowItWorks    from "./components/HowItWorks";
import BestSellers   from "./components/BestSellers";
import BrowseShops   from "./components/BrowseShops";
import Signup        from "./components/Signup";
import Footer        from "./components/Footer";
import Login         from "./components/Login";
import ShopDetail    from "./components/ShopDetail";
import ProductDetail from "./components/ProductDetail";
import SearchPage    from "./components/SearchPage";
import ListItem      from "./components/ListItem";
import Cart          from "./components/Cart";
import AccountPage       from "./components/AccountPage";
import MessagesPage      from "./components/MessagesPage";
import AllShopsDirectory from "./components/AllShopsDirectory";
import ShopSettings      from "./components/ShopSettings";
import AboutUs           from "./components/AboutUs";
import { SHOPS } from "./data";
import { getListingStockCap } from "./utils/stock";

// page: ... | "all-shops" | "shop-settings" | "about" | "all-items"

export default function App() {
  const [page, setPage]                   = useState("home");
  const [activeShop, setActiveShop]       = useState(null);
  const [activeProduct, setActiveProduct] = useState(null);
  const [user, setUser]                   = useState(null);
  const [navSearchInitQuery, setNavSearchInitQuery] = useState("");
  const [navSearchInitCategory, setNavSearchInitCategory] = useState("All");
  const [navFilterShopTag, setNavFilterShopTag] = useState(null);
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
    const stockRaw = item?.stock;
    const stock =
      stockRaw === undefined || stockRaw === null || stockRaw === ""
        ? undefined
        : Math.max(0, Math.floor(Number(stockRaw)));
    return {
      _id: id,
      id,
      productId: id,
      title: item?.title || item?.name || "",
      name: item?.name || item?.title || "",
      price: Number(item?.price) || 0,
      qty: Math.max(1, Number(item?.qty || item?.quantity || 1)),
      stock,
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
            stock: item.stock,
          })),
        }),
      });
    } catch (_) {
      // no-op: keep UI responsive even if sync fails
    }
  };

  // ---------- Navigation helpers -----------------------------------------
  const goHome     = ()     => { setPage("home");      setNavFilterShopTag(null); window.scrollTo(0, 0); };
  const goLogin    = ()     => { setPage("login");     window.scrollTo(0, 0); };
  const goSearch   = ()     => { setNavSearchInitQuery(""); setNavSearchInitCategory("All"); setPage("search"); window.scrollTo(0, 0); };
  const goListItem = ()     => { setPage("list-item"); window.scrollTo(0, 0); };
  const goMessages = (context = null) => { setInitialChatContext(context); setPage("messages"); window.scrollTo(0, 0); };
  const goAccount  = ()     => { setPage("account");   window.scrollTo(0, 0); };
  const goShop     = (shop) => { setActiveShop(shop);    setPage("shop");    window.scrollTo(0, 0); };
  const goAllShops = ()     => { setNavFilterShopTag(null); setPage("all-shops");  window.scrollTo(0, 0); };
  const goAbout    = ()     => { setPage("about");     window.scrollTo(0, 0); };
  const goAllItems = (category = "All") => {
    setNavSearchInitQuery("");
    setNavSearchInitCategory(category);
    setPage("search");
    window.scrollTo(0, 0);
  };
  const goShopsByTag = (tag) => { setNavFilterShopTag(tag); setPage("all-shops"); window.scrollTo(0, 0); };
  const goShopSettings = () => { setPage("shop-settings"); window.scrollTo(0, 0); };
  const goProduct  = (prod) => { setActiveProduct(prod); setPage("product"); window.scrollTo(0, 0); };

  const goViewItem = (item) => { 
    // Handle both mock data products and database items
    const processedItem = {
      _id: item._id,
      id: item._id,  // Use MongoDB _id as id for compatibility
      name: item.name || item.title,
      title: item.name || item.title,
      price: item.price,
      description: item.description,
      category: item.category,
      condition: item.condition,
      images: item.images,
      stock: item.stock || 1,
      sellerId: item.sellerId,
      shopName: item.sellerId?.shopName || "",
      palette: item.palette || "linear-gradient(135deg,#C9B99A 0%,#A08060 100%)",
    };
    goProduct(processedItem); 
  };

  const goMyLiveShop = (info) => {
    const shopName = info?.shopName || info?.name || "";
    const slug = info?.slug || "";
    const matched = SHOPS.find((s) => s.name === shopName);
    setActiveShop({
      ...matched,
      id: matched?.id,
      name: shopName || matched?.name,
      shopName,
      slug,
      logo: matched?.logo || "🏪",
      email: matched?.email || "",
      dbShop: true,
    });
    setPage("shop");
    window.scrollTo(0, 0);
  };

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
      const cap = getListingStockCap(normalized);
      const requestedAdd = Math.max(1, Number(normalized.qty) || 1);
      const existing = prev.find((i) => i._id === normalized._id);
      let next;
      if (existing) {
        const merged = Math.min(existing.qty + requestedAdd, cap);
        next = prev.map((i) =>
          i._id === normalized._id ? { ...i, qty: merged, stock: normalized.stock ?? i.stock } : i
        );
      } else {
        const initial = Math.min(requestedAdd, cap);
        if (initial < 1) {
          syncCartToServer(prev);
          return prev;
        }
        next = [...prev, { ...normalized, qty: initial }];
      }
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
    setCartItems((prev) => {
      const next = prev.map((i) => {
        if (i._id !== String(id)) return i;
        const cap = getListingStockCap(i);
        return { ...i, qty: Math.min(qty, cap) };
      });
      syncCartToServer(next);
      return next;
    });
  };

  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0);

  // ---------- Profile helper ---------------------------------------------
  const handleProfileUpdate = (updatedUser) => setUser(updatedUser);

  const handleMessageSeller = async (shop, product) => {
    if (!user) { setPage("login"); return; }
    const shopName = shop?.name || shop?.shopName || "";
    const matched = SHOPS.find((s) => s.name === shopName);
    const context = {
      sellerId: shop?._id ? String(shop._id) : `shop-${shop?.id ?? "unknown"}`,
      shopName,
      sellerEmail: shop?.email || matched?.email || "",
      productId: String(product?.id || product?._id || ""),
      productName: product?.name || shopName || "Shop inquiry",
      productPrice: Number(product?.price) || 0,
      createIntentCard: !!product,
    };
    goMessages(context);
  };

  const handleBuyNow = async (product) => {
    if (!user) { setPage("login"); return; }
    const shopName = activeShop?.name || activeShop?.shopName || product?.shopName || "";
    const matched = SHOPS.find((s) => s.name === shopName);
    
    // Phase 2: Pass proper context with item details for auto-message
    const context = {
      sellerId: activeShop?._id ? String(activeShop._id) : `shop-${activeShop?.id ?? "unknown"}`,
      shopName,
      sellerEmail: activeShop?.email || matched?.email || "",
      productId: String(product?.id || product?._id || ""),
      productName: product?.name || "Item",
      productPrice: Number(product?.price) || 0,
      itemName: product?.name || "Item",  // For auto-message display
      quantity: 1,  // Default quantity for Buy Now
      createIntentCard: true,  // Trigger auto-message on chat init
    };
    
    addToCart({
      ...product,
      _id: String(product._id || product.id),
      id: String(product._id || product.id),
      title: product.name,
      name: product.name,
      shopName,
      stock: product.stock,
      qty: 1,
    });
    goMessages(context);
  };

  const handleCheckout = async () => {
    if (!user || !cartItems.length) return;
    
    // Phase 3: Frontend validation for single-shop checkout
    const uniqueShops = [...new Set(cartItems.map(i => i.shopName).filter(Boolean))];
    if (uniqueShops.length > 1) {
      alert("Single shop checkout only. Please remove items from other shops.");
      return;
    }

    const snapshot = cartItems.map((i) => ({ ...i }));
    const cartTotal = snapshot.reduce((sum, i) => sum + Number(i.price) * i.qty, 0);
    const first = snapshot[0];
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
      items: snapshot.map((i) => ({
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
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.message || "Checkout failed.");
        return;
      }
      const orderId = data.order?._id ? String(data.order._id) : "";
      setCartItems([]);
      syncCartToServer([]);
      goMessages({
        sellerId: first.shopName ? `shop-${first.shopName}` : "shop-unknown",
        shopName: first.shopName || "",
        sellerEmail: matchedShop?.email || "",
        createCheckoutSummary: true,
        checkoutItems: snapshot.map((i) => ({
          productId: String(i._id || i.id || ""),
          name: i.title || i.name || "Item",
          price: Number(i.price) || 0,
          quantity: i.qty,
        })),
        checkoutTotal: cartTotal,
        orderId,
        createIntentCard: false,
      });
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
    pageContent = <SearchPage onBack={goHome} onProductClick={goProduct} initialQuery={navSearchInitQuery} initialCategory={navSearchInitCategory} />;
  } else if (page === "list-item") {
    pageContent = <ListItem onBack={goHome} user={user} onViewMyShop={goMyLiveShop} onViewItem={goViewItem} />;
  } else if (page === "all-shops") {
    pageContent = <AllShopsDirectory onBack={goHome} onShopClick={goShop} filterTag={navFilterShopTag} />;
  } else if (page === "about") {
    pageContent = <AboutUs onBack={goHome} />;
  } else if (page === "shop-settings") {
    pageContent = <ShopSettings onBack={goAccount} user={user} />;
  } else if (page === "shop") {
    pageContent = (
      <ShopDetail
        shop={activeShop}
        user={user}
        onUserUpdate={handleProfileUpdate}
        onBack={goHome}
        onProductClick={goProduct}
        onMessageSeller={handleMessageSeller}
      />
    );
  } else if (page === "product") {
    pageContent = (
      <ProductDetail
        product={activeProduct}
        onBackToShop={() => activeShop ? goShop(activeShop) : goHome()}
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
        onShopSettings={user?.role === "seller" ? goShopSettings : undefined}
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
          onAllShopsClick={goAllShops}
          onAllItemsClick={() => goAllItems("All")}
          onAboutClick={goAbout}
          onShopsByTag={goShopsByTag}
          onItemsByCategory={(cat) => goAllItems(cat)}
        />
        <Hero onLoginClick={goLogin} />
        <HowItWorks user={user} />
        <BestSellers onItemClick={goViewItem} />
        <BrowseShops onShopClick={goShop} onViewAll={goAllShops} />
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
