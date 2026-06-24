# 18 — Glossary

Terminology used across this documentation and in the UI itself.

## Tokenization concepts

**Token** — The fundamental unit of text a language model processes. A token may
be a whole word, a sub-word fragment, a single character, punctuation, or part of
an emoji, depending on the tokenizer.

**Tokenization** — The process of breaking text into tokens so an LLM can read
it. The same text can produce very different token counts under different
tokenizers.

**Tokenizer** — The component that converts raw text into tokens and maps tokens
to numeric IDs (and back). In this app, tokenization happens on the API, not in
the browser.

**Token ID** — The integer a tokenizer assigns to a token (an index into the
model's vocabulary). The UI shows these as chips in the "Token IDs" view.

**Encoding / tokenizer_ref** — The specific tokenizer scheme a model uses, e.g.
`cl100k_base`, `o200k_base`. Surfaced in the UI as a model's "encoding" and in
Compare as `resolved_tokenizer`.

**BPE (Byte-Pair Encoding)** — A common subword tokenization algorithm (used by
GPT-family models) that merges frequent byte/character pairs into tokens. Related
schemes: **WordPiece**, **SentencePiece**.

**Subword tokenization** — Splitting words into smaller reusable pieces (e.g.
`Tokenization` → `Token` + `ization`) so rare words are still representable.

**Special tokens** — Reserved tokens that mark structure (`<|endoftext|>`,
BOS/EOS, padding, chat-template markers). They count toward the context window
even though they aren't part of the user's visible text.

**Context window** — The maximum number of tokens a model can attend to in a
single request (input + output). The UI's Context Usage card compares your
`token_count` against the selected model's `context_window`.

**Tokens-per-word ratio** — `token_count / word_count`; a measure of how
"expensive" text is for a model. Clean English prose averages ~1.3; code and
non-Latin scripts push it higher. Shown as the "Tokens / Word" stat with an
inverse "word density" sub-line.

**Estimated input cost** — The approximate price to send the input at the model's
input token rate, computed by the API. May be `null` (→ "Pricing unavailable").

## Project / domain terms

**Model** — A selectable LLM/tokenizer entry. Internally a normalized `Model`
(see [Data Models](./07-data-models.md)) derived from the API's `RawModel`.

**Family / group** — The grouping key for the model dropdown (from the API's
`group` field), e.g. an OpenAI GPT-4 family. The dropdown preserves the API's
ordering.

**Deprecated / legacy model** — A model flagged via `deprecated: true` or a
`status` of `deprecated`/`legacy`; surfaced so users can avoid it.

**Expensive word** — In the insight table, a word that fragments into more than
one token; the table ranks the top 10 by token count.

**Frequent token** — A token that repeats more than once; the table ranks the
top 10 by frequency.

**Pre-warm** — A fire-and-forget `/health` ping fired before React mounts to
start waking a sleeping free-tier backend (`prewarm()`).

**Keep-warm** — The 10-minute background `/health` poll (`useHealth`) that keeps
the backend awake while a tab is open.

**Resolved tokenizer** — In Compare results, the actual tokenizer the backend
mapped a model to (`resolved_tokenizer`), shown per row.

**Compare modes** — The Compare page has two modes (added `7e0b235`): **Across
models** (one text, several models — which tokenizer is most efficient/cheapest)
and **Across prompts** (one model, two prompts — which prompt costs fewer
tokens). Both are composed client-side from `/tokenize` calls.

**"vs best"** — In the across-models comparison, each model's percentage of extra
tokens relative to the most efficient (lowest-count) model; the best shows
`best`. (Column hidden on mobile — see ISSUE-003.)

**Fewest tokens** — In the across-prompts comparison, the flag on the prompt with
the lowest token count; the other prompt shows how many more tokens (and what %)
it costs.

## Technical / stack terms

**SPA (Single-Page Application)** — A web app that loads one HTML shell and
renders all views client-side via JS. This project is an SPA with hash routing.

**Hash routing** — Client-side routing using the URL fragment (`#/`, `#/compare`)
so navigation never hits the server. Implemented in `useHashRoute`.

**React Query (TanStack Query)** — The server-state library handling fetching,
caching, retries, and background refetch. Queries (`useModels`, `useHealth`) vs
mutations (`useTokenize`, `useCompare`, `useComparePrompts`).

**Query / Mutation** — React Query terms: a *query* reads/caches data; a
*mutation* performs a write/action (here, the tokenize POSTs, including the
compare fan-outs).

**shadcn/ui** — A pattern of copying accessible, Radix-based component primitives
into the repo (`src/components/ui/*`) and styling them with Tailwind, rather than
importing a component library.

**Radix UI** — The headless, accessible primitive library underneath the
shadcn/ui components (Popover, Tooltip, Progress, etc.).

**cmdk** — The command-menu/fuzzy-search library powering the model selectors'
search.

**cva (class-variance-authority)** — Utility for defining type-safe class
variants (used by `Button`, `Badge`).

**`cn()`** — The project's class-merge helper (`clsx` + `tailwind-merge`).

**Design token** — A named CSS variable (e.g. `--primary`, `--background`) that
defines a themeable value; mapped into Tailwind color names.

**Normalization** — Converting an external/raw shape into the app's internal
shape: `normalizeModel` (raw → `Model`) and `normalizeApiError` (any error →
`NormalizedApiError`).

**Defensive types** — The convention of marking API fields optional/nullable so
the UI never crashes on payload drift.

**Cold start** — The delay when a sleeping (free-tier) backend instance must spin
up before serving the first request; mitigated by pre-warm + keep-warm.

**HMR (Hot Module Replacement)** — Vite's dev feature that swaps changed modules
in the running app without a full reload.
