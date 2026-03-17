import { useState, useEffect } from "react";
import "./ListItem.css";

const API = "http://localhost:5000/api";

export default function ListItem({ onBack, user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("Good");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const clearMessages = () => { setError(""); setSuccess(""); };

  // Fetch seller's items
  const fetchItems = async () => {
    try {
      const res = await fetch(`${API}/items/my`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch { /* silent */ }
  };

  useEffect(() => { fetchItems(); }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!title || !price || !category) { setError("Title, price, and category are required."); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("category", category);
      formData.append("condition", condition);
      if (imageFile) formData.append("image", imageFile);

      const res = await fetch(`${API}/items`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Failed to create item."); return; }
      setSuccess("✓ Item listed successfully!");
      setTitle(""); setDescription(""); setPrice(""); setCategory(""); setCondition("Good");
      setImageFile(null); setImagePreview(null);
      fetchItems();
    } catch { setError("Network error. Is the backend running?"); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await fetch(`${API}/items/${id}`, { method: "DELETE", credentials: "include" });
      fetchItems();
    } catch { alert("Failed to delete."); }
  };

  if (!user || user.role !== "seller") {
    return (
      <div className="listitem-page">
        <div className="listitem-container">
          <button className="listitem-back" onClick={onBack}>← Back to Home</button>
          <div className="listitem-empty">
            <h2>🔒 Seller Access Only</h2>
            <p>You need to be logged in as a seller to list items.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="listitem-page">
      <div className="listitem-container">
        <button className="listitem-back" onClick={onBack}>← Back to Home</button>

        <div className="listitem-header">
          <h1>📦 List a New Item</h1>
          <p>Add products to your shop so buyers can discover them.</p>
        </div>

        <div className="listitem-grid">
          {/* Left: Form */}
          <form className="listitem-form" onSubmit={handleSubmit}>
            {error && <div className="listitem-msg listitem-msg-error">{error}</div>}
            {success && <div className="listitem-msg listitem-msg-success">{success}</div>}

            <div className="listitem-group">
              <label>Item Title *</label>
              <input type="text" placeholder="e.g. Vintage Levi's 501" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="listitem-group">
              <label>Description</label>
              <textarea placeholder="Describe your item…" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="listitem-row">
              <div className="listitem-group">
                <label>Price (₱) *</label>
                <input type="number" min="0" step="0.01" placeholder="299" value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
              <div className="listitem-group">
                <label>Category *</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">Select…</option>
                  <option>Tops</option>
                  <option>Bottoms</option>
                  <option>Dresses</option>
                  <option>Outerwear</option>
                  <option>Shoes</option>
                  <option>Accessories</option>
                  <option>Bags</option>
                  <option>Vintage</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div className="listitem-group">
              <label>Condition</label>
              <select value={condition} onChange={(e) => setCondition(e.target.value)}>
                <option>New with tags</option>
                <option>Like new</option>
                <option>Good</option>
                <option>Fair</option>
                <option>Well loved</option>
              </select>
            </div>

            <div className="listitem-group">
              <label>Photo</label>
              <input type="file" accept="image/*" onChange={handleImageChange} />
              {imagePreview && <img src={imagePreview} alt="Preview" className="listitem-preview" />}
            </div>

            <button type="submit" className="listitem-submit" disabled={loading}>
              {loading ? "Listing…" : "List Item →"}
            </button>
          </form>

          {/* Right: My Items */}
          <div className="listitem-my-items">
            <h3>Your Listed Items ({items.length})</h3>
            {items.length === 0 ? (
              <p className="listitem-no-items">No items yet — list your first one!</p>
            ) : (
              <div className="listitem-items-list">
                {items.map((item) => (
                  <div key={item._id} className="listitem-card">
                    {item.image && (
                      <img src={`http://localhost:5000${item.image}`} alt={item.title} className="listitem-card-img" />
                    )}
                    <div className="listitem-card-info">
                      <p className="listitem-card-title">{item.title}</p>
                      <p className="listitem-card-price">₱{item.price}</p>
                      <p className="listitem-card-meta">{item.category} · {item.condition}</p>
                    </div>
                    <button className="listitem-card-delete" onClick={() => handleDelete(item._id)}>🗑</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
