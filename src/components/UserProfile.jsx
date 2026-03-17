import { useState } from "react";
import "./UserProfile.css";

const API = "http://localhost:5000/api";

export default function UserProfile({ user, onClose, onUpdate }) {
  const [tab, setTab] = useState("profile"); // "profile" | "password"
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName,  setLastName]  = useState(user.lastName  || "");
  const [phone,     setPhone]     = useState(user.phone     || "");
  const [bio,       setBio]       = useState(user.bio       || "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || "");
  const [newPass,   setNewPass]   = useState("");
  const [confPass,  setConfPass]  = useState("");
  const [msg,       setMsg]       = useState({ type: "", text: "" });
  const [loading,   setLoading]   = useState(false);

  const showMsg = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg({ type:"", text:"" }), 3500); };

  const handleProfileSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ firstName, lastName, phone, bio, avatarUrl }),
      });
      const data = await res.json();
      if (!res.ok) { showMsg("error", data.message || "Save failed."); return; }
      showMsg("success", "Profile updated ✓");
      onUpdate(data.user);
    } catch { showMsg("error", "Network error."); }
    finally { setLoading(false); }
  };

  const handlePasswordSave = async () => {
    if (!newPass) { showMsg("error", "Enter a new password."); return; }
    if (newPass.length < 8) { showMsg("error", "Password must be at least 8 characters."); return; }
    if (newPass !== confPass) { showMsg("error", "Passwords do not match."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newPassword: newPass }),
      });
      const data = await res.json();
      if (!res.ok) { showMsg("error", data.message || "Save failed."); return; }
      showMsg("success", "Password changed ✓");
      setNewPass(""); setConfPass("");
    } catch { showMsg("error", "Network error."); }
    finally { setLoading(false); }
  };

  return (
    <>
      <div className="profile-overlay" onClick={onClose} />
      <div className="profile-modal">
        {/* Header */}
        <div className="profile-header">
          <div className="profile-avatar-big">
            {avatarUrl
              ? <img src={avatarUrl} alt="avatar" />
              : <span>{(firstName?.[0] || "U").toUpperCase()}</span>}
          </div>
          <div>
            <h2 className="profile-name">{firstName} {lastName}</h2>
            <p className="profile-email">{user.email}</p>
            <span className={`profile-role-badge role-${user.role}`}>{user.role}</span>
          </div>
          <button className="profile-close" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button className={`profile-tab ${tab === "profile" ? "active" : ""}`} onClick={() => setTab("profile")}>
            Personal Info
          </button>
          <button className={`profile-tab ${tab === "password" ? "active" : ""}`} onClick={() => setTab("password")}>
            Password
          </button>
        </div>

        {/* Messages */}
        {msg.text && (
          <div className={`profile-msg profile-msg-${msg.type}`}>{msg.text}</div>
        )}

        {/* Body */}
        <div className="profile-body">
          {tab === "profile" ? (
            <>
              <div className="profile-form-row">
                <div className="profile-field">
                  <label>First Name</label>
                  <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Juan" />
                </div>
                <div className="profile-field">
                  <label>Last Name</label>
                  <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Dela Cruz" />
                </div>
              </div>

              <div className="profile-field">
                <label>Phone</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+63 9XX XXX XXXX" type="tel" />
              </div>

              <div className="profile-field">
                <label>Bio <span className="profile-opt">(optional)</span></label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us a little about yourself…" rows={3} />
              </div>

              <div className="profile-field">
                <label>Avatar URL <span className="profile-opt">(optional)</span></label>
                <input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://…/photo.jpg" />
              </div>

              <button className="profile-save-btn" onClick={handleProfileSave} disabled={loading}>
                {loading ? "Saving…" : "Save Changes"}
              </button>
            </>
          ) : (
            <>
              <div className="profile-field">
                <label>New Password</label>
                <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Min. 8 characters" />
              </div>
              <div className="profile-field">
                <label>Confirm Password</label>
                <input type="password" value={confPass} onChange={e => setConfPass(e.target.value)} placeholder="Repeat password" />
              </div>
              <button className="profile-save-btn" onClick={handlePasswordSave} disabled={loading}>
                {loading ? "Saving…" : "Change Password"}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
