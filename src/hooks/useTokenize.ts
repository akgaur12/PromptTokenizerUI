import { useMutation } from "@tanstack/react-query";
import { tokenize } from "@/api/endpoints";
import { normalizeApiError } from "@/api/client";
import { toast } from "sonner";
import type {
  NormalizedApiError,
  TokenizeRequest,
  TokenizeResponse,
} from "@/types";

/**
 * Tokenize mutation. Surfaces normalized errors as toasts and returns the
 * typed response on success.
 */
export function useTokenize() {
  return useMutation<TokenizeResponse, NormalizedApiError, TokenizeRequest>({
    mutationFn: async (body) => {
      try {
        return await tokenize(body);
      } catch (error) {
        throw normalizeApiError(error);
      }
    },
    onError: (error) => {
      toast.error(error.title, { description: error.message });
    },
  });
}
