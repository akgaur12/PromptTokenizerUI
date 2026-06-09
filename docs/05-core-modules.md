# 05 — Core Modules & Components

This is the feature-by-feature reference. Each entry covers what the component
does, its props/contract, and the implementation details worth knowing.

---

## Pages

### `TokenizerPage` — `src/pages/TokenizerPage.tsx`

The main experience. Composition:

```
Header
└─ main
   ├─ Intro (h2 + description)
   ├─ Card: Model (ModelSelector) + PromptInput
   ├─ StatsCards
   ├─ TokenViewer
   ├─ TokenTables
   └─ LandingContent (SEO)
Footer
```

Key behaviors:

- **Auto-select default model.** Once `useModels()` resolves, it picks `gpt-5`,
  else the first non-deprecated model, else the first model
  (`TokenizerPage.tsx:26`).
- **Context window resolution.** Prefers the selected model's `context_window`,
  falling back to whatever the tokenize response echoes back
  (`TokenizerPage.tsx:39`).
- **Tokenize request** always sets `include_tokens: true` and
  `include_token_ids: true` so the viewer and tables have data
  (`TokenizerPage.tsx:46`).
- **Clear** resets both the text and the mutation state (`tokenizeMutation.reset()`).
- Has a built-in **sample** string injected by "Try a sample".

### `ComparePage` — `src/pages/ComparePage.tsx`

Multi-model comparison. Receives its state via the `session` prop (hoisted to
`<App>`), not local `useState`, so it survives navigation.

- Requires **≥ 2 models**; otherwise shows a toast and aborts
  (`ComparePage.tsx:28`).
- Caps selection at **`MAX_MODELS = 10`**.
- Reuses `PromptInput` with customized labels (`actionLabel="Compare"`,
  `loadingLabel="Comparing…"`).
- Renders `CompareResults` with the model catalog so it can show friendly names.

---

## Model selection

### `ModelSelector` — `src/components/ModelSelector/ModelSelector.tsx`

Single-select combobox (Popover + cmdk Command). Used on the Tokenizer page.

- **Props:** `{ value: string | undefined; onChange: (model: Model) => void }`.
- Loads models via `useGroupedModels()`; shows a `Skeleton` while loading and an
  inline **Retry** affordance on error (`ModelSelector.tsx:40`).
- Options are **grouped by family**, with the cmdk `value` set to
  `"<name> <id> <family>"` so fuzzy search matches name, id, or family
  (`ModelSelector.tsx:82`).
- The popover content width is pinned to the trigger width via the
  `--radix-popover-trigger-width` CSS variable.

### `MultiModelSelector` — `src/components/ModelSelector/MultiModelSelector.tsx`

Multi-select variant for Compare. Mirrors `ModelSelector` but:

- **Props:** `{ value: string[]; onChange: (ids: string[]) => void; max?: number }`.
- Toggles ids in/out of the array and **keeps the popover open** so several
  models can be picked in one session (`MultiModelSelector.tsx:54`).
- Enforces `max`: once at the limit, unselected options are disabled and dimmed.
- Renders selected models as **removable chips** below the trigger, each with an
  `X` button, plus a helper line (`Pick up to N` / `Maximum of N selected`).

---

## Input

### `PromptInput` — `src/components/PromptInput/PromptInput.tsx`

The shared text input used by both pages.

- **Props:** `value`, `onChange`, `onTokenize`, `onTrySample`, `onClear`,
  `isLoading`, `disabled`, optional `actionLabel` (default `"Tokenize"`) and
  `loadingLabel` (default `"Tokenizing…"`).
- **Auto-resize:** a `useLayoutEffect` sets the textarea height to its
  `scrollHeight`, capped at `MAX_AUTO_HEIGHT = 200px` after which it scrolls
  (`PromptInput.tsx:38`).
- **Live counters:** words (`countWords`) and characters shown in the header row.
- **Keyboard shortcut:** ⌘/Ctrl + Enter submits when `canSubmit`
  (`PromptInput.tsx:49`).
- **Adaptive button:** shows "Try a sample" when empty, "Clear" when there's
  text; the primary button shows a spinner + `loadingLabel` while in flight.
- `canSubmit = trimmed text > 0 && !disabled && !isLoading`.

---

## Statistics

### `StatsCards` — `src/components/StatsCards/StatsCards.tsx`

A responsive 6-card grid (2 cols mobile → 6 cols on `xl`). Cards:

1. **Total Tokens** (`token_count`)
2. **Total Words** (`word_count`)
3. **Total Characters** (`character_count`)
4. **Tokens / Word** ratio — `token_count / word_count`, with a "word density"
   sub-line (`word_count / token_count * 100`) (`StatsCards.tsx:38`)
5. **Estimated Input Cost** — formatted currency, or "Pricing unavailable" when
   `estimated_input_cost` is `null`/`undefined` (`StatsCards.tsx:30`)
