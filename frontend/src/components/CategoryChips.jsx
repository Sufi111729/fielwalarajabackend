export default function CategoryChips({ categories, activeCategory, onSelect }) {
  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-1">
      {categories.map((chip) => {
        const isActive = chip.id === activeCategory;
        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => onSelect(chip.id)}
            className={`whitespace-nowrap rounded-full border px-6 py-2 text-sm font-semibold transition-colors duration-150 ${
              isActive
                ? "border-slate-800 bg-slate-800 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
            }`}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
