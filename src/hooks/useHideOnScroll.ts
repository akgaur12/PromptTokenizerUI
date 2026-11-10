import { useEffect, useState } from "react";

/**
 * True while the user is scrolling down (past `offset` px), false when they
 * scroll up or are near the top. Small movements are ignored so the bar
 * doesn't flicker.
 */
export function useHideOnScroll(offset = 64, threshold = 8) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;

    const update = () => {
      ticking = false;
      const y = Math.max(0, window.scrollY); // iOS rubber-banding can go negative
      const delta = y - last;
      if (y < offset) setHidden(false);
      else if (delta > threshold) setHidden(true);
      else if (delta < -threshold) setHidden(false);
      if (Math.abs(delta) > threshold || y < offset) last = y;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [offset, threshold]);

  return { hidden, show: () => setHidden(false) };
}
