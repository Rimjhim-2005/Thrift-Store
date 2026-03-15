import { useState, useEffect, useRef } from "react";
import { SHOPS, PRODUCTS } from "../data";
import "./ChatPage.css";

function formatTime() {
  const now = new Date();
  return now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function ChatPage({ initialShop, initialProduct, chats, setChats, onBack, onProductClick }) {
  const allShops = SHOPS;
  const [activeShopId, setActiveShopId] = useState(initialShop?.id || allShops[0]?.id);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const activeShop = allShops.find(s => s.id === activeShopId);
  const chatKey = `user_1_shop_${activeShopId}`;
  const thread = chats[chatKey] || { shopId: activeShopId, userId: "user_1", messages: [] };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, activeShopId]);

  // On mount: if there's an initial product being purchased, send auto message
  useEffect(() => {
    if (initialProduct && initialShop) {
      const key = `user_1_shop_${initialShop.id}`;
      setChats(prev => {
        const existing = prev[key] || { shopId: initialShop.id, userId: "user_1", messages: [] };
        const alreadyHasProductMsg = existing.messages.some(m => m.productId === initialProduct.id && m.from === "buyer");
        if (alreadyHasProductMsg) return prev;
        const buyMsg = {
          id: Date.now(),
          from: "buyer",
          text: `Hi! I'd like to buy "${initialProduct.name}" (Size: ${initialProduct.size}) listed at ₱${initialProduct.price.toLocaleString()}. Is it still available?`,
          time: formatTime(),
          productId: initialProduct.id,
          productCard: { name: initialProduct.name, price: initialProduct.price, size: initialProduct.size, palette: initialProduct.palette, category: initialProduct.category },
        };
        const sellerReply = {
          id: Date.now() + 1,
          from: "seller",
          text: `Thanks for your interest! 😊 Yes, "${initialProduct.name}" is still available. Let me know how you'd like to arrange pickup or delivery.`,
          time: formatTime(),
        };
        return { ...prev, [key]: { ...existing, messages: [...existing.messages, buyMsg, sellerReply] } };
      });
    }
  }, [initialProduct, initialShop]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    const newMsg = { id: Date.now(), from: "buyer", text, time: formatTime() };
    setChats(prev => {
      const existing = prev[chatKey] || { shopId: activeShopId, userId: "user_1", messages: [] };
      return { ...prev, [chatKey]: { ...existing, messages: [...existing.messages, newMsg] } };
    });
    setInput("");

    // Simulate seller auto-reply after short delay
    setTimeout(() => {
      const replies = [
        "Thanks for reaching out! I'll get back to you shortly.",
        "Great question! Let me check on that for you 👍",
        "Sure! We can arrange pickup or delivery at your convenience.",
        "Still available! Come visit us anytime during store hours.",
        "Feel free to drop by to check it out in person 🌿",
      ];
      const reply = { id: Date.now() + 1, from: "seller", text: replies[Math.floor(Math.random() * replies.length)], time: formatTime() };
      setChats(prev => {
        const existing = prev[chatKey] || { shopId: activeShopId, userId: "user_1", messages: [] };
        return { ...prev, [chatKey]: { ...existing, messages: [...existing.messages, reply] } };
      });
    }, 1200 + Math.random() * 800);
  };

  const handleKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  // Get last message preview for sidebar
  const getPreview = (shopId) => {
    const key = `user_1_shop_${shopId}`;
    const t = chats[key];
    if (!t || t.messages.length === 0) return "No messages yet";
    const last = t.messages[t.messages.length - 1];
    return (last.from === "buyer" ? "You: " : "") + last.text.slice(0, 40) + (last.text.length > 40 ? "…" : "");
  };

  const getUnread = (shopId) => {
    const key = `user_1_shop_${shopId}`;
    const t = chats[key];
    if (!t) return 0;
    return t.messages.filter(m => m.from === "seller").length > 0 ? 1 : 0;
  };

  return (
    <div className="chat-page">
      {/* Topbar */}
      <div className="chat-topbar">
        <button className="chat-back" onClick={onBack}>← Back</button>
        <div className="chat-topbar-title">
          <div className="chat-logo-icon">♻</div>
          <span>Messages</span>
        </div>
        <span />
      </div>

      <div className="chat-layout">
        {/* ── Sidebar: shop threads ── */}
        <aside className="chat-sidebar">
          <div className="chat-sidebar-header">
            <h3>Conversations</h3>
            <span className="chat-thread-count">{allShops.length}</span>
          </div>
          <div className="chat-threads">
            {allShops.map(shop => {
              const unread = getUnread(shop.id);
              return (
                <div
                  key={shop.id}
                  className={`chat-thread ${activeShopId === shop.id ? "active" : ""}`}
                  onClick={() => setActiveShopId(shop.id)}
                >
                  <div className="chat-thread-avatar">{shop.logo}</div>
                  <div className="chat-thread-info">
                    <div className="chat-thread-top">
                      <p className="chat-thread-name">{shop.name}</p>
                      {unread > 0 && <span className="chat-thread-unread">{unread}</span>}
                    </div>
                    <p className="chat-thread-preview">{getPreview(shop.id)}</p>
                    <p className="chat-thread-location">📍 {shop.location}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── Chat main ── */}
        <div className="chat-main">
          {/* Chat header */}
          <div className="chat-header">
            <div className="chat-header-avatar">{activeShop?.logo}</div>
            <div className="chat-header-info">
              <p className="chat-header-name">{activeShop?.name}</p>
              <p className="chat-header-sub">📍 {activeShop?.location} · {activeShop?.hours}</p>
            </div>
            <div className="chat-header-status">
              <span className="chat-status-dot" />
              <span className="chat-status-text">Usually replies quickly</span>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {thread.messages.length === 0 ? (
              <div className="chat-empty">
                <div className="chat-empty-icon">{activeShop?.logo}</div>
                <p className="chat-empty-title">Start a conversation with {activeShop?.name}</p>
                <p className="chat-empty-sub">Ask about availability, pickup, or anything else.</p>
              </div>
            ) : (
              thread.messages.map(msg => (
                <div key={msg.id} className={`chat-msg-wrap ${msg.from === "buyer" ? "buyer" : "seller"}`}>
                  {msg.from === "seller" && (
                    <div className="chat-msg-avatar">{activeShop?.logo}</div>
                  )}
                  <div className="chat-msg-block">
                    {/* Product card preview if attached */}
                    {msg.productCard && (
                      <div className="chat-product-card" onClick={() => { const p = PRODUCTS.find(p => p.id === msg.productId); if (p) onProductClick(p); }}>
                        <div className="chat-product-img" style={{ background: msg.productCard.palette }} />
                        <div className="chat-product-info">
                          <p className="chat-product-cat">{msg.productCard.category}</p>
                          <p className="chat-product-name">{msg.productCard.name}</p>
                          <p className="chat-product-price">₱ {msg.productCard.price.toLocaleString()} · {msg.productCard.size}</p>
                        </div>
                      </div>
                    )}
                    <div className={`chat-bubble ${msg.from}`}>
                      <p>{msg.text}</p>
                    </div>
                    <p className="chat-msg-time">{msg.time}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chat-input-bar">
            <textarea
              className="chat-input"
              placeholder={`Message ${activeShop?.name}…`}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
            />
            <button className="chat-send-btn" onClick={sendMessage} disabled={!input.trim()}>
              Send ↑
            </button>
          </div>
        </div>

        {/* ── Shop info sidebar ── */}
        <aside className="chat-info-sidebar">
          <div className={`chat-info-banner ${activeShop?.banner}`} />
          <div className="chat-info-body">
            <div className="chat-info-logo">{activeShop?.logo}</div>
            <h3 className="chat-info-name">{activeShop?.name}</h3>
            <p className="chat-info-location">📍 {activeShop?.location}</p>
            <div className="chat-info-rating">
              {"★".repeat(Math.round(activeShop?.rating || 0))}
              <span> {activeShop?.rating} ({activeShop?.reviews} reviews)</span>
            </div>
            <p className="chat-info-desc">{activeShop?.desc}</p>
            <div className="chat-info-rows">
              <div className="chat-info-row"><span>🕐</span><span>{activeShop?.hours}</span></div>
              <div className="chat-info-row"><span>📞</span><span>{activeShop?.phone}</span></div>
              <div className="chat-info-row"><span>✉️</span><span>{activeShop?.email}</span></div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
