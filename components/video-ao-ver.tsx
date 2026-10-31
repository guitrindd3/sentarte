"use client";

import { useEffect, useRef, useState, type VideoHTMLAttributes } from "react";

/**
 * A looping muted clip that only downloads once it's (nearly) on screen
 * (speed pass 2026-10-31): an autoplay <video> with a src downloads right
 * away, even below the fold or hidden on phones. Until then the poster shows.
 */
export function VideoAoVer({ src, ...props }: Omit<VideoHTMLAttributes<HTMLVideoElement>, "autoPlay" | "preload"> & { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [visto, setVisto] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visto) return;
    const obs = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          setVisto(true);
          obs.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [visto]);

  return <video ref={ref} src={visto ? src : undefined} autoPlay={visto} muted loop playsInline preload="none" {...props} />;
}
