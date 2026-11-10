import { EyeOff, ListChecks, MousePointerClick, Replace, ShieldCheck, TriangleAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PII_TYPES, type PiiType } from "@/lib/pii/detectors";

const code = "rounded bg-muted px-1 py-0.5 font-mono text-xs";

/** How each built-in type is recognised, shown next to its example. */
const HOW: Record<PiiType, string> = {
  secret: "Known key formats: OpenAI-style sk-, AWS AKIA, GitHub tokens, Slack tokens, Google API keys and JWTs.",
  email: "Standard name@domain.tld addresses.",
  url: "Web links starting with http:// or https://.",
  card: "13–19 digits that also pass the Luhn checksum, so random digit strings aren't flagged.",
  ssn: "US format ###-##-####, skipping ranges that can't be real (000, 666, 9xx).",
  aadhaar: "12 digits starting 2–9 that pass the Verhoeff checksum Aadhaar numbers use.",
  pan: "Indian PAN format: five letters, four digits, one letter.",
  ip: "IPv4 addresses where every part is between 0 and 255.",
  phone: "10–15 digits, with optional +, spaces, dashes and brackets.",
};

/**
 * Static, crawlable explainer rendered below the redaction tool, mirroring the
 * other tool pages. It carries the page's single <h1>. The type table is built
 * from the real detector list so it always matches what the tool detects.
 */
export function PiiContent() {
  return (
    <section className="space-y-8 border-t pt-8">
      {/* Hero */}
      <div className="space-y-3">
        <h1 className="text-2xl font-bold tracking-tight">
          Free PII Redaction Tool for Prompts
        </h1>
        <p className="text-[16px] leading-relaxed text-muted-foreground">
          PromptTokenizer&apos;s PII redactor finds personal and sensitive
          details in a prompt — emails, phone numbers, card and ID numbers, IP
          addresses, links and API keys — and replaces them before you paste the
          text into a chatbot, share it, or send it to an API. You choose which
          types to remove, see every change highlighted, and keep any item you
          want to leave in. Everything runs in your browser, so the text you
          check is never uploaded.
        </p>
      </div>

      <div className="space-y-5">
        <h2 className="text-xl font-semibold tracking-tight">How PII redaction works</h2>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <EyeOff className="h-4 w-4 text-sky-500" />
            <h3 className="text-lg font-semibold tracking-tight">Why redact a prompt</h3>
          </div>
          <p className="mt-1.5 text-[16px] leading-relaxed text-muted-foreground">
            Whatever you paste into an AI tool or send through an API leaves your
            device, and may be logged, stored or reviewed by someone else. Pasted
            support tickets, emails, logs and code often contain customer
            details or live credentials without anyone noticing. Redacting first
            means the model still gets the structure of the request, with
            placeholders where the sensitive values were. Because the redaction
            happens here, in your browser, the original never has to be sent
            anywhere to be cleaned.
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-violet-500" />
            <h3 className="text-lg font-semibold tracking-tight">What it detects</h3>
          </div>
          <p className="mt-1.5 text-[16px] leading-relaxed text-muted-foreground">
            Each type is a toggle with a count of how many matches it would
            find, even while it&apos;s switched off. Where a number has a
            built-in checksum, the tool checks it, which keeps ordinary numbers
            from being flagged by mistake.
          </p>

          <div className="mt-4 space-y-2">
            {PII_TYPES.map((t) => (
              <div
                key={t.id}
                className="grid gap-x-4 gap-y-1 rounded-md bg-muted/40 px-3 py-2.5 text-[15px] sm:grid-cols-[11rem_1fr]"
              >
                <span className="font-medium text-foreground">{t.label}</span>
                <span className="text-muted-foreground">
                  {HOW[t.id]} <span className="text-foreground/70">e.g. {t.example}</span>
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
            Need something specific, like employee IDs or internal project
            names? Add a <span className="font-medium text-foreground">custom
            pattern</span> — either a list of exact words or a regular
            expression — and it&apos;s applied first, ahead of the built-in
            detectors. Custom patterns can be edited or deleted any time and are
            saved only in this browser.
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Replace className="h-4 w-4 text-emerald-500" />
            <h3 className="text-lg font-semibold tracking-tight">Choose how values are replaced</h3>
          </div>
          <ul className="mt-3 space-y-1.5 text-[16px] leading-relaxed text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">Numbered</span> —{" "}
              <code className={code}>[EMAIL_1]</code>. The same value always gets
              the same number, so a model can still tell that two mentions refer
              to the same address.
            </li>
            <li>
              <span className="font-medium text-foreground">Label</span> —{" "}
              <code className={code}>[EMAIL]</code>. Simplest, but identical
              values look the same as different ones.
            </li>
            <li>
              <span className="font-medium text-foreground">Partial mask</span> —{" "}
              <code className={code}>j***@example.com</code>. Keeps a hint of the
              original: the last four characters of numbers, the first letter and
              domain of emails, and just the site of a link.
            </li>
          </ul>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <MousePointerClick className="h-4 w-4 text-amber-500" />
            <h3 className="text-lg font-semibold tracking-tight">Review every change</h3>
          </div>
          <p className="mt-1.5 text-[16px] leading-relaxed text-muted-foreground">
            In the result, each redacted item is highlighted. Hover it to see the
            original value, and click it to keep that value instead — useful when
            something is flagged but harmless, such as a public company URL.
            Clicking applies to every occurrence of that same value. When you&apos;re
            happy, copy the cleaned text.
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <TriangleAlert className="h-4 w-4 text-amber-500" />
            <h3 className="text-lg font-semibold tracking-tight">Limits to know about</h3>
          </div>
          <ul className="mt-3 space-y-1.5 text-[16px] leading-relaxed text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">Names and addresses aren&apos;t detected.</span>{" "}
              Finding them needs a language model, which this tool doesn&apos;t
              use. Add them as custom words if you know them.
            </li>
            <li>
              <span className="font-medium text-foreground">Detection is best-effort.</span>{" "}
              Unusual formats, numbers broken up by other text, or types the tool
              doesn&apos;t cover can be missed. Always read the result before
              sharing it.
            </li>
            <li>
              <span className="font-medium text-foreground">Some false positives are normal.</span>{" "}
              A valid-looking number that isn&apos;t personal can be flagged — click
              it to keep it.
            </li>
            <li>
              <span className="font-medium text-foreground">It is not a compliance tool.</span>{" "}
              It can&apos;t promise the output is fully anonymised, so don&apos;t
              rely on it alone for legal or regulatory requirements.
            </li>
          </ul>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <h3 className="text-lg font-semibold tracking-tight">Your text stays on your device</h3>
          </div>
          <p className="mt-1.5 text-[16px] leading-relaxed text-muted-foreground">
            Detection and replacement are done by code running in this page. The
            text you paste is not sent to the tokenizer API or any server. Only
            your choices — which types are on, the replacement style and your
            custom patterns — are saved, in your browser&apos;s local storage,
            and never your text.
          </p>
        </Card>
      </div>
    </section>
  );
}
