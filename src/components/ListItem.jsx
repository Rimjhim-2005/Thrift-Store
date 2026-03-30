import { useState, useEffect } from "react";
import "./ListItem.css";

const API = "http://localhost:5000/api";

export default function ListItem({ onBack, user, onViewMyShop, onViewItem }) {
  const [items, setItems] = useState([]);
  const [myShop, setMyShop] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Edit mode state
  const [editingItem, setEditingItem] = useState(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("Good");
  const [stock, setStock] = useState("1");
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  // For editing: track existing images and which ones to keep
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);

  const clearMessages = () => { setError(""); setSuccess(""); };

  // Reset form to empty state
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPrice("");
    setCategory("");
    setCondition("Good");
    setStock("1");
    setImageFiles([]);
    setImagePreviews([]);
    setExistingImages([]);
    setImagesToDelete([]);
    setEditingItem(null);
  };

  // Load item data into form for editing
  const startEditing = (item) => {
    setEditingItem(item);
    setTitle(item.name || "");
    setDescription(item.description || "");
    setPrice(item.price || "");
    setCategory(item.category || "");
    setCondition(item.condition || "Good");
    setStock(item.stock?.toString() || "1");
    setExistingImages(item.images || []);
    setImagesToDelete([]);
    setImageFiles([]);
    setImagePreviews([]);
    clearMessages();
    
    // Scroll to form
    document.querySelector('.listitem-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Cancel editing
  const cancelEditing = () => {
    resetForm();
    clearMessages();
  };

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

  useEffect(() => {
    if (!user || user.role !== "seller") return;
    fetch(`${API}/shop/my`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.seller) {
          setMyShop({ shopName: data.seller.shopName, slug: data.seller.slug || "" });
        }
      })
      .catch(() => {});
  }, [user]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const totalImages = existingImages.length - imagesToDelete.length + imageFiles.length + files.length;
    if (totalImages > 5) {
      setError("Maximum 5 images allowed.");
      return;
    }
    const newFiles = [...imageFiles, ...files];
    setImageFiles(newFiles);
    
    const previews = newFiles.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const removeNewImage = (index) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const removeExistingImage = (imagePath) => {
    setImagesToDelete([...imagesToDelete, imagePath]);
  };

  const restoreExistingImage = (imagePath) => {
    setImagesToDelete(imagesToDelete.filter(img => img !== imagePath));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!title || !price || !category) { setError("Title, price, and category are required."); return; }
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append("name", title);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("category", category);
      formData.append("condition", condition);
      formData.append("stock", stock);
      
      // Calculate images to keep (existing images minus ones marked for deletion)
      const imagesToKeep = existingImages.filter(img => !imagesToDelete.includes(img));
      formData.append("imagesToKeep", JSON.stringify(imagesToKeep));
      
      // Add new images
      imageFiles.forEach(file => formData.append("images", file));

      let res;
      if (editingItem) {
        // Update existing item
        res = await fetch(`${API}/items/${editingItem._id}`, {
          method: "PUT",
          credentials: "include",
          body: formData,
        });
      } else {
        // Create new item
        res = await fetch(`${API}/items`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });
      }
      
      const data = await res.json();
      if (!res.ok) { setError(data.message || `Failed to ${editingItem ? 'update' : 'create'} item.`); return; }
      
      setSuccess(editingItem ? "✓ Item updated successfully!" : "✓ Item listed successfully!");
      resetForm();
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
          <h1>{editingItem ? "✏️ Edit Item" : "📦 List a New Item"}</h1>
          <p>{editingItem ? "Update your item details below." : "Add products to your shop so buyers can discover them."}</p>
          {myShop?.shopName && (
            <button
              type="button"
              className="listitem-view-shop"
              onClick={() => onViewMyShop?.({ shopName: myShop.shopName, slug: myShop.slug })}
            >
              View my live shop →
            </button>
          )}
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
                <label>Price (₹) *</label>
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

            <div className="listitem-row">
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
                <label>Stock</label>
                <input type="number" min="0" placeholder="1" value={stock} onChange={(e) => setStock(e.target.value)} />
              </div>
            </div>

            <div className="listitem-group">
              <label>Photos (up to 5)</label>
              
              {/* Existing Images (when editing) */}
              {existingImages.length > 0 && (
                <div className="listitem-existing-images">
                  <p className="listitem-section-label">Current images (click to remove):</p>
                  <div className="listitem-preview-gallery">
                    {existingImages.map((imgPath, idx) => {
                      const isMarkedForDelete = imagesToDelete.includes(imgPath);
                      return (
                        <div key={idx} className={`listitem-preview-item ${isMarkedForDelete ? 'marked-delete' : ''}`}>
                          <img 
                            src={`http://localhost:5000${imgPath}`} 
                            alt={`Current ${idx + 1}`} 
                            className="listitem-preview" 
                            style={{ opacity: isMarkedForDelete ? 0.4 : 1 }}
                          />
                          <button
                            type="button"
                            className="listitem-preview-remove"
                            onClick={() => isMarkedForDelete ? restoreExistingImage(imgPath) : removeExistingImage(imgPath)}
                            title={isMarkedForDelete ? "Restore this image" : "Remove this image"}
                          >
                            {isMarkedForDelete ? "↺" : "✕"}
                          </button>
                          {isMarkedForDelete && <span className="listitem-delete-badge">Removed</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add New Images */}
              <input type="file" accept="image/*" multiple onChange={handleImageChange} />
              {imagePreviews.length > 0 && (
                <div className="listitem-new-images">
                  <p className="listitem-section-label">New images to add:</p>
                  <div className="listitem-preview-gallery">
                    {imagePreviews.map((preview, idx) => (
                      <div key={idx} className="listitem-preview-item">
                        <img src={preview} alt={`New ${idx + 1}`} className="listitem-preview" />
                        <button
                          type="button"
                          className="listitem-preview-remove"
                          onClick={() => removeNewImage(idx)}
                          title="Remove this image"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <p className="listitem-image-help">
                {editingItem 
                  ? `You have ${existingImages.length - imagesToDelete.length} images. You can add up to ${5 - (existingImages.length - imagesToDelete.length)} more.`
                  : "Upload up to 5 images of your item."
                }
              </p>
            </div>

            <div className="listitem-form-actions">
              {editingItem && (
                <button 
                  type="button" 
                  className="listitem-cancel-btn" 
                  onClick={cancelEditing}
                  disabled={loading}
                >
                  Cancel
                </button>
              )}
              <button type="submit" className="listitem-submit" disabled={loading}>
                {loading 
                  ? (editingItem ? "Saving…" : "Listing…") 
                  : (editingItem ? "Save Changes →" : "List Item →")
                }
              </button>
            </div>
          </form>

          {/* Right: My Items */}
          <div className="listitem-my-items">
            <h3>Your Listed Items ({items.length})</h3>
            {items.length === 0 ? (
              <p className="listitem-no-items">No items yet — list your first one!</p>
            ) : (
              <div className="listitem-items-list">
                {items.map((item) => (
                  <div 
                    key={item._id} 
                    className="listitem-card"
                    onClick={() => onViewItem?.(item)}
                    style={{ cursor: "pointer" }}
                  >
                    {item.images?.[0] && (
                      <img src={`http://localhost:5000${item.images[0]}`} alt={item.name} className="listitem-card-img" />
                    )}
                    <div className="listitem-card-info">
                      <p className="listitem-card-title">{item.name}</p>
                      <p className="listitem-card-price">₹{item.price}</p>
                      <p className="listitem-card-meta">{item.category} · {item.condition}</p>
                    </div>
                    <div className="listitem-card-actions">
                      <button 
                        className="listitem-card-edit" 
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(item);
                        }}
                        title="Edit item"
                      >
                        ✏️
                      </button>
                      <button 
                        className="listitem-card-delete" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item._id);
                        }}
                        title="Delete item"
                      >
                        🗑
                      </button>
                    </div>
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
