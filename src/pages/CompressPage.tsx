import { useEffect, useMemo, useState } from "react";
import { Boxes, Eraser, Loader2, Minimize2 } from "lucide-react";
import { CompressContent } from "@/components/CompressContent/CompressContent";
import { Header } from "@/components/Header/Header";
import { ModelSelector } from "@/components/ModelSelector/ModelSelector";
import { Card, CardContent } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useModels } from "@/hooks/useModels";
import { useTokenCount } from "@/hooks/useTokenCount";
import { compress, editKey } from "@/lib/compress/compress";
import { COMPRESS_RULES, PRESETS, RULE_ORDER, type Risk } from "@/lib/compress/rules";
import { useCompressSettings } from "@/lib/compress/useCompressSettings";
import { cn, formatCost, formatNumber } from "@/lib/utils";
import type { Model } from "@/types";

const SAMPLE = `Hi there,

I would like you to please go ahead and summarize the following article for me. Kindly make sure the summary is short in order to save time.

Due to the fact that I am very busy, it is important to note that I need the summary as soon as possible.   Make use of    bullet points.

Return the summary as a bulleted list with one idea per line.
Return the summary as a bulleted list with one idea per line.

Thanks in advance!`;

const RISK_DOT: Record<Risk, string> = {
  safe: "bg-emerald-500",
  moderate: "bg-amber-500",
  risky: "bg-red-500",
};

/** Make whitespace-only deletions visible in the diff. */
function showWhitespace(s: string): string {
  if (!/^\s+$/.test(s)) return s;
  return s.replace(/ /g, "·").replace(/\t/g, "→").replace(/\n/g, "↵\n");
}

