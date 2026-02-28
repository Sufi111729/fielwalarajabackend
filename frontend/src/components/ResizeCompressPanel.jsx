import { useState } from "react";
import { getPresetTargetPx, resizeAndCompressImage } from "../lib/imageUtils";

export default function ResizeCompressPanel({ file, cropPixels, preset, onProcessed }) {
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [autoWhiteBg, setAutoWhiteBg] = useState(true);

  const target = getPresetTargetPx(preset);

  const handleProcess = async () => {
    if (!file) {
      setError("Upload an image first.");
      return;
    }
    if (!cropPixels) {
      setError("Adjust crop first.");
      return;
    }

    try {
      setBusy(true);
      setError("");
      setProgress(1);
      const result = await resizeAndCompressImage({
        file,
        cropPixels,
        preset,
        autoWhiteBackground: autoWhiteBg,
        onProgress: setProgress
      });
      console.log("client_resize_ms", result.elapsedMs);
      console.log("client_final_kb", result.kb);
      console.log("client_target_px", `${result.width}x${result.height}`);
      console.log("client_quality_used", result.quality);
      if (!result.withinLimit) {
        console.log("client_warning", "Could not reach target KB without dropping quality too much");
      }
      onProcessed(result);
    } catch (e) {
      setError(e.message || "Processing failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="panel">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">Resize + Compress</h2>
      <p className="text-xs text-slate-600">
        Target: {target.width}x{target.height}px, Max {preset.maxKb}KB
      </p>
      {preset.id === "photo" ? (
        <label className="mt-3 inline-flex items-center gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={autoWhiteBg}
            onChange={(e) => setAutoWhiteBg(e.target.checked)}
          />
          Auto white background (photo)
        </label>
      ) : null}
      <button
        type="button"
        onClick={handleProcess}
        disabled={busy}
        className="btn-success mt-3"
      >
        {busy ? "Processing..." : "Generate Final JPG"}
      </button>
      <div className="mt-3 h-3 w-full rounded-full bg-slate-200">
        <div
          className="h-3 rounded-full bg-emerald-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-600">
        Quality-safe compression enabled (photo keeps higher clarity first).
      </p>
      {error ? <p className="mt-2 rounded bg-rose-50 p-2 text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
