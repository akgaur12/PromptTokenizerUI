import { COMPRESS_RULES, protectedRanges, type Edit } from "./rules";

export interface CompressSegment {
  /** What appears in the compressed output. */
  text: string;
  edit?: Edit;
  original?: string;
  /** User chose to keep the original text for this edit. */
  kept?: boolean;
}

export interface CompressResult {
  text: string;
  segments: CompressSegment[];
  /** Edits actually applied (excludes kept ones). */
  applied: number;
  counts: Record<string, number>;
}

export const editKey = (rule: string, original: string) =>
  `${rule}:${original.toLowerCase()}`;

/**
 * Run the enabled rules. Earlier rules win on overlap, and nothing inside a
 * protected region (code, quotes, {{vars}}) is ever changed.
 */
export function compress(
  text: string,
  enabled: ReadonlySet<string>,
  keep: ReadonlySet<string> = new Set(),
): CompressResult {
  const guarded = protectedRanges(text);
  const accepted: Edit[] = [];

  for (const rule of COMPRESS_RULES) {
    if (!enabled.has(rule.id)) continue;
    const edits = rule.find(text).sort((a, b) => a.start - b.start);
    for (const e of edits) {
      if (e.end <= e.start) continue;
      if (guarded.some(([s, t]) => e.start < t && e.end > s)) continue;
      if (accepted.some((a) => e.start < a.end && e.end > a.start)) continue;
      accepted.push(e);
    }
  }
  accepted.sort((a, b) => a.start - b.start);

  const segments: CompressSegment[] = [];
  const counts: Record<string, number> = {};
  let cursor = 0;
  let applied = 0;
  // After a deletion at the start of a sentence, the next word is capitalised.
  let pendingCap = false;
  const push = (seg: CompressSegment) => {
    if (seg.text) {
      if (pendingCap && /^[a-z]/.test(seg.text)) {
        seg.text = seg.text[0].toUpperCase() + seg.text.slice(1);
      }
      pendingCap = false;
    }
    segments.push(seg);
  };

  for (const e of accepted) {
    if (e.start > cursor) push({ text: text.slice(cursor, e.start) });
    cursor = e.end;
    const original = text.slice(e.start, e.end);
    const kept = keep.has(editKey(e.rule, original));
    if (!kept && e.replacement === "" && e.capNext) pendingCap = true;
    push({ text: kept ? original : e.replacement, edit: e, original, kept });
    if (!kept) {
      applied++;
      counts[e.rule] = (counts[e.rule] ?? 0) + 1;
    }
  }
  if (cursor < text.length) push({ text: text.slice(cursor) });

  // Removing a greeting or sign-off can leave blank space at either end.
  if (enabled.has("whitespace")) trimEnds(segments);

  return { text: segments.map((s) => s.text).join(""), segments, applied, counts };
}

/** Strip leading/trailing whitespace across the first/last segments. */
function trimEnds(segments: CompressSegment[]) {
  for (const s of segments) {
    const t = s.text.trimStart();
    s.text = t;
    if (t) break;
  }
  for (let i = segments.length - 1; i >= 0; i--) {
    const t = segments[i].text.trimEnd();
    segments[i].text = t;
    if (t) break;
  }
}
