/**
 * Prompt-compression rules. Each rule finds edits (spans to delete or
 * replace). Rules are plain regex rewrites — predictable and private.
 * They never touch protected regions (code, quotes, {{variables}}).
 */

export type Risk = "safe" | "moderate" | "risky";

export interface Edit {
  start: number;
  end: number;
  replacement: string;
  rule: string;
  /** Deleting this left a sentence starting in lowercase — capitalise what follows. */
  capNext?: boolean;
}

export interface CompressRule {
  id: string;
  label: string;
  risk: Risk;
  description: string;
  example: string;
  find: (text: string) => Edit[];
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function atSentenceStart(text: string, start: number): boolean {
  const from = Math.max(0, start - 40);
  const before = text.slice(from, start);
  if (from === 0 && /^[ \t]*$/.test(before)) return true;
  if (/[\n.!?][ \t]*$/.test(before)) return true;
  return /(?:^|\n)[ \t]*(?:[-*+]|\d+[.)])[ \t]+$/.test(before);
}

/** Build an edit, fixing capitalisation when a sentence's first word changes. */
function mk(
  text: string,
  start: number,
  end: number,
  replacement: string,
  rule: string,
): Edit {
  if (atSentenceStart(text, start)) {
    if (replacement === "") {
      return { start, end, replacement, rule, capNext: true };
    } else if (/^[a-z]/.test(replacement)) {
      replacement = replacement[0].toUpperCase() + replacement.slice(1);
    }
  }
  return { start, end, replacement, rule };
}

function fromRegex(
  text: string,
  re: RegExp,
  rule: string,
  replace: (m: RegExpMatchArray) => string = () => "",
): Edit[] {
  const out: Edit[] = [];
  let n = 0;
  for (const m of text.matchAll(re)) {
    if (!m[0] || n++ >= 2000) break;
    const start = m.index ?? 0;
    out.push(mk(text, start, start + m[0].length, replace(m), rule));
  }
  return out;
}

const matchCase = (src: string, repl: string) =>
  /^[A-Z]/.test(src) ? repl[0].toUpperCase() + repl.slice(1) : repl;

/* ------------------------------------------------------------------ */
/* Protected regions                                                   */
/* ------------------------------------------------------------------ */

