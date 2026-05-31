import { useMemo, useState } from "react";
import { Hash, ScanText, Type } from "lucide-react";
import type { TokenizeResponse } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TokenBlocks } from "./TokenBlocks";
import { TokenIdChips } from "./TokenIdChips";
import { cn } from "@/lib/utils";

type Mode = "tokens" | "ids";

interface TokenViewerProps {
  data?: TokenizeResponse;
}

export function TokenViewer({ data }: TokenViewerProps) {
  const [mode, setMode] = useState<Mode>("tokens");

  const tokens = data?.tokens ?? [];
  const tokenIds = data?.token_ids ?? [];
  // Distinguish "not tokenized yet" from "tokenized but empty result".
  const hasResult = !!data;

  const hasTokens = tokens.length > 0;
  const hasIds = tokenIds.length > 0;

  // If the active mode has no data, fall back to whichever does.
  const effectiveMode: Mode = useMemo(() => {
    if (mode === "tokens" && !hasTokens && hasIds) return "ids";
    if (mode === "ids" && !hasIds && hasTokens) return "tokens";
    return mode;
  }, [mode, hasTokens, hasIds]);

  return (
    <Card className="animate-fade-in overflow-hidden">
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Token Viewer</h3>
          <Badge variant="secondary" className="tabular-nums">
            {(effectiveMode === "tokens" ? tokens : tokenIds).length} tokens
          </Badge>
        </div>

        {/* Segmented toggle */}
        <div
          role="tablist"
          aria-label="Token view mode"
          className="inline-flex items-center rounded-lg border bg-muted/50 p-1"
        >
          <SegButton
            active={effectiveMode === "tokens"}
            disabled={!hasTokens}
            onClick={() => setMode("tokens")}
            icon={<Type className="h-3.5 w-3.5" />}
          >
            Tokens
          </SegButton>
          <SegButton
            active={effectiveMode === "ids"}
            disabled={!hasIds}
            onClick={() => setMode("ids")}
            icon={<Hash className="h-3.5 w-3.5" />}
          >
            Token IDs
          </SegButton>
        </div>
      </div>

      <div className="p-4">
        {!hasResult ? (
          <EmptyHint>
            Enter text above and hit{" "}
            <span className="font-medium text-foreground">Tokenize</span> to see
            the token breakdown here.
          </EmptyHint>
        ) : effectiveMode === "tokens" ? (
          hasTokens ? (
            <TokenBlocks tokens={tokens} tokenIds={tokenIds} />
          ) : (
            <EmptyHint>No token strings were returned for this request.</EmptyHint>
          )
        ) : hasIds ? (
          <TokenIdChips tokens={tokens} tokenIds={tokenIds} />
        ) : (
          <EmptyHint>No token IDs were returned for this request.</EmptyHint>
        )}
      </div>
    </Card>
  );
}

function SegButton({
  active,
  disabled,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <ScanText className="h-5 w-5" />
      </span>
      <p className="max-w-sm text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
