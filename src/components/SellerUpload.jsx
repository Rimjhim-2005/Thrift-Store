import { useState, useRef } from "react";
import { PALETTES } from "../data";
import "./SellerUpload.css";

const CATEGORIES  = ["Tops","Bottoms","Outerwear","Dresses","Sneakers","Accessories"];
const CONDITIONS  = ["Excellent","Very Good","Good","Fair"];
const COLORS      = ["Black","White","Blue","Navy","Grey","Brown","Tan","Beige","Red","Green","Yellow","Cream","Charcoal","Other"];
const STYLES      = ["Casual","Streetwear","Vintage","Minimal","Formal","Grunge","Sporty","Elegant"];
const ERAS        = ["70s","80s","90s","Y2K","2010s","Modern","Classic"];

const EMPTY_FORM  = { name:"", category:"", price:"", size:"", condition:"", color:"", style:"", era:"", tags:"", desc:"" };

const CSV_TEMPLATE = `name,category,price,size,condition,color,style,era,tags,description
Levi's 501 Jeans,Bottoms,850,W30 L32,Good,Blue,Casual,90s,"jeans,denim,blue",Classic straight-leg jeans`;

function FormField({ label, required, children }) {
  return (
    <div className="su-field">
      <label className="su-label">{label}{required && <span className="su-req">*</span>}</label>
      {children}
    </div>
  );
}

