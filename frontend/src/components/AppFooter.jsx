export default function AppFooter() {
  return (
    <footer className="mt-10 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <a href="/" className="inline-flex items-center">
              <img
                src="/logo-file-wala-raja.svg"
                alt="File Wala Tool"
                className="h-10 w-auto"
                loading="lazy"
              />
            </a>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
              Professional toolkit for PAN card image editing, KB compression, and ID document checks.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">Quick Links</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>
                <a href="/?tab=pan-tool#pan-tool-suite" className="transition-colors hover:text-slate-900">
                  PAN Tool
                </a>
              </li>
              <li>
                <a href="/?tab=all#pan-tool-suite" className="transition-colors hover:text-slate-900">
                  All Tools
                </a>
              </li>
              <li>
                <a href="/document-validator.html" className="transition-colors hover:text-slate-900">
                  ID Document
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">Creator</h3>
            <p className="mt-3 text-sm text-slate-600">Muhammad Sufiyan</p>
            <a
              href="https://mdsufidev.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block text-sm font-medium text-red-600 transition-colors hover:text-red-700"
            >
              mdsufidev.vercel.app
            </a>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-500">
          © {new Date().getFullYear()} File Wala Tool. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
