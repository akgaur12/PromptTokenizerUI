import { Coins, Cpu, Gauge, Ruler, Sparkles, Tags } from "lucide-react";
import { Card } from "@/components/ui/card";

/** A single "term → definition" entry rendered as a titled card. */
function Term({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 text-[16px] leading-relaxed text-muted-foreground">
        {children}
      </p>
    </Card>
  );
}

/**
 * Static, crawlable landing content rendered below the interactive app.
 *
 * React SPAs ship almost no text in their initial HTML, which makes them hard
 * for search engines to index. This section provides real, keyword-rich copy
 * (headings + prose) so the page can rank for token-counter / tokenizer
 * queries. It carries the page's single <h1>, an explainer on tokenization,
 * and an FAQ.
 */
export function LandingContent() {
  return (
    <section className="space-y-8 border-t pt-8">
      {/* Hero */}
      <div className="space-y-3">
        <h1 className="text-2xl font-bold tracking-tight sm:text-2xl">
          Free LLM Token Counter &amp; Visualizer
        </h1>
        <p className="text-[16px] leading-relaxed text-muted-foreground">
          PromptTokenizer is a free online token counter and tokenizer
          visualizer for large language models. Paste any text to instantly see
          how models like GPT-4, GPT-5, Claude, and Llama break it into
          tokens — complete with exact token counts, token IDs, the
          token-to-word ratio, and how much of the model&apos;s context window
          your prompt uses. No sign-up, no setup, and your text never leaves
          your browser session.
        </p>
      </div>

      {/* Understanding tokenization */}
      <div className="space-y-5">
        <h2 className="text-xl font-semibold tracking-tight sm:text-1.5xl">
          Understanding tokenization
        </h2>

        <div className="grid text-[16px] gap-4 sm:grid-cols-3">
          <Term title="Tokenization">
            The process of breaking text into smaller units called{" "}
            <em>tokens</em> so that Large Language Models (LLMs) can understand
            and process the input. Depending on the tokenizer, tokens may
            represent words, subwords, characters, punctuation, or special
            symbols.
          </Term>
          <Term title="Tokenizer">
            The component that converts raw text into tokens and maps those
            tokens to numerical IDs that an AI model can interpret. It also
            performs the reverse operation, converting token IDs back into
            human-readable text.
          </Term>
          <Term title="Token">
            The fundamental unit of text processed by a language model. A token
            can be a whole word, part of a word, a single character, punctuation
            mark, or special symbol, depending on the tokenization method being
            used.
          </Term>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-amber-500" />
            <h3 className="text-lg font-semibold tracking-tight">
              Why tokenization matters
            </h3>
          </div>
          <p className="mt-1.5 text-[16px] leading-relaxed text-muted-foreground">
            Tokenization is a critical step in modern AI systems. The number of
            tokens in a prompt directly affects model context limits, processing
            speed, latency, and cost. Understanding how text is tokenized helps
            developers optimize prompts, estimate API usage, and build more
            efficient LLM-powered applications.
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-sky-500" />
            <h3 className="text-lg font-semibold tracking-tight">
              Tokens aren't words
            </h3>
          </div>
          <p className="mt-1.5 text-[16px] leading-relaxed text-muted-foreground">
            A handy rule of thumb for English text: roughly{" "}
            <span className="font-medium text-foreground">~4 characters</span> or{" "}
            <span className="font-medium text-foreground">~0.75 words</span> per
            token — so about{" "}
            <span className="font-medium text-foreground">
              100 tokens ≈ 75 words
            </span>
            . It's only an estimate; the exact count depends on the model and the
            text itself, which is why the stats above are measured, not guessed.
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-violet-500" />
            <h3 className="text-lg font-semibold tracking-tight">
              Token-to-Word Ratio (tokens per word)
            </h3>
          </div>
          <p className="mt-1.5 text-[16px] leading-relaxed text-muted-foreground">
            How “expensive” your text is for an LLM. Clean English prose averages{" "}
            <span className="font-medium text-foreground">~1.3 tokens/word</span>{" "}
            — the higher the ratio, the more tokens each word costs.
          </p>

          <div className="mt-4 space-y-1.5">
            {[
              { range: "1.0–1.3", meaning: "Efficient prose", color: "bg-emerald-500" },
              { range: "1.5–2.0", meaning: "Mixed prose + technical terms", color: "bg-sky-500" },
              { range: "2.0–4.0", meaning: "Code-heavy or symbol-rich", color: "bg-amber-500" },
              { range: "4.0+", meaning: "Non-Latin script or heavy special chars", color: "bg-rose-500" },
            ].map((row) => (
              <div
                key={row.range}
                className="flex items-center gap-3 rounded-md bg-muted/40 px-3 py-2 text-[15px]"
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${row.color}`} />
                <span className="w-16 shrink-0 font-mono tabular-nums font-medium text-foreground">
                  {row.range}
                </span>
                <span className="text-muted-foreground">{row.meaning}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-x-6 gap-y-1 text-[15px] leading-relaxed text-muted-foreground sm:grid-cols-2">
            <p>
              <span className="font-medium text-foreground">↑ Raises it:</span>{" "}
              code, symbols, rare/technical words, non-Latin scripts, emoji.
            </p>
            <p>
              <span className="font-medium text-foreground">↓ Lowers it:</span>{" "}
              common short words and repetitive, familiar text.
            </p>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-sky-500" />
            <h3 className="text-lg font-semibold tracking-tight">
              How does GPT-4 tokenize text?
            </h3>
          </div>
          <p className="mt-1.5 text-[16px] leading-relaxed text-muted-foreground">
            GPT-4 and other modern models don&apos;t read text word by word.
            Instead, a <em>tokenizer</em> splits your input into smaller units
            called tokens using a byte-pair encoding (BPE) scheme. A token might
            be a whole common word, a sub-word fragment, a single character, a
            punctuation mark, or part of an emoji. Each token maps to a numeric
            ID that the model actually processes. Paste your text into the tool
            above to see the exact split for any supported model — the
            boundaries differ from one model family to the next.
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" />
            <h3 className="text-lg font-semibold tracking-tight">
              What affects token count
            </h3>
          </div>
          <p className="mt-1.5 text-[16px] leading-relaxed text-muted-foreground">
            The same idea can cost very different numbers of tokens. Things that
            tend to increase the count:
          </p>
          <ul className="mt-3 space-y-1.5 text-[16px] leading-relaxed text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">Whitespace</span> —
              leading spaces, tabs, and newlines are tokens too.
            </li>
            <li>
              <span className="font-medium text-foreground">Capitalization</span>{" "}
              — <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">hello</code>{" "}
              and{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">HELLO</code>{" "}
              can tokenize differently.
            </li>
            <li>
              <span className="font-medium text-foreground">Rare words</span> —
              uncommon or made-up words split into more subword pieces.
            </li>
            <li>
              <span className="font-medium text-foreground">
                Non-English languages
              </span>{" "}
              — often use noticeably more tokens per word.
            </li>
            <li>
              <span className="font-medium text-foreground">Code & symbols</span>{" "}
              — punctuation-heavy text fragments into many small tokens.
            </li>
            <li>
              <span className="font-medium text-foreground">Emoji</span> — a
              single emoji like 🤖 can take several tokens.
            </li>
          </ul>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Tags className="h-4 w-4 text-emerald-500" />
            <h3 className="text-lg font-semibold tracking-tight">
              Special tokens
            </h3>
          </div>
          <p className="mt-1.5 text-[16px] leading-relaxed text-muted-foreground">
            Beyond your text, models use reserved <em>special tokens</em> to mark
            structure. These are added automatically and still count toward your
            context window:
          </p>
          <ul className="mt-3 space-y-1.5 text-[16px] leading-relaxed text-muted-foreground">
            <li>
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
                &lt;|endoftext|&gt;
              </code>{" "}
              — signals the boundary between documents.
            </li>
            <li>
              <span className="font-medium text-foreground">BOS / EOS</span> —
              beginning- and end-of-sequence markers.
            </li>
            <li>
              <span className="font-medium text-foreground">Padding</span> —
              fills sequences to a fixed length in a batch.
            </li>
            <li>
              <span className="font-medium text-foreground">
                Chat-template tokens
              </span>{" "}
              — markers wrapping each{" "}
              <span className="font-medium">system</span>,{" "}
              <span className="font-medium">user</span>, and{" "}
              <span className="font-medium">assistant</span> message. This is why
              chat requests carry a little extra token overhead per message.
            </li>
          </ul>
        </Card>

        <Card className="p-5">
          <h3 className="text-lg font-semibold tracking-tight">Example</h3>
          <p className="mt-1.5 text-[16px] leading-relaxed text-muted-foreground">
            A subword tokenizer might split the sentence{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              Tokenization is fun!
            </code>{" "}
            into five tokens, each mapped to a numerical ID:
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-muted p-4 font-mono text-xs leading-relaxed">
            {`Tokens:     ["Token", "ization", " is", " fun", "!"]
Token IDs:  [ 11328,   1634,      374,    2523,   0 ]`}
          </pre>
          <p className="mt-3 text-[16px] leading-relaxed text-muted-foreground">
            Notice that <span className="font-medium">Tokenization</span> is
            broken into the subwords <span className="font-medium">Token</span> +{" "}
            <span className="font-medium">ization</span>, and that leading spaces
            stay attached to the following token. Exact tokens and IDs vary by
            model — paste your own text above to see how each model splits it.
          </p>
        </Card>
      </div>
    </section>
  );
}
