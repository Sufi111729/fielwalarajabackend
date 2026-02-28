import { useCallback, useEffect, useRef, useState } from "react";
import KbSliderEditor from "./components/KbSliderEditor";
import UploadDropzone from "./components/UploadDropzone";
import TopNav from "./components/TopNav";
import AppHeroStrip from "./components/AppHeroStrip";
import AppFooter from "./components/AppFooter";
import { downloadBlob } from "./lib/imageUtils";

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

async function buildPresetCanvas(file) {
  const start = performance.now();
  const img = await loadImageFromFile(file);

  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, img.width, img.height);

  return {
    canvas,
    width: img.width,
    height: img.height,
    ms: Math.round(performance.now() - start)
  };
}

export default function KbStandaloneApp() {
  const [file, setFile] = useState(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState("");
  const [baseMeta, setBaseMeta] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [finalResult, setFinalResult] = useState(null);
  const [step, setStep] = useState(1);
  const canvasRef = useRef(null);

  const handlePrepareBase = useCallback(async () => {
    if (!file) {
      setError("Upload an image first.");
      return;
    }
    try {
      setBusy(true);
      setError("");
      const built = await buildPresetCanvas(file);
      canvasRef.current = built.canvas;
      setBaseMeta({ width: built.width, height: built.height, ms: built.ms });
      setFinalResult(null);
    } catch (e) {
      setError(e.message || "Failed to prepare canvas.");
    } finally {
      setBusy(false);
    }
  }, [file]);

  const handleFileSelected = (nextFile) => {
    if (!nextFile) return;

    if (sourcePreviewUrl) {
      URL.revokeObjectURL(sourcePreviewUrl);
    }

    setFile(nextFile);
    setSourcePreviewUrl(nextFile ? URL.createObjectURL(nextFile) : "");
    setBaseMeta(null);
    canvasRef.current = null;
    setFinalResult(null);
    setError("");
    setStep(1);
  };

  const handleKbResult = (blob, meta) => {
    setFinalResult({
      blob,
      previewUrl: URL.createObjectURL(blob),
      width: baseMeta?.width || 0,
      height: baseMeta?.height || 0,
      targetKB: meta.targetKB,
      kb: meta.finalKB,
      quality: meta.quality,
      ms: meta.ms,
      hit: meta.hit
    });
  };

  useEffect(() => {
    return () => {
      if (sourcePreviewUrl) {
        URL.revokeObjectURL(sourcePreviewUrl);
      }
      if (finalResult?.previewUrl) {
        URL.revokeObjectURL(finalResult.previewUrl);
      }
    };
  }, [finalResult, sourcePreviewUrl]);

  useEffect(() => {
    if (!file) return;
    handlePrepareBase();
  }, [file, handlePrepareBase]);

  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-7xl p-4 md:p-6">
      <AppHeroStrip mode="kb" />

      {step === 1 ? (
        <section className="panel">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Step 1: Upload Picture</h2>
          <UploadDropzone onFileSelected={handleFileSelected} file={file} />
          {baseMeta ? (
            <p className="mt-2 text-xs text-slate-600">
              Image ready: {baseMeta.width}x{baseMeta.height}px, prepared in {baseMeta.ms}ms
            </p>
          ) : null}
          {error ? <p className="mt-2 rounded bg-rose-50 p-2 text-xs text-rose-700">{error}</p> : null}

          <div className="mt-3">
            <button
              type="button"
              className="btn-primary"
              disabled={!file || busy || !baseMeta}
              onClick={() => setStep(2)}
            >
              Next: KB Adjust
            </button>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="panel">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Step 2: Adjust KB + Preview</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <KbSliderEditor canvasRef={canvasRef} onResult={handleKbResult} />
            </div>

            <div className="rounded-xl border border-slate-200 p-3 lg:col-span-1">
              <h3 className="text-sm font-semibold text-slate-700">Preview + Download</h3>
              {finalResult ? (
                <>
                  <img
                    src={finalResult.previewUrl}
                    alt="KB editor output"
                    className="mx-auto mt-3 max-h-56 rounded-xl border border-slate-300 bg-white"
                  />
                  <div className="mt-3 grid gap-1 text-xs text-slate-700">
                    <p>Target: {finalResult.targetKB} KB</p>
                    <p>Result: {finalResult.kb} KB</p>
                    <p>Quality: {finalResult.quality}</p>
                    <p>Time: {finalResult.ms} ms</p>
                    <p>Status hit: {String(finalResult.hit)}</p>
                  </div>
                  <button
                    type="button"
                    className="btn-primary mt-3 w-full"
                    onClick={() => downloadBlob(finalResult.blob, `kb-editor-${Date.now()}.jpg`)}
                  >
                    Download JPG
                  </button>
                </>
              ) : (
                <>
                  {sourcePreviewUrl ? (
                    <img
                      src={sourcePreviewUrl}
                      alt="Uploaded source"
                      className="mx-auto mt-3 max-h-56 rounded-xl border border-slate-300 bg-white"
                    />
                  ) : null}
                  <p className="mt-2 text-xs text-slate-500">Upload image and move KB slider to see preview.</p>
                </>
              )}
            </div>
          </div>

          <div className="mt-3">
            <button
              type="button"
              className="btn-muted"
              onClick={() => setStep(1)}
            >
              Back: Upload
            </button>
          </div>
        </section>
      ) : null}

      </main>
      <AppFooter />
    </>
  );
}

