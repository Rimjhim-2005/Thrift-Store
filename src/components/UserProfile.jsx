import { useState } from "react";
import { MOCK_USER, MOCK_ORDERS, PRODUCTS, SHOPS } from "../data";
import "./UserProfile.css";

const TABS = ["Profile","Wishlist","Order History","Favorite Shops","Cart"];

export default function UserProfile({ onBack, cart, setCart, onProductClick, onShopClick, wishlist, setWishlist, onCartPage }) {
  const [activeTab, setActiveTab] = useState("Profile");

  const wishlistProducts = PRODUCTS.filter(p => wishlist.includes(p.id));
  const favShops = SHOPS.filter(s => MOCK_USER.favoriteShops.includes(s.id));
  const cartTotal = cart.reduce((s,i)=>s+(i.price*i.qty),0);

  const removeFromWishlist = (id) => setWishlist(prev => prev.filter(i => i !== id));
  const removeFromCart     = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const moveToCart = (product) => {
    setCart(prev => {
      if (prev.find(i=>i.id===product.id)) return prev;
      return [...prev, { ...product, qty: 1 }];
    });
    removeFromWishlist(product.id);
  };

  return (
    <div className="user-profile-page">
      {/* Topbar */}
      <div className="up-topbar">
        <button className="up-back" onClick={onBack}>← Back</button>
        <div className="up-topbar-logo">
          <div className="up-logo-icon">♻</div>
          <span>Thriftly</span>
        </div>
        <span className="up-topbar-label">My Account</span>
      </div>

      {/* Profile hero */}
      <div className="up-hero">
        <div className="up-avatar">{MOCK_USER.avatar}</div>
        <div className="up-hero-info">
          <h1 className="up-name">{MOCK_USER.name}</h1>
          <p className="up-meta">📍 {MOCK_USER.location} · Member since {MOCK_USER.memberSince}</p>
        </div>
        <div className="up-hero-badges">
          <div className="up-badge">🛍 {cart.length} cart items</div>
          <div className="up-badge">♡ {wishlist.length} saved</div>
          <div className="up-badge">⭐ {favShops.length} fav shops</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="up-tabs">
        {TABS.map(t => (
          <button key={t} className={`up-tab ${activeTab===t?"active":""}`} onClick={()=>setActiveTab(t)}>
            {t}
            {t==="Cart" && cart.length > 0 && <span className="up-tab-count">{cart.length}</span>}
            {t==="Wishlist" && wishlist.length > 0 && <span className="up-tab-count">{wishlist.length}</span>}
          </button>
        ))}
      </div>

      <div className="up-body">
        {/* ── Profile ── */}
        {activeTab === "Profile" && (
          <div className="up-profile-grid">
            <div className="up-card">
              <h3 className="up-card-title">Personal Information</h3>
              <div className="up-fields">
                {[["Full Name",MOCK_USER.name],["Email",MOCK_USER.email],["Location",MOCK_USER.location],["Member Since",MOCK_USER.memberSince]].map(([k,v])=>(
                  <div key={k} className="up-field-row">
                    <label className="up-field-label">{k}</label>
                    <input className="up-field-input" defaultValue={v} />
                  </div>
                ))}
              </div>
              <button className="up-save-btn">Save Changes</button>
            </div>
            <div className="up-card">
              <h3 className="up-card-title">Account Stats</h3>
              <div className="up-stats-grid">
                {[
                  {icon:"📦",label:"Orders Placed",value:MOCK_ORDERS.length},
                  {icon:"♡",label:"Wishlisted",value:wishlist.length},
                  {icon:"⭐",label:"Fav Shops",value:favShops.length},
                  {icon:"🛍",label:"Cart Items",value:cart.length},
                ].map(({icon,label,value})=>(
                  <div key={label} className="up-stat">
                    <span className="up-stat-icon">{icon}</span>
                    <span className="up-stat-num">{value}</span>
                    <span className="up-stat-label">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Wishlist ── */}
        {activeTab === "Wishlist" && (
          <div>
            {wishlistProducts.length === 0 ? (
              <div className="up-empty"><span>♡</span><p>Your wishlist is empty</p></div>
            ) : (
              <div className="up-product-grid">
                {wishlistProducts.map(product => (
                  <div key={product.id} className="up-product-card">
                    <div className="up-product-img" style={{background:product.palette}} onClick={()=>onProductClick(product)}>
                      {product.tag && <span className="up-product-tag">{product.tag}</span>}
                    </div>
                    <div className="up-product-info">
                      <p className="up-product-category">{product.category}</p>
                      <p className="up-product-name" onClick={()=>onProductClick(product)}>{product.name}</p>
                      <p className="up-product-price">₱ {product.price.toLocaleString()}</p>
                      <div className="up-product-actions">
                        <button className="up-btn-cart" onClick={()=>moveToCart(product)}>Add to Cart</button>
                        <button className="up-btn-remove" onClick={()=>removeFromWishlist(product.id)}>✕</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Order History ── */}
        {activeTab === "Order History" && (
          <div className="up-card">
            <h3 className="up-card-title">Past Orders</h3>
            {MOCK_ORDERS.length === 0 ? (
              <div className="up-empty"><span>📦</span><p>No orders yet</p></div>
            ) : (
              <div className="up-orders-list">
                {MOCK_ORDERS.map(order => {
                  const product = PRODUCTS.find(p=>p.id===order.productId);
                  const shop    = SHOPS.find(s=>s.id===order.shopId);
                  const sColor  = {Delivered:{bg:"#DFF0D0",text:"#2E6B2E"},Processing:{bg:"#FEF3C7",text:"#92400E"}}[order.status] || {};
                  return (
                    <div key={order.id} className="up-order-row">
                      <div className="up-order-img" style={{background:product?.palette}} />
                      <div className="up-order-main">
                        <p className="up-order-id">{order.id}</p>
                        <p className="up-order-product" onClick={()=>onProductClick(product)}>{product?.name}</p>
                        <p className="up-order-shop" onClick={()=>onShopClick(shop)}>🏪 {shop?.name}</p>
                      </div>
                      <div className="up-order-right">
                        <span className="up-order-status" style={{background:sColor.bg,color:sColor.text}}>{order.status}</span>
                        <p className="up-order-date">{order.date}</p>
                        <p className="up-order-total">₱ {order.total.toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Favorite Shops ── */}
        {activeTab === "Favorite Shops" && (
          <div>
            {favShops.length === 0 ? (
              <div className="up-empty"><span>⭐</span><p>No favorite shops yet</p></div>
            ) : (
              <div className="up-shops-grid">
                {favShops.map(shop => (
                  <div key={shop.id} className="up-shop-card" onClick={()=>onShopClick(shop)}>
                    <div className={`up-shop-banner ${shop.banner}`}>
                      <div className="up-shop-logo">{shop.logo}</div>
                    </div>
                    <div className="up-shop-info">
                      <h3 className="up-shop-name">{shop.name}</h3>
                      <p className="up-shop-location">📍 {shop.location}</p>
                      <p className="up-shop-rating">⭐ {shop.rating} · {shop.reviews} reviews</p>
                      <div className="up-shop-tags">{shop.tags.map(t=><span key={t} className="up-shop-tag">{t}</span>)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Cart preview ── */}
        {activeTab === "Cart" && (
          <div className="up-card">
            <div className="up-cart-header">
              <h3 className="up-card-title">Cart ({cart.length} items)</h3>
              {cart.length > 0 && <button className="up-go-cart-btn" onClick={onCartPage}>Go to Full Cart →</button>}
            </div>
            {cart.length === 0 ? (
              <div className="up-empty"><span>🛍</span><p>Your cart is empty</p></div>
            ) : (
              <>
                <div className="up-cart-list">
                  {cart.map(item => (
                    <div key={item.id} className="up-cart-row">
                      <div className="up-cart-img" style={{background:item.palette}} />
                      <div className="up-cart-info">
                        <p className="up-cart-name" onClick={()=>onProductClick(item)}>{item.name}</p>
                        <p className="up-cart-size">Size: {item.size} · Qty: {item.qty}</p>
                      </div>
                      <p className="up-cart-price">₱ {(item.price*item.qty).toLocaleString()}</p>
                      <button className="up-cart-remove" onClick={()=>removeFromCart(item.id)}>✕</button>
                    </div>
                  ))}
                </div>
                <div className="up-cart-footer">
                  <span>Total</span>
                  <span className="up-cart-total">₱ {cartTotal.toLocaleString()}</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