const PROTECTED: RegExp[] = [
  /```[\s\S]*?```/g,
  /`[^`\n]+`/g,
  /\{\{[\s\S]*?\}\}/g,
  /\$\{[^}\n]*\}/g,
  /"[^"\n]{1,300}"/g,
  /“[^”\n]{1,300}”/g,
];

export function protectedRanges(text: string): [number, number][] {
  const out: [number, number][] = [];
  for (const re of PROTECTED) {
    for (const m of text.matchAll(re)) {
      const s = m.index ?? 0;
      out.push([s, s + m[0].length]);
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Rules (listed in priority order; whitespace runs last)              */
/* ------------------------------------------------------------------ */

const WORDY: [string, string][] = [
  ["in order to", "to"],
  ["due to the fact that", "because"],
  ["owing to the fact that", "because"],
  ["in spite of the fact that", "although"],
  ["at this point in time", "now"],
  ["at the present time", "now"],
  ["in the event that", "if"],
  ["for the purpose of", "for"],
  ["with regard to", "about"],
  ["with respect to", "about"],
  ["a large number of", "many"],
  ["a number of", "several"],
  ["the majority of", "most"],
  ["is able to", "can"],
  ["are able to", "can"],
  ["has the ability to", "can"],
  ["make use of", "use"],
  ["utilize", "use"],
  ["utilizes", "uses"],
  ["utilizing", "using"],
  ["utilized", "used"],
  ["prior to", "before"],
  ["subsequent to", "after"],
  ["on a daily basis", "daily"],
  ["in close proximity to", "near"],
  ["each and every", "every"],
  ["first and foremost", "first"],
  ["as soon as possible", "ASAP"],
];

const CONTRACTIONS: [string, string][] = [
  ["do not", "don't"],
  ["does not", "doesn't"],
  ["did not", "didn't"],
  ["is not", "isn't"],
  ["are not", "aren't"],
  ["was not", "wasn't"],
  ["were not", "weren't"],
  ["cannot", "can't"],
  ["can not", "can't"],
  ["will not", "won't"],
  ["would not", "wouldn't"],
  ["should not", "shouldn't"],
  ["could not", "couldn't"],
  ["have not", "haven't"],
  ["has not", "hasn't"],
  ["it is", "it's"],
  ["that is", "that's"],
  ["you are", "you're"],
  ["they are", "they're"],
  ["we are", "we're"],
];

export const COMPRESS_RULES: CompressRule[] = [
  {
    id: "duplicates",
    label: "Duplicate lines",
    risk: "safe",
    description: "Removes a line that repeats an earlier line word for word.",
    example: "the same instruction twice",
    find(text) {
      const out: Edit[] = [];
      const seen = new Set<string>();
      let pos = 0;
      const lines = text.split("\n");
      lines.forEach((line, i) => {
        const key = line.trim();
        const start = pos;
        const end = pos + line.length;
        pos = end + 1;
        if (key.length < 12) return;
        if (!seen.has(key)) {
          seen.add(key);
          return;
        }
        // Drop the line and one newline so no blank line is left behind.
        if (i < lines.length - 1) out.push({ start, end: end + 1, replacement: "", rule: "duplicates" });
        else out.push({ start: Math.max(0, start - 1), end, replacement: "", rule: "duplicates" });
      });
      return out;
    },
  },
  {
    id: "filler",
    label: "Filler phrases",
    risk: "safe",
    description: "Drops words that add politeness or padding but no instruction.",
    example: "please, kindly, go ahead and",
    find(text) {
      const res = [
        /\b(?:please|kindly)[ \t]+/gi,
        /\bgo[ \t]+ahead[ \t]+and[ \t]+/gi,
        /\b(?:i[ \t]+would[ \t]+like[ \t]+you[ \t]+to|i'd[ \t]+like[ \t]+you[ \t]+to|i[ \t]+want[ \t]+you[ \t]+to|i[ \t]+need[ \t]+you[ \t]+to)[ \t]+/gi,
        /\b(?:it[ \t]+is[ \t]+important[ \t]+to[ \t]+note[ \t]+that|it[ \t]+should[ \t]+be[ \t]+noted[ \t]+that|needless[ \t]+to[ \t]+say),?[ \t]+/gi,
        /\bif[ \t]+you[ \t]+don'?t[ \t]+mind,?[ \t]*/gi,
      ];
      return res.flatMap((re) => fromRegex(text, re, "filler"));
    },
  },
  {
    id: "wordy",
    label: "Wordy phrases",
    risk: "safe",
    description: "Swaps long phrases for shorter ones with the same meaning.",
    example: "in order to → to",
    find(text) {
      return WORDY.flatMap(([from, to]) =>
        fromRegex(
          text,
          new RegExp(`\\b${from.replace(/ /g, "[ \\t]+")}\\b`, "gi"),
          "wordy",
          (m) => (to === "ASAP" ? to : matchCase(m[0], to)),
        ),
      );
    },
  },
  {
    id: "politeness",
    label: "Greetings & thanks",
    risk: "moderate",
    description: "Removes greetings, sign-offs and small talk. May change tone.",
    example: "Hi there, / Thanks in advance!",
    find(text) {
      const res = [
        /^[ \t]*(?:hi|hello|hey)(?:[ \t]+(?:there|team|everyone))?[,!.]?[ \t]*(?:\r?\n(?:[ \t]*\r?\n)*|$)/gim,
        /(?<=(?:^|[.!?])[ \t]*)(?:thanks|thank[ \t]+you)(?:[ \t]+(?:so[ \t]+much|very[ \t]+much|a[ \t]+lot|in[ \t]+advance))?[ \t]*[.!]*[ \t]*$/gim,
        /(?<=(?:^|[.!?])[ \t]*)i[ \t]+hope[ \t]+(?:you(?:'re|[ \t]+are)[ \t]+)?(?:doing[ \t]+)?(?:well|great|good)[^.!?\n]*[.!?]?[ \t]*/gi,
      ];
      return res.flatMap((re) => fromRegex(text, re, "politeness"));
    },
  },
  {
    id: "markdown",
    label: "Markdown & emoji",
    risk: "moderate",
    description: "Strips **bold** markers, divider lines and decorative emoji.",
    example: "**Note** → Note, ---, 🚀",
    find(text) {
      return [
        ...fromRegex(text, /\*\*(?=\S)([^*\n]+?)(?<=\S)\*\*/g, "markdown", (m) => m[1]),
        ...fromRegex(text, /^[ \t]*(?:-{3,}|\*{3,}|_{3,})[ \t]*(?:\r?\n|$)/gm, "markdown"),
        ...fromRegex(text, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]️?[ \t]?/gu, "markdown"),
      ];
    },
  },
  {
    id: "contractions",
    label: "Contractions",
    risk: "risky",
    description:
      "Shortens “do not” to “don't”. Often saves no tokens — check the count — and can soften emphasis.",
    example: "do not → don't",
    find(text) {
      return CONTRACTIONS.flatMap(([from, to]) => {
        const [a, ...rest] = from.split(" ");
        const pattern = `\\b[${a[0].toUpperCase()}${a[0]}]${a.slice(1)}${rest.map((w) => `[ \\t]+${w}`).join("")}\\b`;
        return fromRegex(text, new RegExp(pattern, "g"), "contractions", (m) =>
          /^[A-Z]/.test(m[0]) ? to[0].toUpperCase() + to.slice(1) : to,
        );
      });
    },
  },
  {
    id: "whitespace",
    label: "Extra whitespace",
    risk: "safe",
    description: "Collapses repeated spaces and blank lines, trims line ends.",
    example: "double  spaces, 3+ blank lines",
    find(text) {
      const plain = (re: RegExp, repl: string) =>
        [...text.matchAll(re)].map((m) => ({
          start: m.index ?? 0,
          end: (m.index ?? 0) + m[0].length,
          replacement: repl,
          rule: "whitespace",
        }));
      return [
        ...plain(/(?<=\S)[ \t]{2,}(?=\S)/g, " "),
        ...plain(/[ \t]+$/gm, ""),
        ...plain(/\n[ \t]*\n(?:[ \t]*\n)+/g, "\n\n"),
        ...plain(/^\s+/g, ""),
        ...plain(/\s+$/g, ""),
      ].filter((e) => e.end > e.start);
    },
  },
];

export const RULE_ORDER = COMPRESS_RULES.map((r) => r.id);

export const PRESETS: { id: string; label: string; rules: string[] }[] = [
  { id: "light", label: "Light", rules: ["duplicates", "whitespace"] },
  { id: "balanced", label: "Balanced", rules: ["duplicates", "filler", "wordy", "whitespace"] },
  { id: "aggressive", label: "Aggressive", rules: RULE_ORDER },
];
