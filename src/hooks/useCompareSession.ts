import { useState } from "react";
import { useCompare } from "@/hooks/useCompare";
import { useComparePrompts } from "@/hooks/useComparePrompts";

/** Which comparison the Compare page is showing. */
export type CompareMode = "models" | "prompts";

/**
 * Holds the Compare page's working state plus its mutations. Lives in <App>,
 * which stays mounted across hash-route changes, so switching to Tokenize and
 * back preserves everything the user had entered.
 *
 * Two independent comparisons share this page:
 *  - "models":  one text, several models (which tokenizer is most efficient?)
 *  - "prompts": one model, two prompts (which prompt costs fewer tokens?)
 * Each keeps its own state so toggling between modes never loses input.
 */
export function useCompareSession() {
  const [mode, setMode] = useState<CompareMode>("models");

  // "models" mode: fixed text, varying models.
  const [selected, setSelected] = useState<string[]>([]);
  const [text, setText] = useState("");
  const mutation = useCompare();

  // "prompts" mode: fixed model, varying prompts. Defaults to gpt-5.
  const [model, setModel] = useState<string | undefined>("gpt-5");
  const [promptA, setPromptA] = useState("");
  const [promptB, setPromptB] = useState("");
  const promptsMutation = useComparePrompts();

  return {
    mode,
    setMode,
    // models mode
    selected,
    setSelected,
    text,
    setText,
    mutation,
    // prompts mode
    model,
    setModel,
    promptA,
    setPromptA,
    promptB,
    setPromptB,
    promptsMutation,
  };
}

export type CompareSession = ReturnType<typeof useCompareSession>;
