import { useState, useRef, useMemo, useEffect } from "react";
import { SHOPS } from "../data";
import "./SearchPage.css";

const API = "http://localhost:5000/api";

// ── Text-based search ────────────────────────────────────────────────────────
function scoreProduct(product, query) {
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  const words = q.split(/\s+/);
  let score = 0;
  for (const word of words) {
    if (product.name.toLowerCase().includes(word))     score += 10;
    if (product.category.toLowerCase().includes(word)) score += 8;
    if (product.color?.toLowerCase().includes(word))   score += 7;
    if (product.style?.toLowerCase().includes(word))   score += 6;
    if (product.era?.toLowerCase().includes(word))     score += 5;
    if (product.tags?.some((t) => t.toLowerCase().includes(word))) score += 4;
    if (product.desc.toLowerCase().includes(word))     score += 2;
    if (product.tag?.toLowerCase().includes(word))     score += 3;
  }
  return score;
}

// ── Category & filter options ────────────────────────────────────────────────
const CATEGORIES  = ["All", "Tops", "Bottoms", "Outerwear", "Dresses", "Sneakers", "Accessories"];
const SORT_OPTIONS = [
  { value: "relevance", label: "Most Relevant" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

/** Multi-select style/tag filters (OR: item matches any selected tag). */
const STYLE_TAG_FILTERS = [
  { key: "vintage", label: "Vintage" },
  { key: "streetwear", label: "Streetwear" },
  { key: "denim", label: "Denim" },
  { key: "sustainable", label: "Sustainable" },
  { key: "linen", label: "Linen" },
  { key: "hoodie", label: "Hoodie" },
  { key: "outerwear", label: "Outerwear" },
  { key: "sneakers", label: "Sneakers" },
];

// ── AI Camera Analysis via Anthropic API ─────────────────────────────────────
async function analyzeImageWithAI(base64Image, mediaType) {
  const systemPrompt = `You are a fashion analysis AI for a thrift shop directory called Thriftly.
Given an image of clothing or an outfit, identify the key visual characteristics and return a JSON object with these fields:
{
  "searchTerms": ["array", "of", "relevant", "search", "keywords"],
  "colors": ["dominant colors"],
  "styles": ["e.g. casual, streetwear, vintage, minimal, formal, grunge"],
  "categories": ["e.g. tops, bottoms, outerwear, dresses, sneakers, accessories"],
  "era": "approximate fashion era (e.g. 70s, 80s, 90s, modern, classic)",
  "description": "brief 1-sentence description of the style"
}
Focus on: silhouette, color palette, fabric texture cues, style era, and overall aesthetic.
Return ONLY valid JSON, no markdown or explanation.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64Image },
          },
          { type: "text", text: "Analyze this clothing/outfit image and return the JSON." },
        ],
      }],
    }),
  });

  const data = await response.json();
  const text = data.content?.map((b) => b.text || "").join("") || "";
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

function scoreProductByAI(product, aiResult) {
  let score = 0;
  const allTerms = [
    ...(aiResult.searchTerms || []),
    ...(aiResult.colors || []),
    ...(aiResult.styles || []),
    ...(aiResult.categories || []),
    aiResult.era || "",
  ].map((t) => t.toLowerCase());

  for (const term of allTerms) {
    if (!term) continue;
    if (product.name.toLowerCase().includes(term))       score += 8;
    if (product.category.toLowerCase().includes(term))   score += 7;
    if (product.color?.toLowerCase().includes(term))     score += 9;
    if (product.style?.toLowerCase().includes(term))     score += 8;
    if (product.era?.toLowerCase().includes(term))       score += 6;
    if (product.tags?.some((t) => t.toLowerCase().includes(term))) score += 5;
    if (product.desc.toLowerCase().includes(term))       score += 2;
  }
  return score;
}

// ── Product card ─────────────────────────────────────────────────────────────
function ProductCard({ product, onProductClick }) {
  // Handle both mock data (shopId) and DB items (sellerId which may be populated)
  const sellerId = product.sellerId?._id || product.sellerId;
  const shop = SHOPS.find((s) => s.id === product.shopId || s.id === sellerId?.toString());
  const shopName = shop?.name || product.sellerId?.shopName || product.shopName || "—";
  const rawImg = product.images?.[0];
  const imageUrl = rawImg
    ? (rawImg.startsWith("http") ? rawImg : `http://localhost:5000${rawImg}`)
    : null;
  const palette = product.palette || "linear-gradient(135deg,#C9B99A 0%,#A08060 100%)";

  return (
    <div className="sp-product-card" onClick={() => onProductClick(product)}>
      <div className="sp-product-img" style={{ background: imageUrl ? "#f5f0e8" : palette }}>
        {imageUrl && (
          <img src={imageUrl} alt={product.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} />
        )}
        {product.category && <span className="sp-product-tag">{product.category}</span>}
        <div className="sp-product-hover-overlay">
          <span>View Product</span>
        </div>
      </div>
      <div className="sp-product-info">
        <p className="sp-product-category">{product.category}</p>
        <h3 className="sp-product-name">{product.name}</h3>
        <div className="sp-product-tags">
          {product.tags?.slice(0, 3).map((t) => (
            <span key={t} className="sp-product-tag-pill">{t}</span>
          ))}
        </div>
        <div className="sp-product-meta">
          <span className="sp-product-shop">🏪 {shopName}</span>
          <span className="sp-product-size">{product.condition}</span>
        </div>
        <div className="sp-product-footer">
          <span className="sp-product-price">₹ {Number(product.price || 0).toLocaleString()}</span>
          <span className="sp-product-condition">{product.condition}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main SearchPage ───────────────────────────────────────────────────────────
export default function SearchPage({ onBack, onProductClick, initialQuery = "", initialCategory = "All" }) {
  const [query, setQuery]               = useState(initialQuery);
  const [category, setCategory]         = useState(initialCategory);
  const [sort, setSort]                 = useState("relevance");
  const [results, setResults]           = useState(null);
  const [allItems, setAllItems]         = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Sync if parent re-navigates with different initial values
  useEffect(() => {
    setQuery(initialQuery);
    setCategory(initialCategory);
    setAiResults(null);
    setAiResult(null);
    if (initialQuery) {
      setResults(null); // will trigger a text search
    } else if (allItems.length > 0) {
      // Browse mode: show all items sorted by most viewed
      const sorted = [...allItems].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
      setResults(sorted);
    } else {
      setResults(null);
    }
  }, [initialQuery, initialCategory]);

  // Camera / AI state
  const [cameraMode, setCameraMode]     = useState(false);
  const [previewSrc, setPreviewSrc]     = useState(null);
  const [aiLoading, setAiLoading]       = useState(false);
  const [aiResult, setAiResult]         = useState(null);
  const [aiError, setAiError]           = useState(null);
  const [aiResults, setAiResults]       = useState(null);
  const [filterTags, setFilterTags]     = useState([]);

  // Fetch all items from backend on component mount
  useEffect(() => {
    const fetchItems = async () => {
      setItemsLoading(true);
      try {
        const res = await fetch(`${API}/items`, { credentials: "include" });
        const data = await res.ok ? await res.json() : { items: [] };
        const fetched = data.items || [];
        setAllItems(fetched);
        // Browse mode: auto-show all items sorted by most viewed when no active search
        if (!initialQuery.trim()) {
          const sorted = [...fetched].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
          setResults(sorted);
        }
      } catch (err) {
        console.error("Failed to fetch items:", err);
        setAllItems([]);
      } finally {
        setItemsLoading(false);
      }
    };
    fetchItems();
  }, []);

  const fileInputRef = useRef(null);

  const toggleFilterTag = (key) => {
    setFilterTags((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  // ── Text search ────────────────────────────────────────────────────────────
  const handleSearch = async (q = query) => {
    const q2 = q.trim();
    if (!q2) {
      // Browse mode: show all items sorted by most viewed
      setSearchLoading(true);
      try {
        const res = await fetch(`${API}/search?sort=${sort}`, { credentials: "include" });
        const data = await res.ok ? await res.json() : { items: [] };
        const items = data.items || [];
        setResults(items);
      } catch (err) {
        console.error("Search error:", err);
        setResults([]);
      } finally {
        setSearchLoading(false);
      }
      setAiResults(null);
      setAiResult(null);
      return;
    }

    // Backend search with fuzzy matching
    setSearchLoading(true);
    try {
      const categoryParam = category !== "All" ? `&category=${encodeURIComponent(category)}` : "";
      const sortParam = sort !== "relevance" ? `&sort=${sort}` : "";
      const res = await fetch(
        `${API}/search?q=${encodeURIComponent(q2)}${categoryParam}${sortParam}`,
        { credentials: "include" }
      );
      const data = await res.ok ? await res.json() : { items: [] };
      const items = data.items || [];
      setResults(items);
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    } finally {
      setSearchLoading(false);
    }
    
    setAiResults(null);
    setAiResult(null);
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleSearch(); };

  // ── Camera / image upload ──────────────────────────────────────────────────
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const mediaType = file.type || "image/jpeg";
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      setPreviewSrc(dataUrl);
      setAiError(null);
      setAiLoading(true);

      const base64 = dataUrl.split(",")[1];
      try {
        const result = await analyzeImageWithAI(base64, mediaType);
        setAiResult(result);

        // Score and filter products from backend
        let scored = allItems.map((p) => ({
          ...p, _score: scoreProductByAI(p, result),
        })).filter((p) => p._score > 0)
          .sort((a, b) => b._score - a._score);

        setAiResults(scored);
        setResults(null);
        setQuery("");
      } catch (err) {
        setAiError("Couldn't analyze the image. Please try another photo.");
      } finally {
        setAiLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearCamera = () => {
    setPreviewSrc(null); setAiResult(null);
    setAiResults(null);  setAiError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const baseResults = aiResults ?? results;
  const displayedResults = useMemo(() => {
    if (!baseResults) return null;
    if (filterTags.length === 0) return baseResults;
    const wanted = filterTags.map((t) => t.toLowerCase());
    return baseResults.filter((p) => {
      const blob = [
        ...(p.tags || []),
        p.category,
        p.name,
        p.description,
      ].filter(Boolean).map((x) => String(x).toLowerCase());
      return wanted.some((w) => blob.some((b) => b.includes(w) || w.includes(b)));
    });
  }, [baseResults, filterTags]);

  const hasSearch = results !== null || aiResults !== null;

  return (
    <div className="search-page">

      {/* ── Topbar ── */}
      <div className="sp-topbar">
        <button className="sp-back-btn" onClick={onBack}>← Back to Home</button>
        <div className="sp-logo">
          <div className="sp-logo-icon">♻</div>
          <span>Thriftly</span>
        </div>
      </div>

      {/* ── Hero search bar ── */}
      <div className="sp-hero">
        <div className="sp-hero-bg" />
        <div className="sp-hero-content">
          <h1 className="sp-hero-title">Find Your Next<br /><em>Thrift Find</em></h1>
          <p className="sp-hero-sub">Search by keyword, style, color, or upload a photo to find matching outfits.</p>

          <div className="sp-search-bar">
            <span className="sp-search-icon">🔍</span>
            <input
              className="sp-search-input"
              type="text"
              placeholder="Search jeans, vintage jacket, black hoodie…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {query && (
              <button className="sp-search-clear" onClick={() => { setQuery(""); setResults(null); }}>✕</button>
            )}
            <button className="sp-search-btn" onClick={() => handleSearch()}>Search</button>
            <div className="sp-search-divider" />
            <button
              className={`sp-camera-btn ${cameraMode ? "active" : ""}`}
              onClick={() => { setCameraMode(!cameraMode); clearCamera(); }}
              title="Search by image"
            >
              📷
            </button>
          </div>

          {/* Camera panel */}
          {cameraMode && (
            <div className="sp-camera-panel">
              {!previewSrc ? (
                <div
                  className="sp-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) { const dt = new DataTransfer(); dt.items.add(file); fileInputRef.current.files = dt.files; handleFileChange({ target: { files: dt.files } }); }
                  }}
                >
                  <div className="sp-dropzone-icon">📸</div>
                  <p className="sp-dropzone-title">Upload a photo of an outfit</p>
                  <p className="sp-dropzone-sub">AI will analyze the style and find matching thrift items</p>
                  <span className="sp-dropzone-btn">Choose Photo</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <div className="sp-camera-preview">
                  <img src={previewSrc} alt="Uploaded outfit" className="sp-preview-img" />
                  <div className="sp-preview-info">
                    {aiLoading && (
                      <div className="sp-ai-loading">
                        <div className="sp-ai-spinner" />
                        <div>
                          <p className="sp-ai-loading-title">Analyzing your photo…</p>
                          <p className="sp-ai-loading-sub">AI is identifying style, colors, and matching items</p>
                        </div>
                      </div>
                    )}
                    {aiResult && !aiLoading && (
                      <div className="sp-ai-result">
                        <p className="sp-ai-result-label">✨ AI detected</p>
                        <p className="sp-ai-result-desc">{aiResult.description}</p>
                        <div className="sp-ai-chips">
                          {[...(aiResult.colors || []), ...(aiResult.styles || []), aiResult.era].filter(Boolean).map((chip, i) => (
                            <span key={i} className="sp-ai-chip">{chip}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {aiError && (
                      <div className="sp-ai-error">{aiError}</div>
                    )}
                    <button className="sp-clear-img-btn" onClick={clearCamera}>✕ Try another image</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick tags */}
          {!hasSearch && !cameraMode && (
            <div className="sp-quick-tags">
              <span className="sp-quick-label">Try:</span>
              {["vintage denim", "black hoodie", "streetwear", "linen dress", "grey cardigan", "cargo pants"].map((q) => (
                <button key={q} className="sp-quick-tag" onClick={() => { setQuery(q); handleSearch(q); }}>
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Filters ── */}
      {(hasSearch || query) && (
        <div className="sp-filters-bar">
          <div className="sp-filters-left">
            <div className="sp-category-pills">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={`sp-cat-pill ${category === cat ? "active" : ""}`}
                  onClick={() => { setCategory(cat); handleSearch(); }}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="sp-style-tags-row" role="group" aria-label="Filter by style tags">
              <span className="sp-style-tags-label">Tags</span>
              <button
                type="button"
                className={`sp-style-tag-pill ${filterTags.length === 0 ? "active" : ""}`}
                onClick={() => setFilterTags([])}
              >
                Any
              </button>
              {STYLE_TAG_FILTERS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  className={`sp-style-tag-pill ${filterTags.includes(key) ? "active" : ""}`}
                  onClick={() => toggleFilterTag(key)}
                  aria-pressed={filterTags.includes(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <select
            className="sp-sort-select"
            value={sort}
            onChange={(e) => { setSort(e.target.value); handleSearch(); }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* ── Results ── */}
      <div className="sp-results-area">
        {/* Loading state */}
        {(itemsLoading || searchLoading) && !hasSearch && !cameraMode && (
          <div className="sp-empty">
            <div className="sp-empty-icon">⏳</div>
            <h2>{searchLoading ? "Searching..." : "Loading items..."}</h2>
          </div>
        )}
        {/* Empty state — only when not loading */}
        {!itemsLoading && !hasSearch && !cameraMode && (
          <div className="sp-empty">
            <div className="sp-empty-icon">🛍</div>
            <h2>Discover unique thrift finds</h2>
            <p>Search by name, style, color, or era — or upload a photo to find matching outfits.</p>
          </div>
        )}

        {/* Results header */}
        {hasSearch && (
          <div className="sp-results-header">
            <p className="sp-results-count">
              {searchLoading ? (
                "Searching..."
              ) : aiResults ? (
                `${displayedResults?.length ?? 0} items matching your photo`
              ) : query ? (
                <>
                  {displayedResults?.length ?? 0} result{displayedResults?.length !== 1 ? "s" : ""} for "{query}"
                  {displayedResults?.some(r => r._fuzzy) && (
                    <span className="sp-fuzzy-indicator"> (includes similar matches)</span>
                  )}
                </>
              ) : (
                `${displayedResults?.length ?? 0} items — most viewed first`
              )}
            </p>
          </div>
        )}

        {/* Results grid */}
        {hasSearch && displayedResults && displayedResults.length > 0 && (
          <div className="sp-results-grid">
            {displayedResults.map((product) => (
              <ProductCard
                key={product._id || product.id}
                product={product}
                onProductClick={onProductClick}
              />
            ))}
          </div>
        )}

        {/* No results */}
        {hasSearch && !searchLoading && displayedResults && displayedResults.length === 0 && (
          <div className="sp-no-results">
            <div className="sp-empty-icon">🔍</div>
            <h2>No items found</h2>
            <p>Try a different keyword or check your spelling. We search names, categories, and descriptions.</p>
            <button className="sp-browse-all-btn" onClick={() => { setQuery(""); handleSearch(""); }}>Browse All Items</button>
          </div>
        )}
      </div>
    </div>
  );
}