6. **Context Usage** (delegated to `ContextUsageCard`)

Details:

- While loading with no prior data, shows **6 skeleton cards**.
- Numeric cards animate via `useAnimatedNumber`; animation is suppressed when
  there's no data, so **clearing snaps to zero** instead of counting down
  (`StatsCards.tsx:34`).
- The ratio card uses a custom inline `λ` (lambda) SVG glyph as its icon.
- Each card type (`NumberStat`, `RatioStat`, `CostStat`) wraps a shared
  `StatShell` for consistent layout, with per-card accent colors.

### `ContextUsageCard` — `src/components/ContextUsage/ContextUsage.tsx`

- **Props:** `{ tokenCount: number; contextWindow: number | null | undefined }`.
- Computes `pct = min(100, tokenCount / contextWindow * 100)`.
- **Thresholds:** `>= 90%` → `critical` (red), `>= 70%` → `warning` (amber),
  else `ok` (primary) (`ContextUsage.tsx:24`).
- Renders a placeholder ("No context window") when the model has no window
  (e.g. raw encodings), keeping the grid balanced.
- Precision: shows 2 decimals below 1%, otherwise 1 decimal.

---

## Token visualization

### `TokenViewer` — `src/components/TokenViewer/TokenViewer.tsx`

The shell with a segmented **Tokens / Token IDs** toggle.

- **Props:** `{ data?: TokenizeResponse }`.
- Distinguishes "not tokenized yet" (`!data`, shows an empty hint) from
  "tokenized but empty result" (`TokenViewer.tsx:22`).
- **Effective mode fallback:** if the active tab has no data but the other does,
  it auto-switches (`TokenViewer.tsx:28`).
- Tab buttons are disabled when their data is absent and use proper
  `role="tab"` / `aria-selected` semantics.

### `TokenBlocks` — `src/components/TokenViewer/TokenBlocks.tsx`

Renders tokens as inline colored blocks that reproduce the original text flow
(`whitespace-pre-wrap`).

- Each token gets a deterministic pastel color by **index** via `getTokenColor`
  (`token-colors.ts`).
- Colors are applied through CSS custom properties (`--bg/--fg/--dbg/--dfg`) so
  light/dark variants switch with a `dark:` selector
  (`TokenBlocks.tsx:68`).
- **Interactions:** click (or Enter/Space) copies the token; hover/focus shows
  the shared `HoverTooltip` with `{ token, id, length, index }`.
- **Soft render cap:** `INITIAL_CAP = 5000` tokens; beyond that a "N more tokens
  hidden / Show all" control appears to avoid freezing the DOM
  (`TokenBlocks.tsx:13`). The scroll area is capped at `300px`.

### `TokenIdChips` — `src/components/TokenViewer/TokenIdChips.tsx`

Renders numeric token IDs as clickable chips.

- Click copies the single ID; a **"Copy all IDs"** button copies
  `JSON.stringify(tokenIds)` (`TokenIdChips.tsx:34`).
- Hover/focus reveals the original token via the shared tooltip.
- Same `INITIAL_CAP = 5000` and `300px` scroll cap as `TokenBlocks`.

### `HoverTooltip` — `src/components/TokenViewer/HoverTooltip.tsx`

A single shared floating tooltip (rendered via `createPortal` into
`document.body`) driven by hover state. Using one element instead of one Radix
tooltip per token is the key to rendering thousands of blocks smoothly.

- `useHoverTooltip()` exposes `{ state, show(anchor, info), hide() }`. `show`
  positions the tooltip at the anchor's bounding rect.
- **Whitespace preview:** spaces → `·`, newlines → `↵`, tabs → `⇥`; an empty
  token renders as `∅ (empty)` (`HoverTooltip.tsx:39`).
- Displays Token, ID, Length, and Index rows.

---

## Analytics tables

### `TokenTables` — `src/components/TokenTables/TokenTables.tsx`

Two derived insight tables (rendered only once token strings exist):

1. **Top 10 Most Expensive Words** — words that fragment into the most tokens.
2. **Top 10 Most Frequent Tokens** — tokens that repeat most often.

Algorithms (pure functions, memoized):

- **`computeExpensiveWords(tokens)`** (`TokenTables.tsx:202`):
  1. Joins all token strings into `full`.
  2. Builds a `charWord` map (`Int32Array`) tagging each character with the word
     index it belongs to (`-1` for whitespace), via a `/\S+/g` scan.
  3. Walks the tokens, recording each token against every word it overlaps (in
     token order) — so a token spanning punctuation is still attributed
     correctly.
  4. Collapses duplicate words (keeping the highest-cost occurrence), filters to
     `tokens > 1`, sorts by token count then word length, takes top 10.
- **`computeFrequentTokens(tokens, tokenIds)`** (`TokenTables.tsx:254`): tallies
  occurrences keyed by token id (falling back to the token string), filters to
  `frequency > 1`, sorts descending, takes top 10.

