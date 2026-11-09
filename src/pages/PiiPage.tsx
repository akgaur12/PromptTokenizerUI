import { useMemo, useState } from "react";
import { Eraser, ShieldCheck, Boxes, Plus, X, Pencil } from "lucide-react";
import { Header } from "@/components/Header/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { PII_TYPES, compileRule, customType, MAX_PATTERN_LENGTH, type CustomRule } from "@/lib/pii/detectors";
import { piiKey, redact, type MaskStyle } from "@/lib/pii/redact";
import { usePiiSettings } from "@/lib/pii/usePiiSettings";
import { cn, formatNumber } from "@/lib/utils";

const SAMPLE = `Hi team, please send the invoice to jane.doe@acme.com and call her on +1 415 555 0132.
Card on file: 4111 1111 1111 1111. Her SSN is 123-45-6789 and PAN is ABCDE1234F.
Server 192.168.0.12 is at https://internal.acme.com/admin?id=42, key: sk-abcdefghijklmnopqrstuv.`;

const STYLES: { id: MaskStyle; label: string; example: string }[] = [
  { id: "indexed", label: "Numbered", example: "[EMAIL_1]" },
  { id: "label", label: "Label", example: "[EMAIL]" },
  { id: "partial", label: "Partial mask", example: "j***@x.com" },
];

