# 01 — Project Overview & Objectives

## What is PromptTokenizer UI?

PromptTokenizer UI is a free, browser-based **token counter and tokenizer
visualizer** for Large Language Models (LLMs). A user pastes text, picks a model
(GPT-4, GPT-5, Claude, Llama, etc.), and instantly sees:

- how the text is split into **tokens** (rendered as colored blocks),
- the numeric **token IDs** behind those tokens,
- aggregate **statistics** (tokens, words, characters, tokens-per-word ratio,
  estimated input cost),
- how much of the model's **context window** the prompt consumes,
- **analytics tables** — the most "expensive" (multi-token) words and the most
  frequently repeated tokens,
- and a side-by-side **comparison** of the same text across multiple models.

It is intentionally modeled on the OpenAI Tokenizer experience, with a polished,
modern UI inspired by Linear / Vercel / Stripe.

## Who is it for?

- **Prompt engineers** who want to keep prompts inside a context window and
  understand why some text costs more tokens than others.
- **Application developers** estimating API cost and latency before shipping.
- **Researchers / learners** building intuition for how BPE / subword
  tokenizers actually segment text.

## Objectives (goals)

1. **Accuracy over guessing.** Token counts are *measured* by a real backend
   tokenizer, never estimated client-side. The UI never hardcodes the model
   list — it is fetched live from the API and grouped by family.
2. **Instant, legible visualization.** Tokens render inline preserving the
   original whitespace/formatting, with a deterministic pastel palette so the
   same token index always gets the same color.
3. **Zero friction.** No sign-up, no setup, no configuration for the end user.
   Text never leaves the browser except to be tokenized by the API.
4. **Graceful degradation.** The UI must never crash on a slightly different API
   payload, a missing field, a `null` price, or an offline backend. Every type
   is defensive and every error becomes a friendly toast.
5. **SEO-discoverable.** Although it is a SPA, it ships real crawlable landing
   copy and structured data so it can rank for tokenizer/token-counter queries.

## Non-goals

- **No client-side tokenization.** The app does not bundle `tiktoke`/`tiktoken`,
  SentencePiece, or any WASM tokenizer. It is a thin, well-designed client over
  the API.
- **No authentication or user accounts.** There is nothing to log in to.
- **No persistence.** Nothing is stored in a database or `localStorage` except
  the theme preference (handled by `next-themes`).
- **No server-side rendering.** It is a static SPA; the only "SSR-shaped" code
  is the `useSyncExternalStore` server snapshot, kept purely for React 18 strict
  mode safety.

## Feature summary

| Feature | Where it lives | Notes |
| ------- | -------------- | ----- |
| Unified searchable model dropdown | `ModelSelector` | Virtualizable, keyboard-navigable, grouped by family |
| Multi-model selector (Compare) | `MultiModelSelector` | Up to 10 models, removable chips |
| Auto-resizing prompt input | `PromptInput` | Live word/char counters, ⌘/Ctrl+Enter submit |
| Statistics dashboard | `StatsCards` | Animated counters; tokens, words, chars, ratio, cost, context usage |
| Context window usage bar | `ContextUsage` | Warning/critical thresholds at 70% / 90% |
| Token blocks viewer | `TokenViewer` / `TokenBlocks` | Pastel blocks, whitespace visualized, click-to-copy, hover info |
| Token ID chips viewer | `TokenIdChips` | Click to copy, hover reveals original token, "copy all" |
| Insight tables | `TokenTables` | Top-10 expensive words & top-10 frequent tokens |
| Compare across models | `CompareResults` | Ranked table by tokens **and est. cost**, "+X% vs best" |
| Compare across prompts | `ComparePromptsResults` | Two prompts, one model, side-by-side token/cost cards (added `7e0b235`) |
| Raw JSON viewer | `JsonViewer` | Collapsible, syntax-highlighted, copyable (available component) |
| Health widget | `HealthWidget` | Status dot + version + RSS/VMS memory |
| Dark / light theme | `theme-provider` / `ThemeToggle` | Defaults to dark, follows system |
| SEO landing content | `LandingContent` | Crawlable explainer + the page's single `<h1>` |

> See [Core Modules & Components](./05-core-modules.md) for the full breakdown of
> each feature's implementation.

## A note on the two "halves" of the system

This repository is **only the frontend**. The tokenization intelligence — the
actual encoders, the model catalog, pricing data, context-window metadata — all
lives in the separate **PromptTokenizer API** service. This documentation
describes the contracts the UI depends on (see
[API Integration](./06-api-integration.md)) but the API's internals are out of
scope here.
