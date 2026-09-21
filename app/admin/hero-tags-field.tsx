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
      <span className="text-sm text-ink-soft">Selos</span>
      <div className="mt-1 space-y-2">
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
              className="shrink-0 px-2 text-sm text-clay hover:underline"
            >
              Remover
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setTags((prev) => [...prev, { id: makeId(), value: "" }])}
        className="mt-2 border border-dashed border-rattan px-3 py-1.5 text-sm text-ink-soft transition-colors hover:border-ink hover:text-ink"
      >
        + Adicionar selo
      </button>
    </div>
  );
}
