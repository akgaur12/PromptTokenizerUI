import { useCallback, useState } from "react";
import { CUSTOM_CATEGORY_ID, SCAN_CATEGORIES } from "./rules";

const KEY = "scan-settings-v1";
const ALL_IDS = [...SCAN_CATEGORIES.map((c) => c.id), CUSTOM_CATEGORY_ID];

interface Stored {
  enabled: string[];
  phrases: string[];
}

function load(): Stored {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Stored>;
      return {
        enabled: (p.enabled ?? ALL_IDS).filter((id) => ALL_IDS.includes(id)),
        phrases: Array.isArray(p.phrases)
          ? p.phrases.filter((x): x is string => typeof x === "string")
          : [],
      };
    }
  } catch {
    /* fall through to defaults */
  }
  return { enabled: ALL_IDS, phrases: [] };
}

/** Which scan categories are on and the user's own phrases, saved locally. */
export function useScanSettings() {
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
    phrases: s.phrases,
    toggle: (id: string) =>
      update({
        ...s,
        enabled: s.enabled.includes(id)
          ? s.enabled.filter((x) => x !== id)
          : [...s.enabled, id],
      }),
    setAll: (on: boolean) => update({ ...s, enabled: on ? ALL_IDS : [] }),
    addPhrase: (p: string) => {
      const phrase = p.trim();
      if (!phrase || s.phrases.some((x) => x.toLowerCase() === phrase.toLowerCase())) return;
      update({
        ...s,
        phrases: [...s.phrases, phrase],
        enabled: s.enabled.includes(CUSTOM_CATEGORY_ID)
          ? s.enabled
          : [...s.enabled, CUSTOM_CATEGORY_ID],
      });
    },
    removePhrase: (p: string) =>
      update({ ...s, phrases: s.phrases.filter((x) => x !== p) }),
  };
}
