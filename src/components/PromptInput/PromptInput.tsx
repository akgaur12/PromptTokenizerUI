import { useLayoutEffect, useRef } from "react";
import { Loader2, Sparkles, Eraser, Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { countWords, formatNumber } from "@/lib/utils";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onTokenize: () => void;
  onTrySample: () => void;
  onClear: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

const MAX_AUTO_HEIGHT = 200; // px — beyond this the textarea scrolls

export function PromptInput({
  value,
  onChange,
  onTokenize,
  onTrySample,
  onClear,
  isLoading,
  disabled,
}: PromptInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-resize to fit content, capped so very large inputs stay usable.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_AUTO_HEIGHT)}px`;
  }, [value]);

  const chars = value.length;
  const words = countWords(value);
  const canSubmit = value.trim().length > 0 && !disabled && !isLoading;

  function handleKeyDown(e: React.KeyboardEvent) {
    // Cmd/Ctrl+Enter submits.
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canSubmit) {
      e.preventDefault();
      onTokenize();
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor="prompt-input" className="text-sm font-medium">
          Input Prompt
        </Label>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>
            <span className="font-medium text-foreground">
              {formatNumber(words)}
            </span>{" "}
            words
          </span>
          <span className="text-muted-foreground/40">•</span>
          <span>
            <span className="font-medium text-foreground">
              {formatNumber(chars)}
            </span>{" "}
            chars
          </span>
        </div>
      </div>

      <Textarea
        id="prompt-input"
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter text to tokenize..."
        spellCheck={false}
        className="resize-none font-mono leading-relaxed"
        style={{ maxHeight: MAX_AUTO_HEIGHT }}
      />

      <div className="flex items-center justify-between gap-3">
        <p className="hidden text-xs text-muted-foreground sm:block">
          Press{" "}
          <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
            ⌘/Ctrl
          </kbd>{" "}
          +{" "}
          <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
            Enter
          </kbd>{" "}
          to tokenize
        </p>
        <div className="ml-auto flex items-center gap-2">
          {value.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              disabled={isLoading}
            >
              <Eraser />
              Clear
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={onTrySample}
              disabled={isLoading}
            >
              <Boxes />
              Try a sample
            </Button>
          )}
          <Button onClick={onTokenize} disabled={!canSubmit} className="min-w-32">
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" />
                Tokenizing…
              </>
            ) : (
              <>
                <Sparkles />
                Tokenize
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