export function CompressPage() {
  const { data: models } = useModels();
  const [selected, setSelected] = useState<Model | undefined>();
  const [text, setText] = useState("");
  const [view, setView] = useState<"diff" | "clean">("diff");
  // `${rule}:${original}` keys the user chose to keep as written.
  const [keep, setKeep] = useState<Set<string>>(new Set());
  const { enabled, toggle, setRules } = useCompressSettings();
  const enabledKey = [...enabled].sort().join(",");

  useEffect(() => {
    if (!selected && models?.length) {
      setSelected(
        models.find((m) => m.id === "gpt-5") ??
          models.find((m) => !m.deprecated) ??
          models[0],
      );
    }
  }, [models, selected]);

  // Edits each rule would make, regardless of selection, for the chip counts.
  const allCounts = useMemo(
    () => compress(text, new Set(RULE_ORDER)).counts,
    [text],
  );
  const result = useMemo(
    () => compress(text, enabled, keep),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [text, enabledKey, keep],
  );

  const original = useTokenCount(selected?.id, text);
  const compressed = useTokenCount(selected?.id, result.text);

  const activePreset = PRESETS.find(
    (p) => p.rules.length === enabled.size && p.rules.every((r) => enabled.has(r)),
  )?.id;

  function toggleKeep(key: string) {
    setKeep((prev) => {
      const next = new Set(prev);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  }

  // Prefer real token counts; fall back to characters if the API is unavailable.
  const haveTokens = !!original.data && !!compressed.data;
  const o = haveTokens ? original.data!.token_count : text.length;
  const c = haveTokens ? compressed.data!.token_count : result.text.length;
  const saved = o - c;
  const pct = o > 0 ? Math.round((Math.abs(saved) / o) * 100) : 0;
  const unit = haveTokens ? "tokens" : "chars";
  const busy = original.pending || compressed.pending;

  const costSaved =
    haveTokens &&
    original.data!.estimated_input_cost != null &&
    compressed.data!.estimated_input_cost != null
      ? original.data!.estimated_input_cost - compressed.data!.estimated_input_cost
      : null;

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <section className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Compress your prompt
          </h2>
          <p className="text-sm text-muted-foreground">
            Cut filler and wordiness to spend fewer tokens. Pick the rules, see
            every change, and keep any you disagree with. Compression runs in
            your browser; only token counts use the tokenizer API.
          </p>
        </section>

        <Card>
          <CardContent className="space-y-5 p-4 sm:p-6">
            <div className="flex flex-wrap items-center gap-3">
              <Label className="text-sm font-bold">Model</Label>
              <div className="w-full max-w-xs">
                <ModelSelector value={selected?.id} onChange={setSelected} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label className="text-sm font-bold">How much to compress</Label>
                <div className="flex overflow-hidden rounded-md border text-xs">
                  {PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      aria-pressed={activePreset === p.id}
                      onClick={() => setRules(p.rules)}
                      className={cn(
                        "px-3 py-1.5 transition-colors",
                        activePreset === p.id
                          ? "bg-primary/10 font-medium"
                          : "text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {COMPRESS_RULES.map((r) => {
                  const on = enabled.has(r.id);
                  const n = allCounts[r.id] ?? 0;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      aria-pressed={on}
                      title={`${r.description} e.g. ${r.example}`}
                      onClick={() => toggle(r.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors sm:py-1",
                        on
                          ? "border-primary bg-primary/10 text-foreground"
                          : "text-muted-foreground hover:bg-muted",
                      )}
                    >
                      <span className={cn("size-1.5 rounded-full", RISK_DOT[r.risk])} aria-hidden />
                      {r.label}
                      {n > 0 && (
                        <span
                          className={cn(
                            "rounded-full px-1.5 text-[10px] font-semibold",
                            on ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20",
                          )}
                        >
                          {n}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                {(["safe", "moderate", "risky"] as Risk[]).map((k) => (
                  <span key={k} className="inline-flex items-center gap-1">
                    <span className={cn("size-1.5 rounded-full", RISK_DOT[k])} />
                    {k === "safe" ? "safe" : k === "moderate" ? "may change tone" : "may change meaning"}
                  </span>
                ))}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="compress-input" className="text-sm font-bold">
                  Your prompt
                </Label>
                <span className="text-xs text-muted-foreground">
                  {formatNumber(text.length)} chars
                </span>
              </div>
              <Textarea
                id="compress-input"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setKeep(new Set());
                }}
                placeholder="Paste your prompt here…"
                spellCheck={false}
                rows={8}
                className="font-mono leading-relaxed"
              />
              <div className="flex justify-end">
                {text ? (
                  <Button variant="ghost" size="sm" onClick={() => { setText(""); setKeep(new Set()); }}>
                    <Eraser />
                    Clear
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => setText(SAMPLE)}>
                    <Boxes />
                    Try a sample
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Savings */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <Stat label="Original" unit={unit} value={text ? formatNumber(o) : "—"} />
          <Stat label="Compressed" unit={unit} value={text ? formatNumber(c) : "—"} />
          <Stat
            label="Saved"
            unit={unit}
            highlight={text !== "" && saved > 0}
            value={text ? `${saved > 0 ? "−" : saved < 0 ? "+" : ""}${formatNumber(Math.abs(saved))}` : "—"}
            sub={
              text
                ? [
                    o > 0 ? `${saved < 0 ? "+" : ""}${pct}%` : null,
                    costSaved != null && costSaved > 0
                      ? `${formatCost(costSaved, original.data?.cost_currency ?? "USD")}/call`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : undefined
            }
            busy={busy}
          />
        </div>
        {text && !haveTokens && !busy && (
          <p className="-mt-3 text-xs text-muted-foreground">
            Token counts unavailable (tokenizer API unreachable) — showing
            characters instead.
          </p>
        )}

        {/* Result */}
        <Card>
          <CardContent className="space-y-3 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className="flex items-center gap-2 text-sm font-bold">
                <Minimize2 className="size-4" />
                Compressed
                {result.applied > 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {result.applied} change{result.applied > 1 ? "s" : ""}
                  </span>
                )}
              </Label>
              <div className="flex items-center gap-2">
                <div className="flex overflow-hidden rounded-md border text-xs">
                  {(["diff", "clean"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={view === v}
                      onClick={() => setView(v)}
                      className={cn(
                        "px-2.5 py-1.5 transition-colors",
                        view === v ? "bg-primary/10 font-medium" : "text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {v === "diff" ? "Changes" : "Clean"}
                    </button>
                  ))}
                </div>
                <CopyButton
                  value={result.text}
                  label="Copy"
                  disabled={!text}
                  toastMessage="Compressed prompt copied"
                />
              </div>
            </div>

            <div className="min-h-32 whitespace-pre-wrap break-words rounded-md border bg-muted/30 p-3 font-mono text-sm leading-relaxed">
              {!text ? (
                <span className="text-muted-foreground">The compressed prompt appears here.</span>
              ) : view === "clean" ? (
                result.text
              ) : (
                result.segments.map((seg, i) => {
                  if (!seg.edit) return <span key={i}>{seg.text}</span>;
                  const key = editKey(seg.edit.rule, seg.original ?? "");
                  const shown = showWhitespace(seg.original ?? "");
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleKeep(key)}
                      title={seg.kept ? "Kept as written — click to compress" : "Click to keep the original"}
                      className="whitespace-pre-wrap rounded text-left transition-opacity hover:opacity-80"
                    >
                      {seg.kept ? (
                        <span className="bg-muted text-muted-foreground underline decoration-dashed">
                          {seg.text}
                        </span>
                      ) : (
                        <>
                          <del className="rounded bg-red-500/20 px-0.5 text-red-700 dark:text-red-300">
                            {shown}
                          </del>
                          {seg.text && (
                            <ins className="rounded bg-emerald-500/20 px-0.5 no-underline">
                              {seg.text}
                            </ins>
                          )}
                        </>
                      )}
                    </button>
                  );
                })
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Red is removed, green is the replacement — click any change to keep
              the original. Code blocks, quoted text and {"{{variables}}"} are never
              touched. Shorter isn’t always better: test the compressed prompt
              before relying on it.
            </p>
          </CardContent>
        </Card>

        {/* Static, crawlable explainer — mirrors the tokenizer page's landing copy */}
        <CompressContent />
      </main>
    </div>
  );
}

function Stat({
  label,
  unit,
  value,
  sub,
  highlight,
  busy,
}: {
  label: string;
  unit: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  busy?: boolean;
}) {
  return (
    <Card className="p-3 sm:p-4">
      <div className="flex items-center justify-between gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
        <span className="truncate">{label}</span>
        {busy && <Loader2 className="size-3 shrink-0 animate-spin" />}
      </div>
      <div
        className={cn(
          "mt-1 text-xl font-semibold tabular-nums sm:text-2xl",
          highlight && "text-emerald-600 dark:text-emerald-400",
        )}
      >
        {value}
      </div>
      <div className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
        {unit}
        {sub && (
          <span className="block sm:inline">
            <span className="hidden sm:inline"> · </span>
            {sub}
          </span>
        )}
      </div>
    </Card>
  );
}
