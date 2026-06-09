# 03 — Technology Stack & Dependencies

All versions are taken from `package.json`. The project uses **ES modules**
(`"type": "module"`) and is private (not published to npm).

## Runtime stack at a glance

| Concern | Choice | Version |
| ------- | ------ | ------- |
| UI library | React | `^18.3.1` |
| Build tool / dev server | Vite | `^6.0.11` |
| Language | TypeScript | `^5.7.3` |
| Styling | Tailwind CSS | `^3.4.17` |
| Component primitives | Radix UI + shadcn/ui pattern | various |
| Server-state | TanStack React Query | `^5.66.0` |
| HTTP client | Axios | `^1.7.9` |
| Icons | lucide-react | `^0.474.0` |
| Toasts | sonner | `^1.7.4` |
| Theme | next-themes | `^0.4.4` |

## Dependencies — what each one is for

### Core framework
- **`react` / `react-dom` (`^18.3.1`)** — the UI runtime. Uses React 18 features
  including `useSyncExternalStore` (in `useHashRoute`) and `StrictMode`.

### Data & networking
- **`@tanstack/react-query` (`^5.66.0`)** — server-state management: caching,
  retries, loading/error flags, background refetch. All API access flows through
  React Query hooks (`src/hooks/*`).
- **`axios` (`^1.7.9`)** — HTTP client. A single configured instance with a 30s
  timeout and JSON headers lives in `src/api/client.ts`. Axios's typed error
  objects power the error-normalization layer.
- **`@tanstack/react-virtual` (`^3.11.3`)** — virtualization primitive. Listed
  as a dependency for large-list rendering; the model dropdown and token viewers
  are designed to stay performant on big inputs (token viewers use a soft
  render cap, see [Performance](./16-performance.md)).

### UI primitives (Radix UI) — the headless layer behind shadcn/ui
- **`@radix-ui/react-dialog` (`^1.1.6`)** — accessible dialog primitive.
- **`@radix-ui/react-popover` (`^1.1.6`)** — powers the model selectors and the
  health widget popover.
- **`@radix-ui/react-tooltip` (`^1.1.8`)** — header tooltips (GitHub, Medium,
  theme toggle).
- **`@radix-ui/react-progress` (`^1.1.2`)** — the context-usage progress bar.
- **`@radix-ui/react-label` (`^2.1.2`)** — accessible form labels.
- **`@radix-ui/react-slot` (`^1.1.2`)** — the `asChild` composition used by
  `Button` to render as an `<a>` while keeping styles.

### Command palette / search
- **`cmdk` (`^1.0.4`)** — the fuzzy-search command menu used inside both model
  selectors (`Command*` components). Drives keyboard navigation and filtering.

### Styling utilities
- **`tailwindcss` (`^3.4.17`)** — utility-first CSS framework. Configured in
  `tailwind.config.js`, with design tokens defined as CSS variables in
  `src/index.css`.
- **`tailwindcss-animate` (`^1.0.7`)** — Tailwind plugin providing animation
  utilities (`animate-in`, `fade-in-0`, `zoom-in-95`, accordion keyframes).
- **`class-variance-authority` (`^0.7.1`)** — type-safe component variants
  (`cva`), used by `Button` and `Badge`.
- **`clsx` (`^2.1.1`)** + **`tailwind-merge` (`^2.6.0`)** — combined in the `cn()`
  helper (`src/lib/utils.ts:4`) to merge class names and resolve Tailwind
  conflicts.

### Visual polish
- **`lucide-react` (`^0.474.0`)** — icon set used throughout (Hash, Coins,
  Gauge, Sparkles, etc.).
- **`sonner` (`^1.7.4`)** — toast notifications. The single `<Toaster />` lives
  in `main.tsx`; errors and copy confirmations call `toast.*`.
- **`next-themes` (`^0.4.4`)** — dark/light theme management via the `class`
  strategy. Defaults to dark, follows system. (Used standalone — there is no
  Next.js in this project.)

## Dev dependencies

| Package | Purpose |
| ------- | ------- |
| `typescript` (`^5.7.3`) | Type checking; `tsc -b` runs in the build |
| `vite` (`^6.0.11`) | Bundler / dev server |
| `@vitejs/plugin-react` (`^4.3.4`) | React fast-refresh + JSX transform for Vite |
| `@types/node` (`^22.13.1`) | Node typings (used by `vite.config.ts`'s `path`) |
| `@types/react` / `@types/react-dom` | React type definitions |
| `tailwindcss` / `autoprefixer` (`^10.4.20`) / `postcss` (`^8.5.1`) | CSS build pipeline (see `postcss.config.js`) |

> **Note on ESLint:** `package.json` defines `"lint": "eslint ."`, but the repo
> does not currently contain an ESLint config file or an `eslint` dependency in
> `package.json`. Linting therefore relies on a globally/peer-installed ESLint or
> is aspirational. See [Development Workflow](./15-development-workflow.md).

## TypeScript project setup

The project uses **TypeScript project references** (`tsconfig.json`):

- `tsconfig.json` — solution file, references the two configs below and declares
  the `@/*` path alias.
- `tsconfig.app.json` — application config: `target ES2020`, `module ESNext`,
  `moduleResolution: bundler`, `jsx: react-jsx`, `strict: true`, plus
  `noUnusedLocals`, `noUnusedParameters`, and `noFallthroughCasesInSwitch`.
  Emits nothing (`noEmit`) — Vite handles transpilation.
- `tsconfig.node.json` — config for Vite's own config file.

The `@/*` → `./src/*` path alias is declared in **both** `tsconfig` (for the
type-checker) and `vite.config.ts` (for the bundler) so imports like
`@/components/ui/button` resolve consistently.

## Why this stack

- **Vite + React + TS** is the de-facto modern SPA baseline: fast HMR, instant
  cold start, first-class TS.
- **shadcn/ui + Radix** gives accessible, unstyled primitives that are copied
  into the repo (`src/components/ui/*`) rather than imported as a black-box
  library — so they can be tweaked freely.
- **React Query** removes nearly all manual loading/error/caching boilerplate
  and underpins the keep-warm health polling.
- The whole stack is **dependency-light for what it does** and produces a small
  static bundle (the `dist/` output is well under 1 MB).
