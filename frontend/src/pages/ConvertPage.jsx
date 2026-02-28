import TopNav from "../components/TopNav";
import AppFooter from "../components/AppFooter";
import ConverterCard from "../components/ConverterCard";

const TOOLS = [
  {
    id: "jpg-to-png",
    title: "JPG to PNG",
    description: "Convert JPG images to PNG format with preserved dimensions.",
    path: "/jpg-to-png",
    key: "jpg-to-png",
    accept: ".jpg,.jpeg,image/jpeg",
    type: "image",
    targetMime: "image/png",
    targetExt: "png"
  },
  {
    id: "png-to-jpg",
    title: "PNG to JPG",
    description: "Convert PNG images to JPG format with white background support.",
    path: "/png-to-jpg",
    key: "png-to-jpg",
    accept: ".png,image/png",
    type: "image",
    targetMime: "image/jpeg",
    targetExt: "jpg"
  },
  {
    id: "jpg-to-pdf",
    title: "JPG to PDF",
    description: "Convert one or multiple JPG files into a single PDF file.",
    path: "/jpg-to-pdf",
    key: "jpg-to-pdf",
    accept: ".jpg,.jpeg,image/jpeg",
    type: "to-pdf",
    targetMime: "application/pdf",
    targetExt: "pdf"
  },
  {
    id: "png-to-pdf",
    title: "PNG to PDF",
    description: "Convert one or multiple PNG files into a single PDF file.",
    path: "/png-to-pdf",
    key: "png-to-pdf",
    accept: ".png,image/png",
    type: "to-pdf",
    targetMime: "application/pdf",
    targetExt: "pdf"
  },
  {
    id: "img-to-pdf",
    title: "IMG to PDF",
    description: "Convert JPG, PNG, WEBP and other image formats into a single PDF.",
    path: "/img-to-pdf",
    key: "img-to-pdf",
    accept: "image/*,.jpg,.jpeg,.png,.webp,.bmp,.gif",
    type: "to-pdf",
    targetMime: "application/pdf",
    targetExt: "pdf"
  }
];

function resolveSelectedTool() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const toolParam = params.get("tool");
  if (toolParam) return toolParam;

  const pathname = window.location.pathname;
  const found = TOOLS.find((t) => t.path === pathname);
  return found ? found.key : null;
}

export default function ConvertPage() {
  const selectedKey = resolveSelectedTool();
  const selected = TOOLS.find((t) => t.key === selectedKey) || null;

  return (
    <>
      <TopNav />
      <main className="mx-auto max-w-7xl p-4 md:p-6">
        <section className="mb-5 border-b border-slate-200 bg-white px-4 py-8 md:px-6 md:py-10">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-2xl font-bold leading-tight text-slate-900 md:text-4xl">Convert Tools</h1>
            <p className="mt-3 text-base text-slate-600 md:text-lg">
              JPG to PNG, PNG to JPG, JPG to PDF, PNG to PDF, IMG to PDF - Fast frontend conversion.
            </p>
          </div>
        </section>

        {!selected ? (
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {TOOLS.map((tool) => (
              <a
                key={tool.id}
                href={`/convert.html?tool=${tool.key}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <h2 className="text-lg font-semibold text-slate-900">{tool.title}</h2>
                <p className="mt-2 text-sm text-slate-600">{tool.description}</p>
              </a>
            ))}
          </section>
        ) : (
          <section className="space-y-4">
            <a href="/convert.html" className="inline-flex rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Back to all converters
            </a>
            <ConverterCard
              title={selected.title}
              description={selected.description}
              accept={selected.accept}
              type={selected.type}
              targetMime={selected.targetMime}
              targetExt={selected.targetExt}
            />
          </section>
        )}
      </main>
      <AppFooter />
    </>
  );
}
