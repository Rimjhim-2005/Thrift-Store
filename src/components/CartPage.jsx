import { useState, useEffect } from "react";
import useAppStore from "../store/useAppStore";
import "./CartPage.css";

export default function CartPage({ onBack, onProductClick, onChatOpen }) {
  const [buying, setBuying] = useState(null); // itemId being confirmed
  
  // Get cart state and actions from store
  const { removeFromCart, updateCartQuantity, fetchCart } = useAppStore();
  const { items: cart, isLoading: cartLoading, error: cartError } = useAppStore((state) => state.cart);

  // Fetch cart on mount
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const removeItem     = (id) => removeFromCart(id);
  const updateQty      = async (id, qty) => { 
    if (qty < 1) { 
      removeItem(id); 
      return; 
    } 
    await updateCartQuantity(id, qty);
  };
  const cartTotal      = cart.reduce((s, i) => s + (i.productId?.price || i.price || 0) * (i.quantity || i.qty || 1), 0);
  
  // Group by seller/shop if available
  const grouped        = cart.reduce((acc, item) => { 
    const seller = item.productId?.seller || "Unknown Seller"; 
    if (!acc[seller]) acc[seller] = []; 
    acc[seller].push(item); 
    return acc; 
  }, {});

  const handleBuy = (item) => {
    const seller = item.productId?.seller || "Unknown Seller";
    onChatOpen({ name: seller }, item);
  };

  if (cartLoading) {
    return (
      <div className="cart-page">
        <div className="cp-topbar">
          <button className="cp-back" onClick={onBack}>← Continue Shopping</button>
          <div className="cp-topbar-title">
            <div className="cp-logo-icon">♻</div>
            <span>Thriftly</span>
          </div>
          <span className="cp-topbar-right">🛍 Cart</span>
        </div>
        <div className="cp-empty">
          <div className="cp-empty-icon">⏳</div>
          <h2>Loading cart...</h2>
        </div>
      </div>
    );
  }

  if (cartError) {
    return (
      <div className="cart-page">
        <div className="cp-topbar">
          <button className="cp-back" onClick={onBack}>← Continue Shopping</button>
          <div className="cp-topbar-title">
            <div className="cp-logo-icon">♻</div>
            <span>Thriftly</span>
          </div>
          <span className="cp-topbar-right">🛍 Cart</span>
        </div>
        <div className="cp-empty">
          <div className="cp-empty-icon">⚠️</div>
          <h2>Error loading cart</h2>
          <p>{cartError}</p>
          <button className="cp-browse-btn" onClick={onBack}>Browse Shops</button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      {/* Topbar */}
      <div className="cp-topbar">
        <button className="cp-back" onClick={onBack}>← Continue Shopping</button>
        <div className="cp-topbar-title">
          <div className="cp-logo-icon">♻</div>
          <span>Thriftly</span>
        </div>
        <span className="cp-topbar-right">🛍 Cart</span>
      </div>

      {cart.length === 0 ? (
        <div className="cp-empty">
          <div className="cp-empty-icon">🛍</div>
          <h2>Your cart is empty</h2>
          <p>Browse items and add them to get started.</p>
          <button className="cp-browse-btn" onClick={onBack}>Browse Items</button>
        </div>
      ) : (
        <div className="cp-body">
          <div className="cp-items-col">
            <h2 className="cp-title">Your Cart <span>({cart.length} item{cart.length!==1?"s":""})</span></h2>

            {Object.entries(grouped).map(([seller, items]) => {
              return (
                <div key={seller} className="cp-shop-group">
                  <div className="cp-shop-group-header">
                    <span className="cp-shop-logo">🏪</span>
                    <span className="cp-shop-name">{seller}</span>
                  </div>

                  {items.map(item => {
                    const product = item.productId || item;
                    const itemPrice = product.price || 0;
                    const itemQty = item.quantity || item.qty || 1;
                    return (
                      <div key={item._id} className="cp-item-row">
                        <div
                          className="cp-item-img"
                          style={{ 
                            backgroundImage: `url(${product.image})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }}
                          onClick={() => onProductClick(product)}
                        />
                        <div className="cp-item-info">
                          <p className="cp-item-category">{product.category || "Item"}</p>
                          <p className="cp-item-name" onClick={() => onProductClick(product)}>{product.name}</p>
                          <div className="cp-item-details">
                            <span>SKU: {product._id}</span>
                            <span className="cp-item-dot">·</span>
                            <span>Stock</span>
                          </div>
                        </div>

                        <div className="cp-item-qty">
                          <button className="cp-qty-btn" onClick={() => updateQty(item._id, itemQty - 1)}>−</button>
                          <span className="cp-qty-num">{itemQty}</span>
                          <button className="cp-qty-btn" onClick={() => updateQty(item._id, itemQty + 1)}>+</button>
                        </div>

                        <div className="cp-item-right">
                          <p className="cp-item-price">₱ {(itemPrice * itemQty).toLocaleString()}</p>
                          <div className="cp-item-actions">
                            <button className="cp-buy-btn" onClick={() => handleBuy(item)}>
                              Buy → Chat Seller
                            </button>
                            <button className="cp-remove-btn" onClick={() => removeItem(item._id)} title="Remove">✕</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="cp-summary">
            <h3 className="cp-summary-title">Order Summary</h3>
            <div className="cp-summary-lines">
              {cart.map(item => {
                const product = item.productId || item;
                const itemPrice = product.price || 0;
                const itemQty = item.quantity || item.qty || 1;
                return (
                  <div key={item._id} className="cp-summary-line">
                    <span>{product.name?.length > 26 ? product.name.slice(0,26)+"…" : product.name}</span>
                    <span>₱ {(itemPrice * itemQty).toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
            <div className="cp-summary-divider" />
            <div className="cp-summary-total">
              <span>Total</span>
              <span>₱ {cartTotal.toLocaleString()}</span>
            </div>
            <p className="cp-summary-note">
              💬 Clicking "Buy → Chat Seller" on any item opens a direct chat with the shop owner to arrange payment and pickup/delivery.
            </p>
            <button className="cp-checkout-all-btn" onClick={() => {
              const firstItem = cart[0];
              if (firstItem) handleBuy(firstItem);
            }}>
              Checkout All → Chat Sellers
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
