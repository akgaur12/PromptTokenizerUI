import { useQuery } from "@tanstack/react-query";
import { getHealth } from "@/api/endpoints";
import type { HealthResponse } from "@/types";

/** Poll the service health endpoint every hour. */
export function useHealth() {
  return useQuery<HealthResponse>({
    queryKey: ["health"],
    queryFn: getHealth,
    refetchInterval: 3_600_000,
    refetchOnWindowFocus: true,
    retry: 1,
    staleTime: 10_000,
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
