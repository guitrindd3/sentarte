"use client";

import { useState } from "react";
import { inputClass } from "./_ui";

let idCounter = 0;
function makeId() {
  idCounter += 1;
  return `tag-${idCounter}`;
}

export function HeroTagsField({ initialTags }: { initialTags: string[] }) {
  const [tags, setTags] = useState(() =>
    (initialTags.length > 0 ? initialTags : [""]).map((value) => ({ id: makeId(), value }))
  );

  return (
    <div>
      <span className="text-sm font-semibold text-ink">Selos</span>
      <span className="mt-0.5 block text-xs text-ink-soft">Palavras curtas que aparecem como etiquetas, como &quot;Feito à mão&quot;.</span>
      <div className="mt-1.5 space-y-2">
        {tags.map((tag, i) => (
          <div key={tag.id} className="flex gap-2">
            <input
              name={`tag${i}`}
              value={tag.value}
              onChange={(e) => {
                const value = e.target.value;
                setTags((prev) => prev.map((t) => (t.id === tag.id ? { ...t, value } : t)));
              }}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => setTags((prev) => prev.filter((t) => t.id !== tag.id))}
              aria-label={`Remover selo ${i + 1}`}
              className="shrink-0 rounded-full px-3 text-sm font-medium text-clay hover:bg-clay/10"
            >
              Remover
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setTags((prev) => [...prev, { id: makeId(), value: "" }])}
        className="mt-2 rounded-full border border-dashed border-rattan px-4 py-1.5 text-sm font-medium text-wood-dark transition-colors hover:border-wood hover:bg-rattan/10"
      >
        + Adicionar selo
      </button>
    </div>
  );
}
