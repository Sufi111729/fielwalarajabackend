import { useEffect, useRef, useState } from "react";

const NAV_CONFIG = {
  pan: { label: "PAN TOOL", href: "/?tab=pan-tool#pan-tool-suite" },
  photoTools: [
    { label: "Crop & Resize", href: "/pan-editor.html?preset=photo" },
    { label: "Signature Editor", href: "/pan-editor.html?preset=signature" }
  ],
  compress: [
    { label: "IMG KB Compress", href: "/kb-editor.html" },
    { label: "JPG Optimize", href: "/kb-editor.html" }
  ],
  convert: [
    { label: "All Convert Tools", href: "/convert.html" },
    { label: "JPG to PNG", href: "/convert.html?tool=jpg-to-png" },
    { label: "PNG to JPG", href: "/convert.html?tool=png-to-jpg" },
    { label: "JPG to PDF", href: "/convert.html?tool=jpg-to-pdf" },
    { label: "PNG to PDF", href: "/convert.html?tool=png-to-pdf" },
    { label: "IMG to PDF", href: "/convert.html?tool=img-to-pdf" }
  ],
  allTools: [
    { label: "PAN Tool", href: "/?tab=pan-tool#pan-tool-suite" }
  ]
};

const CHIP_ITEMS = [
  "All",
  "Workflows",
  "Organize",
  "Optimize",
  "Convert",
  "Edit",
  "Security",
  "Intelligence"
];

