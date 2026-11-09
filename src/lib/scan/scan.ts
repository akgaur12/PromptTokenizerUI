import {
  CUSTOM_CATEGORY_ID,
  SCAN_CATEGORIES,
  type Severity,
} from "./rules";

export interface Finding {
  category: string;
  label: string;
  severity: Severity;
  why: string;
  start: number;
  end: number;
  value: string;
}

export interface ScanSegment {
  text: string;
  finding?: Finding;
  /** The user marked this finding as a false positive. */
  dismissed?: boolean;
}

export type Risk = "none" | "medium" | "high";

export interface ScanResult {
  segments: ScanSegment[];
  /** Active findings only (dismissed ones excluded). */
  findings: Finding[];
  counts: Record<string, number>;
  risk: Risk;
}

export const findingKey = (f: Pick<Finding, "category" | "value">) =>
  `${f.category}:${f.value.toLowerCase()}`;

const MAX_PER_PATTERN = 500;
const SEVERITY_RANK: Record<Severity, number> = { high: 0, medium: 1 };
const escapeRe = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Make invisible characters readable in the UI. */
export function visible(value: string): string {
  return value.replace(
    /[​-‏⁠-⁤﻿‪-‮⁦-⁩\u{E0000}-\u{E007F}]/gu,
    (c) => `‹U+${c.codePointAt(0)!.toString(16).toUpperCase()}›`,
  );
}

export function scan(
  text: string,
  enabled: ReadonlySet<string>,
  customPhrases: readonly string[] = [],
  dismissed: ReadonlySet<string> = new Set(),
): ScanResult {
  const candidates: Finding[] = [];

  for (const cat of SCAN_CATEGORIES) {
    if (!enabled.has(cat.id)) continue;
    for (const re of cat.patterns) {
      let n = 0;
      for (const m of text.matchAll(re)) {
        if (!m[0] || n++ >= MAX_PER_PATTERN) break;
        const start = m.index ?? 0;
        candidates.push({
          category: cat.id,
          label: cat.label,
          severity: cat.severity,
          why: cat.why,
          start,
          end: start + m[0].length,
          value: m[0],
        });
      }
    }
  }

  const phrases = customPhrases.map((p) => p.trim()).filter(Boolean);
  if (phrases.length && enabled.has(CUSTOM_CATEGORY_ID)) {
    const re = new RegExp(phrases.map(escapeRe).join("|"), "gi");
    let n = 0;
    for (const m of text.matchAll(re)) {
      if (!m[0] || n++ >= MAX_PER_PATTERN) break;
      const start = m.index ?? 0;
      candidates.push({
        category: CUSTOM_CATEGORY_ID,
        label: "Custom phrase",
        severity: "medium",
        why: "Matches a phrase you added.",
        start,
        end: start + m[0].length,
        value: m[0],
      });
    }
  }

  // Resolve overlaps: higher severity first, then longer, then earlier.
  candidates.sort(
    (a, b) =>
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
      b.end - b.start - (a.end - a.start) ||
      a.start - b.start,
  );
  const accepted: Finding[] = [];
  for (const c of candidates) {
    if (accepted.some((a) => c.start < a.end && c.end > a.start)) continue;
    accepted.push(c);
  }
  accepted.sort((a, b) => a.start - b.start);

  const segments: ScanSegment[] = [];
  const findings: Finding[] = [];
  const counts: Record<string, number> = {};
  let cursor = 0;
  for (const f of accepted) {
    if (f.start > cursor) segments.push({ text: text.slice(cursor, f.start) });
    cursor = f.end;
    const isDismissed = dismissed.has(findingKey(f));
    segments.push({ text: f.value, finding: f, dismissed: isDismissed });
    if (!isDismissed) {
      findings.push(f);
      counts[f.category] = (counts[f.category] ?? 0) + 1;
    }
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });

  const risk: Risk = findings.some((f) => f.severity === "high")
    ? "high"
    : findings.length
      ? "medium"
      : "none";

  return { segments, findings, counts, risk };
}
