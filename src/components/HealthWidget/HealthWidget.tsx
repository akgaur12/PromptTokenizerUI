import { Activity, CircleCheck, CircleX, Loader2 } from "lucide-react";
import { useHealth, readMemory, isHealthy } from "@/hooks/useHealth";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatMb } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function HealthWidget() {
  const { data, isLoading, isError } = useHealth();
  const healthy = isHealthy(data) && !isError;
  const { rssMb, vmsMb } = readMemory(data);

  const dotClass = isLoading
    ? "bg-muted-foreground"
    : healthy
      ? "bg-success"
      : "bg-destructive";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          aria-label="Service status"
        >
          <span className="relative flex h-2 w-2">
            {healthy && !isLoading && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
            )}
            <span
              className={cn(
                "relative inline-flex h-2 w-2 rounded-full",
                dotClass,
              )}
            />
          </span>
          <span className="hidden sm:inline">
            {isLoading ? "Checking…" : healthy ? "Healthy" : "Offline"}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Activity className="h-4 w-4 text-primary" />
            Service Status
          </div>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : healthy ? (
            <Badge variant="success" className="gap-1">
              <CircleCheck className="h-3 w-3" />
              {data?.status ?? "healthy"}
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1">
              <CircleX className="h-3 w-3" />
              {isError ? "unreachable" : (data?.status ?? "down")}
            </Badge>
          )}
        </div>

        <Separator className="my-3" />

        <dl className="space-y-2.5 text-sm">
          <Row label="Version" value={data?.version ?? "—"} mono />
          <Row label="RSS Memory" value={formatMb(rssMb)} mono />
          <Row label="VMS Memory" value={formatMb(vmsMb)} mono />
        </dl>

        {isError && (
          <p className="mt-3 text-xs text-muted-foreground">
            Couldn't reach <code className="font-mono">/health</code>. The API
            may be offline.
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("font-medium", mono && "font-mono text-xs")}>
        {value}
      </dd>
    </div>
  );
}
