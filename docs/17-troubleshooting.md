# 17 — Troubleshooting Guide

Common problems and their fixes. Most issues trace back to the API connection or
configuration.

## "Can't reach the server" toast / health dot is red

**Symptom:** Tokenize/Compare fail with the network toast; the header health
pill shows "Offline".

**Causes & fixes:**
1. **API not running.** Start the PromptTokenizer API. By default the dev proxy
   expects it at `http://localhost:8000` (`vite.config.ts:14`).
2. **Wrong base URL.** Check `.env`. The committed local `.env` points at
   `http://localhost:8192` — make sure that matches where your API actually
   runs, or clear `VITE_API_BASE_URL` to use the dev proxy (8000).
3. **CORS blocked** (when `VITE_API_BASE_URL` is a different origin). The API
   must send `Access-Control-Allow-Origin` for the site origin. In dev, prefer
   leaving `VITE_API_BASE_URL` empty so the proxy avoids CORS entirely.
4. **Cold start.** A sleeping free-tier backend can take several seconds to wake.
   Wait and retry; the pre-warm/keep-warm logic reduces but doesn't eliminate
   this.

**Diagnose:** open DevTools → Network and inspect the `/health` and
`/api/v1/...` requests (status code, CORS errors, timing).

## Changed `VITE_API_BASE_URL` but nothing changed

`VITE_*` variables are **build-time**, inlined at build. You must:
- In dev: **restart `npm run dev`** after editing `.env`.
- In prod: **redeploy** (Vercel) after changing the env var.

## Dev server runs on 5173, not `VITE_UI_PORT`

`vite.config.ts` hardcodes `server.port: 5173` and **does not read
`VITE_UI_PORT`** (which is declared in `.env`). So 5173 is expected. To honor the
variable, wire it into the config, e.g.:

```ts
import { defineConfig, loadEnv } from "vite";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return { /* … */ server: { port: Number(env.VITE_UI_PORT) || 5173, /* proxy */ } };
});
```

## Models dropdown shows "Couldn't load models" / Retry

`GET /api/v1/models` failed. Click **Retry**. If it persists, it's the same
connectivity/CORS issue as above. Confirm the endpoint returns
`{ items: [...] }` (or a bare array) — a malformed payload yields an empty list,
not a crash.

## No model is auto-selected

The page auto-selects `gpt-5`, then the first non-deprecated model, then the
first model (`TokenizerPage.tsx:26`). If nothing is selected, the catalog is
empty — the models request failed or returned `[]`.

## Cost shows "Pricing unavailable"

Expected when the API returns `estimated_input_cost: null` for that model. Not
an error.

## Context usage shows "No context window"

Expected for models/encodings with no `context_window` (e.g. raw encodings).
The card renders a placeholder to keep the grid balanced
(`ContextUsage.tsx`).

## Token blocks/IDs are truncated ("N more hidden")

Intentional. Outputs over **5000** items are capped for performance; click
**Show all** to render the rest (`TokenBlocks.tsx:13`). See
[Performance](./16-performance.md).

## Tokens ↔ IDs toggle is disabled

A tab is disabled when its data is missing from the response. The request always
asks for both (`include_tokens` + `include_token_ids`), so this usually means the
backend didn't return that field; the viewer auto-falls-back to whichever data
exists (`TokenViewer.tsx:28`).

## Compare: "Pick at least two models"

Comparison requires ≥ 2 models (`ComparePage.tsx:28`). Select more.

## Compare: a model row says "Failed"

That single model failed to tokenize (e.g. unsupported id). Other models still
show their counts; hover the "Failed" label to see the error. This is a
**per-model** error inside `results[]`, not a request failure
(`CompareResults.tsx:178`).

## Compare selections lost when I navigate away

They shouldn't be — Compare state is hoisted to `<App>` (`useCompareSession`). If
you do a full **page reload**, all UI state resets (there's no persistence) — the
hoisting only survives in-app hash navigation.

## Theme flashes or resets

- A brief flash usually means the `<html class="dark">` in `index.html` was
  removed; keep it so the first paint matches the default dark theme.
- The theme preference is stored by `next-themes`; clearing site storage resets
  it to the default (dark, following system).

## Copy doesn't work

`copyToClipboard` falls back to `execCommand` in insecure contexts, but some
browsers still block it. Ensure the site is served over **HTTPS** (or localhost)
so the async Clipboard API is available (`lib/utils.ts:61`).

## Build fails on `tsc -b`

The build type-checks first. Read the error — strict mode plus `noUnusedLocals`/
`noUnusedParameters` will flag unused imports/vars and type mismatches. Fix the
type, don't suppress it.

## `npm run lint` errors about missing config

Expected: no ESLint config/dependency is committed. Add `eslint` +
`typescript-eslint` + a flat config, or skip lint until it's set up. See
[Development Workflow](./15-development-workflow.md).

## Hash routes 404 on a non-Vercel host

Hash routes (`#/compare`) work anywhere because the part after `#` never hits the
server. But the SPA itself needs a catch-all that serves `index.html` for any
path. On Vercel that's `vercel.json`'s rewrite; on other hosts configure an
equivalent SPA fallback.
