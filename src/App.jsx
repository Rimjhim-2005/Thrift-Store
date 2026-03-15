import { useState, useEffect } from "react";
import "./styles/globals.css";
import useAppStore from "./store/useAppStore";
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

// page: "home" | "login" | "shop" | "product" | "search"

export default function App() {
  const [page, setPage]                   = useState("home");
  const [activeShop, setActiveShop]       = useState(null);
  const [activeProduct, setActiveProduct] = useState(null);
  const [cart, setCart]                   = useState([]);

  // Get store data and actions
  const { fetchAllProducts, isAuthenticated } = useAppStore();
  const products = useAppStore((state) => state.products.items);

  // Fetch products on mount
  useEffect(() => {
    fetchAllProducts();
  }, [fetchAllProducts]);

  const goHome    = ()      => { setPage("home");    window.scrollTo(0, 0); };
  const goLogin   = ()      => { setPage("login");   window.scrollTo(0, 0); };
  const goSearch  = ()      => { setPage("search");  window.scrollTo(0, 0); };
  const goShop    = (shop)  => { setActiveShop(shop);    setPage("shop");    window.scrollTo(0, 0); };
  const goProduct = (prod)  => { setActiveProduct(prod); setPage("product"); window.scrollTo(0, 0); };

  if (page === "login")   return <Login onBack={goHome} />;
  if (page === "search")  return <SearchPage onBack={goHome} onProductClick={goProduct} />;

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
      onBackToShop={() => goShop(activeShop)}       /* ← FIXED: dedicated prop */
      onRelatedProduct={goProduct}                  /* ← FIXED: dedicated prop */
      onShopClick={goShop}
      cart={cart}
      setCart={setCart}
    />
  );

  return (
    <>
      <Navbar onLoginClick={goLogin} onSearchClick={goSearch} />
      <Hero   onLoginClick={goLogin} />
      <HowItWorks />
      <BrowseShops onShopClick={goShop} products={products} />
      <Signup />
      <Footer />
    </>
  );
}
