import { useMemo } from "react";
import { Coins, Repeat } from "lucide-react";
import type { TokenizeResponse } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTokenColor } from "@/lib/token-colors";
import { renderVisibleWhitespace } from "@/lib/utils";

interface TokenTablesProps {
  data?: TokenizeResponse;
}

/** A token piece of a word, paired with its original index (drives its color). */
interface WordSegment {
  token: string;
  index: number;
}

interface ExpensiveWord {
  word: string;
  tokens: number;
  segments: WordSegment[];
}

interface FrequentToken {
  token: string;
  id?: number;
  frequency: number;
  /** Index of the first occurrence — drives the token's color. */
  index: number;
}

const TOP_N = 10;

/**
 * Two analytics tables shown beneath the Token Viewer:
 *  - Top 10 most "expensive" words (those that fragment into the most tokens).
 *  - Top 10 most frequently repeated tokens.
 *
 * Both are derived purely from the tokenize response, so they appear only once
 * a request has returned token strings.
 */
export function TokenTables({ data }: TokenTablesProps) {
  const tokens = data?.tokens ?? [];
  const tokenIds = data?.token_ids ?? [];

  const expensiveWords = useMemo(
    () => computeExpensiveWords(tokens),
    [tokens],
  );
  const frequentTokens = useMemo(
    () => computeFrequentTokens(tokens, tokenIds),
    [tokens, tokenIds],
  );

  // Nothing to analyze until we have token strings back from the API.
  if (tokens.length === 0) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="animate-fade-in overflow-hidden">
        <div className="flex items-center gap-2 border-b p-4">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-500/10">
            <Coins className="h-3.5 w-3.5 text-amber-500" />
          </span>
          <h3 className="text-sm font-semibold">Top 10 Most Expensive Words</h3>
        </div>
        <Table
          columns={["Word", "Tokens"]}
          rows={expensiveWords.map((w) => [
            <ColoredWord segments={w.segments} />,
            <Badge variant="secondary" className="tabular-nums">
              {w.tokens}
            </Badge>,
          ])}
          empty="No multi-token words in this prompt."
        />
      </Card>

      <Card className="animate-fade-in overflow-hidden">
        <div className="flex items-center gap-2 border-b p-4">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-sky-500/10">
            <Repeat className="h-3.5 w-3.5 text-sky-500" />
          </span>
          <h3 className="text-sm font-semibold">Top 10 Most Frequent Tokens</h3>
        </div>
        <Table
          columns={["Token", "Token ID", "Frequency"]}
          rows={frequentTokens.map((t) => [
            <ColoredWord segments={[{ token: t.token, index: t.index }]} />,
            <span className="font-mono tabular-nums text-muted-foreground">
              {t.id ?? "—"}
            </span>,
            <Badge variant="secondary" className="tabular-nums">
              {t.frequency}
            </Badge>,
          ])}
          empty="No tokens to display."
        />
      </Card>
    </div>
  );
}

/**
 * Render a word as its constituent token pieces, each tinted with the same
 * pastel palette (and original token index) used by the Token Viewer, so the
 * fragmentation is visible at a glance.
 */
function ColoredWord({ segments }: { segments: WordSegment[] }) {
  return (
    <span className="inline-flex flex-wrap items-center font-mono leading-loose">
      {segments.map((seg, i) => {
        const color = getTokenColor(seg.index);
        return (
          <span
            key={i}
            className="rounded-[2px] py-0.5 [background:var(--bg)] [color:var(--fg)] dark:[background:var(--dbg)] dark:[color:var(--dfg)]"
            style={{
              ["--bg" as string]: color.bg,
              ["--fg" as string]: color.fg,
              ["--dbg" as string]: color.darkBg,
              ["--dfg" as string]: color.darkFg,
            }}
          >
            {renderVisibleWhitespace(seg.token)}
          </span>
        );
      })}
    </span>
  );
}

/** A simple, consistently styled table used by both insight panels. */
function Table({
  columns,
  rows,
  empty,
}: {
  columns: string[];
  rows: React.ReactNode[][];
  empty: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-muted-foreground">
        {empty}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            {columns.map((c, i) => (
              <th
                key={c}
                className={cellPad(
                  i,
                  columns.length,
                  "text-[11px] font-medium uppercase tracking-wider text-muted-foreground",
                )}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, r) => (
            <tr
              key={r}
              className="border-b last:border-0 transition-colors hover:bg-muted/40"
            >
              {cells.map((cell, c) => (
                <td key={c} className={cellPad(c, columns.length, "align-middle")}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Column padding: a touch more breathing room on the outer edges. */
function cellPad(index: number, total: number, extra: string): string {
  const left = index === 0 ? "pl-4" : "pl-3";
  const right = index === total - 1 ? "pr-4" : "pr-3";
  return `${left} ${right} py-2.5 ${extra}`;
}

/**
 * Group tokens back into whitespace-delimited words and count how many tokens
 * each word costs. Words are matched against the reconstructed text so the
 * mapping stays accurate even when a single token spans punctuation.
 */
function computeExpensiveWords(tokens: string[]): ExpensiveWord[] {
  if (tokens.length === 0) return [];

  const full = tokens.join("");

  // Map every character index to the word it belongs to (-1 for whitespace).
  const charWord = new Int32Array(full.length).fill(-1);
  const words: string[] = [];
  const wordRe = /\S+/g;
  let match: RegExpExecArray | null;
  while ((match = wordRe.exec(full)) !== null) {
    const wordIndex = words.length;
    for (let i = match.index; i < match.index + match[0].length; i++) {
      charWord[i] = wordIndex;
    }
    words.push(match[0]);
  }

  // Collect the ordered token pieces touching each word (drives both the cost
  // and the colored rendering). A token is recorded against every word it
  // overlaps, in token order.
  const wordSegments: WordSegment[][] = words.map(() => []);
  let pos = 0;
  tokens.forEach((token, index) => {
    const start = pos;
    const end = pos + token.length;
    pos = end;
    const touched = new Set<number>();
    for (let i = start; i < end; i++) {
      const w = charWord[i];
      if (w >= 0) touched.add(w);
    }
    for (const w of touched) wordSegments[w].push({ token, index });
  });

  // Collapse duplicate words, keeping the occurrence with the highest cost.
  const byWord = new Map<string, ExpensiveWord>();
  words.forEach((word, i) => {
    const count = wordSegments[i].length;
    const prev = byWord.get(word);
    if (!prev || count > prev.tokens) {
      byWord.set(word, { word, tokens: count, segments: wordSegments[i] });
    }
  });

  return [...byWord.values()]
    .filter((w) => w.tokens > 1)
    .sort((a, b) => b.tokens - a.tokens || b.word.length - a.word.length)
    .slice(0, TOP_N);
}

/** Tally how often each token repeats, keyed by its token id when available. */
function computeFrequentTokens(
  tokens: string[],
  tokenIds: number[],
): FrequentToken[] {
  const byKey = new Map<string, FrequentToken>();
  tokens.forEach((token, i) => {
    const id = tokenIds[i];
    const key = id !== undefined ? `id:${id}` : `tok:${token}`;
    const existing = byKey.get(key);
    if (existing) existing.frequency++;
    else byKey.set(key, { token, id, frequency: 1, index: i });
  });

  return [...byKey.values()]
    .filter((t) => t.frequency > 1)
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, TOP_N);
}
