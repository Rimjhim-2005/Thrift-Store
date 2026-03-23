import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import "./MessagesPage.css";

const API_BASE = "http://localhost:5000/api";

export default function MessagesPage({ user, initialChatContext, onBack }) {
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");

  const socket = useMemo(() => io("http://localhost:5000", { withCredentials: true }), []);

  useEffect(() => () => socket.disconnect(), [socket]);

  useEffect(() => {
    socket.emit("chat:join-user", user?.id);
  }, [socket, user?.id]);

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
          buyerId: user?.id,
          sellerId: initialChatContext.sellerId,
          shopName: initialChatContext.shopName || "",
          sellerEmail: initialChatContext.sellerEmail || "",
          productId: initialChatContext.productId || "",
          productName: initialChatContext.productName || "",
          productPrice: Number(initialChatContext.productPrice) || 0,
          createIntentCard: !!initialChatContext.createIntentCard,
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
        setMessages((prev) => [...prev, message]);
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

  const sendMessage = async () => {
    if (!activeConversation?._id || !draft.trim()) return;
    const text = draft.trim();
    setDraft("");
    await fetch(`${API_BASE}/chat/conversations/${activeConversation._id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ text }),
    });
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
            <button key={c._id} className={`conv-item ${activeConversation?._id === c._id ? "active" : ""}`} onClick={() => loadMessages(c._id)}>
              <div className="conv-title">{c.productName || "Conversation"}</div>
              <div className="conv-sub">{c.lastMessage || "No messages yet"}</div>
            </button>
          ))}
        </aside>
        <section className="messages-chat">
          {activeConversation ? (
            <>
              <div className="chat-header">
                <strong>{activeConversation.productName || "Chat"}</strong>
                <span>P{Number(activeConversation.productPrice || 0).toLocaleString()}</span>
              </div>
              <div className="chat-body">
                {messages.map((m) => (
                  <div key={m._id} className={`bubble ${m.senderId === user?.id ? "mine" : ""}`}>
                    <div>{m.text}</div>
                  </div>
                ))}
              </div>
              <div className="chat-input">
                <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a message..." />
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
