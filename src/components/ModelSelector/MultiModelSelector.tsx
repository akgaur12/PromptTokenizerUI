import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { useGroupedModels } from "@/hooks/useModels";
import type { Model } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface MultiModelSelectorProps {
  /** Currently selected model ids. */
  value: string[];
  onChange: (ids: string[]) => void;
  /** Optional cap on how many models can be selected at once. */
  max?: number;
}

/**
 * Multi-select model picker for the Compare page. Mirrors `ModelSelector` but
 * toggles ids in an array and keeps the popover open so several models can be
 * chosen in one go. Selected models are surfaced as removable chips below.
 */
export function MultiModelSelector({
  value,
  onChange,
  max,
}: MultiModelSelectorProps) {
  const { groups, data, isLoading, isError, refetch } = useGroupedModels();
  const [open, setOpen] = useState(false);

  const selectedModels = useMemo(
    () =>
      value
        .map((id) => data?.find((m) => m.id === id))
        .filter((m): m is Model => Boolean(m)),
    [data, value],
  );

  const atLimit = max !== undefined && value.length >= max;

  function toggle(id: string) {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else if (!atLimit) {
      onChange([...value, id]);
    }
  }

  if (isLoading) {
    return <Skeleton className="h-9 w-full rounded-md" />;
  }

  if (isError) {
    return (
      <div className="flex items-center justify-between rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm">
        <span className="text-destructive">Couldn't load models.</span>
        <Button size="sm" variant="outline" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select models to compare"
            className="w-full justify-between font-normal"
          >
            <span className={cn(!value.length && "text-muted-foreground")}>
              {value.length
                ? `${value.length} model${value.length > 1 ? "s" : ""} selected`
                : "Select models…"}
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder="Search models…" />
            <CommandList>
              <CommandEmpty>No models found.</CommandEmpty>
              {groups.map((group) => (
                <CommandGroup key={group.family} heading={group.family}>
                  {group.models.map((model) => {
                    const checked = value.includes(model.id);
                    const disabled = !checked && atLimit;
                    return (
                      <CommandItem
                        key={model.id}
                        value={`${model.name} ${model.id} ${group.family}`}
                        disabled={disabled}
                        onSelect={() => toggle(model.id)}
                        className={cn(
                          "items-center justify-between",
                          disabled && "opacity-40",
                        )}
                      >
                        <span className="truncate">{model.name}</span>
                        <Check
                          className={cn(
                            "h-4 w-4 shrink-0 text-primary",
                            checked ? "opacity-100" : "opacity-0",
                          )}
                        />
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedModels.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedModels.map((model) => (
            <Badge
              key={model.id}
              variant="secondary"
              className="gap-1 pr-1"
            >
              {model.name}
              <button
                type="button"
                aria-label={`Remove ${model.name}`}
                onClick={() => toggle(model.id)}
                className="rounded-sm p-0.5 transition-colors hover:bg-foreground/10"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {max !== undefined && (
        <p className="text-xs text-muted-foreground">
          {atLimit
            ? `Maximum of ${max} models selected.`
            : `Pick up to ${max} models.`}
        </p>
      )}
    </div>
  );
}
