import axios, { AxiosError } from "axios";
import type { ApiErrorBody, NormalizedApiError, ApiErrorCode } from "@/types";

/**
 * Base URL resolution:
 *  - In dev we default to "" so requests hit the Vite proxy (see vite.config.ts),
 *    which forwards /api and /health to http://localhost:8000.
 *  - Override with VITE_API_BASE_URL for production / direct connections.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
export const API_PREFIX = "/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000, // Request timeout: 30 seconds (30,000ms)
  headers: {
    "Content-Type": "application/json",
  },
});

/** Friendly, user-facing copy for each known error code. */
const ERROR_COPY: Record<
  ApiErrorCode,
  { title: string; message: string }
> = {
  MODEL_NOT_SUPPORTED: {
    title: "Model not supported",
    message: "This model isn't available for tokenization. Try another one.",
  },
  VALIDATION_ERROR: {
    title: "Invalid request",
    message: "Please check your input and try again.",
  },
  TOKENIZER_NOT_AVAILABLE: {
    title: "Tokenizer unavailable",
    message:
      "The tokenizer service is temporarily unavailable. Please retry shortly.",
  },
  INTERNAL_ERROR: {
    title: "Something went wrong",
    message: "The server hit an unexpected error. Please try again.",
  },
  NETWORK_ERROR: {
    title: "Can't reach the server",
    message:
      "No response from the tokenizer API. Make sure it's running on the configured URL.",
  },
  UNKNOWN: {
    title: "Unexpected error",
    message: "An unexpected error occurred. Please try again.",
  },
};

function codeFromStatus(status?: number): ApiErrorCode {
  switch (status) {
    case 404:
      return "MODEL_NOT_SUPPORTED";
    case 422:
      return "VALIDATION_ERROR";
    case 503:
      return "TOKENIZER_NOT_AVAILABLE";
    case 500:
      return "INTERNAL_ERROR";
    default:
      return "UNKNOWN";
  }
}

/**
 * Normalize any thrown error into a predictable shape the UI can render.
 * Prefers the backend-provided error code, falling back to HTTP status.
 */
export function normalizeApiError(error: unknown): NormalizedApiError {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorBody>;

    // No response at all -> network / server-down.
    if (!axiosError.response) {
      const copy = ERROR_COPY.NETWORK_ERROR;
      return { code: "NETWORK_ERROR", ...copy };
    }

    const status = axiosError.response.status;
    const bodyCode = axiosError.response.data?.error?.code as
      | ApiErrorCode
      | undefined;
    const code: ApiErrorCode =
      bodyCode && bodyCode in ERROR_COPY ? bodyCode : codeFromStatus(status);

    const copy = ERROR_COPY[code] ?? ERROR_COPY.UNKNOWN;
    const serverMessage = axiosError.response.data?.error?.message;

    return {
      code,
      status,
      title: copy.title,
      message: serverMessage || copy.message,
    };
  }

  return { code: "UNKNOWN", ...ERROR_COPY.UNKNOWN };
}
