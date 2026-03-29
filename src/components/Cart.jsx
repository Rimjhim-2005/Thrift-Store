import { getListingStockCap } from "../utils/stock";
import "./Cart.css";

export default function Cart({ isOpen, onClose, cartItems, onRemove, onQtyChange, onCheckout }) {
  const total = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <>
      {/* Backdrop */}
      {isOpen && <div className="cart-backdrop" onClick={onClose} />}

      <aside className={`cart-drawer ${isOpen ? "open" : ""}`}>
        <div className="cart-header">
          <h2 className="cart-title">🛒 Your Cart</h2>
          <button className="cart-close" onClick={onClose}>✕</button>
        </div>

        {cartItems.length === 0 ? (
          <div className="cart-empty">
            <div className="cart-empty-icon">🛍️</div>
            <p>Your cart is empty.</p>
            <p className="cart-empty-sub">Browse shops and add some finds!</p>
          </div>
        ) : (
          <>
            <ul className="cart-list">
              {cartItems.map((item) => {
                const cap = getListingStockCap(item);
                const atMax = item.qty >= cap;
                return (
                <li key={item._id || item.id} className="cart-item">
                  {item.images?.[0] && (
                    <img src={item.images[0]} alt={item.title || item.name} className="cart-item-img" />
                  )}
                  <div className="cart-item-info">
                    <p className="cart-item-title">{item.title || item.name}</p>
                    <p className="cart-item-shop">{item.shopName || ""}</p>
                    <p className="cart-item-price">₹{(item.price * item.qty).toLocaleString()}</p>
                    <div className="cart-qty-row">
                      <button
                        className="cart-qty-btn"
                        onClick={() => onQtyChange(item._id || item.id, item.qty - 1)}
                        disabled={item.qty <= 1}
                      >−</button>
                      <span className="cart-qty-val">{item.qty}</span>
                      <button
                        type="button"
                        className="cart-qty-btn"
                        onClick={() => onQtyChange(item._id || item.id, item.qty + 1)}
                        disabled={atMax}
                        title={atMax ? `Max ${cap} available` : "Increase quantity"}
                      >+</button>
                    </div>
                  </div>
                  <button
                    className="cart-remove"
                    onClick={() => onRemove(item._id || item.id)}
                    title="Remove item"
                  >🗑</button>
                </li>
              );
              })}
            </ul>

            <div className="cart-footer">
              <div className="cart-total-row">
                <span>Total</span>
                <span className="cart-total-amt">₹{total.toLocaleString()}</span>
              </div>
              <button className="cart-checkout-btn" onClick={onCheckout}>Proceed to Checkout →</button>
              <p className="cart-note">Checkout coming soon — items are saved for your session.</p>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
