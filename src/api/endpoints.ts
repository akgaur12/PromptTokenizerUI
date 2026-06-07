import { apiClient, API_BASE_URL, API_PREFIX } from "./client";
import type {
  CompareRequest,
  CompareResponse,
  HealthResponse,
  Model,
  ModelsResponse,
  RawModel,
  TokenizeRequest,
  TokenizeResponse,
} from "@/types";

/** GET /health */
export async function getHealth(): Promise<HealthResponse> {
  const { data } = await apiClient.get<HealthResponse>("/health");
  return data;
}

/**
 * Fire-and-forget ping to /health to wake a sleeping Render free-tier dyno as
 * early as possible (before React mounts). Errors are swallowed — this only
 * exists to start the cold-start spin-up sooner; the HealthWidget reflects the
 * real status once the app renders.
 */
export function prewarm(): void {
  try {
    void fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      keepalive: true,
      cache: "no-store",
    }).catch(() => {});
  } catch {
    // Ignore — pre-warm is best-effort.
  }
}

/**
 * Map the backend's raw model entry onto the normalized shape the UI uses.
 * The API exposes `label` / `group` / `tokenizer_ref`; we surface those as
 * `name` / `family` / `encoding`.
 */
export function normalizeModel(raw: RawModel): Model {
  return {
    id: raw.id,
    name: raw.label?.trim() || raw.id,
    family: raw.group?.trim() || "Other",
    description: raw.description,
    encoding: raw.tokenizer_ref,
    provider: raw.provider,
    context_window: raw.context_window,
    deprecated:
      raw.deprecated === true ||
      raw.status?.toLowerCase() === "deprecated" ||
      raw.status?.toLowerCase() === "legacy",
    status: raw.status,
  };
}

/** GET /api/v1/models -> { items: RawModel[] } */
export async function getModels(): Promise<Model[]> {
  const { data } = await apiClient.get<ModelsResponse>(`${API_PREFIX}/models`);
  // Tolerate either { items: [...] } or a bare array.
  const items = Array.isArray(data) ? (data as RawModel[]) : (data?.items ?? []);
  return items.map(normalizeModel);
}

/** GET /api/v1/models/{id} */
export async function getModel(id: string): Promise<Model> {
  const { data } = await apiClient.get<RawModel>(
    `${API_PREFIX}/models/${encodeURIComponent(id)}`,
  );
  return normalizeModel(data);
}

/** POST /api/v1/tokenize */
export async function tokenize(
  body: TokenizeRequest,
): Promise<TokenizeResponse> {
  const { data } = await apiClient.post<TokenizeResponse>(
    `${API_PREFIX}/tokenize`,
    body,
  );
  return data;
}

/** POST /api/v1/compare — tokenize one text across several models at once. */
export async function compare(
  body: CompareRequest,
): Promise<CompareResponse> {
  const { data } = await apiClient.post<CompareResponse>(
    `${API_PREFIX}/compare`,
    body,
  );
  return data;
}
