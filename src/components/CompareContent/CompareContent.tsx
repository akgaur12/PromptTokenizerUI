import { Coins, GitCompare, Layers, TriangleAlert } from "lucide-react";
import { Card } from "@/components/ui/card";

/**
 * Short, crawlable explainer rendered below the compare tool, mirroring the
 * other pages. It carries the page's single <h1>.
 */
export function CompareContent() {
  return (
    <section className="space-y-8 border-t pt-8">
      {/* Hero */}
      <div className="space-y-3">
        <h1 className="text-2xl font-bold tracking-tight">
          Compare LLM Tokenizers &amp; Prompt Token Counts
        </h1>
        <p className="text-[16px] leading-relaxed text-muted-foreground">
          PromptTokenizer&apos;s compare tool shows how many tokens the same
          text costs on different models, or how two versions of a prompt stack
          up on one model. Use it to pick a more efficient model for your
          workload, or to check that a rewrite really is shorter before you ship
          it.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-sky-500" />
            <h3 className="text-lg font-semibold tracking-tight">Across models</h3>
          </div>
          <p className="mt-1.5 text-[16px] leading-relaxed text-muted-foreground">
            Pick two or more models (up to ten) and one text. The table ranks
            them from fewest tokens to most, with each model&apos;s tokenizer and
            estimated input cost. The model with the fewest tokens is marked{" "}
            <span className="font-medium text-foreground">best</span>, and every
            other model shows <span className="font-medium text-foreground">+X%</span>{" "}
            more tokens than it. A model that fails is listed at the bottom
            without hiding the rest.
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <GitCompare className="h-4 w-4 text-violet-500" />
            <h3 className="text-lg font-semibold tracking-tight">Across prompts</h3>
          </div>
          <p className="mt-1.5 text-[16px] leading-relaxed text-muted-foreground">
            Choose one model and paste two prompts, A and B. Both are tokenized
            with the same tokenizer, and the one with{" "}
            <span className="font-medium text-foreground">fewer tokens</span> is
            flagged, with the other showing how many more tokens it costs. It&apos;s
            a quick way to test a shorter wording of the same instruction.
          </p>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-amber-500" />
            <h3 className="text-lg font-semibold tracking-tight">Why the same text differs between models</h3>
          </div>
          <p className="mt-1.5 text-[16px] leading-relaxed text-muted-foreground">
            Each model family ships its own tokenizer with its own vocabulary, so
            identical text can split into different numbers of tokens — often most
            visibly for code, non-English languages and emoji. Fewer tokens means
            more room in the context window and less to pay for, but price per
            token also differs between models. A model with the fewest tokens
            isn&apos;t automatically the cheapest, so check the{" "}
            <span className="font-medium text-foreground">Est. cost</span> column
            as well as the token counts.
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <TriangleAlert className="h-4 w-4 text-amber-500" />
            <h3 className="text-lg font-semibold tracking-tight">Keep in mind</h3>
          </div>
          <ul className="mt-3 space-y-1.5 text-[16px] leading-relaxed text-muted-foreground">
            <li>
              Costs are <span className="font-medium text-foreground">estimates of input only</span>.
              Output tokens, caching discounts and pricing changes aren&apos;t
              included.
            </li>
            <li>
              Counts are for your text on its own. Chat requests add a few
              special tokens per message, so real API usage runs slightly higher.
            </li>
            <li>
              Token count measures cost and context use, not answer quality —
              compare models on quality separately.
            </li>
          </ul>
        </Card>
      </div>
    </section>
  );
}