export function PiiPage() {
  const [text, setText] = useState("");
  // `${type}:${value}` keys the user clicked to leave un-redacted.
  const [keep, setKeep] = useState<Set<string>>(new Set());
  const { enabled, style, toggle, setAll, setStyle, custom, addRule, updateRule, toggleRule, removeRule } =
    usePiiSettings();
  const enabledKey = [...enabled].sort().join(",");
  const customKey = JSON.stringify(custom);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingRule = custom.find((r) => r.id === editingId);

  // What each type would find, regardless of selection — shown on the chips.
  const allCounts = useMemo(
    () =>
      redact(
        text,
        new Set(PII_TYPES.map((t) => t.id)),
        "label",
        new Set(),
        custom.map((r) => ({ ...r, enabled: true })),
      ).counts,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [text, customKey],
  );

  const result = useMemo(
    () => redact(text, enabled, style, keep, custom),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [text, style, enabledKey, customKey, keep],
  );

  function toggleKeep(key: string) {
    setKeep((prev) => {
      const next = new Set(prev);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  }

  const redactedCount = result.matches.length;

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <section className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Redact personal info
          </h2>
          <p className="text-sm text-muted-foreground">
            Remove emails, phone numbers, cards, IDs, keys and more from a prompt
            before you share it. Everything runs in your browser — nothing is
            uploaded.
          </p>
        </section>

        <Card>
          <CardContent className="space-y-5 p-5 sm:p-6">
            {/* 1. Choose what to remove */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-bold">What to remove</Label>
                <span className="flex gap-3 text-xs text-muted-foreground">
                  <button type="button" className="hover:text-foreground" onClick={() => setAll(true)}>
                    Select all
                  </button>
                  <button type="button" className="hover:text-foreground" onClick={() => setAll(false)}>
                    None
                  </button>
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {PII_TYPES.map((t) => {
                  const on = enabled.has(t.id);
                  const n = allCounts[t.id] ?? 0;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      aria-pressed={on}
                      title={`e.g. ${t.example}`}
                      onClick={() => toggle(t.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
                        on
                          ? "border-primary bg-primary/10 text-foreground"
                          : "text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {t.label}
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
              {custom.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {custom.map((r) => {
                    const n = allCounts[customType(r.id)] ?? 0;
                    return (
                      <span
                        key={r.id}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border border-dashed py-1 pl-3 pr-1 text-xs",
                          r.enabled ? "border-primary bg-primary/10" : "text-muted-foreground",
                        )}
                      >
                        <button
                          type="button"
                          aria-pressed={r.enabled}
                          title={`${r.mode === "regex" ? "Regex" : "Words"}: ${r.pattern}`}
                          onClick={() => toggleRule(r.id)}
                          className="inline-flex items-center gap-1.5"
                        >
                          {r.label}
                          {n > 0 && (
                            <span className="rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                              {n}
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          aria-label={`Edit ${r.label}`}
                          onClick={() => setEditingId(r.id)}
                          className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <Pencil className="size-3" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${r.label}`}
                          onClick={() => {
                            removeRule(r.id);
                            if (editingId === r.id) setEditingId(null);
                          }}
                          className="rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              <CustomRuleForm
                key={editingRule?.id ?? "new"}
                rule={editingRule}
                onSave={(fields) => {
                  if (editingRule) updateRule(editingRule.id, fields);
                  else addRule(fields);
                }}
                onClose={() => setEditingId(null)}
              />
              <div className="flex flex-wrap items-center gap-1 text-xs">
                <span className="mr-1 text-muted-foreground">Replace with</span>
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={style === s.id}
                    onClick={() => setStyle(s.id)}
                    title={s.example}
                    className={cn(
                      "rounded-md border px-2 py-1 transition-colors",
                      style === s.id ? "border-primary bg-primary/10" : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {s.label}{" "}
                    <span className="font-mono text-muted-foreground">{s.example}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="pii-input" className="text-sm font-bold">
                  Your prompt
                </Label>
                <span className="text-xs text-muted-foreground">
                  {formatNumber(text.length)} chars
                </span>
              </div>
              <Textarea
                id="pii-input"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setKeep(new Set());
                }}
                placeholder="Paste your prompt here…"
                spellCheck={false}
                rows={7}
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

        {/* 3. Result — redacted text with clickable inline highlights */}
        <Card>
          <CardContent className="space-y-3 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <Label className="flex items-center gap-2 text-sm font-bold">
                <ShieldCheck className="size-4" />
                Result
                {redactedCount > 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {redactedCount} removed
                  </span>
                )}
              </Label>
              <CopyButton
                value={result.text}
                label="Copy"
                disabled={!text}
                toastMessage="Redacted prompt copied"
              />
            </div>
            <div className="min-h-32 whitespace-pre-wrap break-words rounded-md border bg-muted/30 p-3 font-mono text-sm leading-relaxed">
              {text ? (
                result.segments.map((seg, i) => {
                  if (!seg.match) return <span key={i}>{seg.text}</span>;
                  const key = piiKey(seg.match);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleKeep(key)}
                      title={
                        seg.kept
                          ? `${seg.match.value} — kept. Click to redact`
                          : `Was: ${seg.match.value} — click to keep`
                      }
                      className={cn(
                        "rounded px-0.5 text-left transition-colors",
                        seg.kept
                          ? "bg-muted text-muted-foreground underline decoration-dashed"
                          : "bg-amber-500/20 text-foreground hover:bg-amber-500/35",
                      )}
                    >
                      {seg.text}
                    </button>
                  );
                })
              ) : (
                <span className="text-muted-foreground">
                  The cleaned prompt appears here.
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Highlighted items were redacted — hover to see the original, click
              to keep one. Best-effort detection, so review before sharing.
              Names and addresses aren’t detected.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function CustomRuleForm({
  rule,
  onSave,
  onClose,
}: {
  /** Rule being edited; omit to add a new one. */
  rule?: CustomRule;
  onSave: (fields: Omit<CustomRule, "id" | "enabled">) => void;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(!!rule);
  const [label, setLabel] = useState(rule?.label ?? "");
  const [pattern, setPattern] = useState(rule?.pattern ?? "");
  const [mode, setMode] = useState<CustomRule["mode"]>(rule?.mode ?? "words");

  const compiled = pattern.trim() ? compileRule({ pattern, mode }) : null;
  const error = compiled && "error" in compiled ? compiled.error : null;

  function submit() {
    if (!label.trim() || !pattern.trim() || error) return;
    onSave({ label: label.trim(), pattern: pattern.trim(), mode });
    toast.success(`${rule ? "Updated" : "Added"} “${label.trim()}”`);
    setLabel("");
    setPattern("");
    close();
  }

  function close() {
    setOpen(false);
    onClose();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <Plus className="size-3.5" />
        Add custom pattern
      </button>
    );
  }

  const inputCls =
    "h-8 rounded-md border bg-background px-2 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring";

  return (
    <div className="space-y-2 rounded-lg border border-dashed p-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Name, e.g. Employee ID"
          maxLength={30}
          aria-label="Pattern name"
          className={cn(inputCls, "w-44")}
        />
        <div className="flex overflow-hidden rounded-md border text-xs">
          {(["words", "regex"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={cn(
                "px-2 py-1.5 transition-colors",
                mode === m ? "bg-primary/10 font-medium" : "text-muted-foreground hover:bg-muted",
              )}
            >
              {m === "words" ? "Words" : "Regex"}
            </button>
          ))}
        </div>
        <input
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={mode === "words" ? "Project Phoenix, Acme Corp" : "EMP-\\d{4,6}"}
          maxLength={MAX_PATTERN_LENGTH}
          aria-label="Pattern"
          className={cn(inputCls, "min-w-48 flex-1 font-mono")}
        />
        <Button size="sm" onClick={submit} disabled={!label.trim() || !pattern.trim() || !!error}>
          {rule ? "Save" : "Add"}
        </Button>
        <Button size="sm" variant="ghost" onClick={close}>
          Cancel
        </Button>
      </div>
      <p className={cn("text-[11px]", error ? "text-destructive" : "text-muted-foreground")}>
        {error ??
          (mode === "words"
            ? "Exact terms, comma-separated. Case-insensitive."
            : "JavaScript regex, case-insensitive. Saved in this browser only.")}
      </p>
    </div>
  );
}
