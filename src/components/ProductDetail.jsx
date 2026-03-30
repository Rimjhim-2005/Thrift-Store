import { useState, useMemo, useEffect } from "react";
import { SHOPS } from "../data";
import { getListingStockCap } from "../utils/stock";
import "./ProductDetail.css";

const CONDITIONS = { Excellent: 5, "Very Good": 4, Good: 3 };
const IMG_BASE = "http://localhost:5000";
const CONDITION_DESC = {
  Excellent: "No visible wear. Like new.",
  "Very Good": "Minor signs of wear. Well cared for.",
  Good: "Normal wear consistent with age.",
};

const API_BASE = "http://localhost:5000/api";

export default function ProductDetail({
  product, onBackToShop, onRelatedProduct, onShopClick,
  cart, onAddToCart, user, onUserUpdate, onMessageSeller, onBuyNow,
}) {
  const [loadedProduct, setLoadedProduct] = useState(product);
  const [loading, setLoading] = useState(false);
  const [sellerInfo, setSellerInfo] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);

  // Fetch item from backend if it's a database item (has _id but not id)
  useEffect(() => {
    if (!product) return;
    
    const isDbItem = product._id && !product.id;
    if (isDbItem) {
      setLoading(true);
      fetch(`${API_BASE}/items/${product._id}`, { credentials: "include" })
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data?.item) {
            setLoadedProduct(data.item);
            // Extract seller info if available
            if (data.item.sellerId) {
              setSellerInfo(data.item.sellerId);
            }
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoadedProduct(product);
    }
  }, [product?._id, product?.id]);

  // Fetch related products from backend
  useEffect(() => {
    if (!loadedProduct || !loadedProduct.sellerId) {
      setRelatedProducts([]);
      return;
    }

    fetch(`${API_BASE}/items?sellerId=${loadedProduct.sellerId}`, { credentials: "include" })
      .then((res) => res.ok ? res.json() : { items: [] })
      .then((data) => {
        const related = (data.items || [])
          .filter((p) => String(p._id) !== String(loadedProduct._id))
          .slice(0, 3);
        setRelatedProducts(related);
      })
      .catch(() => setRelatedProducts([]));
  }, [loadedProduct?._id, loadedProduct?.sellerId]);

  const displayProduct = loadedProduct || product;

  // Build shop object from mock data (shopId) or database seller (sellerId)
  const shop = useMemo(() => {
    // For mock data items (have shopId)
    const mockShop = SHOPS.find((s) => s.id === displayProduct?.shopId);
    if (mockShop) return mockShop;

    // For database items (have sellerId which is a populated Seller object)
    const seller = displayProduct?.sellerId || sellerInfo;
    if (seller?.shopName) {
      return {
        name: seller.shopName,
        shopName: seller.shopName,
        slug: seller.slug || seller.shopName.toLowerCase().replace(/\s+/g, '-'),
        logo: "🏪",
        rating: 4,
        reviews: 0,
        location: seller.location || "Online",
      };
    }

    return undefined;
  }, [displayProduct, sellerInfo]);

  const [activeImg, setActiveImg]     = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [qty, setQty]                 = useState(1);
  const [wishPop, setWishPop]         = useState(false);

  const productId = String(displayProduct?._id || displayProduct?.id);
  const inWishlist = useMemo(
    () => (user?.wishlist || []).map(String).includes(productId),
    [user?.wishlist, productId]
  );

  const maxStock = useMemo(() => getListingStockCap(displayProduct), [displayProduct]);
  const inCartQty = useMemo(() => {
    const line = cart.find((c) => String(c._id) === productId);
    return line ? line.qty : 0;
  }, [cart, productId]);
  const remaining = Math.max(0, maxStock - inCartQty);
  const canAddMore = remaining > 0;

  useEffect(() => {
    if (remaining < 1) return;
    setQty((prev) => Math.min(Math.max(1, prev), remaining));
  }, [remaining, productId]);

  // Use real images from backend if available, otherwise fall back to palette placeholders
  const hasRealImages = displayProduct?.images?.length > 0;
  const realImages = hasRealImages
    ? displayProduct.images.map((img) =>
        img.startsWith("http") ? img : `${IMG_BASE}${img}`
      )
    : [];

  const thumbPalettes = [
    displayProduct?.palette,
    displayProduct?.palette?.replace("135deg", "160deg"),
    displayProduct?.palette?.replace("0%", "15%"),
    displayProduct?.palette?.replace("100%", "90%"),
  ];

  const handleAddToCart = () => {
    if (!canAddMore) return;
    const addQty = Math.min(qty, remaining);
    if (addQty < 1) return;
    onAddToCart({
      ...displayProduct,
      _id: String(displayProduct._id || displayProduct.id),
      id: String(displayProduct._id || displayProduct.id),
      title: displayProduct.title || displayProduct.name,
      name: displayProduct.name || displayProduct.title,
      shopName: shop?.name || displayProduct.shopName || sellerInfo?.shopName || "",
      stock: displayProduct.stock,
      qty: addQty,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  };

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !productId) return;
    try {
      const res = await fetch(
        `http://localhost:5000/api/auth/wishlist/${encodeURIComponent(productId)}`,
        { method: inWishlist ? "DELETE" : "POST", credentials: "include" }
      );
      if (!res.ok) return;
      const data = await res.json();
      onUserUpdate?.({ ...user, wishlist: data.wishlist || [] });
      if (!inWishlist) {
        setWishPop(true);
        window.setTimeout(() => setWishPop(false), 500);
      }
    } catch (_) {
      // no-op
    }
  };

  const cartCount = cart.reduce((acc, i) => acc + i.qty, 0);

  return (
    <div className="product-detail-page">

      {/* ── Topbar ── */}
      <div className="pd-topbar">
        {/* FIXED: always goes back to shop */}
        <button className="pd-back-btn" onClick={onBackToShop}>
          ← Back to {shop?.name || "shop"}
        </button>
        <div className="pd-breadcrumb">
          <span className="pd-breadcrumb-link" onClick={() => shop && onShopClick(shop)}>
            {shop?.name || displayProduct?.shopName || "Shop"}
          </span>
          <span className="pd-breadcrumb-sep">›</span>
          <span>{displayProduct?.name}</span>
        </div>
        {cartCount > 0 && (
          <div className="pd-cart-indicator">
            🛍 <span>{cartCount}</span> in cart
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#666" }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
          <p>Loading item details…</p>
        </div>
      ) : !displayProduct ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#666" }}>
          <p>Item not found.</p>
        </div>
      ) : (
        <>
          <div className="pd-body">
        {/* ── Gallery ── */}
        <div className="pd-gallery">
          <div className="pd-thumbs">
            {hasRealImages
              ? realImages.map((src, i) => (
                  <div
                    key={i}
                    className={`pd-thumb ${activeImg === i ? "active" : ""}`}
                    onClick={() => setActiveImg(i)}
                  >
                    <img src={src} alt={`${displayProduct?.name} ${i + 1}`} className="pd-thumb-img" />
                  </div>
                ))
              : thumbPalettes.map((pal, i) => (
                  <div
                    key={i}
                    className={`pd-thumb ${activeImg === i ? "active" : ""}`}
                    style={{ background: pal }}
                    onClick={() => setActiveImg(i)}
                  />
                ))}
          </div>
          <div
            className="pd-main-img"
            style={hasRealImages ? {} : { background: thumbPalettes[activeImg] }}
          >
            {hasRealImages ? (
              <img
                src={realImages[activeImg] || realImages[0]}
                alt={displayProduct?.name}
                className="pd-main-photo"
              />
            ) : (
              <>
                {displayProduct?.tag && <span className="pd-img-tag">{displayProduct.tag}</span>}
                <div className="pd-img-label">📷 Placeholder Image</div>
              </>
            )}
          </div>
        </div>

        {/* ── Info ── */}
        <div className="pd-info">
          <div className="pd-info-header">
            <p className="pd-category">{displayProduct?.category}</p>
            <h1 className="pd-product-name">{displayProduct?.name}</h1>
            <div className="pd-price-row">
              <span className="pd-price">₹ {displayProduct?.price?.toLocaleString()}</span>
              <span className="pd-condition-badge">{displayProduct?.condition}</span>
            </div>
          </div>

          {/* Tags */}
          {displayProduct?.tags?.length > 0 && (
            <div className="pd-tags-section">
              <p className="pd-section-label">Tags</p>
              <div className="pd-tags-list">
                {displayProduct.tags.map((t) => (
                  <span key={t} className="pd-tag-pill">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Condition */}
          <div className="pd-condition-section">
            <p className="pd-section-label">Condition</p>
            <div className="pd-condition-bar">
              {["Good","Very Good","Excellent"].map((c) => (
                <div key={c} className={`pd-condition-step ${CONDITIONS[displayProduct?.condition] >= CONDITIONS[c] ? "filled" : ""}`} />
              ))}
            </div>
            <p className="pd-condition-desc">
              <strong>{displayProduct?.condition}</strong> — {CONDITION_DESC[displayProduct?.condition]}
            </p>
          </div>

          {/* Size */}
          <div className="pd-section">
            <p className="pd-section-label">Size</p>
            <div className="pd-size-options">
              <div className="pd-size-pill active">{displayProduct?.size || "One Size"}</div>
              <p className="pd-size-note">
              {maxStock <= 1 ? "One-of-a-kind — limited quantity." : `Up to ${maxStock} units available.`}
              {inCartQty > 0 && ` (${inCartQty} in your cart)`}
            </p>
            </div>
          </div>

          {/* Qty */}
          <div className="pd-section">
            <p className="pd-section-label">Quantity</p>
            {maxStock < 1 ? (
              <p className="pd-stock-note pd-stock-out">This listing is out of stock.</p>
            ) : !canAddMore ? (
              <p className="pd-stock-note">
                All {maxStock} available {maxStock === 1 ? "unit is" : "units are"} in your cart.
              </p>
            ) : (
              <div className="pd-qty-row">
                <button
                  type="button"
                  className="pd-qty-btn"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                >
                  −
                </button>
                <span className="pd-qty-num">{qty}</span>
                <button
                  type="button"
                  className="pd-qty-btn"
                  onClick={() => setQty((q) => Math.min(remaining, q + 1))}
                  disabled={qty >= remaining}
                >
                  +
                </button>
                <span className="pd-qty-note">
                  {remaining === maxStock
                    ? `${maxStock} available`
                    : `${remaining} more can be added (${inCartQty} in cart)`}
                </span>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="pd-cta-row">
            <button
              className={`pd-add-to-cart ${addedToCart ? "added" : ""}`}
              onClick={handleAddToCart}
              disabled={addedToCart || !canAddMore || maxStock < 1}
            >
              {addedToCart ? "✓ Added to Cart!" : "Add to Cart"}
            </button>
            <button className="pd-add-to-cart" onClick={() => onBuyNow?.(product)}>Buy Now</button>
            <button type="button" className="pd-add-to-cart" onClick={() => onMessageSeller?.(shop, product)}>Message Shop Owner</button>
            <button
              type="button"
              className={`pd-wishlist-btn ${inWishlist ? "liked" : ""} ${wishPop ? "wish-pop" : ""}`}
              title={inWishlist ? "Remove from wishlist" : "Save to wishlist"}
              aria-pressed={inWishlist}
              onClick={handleWishlistToggle}
            >
              <span className="pd-wish-ico">{inWishlist ? "♥" : "♡"}</span>
            </button>
          </div>

          <p className="pd-shipping-note">
            🌿 Contact the shop to arrange pickup or delivery. No platform fee — you deal directly.
          </p>

          {/* Description */}
          <div className="pd-description">
            <p className="pd-section-label">Description</p>
            <p className="pd-desc-text">{displayProduct?.description || displayProduct?.desc}</p>
          </div>

          {/* Details table */}
          <div className="pd-details-table">
            <p className="pd-section-label">Item Details</p>
            <div className="pd-details-grid">
              {[
                ["Category",  displayProduct?.category],
                ["Size",      displayProduct?.size],
                ["Condition", displayProduct?.condition],
                ["Color",     displayProduct?.color],
                ["Style",     displayProduct?.style],
                ["Era",       displayProduct?.era],
                ["Listed by", shop?.name || sellerInfo?.shopName],
                ["Location",  shop?.location],
              ].filter(([,v]) => v).map(([k, v]) => (
                <div key={k} className="pd-detail-row">
                  <span className="pd-detail-key">{k}</span>
                  <span className="pd-detail-val">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Shop card */}
          <div className="pd-shop-card" onClick={() => onShopClick(shop)}>
            <div className="pd-shop-logo">{shop?.logo || "🏪"}</div>
            <div className="pd-shop-info">
              <p className="pd-shop-name">{shop?.name || sellerInfo?.shopName || "Shop"}</p>
              <p className="pd-shop-location">📍 {shop?.location || "Online"}</p>
              <div className="pd-shop-rating">
                <span className="pd-shop-stars">{"★".repeat(Math.round(shop?.rating || 4))}</span>
                <span>{shop?.rating || 4} · {shop?.reviews || 0} reviews</span>
              </div>
            </div>
            <div className="pd-shop-arrow">→</div>
          </div>
        </div>
      </div>

      {/* ── Related products ── */}
      {relatedProducts.length > 0 && (
        <div className="pd-related">
          <h2 className="pd-related-title">More from <em>{shop?.name || "Shop"}</em></h2>
          <div className="pd-related-grid">
            {relatedProducts.map((p) => {
              const relImg = p.images?.[0]
                ? (p.images[0].startsWith("http") ? p.images[0] : `${IMG_BASE}${p.images[0]}`)
                : null;
              return (
                <div key={p._id || p.id} className="pd-related-card" onClick={() => onRelatedProduct(p)}>
                  <div className="pd-related-img" style={relImg ? {} : { background: p.palette }}>
                    {relImg && <img src={relImg} alt={p.name} className="pd-related-photo" />}
                  </div>
                  <div className="pd-related-info">
                    <p className="pd-related-category">{p.category}</p>
                    <p className="pd-related-name">{p.name}</p>
                    <p className="pd-related-price">₹ {p.price?.toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
