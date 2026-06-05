import { useQuery } from "@tanstack/react-query";
import { getHealth } from "@/api/endpoints";
import type { HealthResponse } from "@/types";

/**
 * Poll the service health endpoint every 10 minutes to keep the backend
 * warm so it doesn't drop to an idle/sleep state. `refetchIntervalInBackground`
 * keeps the keep-alive ping firing even when the tab isn't focused.
 */
export function useHealth() {
  return useQuery<HealthResponse>({
    queryKey: ["health"],
    queryFn: getHealth,
    refetchInterval: 600_000, // 10 minutes (600,000ms)
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    retry: 1,
    staleTime: 10_000, // 10 seconds (10,000ms)
  });
}

/** Read RSS/VMS memory (reported in megabytes) from the health payload. */
export function readMemory(health: HealthResponse | undefined) {
  return {
    rssMb: health?.memory?.rss_mb,
    vmsMb: health?.memory?.vms_mb,
  };
}

export function isHealthy(health: HealthResponse | undefined): boolean {
  if (!health?.status) return false;
  return ["ok", "healthy", "up", "pass"].includes(
    health.status.toLowerCase(),
  );
}
