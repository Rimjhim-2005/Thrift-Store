import { useState } from "react";
import "./Login.css";

const API = "http://localhost:5000/api";

export default function Login({ onBack, onLoginSuccess }) {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");


  const clearMessages = () => { setError(""); setSuccess(""); };

  const handleLogin = async () => {
    clearMessages();
    if (!loginEmail || !loginPassword) { setError("Please fill in all fields."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Login failed."); return; }
      setSuccess("✓ Logged in!");
      setTimeout(() => onLoginSuccess(data.user), 600);
    } catch { setError("Network error. Is the backend running?"); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    clearMessages();
    if (!regFirstName || !regLastName || !regEmail || !regPassword) { setError("Please fill in all fields."); return; }
    if (regPassword.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          firstName: regFirstName, lastName: regLastName,
          email: regEmail, password: regPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Registration failed."); return; }
      setSuccess("✓ Account created!");
      setTimeout(() => onLoginSuccess(data.user), 600);
    } catch { setError("Network error. Is the backend running?"); }
    finally { setLoading(false); }
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
              onClick={() => { setMode("login"); clearMessages(); }}
            >
              Log In
            </button>
            <button
              className={`login-tab ${mode === "register" ? "active" : ""}`}
              onClick={() => { setMode("register"); clearMessages(); }}
            >
              Create Account
            </button>
          </div>

          {/* Error / Success messages */}
          {error && <div className="login-msg login-msg-error">{error}</div>}
          {success && <div className="login-msg login-msg-success">{success}</div>}

          {mode === "login" ? (
            <>
              <h1 className="login-form-title">Welcome back</h1>
              <p className="login-form-sub">Log in to manage your shop and listings.</p>

              <div className="login-form-group">
                <label className="login-label">Email Address</label>
                <input type="email" className="login-input" placeholder="you@yourshop.com"
                  value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
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
                    value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
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
                className={`login-btn-submit ${success ? "submitted" : ""}`}
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? "Logging in…" : success ? "✓ Logged in!" : "Log In →"}
              </button>

              <div className="login-divider"><span>or continue with</span></div>

              <div className="login-socials">
                <button className="login-social-btn">🌐 Google</button>
                <button className="login-social-btn">📘 Facebook</button>
              </div>

              <p className="login-switch">
                Don't have an account?{" "}
                <button onClick={() => { setMode("register"); clearMessages(); }}>Sign up free</button>
              </p>
            </>
          ) : (
            <>
              <h1 className="login-form-title">Create your account</h1>
              <p className="login-form-sub">Join Thriftly as a buyer. Want to sell? <a href="#" style={{color:"#5c6b3a",fontWeight:600}} onClick={(e)=>{e.preventDefault();onBack();}}>Apply for a shop listing</a>.</p>

              <div className="login-form-row">
                <div className="login-form-group">
                  <label className="login-label">First Name</label>
                  <input type="text" className="login-input" placeholder="Juan"
                    value={regFirstName} onChange={(e) => setRegFirstName(e.target.value)} />
                </div>
                <div className="login-form-group">
                  <label className="login-label">Last Name</label>
                  <input type="text" className="login-input" placeholder="Dela Cruz"
                    value={regLastName} onChange={(e) => setRegLastName(e.target.value)} />
                </div>
              </div>

              <div className="login-form-group">
                <label className="login-label">Email Address</label>
                <input type="email" className="login-input" placeholder="you@yourshop.com"
                  value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
              </div>

              <div className="login-form-group">
                <label className="login-label">Password</label>
                <div className="login-input-wrap">
                  <input
                    type={showPass ? "text" : "password"}
                    className="login-input"
                    placeholder="Min. 8 characters"
                    value={regPassword} onChange={(e) => setRegPassword(e.target.value)}
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
                className={`login-btn-submit ${success ? "submitted" : ""}`}
                onClick={handleRegister}
                disabled={loading}
              >
                {loading ? "Creating account…" : success ? "✓ Account Created!" : "Create Account →"}
              </button>

              <div className="login-divider"><span>or sign up with</span></div>

              <div className="login-socials">
                <button className="login-social-btn">🌐 Google</button>
                <button className="login-social-btn">📘 Facebook</button>
              </div>

              <p className="login-switch">
                Already have an account?{" "}
                <button onClick={() => { setMode("login"); clearMessages(); }}>Log in</button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
