export default function KbEditor({ kb, onChangeKb }) {
  return (
    <div className="panel">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">KB Editor</h2>
      <p className="text-xs text-slate-600">
        Final JPG size target set karein (recommended: 50KB).
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_120px] sm:items-center">
        <input
          type="range"
          min={20}
          max={50}
          step={1}
          value={kb}
          onChange={(e) => onChangeKb(Number(e.target.value))}
          className="w-full accent-blue-600"
        />
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm font-semibold text-slate-800">
          {kb} KB
        </div>
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Note: Backend final validation default limit 50KB hai.
      </p>
    </div>
  );
}
