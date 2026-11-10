import { Coins, Gauge, ListChecks, ShieldCheck, TriangleAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { COMPRESS_RULES, type Risk } from "@/lib/compress/rules";
import { cn } from "@/lib/utils";

const RISK_UI: Record<Risk, { label: string; dot: string }> = {
  safe: { label: "Safe", dot: "bg-emerald-500" },
  moderate: { label: "May change tone", dot: "bg-amber-500" },
  risky: { label: "May change meaning", dot: "bg-red-500" },
};

const code = "rounded bg-muted px-1 py-0.5 font-mono text-xs";

/**
 * Static, crawlable explainer rendered below the compressor — same idea as the
 * tokenizer page's landing copy. It carries the page's single <h1>, explains
 * how the rules work and where they stop, and shows a before/after example.
 */
export function CompressContent() {
  return (
    <section className="space-y-8 border-t pt-8">
      {/* Hero */}
      <div className="space-y-3">
        <h1 className="text-2xl font-bold tracking-tight">
          Free Prompt Compressor &amp; Token Reducer
        </h1>
        <p className="text-[16px] leading-relaxed text-muted-foreground">
          PromptTokenizer&apos;s prompt compressor trims filler words, wordy
          phrases, duplicate lines and stray whitespace so your prompt uses
          fewer tokens — and costs less — without you rewriting it by hand.
          Choose which rules to apply, see every change highlighted, keep the
          ones you disagree with, and compare the real token counts before and
          after for the model you pick. The compression itself runs in your
          browser; only the token counts call the tokenizer API.
        </p>
      </div>

      <div className="space-y-5">
        <h2 className="text-xl font-semibold tracking-tight">How prompt compression works</h2>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-amber-500" />
            <h3 className="text-lg font-semibold tracking-tight">Why shorter prompts help</h3>
          </div>
          <p className="mt-1.5 text-[16px] leading-relaxed text-muted-foreground">
            LLM APIs charge per token, and every token also counts toward the
            model&apos;s context window and adds a little latency. Prompts that
            are sent thousands of times — system prompts, templates, agent
            instructions — repeat their padding on every call, so trimming it
            adds up. Models don&apos;t need politeness or filler to follow an
            instruction; <code className={code}>Summarize this article</code>{" "}
            carries the same request as{" "}
            <code className={code}>Please could you kindly go ahead and summarize this article</code>.
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-sky-500" />
            <h3 className="text-lg font-semibold tracking-tight">The compression rules</h3>
          </div>
          <p className="mt-1.5 text-[16px] leading-relaxed text-muted-foreground">
            Each rule is a toggle with a count of the changes it would make.
            Rules are ordered from safest to riskiest, and the dot shows how
            likely a rule is to change what your prompt means or how it sounds.
          </p>

          <div className="mt-4 space-y-2">
            {COMPRESS_RULES.map((r) => (
              <div
                key={r.id}
                className="grid gap-x-4 gap-y-1 rounded-md bg-muted/40 px-3 py-2.5 text-[15px] sm:grid-cols-[11rem_11rem_1fr]"
              >
                <span className="font-medium text-foreground">{r.label}</span>
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <span className={cn("size-2 shrink-0 rounded-full", RISK_UI[r.risk].dot)} />
                  {RISK_UI[r.risk].label}
                </span>
                <span className="text-muted-foreground">
                  {r.description}{" "}
                  <span className="text-foreground/70">e.g. {r.example}</span>
                </span>
              </div>
            ))}
          </div>

          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            Three presets set the rules in one click:{" "}
            <span className="font-medium text-foreground">Light</span> (duplicates
            and whitespace),{" "}
            <span className="font-medium text-foreground">Balanced</span> (adds
            filler and wordy phrases) and{" "}
            <span className="font-medium text-foreground">Aggressive</span> (every
            rule).
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <h3 className="text-lg font-semibold tracking-tight">What is never changed</h3>
          </div>
          <p className="mt-1.5 text-[16px] leading-relaxed text-muted-foreground">
            Some text must stay exactly as written, so the compressor skips it
            under every rule:
          </p>
          <ul className="mt-3 space-y-1.5 text-[16px] leading-relaxed text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">Code</span> — fenced
              blocks and <code className={code}>`inline code`</code>.
            </li>
            <li>
              <span className="font-medium text-foreground">Quoted text</span> —
              anything inside double quotes, such as an example the model should
              copy.
            </li>
            <li>
              <span className="font-medium text-foreground">Template variables</span>{" "}
              — <code className={code}>{"{{name}}"}</code> and{" "}
              <code className={code}>{"${value}"}</code>.
            </li>
          </ul>
        </Card>

        <Card className="p-5">
          <h3 className="text-lg font-semibold tracking-tight">Example</h3>
          <p className="mt-1.5 text-[16px] leading-relaxed text-muted-foreground">
            The same request before and after the <em>Balanced</em> preset:
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Before
              </p>
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-muted p-4 font-mono text-xs leading-relaxed">
                {`I would like you to please go ahead and summarize the following article for me. Kindly make sure the summary is short in order to save time.

Due to the fact that I am very busy, I need it as soon as possible.   Make use of    bullet points.`}
              </pre>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                After
              </p>
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-muted p-4 font-mono text-xs leading-relaxed">
                {`Summarize the following article for me. Make sure the summary is short to save time.

Because I am very busy, I need it ASAP. Use bullet points.`}
              </pre>
            </div>
          </div>
          <p className="mt-3 text-[16px] leading-relaxed text-muted-foreground">
            The instruction is the same; the padding is gone. Paste your own
            prompt above to see the exact token savings for your model.
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-violet-500" />
            <h3 className="text-lg font-semibold tracking-tight">Reading the savings</h3>
          </div>
          <p className="mt-1.5 text-[16px] leading-relaxed text-muted-foreground">
            The three cards compare the <em>original</em> and{" "}
            <em>compressed</em> token counts for the model you selected, plus the
            difference as a number, a percentage and — when pricing is known —
            the input cost saved per call. Counts differ between models because
            each uses its own tokenizer, so a rewrite that helps on one model may
            save a different amount on another. If the tokenizer API can&apos;t
            be reached, the page falls back to character counts and says so.
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <TriangleAlert className="h-4 w-4 text-amber-500" />
            <h3 className="text-lg font-semibold tracking-tight">Limits to know about</h3>
          </div>
          <ul className="mt-3 space-y-1.5 text-[16px] leading-relaxed text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">Shorter isn&apos;t always better.</span>{" "}
              Removing &ldquo;please&rdquo; or a greeting can change how a model
              responds. Test the compressed prompt before you rely on it.
            </li>
            <li>
              <span className="font-medium text-foreground">Contractions often save nothing.</span>{" "}
              &ldquo;do not&rdquo; and &ldquo;don&apos;t&rdquo; can cost the same
              number of tokens, so that rule is off by default — check the count.
            </li>
            <li>
              <span className="font-medium text-foreground">It only knows its phrase lists.</span>{" "}
              The rules are pattern-based rewrites, not a smart rewriter, so
              wordy text they don&apos;t recognise is left as it is.
            </li>
            <li>
              <span className="font-medium text-foreground">Emphasis can matter.</span>{" "}
              Stripping <code className={code}>**bold**</code> or emoji is
              off unless you pick the Aggressive preset, since some prompts use
              them to stress a rule.
            </li>
          </ul>
        </Card>
      </div>
    </section>
  );
}
