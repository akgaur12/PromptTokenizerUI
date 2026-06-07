import { useMemo } from "react";
import { AlertCircle, Layers, Table2 } from "lucide-react";
import type { CompareResponse, Model } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatNumber } from "@/lib/utils";

interface CompareResultsProps {
  data?: CompareResponse;
  isLoading: boolean;
  /** Model catalog, used to show friendly names instead of raw ids. */
  models?: Model[];
}

interface Row {
  model: string;
  name: string;
  tokenizer: string | null;
  tokenCount: number | null;
  error: string | null;
  /** 1-based position among successful rows; null for failed ones. */
  rank: number | null;
  /** Percentage more tokens than the most efficient model (0 for the best). */
  deltaPct: number | null;
  isBest: boolean;
}

/**
 * Side-by-side comparison of how many tokens the same text costs across
 * several models, shown as a ranked table. Successful rows are ordered by
 * token count (ascending, most efficient first) and the cheapest is flagged as
 * "best"; failed models sink to the bottom so one bad model doesn't hide the
 * rest.
 */
export function CompareResults({
  data,
  isLoading,
  models,
}: CompareResultsProps) {
  const rows = useMemo<Row[]>(() => {
    if (!data?.results?.length) return [];

    const nameOf = (id: string) =>
      models?.find((m) => m.id === id)?.name ?? id;

    const counts = data.results
      .filter((r) => typeof r.token_count === "number" && !r.error)
      .map((r) => r.token_count as number);
    const min = counts.length ? Math.min(...counts) : 0;
    const hasSpread = counts.length > 1;

    const sorted = [...data.results].sort((a, b) => {
      const av = typeof a.token_count === "number" && !a.error ? a.token_count : Infinity;
      const bv = typeof b.token_count === "number" && !b.error ? b.token_count : Infinity;
      return av - bv;
    });

    let rank = 0;
    return sorted.map((r) => {
      const ok = typeof r.token_count === "number" && !r.error;
      const count = ok ? (r.token_count as number) : null;
      if (ok) rank += 1;
      const deltaPct =
        ok && min > 0 ? ((count as number) - min) / min * 100 : ok ? 0 : null;
      return {
        model: r.model,
        name: nameOf(r.model),
        tokenizer: r.resolved_tokenizer ?? null,
        tokenCount: count,
        error: r.error ?? null,
        rank: ok ? rank : null,
        deltaPct,
        isBest: hasSpread && ok && count === min,
      };
    });
  }, [data, models]);

  if (isLoading && !data) {
    return (
      <Card className="space-y-4 p-5 sm:p-6">
        <Skeleton className="h-5 w-40" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </Card>
    );
  }

  if (!data || !rows.length) {
    return (
      <Card className="flex flex-col items-center justify-center gap-2 p-10 text-center">
        <Layers className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          Pick a few models and enter some text to compare token counts
          side&#8209;by&#8209;side.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Header / summary */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/30 px-5 py-3 sm:px-6">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Table2 className="h-4 w-4 text-primary" />
          Token comparison
        </div>
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">
            {formatNumber(rows.length)}
          </span>{" "}
          model{rows.length > 1 ? "s" : ""}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="w-12 px-3 py-2.5 text-center font-medium sm:px-4">
                #
              </th>
              <th className="px-3 py-2.5 text-left font-medium sm:px-4">
                Model
              </th>
              <th className="hidden px-3 py-2.5 text-left font-medium sm:table-cell sm:px-4">
                Tokenizer
              </th>
              <th className="px-3 py-2.5 text-right font-medium sm:px-4">
                Tokens
              </th>
              <th className="px-3 py-2.5 text-right font-medium sm:px-4">
                vs best
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr
                key={row.model}
                className={cn(
                  "transition-colors hover:bg-muted/40",
                  row.isBest && "bg-success/5",
                )}
              >
                <td className="px-3 py-3 text-center tabular-nums text-muted-foreground sm:px-4">
                  {row.rank ?? "—"}
                </td>
                <td className="px-3 py-3 sm:px-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{row.name}</span>
                    {row.isBest && <Badge variant="success">Best</Badge>}
                  </div>
                  {/* Tokenizer shown inline on mobile, where its column is hidden. */}
                  {row.tokenizer && (
                    <span className="mt-0.5 block font-mono text-xs text-muted-foreground sm:hidden">
                      {row.tokenizer}
                    </span>
                  )}
                </td>
                <td className="hidden px-3 py-3 sm:table-cell sm:px-4">
                  {row.tokenizer ? (
                    <Badge variant="muted" className="font-mono">
                      {row.tokenizer}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-3 py-3 text-right sm:px-4">
                  {row.tokenCount !== null ? (
                    <span className="text-base font-semibold tabular-nums">
                      {formatNumber(row.tokenCount)}
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 text-xs font-medium text-destructive"
                      title={row.error ?? undefined}
                    >
                      <AlertCircle className="h-3.5 w-3.5" />
                      Failed
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 text-right tabular-nums sm:px-4">
                  {row.tokenCount === null ? (
                    <span className="text-muted-foreground">—</span>
                  ) : row.deltaPct === 0 ? (
                    <span className="text-xs font-medium text-success">best</span>
                  ) : (
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                      +{formatNumber(Math.round(row.deltaPct as number))}%
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend explaining the "vs best" column. */}
      <p className="border-t bg-muted/30 px-5 py-2.5 text-xs text-muted-foreground sm:px-6">
        <span className="font-medium text-foreground">vs best:</span> the winner
        shows <span className="font-medium text-success">best</span>; every other
        model shows{" "}
        <span className="font-medium text-amber-600 dark:text-amber-400">
          +X%
        </span>{" "}
        more tokens relative to the fewest.
      </p>
    </Card>
  );
}
