import { useState, useEffect, useRef } from "react";
import "./Signup.css";

const API = "http://localhost:5000/api";

const PERKS = [
  { icon: "🌱", title: "Free to Start",       text: "No credit card needed. List up to 20 products at zero cost." },
  { icon: "📍", title: "Local Discovery",      text: "Buyers search by location — your shop shows up first for nearby customers." },
  { icon: "💬", title: "Direct Buyer Contact", text: "Buyers message you directly. No middleman, no commissions taken." },
];

const CATEGORIES = [
  "Vintage & Retro", "Streetwear & Sneakers", "Luxury Resale",
  "Kids & Baby", "Sustainable Fashion", "General Thrift",
];

export default function Signup({ user }) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const sectionRef = useRef(null);

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); } }),
      { threshold: 0.1 }
    );
    sectionRef.current?.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleSubmit = async () => {
    setError(""); setSuccess("");
    if (!firstName || !lastName || !shopName || !email || !city || !category) {
      setError("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/shop/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, shopName, email, location: city, category, description }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Request failed."); return; }
      setSuccess("✓ Request submitted! Check your email for approval.");
      setSubmitted(true);
    } catch {
      setError("Network error. Is the backend running?");
    } finally { setLoading(false); }
  };

  return (
    <section id="signup" ref={sectionRef}>
      {/* Left: info */}
      <div className="signup-info reveal">
        <span className="section-eyebrow">Ready to Join?</span>
        <h2 className="section-title-lg">
          List Your Shop on <em>Thriftly</em> Today
        </h2>
        <p className="signup-body">
          Join over 1,200 thrift shop owners already on Thriftly. Reach new buyers,
          list your products, and be part of the sustainable fashion movement.
        </p>
        <div className="signup-perks">
          {PERKS.map(({ icon, title, text }) => (
            <div className="perk" key={title}>
              <div className="perk-icon">{icon}</div>
              <div>
                <p className="perk-title">{title}</p>
                <p className="perk-text">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: form */}
      <div className="signup-form reveal reveal-delay-2">
        <h3 className="form-title">Create Your Shop Profile</h3>
        <p className="form-sub">Fill in the details below and we'll get your shop listed within 24 hours.</p>

        {error && <div className="signup-msg signup-msg-error">{error}</div>}
        {success && <div className="signup-msg signup-msg-success">{success}</div>}

        <div className="form-row-2">
          <div className="form-group">
            <label className="form-label">First Name</label>
            <input type="text" className="form-input" placeholder="Juan"
              value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input type="text" className="form-input" placeholder="Dela Cruz"
              value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Shop Name</label>
          <input type="text" className="form-input" placeholder="e.g. The Vintage Vault"
            value={shopName} onChange={(e) => setShopName(e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input type="email" className="form-input" placeholder="you@yourshop.com"
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Location (City)</label>
          <input type="text" className="form-input" placeholder="e.g. Quezon City, Metro Manila"
            value={city} onChange={(e) => setCity(e.target.value)} />
        </div>

        <div className="form-group">
          <label className="form-label">Shop Category</label>
          <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Select a category...</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Tell Us About Your Shop</label>
          <textarea className="form-textarea" placeholder="What makes your shop unique? What kinds of items do you carry?"
            value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <button
          className={`btn-submit ${submitted ? "submitted" : ""}`}
          onClick={handleSubmit}
          disabled={submitted || loading}
        >
          {loading ? "Submitting…" : submitted ? "✓ Request Submitted!" : "List My Shop for Free →"}
        </button>
        <p className="form-note">🔒 Your information is safe with us. No spam, ever.</p>
      </div>
    </section>
  );
}
