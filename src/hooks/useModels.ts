import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getModels } from "@/api/endpoints";
import type { Model } from "@/types";

export interface ModelGroup {
  family: string;
  models: Model[];
}

/** Fetch the full model catalog. Cached aggressively — it rarely changes. */
export function useModels() {
  return useQuery({
    queryKey: ["models"],
    queryFn: getModels,
    staleTime: 1000 * 60 * 30, // 30 minutes
    retry: 1,
  });
}

/**
 * Group a flat model list by `family`, preserving the order in which each
 * family first appears in the API response (so the backend controls ordering).
 */
export function groupModelsByFamily(models: Model[] | undefined): ModelGroup[] {
  if (!models?.length) return [];
  const order: string[] = [];
  const byFamily = new Map<string, Model[]>();

  for (const model of models) {
    const family = model.family?.trim() || "Other";
    if (!byFamily.has(family)) {
      byFamily.set(family, []);
      order.push(family);
    }
    byFamily.get(family)!.push(model);
  }

  return order.map((family) => ({ family, models: byFamily.get(family)! }));
}

/** Convenience hook returning both the raw list and the grouped view. */
export function useGroupedModels() {
  const query = useModels();
  const groups = useMemo(
    () => groupModelsByFamily(query.data),
    [query.data],
  );
  return { ...query, groups };
}
