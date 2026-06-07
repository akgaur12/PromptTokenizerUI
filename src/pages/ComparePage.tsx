import { Header } from "@/components/Header/Header";
import { MultiModelSelector } from "@/components/ModelSelector/MultiModelSelector";
import { PromptInput } from "@/components/PromptInput/PromptInput";
import { CompareResults } from "@/components/CompareResults/CompareResults";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useModels } from "@/hooks/useModels";
import type { CompareSession } from "@/hooks/useCompareSession";
import { toast } from "sonner";

const SAMPLE =
  "The quick brown fox jumps over the lazy dog. Tokenization splits text into the units a model actually reads — words, sub-words, punctuation, and even emoji 🤖.";

const MAX_MODELS = 10;

interface ComparePageProps {
  /** Hoisted to <App> so it persists across route changes. */
  session: CompareSession;
}

export function ComparePage({ session }: ComparePageProps) {
  const { data: models } = useModels();
  const { selected, setSelected, text, setText, mutation: compareMutation } =
    session;

  function handleCompare() {
    if (!text.trim()) return;
    if (selected.length < 2) {
      toast.error("Pick at least two models", {
        description: "Comparison needs two or more models to be useful.",
      });
      return;
    }
    compareMutation.mutate({ models: selected, text });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        {/* Intro */}
        <section className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Compare tokens
          </h2>
          <p className="text-sm text-muted-foreground">
            Tokenize the same text across several models at once and see which
            tokenizer is most efficient for your prompt.
          </p>
        </section>

        {/* Models + Input */}
        <Card>
          <CardContent className="space-y-5 p-5 sm:p-6">
            <div className="space-y-2">
              <Label className="text-sm font-bold">Models</Label>
              <div className="w-full max-w-md">
                <MultiModelSelector
                  value={selected}
                  onChange={setSelected}
                  max={MAX_MODELS}
                />
              </div>
            </div>

            <PromptInput
              value={text}
              onChange={setText}
              onTokenize={handleCompare}
              onTrySample={() => setText(SAMPLE)}
              onClear={() => {
                setText("");
                compareMutation.reset();
              }}
              isLoading={compareMutation.isPending}
              disabled={selected.length < 2}
              actionLabel="Compare"
              loadingLabel="Comparing…"
            />
          </CardContent>
        </Card>

        {/* Results */}
        <CompareResults
          data={compareMutation.data}
          isLoading={compareMutation.isPending}
          models={models}
        />
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
