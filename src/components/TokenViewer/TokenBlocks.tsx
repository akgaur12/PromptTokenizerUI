import { useState } from "react";
import { toast } from "sonner";
import { getTokenColor } from "@/lib/token-colors";
import { copyToClipboard } from "@/lib/utils";
import { HoverTooltip, useHoverTooltip } from "./HoverTooltip";
import { Button } from "@/components/ui/button";

interface TokenBlocksProps {
  tokens: string[];
  tokenIds: number[];
}

// Soft cap so pathologically large inputs don't freeze the DOM.
const INITIAL_CAP = 5000;
// Max height of the scrollable token area before it scrolls internally.
const MAX_AUTO_HEIGHT = 360; // px

export function TokenBlocks({ tokens, tokenIds }: TokenBlocksProps) {
  const [showAll, setShowAll] = useState(false);
  const tip = useHoverTooltip();

  const limit = showAll ? tokens.length : Math.min(tokens.length, INITIAL_CAP);
  const hidden = tokens.length - limit;

  async function handleCopy(token: string) {
    const ok = await copyToClipboard(token);
    if (ok) toast.success("Token copied", { description: truncate(token) });
    else toast.error("Couldn't copy token");
  }

  return (
    <div>
      {/*
        Inline flow that mirrors the original prompt: tokens are laid out as
        continuous text (whitespace and newlines preserved via pre-wrap) with
        each token highlighted by its own pastel background. Adjacent tokens
        use alternating colors, so the original formatting reads as-pasted.
      */}
      <div
        className="overflow-y-auto scrollbar-thin whitespace-pre-wrap break-words rounded-lg border bg-muted/20 p-3 font-mono text-sm leading-loose"
        style={{ maxHeight: MAX_AUTO_HEIGHT }}
      >
        {tokens.slice(0, limit).map((token, i) => {
          const color = getTokenColor(i);
          const id = tokenIds[i];
          const showInfo = {
            token,
            id,
            length: token.length,
            index: i,
          };
          return (
            <span
              key={i}
              role="button"
              tabIndex={0}
              onClick={() => handleCopy(token)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleCopy(token);
                }
              }}
              onMouseEnter={(e) => tip.show(e.currentTarget, showInfo)}
              onMouseLeave={tip.hide}
              onFocus={(e) => tip.show(e.currentTarget, showInfo)}
              onBlur={tip.hide}
              className="cursor-pointer rounded-[2px] py-0.5 outline-none transition-[filter] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-ring [background:var(--bg)] [color:var(--fg)] dark:[background:var(--dbg)] dark:[color:var(--dfg)]"
              style={{
                ["--bg" as string]: color.bg,
                ["--fg" as string]: color.fg,
                ["--dbg" as string]: color.darkBg,
                ["--dfg" as string]: color.darkFg,
              }}
              aria-label={`Token ${i}: ${token}`}
            >
              {token}
            </span>
          );
        })}
      </div>

      {hidden > 0 && (
        <div className="mt-4 flex items-center justify-center gap-3 border-t pt-4 text-sm text-muted-foreground">
          <span>{hidden.toLocaleString()} more tokens hidden</span>
          <Button variant="outline" size="sm" onClick={() => setShowAll(true)}>
            Show all
          </Button>
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Click any token to copy it. Hover to inspect its ID and length.
      </p>

      <HoverTooltip state={tip.state} />
    </div>
  );
}

function truncate(s: string, n = 40) {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}
