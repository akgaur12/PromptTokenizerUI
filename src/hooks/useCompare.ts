import { useMutation } from "@tanstack/react-query";
import { compare } from "@/api/endpoints";
import { normalizeApiError } from "@/api/client";
import { toast } from "sonner";
import type {
  CompareRequest,
  CompareResponse,
  NormalizedApiError,
} from "@/types";

/**
 * Compare mutation. Tokenizes a single text across multiple models and surfaces
 * normalized errors as toasts. Note: per-model failures come back inside the
 * `results` array (each entry's `error` field) — this only fires on a
 * request-level failure (network, validation, etc.).
 */
export function useCompare() {
  return useMutation<CompareResponse, NormalizedApiError, CompareRequest>({
    mutationFn: async (body) => {
      try {
        return await compare(body);
      } catch (error) {
        throw normalizeApiError(error);
      }
    },
    onError: (error) => {
      toast.error(error.title, { description: error.message });
    },
  });
}
