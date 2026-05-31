import { Gauge } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn, formatNumber } from "@/lib/utils";

interface ContextUsageProps {
  tokenCount: number;
  contextWindow: number | null | undefined;
}

/**
 * Compact "Context Usage" card sized to sit alongside the stat cards.
 * Renders a placeholder when the model has no context window (e.g. raw
 * encodings) so the 5-card grid stays balanced.
 */
export function ContextUsageCard({
  tokenCount,
  contextWindow,
}: ContextUsageProps) {
  const hasWindow = !!contextWindow && contextWindow > 0;
  const pct = hasWindow
    ? Math.min(100, (tokenCount / contextWindow!) * 100)
    : 0;
  const level = pct >= 90 ? "critical" : pct >= 70 ? "warning" : "ok";

  const indicatorClass =
    level === "critical"
      ? "bg-destructive"
      : level === "warning"
        ? "bg-amber-500"
        : "bg-primary";

  return (
    <Card className="animate-scale-in p-3.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Context Usage
        </p>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-500/10">
          <Gauge className="h-3.5 w-3.5 text-violet-500" />
        </span>
      </div>

      {hasWindow ? (
        <>
          <div className="mt-1.5 font-mono text-sm tabular-nums">
            <span className="text-base font-semibold">
              {formatNumber(tokenCount)}
            </span>
            <span className="text-muted-foreground">
              {" "}
              / {formatNumber(contextWindow)}
            </span>
          </div>
          <Progress
            value={pct}
            className="mt-2 h-1.5"
            indicatorClassName={indicatorClass}
          />
          <p
            className={cn(
              "mt-1 text-[11px] font-medium",
              level === "critical"
                ? "text-destructive"
                : level === "warning"
                  ? "text-amber-500"
                  : "text-muted-foreground",
            )}
          >
            {pct.toFixed(pct < 1 ? 2 : 1)}% used
          </p>
        </>
      ) : (
        <div className="mt-1.5">
          <span className="text-sm font-medium text-muted-foreground">
            No context window
          </span>
        </div>
      )}
    </Card>
  );
}
