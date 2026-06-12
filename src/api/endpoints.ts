import { apiClient, API_BASE_URL, API_PREFIX, normalizeApiError } from "./client";
import type {
  CompareRequest,
  CompareResponse,
  CompareResult,
  ComparePromptsRequest,
  ComparePromptsResponse,
  HealthResponse,
  Model,
  ModelsResponse,
  PromptCompareResult,
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

/**
 * Tokenize one text across several models at once.
 *
 * We fan out parallel `/tokenize` calls rather than hitting `/compare`, because
 * `/compare` returns only token counts — `/tokenize` additionally returns each
 * model's `estimated_input_cost`, which lets the UI rank by price as well as by
 * token count. Per-model failures are captured inline (mirroring the original
 * `/compare` contract) so one unsupported model doesn't sink the whole request.
 */
export async function compare(
  body: CompareRequest,
): Promise<CompareResponse> {
  const results = await Promise.all(
    body.models.map<Promise<CompareResult>>(async (model) => {
      try {
        const data = await tokenize({ model, text: body.text });
        return {
          model,
          resolved_tokenizer: data.resolved_tokenizer ?? null,
          token_count: data.token_count,
          estimated_input_cost: data.estimated_input_cost ?? null,
          cost_currency: data.cost_currency ?? null,
          error: null,
        };
      } catch (error) {
        return {
          model,
          resolved_tokenizer: null,
          token_count: null,
          estimated_input_cost: null,
          cost_currency: null,
          error: normalizeApiError(error).message,
        };
      }
    }),
  );

  return { text_length: body.text.length, results };
}

/**
 * Tokenize several prompts with a *single* model and compare them against each
 * other. This is the mirror image of `compare`: there we hold the text fixed
 * and vary the model; here we hold the model fixed and vary the text. We fan
 * out parallel `/tokenize` calls so each prompt also gets its word count and
 * `estimated_input_cost`. Per-prompt failures are captured inline so one bad
 * prompt doesn't sink the comparison.
 */
export async function comparePrompts(
  body: ComparePromptsRequest,
): Promise<ComparePromptsResponse> {
  let resolvedTokenizer: string | null = null;

  const results = await Promise.all(
    body.prompts.map<Promise<PromptCompareResult>>(async (text, index) => {
      try {
        const data = await tokenize({ model: body.model, text });
        // Every prompt resolves to the same tokenizer for a given model;
        // keep the first one we see.
        if (resolvedTokenizer == null && data.resolved_tokenizer) {
          resolvedTokenizer = data.resolved_tokenizer;
        }
        return {
          index,
          text_length: text.length,
          word_count: data.word_count ?? null,
          token_count: data.token_count,
          estimated_input_cost: data.estimated_input_cost ?? null,
          cost_currency: data.cost_currency ?? null,
          error: null,
        };
      } catch (error) {
        return {
          index,
          text_length: text.length,
          word_count: null,
          token_count: null,
          estimated_input_cost: null,
          cost_currency: null,
          error: normalizeApiError(error).message,
        };
      }
    }),
  );

  return { model: body.model, resolved_tokenizer: resolvedTokenizer, results };
}
