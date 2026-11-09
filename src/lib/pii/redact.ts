import { detectPii, type CustomRule, type PiiMatch, type PiiType } from "./detectors";

export type MaskStyle = "indexed" | "label" | "partial";

/** One piece of the output: plain text, or a detected item. */
export interface RedactSegment {
  /** What appears in the redacted output (original value if kept). */
  text: string;
  match?: PiiMatch;
  kept?: boolean;
}

export interface RedactResult {
  text: string;
  /** Items that were actually redacted (excludes kept ones). */
  matches: PiiMatch[];
  /** Every piece in order, including kept items, for rendering. */
  segments: RedactSegment[];
  counts: Record<string, number>;
}

export const piiKey = (m: PiiMatch) => `${m.type}:${m.value}`;

export function countByType(matches: PiiMatch[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const m of matches) counts[m.type] = (counts[m.type] ?? 0) + 1;
  return counts;
}

/** Keep the last 4 letters/digits, star the rest (emails keep first char + domain). */
function partialMask(m: PiiMatch): string {
  if (m.type === "email") {
    const [user, domain] = m.value.split("@");
    return `${user[0]}***@${domain}`;
  }
  if (m.type === "url") {
    const origin = /^https?:\/\/[^/?#]+/.exec(m.value)?.[0] ?? "";
    return m.value.length > origin.length ? `${origin}/***` : origin;
  }
  let remaining = m.value.replace(/[^A-Za-z0-9]/g, "").length;
  return m.value.replace(/[A-Za-z0-9]/g, (c) => (remaining-- > 4 ? "*" : c));
}

export function redact(
  text: string,
  enabled: ReadonlySet<PiiType>,
  style: MaskStyle,
  /** `${type}:${value}` keys the user chose to keep as-is. */
  keep: ReadonlySet<string> = new Set(),
  custom: readonly CustomRule[] = [],
): RedactResult {
  const detected = detectPii(text, enabled, custom);
  // Indexed style: the same value always gets the same placeholder.
  const seen = new Map<string, number>();
  const perType: Record<string, number> = {};
  const segments: RedactSegment[] = [];
  const matches: PiiMatch[] = [];
  let cursor = 0;
  for (const m of detected) {
    if (m.start > cursor) segments.push({ text: text.slice(cursor, m.start) });
    cursor = m.end;
    if (keep.has(piiKey(m))) {
      segments.push({ text: m.value, match: m, kept: true });
      continue;
    }
    matches.push(m);
    let replacement: string;
    if (style === "partial") replacement = partialMask(m);
    else if (style === "label") replacement = `[${m.tag}]`;
    else {
      const key = `${m.type}:${m.type.startsWith("custom:") ? m.value.toLowerCase() : m.value}`;
      let n = seen.get(key);
      if (!n) {
        n = perType[m.type] = (perType[m.type] ?? 0) + 1;
        seen.set(key, n);
      }
      replacement = `[${m.tag}_${n}]`;
    }
    segments.push({ text: replacement, match: m });
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return {
    text: segments.map((x) => x.text).join(""),
    matches,
    segments,
    counts: countByType(matches),
  };
}
