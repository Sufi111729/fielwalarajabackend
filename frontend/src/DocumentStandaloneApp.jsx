import { useEffect, useRef, useState } from "react";
import DocumentUploadPanel from "./components/DocumentUploadPanel";
import KbSliderEditor from "./components/KbSliderEditor";
import TopNav from "./components/TopNav";
import AppFooter from "./components/AppFooter";
import { downloadBlob } from "./lib/imageUtils";

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read blob."));
    reader.readAsDataURL(blob);
  });
}

async function convertJpegBlobToPdfBlob(jpegBlob, width, height) {
  const { jsPDF } = await import(
    /* @vite-ignore */ "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.es.min.js"
  );
  const dataUrl = await blobToDataUrl(jpegBlob);
  const pdf = new jsPDF({
    orientation: width >= height ? "landscape" : "portrait",
    unit: "px",
    format: [Math.max(1, Math.round(width)), Math.max(1, Math.round(height))],
    compress: true
  });
  pdf.addImage(
    dataUrl,
    "JPEG",
    0,
    0,
    Math.max(1, Math.round(width)),
    Math.max(1, Math.round(height)),
    undefined,
    "FAST"
  );
  return pdf.output("blob");
}

async function loadPdfModule() {
  const localCandidates = [
    "pdfjs-dist/build/pdf.mjs",
    "pdfjs-dist/legacy/build/pdf.mjs"
  ];

  for (const modPath of localCandidates) {
    try {
      const pdfjs = await import(/* @vite-ignore */ modPath);
      if (pdfjs?.GlobalWorkerOptions) {
        pdfjs.GlobalWorkerOptions.workerSrc =
          "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";
      }
      return pdfjs;
    } catch {
      // try next path
    }
  }

  const pdfjs = await import(/* @vite-ignore */ "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs");
  if (pdfjs?.GlobalWorkerOptions) {
    pdfjs.GlobalWorkerOptions.workerSrc =
      "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";
  }
  return pdfjs;
}

async function buildCanvasFromPdf(file) {
  const start = performance.now();
  const pdfjs = await loadPdfModule();
  const data = new Uint8Array(await file.arrayBuffer());

  const loadingTask = pdfjs.getDocument({ data, disableWorker: true });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);

  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({ canvasContext: ctx, viewport }).promise;

  return {
    canvas,
    width: canvas.width,
    height: canvas.height,
    ms: Math.round(performance.now() - start)
  };
}

