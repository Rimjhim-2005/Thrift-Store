import { useState, useEffect } from "react";
import "./UserProfile.css";

const API = "http://localhost:5000/api";

export default function UserProfile({
  user, onClose, onUpdate,
  cartItems = [], onRemoveFromCart, onQtyChange,
}) {
  const [tab, setTab] = useState("account");
  // account | cart | wishlist | orders

  // ── Account form state ──────────────────────────────────────
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName,  setLastName]  = useState(user.lastName  || "");
  const [phone,     setPhone]     = useState(user.phone     || "");
  const [bio,       setBio]       = useState(user.bio       || "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || "");
  const [newPass,   setNewPass]   = useState("");
  const [confPass,  setConfPass]  = useState("");
  const [msg,       setMsg]       = useState({ type: "", text: "" });
  const [loading,   setLoading]   = useState(false);
  const [passMode,  setPassMode]  = useState(false);

  // ── Orders state ────────────────────────────────────────────
  const [orders, setOrders]           = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // ── Wishlist state ──────────────────────────────────────────
  const [wishlistProducts, setWishlistProducts] = useState([]);

  // Fetch orders when tab switches to orders
  useEffect(() => {
    if (tab === "orders") {
      setOrdersLoading(true);
      fetch(`${API}/auth/orders`, { credentials: "include" })
        .then(r => r.ok ? r.json() : { orders: [] })
        .then(data => setOrders(data.orders || []))
        .catch(() => setOrders([]))
        .finally(() => setOrdersLoading(false));
    }
  }, [tab]);

  // Fetch wishlist items when tab switches to wishlist
  useEffect(() => {
    if (tab === "wishlist") {
      fetch(`${API}/auth/wishlist/items`, { credentials: "include" })
        .then(r => r.ok ? r.json() : { items: [] })
        .then(data => setWishlistProducts(data.items || []))
        .catch(() => setWishlistProducts([]));
    }
  }, [tab]);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 3500);
  };

  // ── Save profile ────────────────────────────────────────────
  const handleProfileSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ firstName, lastName, phone, bio, avatarUrl }),
      });
      const data = await res.json();
      if (!res.ok) { showMsg("error", data.message || "Save failed."); return; }
      showMsg("success", "Profile updated ✓");
      onUpdate(data.user);
    } catch { showMsg("error", "Network error."); }
    finally { setLoading(false); }
  };

  // ── Save password ───────────────────────────────────────────
  const handlePasswordSave = async () => {
    if (!newPass) { showMsg("error", "Enter a new password."); return; }
    if (newPass.length < 8) { showMsg("error", "Password must be at least 8 characters."); return; }
    if (newPass !== confPass) { showMsg("error", "Passwords do not match."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newPassword: newPass }),
      });
      const data = await res.json();
      if (!res.ok) { showMsg("error", data.message || "Save failed."); return; }
      showMsg("success", "Password changed ✓");
      setNewPass(""); setConfPass(""); setPassMode(false);
    } catch { showMsg("error", "Network error."); }
    finally { setLoading(false); }
  };

  // ── Remove wishlist item ────────────────────────────────────
  const handleRemoveWishlist = async (itemId) => {
    try {
      const res = await fetch(`${API}/auth/wishlist/${itemId}`, {
        method: "DELETE", credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        onUpdate({ ...user, wishlist: data.wishlist });
      }
    } catch { /* silent */ }
  };

  // ── Cart total ──────────────────────────────────────────────
  const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);

  // ── Status badge color ──────────────────────────────────────
  const statusColor = (s) => {
    if (s === "delivered") return "#5c6b3a";
    if (s === "shipped") return "#2e86de";
    if (s === "confirmed") return "#e67e22";
    return "#7c6a50";
  };

  return (
    <>
      <div className="profile-overlay" onClick={onClose} />
      <div className="profile-modal profile-modal-wide">
        {/* ── Header ──────────────────── */}
        <div className="profile-header">
          <div className="profile-avatar-big">
            {avatarUrl
              ? <img src={avatarUrl} alt="avatar" />
              : <span>{(firstName?.[0] || "U").toUpperCase()}</span>}
          </div>
          <div>
            <h2 className="profile-name">{firstName} {lastName}</h2>
            <p className="profile-email">{user.email}</p>
            <span className={`profile-role-badge role-${user.role}`}>{user.role}</span>
          </div>
          <button className="profile-close" onClick={onClose}>✕</button>
        </div>

        {/* ── Tabs ────────────────────── */}
        <div className="profile-tabs">
          {[
            { key: "account",  icon: "👤", label: "Account" },
            { key: "cart",     icon: "🛒", label: `Cart (${cartItems.length})` },
            { key: "wishlist", icon: "♡",  label: `Wishlist (${wishlistProducts.length})` },
            { key: "orders",   icon: "📦", label: "Orders" },
          ].map(t => (
            <button
              key={t.key}
              className={`profile-tab ${tab === t.key ? "active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              <span className="profile-tab-icon">{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* ── Messages ────────────────── */}
        {msg.text && (
          <div className={`profile-msg profile-msg-${msg.type}`}>{msg.text}</div>
        )}

        {/* ── Tab Body ────────────────── */}
        <div className="profile-body">

          {/* ============ ACCOUNT TAB ============ */}
          {tab === "account" && (
            <>
              {!passMode ? (
                <>
                  <div className="profile-section-title">Personal Information</div>
                  <div className="profile-form-row">
                    <div className="profile-field">
                      <label>First Name</label>
                      <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Juan" />
                    </div>
                    <div className="profile-field">
                      <label>Last Name</label>
                      <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Dela Cruz" />
                    </div>
                  </div>
                  <div className="profile-field">
                    <label>Phone</label>
                    <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+63 9XX XXX XXXX" type="tel" />
                  </div>
                  <div className="profile-field">
                    <label>Bio <span className="profile-opt">(optional)</span></label>
                    <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us a little about yourself…" rows={3} />
                  </div>
                  <div className="profile-field">
                    <label>Avatar URL <span className="profile-opt">(optional)</span></label>
                    <input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://…/photo.jpg" />
                  </div>
                  <div className="profile-actions-row">
                    <button className="profile-save-btn" onClick={handleProfileSave} disabled={loading}>
                      {loading ? "Saving…" : "Save Changes"}
                    </button>
                    <button className="profile-link-btn" onClick={() => setPassMode(true)}>
                      Change Password →
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="profile-section-title">Change Password</div>
                  <div className="profile-field">
                    <label>New Password</label>
                    <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Min. 8 characters" />
                  </div>
                  <div className="profile-field">
                    <label>Confirm Password</label>
                    <input type="password" value={confPass} onChange={e => setConfPass(e.target.value)} placeholder="Repeat password" />
                  </div>
                  <div className="profile-actions-row">
                    <button className="profile-save-btn" onClick={handlePasswordSave} disabled={loading}>
                      {loading ? "Saving…" : "Change Password"}
                    </button>
                    <button className="profile-link-btn" onClick={() => setPassMode(false)}>
                      ← Back to Profile
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {/* ============ CART TAB ============ */}
          {tab === "cart" && (
            <>
              {cartItems.length === 0 ? (
                <div className="profile-empty-state">
                  <span className="profile-empty-icon">🛒</span>
                  <p className="profile-empty-title">Your cart is empty</p>
                  <p className="profile-empty-sub">Browse shops and add some finds!</p>
                </div>
              ) : (
                <>
                  <div className="profile-section-title">Cart Items ({cartItems.length})</div>
                  <div className="profile-item-list">
                    {cartItems.map(item => (
                      <div key={item._id || item.id} className="profile-item-card">
                        <div className="profile-item-swatch" style={{ background: item.palette || "#e5e0d5" }}>
                          {item.images?.[0] && <img src={item.images[0]} alt={item.title || item.name} />}
                        </div>
                        <div className="profile-item-info">
                          <p className="profile-item-name">{item.title || item.name}</p>
                          <p className="profile-item-shop">{item.shopName || ""}</p>
                          <p className="profile-item-price">₹{(item.price * item.qty).toLocaleString()}</p>
                          <div className="profile-qty-row">
                            <button className="profile-qty-btn" disabled={item.qty <= 1} onClick={() => onQtyChange(item._id || item.id, item.qty - 1)}>−</button>
                            <span className="profile-qty-val">{item.qty}</span>
                            <button className="profile-qty-btn" onClick={() => onQtyChange(item._id || item.id, item.qty + 1)}>+</button>
                          </div>
                        </div>
                        <button className="profile-item-remove" title="Remove" onClick={() => onRemoveFromCart(item._id || item.id)}>🗑</button>
                      </div>
                    ))}
                  </div>
                  <div className="profile-cart-footer">
                    <div className="profile-cart-total">
                      <span>Total</span>
                      <span className="profile-cart-total-amt">₹{cartTotal.toLocaleString()}</span>
                    </div>
                    <button className="profile-save-btn profile-checkout-btn">Proceed to Checkout →</button>
                    <p className="profile-cart-note">Checkout coming soon — items are saved for your session.</p>
                  </div>
                </>
              )}
            </>
          )}

          {/* ============ WISHLIST TAB ============ */}
          {tab === "wishlist" && (
            <>
              {wishlistProducts.length === 0 ? (
                <div className="profile-empty-state">
                  <span className="profile-empty-icon">♡</span>
                  <p className="profile-empty-title">Your wishlist is empty</p>
                  <p className="profile-empty-sub">Save your favourite finds for later!</p>
                </div>
              ) : (
                <>
                  <div className="profile-section-title">Saved Items ({wishlistProducts.length})</div>
                  <div className="profile-item-list profile-wishlist-grid">
                    {wishlistProducts.map(p => (
                      <div key={p.id} className="profile-wish-card">
                        <div className="profile-wish-swatch" style={{ background: p.palette || "#e5e0d5" }} />
                        <div className="profile-wish-info">
                          <p className="profile-wish-name">{p.name}</p>
                          <p className="profile-wish-price">₹{p.price.toLocaleString()}</p>
                          <p className="profile-wish-meta">{p.category} · {p.condition}</p>
                        </div>
                        <button className="profile-wish-remove" title="Remove from wishlist" onClick={() => handleRemoveWishlist(p.id)}>✕</button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* ============ ORDERS TAB ============ */}
          {tab === "orders" && (
            <>
              {ordersLoading ? (
                <div className="profile-empty-state">
                  <p className="profile-empty-sub">Loading orders…</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="profile-empty-state">
                  <span className="profile-empty-icon">📦</span>
                  <p className="profile-empty-title">No orders yet</p>
                  <p className="profile-empty-sub">Your purchase history will appear here.</p>
                </div>
              ) : (
                <>
                  <div className="profile-section-title">Order History ({orders.length})</div>
                  <div className="profile-orders-list">
                    {orders.map(order => (
                      <div key={order._id} className="profile-order-card">
                        <div className="profile-order-header">
                          <div>
                            <span className="profile-order-id">#{order._id.slice(-8).toUpperCase()}</span>
                            <span className="profile-order-date">
                              {new Date(order.createdAt).toLocaleDateString("en-US", {
                                year: "numeric", month: "short", day: "numeric",
                              })}
                            </span>
                          </div>
                          <span className="profile-order-status" style={{ color: statusColor(order.status), borderColor: statusColor(order.status) }}>
                            {order.status}
                          </span>
                        </div>
                        <div className="profile-order-items">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="profile-order-item">
                              <span className="profile-order-item-name">{it.name}</span>
                              <span className="profile-order-item-qty">×{it.quantity}</span>
                              <span className="profile-order-item-price">₹{it.price.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                        <div className="profile-order-total">
                          Total: <strong>₹{order.total.toLocaleString()}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
