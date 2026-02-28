import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { downloadBlob } from "../lib/imageUtils";

const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:8080";

export default function PreviewDownload({ result, presetId }) {
  const [validateState, setValidateState] = useState({
    called: false,
    loading: false,
    data: null,
    warning: ""
  });

  useEffect(() => {
    setValidateState({ called: false, loading: false, data: null, warning: "" });
  }, [result]);

  const filename = useMemo(() => `pan-${presetId}-${Date.now()}.jpg`, [presetId]);

  if (!result) {
    return null;
  }

  const handleValidate = async () => {
    if (validateState.called) return;
    setValidateState((s) => ({ ...s, called: true, loading: true, warning: "" }));
    const start = performance.now();

    try {
      const form = new FormData();
      form.append("file", new File([result.blob], filename, { type: "image/jpeg" }));
      form.append("presetId", presetId);

      const res = await axios.post(`${apiBase}/api/validate`, form, { timeout: 12000 });
      const elapsed = Math.round(performance.now() - start);

      console.log("backend_validate_ms", elapsed);
      console.log("backend_validate_ok", !!res.data?.ok);
      console.log("backend_error_codes", (res.data?.errors || []).map((e) => e.code));

      setValidateState((s) => ({ ...s, loading: false, data: res.data }));
    } catch (e) {
      const elapsed = Math.round(performance.now() - start);
      console.log("backend_validate_ms", elapsed);
      console.log("backend_validate_ok", false);
      console.log("backend_error_codes", ["BACKEND_UNAVAILABLE"]);

      setValidateState((s) => ({
        ...s,
        loading: false,
        warning: "Backend not reachable (possibly cold start). Download is still available."
      }));
    }
  };

  return (
    <div className="panel">
      <h2 className="mb-3 text-sm font-semibold text-slate-700">Preview + Download</h2>
      <img
        src={result.previewUrl}
        alt="Final output"
        className="mx-auto max-h-44 rounded-xl border border-slate-300 bg-white"
      />
      <div className="mt-3 grid gap-1 text-xs text-slate-700">
        <p>Target Px: {result.width}x{result.height}</p>
        <p>Final Size: {result.kb} KB</p>
        <p>JPEG Quality Used: {result.quality}</p>
      </div>
      {!result.withinLimit ? (
        <p className="mt-2 text-xs text-amber-600">
          50KB target hard hai. System ne max possible clarity maintain karte hue size ko control kiya hai.
        </p>
      ) : null}

      <div className="mt-3 grid gap-2">
        <button
          type="button"
          className="btn-primary"
          onClick={() => downloadBlob(result.blob, filename)}
        >
          Download JPG
        </button>

        <button
          type="button"
          className="btn-muted"
          disabled={validateState.called || validateState.loading}
          onClick={handleValidate}
        >
          {validateState.loading ? "Validating..." : "Validate Final (Optional)"}
        </button>
      </div>

      {validateState.warning ? (
        <p className="mt-2 rounded bg-amber-50 p-2 text-xs text-amber-700">{validateState.warning}</p>
      ) : null}

      {validateState.data ? (
        <pre className="mt-2 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
          {JSON.stringify(validateState.data, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
