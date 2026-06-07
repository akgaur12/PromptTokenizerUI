import { useState } from "react";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/utils";
import { HoverTooltip, useHoverTooltip } from "./HoverTooltip";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";

interface TokenIdChipsProps {
  tokens: string[];
  tokenIds: number[];
}

const INITIAL_CAP = 5000;
// Max height of the scrollable chip area before it scrolls internally.
const MAX_AUTO_HEIGHT = 300; // px

export function TokenIdChips({ tokens, tokenIds }: TokenIdChipsProps) {
  const [showAll, setShowAll] = useState(false);
  const tip = useHoverTooltip();

  const limit = showAll
    ? tokenIds.length
    : Math.min(tokenIds.length, INITIAL_CAP);
  const hidden = tokenIds.length - limit;

  async function handleCopy(id: number) {
    const ok = await copyToClipboard(String(id));
    if (ok) toast.success(`Copied ${id}`);
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <CopyButton
          value={JSON.stringify(tokenIds)}
          label="Copy all IDs"
          toastMessage="Token IDs copied"
        />
      </div>

      <div
        className="flex flex-wrap gap-1.5 overflow-y-auto scrollbar-thin rounded-lg border bg-muted/20 p-3 font-mono text-xs"
        style={{ maxHeight: MAX_AUTO_HEIGHT }}
      >
        {tokenIds.slice(0, limit).map((id, i) => {
          const token = tokens[i];
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleCopy(id)}
              onMouseEnter={(e) =>
                tip.show(e.currentTarget, {
                  token: token ?? "",
                  id,
                  length: token?.length ?? 0,
                  index: i,
                })
              }
              onMouseLeave={tip.hide}
              onFocus={(e) =>
                tip.show(e.currentTarget, {
                  token: token ?? "",
                  id,
                  length: token?.length ?? 0,
                  index: i,
                })
              }
              onBlur={tip.hide}
              className="rounded-md border bg-muted/60 px-2 py-1 tabular-nums text-foreground outline-none transition-colors hover:border-primary/50 hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Token ID ${id}${token ? ` (${token})` : ""}`}
            >
              {id}
            </button>
          );
        })}
      </div>

      {hidden > 0 && (
        <div className="mt-4 flex items-center justify-center gap-3 border-t pt-4 text-sm text-muted-foreground">
          <span>{hidden.toLocaleString()} more IDs hidden</span>
          <Button variant="outline" size="sm" onClick={() => setShowAll(true)}>
            Show all
          </Button>
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Click any ID to copy it. Hover to see the original token.
      </p>

      <HoverTooltip state={tip.state} />
    </div>
  );
}
