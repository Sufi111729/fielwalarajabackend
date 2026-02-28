import { useEffect, useMemo, useRef, useState } from "react";
import { smartCompressToKB } from "../lib/smartKb";

const MIN_KB = 10;
const MAX_KB = 1000;
const DEFAULT_KB = 50;
const DEBOUNCE_MS = 200;

export default function KbSliderEditor({
  canvasRef,
  onResult,
  minKB = MIN_KB,
  maxKB = MAX_KB,
  defaultKB = DEFAULT_KB,
  minQBest = 0.2,
  minQSafer = 0.05,
  maxQ = 0.95,
  maxIter = 8
}) {
  const [targetKB, setTargetKB] = useState(defaultKB);
  const [mode, setMode] = useState("best");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [hasRun, setHasRun] = useState(false);
  const [stats, setStats] = useState({
    targetKB: defaultKB,
    finalKB: 0,
    quality: 0,
    ms: 0,
    hit: false
  });

  const runIdRef = useRef(0);
  const [debouncedTarget, setDebouncedTarget] = useState(defaultKB);
  const canvas = canvasRef?.current || null;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedTarget(targetKB), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [targetKB]);

  const sliderDisabled = useMemo(() => !canvas || busy, [canvas, busy]);

  const runCompression = async (requestedTarget) => {
    if (!canvas) {
      setError("Generate resized canvas first.");
      return;
    }

    const currentRunId = runIdRef.current + 1;
    runIdRef.current = currentRunId;

    try {
      setBusy(true);
      setError("");
      const result = await smartCompressToKB(canvas, requestedTarget, {
        minQ: mode === "safer" ? minQSafer : minQBest,
        maxQ,
        maxIter,
        mode
      });

      if (runIdRef.current !== currentRunId) {
        return;
      }

      const meta = {
        targetKB: requestedTarget,
        finalKB: result.finalKB,
        quality: result.quality,
        ms: result.ms,
        hit: result.hit,
        mode
      };
      setStats(meta);
      setHasRun(true);
      onResult(result.blob, meta);
    } catch (e) {
      if (runIdRef.current === currentRunId) {
        setError(e.message || "Compression failed.");
      }
    } finally {
      if (runIdRef.current === currentRunId) {
        setBusy(false);
      }
    }
  };

  useEffect(() => {
    if (!canvas) return;
    runCompression(debouncedTarget);
  }, [debouncedTarget, mode, canvas]);

  return (
    <div className="panel">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-slate-700">KB Slider Editor</h2>
      </div>

      <p className="text-xs text-slate-600">Target size control (JPEG only): {minKB}KB to {maxKB}KB.</p>

      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_120px] sm:items-center">
        <input
          type="range"
          min={minKB}
          max={maxKB}
          step={1}
          value={targetKB}
          disabled={sliderDisabled}
          onChange={(e) => setTargetKB(Number(e.target.value))}
          className="w-full accent-blue-600"
        />
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm font-semibold text-slate-800">
          {targetKB} KB
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700">
          <input
            type="radio"
            name="kb-mode"
            value="best"
            checked={mode === "best"}
            onChange={() => setMode("best")}
            className="accent-blue-600"
          />
          Best Quality under limit
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700">
          <input
            type="radio"
            name="kb-mode"
            value="safer"
            checked={mode === "safer"}
            onChange={() => setMode("safer")}
            className="accent-blue-600"
          />
          Safer smaller size
        </label>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
        <div className="rounded-lg bg-slate-50 px-2 py-2">
          <p className="text-slate-500">Target KB</p>
          <p className="font-semibold text-slate-800">{stats.targetKB}</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-2 py-2">
          <p className="text-slate-500">Result KB</p>
          <p className="font-semibold text-slate-800">{stats.finalKB}</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-2 py-2">
          <p className="text-slate-500">Quality used</p>
          <p className="font-semibold text-slate-800">{stats.quality}</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-2 py-2">
          <p className="text-slate-500">Time ms</p>
          <p className="font-semibold text-slate-800">{stats.ms}</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-2 py-2">
          <p className="text-slate-500">Status hit</p>
          <p className={`font-semibold ${stats.hit ? "text-emerald-700" : "text-amber-700"}`}>
            {String(stats.hit)}
          </p>
        </div>
      </div>

      {busy ? <p className="mt-3 text-xs text-blue-700">Compressing...</p> : null}
      {error ? <p className="mt-3 rounded bg-rose-50 p-2 text-xs text-rose-700">{error}</p> : null}
      {hasRun && !stats.hit && canvas ? (
        <p className="mt-3 rounded bg-amber-50 p-2 text-xs text-amber-700">
          Cannot reach target with minimum safe quality. Try increasing target KB.
        </p>
      ) : null}
    </div>
  );
}
