"use client";

import { useState, type ReactNode } from "react";
import { Tabs } from "@/components/ui/tabs";

interface CarouselPage {
  title: string;
  content: ReactNode;
}

/** Click-to-switch chart sections — a web page, not swipe-to-page like the
 * mobile app's carousel; navigation is plain buttons, no touch gestures. */
export function ChartCarousel({ pages }: { pages: CarouselPage[] }) {
  const [index, setIndex] = useState(0);

  if (pages.length === 0) return null;
  const current = Math.min(index, pages.length - 1);

  return (
    <div>
      {pages.length > 1 && (
        <div className="mb-4">
          <Tabs
            value={pages[current].title}
            onChange={(title) => setIndex(pages.findIndex((p) => p.title === title))}
            options={pages.map((p) => ({ value: p.title, label: p.title }))}
            className="flex-wrap"
          />
        </div>
      )}
      {pages.length === 1 && (
        <h3 className="mb-4 font-display text-lg font-semibold text-text-primary">{pages[current].title}</h3>
      )}
      {pages[current].content}
    </div>
  );
}
