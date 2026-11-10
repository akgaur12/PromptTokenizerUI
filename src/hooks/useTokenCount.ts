import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { tokenize } from "@/api/endpoints";

/**
 * Token count for a text via the tokenizer API, debounced so typing doesn't
 * fire a request per keystroke. Results are cached per (model, text).
 */
export function useTokenCount(model: string | undefined, text: string, delay = 500) {
  const [debounced, setDebounced] = useState(text);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(text), delay);
    return () => clearTimeout(t);
  }, [text, delay]);

  const enabled = !!model && debounced.trim().length > 0;
  const query = useQuery({
    queryKey: ["token-count", model, debounced],
    queryFn: () => tokenize({ model: model!, text: debounced }),
    enabled,
    staleTime: Infinity,
    retry: 1,
    placeholderData: keepPreviousData,
  });

  return {
    data: enabled && text.trim() ? query.data : undefined,
    // True while waiting on the debounce or the request.
    pending: enabled && (debounced !== text || query.isFetching),
    isError: query.isError,
  };
}
