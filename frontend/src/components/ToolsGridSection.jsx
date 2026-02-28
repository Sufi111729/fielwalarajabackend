import { useEffect, useMemo, useState } from "react";
import CategoryChips from "./CategoryChips";
import ToolCard from "./ToolCard";
import { toolCategories, tools } from "../data/toolsData";

export default function ToolsGridSection() {
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    const syncTabFromUrl = () => {
      const tab = new URLSearchParams(window.location.search).get("tab");
      if (tab === "pan-tool" || tab === "all") {
        setActiveCategory(tab);
      }
    };

    syncTabFromUrl();
    window.addEventListener("popstate", syncTabFromUrl);
    window.addEventListener("hashchange", syncTabFromUrl);
    return () => {
      window.removeEventListener("popstate", syncTabFromUrl);
      window.removeEventListener("hashchange", syncTabFromUrl);
    };
  }, []);

  const filteredTools = useMemo(() => {
    if (activeCategory === "all") return tools;
    return tools.filter((tool) => tool.categoryId === activeCategory);
  }, [activeCategory]);

  return (
    <section id="pan-tool-suite" className="mb-10">
      <div id="tools-section" />
      <div className="mb-4">
        <CategoryChips categories={toolCategories} activeCategory={activeCategory} onSelect={setActiveCategory} />
      </div>

      {filteredTools.length ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {filteredTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
          This category is coming soon. Use <span className="font-semibold text-slate-900">All</span> or{" "}
          <span className="font-semibold text-slate-900">PAN Tool</span> to access current tools.
        </div>
      )}
    </section>
  );
}
