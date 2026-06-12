import { useMemo } from "react";
import { AlertCircle, ArrowRight, GitCompare, Trophy } from "lucide-react";
import type { ComparePromptsResponse, Model } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCost, formatNumber } from "@/lib/utils";

interface ComparePromptsResultsProps {
  data?: ComparePromptsResponse;
  isLoading: boolean;
  /** Model catalog, used to show a friendly name instead of the raw id. */
  models?: Model[];
  /** Optional labels for each prompt column (defaults to "Prompt A/B/…"). */
  labels?: string[];
}

const DEFAULT_LABELS = ["Prompt A", "Prompt B", "Prompt C", "Prompt D"];

/**
 * Compares how many tokens the *same model* assigns to two (or more) different
 * prompts — the mirror of {@link CompareResults}, which holds the text fixed
 * and varies the model. Each prompt gets a column with its token count, cost,
 * and word count; the leanest prompt is flagged and the others show how many
 * more tokens (and what %) they cost relative to it.
 */
export function ComparePromptsResults({
  data,
  isLoading,
  models,
  labels = DEFAULT_LABELS,
}: ComparePromptsResultsProps) {
  const { okCount, minTokens } = useMemo(() => {
    const counts = (data?.results ?? [])
      .filter((r) => typeof r.token_count === "number" && !r.error)
      .map((r) => r.token_count as number);
    return {
      okCount: counts.length,
      minTokens: counts.length ? Math.min(...counts) : 0,
    };
  }, [data]);

  if (isLoading && !data) {
    return (
      <Card className="space-y-4 p-5 sm:p-6">
        <Skeleton className="h-5 w-40" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      </Card>
    );
  }

  if (!data || !data.results.length) {
    return (
      <Card className="flex flex-col items-center justify-center gap-2 p-10 text-center">
        <GitCompare className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          Pick a model and enter two prompts to compare their token counts
          side&#8209;by&#8209;side.
        </p>
      </Card>
    );
  }

  const modelName =
    models?.find((m) => m.id === data.model)?.name ?? data.model;

  return (
    <Card className="overflow-hidden">
      {/* Header / summary */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/30 px-5 py-3 sm:px-6">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <GitCompare className="h-4 w-4 text-primary" />
          Prompt comparison
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{modelName}</span>
          {data.resolved_tokenizer && (
            <Badge variant="muted" className="font-mono">
              {data.resolved_tokenizer}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-px bg-border sm:grid-cols-2">
        {data.results.map((r) => {
          const ok = typeof r.token_count === "number" && !r.error;
          const count = ok ? (r.token_count as number) : null;
          const isBest = ok && count === minTokens && okCount > 1;
          const deltaTokens =
            ok && minTokens > 0 ? (count as number) - minTokens : 0;
          const deltaPct =
            ok && minTokens > 0 ? (deltaTokens / minTokens) * 100 : 0;

          return (
            <div
              key={r.index}
              className={cn(
                "flex flex-col gap-3 bg-card p-5 sm:p-6",
                isBest && "bg-success/5",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {labels[r.index] ?? `Prompt ${r.index + 1}`}
                </span>
                {isBest && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                    <Trophy className="h-3.5 w-3.5" />
                    fewest tokens
                  </span>
                )}
              </div>

              {ok ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-semibold tabular-nums">
                      {formatNumber(count as number)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      tokens
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {typeof r.estimated_input_cost === "number" && (
                      <span>
                        <span className="font-medium text-foreground">
                          {formatCost(
                            r.estimated_input_cost,
                            r.cost_currency ?? "USD",
                          )}
                        </span>{" "}
                        est. cost
                      </span>
                    )}
                    {typeof r.word_count === "number" && (
                      <span>
                        <span className="font-medium text-foreground">
                          {formatNumber(r.word_count)}
                        </span>{" "}
                        words
                      </span>
                    )}
                    <span>
                      <span className="font-medium text-foreground">
                        {formatNumber(r.text_length)}
                      </span>{" "}
                      chars
                    </span>
                  </div>

                  {okCount > 1 && (
                    <div className="mt-auto pt-1 text-xs">
                      {isBest ? (
                        <span className="font-medium text-success">
                          Most efficient prompt
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                          +{formatNumber(deltaTokens)} tokens
                          <ArrowRight className="h-3 w-3" />+
                          {formatNumber(Math.round(deltaPct))}%
                        </span>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div
                  className="flex items-center gap-1.5 text-sm font-medium text-destructive"
                  title={r.error ?? undefined}
                >
                  <AlertCircle className="h-4 w-4" />
                  {r.error ?? "Failed to tokenize"}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <p className="border-t bg-muted/30 px-5 py-2.5 text-xs text-muted-foreground sm:px-6">
        Both prompts are tokenized with{" "}
        <span className="font-medium text-foreground">{modelName}</span>. The
        prompt with the{" "}
        <span className="font-medium text-success">fewest tokens</span> is the
        cheapest to send; the other shows how many more tokens it costs.
      </p>
    </Card>
  );
}
