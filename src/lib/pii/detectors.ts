/**
 * PII detectors. Everything runs in the browser — the raw prompt never
 * leaves the user's machine. Detection is best-effort, not a guarantee.
 */

export type PiiType =
  | "secret"
  | "email"
  | "url"
  | "card"
  | "ssn"
  | "aadhaar"
  | "pan"
  | "ip"
  | "phone";

export interface PiiTypeInfo {
  id: PiiType;
  label: string;
  example: string;
}

/** Order = priority when two matches overlap (earlier wins). */
export const PII_TYPES: PiiTypeInfo[] = [
  { id: "secret", label: "API keys & secrets", example: "sk-…, AKIA…, ghp_…" },
  { id: "email", label: "Email", example: "jane@example.com" },
  { id: "url", label: "URL", example: "https://example.com/u/42" },
  { id: "card", label: "Credit card", example: "4111 1111 1111 1111" },
  { id: "ssn", label: "SSN (US)", example: "123-45-6789" },
  { id: "aadhaar", label: "Aadhaar (IN)", example: "2345 6789 0123" },
  { id: "pan", label: "PAN (IN)", example: "ABCDE1234F" },
  { id: "ip", label: "IP address", example: "192.168.0.1" },
  { id: "phone", label: "Phone", example: "+1 415 555 0132" },
];

/** A user-defined rule. `words` = literal terms (comma-separated), else a regex. */
export interface CustomRule {
  id: string;
  label: string;
  pattern: string;
  mode: "words" | "regex";
  enabled: boolean;
}

export const customType = (id: string) => `custom:${id}`;
export const MAX_PATTERN_LENGTH = 300;

const escapeRe = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Compile a custom rule; returns an error string for invalid patterns. */
export function compileRule(
  rule: Pick<CustomRule, "pattern" | "mode">,
): { regex: RegExp } | { error: string } {
  const pattern = rule.pattern.trim();
  if (!pattern) return { error: "Pattern is empty" };
  if (pattern.length > MAX_PATTERN_LENGTH) return { error: "Pattern is too long" };
  try {
    const source =
      rule.mode === "words"
        ? pattern
            .split(",")
            .map((w) => w.trim())
            .filter(Boolean)
            .map(escapeRe)
            .join("|")
        : pattern;
    if (!source) return { error: "Pattern is empty" };
    const regex = new RegExp(source, "gi");
    if (regex.test("")) return { error: "Pattern must not match empty text" };
    regex.lastIndex = 0;
    return { regex };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Invalid pattern" };
  }
}

export interface PiiMatch {
  /** Built-in id, or `custom:<ruleId>`. */
  type: string;
  /** Placeholder name, e.g. EMAIL or EMPLOYEE_ID. */
  tag: string;
  start: number;
  end: number;
  value: string;
}

function luhn(digits: string): boolean {
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = digits.charCodeAt(i) - 48;
    if (alt) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

// Verhoeff checksum, used by Aadhaar.
const D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6], [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8], [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2], [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4], [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2], [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0], [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5], [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];
function verhoeff(num: string): boolean {
  let c = 0;
  const rev = num.split("").reverse();
  for (let i = 0; i < rev.length; i++) c = D[c][P[i % 8][+rev[i]]];
  return c === 0;
}

const digitsOf = (s: string) => s.replace(/\D/g, "");

function validIPv4(s: string): boolean {
  return s.split(".").every((p) => +p >= 0 && +p <= 255 && String(+p) === p);
}

interface Detector {
  type: PiiType;
  regex: RegExp;
  validate?: (value: string) => boolean;
}

const DETECTORS: Detector[] = [
  {
    type: "secret",
    regex:
      /\b(?:sk-[A-Za-z0-9_-]{16,}|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{30,}|xox[baprs]-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z_-]{35}|eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,})/g,
  },
  {
    type: "email",
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}\b/g,
  },
  { type: "url", regex: /\bhttps?:\/\/[^\s<>"')\]]*[^\s<>"')\].,;:!?]/g },
  {
    type: "card",
    regex: /(?<![\d-])\d(?:[ -]?\d){12,18}(?![\d-])/g,
    validate: (v) => {
      const d = digitsOf(v);
      return d.length >= 13 && d.length <= 19 && luhn(d);
    },
  },
  { type: "ssn", regex: /(?<![\d-])(?!000|666|9\d\d)\d{3}-(?!00)\d{2}-(?!0000)\d{4}(?![\d-])/g },
  {
    type: "aadhaar",
    regex: /(?<![\d-])[2-9]\d{3}[ -]?\d{4}[ -]?\d{4}(?![\d-])/g,
    validate: (v) => verhoeff(digitsOf(v)),
  },
  { type: "pan", regex: /\b[A-Z]{5}\d{4}[A-Z]\b/g },
  {
    type: "ip",
    regex: /(?<![\d.])(?:\d{1,3}\.){3}\d{1,3}(?![\d.])/g,
    validate: validIPv4,
  },
  {
    type: "phone",
    regex: /(?<![\w.-])\+?\d[\d\s().-]{8,18}\d(?![\w-])/g,
    validate: (v) => {
      const n = digitsOf(v).length;
      return n >= 10 && n <= 15;
    },
  },
];

/** Find PII of the enabled types. Overlaps resolve by priority, then position. */
export function detectPii(
  text: string,
  enabled: ReadonlySet<PiiType>,
  custom: readonly CustomRule[] = [],
): PiiMatch[] {
  const accepted: PiiMatch[] = [];
  const MAX_CUSTOM_MATCHES = 1000;

  // User rules run first, so they win over built-in detectors on overlap.
  for (const rule of custom) {
    if (!rule.enabled) continue;
    const compiled = compileRule(rule);
    if ("error" in compiled) continue;
    const tag = rule.label.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "") || "CUSTOM";
    let count = 0;
    for (const m of text.matchAll(compiled.regex)) {
      if (!m[0] || count++ >= MAX_CUSTOM_MATCHES) break;
      const start = m.index ?? 0;
      const end = start + m[0].length;
      if (accepted.some((a) => start < a.end && end > a.start)) continue;
      accepted.push({ type: customType(rule.id), tag, start, end, value: m[0] });
    }
  }

  for (const det of DETECTORS) {
    if (!enabled.has(det.type)) continue;
    for (const m of text.matchAll(det.regex)) {
      const value = m[0];
      const start = m.index ?? 0;
      const end = start + value.length;
      if (det.validate && !det.validate(value)) continue;
      // Higher-priority detectors ran first; skip anything overlapping them.
      if (accepted.some((a) => start < a.end && end > a.start)) continue;
      accepted.push({ type: det.type, tag: det.type.toUpperCase(), start, end, value });
    }
  }
  return accepted.sort((a, b) => a.start - b.start);
}
