export default function ToolCard({ tool }) {
  const href = tool.href || "#";
  const hasActions = Array.isArray(tool.actions) && tool.actions.length > 0;

  const cardBody = (
    <>
      <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[#ffefe9] text-[#ea5a3d]">
        <svg viewBox={tool.icon.viewBox} fill="none" className="h-6 w-6" aria-hidden="true">
          {tool.icon.paths.map((path, idx) => (
            <path
              key={`${tool.id}-icon-${idx}`}
              d={path.d}
              stroke="currentColor"
              strokeWidth={path.strokeWidth || 1.8}
              fill={path.fill || "none"}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </svg>
      </div>
      <h3 className="text-2xl font-semibold text-slate-900 transition-colors duration-150 group-hover:text-slate-950">
        {tool.title}
      </h3>
      <p className="mt-3 text-base leading-relaxed text-slate-600">{tool.description}</p>
      {hasActions ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {tool.actions.map((action) => (
            <a
              key={`${tool.id}-${action.label}`}
              href={action.href || "#"}
              className="inline-flex items-center rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white transition-colors duration-150 hover:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              {action.label}
            </a>
          ))}
        </div>
      ) : null}
    </>
  );

  if (hasActions) {
    return (
      <div className="group block rounded-3xl border border-slate-200 bg-white p-8 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm">
        {cardBody}
      </div>
    );
  }

  return (
    <a
      href={href}
      className="group block rounded-3xl border border-slate-200 bg-white p-8 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm"
    >
      {cardBody}
    </a>
  );
}
