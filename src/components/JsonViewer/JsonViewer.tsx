import { useMemo, useState } from "react";
import { Braces, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/utils";
import { highlightJson } from "./highlight";

interface JsonViewerProps {
  data: unknown;
  title?: string;
  defaultOpen?: boolean;
}

export function JsonViewer({
  data,
  title = "Raw API Response",
  defaultOpen = false,
}: JsonViewerProps) {
  const [open, setOpen] = useState(defaultOpen);

  const pretty = useMemo(() => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }, [data]);

  return (
    <Card className="animate-fade-in overflow-hidden">
      <div className="flex items-center justify-between p-4">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="group flex items-center gap-2 text-sm font-semibold outline-none"
        >
          <ChevronRight
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              open && "rotate-90",
            )}
          />
          <Braces className="h-4 w-4 text-primary" />
          {title}
        </button>
        <CopyButton value={pretty} label="Copy" toastMessage="JSON copied" />
      </div>

      {open && (
        <div className="border-t">
          <pre className="max-h-[480px] overflow-auto scrollbar-thin bg-muted/30 p-4 font-mono text-xs leading-relaxed">
            <code>{highlightJson(pretty)}</code>
          </pre>
        </div>
      )}
    </Card>
  );
}
