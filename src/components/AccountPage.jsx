import { useEffect, useState } from "react";
import { PRODUCTS } from "../data";
import "./AccountPage.css";

const API = "http://localhost:5000/api";

export default function AccountPage({ user, cartItems, onQtyChange, onRemoveFromCart, onBack, onUserUpdate, onCheckout, onOpenMessages, onLogout }) {
  const [tab, setTab] = useState("account");
  const [orders, setOrders] = useState([]);

  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [newPass, setNewPass] = useState("");

  useEffect(() => {
    if (tab !== "orders") return;
    fetch(`${API}/auth/orders`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { orders: [] }))
      .then((d) => setOrders(d.orders || []))
      .catch(() => setOrders([]));
  }, [tab]);

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

  const wishlistProducts = PRODUCTS.filter((p) => (user.wishlist || []).includes(p.id) || (user.wishlist || []).includes(String(p.id)));
  const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
    <div className="account-page">
      <div className="account-top">
        <button onClick={onBack}>← Back</button>
        <h2>My Account</h2>
      </div>
      <div className="account-tabs">
        <button onClick={() => setTab("account")} className={tab === "account" ? "active" : ""}>Account</button>
        <button onClick={() => setTab("orders")} className={tab === "orders" ? "active" : ""}>Orders</button>
        <button onClick={() => setTab("wishlist")} className={tab === "wishlist" ? "active" : ""}>Wishlist</button>
        <button onClick={() => setTab("cart")} className={tab === "cart" ? "active" : ""}>Cart</button>
        <button onClick={() => setTab("messages")} className={tab === "messages" ? "active" : ""}>Shop Messages</button>
      </div>

      {tab === "account" && (
        <div className="card">
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First Name" />
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last Name" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
          <input value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="New Password" type="password" />
          <button onClick={saveProfile}>Save</button>
          <button onClick={onLogout}>Log Out</button>
        </div>
      )}

      {tab === "orders" && (
        <div className="card">
          {orders.map((o) => (
            <div key={o._id} className="order-row">
              <strong>#{o._id.slice(-8)}</strong>
              <span>{o.status}</span>
              <span>P{Number(o.totalPrice || o.total || 0).toLocaleString()}</span>
            </div>
          ))}
          {!orders.length && <p>No orders yet.</p>}
        </div>
      )}

      {tab === "wishlist" && (
        <div className="card">
          {wishlistProducts.map((w) => <div key={w.id}>{w.name} - P{w.price.toLocaleString()}</div>)}
          {!wishlistProducts.length && <p>Wishlist is empty.</p>}
        </div>
      )}

      {tab === "cart" && (
        <div className="card">
          {cartItems.map((i) => (
            <div key={i._id || i.id} className="order-row">
              <span>{i.title || i.name}</span>
              <div>
                <button onClick={() => onQtyChange(i._id || i.id, i.qty - 1)} disabled={i.qty <= 1}>-</button>
                <span style={{ margin: "0 8px" }}>{i.qty}</span>
                <button onClick={() => onQtyChange(i._id || i.id, i.qty + 1)}>+</button>
              </div>
              <button onClick={() => onRemoveFromCart(i._id || i.id)}>Remove</button>
            </div>
          ))}
          <div className="checkout-row">
            <strong>Total: P{cartTotal.toLocaleString()}</strong>
            <button onClick={onCheckout}>Proceed to Checkout</button>
          </div>
        </div>
      )}

      {tab === "messages" && (
        <div className="card">
          <p>Open all conversations and coordinate with buyers/sellers.</p>
          <button onClick={onOpenMessages}>Open Messages</button>
        </div>
      )}
    </div>
  );
}
