import { useState } from "react";
import { useCompare } from "@/hooks/useCompare";

/**
 * Holds the Compare page's working state (selected models, input text) plus its
 * mutation. Lives in <App>, which stays mounted across hash-route changes, so
 * switching to Tokenize and back preserves everything the user had entered.
 */
export function useCompareSession() {
  const [selected, setSelected] = useState<string[]>([]);
  const [text, setText] = useState("");
  const mutation = useCompare();

  return { selected, setSelected, text, setText, mutation };
}

export type CompareSession = ReturnType<typeof useCompareSession>;
