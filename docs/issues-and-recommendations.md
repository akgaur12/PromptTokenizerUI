# Issues & Recommendations

A living log of known issues, their severity, and recommended fixes. Each entry
is grounded in the actual code, not assumptions.

> **Note:** this file was created on 2026-06-14 alongside the documentation
> update for commit `7e0b235`. Entries below are split into **issues introduced
> by `7e0b235`** and **pre-existing issues** that were previously flagged inline
> in the docs and are now tracked formally here. None of the pre-existing issues
> were resolved by `7e0b235`.

Status legend: 🟥 Open · 🟩 Resolved · 🟦 Won't fix / by-design.

---

## Issues introduced by `7e0b235` (cost & prompt comparison)

### ISSUE-001 — Unbounded concurrency in compare fan-out 🟥
- **Severity:** Medium
- **Impact:** `compare()` and `comparePrompts()` fire **all** per-item
  `/tokenize` requests at once via `Promise.all` (up to 10 simultaneous requests
  for model comparison). Against a sleeping/free-tier backend this can spike the
  cold-start cost, risk rate-limiting/429s, and there is no per-item timeout
  budgeting beyond Axios's global 30s.
- **Affected files/modules:** `src/api/endpoints.ts` (`compare`, `comparePrompts`).
- **Root cause:** The fan-out was implemented with `Promise.all(models.map(...))`
  with no concurrency limit.
- **Recommended solution:** Bound concurrency (e.g. a small pool of 3–4, or a
  helper like `p-limit`), and surface partial progress. Optionally de-duplicate
  identical (model, text) requests.
- **Estimated effort:** S (½ day).
- **Priority:** Medium.

### ISSUE-002 — `text_length` now computed client-side from `String.length` 🟥
- **Severity:** Medium
- **Impact:** `CompareResponse.text_length` and `PromptCompareResult.text_length`
  are set to `text.length` (JS UTF-16 **code units**), not the backend's
  character count. For text with emoji/astral characters (e.g. 🤖), this
  over-counts vs a true code-point count, so the "chars" shown in compare can
  disagree with the single-model Tokenizer page (which uses the backend's
  `character_count`).
- **Affected files/modules:** `src/api/endpoints.ts` (`compare`,
  `comparePrompts`); surfaced in `CompareResults` / `ComparePromptsResults`.
- **Root cause:** When the fan-out replaced the `/compare` endpoint, character
  length was recomputed locally instead of read from each `/tokenize` response's
  `character_count`.
- **Recommended solution:** Use `data.character_count` from the per-item
  `/tokenize` response instead of `text.length`, for consistency with the
  Tokenizer page.
- **Estimated effort:** XS (<1 hr).
- **Priority:** Medium.

### ISSUE-003 — No "best" indicator on mobile in across-models compare 🟥
- **Severity:** Medium (UX regression)
- **Impact:** `7e0b235` removed the per-row "Best" badge and `bg-success/5`
  highlight from `CompareResults`. The winner is now conveyed only by the
  `vs best` column, which is **hidden on mobile** (`sm:table-cell`). On small
  screens there is therefore no explicit marker for the most efficient model.
- **Affected files/modules:** `src/components/CompareResults/CompareResults.tsx`.
- **Root cause:** The "Best" affordance was dropped in the same change that hid
  the `vs best` column on mobile, leaving a gap at narrow widths.
- **Recommended solution:** Either keep a lightweight best marker on the model
  cell (visible at all widths) or show the `vs best` value inline on mobile (as
  is already done for the Tokenizer column).
- **Estimated effort:** XS (<1 hr).
- **Priority:** Medium.

### ISSUE-004 — Prompt-comparison inputs lack the ⌘/Ctrl+Enter shortcut 🟥
- **Severity:** Low
- **Impact:** The "Across prompts" mode uses a local `PromptColumn`
  (`Textarea`) rather than `PromptInput`, so the keyboard submit shortcut and
  the auto-resize behavior users get elsewhere are absent — a small UX
  inconsistency between the two compare modes and the Tokenizer page.
- **Affected files/modules:** `src/pages/ComparePage.tsx` (`PromptColumn`).
- **Root cause:** A bespoke two-column textarea layout was introduced instead of
  reusing/extending `PromptInput`.
- **Recommended solution:** Add a ⌘/Ctrl+Enter handler to `PromptColumn` (or
  factor the shortcut out of `PromptInput` into a small shared hook).
- **Estimated effort:** XS (<1 hr).
- **Priority:** Low.

