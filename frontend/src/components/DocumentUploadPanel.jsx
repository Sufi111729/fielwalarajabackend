import { useMemo, useRef, useState } from "react";

const MAX_MB = 5;

export default function DocumentUploadPanel({ onReady }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  const handleFile = (nextFile) => {
    if (!nextFile) return;
    const isPdf = nextFile.type === "application/pdf" || nextFile.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setError("Only PDF format is allowed.");
      setFile(null);
      onReady(null);
      return;
    }
    if (nextFile.size > MAX_MB * 1024 * 1024) {
      setError(`File is too large. Maximum allowed size is ${MAX_MB}MB.`);
      setFile(null);
      onReady(null);
      return;
    }
    setError("");
    setFile(nextFile);
    onReady({
      file: nextFile,
      kb: Number((nextFile.size / 1024).toFixed(2)),
      valid: true
    });
  };

  const fileKb = useMemo(() => (file ? Number((file.size / 1024).toFixed(2)) : 0), [file]);

  return (
    <div
      className="panel min-h-[300px] border-2 border-dashed border-slate-300 text-center"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        handleFile(e.dataTransfer.files?.[0]);
      }}
    >
      <div className="flex h-full flex-col items-center justify-center py-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Scanned PDF Input</p>
        <p className="mt-2 text-sm text-slate-700">Drag and drop PDF here</p>
        <p className="mt-1 text-xs text-slate-500">Upload PDF up to 5MB, then convert to target 50KB to 1000KB.</p>

        {file ? (
          <div className="mt-4 w-full max-w-sm rounded-lg border border-slate-200 bg-slate-50 p-3 text-left text-xs text-slate-700">
            <p className="font-semibold text-slate-900">{file.name}</p>
            <p>File size: {fileKb} KB</p>
            <p className="mt-1 text-emerald-700">Status: PDF ready for KB conversion</p>
          </div>
        ) : null}

        <button type="button" onClick={() => inputRef.current?.click()} className="btn-muted mt-4">
          {file ? "Change PDF" : "Choose PDF"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>

      {error ? <p className="mt-2 rounded bg-rose-50 p-2 text-sm text-rose-700">{error}</p> : null}
    </div>
  );
}
