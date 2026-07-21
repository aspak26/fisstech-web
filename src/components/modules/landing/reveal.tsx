"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

const emptySubscribe = () => () => {};
// Hydration-safe "are we on the client yet" check without setState-in-effect
// — same pattern as theme-toggle.tsx/appearance-card.tsx.
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

/** Zero-dependency scroll-reveal wrapper (IntersectionObserver + CSS
 * transition) — no framer-motion/AOS needed for a single fade-in/slide-up
 * effect. Respects prefers-reduced-motion (shows content immediately, no
 * transform) per the project's accessibility rule. */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const mounted = useMounted();
  // Plain render-time read (not a setState-in-effect) — matches SSR/first
  // hydration pass (mounted=false → false) so there's no hydration mismatch.
  const reduceMotion = mounted && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const shown = visible || reduceMotion;

  return (
    <div
      ref={ref}
      className={cn(
        reduceMotion ? "" : "transition-all duration-700 ease-out",
        shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
        className,
      )}
      style={{ transitionDelay: reduceMotion ? undefined : `${delay}ms` }}
    >
      {children}
    </div>
  );
}