export default function DocumentStandaloneApp() {
  const [file, setFile] = useState(null);
  const [baseMeta, setBaseMeta] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(1);
  const [finalResult, setFinalResult] = useState(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  const canvasRef = useRef(null);

  const handleUploadReady = (payload) => {
    if (!payload?.file) {
      setFile(null);
      setBaseMeta(null);
      setFinalResult((prev) => {
        if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
        return null;
      });
      canvasRef.current = null;
      setError("");
      setStep(1);
      return;
    }

    setFile(payload.file);
    setBaseMeta(null);
    setFinalResult((prev) => {
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
    canvasRef.current = null;
    setError("");
    setStep(1);
  };

  const goToKbStep = async () => {
    if (!file) {
      setError("Upload PDF first.");
      return;
    }

    try {
      setBusy(true);
      setError("");
      const built = await buildCanvasFromPdf(file);
      canvasRef.current = built.canvas;
      setBaseMeta({ width: built.width, height: built.height, ms: built.ms });
      setStep(2);
    } catch (e) {
      setError(e.message || "Failed to process PDF.");
    } finally {
      setBusy(false);
    }
  };

  const handleKbResult = (blob, meta) => {
    setFinalResult((prev) => {
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return {
        blob,
        previewUrl: URL.createObjectURL(blob),
        targetKB: meta.targetKB,
        kb: meta.finalKB,
        quality: meta.quality,
        ms: meta.ms,
        hit: meta.hit
      };
    });
  };

  const handleDownloadPdf = async () => {
    if (!finalResult || !baseMeta) return;
    try {
      setPdfBusy(true);
      const pdfBlob = await convertJpegBlobToPdfBlob(finalResult.blob, baseMeta.width, baseMeta.height);
      downloadBlob(pdfBlob, `scanned-doc-${Date.now()}.pdf`);
    } finally {
      setPdfBusy(false);
    }
  };

  useEffect(() => {
    return () => {
      if (finalResult?.previewUrl) {
        URL.revokeObjectURL(finalResult.previewUrl);
      }
    };
  }, [finalResult]);

  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-7xl p-4 md:p-6">
        <section className="mb-5 border-b border-slate-200 bg-white px-4 py-8 md:px-6 md:py-10">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-2xl font-bold leading-tight text-slate-900 md:text-4xl">
              Scanned Documents Converter
            </h1>
            <p className="mt-3 text-base text-slate-600 md:text-lg">
              PDF upload up to 5MB. Convert output to any target between 50KB and 1000KB with high quality.
            </p>
          </div>
        </section>

        <div className="mb-5 grid gap-3 text-sm sm:grid-cols-3">
          <div
            className={`rounded-lg border bg-white px-3 py-3 ${
              step === 1 ? "border-slate-900 text-slate-900" : "border-slate-200 text-slate-600"
            }`}
          >
            <p className="text-xs uppercase tracking-wide">Step 1</p>
            <p className="mt-1 font-semibold">Upload PDF</p>
          </div>
          <div
            className={`rounded-lg border bg-white px-3 py-3 ${
              step === 2 ? "border-slate-900 text-slate-900" : "border-slate-200 text-slate-600"
            }`}
          >
            <p className="text-xs uppercase tracking-wide">Step 2</p>
            <p className="mt-1 font-semibold">KB Edit</p>
          </div>
          <div
            className={`rounded-lg border bg-white px-3 py-3 ${
              step === 3 ? "border-slate-900 text-slate-900" : "border-slate-200 text-slate-600"
            }`}
          >
            <p className="text-xs uppercase tracking-wide">Step 3</p>
            <p className="mt-1 font-semibold">Preview & Download</p>
          </div>
        </div>

        {step === 1 ? (
          <section className="space-y-3">
            <DocumentUploadPanel onReady={handleUploadReady} />
            {error ? <p className="rounded bg-rose-50 p-2 text-xs text-rose-700">{error}</p> : null}
            <div className="flex gap-2">
              <button type="button" className="btn-primary" disabled={!file || busy} onClick={goToKbStep}>
                {busy ? "Preparing..." : "Next: KB Edit"}
              </button>
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section className="space-y-3">
            {baseMeta ? (
              <p className="text-xs text-slate-600">
                PDF page prepared: {baseMeta.width}x{baseMeta.height}px in {baseMeta.ms}ms
              </p>
            ) : null}
            <KbSliderEditor
              canvasRef={canvasRef}
              onResult={handleKbResult}
              minKB={50}
              maxKB={1000}
              defaultKB={300}
              minQBest={0.65}
              minQSafer={0.55}
              maxQ={0.98}
              maxIter={9}
            />
            <div className="flex gap-2">
              <button type="button" className="btn-muted" onClick={() => setStep(1)}>
                Back
              </button>
              <button type="button" className="btn-primary" disabled={!finalResult} onClick={() => setStep(3)}>
                Next: Preview
              </button>
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section className="panel">
            <h2 className="text-sm font-semibold text-slate-700">Preview + Download</h2>
            {finalResult ? (
              <>
                <img
                  src={finalResult.previewUrl}
                  alt="Converted scanned document"
                  className="mx-auto mt-3 max-h-64 rounded-xl border border-slate-300 bg-white"
                />
                <div className="mt-3 grid gap-1 text-xs text-slate-700 sm:grid-cols-2">
                  <p>Target: {finalResult.targetKB} KB</p>
                  <p>Result: {finalResult.kb} KB</p>
                  <p>Quality: {finalResult.quality}</p>
                  <p>Time: {finalResult.ms} ms</p>
                  <p>Status hit: {String(finalResult.hit)}</p>
                </div>
                <button
                  type="button"
                  className="btn-primary mt-3"
                  onClick={handleDownloadPdf}
                  disabled={pdfBusy}
                >
                  {pdfBusy ? "Preparing PDF..." : "Download PDF"}
                </button>
              </>
            ) : (
              <p className="mt-2 text-xs text-slate-500">No output available.</p>
            )}
            <div className="mt-3">
              <button type="button" className="btn-muted" onClick={() => setStep(2)}>
                Back: KB Edit
              </button>
            </div>
          </section>
        ) : null}
      </main>
      <AppFooter />
    </>
  );
}
