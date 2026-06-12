/**
 * Shared API types for PromptTokenizer.
 *
 * These mirror the documented backend contracts but keep most fields optional /
 * defensive, because the UI must never crash on a slightly different payload.
 */

/* ------------------------------------------------------------------ */
/* Models                                                              */
/* ------------------------------------------------------------------ */

/**
 * Raw model entry exactly as returned by `GET /api/v1/models`.
 * The backend uses `label`/`group`/`tokenizer_ref` rather than
 * `name`/`family`/`encoding`, so we normalize it (see `normalizeModel`).
 */
export interface RawModel {
  id: string;
  label?: string | null;
  group?: string | null;
  provider?: string | null;
  adapter?: string | null;
  tokenizer_ref?: string | null;
  status?: string | null;
  description?: string | null;
  context_window?: number | null;
  notes?: string | null;
  supports_token_decode?: boolean;
  supports_browser?: boolean;
  deprecated?: boolean;
}

/** Normalized model used throughout the UI. */
export interface Model {
  /** Stable identifier sent back in the tokenize request, e.g. "gpt-4o". */
  id: string;
  /** Human friendly display name (from `label`, falls back to `id`). */
  name: string;
  /** Grouping key for the dropdown (from `group`). */
  family: string;
  /** Short capability description. */
  description?: string | null;
  /** Tokenizer encoding (from `tokenizer_ref`). */
  encoding?: string | null;
  /** Provider name, e.g. "openai". */
  provider?: string | null;
  /** Maximum context window in tokens (may be null for encodings). */
  context_window?: number | null;
  /** Whether the model is deprecated / legacy. */
  deprecated?: boolean;
  /** Lifecycle status, e.g. "stable", "deprecated". */
  status?: string | null;
}

export interface ModelsResponse {
  items: RawModel[];
}

/* ------------------------------------------------------------------ */
/* Tokenize                                                            */
/* ------------------------------------------------------------------ */

export interface TokenizeRequest {
  model: string;
  text: string;
  include_tokens?: boolean;
  include_token_ids?: boolean;
}

export interface TokenizeResponse {
  model?: string;
  /** The tokenizer the backend resolved this model to, e.g. "o200k_base". */
  resolved_tokenizer?: string | null;
  token_count: number;
  word_count: number;
  character_count: number;
  estimated_input_cost: number | null;
  cost_currency?: string | null;
  /** Decoded token strings (present when include_tokens=true). */
  tokens?: string[];
  /** Numeric token ids (present when include_token_ids=true). */
  token_ids?: number[];
  /** Some backends echo the model context window here. */
  context_window?: number | null;
}

/* ------------------------------------------------------------------ */
/* Compare                                                             */
/* ------------------------------------------------------------------ */

export interface CompareRequest {
  /** Model ids to tokenize the same text with, e.g. ["gpt-5", "gpt-5-mini"]. */
  models: string[];
  text: string;
}

/** Per-model entry in a compare response. */
export interface CompareResult {
  model: string;
  /** The tokenizer the backend resolved this model to, e.g. "o200k_base". */
  resolved_tokenizer?: string | null;
  token_count: number | null;
  /** Estimated cost of tokenizing this text as input, in `cost_currency`. */
  estimated_input_cost?: number | null;
  /** Currency for `estimated_input_cost`, e.g. "USD". */
  cost_currency?: string | null;
  /** Populated when this particular model failed (others may still succeed). */
  error?: string | null;
}

export interface CompareResponse {
  /** Character length of the compared text. */
  text_length: number;
  results: CompareResult[];
}

/* ------------------------------------------------------------------ */
/* Compare prompts (one model, several prompts)                        */
/* ------------------------------------------------------------------ */

export interface ComparePromptsRequest {
  /** The single model to tokenize every prompt with, e.g. "gpt-4o". */
  model: string;
  /** The prompts to compare against each other (typically two). */
  prompts: string[];
}

/** Per-prompt entry in a "compare prompts" response. */
export interface PromptCompareResult {
  /** 0-based position of this prompt in the request. */
  index: number;
  /** Character length of this prompt. */
  text_length: number;
  word_count: number | null;
  token_count: number | null;
  /** Estimated cost of tokenizing this prompt as input, in `cost_currency`. */
  estimated_input_cost?: number | null;
  /** Currency for `estimated_input_cost`, e.g. "USD". */
  cost_currency?: string | null;
  /** Populated when this particular prompt failed. */
  error?: string | null;
}

export interface ComparePromptsResponse {
  /** The model every prompt was tokenized with. */
  model: string;
  /** The tokenizer the backend resolved this model to. */
  resolved_tokenizer?: string | null;
  results: PromptCompareResult[];
}

/* ------------------------------------------------------------------ */
/* Health                                                              */
/* ------------------------------------------------------------------ */

export interface HealthResponse {
  status: string;
  service?: string;
  version?: string;
  /** Memory reported in megabytes under `memory.rss_mb` / `memory.vms_mb`. */
  memory?: {
    rss_mb?: number;
    vms_mb?: number;
  };
  [key: string]: unknown;
}

/* ------------------------------------------------------------------ */
/* Errors                                                              */
/* ------------------------------------------------------------------ */

export type ApiErrorCode =
  | "MODEL_NOT_SUPPORTED"
  | "VALIDATION_ERROR"
  | "TOKENIZER_NOT_AVAILABLE"
  | "INTERNAL_ERROR"
  | "NETWORK_ERROR"
  | "UNKNOWN";

export interface ApiErrorBody {
  error?: {
    code?: ApiErrorCode | string;
    message?: string;
    details?: unknown;
  };
}

/** Normalized error surfaced to the UI layer. */
export interface NormalizedApiError {
  code: ApiErrorCode;
  status?: number;
  title: string;
  message: string;
}
