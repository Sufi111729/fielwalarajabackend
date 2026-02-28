import { useEffect, useMemo, useState } from "react";
import UploadDropzone from "./components/UploadDropzone";
import PresetSelector from "./components/PresetSelector";
import CropperPanel from "./components/CropperPanel";
import ResizeCompressPanel from "./components/ResizeCompressPanel";
import PreviewDownload from "./components/PreviewDownload";
import TopNav from "./components/TopNav";
import AppHeroStrip from "./components/AppHeroStrip";
import AppFooter from "./components/AppFooter";
import { PRESETS } from "./lib/imageUtils";

export default function PanEditorStandaloneApp() {
  const [file, setFile] = useState(null);
  const [presetId, setPresetId] = useState("photo");
  const [cropPixels, setCropPixels] = useState(null);
  const [result, setResult] = useState(null);
  const [step, setStep] = useState(1);
  const preset = useMemo(() => PRESETS[presetId], [presetId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const presetParam = params.get("preset");
    if (presetParam === "photo" || presetParam === "signature") {
      setPresetId(presetParam);
      setStep(2);
    }
  }, []);

  const handleFileSelected = (selectedFile) => {
    setFile(selectedFile);
    setCropPixels(null);
    setResult(null);
    setStep(1);
  };

  const goToStep2 = () => {
    if (!file) return;
    setStep(2);
  };

  const goToStep3 = () => {
    setStep(3);
  };

  const resetAll = () => {
    setFile(null);
    setPresetId("photo");
    setCropPixels(null);
    setResult(null);
    setStep(1);
  };

  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-7xl p-4 md:p-6">
        <AppHeroStrip mode="pan" />

        <div className="mb-5 grid gap-3 text-sm sm:grid-cols-3">
          <div
            className={`rounded-lg border bg-white px-3 py-3 ${
              step === 1 ? "border-slate-900 text-slate-900" : "border-slate-200 text-slate-600"
            }`}
          >
            <p className="text-xs uppercase tracking-wide">Step 1</p>
            <p className="mt-1 font-semibold">Upload</p>
          </div>
          <div
            className={`rounded-lg border bg-white px-3 py-3 ${
              step === 2 ? "border-slate-900 text-slate-900" : "border-slate-200 text-slate-600"
            }`}
          >
            <p className="text-xs uppercase tracking-wide">Step 2</p>
            <p className="mt-1 font-semibold">Option Selection</p>
          </div>
          <div
            className={`rounded-lg border bg-white px-3 py-3 ${
              step === 3 ? "border-slate-900 text-slate-900" : "border-slate-200 text-slate-600"
            }`}
          >
            <p className="text-xs uppercase tracking-wide">Step 3</p>
            <p className="mt-1 font-semibold">Editor</p>
          </div>
        </div>

        <div className="grid gap-4">
          {step === 1 ? (
            <div className="space-y-3">
              <UploadDropzone onFileSelected={handleFileSelected} file={file} />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={goToStep2}
                  disabled={!file}
                  className="btn-primary"
                >
                  Next: Option Selection
                </button>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-3">
              <PresetSelector selectedPresetId={presetId} onChangePreset={setPresetId} />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-muted"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={goToStep3}
                  className="btn-primary"
                >
                  Next: Editor
                </button>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-3 lg:col-span-2">
                <CropperPanel file={file} preset={preset} onCropPixelsChange={setCropPixels} />
                <ResizeCompressPanel
                  file={file}
                  cropPixels={cropPixels}
                  preset={preset}
                  onProcessed={setResult}
                />
              </div>
              <div className="lg:col-span-1 lg:sticky lg:top-4 lg:self-start">
                <PreviewDownload result={result} presetId={presetId} />
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn-muted"
              >
                Back
              </button>
              <button
                type="button"
                onClick={resetAll}
                className="btn-danger"
              >
                Start Over
              </button>
            </div>
          ) : null}
        </div>

      </main>
      <AppFooter />
    </>
  );
}

