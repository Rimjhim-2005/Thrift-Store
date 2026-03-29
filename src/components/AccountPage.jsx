import { useEffect, useState } from "react";
import "./AccountPage.css";

const API = "http://localhost:5000/api";

export default function AccountPage({
  user,
  cartItems,
  onQtyChange,
  onRemoveFromCart,
  onBack,
  onUserUpdate,
  onCheckout,
  onOpenMessages,
  onLogout,
  onShopSettings,
}) {
  const [tab, setTab] = useState("account");
  const [orders, setOrders] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);

  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [newPass, setNewPass] = useState("");

  useEffect(() => {
    setFirstName(user.firstName || "");
    setLastName(user.lastName || "");
    setPhone(user.phone || "");
  }, [user.firstName, user.lastName, user.phone]);

  useEffect(() => {
    if (tab !== "orders") return;
    fetch(`${API}/auth/orders`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { orders: [] }))
      .then((d) => setOrders(d.orders || []))
      .catch(() => setOrders([]));
  }, [tab]);

  const loadWishlist = () => {
    fetch(`${API}/auth/wishlist/items`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => {
        setWishlistItems(d.items || []);
      })
      .catch(() => setWishlistItems([]));
  };

  useEffect(() => {
    if (tab !== "wishlist") return;
    loadWishlist();
  }, [tab, user?.wishlist]);

  const saveProfile = async () => {
    const res = await fetch(`${API}/auth/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ firstName, lastName, phone, newPassword: newPass || undefined }),
    });
    if (!res.ok) return;
    const data = await res.json();
    onUserUpdate?.({ ...user, ...data.user });
    setNewPass("");
  };

  const removeWishlistItem = async (itemId) => {
    const id = String(itemId);
    await fetch(`${API}/auth/wishlist/${encodeURIComponent(id)}`, {
      method: "DELETE",
      credentials: "include",
    });
    const next = (user.wishlist || []).filter((w) => String(w) !== id);
    onUserUpdate?.({ ...user, wishlist: next });
    loadWishlist();
  };

  const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
    <div className="account-shell">
      <div className="account-wrap">
        <header className="account-hero">
          <button type="button" className="account-back" onClick={onBack}>← Back</button>
          <p className="account-eyebrow">Profile</p>
          <h1 className="account-title">Account</h1>
          <p className="account-lede">Manage your details, orders, and saved pieces.</p>
        </header>

        <nav className="account-pills" aria-label="Account sections">
          {["account", "orders", "wishlist", "cart", "messages"].map((t) => (
            <button
              key={t}
              type="button"
              className={`account-pill ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "messages" ? "Messages" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </nav>

        {tab === "account" && (
          <section className="account-panel">
            <h2 className="account-panel-title">Your details</h2>
            <div className="account-field-grid">
              <label className="account-label">
                First name
                <input className="account-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </label>
              <label className="account-label">
                Last name
                <input className="account-input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </label>
              <label className="account-label wide">
                Phone
                <input className="account-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
              <label className="account-label wide">
                New password
                <input className="account-input" value={newPass} onChange={(e) => setNewPass(e.target.value)} type="password" placeholder="Leave blank to keep current" />
              </label>
            </div>
            <div className="account-actions">
              <button type="button" className="account-btn primary" onClick={saveProfile}>Save changes</button>
              {onShopSettings && (
                <button type="button" className="account-btn secondary" onClick={onShopSettings}>
                  Shop settings
                </button>
              )}
              <button type="button" className="account-btn ghost" onClick={onLogout}>Log out</button>
            </div>
          </section>
        )}

        {tab === "orders" && (
          <section className="account-panel">
            <h2 className="account-panel-title">Orders</h2>
            <div className="account-list">
              {orders.map((o) => (
                <div key={o._id} className="account-row-card">
                  <span className="account-mono">#{String(o._id).slice(-8)}</span>
                  <span className="account-status">{o.status}</span>
                  <span className="account-price">₹{Number(o.totalPrice || o.total || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
            {!orders.length && <p className="account-empty">No orders yet.</p>}
          </section>
        )}

        {tab === "wishlist" && (
          <section className="account-panel">
            <h2 className="account-panel-title">Wishlist</h2>
            <div className="account-wishlist">
              {wishlistItems.map((w) => (
                <div key={w._id || w.id} className="account-wish-card">
                  <div className="account-wish-visual" style={w.images?.[0]?.startsWith?.("http") ? { backgroundImage: `url(${w.images[0]})` } : { background: w.images?.[0] || "#e5e0d5" }} />
                  <div className="account-wish-info">
                    <p className="account-wish-name">{w.name || w.title}</p>
                    <p className="account-wish-meta">₹{Number(w.price || 0).toLocaleString()}{w.shopName ? ` · ${w.shopName}` : ""}</p>
                  </div>
                  <button type="button" className="account-btn ghost sm" onClick={() => removeWishlistItem(w._id || w.id)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
            {!wishlistItems.length && <p className="account-empty">Wishlist is empty.</p>}
          </section>
        )}

        {tab === "cart" && (
          <section className="account-panel">
            <h2 className="account-panel-title">Cart</h2>
            <div className="account-list">
              {cartItems.map((i) => (
                <div key={i._id || i.id} className="account-row-card cart">
                  <span>{i.title || i.name}</span>
                  <div className="account-qty">
                    <button type="button" onClick={() => onQtyChange(i._id || i.id, i.qty - 1)} disabled={i.qty <= 1}>−</button>
                    <span>{i.qty}</span>
                    <button type="button" onClick={() => onQtyChange(i._id || i.id, i.qty + 1)}>+</button>
                  </div>
                  <button type="button" className="account-btn ghost sm" onClick={() => onRemoveFromCart(i._id || i.id)}>Remove</button>
                </div>
              ))}
            </div>
            <div className="account-checkout-bar">
              <span>Total <strong>₹{cartTotal.toLocaleString()}</strong></span>
              <button type="button" className="account-btn primary" onClick={onCheckout}>Proceed to checkout</button>
            </div>
          </section>
        )}

        {tab === "messages" && (
          <section className="account-panel">
            <h2 className="account-panel-title">Messages</h2>
            <p className="account-lede tight">Chat with shops you have contacted or purchased from.</p>
            <button type="button" className="account-btn primary" onClick={onOpenMessages}>Open inbox</button>
          </section>
        )}
      </div>
    </div>
  );
}
