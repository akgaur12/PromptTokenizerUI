import { useCallback, useState } from "react";
import { createPortal } from "react-dom";

export interface TokenInfo {
  token: string;
  id: number | undefined;
  length: number;
  index: number;
}

export interface TooltipState {
  info: TokenInfo;
  x: number;
  y: number;
}

/**
 * A single shared tooltip driven by hover state. Using one floating element
 * (instead of a Radix tooltip per token) keeps the DOM light enough to render
 * thousands of token blocks without jank.
 */
export function useHoverTooltip() {
  const [state, setState] = useState<TooltipState | null>(null);

  const show = useCallback((anchor: HTMLElement, info: TokenInfo) => {
    const rect = anchor.getBoundingClientRect();
    setState({
      info,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  }, []);

  const hide = useCallback(() => setState(null), []);

  return { state, show, hide };
}

const WHITESPACE_PREVIEW: Record<string, string> = {
  " ": "·",
  "\n": "↵",
  "\t": "⇥",
};

function previewToken(token: string): string {
  if (token === "") return "∅ (empty)";
  return token
    .split("")
    .map((c) => WHITESPACE_PREVIEW[c] ?? c)
    .join("");
}

export function HoverTooltip({ state }: { state: TooltipState | null }) {
  if (!state) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed z-[60] -translate-x-1/2 -translate-y-full pb-2"
      style={{ left: state.x, top: state.y }}
    >
      <div className="min-w-[140px] max-w-xs animate-in fade-in-0 zoom-in-95 rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-muted-foreground">Token</span>
          <span className="max-w-[180px] truncate font-mono font-medium">
            {previewToken(state.info.token)}
          </span>
        </div>
        <div className="mt-1 flex items-baseline justify-between gap-3">
          <span className="text-muted-foreground">ID</span>
          <span className="font-mono font-medium">
            {state.info.id ?? "—"}
          </span>
        </div>
        <div className="mt-1 flex items-baseline justify-between gap-3">
          <span className="text-muted-foreground">Length</span>
          <span className="font-mono font-medium">{state.info.length}</span>
        </div>
        <div className="mt-1 flex items-baseline justify-between gap-3">
          <span className="text-muted-foreground">Index</span>
          <span className="font-mono font-medium">{state.info.index}</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
