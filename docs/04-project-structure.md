# 04 — Directory & File Structure

## Top-level layout

```text
PromptTokenizerUI/
├── index.html              # SPA entry; SEO meta, OG/Twitter cards, JSON-LD
├── package.json            # Scripts + dependencies
├── package-lock.json       # Locked dependency tree
├── vite.config.ts          # Vite config: React plugin, @ alias, dev proxy
├── vercel.json             # Vercel build + SPA catch-all rewrite
├── tailwind.config.js      # Tailwind theme, colors, keyframes, animations
├── postcss.config.js       # PostCSS: tailwindcss + autoprefixer
├── tsconfig.json           # TS solution file (project references + @ alias)
├── tsconfig.app.json       # TS config for the app (src/)
├── tsconfig.node.json      # TS config for Vite config
├── .env / .env.example     # VITE_API_BASE_URL (+ VITE_UI_PORT in .env)
├── .gitignore
├── README.md
├── public/                 # Static assets copied verbatim into the build
├── src/                    # All application source
├── docs/                   # ← this documentation book
└── dist/                   # Production build output (git-ignored)
```

## `public/` — static assets

Served from the site root, unprocessed by the bundler.

| File | Purpose |
| ---- | ------- |
| `favicon.svg`, `favicon-16x16.png`, `favicon-32x32.png` | Favicons (also used as the mobile logo in the header) |
| `apple-touch-icon.png` | iOS home-screen icon |
| `banner.png` | Full logo banner shown in the header on `sm+` screens |
| `og-image.png` | 1200×630 social-share preview image |
| `robots.txt` | Allows all crawlers; points to `sitemap.xml` |
| `site.webmanifest` | PWA manifest (name, icons, theme color) |

## `src/` — application source

```text
src/
├── main.tsx                # Composition root: providers + prewarm + render
├── App.tsx                 # Hash-route switch between the two pages
├── index.css               # Tailwind layers + CSS design tokens + utilities
├── vite-env.d.ts           # Types for import.meta.env
│
├── api/
│   ├── client.ts           # Axios instance + error normalization
│   └── endpoints.ts        # Typed API calls + normalizeModel + prewarm
│
├── hooks/
│   ├── useModels.ts        # GET /models + grouping helpers
│   ├── useTokenize.ts      # POST /tokenize mutation
│   ├── useCompare.ts       # compare() — fan-out /tokenize across models
│   ├── useComparePrompts.ts# comparePrompts() — fan-out /tokenize across prompts
│   ├── useCompareSession.ts# Hoisted Compare-page state (both modes)
│   ├── useHealth.ts        # GET /health polling + helpers
│   ├── useHashRoute.ts     # Hash-based routing
│   └── useAnimatedNumber.ts# rAF count-up animation
│
├── pages/
│   ├── TokenizerPage.tsx   # Main tokenize experience
│   └── ComparePage.tsx     # Compare: across-models & across-prompts modes
│
├── components/
│   ├── Header/Header.tsx
│   ├── HealthWidget/HealthWidget.tsx
│   ├── ModelSelector/
│   │   ├── ModelSelector.tsx        # Single-select (Tokenize)
│   │   └── MultiModelSelector.tsx   # Multi-select (Compare)
│   ├── PromptInput/PromptInput.tsx
│   ├── StatsCards/StatsCards.tsx
│   ├── ContextUsage/ContextUsage.tsx
│   ├── TokenViewer/
│   │   ├── TokenViewer.tsx           # Tokens/IDs toggle shell
│   │   ├── TokenBlocks.tsx           # Colored token blocks
│   │   ├── TokenIdChips.tsx          # Token ID chips
│   │   └── HoverTooltip.tsx          # Shared floating tooltip
│   ├── TokenTables/TokenTables.tsx   # Expensive words / frequent tokens
│   ├── CompareResults/
│   │   ├── CompareResults.tsx        # Across-models table (tokens + cost)
│   │   └── ComparePromptsResults.tsx # Across-prompts cards
│   ├── JsonViewer/
│   │   ├── JsonViewer.tsx            # Collapsible JSON panel
│   │   └── highlight.tsx             # Dependency-free JSON highlighter
│   ├── LandingContent/LandingContent.tsx  # SEO copy + explainer
│   ├── ThemeToggle/ThemeToggle.tsx
│   ├── theme-provider.tsx
│   └── ui/                            # shadcn/ui primitives (see below)
│
├── lib/
│   ├── utils.ts            # cn(), formatNumber/Cost/Mb, countWords, clipboard
│   └── token-colors.ts     # Deterministic pastel palette
│
└── types/
    └── index.ts            # All shared API/data types
```

### `src/components/ui/` — design-system primitives

These are the shadcn/ui building blocks, copied into the repo so they can be
edited directly. They are style-only and carry no business logic.

| File | Component |
| ---- | --------- |
| `button.tsx` | `Button` + `buttonVariants` (cva) |
| `badge.tsx` | `Badge` with `default/secondary/outline/success/warning/destructive/muted` variants |
| `card.tsx` | `Card`, `CardContent`, etc. |
| `command.tsx` | `Command*` wrappers around `cmdk` |
| `popover.tsx` | `Popover*` wrappers around Radix |
| `progress.tsx` | `Progress` with a custom `indicatorClassName` prop |
| `tooltip.tsx` | `Tooltip*` wrappers + `TooltipProvider` |
| `label.tsx` | `Label` |
| `textarea.tsx` | `Textarea` |
| `separator.tsx` | `Separator` |
| `skeleton.tsx` | `Skeleton` loading placeholder |
| `copy-button.tsx` | `CopyButton` — copy-to-clipboard with check feedback |
| `sonner.tsx` | `Toaster` (theme-aware sonner wrapper) |

## Folder conventions

- **One feature per folder.** Each feature component lives in
  `components/<Feature>/<Feature>.tsx`. Sub-parts of a feature (e.g.
  `TokenBlocks`, `TokenIdChips`, `HoverTooltip`) live beside their parent.
- **`ui/` is sacred and generic.** Nothing in `ui/` imports from feature
  folders; the dependency arrow only points *into* `ui/`.
- **Hooks own data access.** Components never call Axios directly — they go
  through a hook, which goes through `api/endpoints.ts`.
- **Types are centralized.** All cross-cutting types live in `types/index.ts`;
  component-local prop interfaces stay in their component file.
- **Path alias `@/`** maps to `src/`, so imports are absolute from the source
  root (`@/components/...`, `@/hooks/...`, `@/lib/...`).

## Build artifacts (git-ignored)

- `dist/` — the production build (`vite build` output) deployed to Vercel.
- `*.tsbuildinfo` — TypeScript incremental build caches.
- `node_modules/`, `.env`, `.env.*` (except `.env.example`).
