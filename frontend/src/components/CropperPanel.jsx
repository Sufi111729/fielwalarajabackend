import { useEffect, useMemo, useState } from "react";
import Cropper from "react-easy-crop";
import { getPresetTargetPx } from "../lib/imageUtils";

export default function CropperPanel({ file, preset, onCropPixelsChange }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const imageUrl = useMemo(() => {
    if (!file) return "";
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  if (!file) {
    return null;
  }

  const target = getPresetTargetPx(preset);
  const aspect = target.width / target.height;

  return (
    <div className="panel">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">Crop</h2>
      <div className="relative h-80 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-200">
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_, croppedAreaPixels) => onCropPixelsChange(croppedAreaPixels)}
          showGrid
        />
      </div>
      <div className="mt-3">
        <label className="text-xs font-medium text-slate-600">Zoom</label>
        <input
          className="mt-1 w-full accent-blue-600"
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
        />
      </div>
    </div>
  );
}
