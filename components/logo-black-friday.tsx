import Image from "next/image";

/**
 * The atelier's Black Friday logo over a chair photo (user 2026-10-20) — only
 * drawn while useBlackFriday() is on, so the photos themselves never change
 * and look normal again as soon as the week ends. Never on the builder's chair.
 */
export function LogoBlackFriday({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/brand/black-friday.png"
      alt="Black Friday"
      width={640}
      height={379}
      sizes="240px"
      className={`pointer-events-none absolute left-2 top-2 h-auto drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)] ${className}`}
    />
  );
}
