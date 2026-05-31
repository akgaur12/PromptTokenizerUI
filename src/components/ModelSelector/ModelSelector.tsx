import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { useGroupedModels } from "@/hooks/useModels";
import type { Model } from "@/types";
import { Button } from "@/components/ui/button";
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

interface ModelSelectorProps {
  value: string | undefined;
  onChange: (model: Model) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const { groups, data, isLoading, isError, refetch } = useGroupedModels();
  const [open, setOpen] = useState(false);

  const selected = useMemo(
    () => data?.find((m) => m.id === value),
    [data, value],
  );

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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select a model"
          className="w-full justify-between font-normal"
        >
          <span className={cn(!selected && "text-muted-foreground")}>
            {selected ? selected.name : "Select a model…"}
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
                {group.models.map((model) => (
                  <CommandItem
                    key={model.id}
                    // value drives cmdk's fuzzy search — include id + name.
                    value={`${model.name} ${model.id} ${group.family}`}
                    onSelect={() => {
                      onChange(model);
                      setOpen(false);
                    }}
                    className="items-center justify-between"
                  >
                    <span className="truncate">{model.name}</span>
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0 text-primary",
                        model.id === value ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
