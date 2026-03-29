import { useEffect, useState, useRef } from "react";
import ImageCropModal from "./ImageCropModal";
import { assetUrl } from "../utils/assetUrl";
import "./ShopSettings.css";

const API = "http://localhost:5000/api";

export default function ShopSettings({ onBack, user }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [shopDescription, setShopDescription] = useState("");
  const [tagsStr, setTagsStr] = useState("");
  const [slug, setSlug] = useState("");
  const [shopName, setShopName] = useState("");
  const [headerPreview, setHeaderPreview] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [headerFile, setHeaderFile] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [cropModal, setCropModal] = useState(null);
  const headerInputRef = useRef(null);
  const logoInputRef = useRef(null);

  useEffect(() => {
    if (!user || user.role !== "seller") {
      setLoading(false);
      return;
    }
    fetch(`${API}/shop/my`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.seller) {
          setShopDescription(data.seller.shopDescription || "");
          setTagsStr((data.seller.tags || []).join(", "));
          setSlug(data.seller.slug || "");
          setShopName(data.seller.shopName || "");
          if (data.seller.headerImageUrl) {
            setHeaderPreview(assetUrl(data.seller.headerImageUrl));
          }
          if (data.seller.shopLogoUrl) {
            setLogoPreview(assetUrl(data.seller.shopLogoUrl));
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    return () => {
      if (cropModal?.src?.startsWith("blob:")) URL.revokeObjectURL(cropModal.src);
    };
  }, [cropModal?.src]);

  const saveText = async () => {
    setMsg("");
    setSaving(true);
    try {
      const tags = tagsStr
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const res = await fetch(`${API}/shop/my`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ shopDescription, tags }),
      });
      if (!res.ok) throw new Error("Save failed");
      setMsg("Saved.");
    } catch {
      setMsg("Could not save.");
    } finally {
      setSaving(false);
    }
  };

  const uploadBranding = async () => {
    if (!headerFile && !logoFile) {
      setMsg("Choose and crop a header and/or logo image, then upload.");
      return;
    }
    setMsg("");
    setSaving(true);
    try {
      const fd = new FormData();
      if (headerFile) fd.append("header", headerFile);
      if (logoFile) fd.append("logo", logoFile);
      const res = await fetch(`${API}/shop/my/branding`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      if (data.headerImageUrl) {
        setHeaderPreview(assetUrl(data.headerImageUrl));
        setHeaderFile(null);
      }
      if (data.shopLogoUrl) {
        setLogoPreview(assetUrl(data.shopLogoUrl));
        setLogoFile(null);
      }
      setMsg("Images updated.");
    } catch {
      setMsg("Upload failed.");
    } finally {
      setSaving(false);
    }
  };

  const openHeaderPicker = () => headerInputRef.current?.click();
  const openLogoPicker = () => logoInputRef.current?.click();

  const onHeaderFileChosen = (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !f.type.startsWith("image/")) return;
    const src = URL.createObjectURL(f);
    setCropModal({ src, type: "header" });
  };

  const onLogoFileChosen = (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f || !f.type.startsWith("image/")) return;
    const src = URL.createObjectURL(f);
    setCropModal({ src, type: "logo" });
  };

  const closeCrop = () => {
    if (cropModal?.src?.startsWith("blob:")) URL.revokeObjectURL(cropModal.src);
    setCropModal(null);
  };

  const onCropDone = (file) => {
    if (!cropModal) return;
    const { type, src } = cropModal;
    if (src?.startsWith("blob:")) URL.revokeObjectURL(src);
    if (type === "header") {
      setHeaderFile(file);
      setHeaderPreview(URL.createObjectURL(file));
    } else {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
    setCropModal(null);
    setMsg("Cropped image ready — tap “Upload images” to save to your storefront.");
  };

  if (!user || user.role !== "seller") {
    return (
      <div className="shopsettings-page">
        <button type="button" className="shopsettings-back" onClick={onBack}>← Back</button>
        <p>Seller access only.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="shopsettings-page">
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="shopsettings-page">
      {cropModal && (
        <ImageCropModal
          imageSrc={cropModal.src}
          aspect={cropModal.type === "header" ? 21 / 9 : 1}
          title={cropModal.type === "header" ? "Crop header banner" : "Crop shop logo"}
          onCancel={closeCrop}
          onDone={onCropDone}
        />
      )}

      <button type="button" className="shopsettings-back" onClick={onBack}>← Back</button>
      <header className="shopsettings-header">
        <h1>Shop settings</h1>
        <p className="shopsettings-slug-hint">
          Storefront: <strong>{shopName}</strong>
          {slug ? ` · slug: ${slug}` : ""}
        </p>
        <p className="shopsettings-note">
          Choose photos from your gallery, adjust the crop, then upload. Profile photo for your account is under Account.
        </p>
      </header>

      <section className="shopsettings-card">
        <h2>Description</h2>
        <textarea
          className="shopsettings-textarea"
          rows={5}
          value={shopDescription}
          onChange={(e) => setShopDescription(e.target.value)}
          placeholder="Tell buyers what makes your shop special…"
        />
        <label className="shopsettings-label">Tags (comma-separated)</label>
        <input
          className="shopsettings-input"
          value={tagsStr}
          onChange={(e) => setTagsStr(e.target.value)}
          placeholder="Vintage, Denim, Streetwear"
        />
        <button type="button" className="shopsettings-primary" onClick={saveText} disabled={saving}>
          Save text
        </button>
      </section>

      <section className="shopsettings-card">
        <h2>Branding</h2>
        <input
          ref={headerInputRef}
          type="file"
          accept="image/*"
          className="shopsettings-file-hidden"
          onChange={onHeaderFileChosen}
        />
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          className="shopsettings-file-hidden"
          onChange={onLogoFileChosen}
        />
        <div className="shopsettings-preview-row">
          <div>
            <span className="shopsettings-label">Header banner (wide)</span>
            <div
              className="shopsettings-banner-preview"
              style={headerPreview ? { backgroundImage: `url(${headerPreview})` } : {}}
            />
            <button type="button" className="shopsettings-file-btn" onClick={openHeaderPicker}>
              Choose from gallery &amp; crop
            </button>
          </div>
          <div>
            <span className="shopsettings-label">Shop logo (square)</span>
            <div className="shopsettings-logo-preview-wrap">
              {logoPreview ? (
                <img src={logoPreview} alt="" className="shopsettings-logo-preview" />
              ) : (
                <div className="shopsettings-logo-placeholder">Logo</div>
              )}
            </div>
            <button type="button" className="shopsettings-file-btn" onClick={openLogoPicker}>
              Choose from gallery &amp; crop
            </button>
          </div>
        </div>
        <button type="button" className="shopsettings-primary" onClick={uploadBranding} disabled={saving}>
          Upload images
        </button>
      </section>

      {msg && <p className="shopsettings-msg">{msg}</p>}
    </div>
  );
}
