import { useEffect, useMemo, useRef, useState } from "react";
import { convertImageFile, convertImagesToSinglePdf, getOutputName } from "../utils/imageConvert";

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ConverterCard({
  title,
  description,
  accept,
  type,
  targetMime,
  targetExt
}) {
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [outputs, setOutputs] = useState([]);

  const previews = useMemo(
    () =>
      files.map((f) => ({
        name: f.name,
        sizeKb: (f.size / 1024).toFixed(1),
        url: URL.createObjectURL(f)
      })),
    [files]
  );

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  const onChooseFiles = (list) => {
    const next = Array.from(list || []);
    setFiles(next);
    setOutputs([]);
    setError("");
    setProgress(0);
  };

  const onDrop = (e) => {
    e.preventDefault();
    onChooseFiles(e.dataTransfer.files);
  };

  const onConvert = async () => {
    if (!files.length) {
      setError("Please upload files first.");
      return;
    }

    setBusy(true);
    setError("");
    setOutputs([]);
    setProgress(5);

    try {
      if (type === "to-pdf") {
        const pdfBlob = await convertImagesToSinglePdf(files, setProgress);
        setOutputs([
          {
            name: files.length > 1 ? "converted-images.pdf" : getOutputName(files[0].name, "pdf"),
            blob: pdfBlob,
            sizeKb: (pdfBlob.size / 1024).toFixed(1)
          }
        ]);
      } else {
        const converted = [];
        for (let i = 0; i < files.length; i += 1) {
          const blob = await convertImageFile(files[i], targetMime, 0.98);
          converted.push({
            name: getOutputName(files[i].name, targetExt),
            blob,
            sizeKb: (blob.size / 1024).toFixed(1)
          });
          setProgress(Math.round(((i + 1) / files.length) * 100));
        }
        setOutputs(converted);
      }
      setProgress(100);
    } catch (err) {
      setError(err.message || "Conversion failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{description}</p>

      <div
        className="mt-4 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        <p className="text-sm text-slate-700">Drag & drop files here</p>
        <button type="button" className="btn-muted mt-3" onClick={() => inputRef.current?.click()}>
          Choose Files
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple
          onChange={(e) => onChooseFiles(e.target.files)}
        />
      </div>

      {previews.length ? (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {previews.map((p) => (
            <div key={p.name} className="rounded-lg border border-slate-200 bg-white p-2">
              <img src={p.url} alt={p.name} className="h-20 w-full rounded object-cover" />
              <p className="mt-1 truncate text-xs text-slate-700">{p.name}</p>
              <p className="text-[11px] text-slate-500">{p.sizeKb} KB</p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex items-center gap-2">
        <button type="button" className="btn-primary" onClick={onConvert} disabled={busy || !files.length}>
          {busy ? "Converting..." : "Convert"}
        </button>
        {busy ? (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
            {progress}%
          </div>
        ) : null}
      </div>

      {outputs.length ? (
        <div className="mt-4 space-y-2">
          {outputs.map((o) => (
            <div key={o.name} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-slate-800">{o.name}</p>
                <p className="text-xs text-slate-500">{o.sizeKb} KB</p>
              </div>
              <button type="button" className="btn-primary" onClick={() => downloadBlob(o.blob, o.name)}>
                Download
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {error ? <p className="mt-3 rounded bg-rose-50 p-2 text-xs text-rose-700">{error}</p> : null}
    </div>
  );
}