function useOutsideClick(ref, onOutside) {
  useEffect(() => {
    function onPointerDown(event) {
      if (!ref.current) return;
      if (!ref.current.contains(event.target)) onOutside();
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [ref, onOutside]);
}

function Chevron({ open }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={`h-4 w-4 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
      aria-hidden="true"
    >
      <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M4 7H20M4 12H20M4 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function AppsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <circle cx="5" cy="5" r="1.6" />
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="19" cy="5" r="1.6" />
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
      <circle cx="5" cy="19" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
      <circle cx="19" cy="19" r="1.6" />
    </svg>
  );
}

function TriggerButton({ label, menuKey, openMenu, setOpenMenu }) {
  const isOpen = openMenu === menuKey;
  return (
    <button
      type="button"
      aria-haspopup="menu"
      aria-expanded={isOpen}
      aria-controls={`${menuKey}-menu`}
      onClick={() => setOpenMenu((m) => (m === menuKey ? null : menuKey))}
      className={`inline-flex h-9 items-center gap-1 border-b-2 px-2 text-sm font-semibold uppercase tracking-wide transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        isOpen ? "border-slate-900 text-slate-900" : "border-transparent text-slate-700 hover:text-slate-900"
      }`}
    >
      {label}
      <Chevron open={isOpen} />
    </button>
  );
}

function DropdownMenu({ id, items, onNavigate }) {
  return (
    <ul
      id={id}
      role="menu"
      className="absolute left-0 top-full z-50 mt-2 min-w-[200px] rounded-xl border border-slate-200 bg-white p-1 shadow-md"
    >
      {items.map((item) => (
        <li key={item.label} role="none">
          <a
            role="menuitem"
            href={item.href}
            onClick={onNavigate}
            className="block rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors duration-150 hover:bg-slate-100 focus:bg-slate-100 focus:outline-none"
          >
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

export default function TopNav({ showChips = false }) {
  const navRef = useRef(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountEmail, setAccountEmail] = useState("");
  const [mobileAccordions, setMobileAccordions] = useState({
    photoTools: false,
    compress: false,
    convert: false
  });

  const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
  const isPanActive = pathname === "/" || pathname === "/index.html";

  const closeAll = () => {
    setOpenMenu(null);
    setMobileOpen(false);
    setMobileAccordions({ photoTools: false, compress: false, convert: false });
  };

  const isLoggedIn = Boolean(accountEmail);

  const syncAuth = () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("fwr_auth_token") || "";
    const email = localStorage.getItem("fwr_auth_email") || "";
    setAccountEmail(token ? email : "");
  };

  const onLogout = () => {
    localStorage.removeItem("fwr_auth_token");
    localStorage.removeItem("fwr_auth_email");
    setAccountEmail("");
    closeAll();
    window.location.href = "/auth.html?mode=login";
  };

  useOutsideClick(navRef, () => setOpenMenu(null));

  useEffect(() => {
    function onEscape(e) {
      if (e.key === "Escape") {
        closeAll();
      }
    }
    window.addEventListener("keydown", onEscape);
    window.addEventListener("popstate", closeAll);
    window.addEventListener("hashchange", closeAll);
    return () => {
      window.removeEventListener("keydown", onEscape);
      window.removeEventListener("popstate", closeAll);
      window.removeEventListener("hashchange", closeAll);
    };
  }, []);

  useEffect(() => {
    syncAuth();
    function onStorage() {
      syncAuth();
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div ref={navRef} className="mx-auto max-w-7xl px-4">
        <div className="grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-3">
          <a href="/" className="inline-flex min-w-0 items-center">
            <img
              src="/logo-file-wala-raja.svg"
              alt="File Wala Tool"
              className="h-10 w-auto sm:h-11"
              loading="eager"
            />
          </a>

          <nav className="hidden items-center justify-center gap-2 md:flex" aria-label="Primary">
            <a
              href={NAV_CONFIG.pan.href}
              aria-current={isPanActive ? "page" : undefined}
              className={`inline-flex h-9 items-center border-b-2 px-2 text-sm font-semibold uppercase tracking-wide transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                isPanActive ? "border-slate-900 text-slate-900" : "border-transparent text-slate-700 hover:text-slate-900"
              }`}
            >
              {NAV_CONFIG.pan.label}
            </a>

            <div className="relative">
              <TriggerButton label="PHOTO TOOLS" menuKey="photoTools" openMenu={openMenu} setOpenMenu={setOpenMenu} />
              {openMenu === "photoTools" ? (
                <DropdownMenu id="photoTools-menu" items={NAV_CONFIG.photoTools} onNavigate={closeAll} />
              ) : null}
            </div>

            <div className="relative">
              <TriggerButton label="COMPRESS" menuKey="compress" openMenu={openMenu} setOpenMenu={setOpenMenu} />
              {openMenu === "compress" ? (
                <DropdownMenu id="compress-menu" items={NAV_CONFIG.compress} onNavigate={closeAll} />
              ) : null}
            </div>

            <div className="relative">
              <TriggerButton label="CONVERT" menuKey="convert" openMenu={openMenu} setOpenMenu={setOpenMenu} />
              {openMenu === "convert" ? (
                <DropdownMenu id="convert-menu" items={NAV_CONFIG.convert} onNavigate={closeAll} />
              ) : null}
            </div>

            <a
              href="/?tab=all#pan-tool-suite"
              className="inline-flex h-9 items-center border-b-2 border-transparent px-2 text-sm font-semibold uppercase tracking-wide text-slate-700 transition-colors duration-150 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              ALL TOOLS
            </a>
          </nav>

          <div className="justify-self-end flex items-center gap-2">
            {isLoggedIn ? (
              <div className="relative hidden md:block">
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={openMenu === "account"}
                  aria-controls="account-menu"
                  onClick={() => setOpenMenu((m) => (m === "account" ? null : "account"))}
                  className="inline-flex h-10 items-center rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-800 transition-colors duration-150 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Account
                </button>
                {openMenu === "account" ? (
                  <div
                    id="account-menu"
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-2 min-w-[240px] rounded-xl border border-slate-200 bg-white p-2 shadow-md"
                  >
                    <p className="px-2 py-1 text-xs font-medium text-slate-500">Logged in as</p>
                    <p className="truncate px-2 pb-2 text-sm font-semibold text-slate-800">{accountEmail}</p>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={onLogout}
                      className="w-full rounded-lg bg-red-500 px-3 py-2 text-left text-sm font-semibold text-white transition-colors hover:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                    >
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <a
                  href="/auth.html?mode=login"
                  className="hidden text-sm font-semibold text-slate-800 transition-colors duration-150 hover:text-slate-900 md:inline"
                >
                  Login
                </a>
                <a
                  href="/auth.html?mode=signup"
                  className="hidden md:inline-flex h-10 items-center rounded-lg bg-red-500 px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                >
                  Sign up
                </a>
              </>
            )}
            <button
              type="button"
              className="hidden md:inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 transition-colors duration-150 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Open apps"
            >
              <AppsIcon />
            </button>

            {isLoggedIn ? (
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex md:hidden h-9 items-center rounded-lg bg-red-500 px-3 text-xs font-semibold text-white"
              >
                Logout
              </button>
            ) : (
              <a
                href="/auth.html?mode=signup"
                className="inline-flex md:hidden h-9 items-center rounded-lg bg-red-500 px-3 text-xs font-semibold text-white"
              >
                Sign up
              </a>
            )}
            <button
              type="button"
              aria-label="Toggle mobile menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
              className="inline-flex md:hidden h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {mobileOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        <div
          className={`overflow-hidden transition-all duration-200 md:hidden ${
            mobileOpen ? "max-h-[80vh] pb-3 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="space-y-1 border-t border-slate-200 pt-3">
            <a
              href={NAV_CONFIG.pan.href}
              onClick={closeAll}
              className={`block rounded-lg px-3 py-2 text-sm font-semibold ${isPanActive ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-100"}`}
            >
              PAN TOOL
            </a>

            {[
              { key: "photoTools", label: "PHOTO TOOLS", items: NAV_CONFIG.photoTools },
              { key: "compress", label: "COMPRESS", items: NAV_CONFIG.compress },
              { key: "convert", label: "CONVERT", items: NAV_CONFIG.convert }
            ].map((section) => (
              <div key={section.key}>
                <button
                  type="button"
                  aria-expanded={mobileAccordions[section.key]}
                  aria-controls={`mobile-${section.key}`}
                  onClick={() =>
                    setMobileAccordions((prev) => ({ ...prev, [section.key]: !prev[section.key] }))
                  }
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  {section.label}
                  <Chevron open={mobileAccordions[section.key]} />
                </button>
                {mobileAccordions[section.key] ? (
                  <div id={`mobile-${section.key}`} className="ml-3 space-y-1">
                    {section.items.map((item) => (
                      <a
                        key={item.label}
                        href={item.href}
                        onClick={closeAll}
                        className="block rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            <a
              href="/?tab=all#pan-tool-suite"
              onClick={closeAll}
              className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              ALL TOOLS
            </a>

            {isLoggedIn ? (
              <>
                <p className="px-3 py-1 text-xs font-medium text-slate-500">Logged in as</p>
                <p className="truncate px-3 pb-2 text-sm font-semibold text-slate-800">{accountEmail}</p>
                <button
                  type="button"
                  onClick={onLogout}
                  className="block w-full rounded-lg bg-red-500 px-3 py-2 text-left text-sm font-semibold text-white hover:bg-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <a href="/auth.html?mode=login" className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                Login
              </a>
            )}
          </div>
        </div>
      </div>

      {showChips ? (
        <div className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-2">
            {CHIP_ITEMS.map((chip, idx) => (
              <button
                key={chip}
                type="button"
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                  idx === 0
                    ? "border-slate-800 bg-slate-800 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}