export default function SellerUpload({ onBack, onDashboard }) {
  const [mode, setMode]           = useState("single"); // "single" | "bulk"
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saved, setSaved]         = useState(false);
  const [csvFile, setCsvFile]     = useState(null);
  const [csvPreview, setCsvPreview] = useState([]);
  const [csvUploaded, setCsvUploaded] = useState(false);
  const [dragOver, setDragOver]   = useState(false);
  const [imgDrag, setImgDrag]     = useState(false);
  const [images, setImages]       = useState([]);
  const csvRef  = useRef();
  const imgRef  = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Single submit
  const handleSave = () => {
    setSaved(true);
    setTimeout(() => { setSaved(false); setForm(EMPTY_FORM); setImages([]); }, 2500);
  };

  // CSV parse preview
  const handleCSV = (file) => {
    if (!file) return;
    setCsvFile(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const lines = e.target.result.trim().split("\n").slice(1);
      const rows  = lines.slice(0, 5).map(line => {
        const cols = line.split(",");
        return { name: cols[0], category: cols[1], price: cols[2], size: cols[3], condition: cols[4] };
      });
      setCsvPreview(rows);
    };
    reader.readAsText(file);
  };

  const handleBulkUpload = () => {
    setCsvUploaded(true);
    setTimeout(() => setCsvUploaded(false), 2500);
  };

  const handleImgDrop = (e) => {
    e.preventDefault(); setImgDrag(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    const urls  = files.map(f => URL.createObjectURL(f));
    setImages(prev => [...prev, ...urls].slice(0, 6));
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "thriftly_bulk_template.csv"; a.click();
  };

  return (
    <div className="seller-upload-page">
      {/* Topbar */}
      <div className="su-topbar">
        <button className="su-back" onClick={onBack}>← Back</button>
        <div className="su-topbar-title">
          <div className="su-topbar-logo">♻</div>
          <span>Seller Portal</span>
        </div>
        <button className="su-dashboard-btn" onClick={onDashboard}>Dashboard →</button>
      </div>

      <div className="su-body">
        {/* Sidebar */}
        <aside className="su-sidebar">
          <h2 className="su-sidebar-title">Upload Products</h2>
          <p className="su-sidebar-sub">Add new items to your shop. Upload one at a time or in bulk via CSV.</p>
          <div className="su-mode-tabs">
            <button className={`su-mode-tab ${mode==="single"?"active":""}`} onClick={() => setMode("single")}>
              Single Item
            </button>
            <button className={`su-mode-tab ${mode==="bulk"?"active":""}`} onClick={() => setMode("bulk")}>
              Bulk Upload
            </button>
          </div>
          <div className="su-tips">
            <p className="su-tips-title">📌 Tips for better listings</p>
            <ul className="su-tips-list">
              <li>Use clear, descriptive names</li>
              <li>Add all relevant tags for search</li>
              <li>Be honest about condition</li>
              <li>Upload 4–6 quality photos</li>
              <li>Price fairly — check similar items</li>
            </ul>
          </div>
        </aside>

        {/* Main form area */}
        <div className="su-main">
          {mode === "single" ? (
            <div className="su-card">
              <div className="su-card-header">
                <h3>New Product Listing</h3>
                <p>Fill in all required fields to list your item on Thriftly.</p>
              </div>

              {/* Photo upload */}
              <div className="su-section">
                <p className="su-section-title">Product Photos</p>
                <div
                  className={`su-img-drop ${imgDrag?"drag":""}`}
                  onDragOver={e => { e.preventDefault(); setImgDrag(true); }}
                  onDragLeave={() => setImgDrag(false)}
                  onDrop={handleImgDrop}
                  onClick={() => imgRef.current?.click()}
                >
                  <input ref={imgRef} type="file" accept="image/*" multiple style={{display:"none"}}
                    onChange={e => { const urls = Array.from(e.target.files).map(f => URL.createObjectURL(f)); setImages(p => [...p,...urls].slice(0,6)); }} />
                  {images.length === 0 ? (
                    <>
                      <div className="su-img-drop-icon">🖼</div>
                      <p className="su-img-drop-title">Drag photos here or click to browse</p>
                      <p className="su-img-drop-sub">Up to 6 photos · JPG, PNG · Max 5MB each</p>
                    </>
                  ) : (
                    <div className="su-img-previews">
                      {images.map((src, i) => (
                        <div key={i} className="su-img-preview-wrap">
                          <img src={src} alt="" className="su-img-preview" />
                          <button className="su-img-remove" onClick={e => { e.stopPropagation(); setImages(p => p.filter((_,j)=>j!==i)); }}>✕</button>
                          {i === 0 && <span className="su-img-primary">Main</span>}
                        </div>
                      ))}
                      {images.length < 6 && (
                        <div className="su-img-add-more">
                          <span>+</span>
                          <p>Add more</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Basic info */}
              <div className="su-section">
                <p className="su-section-title">Basic Information</p>
                <div className="su-grid-2">
                  <FormField label="Product Name" required>
                    <input className="su-input" placeholder="e.g. Levi's 501 Original Jeans" value={form.name} onChange={e=>set("name",e.target.value)} />
                  </FormField>
                  <FormField label="Category" required>
                    <select className="su-select" value={form.category} onChange={e=>set("category",e.target.value)}>
                      <option value="">Select category…</option>
                      {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Price (₱)" required>
                    <input className="su-input" type="number" placeholder="e.g. 850" value={form.price} onChange={e=>set("price",e.target.value)} />
                  </FormField>
                  <FormField label="Size" required>
                    <input className="su-input" placeholder="e.g. M, W30 L32, US 10" value={form.size} onChange={e=>set("size",e.target.value)} />
                  </FormField>
                  <FormField label="Condition" required>
                    <select className="su-select" value={form.condition} onChange={e=>set("condition",e.target.value)}>
                      <option value="">Select condition…</option>
                      {CONDITIONS.map(c=><option key={c}>{c}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Color">
                    <select className="su-select" value={form.color} onChange={e=>set("color",e.target.value)}>
                      <option value="">Select color…</option>
                      {COLORS.map(c=><option key={c}>{c}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Style">
                    <select className="su-select" value={form.style} onChange={e=>set("style",e.target.value)}>
                      <option value="">Select style…</option>
                      {STYLES.map(s=><option key={s}>{s}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Era / Decade">
                    <select className="su-select" value={form.era} onChange={e=>set("era",e.target.value)}>
                      <option value="">Select era…</option>
                      {ERAS.map(e=><option key={e}>{e}</option>)}
                    </select>
                  </FormField>
                </div>
              </div>

              {/* Tags */}
              <div className="su-section">
                <p className="su-section-title">Search Tags</p>
                <FormField label="Tags (comma-separated)">
                  <input className="su-input" placeholder="e.g. jeans, blue, casual, streetwear, denim" value={form.tags} onChange={e=>set("tags",e.target.value)} />
                </FormField>
                {form.tags && (
                  <div className="su-tag-preview">
                    {form.tags.split(",").map(t=>t.trim()).filter(Boolean).map((t,i)=>(
                      <span key={i} className="su-tag-chip">{t}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="su-section">
                <p className="su-section-title">Description</p>
                <FormField label="Item Description" required>
                  <textarea className="su-textarea" rows={4} placeholder="Describe the item — brand, fabric, fit, notable features, signs of wear…" value={form.desc} onChange={e=>set("desc",e.target.value)} />
                </FormField>
                <p className="su-char-count">{form.desc.length} / 500 characters</p>
              </div>

              <div className="su-actions">
                <button className="su-btn-secondary" onClick={() => setForm(EMPTY_FORM)}>Clear Form</button>
                <button className={`su-btn-primary ${saved?"saved":""}`} onClick={handleSave} disabled={saved}>
                  {saved ? "✓ Product Listed!" : "List Product"}
                </button>
              </div>
            </div>
          ) : (
            /* Bulk upload */
            <div className="su-card">
              <div className="su-card-header">
                <h3>Bulk Upload via CSV</h3>
                <p>Upload multiple products at once using our CSV template.</p>
              </div>

              <div className="su-section">
                <p className="su-section-title">Step 1 — Download Template</p>
                <div className="su-template-box">
                  <div className="su-template-info">
                    <div className="su-template-icon">📄</div>
                    <div>
                      <p className="su-template-name">thriftly_bulk_template.csv</p>
                      <p className="su-template-desc">Contains all required columns with an example row</p>
                    </div>
                  </div>
                  <button className="su-download-btn" onClick={downloadTemplate}>⬇ Download</button>
                </div>
                <div className="su-csv-columns">
                  <p className="su-cols-label">Required columns:</p>
                  <div className="su-cols-list">
                    {["name","category","price","size","condition","color","style","era","tags","description"].map(col => (
                      <span key={col} className="su-col-chip">{col}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="su-section">
                <p className="su-section-title">Step 2 — Upload Your CSV</p>
                <div
                  className={`su-csv-drop ${dragOver?"drag":""}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); handleCSV(e.dataTransfer.files[0]); }}
                  onClick={() => csvRef.current?.click()}
                >
                  <input ref={csvRef} type="file" accept=".csv" style={{display:"none"}} onChange={e => handleCSV(e.target.files[0])} />
                  <div className="su-csv-drop-icon">📋</div>
                  {csvFile ? (
                    <>
                      <p className="su-csv-filename">✓ {csvFile}</p>
                      <p className="su-csv-sub">Click to replace</p>
                    </>
                  ) : (
                    <>
                      <p className="su-csv-drop-title">Drag your CSV here or click to browse</p>
                      <p className="su-csv-sub">Only .csv files accepted</p>
                    </>
                  )}
                </div>
              </div>

              {csvPreview.length > 0 && (
                <div className="su-section">
                  <p className="su-section-title">Step 3 — Preview & Confirm</p>
                  <p className="su-preview-note">Showing first {csvPreview.length} rows from your file:</p>
                  <div className="su-preview-table-wrap">
                    <table className="su-preview-table">
                      <thead>
                        <tr>{["Name","Category","Price","Size","Condition"].map(h=><th key={h}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {csvPreview.map((row, i) => (
                          <tr key={i}>
                            <td>{row.name}</td><td>{row.category}</td>
                            <td>₱ {row.price}</td><td>{row.size}</td><td>{row.condition}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="su-actions">
                    <button className="su-btn-secondary" onClick={() => { setCsvFile(null); setCsvPreview([]); }}>Cancel</button>
                    <button className={`su-btn-primary ${csvUploaded?"saved":""}`} onClick={handleBulkUpload} disabled={csvUploaded}>
                      {csvUploaded ? `✓ ${csvPreview.length} Products Uploaded!` : `Upload ${csvPreview.length} Products`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
