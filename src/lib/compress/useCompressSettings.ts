import { useCallback, useState } from "react";
import { PRESETS, RULE_ORDER } from "./rules";

const KEY = "compress-settings-v1";
const DEFAULT = PRESETS.find((p) => p.id === "balanced")!.rules;

function load(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as { enabled?: unknown };
      if (Array.isArray(p.enabled)) {
        return p.enabled.filter((id): id is string => RULE_ORDER.includes(id));
      }
    }
  } catch {
    /* fall through to defaults */
  }
  return DEFAULT;
}

/** Which compression rules are on, saved in this browser. */
export function useCompressSettings() {
  const [enabled, setEnabled] = useState<string[]>(load);

  const save = useCallback((next: string[]) => {
    setEnabled(next);
    try {
      localStorage.setItem(KEY, JSON.stringify({ enabled: next }));
    } catch {
      /* storage unavailable — keep in memory only */
    }
  }, []);

  return {
    enabled: new Set(enabled),
    toggle: (id: string) =>
      save(enabled.includes(id) ? enabled.filter((x) => x !== id) : [...enabled, id]),
    setRules: save,
  };
}
