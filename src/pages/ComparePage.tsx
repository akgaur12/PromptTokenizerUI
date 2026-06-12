import { Boxes, GitCompare, Layers } from "lucide-react";
import { Header } from "@/components/Header/Header";
import { MultiModelSelector } from "@/components/ModelSelector/MultiModelSelector";
import { ModelSelector } from "@/components/ModelSelector/ModelSelector";
import { PromptInput } from "@/components/PromptInput/PromptInput";
import { CompareResults } from "@/components/CompareResults/CompareResults";
import { ComparePromptsResults } from "@/components/CompareResults/ComparePromptsResults";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useModels } from "@/hooks/useModels";
import type { CompareMode, CompareSession } from "@/hooks/useCompareSession";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const SAMPLE =
  "The quick brown fox jumps over the lazy dog. Tokenization splits text into the units a model actually reads — words, sub-words, punctuation, and even emoji 🤖.";

const SAMPLE_A =
  "Please could you kindly go ahead and summarize the following article for me in a few short sentences?";
const SAMPLE_B = "Summarize this article in a few sentences.";

const MAX_MODELS = 10;

interface ComparePageProps {
  /** Hoisted to <App> so it persists across route changes. */
  session: CompareSession;
}

const MODE_TABS: { id: CompareMode; label: string; icon: typeof Layers }[] = [
  { id: "models", label: "Across models", icon: Layers },
  { id: "prompts", label: "Across prompts", icon: GitCompare },
];

export function ComparePage({ session }: ComparePageProps) {
  const { data: models } = useModels();
  const {
    mode,
    setMode,
    selected,
    setSelected,
    text,
    setText,
    mutation: compareMutation,
    model,
    setModel,
    promptA,
    setPromptA,
    promptB,
    setPromptB,
    promptsMutation,
  } = session;

  function handleCompareModels() {
    if (!text.trim()) return;
    if (selected.length < 2) {
      toast.error("Pick at least two models", {
        description: "Comparison needs two or more models to be useful.",
      });
      return;
    }
    compareMutation.mutate({ models: selected, text });
  }

  function handleComparePrompts() {
    if (!model) {
      toast.error("Pick a model", {
        description: "Choose the model to tokenize both prompts with.",
      });
      return;
    }
    if (!promptA.trim() || !promptB.trim()) {
      toast.error("Enter both prompts", {
        description: "Fill in both prompts to compare their token counts.",
      });
      return;
    }
    promptsMutation.mutate({ model, prompts: [promptA, promptB] });
  }

  const canComparePrompts =
    !!model && promptA.trim().length > 0 && promptB.trim().length > 0;

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
            {mode === "models"
              ? "Tokenize the same text across several models at once and see which tokenizer is most efficient for your prompt."
              : "Tokenize two prompts with the same model and see which one costs fewer tokens."}
          </p>
        </section>

        {/* Mode toggle */}
        <div
          role="tablist"
          aria-label="Comparison mode"
          className="inline-flex rounded-lg border bg-muted/40 p-1"
        >
          {MODE_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = mode === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={active}
                onClick={() => setMode(tab.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {mode === "models" ? (
          <>
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
                  onTokenize={handleCompareModels}
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
          </>
        ) : (
          <>
            {/* Model + two prompts */}
            <Card>
              <CardContent className="space-y-5 p-5 sm:p-6">
                <div className="space-y-2">
                  <Label className="text-sm font-bold">Model</Label>
                  <div className="w-full max-w-md">
                    <ModelSelector
                      value={model}
                      onChange={(m) => setModel(m.id)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <PromptColumn
                    id="prompt-a"
                    label="Prompt A"
                    value={promptA}
                    onChange={setPromptA}
                  />
                  <PromptColumn
                    id="prompt-b"
                    label="Prompt B"
                    value={promptB}
                    onChange={setPromptB}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  {promptA || promptB ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={promptsMutation.isPending}
                      onClick={() => {
                        setPromptA("");
                        setPromptB("");
                        promptsMutation.reset();
                      }}
                    >
                      Clear
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={promptsMutation.isPending}
                      onClick={() => {
                        setPromptA(SAMPLE_A);
                        setPromptB(SAMPLE_B);
                      }}
                    >
                      <Boxes />
                      Try a sample
                    </Button>
                  )}
                  <Button
                    onClick={handleComparePrompts}
                    disabled={!canComparePrompts || promptsMutation.isPending}
                    className="min-w-32"
                  >
                    {promptsMutation.isPending ? "Comparing…" : "Compare"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <ComparePromptsResults
              data={promptsMutation.data}
              isLoading={promptsMutation.isPending}
              models={models}
            />
          </>
        )}
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

interface PromptColumnProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

/** A single labelled prompt textarea with a live character count. */
function PromptColumn({ id, label, value, onChange }: PromptColumnProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <span className="text-xs text-muted-foreground tabular-nums">
          {value.length} chars
        </span>
      </div>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Enter ${label.toLowerCase()}…`}
        spellCheck={false}
        className="min-h-32 resize-y font-mono leading-relaxed"
      />
    </div>
  );
}
