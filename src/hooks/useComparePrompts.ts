import { useMutation } from "@tanstack/react-query";
import { comparePrompts } from "@/api/endpoints";
import { normalizeApiError } from "@/api/client";
import { toast } from "sonner";
import type {
  ComparePromptsRequest,
  ComparePromptsResponse,
  NormalizedApiError,
} from "@/types";

/**
 * Compare-prompts mutation. Tokenizes several prompts with a single model and
 * surfaces normalized errors as toasts. Like {@link useCompare}, per-prompt
 * failures come back inside the `results` array (each entry's `error` field) —
 * this only fires on a request-level failure (network, validation, etc.).
 */
export function useComparePrompts() {
  return useMutation<
    ComparePromptsResponse,
    NormalizedApiError,
    ComparePromptsRequest
  >({
    mutationFn: async (body) => {
      try {
        return await comparePrompts(body);
      } catch (error) {
        throw normalizeApiError(error);
      }
    },
    onError: (error) => {
      toast.error(error.title, { description: error.message });
    },
  });
}
