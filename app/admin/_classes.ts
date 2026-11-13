// Admin class strings. Kept out of _ui.tsx ("use client"): a server page that
// builds `${inputClass} extra` from a client module gets a function, not the
// string (2026-11-13: the tracking-code box rendered with no border/padding).

export const inputClass =
  "w-full rounded-xl border border-line bg-paper px-3.5 py-3 text-base sm:py-2.5 sm:text-[0.95rem] text-ink shadow-[inset_0_1px_2px_rgba(36,31,26,0.04)] outline-none transition placeholder:text-ink-soft/60 focus:border-wood focus:ring-4 focus:ring-rattan/20";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-wood px-5 py-2.5 text-sm font-semibold text-paper shadow-sm transition hover:bg-wood-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rattan/40 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap";

export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-full border border-line bg-paper px-4 py-2 text-sm font-medium text-ink transition hover:border-wood hover:text-wood-dark whitespace-nowrap";
