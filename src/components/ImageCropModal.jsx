import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../utils/cropImage";
import "./ImageCropModal.css";

export default function ImageCropModal({
  imageSrc,
  aspect,
  title = "Crop image",
  onCancel,
  onDone,
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const onCropComplete = useCallback((_area, pixels) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleDone = async () => {
    if (!croppedAreaPixels || !imageSrc) {
      setErr("Adjust the crop, then tap Done.");
      return;
    }
    setErr("");
    setBusy(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const file = new File([blob], "cropped.jpg", { type: "image/jpeg" });
      onDone(file);
    } catch (e) {
      setErr("Could not process image. Try another photo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="icm-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="icm-panel">
        <h2 className="icm-title">{title}</h2>
        <p className="icm-hint">Pinch or drag to frame · Use the slider to zoom</p>
        <div className="icm-crop-wrap">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <label className="icm-zoom-label">
          Zoom
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
        </label>
        {err && <p className="icm-err">{err}</p>}
        <div className="icm-actions">
          <button type="button" className="icm-btn ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="icm-btn primary" onClick={handleDone} disabled={busy}>
            {busy ? "Saving…" : "Done"}
          </button>
        </div>
      </div>
    </div>
  );
}
