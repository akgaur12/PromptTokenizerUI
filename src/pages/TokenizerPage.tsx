import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header/Header";
import { ModelSelector } from "@/components/ModelSelector/ModelSelector";
import { PromptInput } from "@/components/PromptInput/PromptInput";
import { StatsCards } from "@/components/StatsCards/StatsCards";
import { TokenViewer } from "@/components/TokenViewer/TokenViewer";
import { InfoSection } from "@/components/InfoSection/InfoSection";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useModels } from "@/hooks/useModels";
import { useTokenize } from "@/hooks/useTokenize";
import type { Model } from "@/types";

const SAMPLE =
  "The quick brown fox jumps over the lazy dog. Tokenization splits text into the units a model actually reads — words, sub-words, punctuation, and even emoji 🤖.";

export function TokenizerPage() {
  const { data: models } = useModels();
  const [selected, setSelected] = useState<Model | undefined>();
  const [text, setText] = useState("");
  const tokenizeMutation = useTokenize();

  // Auto-select a default model once loaded — prefer gpt-5, then any
  // non-deprecated model, then whatever the API returns first.
  useEffect(() => {
    if (!selected && models?.length) {
      setSelected(
        models.find((m) => m.id === "gpt-5") ??
          models.find((m) => !m.deprecated) ??
          models[0],
      );
    }
  }, [models, selected]);

  const result = tokenizeMutation.data;

  // Prefer the model's own context window; fall back to anything echoed back.
  const contextWindow = useMemo(
    () => selected?.context_window ?? result?.context_window ?? null,
    [selected, result],
  );

  function handleTokenize() {
    if (!selected || !text.trim()) return;
    tokenizeMutation.mutate({
      model: selected.id,
      text,
      include_tokens: true,
      include_token_ids: true,
    });
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        {/* Intro */}
        <section className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Tokenize text
          </h2>
          <p className="text-sm text-muted-foreground">
            Pick a model, paste your prompt, and see exactly how it gets broken
            into tokens. Visualize and analyze LLM tokens.
          </p>
        </section>

        {/* Model + Input */}
        <Card>
          <CardContent className="space-y-5 p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-3">
              <Label className="text-sm font-bold">Model</Label>
              <div className="w-full max-w-xs">
                <ModelSelector value={selected?.id} onChange={setSelected} />
              </div>
            </div>

            <PromptInput
              value={text}
              onChange={setText}
              onTokenize={handleTokenize}
              onTrySample={() => setText(SAMPLE)}
              onClear={() => {
                setText("");
                tokenizeMutation.reset();
              }}
              isLoading={tokenizeMutation.isPending}
              disabled={!selected}
            />
          </CardContent>
        </Card>

        {/* Results — always shown; render empty states until tokenized. */}
        <div className="space-y-6">
          <StatsCards
            data={result}
            isLoading={tokenizeMutation.isPending}
            contextWindow={contextWindow}
          />

          <TokenViewer data={result} />
        </div>

        {/* Educational info — concepts + a worked example */}
        <InfoSection />
      </main>

      <footer className="border-t py-6">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-muted-foreground sm:px-6">
          © 2026 PromptTokenizer · Visualize and analyze LLM tokens · Build by
          Akash Gaur
        </div>
      </footer>
    </div>
  );
}
