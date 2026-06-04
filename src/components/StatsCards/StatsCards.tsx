import { Coins, Hash, Type, WholeWord } from "lucide-react";
import type { TokenizeResponse } from "@/types";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import { cn, formatCost, formatNumber } from "@/lib/utils";
import { ContextUsageCard } from "@/components/ContextUsage/ContextUsage";

interface StatsCardsProps {
  data: TokenizeResponse | undefined;
  isLoading: boolean;
  contextWindow?: number | null;
}

export function StatsCards({ data, isLoading, contextWindow }: StatsCardsProps) {
  if (isLoading && !data) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="p-3.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-2.5 h-6 w-16" />
          </Card>
        ))}
      </div>
    );
  }

  const currency = data?.cost_currency ?? "USD";
  const costAvailable =
    data?.estimated_input_cost !== null &&
    data?.estimated_input_cost !== undefined;
  // Only animate when there's a result — clearing should snap to zero.
  const animate = !!data;

  // Tokens-per-word "efficiency" ratio — how many tokens each word costs the
  // model. Only meaningful once we have a real token count from the backend.
  const tokensPerWord =
    data && data.word_count > 0 ? data.token_count / data.word_count : 0;

  // Word density — what share of the tokens are whole words. The inverse of the
  // ratio above, shown as a percentage (e.g. 31% means words fragment heavily).
  const wordDensity =
    data && data.token_count > 0
      ? (data.word_count / data.token_count) * 100
      : null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      <NumberStat
        label="Total Tokens"
        value={data?.token_count ?? 0}
        animate={animate}
        icon={Hash}
        accent="text-primary"
        tint="bg-primary/10"
      />
      <NumberStat
        label="Total Words"
        value={data?.word_count ?? 0}
        animate={animate}
        icon={WholeWord}
        accent="text-emerald-500"
        tint="bg-emerald-500/10"
      />
      <NumberStat
        label="Total Characters"
        value={data?.character_count ?? 0}
        animate={animate}
        icon={Type}
        accent="text-sky-500"
        tint="bg-sky-500/10"
      />
      <RatioStat
        label="Tokens / Word"
        value={tokensPerWord}
        animate={animate}
        density={wordDensity}
      />
      <CostStat
        label="Estimated Input Cost"
        value={data?.estimated_input_cost ?? null}
        animate={animate}
        currency={currency}
        available={costAvailable}
      />
      <ContextUsageCard
        tokenCount={data?.token_count ?? 0}
        contextWindow={contextWindow}
      />
    </div>
  );
}

interface BaseStatProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  tint: string;
}

/** A λ (lambda) glyph for the tokens-per-word ratio card. */
function TokensPerWordIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <text
        x="12"
        y="13"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="24"
        fontWeight="700"
        fill="currentColor"
      >
        λ
      </text>
    </svg>
  );
}

function StatShell({
  label,
  icon: Icon,
  accent,
  tint,
  children,
  sub,
}: BaseStatProps & { children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <Card className="animate-scale-in p-3.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <span
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
            tint,
          )}
        >
          <Icon className={cn("h-3.5 w-3.5", accent)} />
        </span>
      </div>
      <div className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight">
        {children}
      </div>
      {sub}
    </Card>
  );
}

function NumberStat({
  value,
  animate,
  sub,
  ...rest
}: BaseStatProps & {
  value: number;
  animate: boolean;
  sub?: React.ReactNode;
}) {
  const animated = useAnimatedNumber(value, animate);
  return (
    <StatShell {...rest} sub={sub}>
      {formatNumber(Math.round(animated))}
    </StatShell>
  );
}

function RatioStat({
  label,
  value,
  animate,
  density,
}: {
  label: string;
  value: number;
  animate: boolean;
  density: number | null;
}) {
  const animated = useAnimatedNumber(value, animate);
  const available = value > 0;
  return (
    <StatShell
      label={label}
      icon={TokensPerWordIcon}
      accent="text-violet-500"
      tint="bg-violet-500/10"
      sub={
        available && density !== null ? (
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {density.toFixed(0)}% word density
          </p>
        ) : null
      }
    >
      {available ? (
        animated.toFixed(2)
      ) : (
        <span className="text-sm font-medium text-muted-foreground">—</span>
      )}
    </StatShell>
  );
}

function CostStat({
  label,
  value,
  animate,
  currency,
  available,
}: {
  label: string;
  value: number | null;
  animate: boolean;
  currency: string;
  available: boolean;
}) {
  const animated = useAnimatedNumber(value ?? 0, animate);
  return (
    <StatShell
      label={label}
      icon={Coins}
      accent="text-amber-500"
      tint="bg-amber-500/10"
      sub={
        available ? (
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {currency}
          </p>
        ) : null
      }
    >
      {available ? (
        <span className="text-xl">{formatCost(animated, currency)}</span>
      ) : (
        <span className="text-sm font-medium text-muted-foreground">
          Pricing unavailable
        </span>
      )}
    </StatShell>
  );
}
