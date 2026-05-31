import { useEffect, useRef, useState } from "react";

/**
 * Smoothly animates from the previous value to the next whenever `value`
 * changes, using requestAnimationFrame and an ease-out curve. Respects the
 * user's reduced-motion preference.
 *
 * When `animate` is false the value snaps instantly (used e.g. when clearing
 * results, so cards reset immediately instead of counting down to zero).
 */
export function useAnimatedNumber(
  value: number,
  animate = true,
  durationMs = 600,
): number {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const frameRef = useRef<number>();

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!animate || prefersReduced) {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      setDisplay(value);
      fromRef.current = value;
      return;
    }

    const from = fromRef.current;
    const to = value;
    if (from === to) return;

    let startTs: number | null = null;

    const tick = (ts: number) => {
      if (startTs === null) startTs = ts;
      const elapsed = ts - startTs;
      const t = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const current = from + (to - from) * eased;
      setDisplay(current);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      fromRef.current = value;
    };
  }, [value, animate, durationMs]);

  return display;
}
