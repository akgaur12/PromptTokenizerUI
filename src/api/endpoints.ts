import { apiClient, API_PREFIX } from "./client";
import type {
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
