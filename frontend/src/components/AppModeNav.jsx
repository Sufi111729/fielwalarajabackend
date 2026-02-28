import { useState } from "react";

function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function AppModeNav({ mode = "pan" }) {
  const isPan = mode === "pan";
  const isKb = mode === "kb";
  const [showCompressTools, setShowCompressTools] = useState(false);

  return (
    <header className="sticky top-0 z-40 mb-5 bg-white/95 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <a href="/" className="flex items-center gap-2">
          <img
            src="/logo-file-wala-raja.svg"
            alt="File Wala Tool"
            className="h-10 w-auto"
            loading="eager"
          />
        </a>

        <nav className="flex-1 px-2">
          <div className="flex items-center justify-center gap-2">
            <a
              href="/"
              className={`px-3 py-2 text-sm font-semibold transition ${
                isPan ? "text-blue-700" : "text-slate-700 hover:text-slate-900"
              }`}
            >
              PAN Editor
            </a>
            <button
              type="button"
              className="hidden items-center gap-1 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:text-slate-900 lg:inline-flex"
            >
              Photo Tools
              <ChevronDownIcon />
            </button>
            <button
              type="button"
              onClick={() => setShowCompressTools((s) => !s)}
              className={`inline-flex items-center gap-1 px-3 py-2 text-sm font-semibold transition ${
                showCompressTools || isKb ? "text-emerald-700" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Compress
              <ChevronDownIcon />
            </button>
          </div>
        </nav>

        <div>
          <a
            href="https://mdsufi.netlify.app"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 text-sm font-semibold text-slate-700 transition hover:text-slate-900"
          >
            Portfolio
          </a>
        </div>
      </div>

      {showCompressTools ? (
        <div className="px-4 py-2">
          <div className="flex items-center justify-center gap-2">
            <a
              href="/kb-editor.html"
              className={`px-3 py-2 text-sm font-semibold transition ${
                isKb ? "text-emerald-700" : "text-slate-700 hover:text-slate-900"
              }`}
            >
              IMG KB Compress
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}


