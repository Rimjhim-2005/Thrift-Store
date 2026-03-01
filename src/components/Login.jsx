import { useState } from "react";
import "./Login.css";

export default function Login({ onBack }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [submitted, setSubmitted] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="login-page">
      {/* Left panel — decorative */}
      <div className="login-panel-left">
        <div className="login-panel-bg" />
        <div className="login-panel-deco login-deco-1" />
        <div className="login-panel-deco login-deco-2" />

        <div className="login-panel-content">
          <button className="login-back-btn" onClick={onBack}>← Back to Home</button>
          <a href="#" className="login-logo">
            <div className="login-logo-icon">♻</div>
            <span className="login-logo-text">Thriftly</span>
          </a>

          <div className="login-panel-headline">
            <h2>Your thrift shop,<br /><em>seen by thousands.</em></h2>
            <p>Join a growing community of sustainable shop owners reaching new buyers every day.</p>
          </div>

          <div className="login-testimonial">
            <div className="login-testimonial-quote">
              "Thriftly helped us triple our foot traffic in just two months. It's the easiest listing we've ever done."
            </div>
            <div className="login-testimonial-author">
              <div className="login-testimonial-avatar">🌿</div>
              <div>
                <p className="login-testimonial-name">Maria Santos</p>
                <p className="login-testimonial-shop">Earthbound Finds, Makati</p>
              </div>
            </div>
          </div>

          <div className="login-panel-stats">
            {[
              { num: "1,200+", label: "Shops Listed" },
              { num: "48K+",   label: "Products" },
              { num: "94%",    label: "Satisfaction" },
            ].map(({ num, label }) => (
              <div key={label} className="login-stat">
                <span className="login-stat-num">{num}</span>
                <span className="login-stat-label">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="login-panel-right">
        <div className="login-form-wrapper">

          {/* Tab switcher */}
          <div className="login-tabs">
            <button
              className={`login-tab ${mode === "login" ? "active" : ""}`}
              onClick={() => setMode("login")}
            >
              Log In
            </button>
            <button
              className={`login-tab ${mode === "register" ? "active" : ""}`}
              onClick={() => setMode("register")}
            >
              Create Account
            </button>
          </div>

          {mode === "login" ? (
            <>
              <h1 className="login-form-title">Welcome back</h1>
              <p className="login-form-sub">Log in to manage your shop and listings.</p>

              <div className="login-form-group">
                <label className="login-label">Email Address</label>
                <input type="email" className="login-input" placeholder="you@yourshop.com" />
              </div>

              <div className="login-form-group">
                <div className="login-label-row">
                  <label className="login-label">Password</label>
                  <a href="#" className="login-forgot">Forgot password?</a>
                </div>
                <div className="login-input-wrap">
                  <input
                    type={showPass ? "text" : "password"}
                    className="login-input"
                    placeholder="••••••••"
                  />
                  <button className="login-show-pass" onClick={() => setShowPass(!showPass)}>
                    {showPass ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="login-remember">
                <input type="checkbox" id="remember" />
                <label htmlFor="remember">Keep me logged in</label>
              </div>

              <button
                className={`login-btn-submit ${submitted ? "submitted" : ""}`}
                onClick={handleSubmit}
                disabled={submitted}
              >
                {submitted ? "✓ Logging you in…" : "Log In →"}
              </button>

              <div className="login-divider"><span>or continue with</span></div>

              <div className="login-socials">
                <button className="login-social-btn">🌐 Google</button>
                <button className="login-social-btn">📘 Facebook</button>
              </div>

              <p className="login-switch">
                Don't have an account?{" "}
                <button onClick={() => setMode("register")}>Sign up free</button>
              </p>
            </>
          ) : (
            <>
              <h1 className="login-form-title">List your shop</h1>
              <p className="login-form-sub">Create an account to get your thrift shop discovered.</p>

              <div className="login-form-row">
                <div className="login-form-group">
                  <label className="login-label">First Name</label>
                  <input type="text" className="login-input" placeholder="Juan" />
                </div>
                <div className="login-form-group">
                  <label className="login-label">Last Name</label>
                  <input type="text" className="login-input" placeholder="Dela Cruz" />
                </div>
              </div>

              <div className="login-form-group">
                <label className="login-label">Shop Name</label>
                <input type="text" className="login-input" placeholder="e.g. The Vintage Vault" />
              </div>

              <div className="login-form-group">
                <label className="login-label">Email Address</label>
                <input type="email" className="login-input" placeholder="you@yourshop.com" />
              </div>

              <div className="login-form-group">
                <label className="login-label">Password</label>
                <div className="login-input-wrap">
                  <input
                    type={showPass ? "text" : "password"}
                    className="login-input"
                    placeholder="Min. 8 characters"
                  />
                  <button className="login-show-pass" onClick={() => setShowPass(!showPass)}>
                    {showPass ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="login-terms">
                <input type="checkbox" id="terms" />
                <label htmlFor="terms">
                  I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
                </label>
              </div>

              <button
                className={`login-btn-submit ${submitted ? "submitted" : ""}`}
                onClick={handleSubmit}
                disabled={submitted}
              >
                {submitted ? "✓ Account Created!" : "Create Account →"}
              </button>

              <div className="login-divider"><span>or sign up with</span></div>

              <div className="login-socials">
                <button className="login-social-btn">🌐 Google</button>
                <button className="login-social-btn">📘 Facebook</button>
              </div>

              <p className="login-switch">
                Already have an account?{" "}
                <button onClick={() => setMode("login")}>Log in</button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
