import { PRESETS, getPresetTargetPx } from "../lib/imageUtils";

export default function PresetSelector({ selectedPresetId, onChangePreset }) {
  return (
    <div className="panel">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">Select Option</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {Object.values(PRESETS).map((preset) => {
          const target = getPresetTargetPx(preset);
          const active = selectedPresetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChangePreset(preset.id)}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                active
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                  : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50"
              }`}
            >
              <p className="font-semibold text-slate-900">{preset.label}</p>
              <p className="text-xs text-slate-600">
                {preset.heightCm}cm x {preset.widthCm}cm @ {preset.dpi} DPI
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Target: {target.width}x{target.height}px, Max: {preset.maxKb}KB
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
