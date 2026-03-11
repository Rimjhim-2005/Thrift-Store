import { useState, useEffect, useRef } from "react";
import "./Signup.css";

const PERKS = [
  { icon: "🌱", title: "Free to Start",       text: "No credit card needed. List up to 20 products at zero cost." },
  { icon: "📍", title: "Local Discovery",      text: "Buyers search by location — your shop shows up first for nearby customers." },
  { icon: "💬", title: "Direct Buyer Contact", text: "Buyers message you directly. No middleman, no commissions taken." },
];

const CATEGORIES = [
  "Vintage & Retro", "Streetwear & Sneakers", "Luxury Resale",
  "Kids & Baby", "Sustainable Fashion", "General Thrift",
];

export default function Signup() {
  const [submitted, setSubmitted] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); } }),
      { threshold: 0.1 }
    );
    sectionRef.current?.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3500);
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

        <div className="form-row-2">
          <div className="form-group">
            <label className="form-label">First Name</label>
            <input type="text" className="form-input" placeholder="Juan" />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input type="text" className="form-input" placeholder="Dela Cruz" />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Shop Name</label>
          <input type="text" className="form-input" placeholder="e.g. The Vintage Vault" />
        </div>

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input type="email" className="form-input" placeholder="you@yourshop.com" />
        </div>

        <div className="form-group">
          <label className="form-label">Location (City)</label>
          <input type="text" className="form-input" placeholder="e.g. Quezon City, Metro Manila" />
        </div>

        <div className="form-group">
          <label className="form-label">Shop Category</label>
          <select className="form-select">
            <option value="">Select a category...</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Tell Us About Your Shop</label>
          <textarea className="form-textarea" placeholder="What makes your shop unique? What kinds of items do you carry?" />
        </div>

        <button
          className={`btn-submit ${submitted ? "submitted" : ""}`}
          onClick={handleSubmit}
          disabled={submitted}
        >
          {submitted ? "✓ Request Submitted!" : "List My Shop for Free →"}
        </button>
        <p className="form-note">🔒 Your information is safe with us. No spam, ever.</p>
      </div>
    </section>
  );
}
