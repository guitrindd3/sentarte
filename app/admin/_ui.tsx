"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

export const inputClass =
  "w-full border border-line bg-canvas px-3 py-2 text-sm text-ink focus:border-ink";
export const btnClass =
  "border border-ink bg-ink px-4 py-2 text-sm font-medium text-canvas transition-colors hover:bg-transparent hover:text-ink whitespace-nowrap";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm text-ink-soft">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function SaveButton({ children = "Salvar" }: { children?: ReactNode }) {
  const { pending } = useFormStatus();
  const [justSaved, setJustSaved] = useState(false);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending) {
      setJustSaved(true);
      const t = setTimeout(() => setJustSaved(false), 2500);
      return () => clearTimeout(t);
    }
    wasPending.current = pending;
  }, [pending]);

  return (
    <button
      type="submit"
      disabled={pending}
      aria-live="polite"
      className={`${btnClass} disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {pending ? "Salvando…" : justSaved ? "Salvo ✓" : children}
    </button>
  );
}

export function ConfirmSubmitButton({
  children,
  confirmText,
  className,
}: {
  children: ReactNode;
  confirmText: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