Both tables render word fragments with the **same pastel palette** (`ColoredWord`)
so fragmentation is visible at a glance, and use `renderVisibleWhitespace` to
make spaces/newlines/tabs legible.

---

## Comparison

### `CompareResults` — `src/components/CompareResults/CompareResults.tsx`

Ranked side-by-side table of token counts across models.

- **Props:** `{ data?: CompareResponse; isLoading: boolean; models?: Model[] }`.
- Builds `Row[]` (memoized) from `data.results`:
  - Successful rows (`token_count` is a number and no `error`) are sorted
    ascending (most efficient first); failed rows sink to the bottom via
    `Infinity` sort key (`CompareResults.tsx:53`).
  - `rank` is 1-based among successful rows; `deltaPct` is `% more tokens than
    the minimum`; the row equal to `min` (when there's a spread) is flagged
    `isBest`.
  - `name` is resolved from the `models` catalog, falling back to the raw id.
- Failed models show a red "Failed" indicator with the error message as a
  `title` tooltip.
- Columns: `#`, `Model`, `Tokenizer` (hidden on mobile, shown inline instead),
  `Tokens`, `vs best`. A legend explains the `vs best` column.

---

## JSON viewer

### `JsonViewer` — `src/components/JsonViewer/JsonViewer.tsx`

A collapsible, syntax-highlighted, copyable raw-JSON panel.

- **Props:** `{ data: unknown; title?: string; defaultOpen?: boolean }`.
- Pretty-prints with `JSON.stringify(data, null, 2)` (guarded by try/catch).
- Uses `CopyButton` to copy the pretty JSON.
- **`highlightJson`** (`highlight.tsx`) is a tiny dependency-free highlighter: a
  single regex tokenizes the JSON and each token gets a colored span — keys vs
  string values, booleans, `null`, numbers, and punctuation are colored
  distinctly.

> **Note:** `JsonViewer` is a fully built, reusable component but is **not
> currently mounted** by either page. It's available for a "Raw API Response"
> panel and is documented here for completeness.

---

## Health

### `HealthWidget` — `src/components/HealthWidget/HealthWidget.tsx`

Header status pill + popover.

- Uses `useHealth()`; computes `healthy = isHealthy(data) && !isError`.
- A status **dot** (grey while loading, green healthy, red offline) with a
  pinging halo when healthy.
- The popover shows status badge, **Version**, **RSS Memory**, **VMS Memory**
  (formatted via `formatMb`), and an "API may be offline" hint on error.

---

## Layout & chrome

### `Header` — `src/components/Header/Header.tsx`

Sticky, backdrop-blurred header with:

- Responsive logo (square `favicon.svg` on mobile, full `banner.png` on `sm+`).
- Inline nav: **Tokenize** (`#/`) and **Compare** (`#/compare`), with active
  state derived from `useHashRoute` (`Header.tsx:13`).
- `HealthWidget`, GitHub link, a custom inline **Medium** SVG icon, and the
  theme toggle — links use tooltips.

### `LandingContent` — `src/components/LandingContent/LandingContent.tsx`

Static, crawlable SEO copy rendered below the app. Carries the page's single
`<h1>` ("Free LLM Token Counter & Visualizer"), an explainer on tokenization,
the token-to-word ratio guide, a "what affects token count" list, special-tokens
section, and a worked example. See [Performance](./16-performance.md) and the SEO
note in [Build & Deploy](./10-build-deploy.md) for why this exists.

### Theme — `theme-provider.tsx` + `ThemeToggle/ThemeToggle.tsx`

- `ThemeProvider` wraps `next-themes` with `attribute="class"`,
  `defaultTheme="dark"`, `enableSystem`, `disableTransitionOnChange`.
- `ThemeToggle` flips between light/dark; it gates icon rendering on a `mounted`
  flag to avoid a hydration/flash mismatch (`ThemeToggle.tsx:15`).

---

## Shared libraries

### `src/lib/utils.ts`

| Export | Purpose |
| ------ | ------- |
| `cn(...inputs)` | Merge class names (`clsx` + `tailwind-merge`) |
| `formatNumber(n)` | Thousands separators; `—` for null/NaN |
| `formatCost(value, currency)` | Currency formatting with magnitude-based precision (6 digits sub-cent) |
| `formatMb(mb)` | MB→GB formatting for memory readouts |
| `countWords(text)` | Whitespace-split word count |
| `copyToClipboard(text)` | Clipboard API with an `execCommand` fallback for insecure contexts |
| `renderVisibleWhitespace(token)` | Spaces→`·`, newlines→`↵`, tabs→`⇥` |

### `src/lib/token-colors.ts`

A 10-color pastel palette with light/dark fg+bg pairs. `getTokenColor(index)`
returns `PALETTE[index % 10]`, giving stable, repeatable coloring across
re-renders.