### ISSUE-005 — `/api/v1/compare` endpoint is now dead client-side 🟦
- **Severity:** Low (informational / by-design)
- **Impact:** The UI no longer calls `POST /api/v1/compare`; it composes
  comparisons from `/tokenize`. If the backend still exposes `/compare`, it is
  now unused by this client. The name "compare" is also overloaded (a backend
  endpoint that may still exist vs. the client-side function).
- **Affected files/modules:** `src/api/endpoints.ts`; backend (out of repo).
- **Root cause:** Deliberate switch to per-item `/tokenize` to obtain
  `estimated_input_cost`.
- **Recommended solution:** Confirm whether the backend `/compare` should be
  retired or extended to return cost (which would let the UI go back to a single
  request). Document the decision. No client change required.
- **Estimated effort:** N/A (decision/doc).
- **Priority:** Low.

---

## Pre-existing issues (carried forward, not resolved by `7e0b235`)

### ISSUE-101 — Health-poll interval: README vs code 🟥
- **Severity:** Low
- **Impact:** The README states health is polled every 30s; the code polls every
  **10 minutes**. Misleading for new contributors.
- **Affected files/modules:** `README.md`, `src/hooks/useHealth.ts:14`.
- **Root cause:** README not updated when the interval changed (keep-warm tuning).
- **Recommended solution:** Update the README to "10 minutes".
- **Estimated effort:** XS. **Priority:** Low.

### ISSUE-102 — `VITE_UI_PORT` declared but unused 🟥
- **Severity:** Low
- **Impact:** `.env` declares `VITE_UI_PORT=4096`, but `vite.config.ts` hardcodes
  `server.port: 5173` and never reads it, so the variable silently does nothing.
- **Affected files/modules:** `.env`, `vite.config.ts`.
- **Root cause:** Config variable added without wiring it into Vite.
- **Recommended solution:** Read it via `loadEnv` in `vite.config.ts`, or remove
  the variable. See [Configuration](./09-configuration.md).
- **Estimated effort:** XS. **Priority:** Low.

### ISSUE-103 — `npm run lint` has no ESLint config/dependency 🟥
- **Severity:** Medium
- **Impact:** `npm run lint` runs `eslint .` but no `eslint` devDependency or
  config file is committed, so linting isn't reproducible and likely fails in CI.
- **Affected files/modules:** `package.json`.
- **Root cause:** Lint script added without the accompanying tooling.
- **Recommended solution:** Add `eslint` + `typescript-eslint` + a flat
  `eslint.config.js`.
- **Estimated effort:** S. **Priority:** Medium.

### ISSUE-104 — No automated test suite 🟥
- **Severity:** Medium
- **Impact:** No unit/component/E2E tests; correctness relies on the type-check
  and manual testing. The logic layer (error/model normalization, table
  analytics, the new compare fan-out) is untested.
- **Affected files/modules:** whole repo.
- **Root cause:** Tests not yet introduced.
- **Recommended solution:** Add Vitest + Testing Library + MSW; prioritize the
  pure logic in `lib/`, `api/`, `hooks/`, and `TokenTables`. See
  [Testing](./14-testing.md).
- **Estimated effort:** M. **Priority:** Medium.

### ISSUE-105 — `JsonViewer` is built but unmounted 🟥
- **Severity:** Low
- **Impact:** `JsonViewer`/`highlight.tsx` are complete and documented but not
  rendered by any page — dead (if reusable) UI code.
- **Affected files/modules:** `src/components/JsonViewer/*`.
- **Root cause:** Component built ahead of a "Raw API Response" panel that was
  never wired in.
- **Recommended solution:** Either mount it (e.g. a collapsible raw-response
  panel on the Tokenizer page) or remove it.
- **Estimated effort:** XS–S. **Priority:** Low.

---

## Summary

| ID | Title | Severity | Status |
| -- | ----- | -------- | ------ |
| ISSUE-001 | Unbounded compare fan-out concurrency | Medium | 🟥 Open |
| ISSUE-002 | `text_length` from `String.length` | Medium | 🟥 Open |
| ISSUE-003 | No best indicator on mobile | Medium | 🟥 Open |
| ISSUE-004 | Prompt inputs lack ⌘/Ctrl+Enter | Low | 🟥 Open |
| ISSUE-005 | Dead `/api/v1/compare` endpoint | Low | 🟦 By-design |
| ISSUE-101 | Health-poll README vs code | Low | 🟥 Open |
| ISSUE-102 | `VITE_UI_PORT` unused | Low | 🟥 Open |
| ISSUE-103 | No ESLint config/dependency | Medium | 🟥 Open |
| ISSUE-104 | No automated tests | Medium | 🟥 Open |
| ISSUE-105 | `JsonViewer` unmounted | Low | 🟥 Open |
