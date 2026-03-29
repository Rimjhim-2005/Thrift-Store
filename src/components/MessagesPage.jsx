import { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import "./MessagesPage.css";

const API_BASE = "http://localhost:5000/api";

export default function MessagesPage({ user, initialChatContext, onBack }) {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [senderNames, setSenderNames] = useState({}); // Phase 5: Cache sender names
  const messagesEndRef = useRef(null);

  const socket = useMemo(() => io("http://localhost:5000", { withCredentials: true }), []);

  useEffect(() => () => socket.disconnect(), [socket]);

  useEffect(() => {
    socket.emit("chat:join-user", user?.id);
  }, [socket, user?.id]);

  // Phase 5: Resolve sender name from ID
  const resolveSenderName = async (senderId, conversation) => {
    if (senderNames[senderId]) return senderNames[senderId];
    
    // Check if sender is conversation buyer or seller
    if (senderId === conversation?.buyerId) {
      const res = await fetch(`${API_BASE}/auth/me`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const name = `${data.user?.firstName || "Buyer"} ${data.user?.lastName || ""}`.trim();
        setSenderNames(prev => ({ ...prev, [senderId]: name }));
        return name;
      }
    } else if (senderId === conversation?.sellerId) {
      // For seller, they're the shop owner
      return conversation?.shopName || "Shop Owner";
    }
    return "User";
  };

  useEffect(() => {
    // Phase 5: Pre-fetch sender names for current messages
    if (activeConversation && messages.length) {
      messages.forEach(m => {
        if (!senderNames[m.senderId]) {
          resolveSenderName(m.senderId, activeConversation).catch(() => {});
        }
      });
    }
  }, [activeConversation?._id, messages.length, senderNames]);

  const loadConversations = async () => {
    const res = await fetch(`${API_BASE}/chat/conversations`, { credentials: "include" });
    if (!res.ok) return;
    const data = await res.json();
    setConversations(data.conversations || []);
  };

  const loadMessages = async (conversationId) => {
    const res = await fetch(`${API_BASE}/chat/conversations/${conversationId}/messages`, { credentials: "include" });
    if (!res.ok) return;
    const data = await res.json();
    setActiveConversation(data.conversation);
    setMessages(data.messages || []);
    socket.emit("chat:join-conversation", conversationId);
  };

  useEffect(() => {
    loadConversations().catch(() => {});
  }, []);

  useEffect(() => {
    if (!activeConversation && conversations.length > 0) {
      loadMessages(conversations[0]._id).catch(() => {});
    }
  }, [conversations]);

  useEffect(() => {
    if (!initialChatContext) return;
    const start = async () => {
      const res = await fetch(`${API_BASE}/chat/conversations/get-or-create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sellerId: initialChatContext.sellerId,
          shopName: initialChatContext.shopName || "",
          sellerEmail: initialChatContext.sellerEmail || "",
          productId: initialChatContext.productId || "",
          productName: initialChatContext.productName || "",
          productPrice: Number(initialChatContext.productPrice) || 0,
          createIntentCard: !!initialChatContext.createIntentCard,
          createCheckoutSummary: !!initialChatContext.createCheckoutSummary,
          checkoutItems: initialChatContext.checkoutItems || [],
          checkoutTotal: Number(initialChatContext.checkoutTotal) || 0,
          orderId: initialChatContext.orderId || "",
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      await loadConversations();
      await loadMessages(data.conversation._id);
    };
    start().catch(() => {});
  }, [initialChatContext, user?.id]);

  useEffect(() => {
    const onMessage = (message) => {
      if (message.conversationId === activeConversation?._id) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
          const stripped = prev.filter((m) => !(m.pending && m.text === message.text && m.senderId === message.senderId));
          return [...stripped, message];
        });
      }
    };
    const onConversationUpdated = () => loadConversations().catch(() => {});
    socket.on("chat:message", onMessage);
    socket.on("chat:conversation-updated", onConversationUpdated);
    return () => {
      socket.off("chat:message", onMessage);
      socket.off("chat:conversation-updated", onConversationUpdated);
    };
  }, [socket, activeConversation?._id]);

  // Auto-scroll to the newest bubble whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!activeConversation?._id || !draft.trim()) return;
    const text = draft.trim();
    setDraft("");
    const tempId = `pending-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { _id: tempId, text, senderId: user?.id, senderRole: "buyer", pending: true },
    ]);
    try {
      const res = await fetch(`${API_BASE}/chat/conversations/${activeConversation._id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.message) {
        setMessages((prev) => {
          const without = prev.filter((m) => m._id !== tempId);
          if (without.some((m) => m._id === data.message._id)) return without;
          return [...without, data.message];
        });
      } else {
        setMessages((prev) => prev.filter((m) => m._id !== tempId));
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
    }
  };

  return (
    <div className="messages-page">
      <div className="messages-topbar">
        <button onClick={onBack} className="messages-back">← Back</button>
        <h2>Messages</h2>
      </div>
      <div className="messages-layout">
        <aside className="messages-list">
          {conversations.map((c) => (
            <button key={c._id} type="button" className={`conv-item ${activeConversation?._id === c._id ? "active" : ""}`} onClick={() => loadMessages(c._id)}>
              <div className="conv-title">{c.shopName || c.productName || "Conversation"}</div>
              <div className="conv-sub">{c.lastMessage || "No messages yet"}</div>
            </button>
          ))}
        </aside>
        <section className="messages-chat">
          {activeConversation ? (
            <>
              <div className="chat-header">
                <div>
                  <strong>{activeConversation.shopName || activeConversation.productName || "Chat"}</strong>
                  {activeConversation.shopName && activeConversation.productName && (
                    <div className="chat-header-sub">{activeConversation.productName}</div>
                  )}
                </div>
                <span>₹{Number(activeConversation.productPrice || 0).toLocaleString()}</span>
              </div>
              <div className="chat-body">
                {messages.map((m) => (
                  <div key={m._id} className={`bubble ${m.senderId === user?.id ? "mine" : ""} ${m.pending ? "pending" : ""}`}>
                    {/* Phase 5: Show sender identity unless it's the user's own message */}
                    {m.senderId !== user?.id && (
                      <div style={{ fontSize: "0.85em", fontWeight: "600", marginBottom: "4px", opacity: 0.7 }}>
                        {senderNames[m.senderId] || "User"}
                      </div>
                    )}
                    <div>{m.text}</div>
                    {/* Checkout summary card */}
                    {m.meta?.cardType === "checkout_summary" && m.meta?.lineItems?.length > 0 && (
                      <ul className="bubble-cart-list">
                        {m.meta.lineItems.map((line, idx) => (
                          <li key={idx}>
                            {line.name} ×{line.quantity} — ₹{(Number(line.price) * line.quantity).toLocaleString()}
                          </li>
                        ))}
                      </ul>
                    )}
                    {/* Phase 2: Purchase intent card */}
                    {m.meta?.cardType === "purchase_intent" && (
                      <div style={{ marginTop: "8px", padding: "8px", backgroundColor: "#f5f5f5", borderRadius: "6px", fontSize: "0.9em" }}>
                        <strong>Item:</strong> {m.meta.productName || "Item"}<br/>
                        <strong>Price:</strong> ₹{Number(m.meta.productPrice || 0).toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="chat-input">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Type a message…"
                />
                <button onClick={sendMessage}>Send</button>
              </div>
            </>
          ) : (
            <div className="chat-empty">Select a conversation to start messaging.</div>
          )}
        </section>
      </div>
    </div>
  );
}
