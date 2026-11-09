import { useCallback, useState } from "react";
import { PII_TYPES, type CustomRule, type PiiType } from "./detectors";
import type { MaskStyle } from "./redact";

const KEY = "pii-settings-v1";

interface Stored {
  enabled: PiiType[];
  style: MaskStyle;
  custom: CustomRule[];
}

const DEFAULTS: Stored = {
  enabled: PII_TYPES.map((t) => t.id),
  style: "indexed",
  custom: [],
};

function load(): Stored {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const p = JSON.parse(raw) as Partial<Stored>;
    const valid = new Set(PII_TYPES.map((t) => t.id));
    return {
      enabled: (p.enabled ?? DEFAULTS.enabled).filter((t) => valid.has(t)),
      style: p.style === "label" || p.style === "partial" ? p.style : "indexed",
      custom: Array.isArray(p.custom)
        ? p.custom.filter(
            (r) =>
              r && typeof r.id === "string" && typeof r.label === "string" &&
              typeof r.pattern === "string" && (r.mode === "words" || r.mode === "regex"),
          ).map((r) => ({ ...r, enabled: r.enabled !== false }))
        : [],
    };
  } catch {
    return DEFAULTS;
  }
}

/** User's PII choices (which types, which mask style), persisted locally. */
export function usePiiSettings() {
  const [s, setS] = useState<Stored>(load);

  const update = useCallback((next: Stored) => {
    setS(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable — keep in memory only */
    }
  }, []);

  return {
    enabled: new Set(s.enabled),
    style: s.style,
    toggle: (t: PiiType) =>
      update({
        ...s,
        enabled: s.enabled.includes(t)
          ? s.enabled.filter((x) => x !== t)
          : [...s.enabled, t],
      }),
    setAll: (on: boolean) =>
      update({ ...s, enabled: on ? PII_TYPES.map((t) => t.id) : [] }),
    setStyle: (style: MaskStyle) => update({ ...s, style }),
    custom: s.custom,
    addRule: (rule: Omit<CustomRule, "id" | "enabled">) =>
      update({
        ...s,
        custom: [...s.custom, { ...rule, id: crypto.randomUUID().slice(0, 8), enabled: true }],
      }),
    updateRule: (id: string, patch: Omit<CustomRule, "id" | "enabled">) =>
      update({
        ...s,
        custom: s.custom.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      }),
    toggleRule: (id: string) =>
      update({
        ...s,
        custom: s.custom.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)),
      }),
    removeRule: (id: string) =>
      update({ ...s, custom: s.custom.filter((r) => r.id !== id) }),
  };
}
