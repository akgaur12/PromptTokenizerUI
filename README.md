# PromptTokenizer

A clean, developer-focused web app for visualizing how AI models tokenize text —
in the spirit of the OpenAI Tokenizer, with the polish of Linear / Vercel / Stripe.

Built with **React + Vite + TypeScript + Tailwind CSS + shadcn/ui**.

## Features

- **Unified model dropdown** — one searchable, keyboard-navigable, virtualized
  combobox. Models are fetched live from `GET /api/v1/models` and grouped by
  `family` (never hardcoded). Each option shows a description, encoding badge,
  provider badge, and a `Legacy` badge for deprecated models.
- **Prompt input** — auto-resizing monospace textarea with live word/character
  counters and a `⌘/Ctrl + Enter` shortcut.
- **Statistics dashboard** — animated cards for tokens, words, characters, and
  estimated input cost (gracefully shows _Pricing unavailable_ when `null`).
- **Context window usage** — progress bar comparing `token_count` against the
  selected model's `context_window`, with warning/critical thresholds.
- **Token viewer** — segmented `Tokens` / `Token IDs` toggle. Tokens render as
  pastel colored blocks (whitespace preserved & visualized) with hover tooltips
  (token, ID, length, index) and click-to-copy. Token IDs render as chips whose
  tooltips reveal the original token.
- **Raw JSON viewer** — collapsible panel with custom syntax highlighting,
  pretty formatting, and copy-to-clipboard.
- **Health widget** — polls `GET /health` every 30s; shows status, version, and
  RSS/VMS memory behind a green/red status indicator.
- **Dark / light theme**, responsive & mobile-friendly, skeleton loaders, empty
  states, friendly error toasts, and smooth animations throughout.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
```

The app expects the PromptTokenizer API at `http://localhost:8000`. In dev, Vite
proxies `/api` and `/health` there automatically (see `vite.config.ts`), so no
CORS configuration is required.

### Configuration

Copy `.env.example` to `.env` to point the frontend at a different API origin:

```bash
cp .env.example .env
# VITE_API_BASE_URL=https://api.yourdomain.com
```

When `VITE_API_BASE_URL` is empty, requests go through the dev proxy.

### Scripts

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the Vite dev server            |
| `npm run build`   | Type-check and build for production  |
| `npm run preview` | Preview the production build locally |
| `npm run lint`    | Lint the project with ESLint         |

## API integration

A typed Axios client (`src/api/client.ts`) plus React Query hooks
(`src/hooks/`) wrap the backend:

| Endpoint                  | Hook            |
| ------------------------- | --------------- |
| `GET /health`             | `useHealth`     |
| `GET /api/v1/models`      | `useModels`     |
| `POST /api/v1/tokenize`   | `useTokenize`   |

Errors are normalized into friendly messages by status / error code
(`MODEL_NOT_SUPPORTED` → 404, `VALIDATION_ERROR` → 422,
`TOKENIZER_NOT_AVAILABLE` → 503, `INTERNAL_ERROR` → 500, plus network failures)
and surfaced as toasts.

## Project structure

```text
src/
├── api/            # client.ts (Axios + error mapping) + endpoints.ts (typed calls)
├── hooks/          # React Query hooks (useModels, useTokenize, useHealth) + useAnimatedNumber
├── pages/          # TokenizerPage — composes the whole experience
├── components/
│   ├── Header/
│   ├── HealthWidget/
│   ├── ModelSelector/
│   ├── PromptInput/
│   ├── StatsCards/
│   ├── ContextUsage/
│   ├── TokenViewer/
│   ├── JsonViewer/
│   ├── ThemeToggle/
│   └── ui/         # shadcn/ui primitives
├── types/          # Shared API types
├── lib/            # utils (formatting, clipboard) + token color palette
└── App.tsx
```
