import { useState, useEffect, useMemo } from "react";
import { assetUrl } from "../utils/assetUrl";
import StarRating from "./StarRating";
import "./ShopDetail.css";

const API = "http://localhost:5000/api";

const CONDITIONS = { Excellent: 5, "Very Good": 4, Good: 3, "New with tags": 5, "Like new": 4, "Like New": 4, Fair: 2, "Well loved": 2 };

const CATEGORIES = ["All", "Tops", "Bottoms", "Outerwear", "Dresses", "Sneakers", "Accessories"];

const FALLBACK_PALETTES = [
  "linear-gradient(135deg,#C9B99A 0%,#A08060 100%)",
  "linear-gradient(135deg,#2C2824 0%,#4A3728 100%)",
  "linear-gradient(135deg,#8A9E6B 0%,#5C6B3A 100%)",
  "linear-gradient(135deg,#6B8A9E 0%,#3A5C6B 100%)",
];

export default function ShopDetail({ shop, user, onUserUpdate, onBack, onProductClick, onMessageSeller }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [sort, setSort] = useState("default");
  const [localSearch, setLocalSearch] = useState("");
  const [remoteItems, setRemoteItems] = useState([]);
  const [remoteShop, setRemoteShop] = useState(null);
  const [fetchFailed, setFetchFailed] = useState(false);
  
  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const storeKey = useMemo(() => {
    const k = shop?.slug || shop?.shopName || shop?.name || "";
    return k ? encodeURIComponent(k) : "";
  }, [shop?.slug, shop?.shopName, shop?.name]);

  useEffect(() => {
    if (!storeKey) {
      setRemoteItems([]);
      setRemoteShop(null);
      return;
    }
    let cancelled = false;
    fetch(`${API}/shops/store/${storeKey}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.shop) {
          if (!cancelled && data == null) setFetchFailed(true);
          return;
        }
        setFetchFailed(false);
        setRemoteShop(data.shop);
        const mapped = (data.items || []).map((it, i) => ({
          ...it,
          id: it.id || it._id,
          _id: it._id || it.id,
          palette: FALLBACK_PALETTES[i % FALLBACK_PALETTES.length],
          size: it.size || "—",
          tag: it.category || null,
          desc: it.description || "",
        }));
        setRemoteItems(mapped);
      })
      .catch(() => {
        if (!cancelled) setFetchFailed(true);
      });
    return () => { cancelled = true; };
  }, [storeKey]);

  useEffect(() => {
    if (!remoteShop?.id) return;
    const viewed = sessionStorage.getItem(`shop-view-${remoteShop.id}`);
    if (viewed) return;
    sessionStorage.setItem(`shop-view-${remoteShop.id}`, "1");
    fetch(`${API}/shops/${remoteShop.id}/view`, { method: "POST" }).catch(() => {});
  }, [remoteShop?.id]);

  // Fetch reviews when shop loads
  useEffect(() => {
    if (!remoteShop?.id) {
      setReviews([]);
      return;
    }
    
    // Fetch all reviews
    fetch(`${API}/reviews/${remoteShop.id}`)
      .then((r) => (r.ok ? r.json() : { reviews: [] }))
      .then((data) => setReviews(data.reviews || []))
      .catch(() => setReviews([]));
    
    // Check if user has already reviewed
    if (user) {
      fetch(`${API}/reviews/user/${remoteShop.id}`, { credentials: "include" })
        .then((r) => (r.ok ? r.json() : { hasReviewed: false }))
        .then((data) => {
          if (data.hasReviewed && data.review) {
            setUserReview(data.review);
            setNewRating(data.review.rating);
            setNewComment(data.review.comment || "");
          }
        })
        .catch(() => {});
    }
  }, [remoteShop?.id, user]);

  const products = remoteItems;

  const filtered = products
    .filter((p) => activeCategory === "All" || p.category === activeCategory)
    .filter((p) => {
      if (!localSearch.trim()) return true;
      const q = localSearch.toLowerCase();
      return (p.name || "").toLowerCase().includes(q) || (p.category || "").toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "name") return (a.name || "").localeCompare(b.name || "");
      return 0;
    });

  const availableCategories = ["All", ...new Set(products.map((p) => p.category).filter(Boolean))];

  const display = {
    ...shop,
    name: remoteShop?.shopName || shop?.name,
    longDesc: remoteShop?.shopDescription || shop?.longDesc || "",
    tags: (remoteShop?.tags?.length ? remoteShop.tags : shop?.tags) || [],
    location: remoteShop?.location || shop?.location || "",
    hours: remoteShop?.hours || shop?.hours || "",
    phone: remoteShop?.phone || shop?.phone || "",
    shopEmail: remoteShop?.shopEmail || shop?.email || "",
    since: remoteShop?.since || shop?.since || "",
    items: remoteShop?.itemCount ?? shop?.items,
    rating: remoteShop?.averageRating ?? shop?.rating ?? 4.8,
    reviews: remoteShop?.reviewCount ?? shop?.reviews ?? 0,
  };

  const headerStyle = remoteShop?.headerImageUrl
    ? {
        backgroundImage: `url(${assetUrl(remoteShop.headerImageUrl)})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : null;

  const wishlistIds = useMemo(() => new Set((user?.wishlist || []).map(String)), [user?.wishlist]);
  const [wishPopId, setWishPopId] = useState(null);

  // Submit review handler
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user || !remoteShop?.id || newRating < 1) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sellerId: remoteShop.id,
          rating: newRating,
          comment: newComment,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setUserReview({ rating: newRating, comment: newComment });
        setShowReviewForm(false);
        
        // Refresh reviews list
        const reviewsRes = await fetch(`${API}/reviews/${remoteShop.id}`);
        if (reviewsRes.ok) {
          const reviewsData = await reviewsRes.json();
          setReviews(reviewsData.reviews || []);
        }
        
        // Update remote shop rating
        if (data.sellerRating !== undefined) {
          setRemoteShop((prev) => ({
            ...prev,
            averageRating: data.sellerRating,
            reviewCount: data.reviewCount,
          }));
        }
      }
    } catch (err) {
      console.error("Failed to submit review:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleWishlist = async (e, product) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) return;
    const pid = String(product._id || product.id);
    if (!pid) return;
    const inList = wishlistIds.has(pid);
    try {
      const res = await fetch(`${API}/auth/wishlist/${encodeURIComponent(pid)}`, {
        method: inList ? "DELETE" : "POST",
        credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json();
      onUserUpdate?.({ ...user, wishlist: data.wishlist || [] });
      if (!inList) {
        setWishPopId(pid);
        window.setTimeout(() => setWishPopId((cur) => (cur === pid ? null : cur)), 500);
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="shop-detail-page">

      <div className="sd-topbar">
        <button type="button" className="sd-back-btn" onClick={onBack}>← Back to Shops</button>
        <div className="sd-breadcrumb">
          <span onClick={onBack} className="sd-breadcrumb-link" role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onBack()}>Browse Shops</span>
          <span className="sd-breadcrumb-sep">›</span>
          <span>{display.name}</span>
        </div>
      </div>

      <div
        className={`sd-banner ${!headerStyle ? shop?.banner || "" : ""}`}
        style={headerStyle || undefined}
      >
        <div className="sd-banner-overlay" />
      </div>

      <div className="sd-header-wrap">
        <div className="sd-header">
          <div className="sd-logo-wrap">
            {remoteShop?.shopLogoUrl ? (
              <img src={assetUrl(remoteShop.shopLogoUrl)} alt="" className="sd-logo-img" />
            ) : (
              <div className="sd-logo">{shop?.logo || "🏪"}</div>
            )}
          </div>
          <div className="sd-header-info">
            <div className="sd-header-top">
              <div>
                <h1 className="sd-shop-name">{display.name}</h1>
                <p className="sd-shop-location">📍 {display.location || "—"}</p>
              </div>
              <div className="sd-header-badges">
                <div className="sd-rating">
                  <StarRating 
                    rating={display.rating} 
                    size="small" 
                    showValue={true}
                  />
                  <span className="sd-rating-count">({display.reviews} reviews)</span>
                </div>
                <div className="sd-verified">✓ Verified Shop</div>
              </div>
            </div>
            <div className="sd-shop-tags">
              {display.tags.map((t) => (
                <span key={t} className="sd-tag">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="sd-body">

        <aside className="sd-sidebar">
          <div className="sd-sidebar-card">
            <h3 className="sd-sidebar-title">About the Shop</h3>
            <p className="sd-about-text">{display.longDesc || "—"}</p>
            {fetchFailed && remoteItems.length === 0 && (
              <p className="sd-api-hint">No live listings yet — check back soon.</p>
            )}
          </div>

          <div className="sd-sidebar-card">
            <h3 className="sd-sidebar-title">Shop Details</h3>
            <div className="sd-detail-list">
              <div className="sd-detail-row">
                <span className="sd-detail-icon">📍</span>
                <span>{display.location || "—"}</span>
              </div>
              <div className="sd-detail-row">
                <span className="sd-detail-icon">🕐</span>
                <span>{display.hours || "—"}</span>
              </div>
              <div className="sd-detail-row">
                <span className="sd-detail-icon">📞</span>
                <span>{display.phone || "—"}</span>
              </div>
              <div className="sd-detail-row">
                <span className="sd-detail-icon">✉️</span>
                <span>{display.shopEmail || "—"}</span>
              </div>
              <div className="sd-detail-row">
                <span className="sd-detail-icon">📅</span>
                <span>Est. {display.since || "—"}</span>
              </div>
            </div>
          </div>

          <div className="sd-sidebar-card sd-stat-card">
            <div className="sd-stat">
              <span className="sd-stat-num">{display.items ?? products.length}</span>
              <span className="sd-stat-label">Listed Items</span>
            </div>
            <div className="sd-stat">
              <span className="sd-stat-num">{display.reviews ?? "—"}</span>
              <span className="sd-stat-label">Reviews</span>
            </div>
            <div className="sd-stat">
              <span className="sd-stat-num">{shop?.since ?? "—"}</span>
              <span className="sd-stat-label">Est.</span>
            </div>
          </div>

          <div className="sd-contact-row">
            <button type="button" className="sd-contact-btn" onClick={() => onMessageSeller?.(shop, null)}>Message Shop Owner</button>
          </div>
        </aside>

        <div className="sd-products">
          <div className="sd-shop-search">
            <input
              type="search"
              className="sd-shop-search-input"
              placeholder="Filter items in this shop…"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
            />
          </div>
          <div className="sd-products-header">
            <div className="sd-category-filters">
              {availableCategories.filter((c) => c === "All" || CATEGORIES.includes(c)).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`sd-cat-btn ${activeCategory === cat ? "active" : ""}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="sd-sort-wrap">
              <span className="sd-results-count">{filtered.length} items</span>
              <select
                className="sd-sort-select"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="default">Sort: Default</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name">Name: A–Z</option>
              </select>
            </div>
          </div>

          <div className="sd-product-grid">
            {filtered.map((product) => {
              const rawImg = product.images?.[0];
              const imgStyle = rawImg
                ? { backgroundImage: `url(${assetUrl(rawImg)})`, backgroundSize: "cover", backgroundPosition: "center" }
                : { background: product.palette };
              const condNum = CONDITIONS[product.condition] || 3;
              const pid = String(product._id || product.id);
              const liked = wishlistIds.has(pid);
              return (
                <div
                  key={product.id || product._id}
                  className="sd-product-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => onProductClick(product)}
                  onKeyDown={(e) => e.key === "Enter" && onProductClick(product)}
                >
                  <div className="sd-product-img" style={imgStyle}>
                    {product.tag && <span className="sd-product-tag">{product.tag}</span>}
                    {user && (
                      <button
                        type="button"
                        className={`sd-wish-btn ${liked ? "liked" : ""} ${wishPopId === pid ? "wish-pop" : ""}`}
                        title={liked ? "Remove from wishlist" : "Save to wishlist"}
                        aria-pressed={liked}
                        onClick={(e) => toggleWishlist(e, product)}
                      >
                        <span className="sd-wish-icon">{liked ? "♥" : "♡"}</span>
                      </button>
                    )}
                    <div className="sd-product-img-overlay">
                      <span className="sd-product-view-btn">View Product</span>
                    </div>
                  </div>
                  <div className="sd-product-info">
                    <p className="sd-product-category">{product.category}</p>
                    <h3 className="sd-product-name">{product.name}</h3>
                    <div className="sd-product-meta">
                      <span className="sd-product-size">Size: {product.size}</span>
                      <span className={`sd-condition sd-condition-${condNum}`}>
                        {product.condition}
                      </span>
                    </div>
                    <div className="sd-product-footer">
                      <span className="sd-product-price">₹ {Number(product.price).toLocaleString()}</span>
                      <button
                        type="button"
                        className="sd-add-btn"
                        onClick={(e) => { e.stopPropagation(); onProductClick(product); }}
                      >
                        View →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Reviews Section */}
          <div className="sd-reviews-section">
            <div className="sd-reviews-header">
              <h2 className="sd-reviews-title">
                Reviews <span className="sd-reviews-count">({reviews.length})</span>
              </h2>
              {user && !userReview && (
                <button
                  type="button"
                  className="sd-write-review-btn"
                  onClick={() => setShowReviewForm(true)}
                >
                  Write a Review
                </button>
              )}
              {user && userReview && (
                <button
                  type="button"
                  className="sd-write-review-btn"
                  onClick={() => setShowReviewForm(true)}
                >
                  Edit Your Review
                </button>
              )}
            </div>

            {/* Review Form */}
            {showReviewForm && user && (
              <form className="sd-review-form" onSubmit={handleSubmitReview}>
                <h3 className="sd-review-form-title">
                  {userReview ? "Edit your review" : "Write a review"}
                </h3>
                <div className="sd-review-rating-row">
                  <label className="sd-review-label">Your Rating:</label>
                  <StarRating
                    rating={newRating}
                    interactive={true}
                    onRatingChange={setNewRating}
                    size="large"
                  />
                </div>
                <div className="sd-review-comment-row">
                  <label className="sd-review-label">Your Review:</label>
                  <textarea
                    className="sd-review-textarea"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your experience with this shop..."
                    maxLength={500}
                    rows={4}
                  />
                  <span className="sd-review-char-count">
                    {newComment.length}/500
                  </span>
                </div>
                <div className="sd-review-form-actions">
                  <button
                    type="button"
                    className="sd-review-cancel-btn"
                    onClick={() => setShowReviewForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="sd-review-submit-btn"
                    disabled={newRating < 1 || submitting}
                  >
                    {submitting ? "Submitting..." : userReview ? "Update Review" : "Submit Review"}
                  </button>
                </div>
              </form>
            )}

            {/* Reviews List */}
            <div className="sd-reviews-list">
              {reviews.length === 0 ? (
                <p className="sd-no-reviews">
                  No reviews yet. {user ? "Be the first to review this shop!" : "Login to leave a review."}
                </p>
              ) : (
                reviews.map((review, index) => (
                  <div
                    key={review.id}
                    className="sd-review-card"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="sd-review-header">
                      <div className="sd-review-user">
                        <div className="sd-review-avatar">
                          {review.username?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <span className="sd-review-username">{review.username || "Anonymous"}</span>
                      </div>
                      <div className="sd-review-meta">
                        <StarRating rating={review.rating} size="small" />
                        <span className="sd-review-date">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="sd-review-comment">{review.comment}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
