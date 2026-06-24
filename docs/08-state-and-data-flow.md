# 08 — State Management & Data Flow

The app has two kinds of state:

1. **Server state** — data owned by the API (models, tokenization results,
   health). Managed entirely by **TanStack React Query**.
2. **Local/UI state** — selections, input text, open/closed toggles, the current
   route. Managed by `useState` / custom hooks.

There is no Redux, Zustand, or Context-based global store beyond the providers in
`main.tsx`.

## The React Query layer

A single `QueryClient` is created in `main.tsx` with these defaults:

```ts
defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } }
```

### Hooks overview

| Hook | Type | Key | Caching / behavior |
| ---- | ---- | --- | ------------------ |
| `useModels` | query | `["models"]` | `staleTime: 30min`, `retry: 1` — catalog rarely changes |
| `useHealth` | query | `["health"]` | `refetchInterval: 10min`, `refetchIntervalInBackground: true`, `refetchOnWindowFocus: true`, `staleTime: 10s` |
| `useTokenize` | mutation | — | normalizes errors → toast on failure |
| `useCompare` | mutation | — | fans out N `/tokenize` calls (across models); toast on **request-level** failure only |
| `useComparePrompts` | mutation | — | fans out N `/tokenize` calls (across prompts); toast on **request-level** failure only (added `7e0b235`) |

### `useModels` & grouping (`src/hooks/useModels.ts`)

- `useModels()` fetches the catalog once and caches it aggressively (30-minute
  stale time) — both model selectors share this single cache entry.
- `groupModelsByFamily(models)` is a pure function that buckets models by
  `family`, preserving first-appearance order.
- `useGroupedModels()` is a convenience hook returning `{ ...query, groups }`.

### `useHealth` (`src/hooks/useHealth.ts`)

This hook does double duty:
- It feeds the `HealthWidget`.
- Its **10-minute background refetch keeps the free-tier backend warm** so it
  doesn't idle to sleep. `refetchIntervalInBackground: true` keeps pinging even
  when the tab is unfocused.

Helpers: `isHealthy(data)` and `readMemory(data)`.

> Historical note: the README mentions a 30-second poll; the current
> implementation polls every **10 minutes** (`useHealth.ts:14`). The code is
> authoritative.

### Mutations (`useTokenize`, `useCompare`, `useComparePrompts`)

All three follow the same pattern (`src/hooks/useTokenize.ts`):

```ts
return useMutation({
  mutationFn: async (body) => {
    try { return await tokenize(body); }   // or compare(body) / comparePrompts(body)
    catch (error) { throw normalizeApiError(error); }
  },
  onError: (error) => toast.error(error.title, { description: error.message }),
});
```

`useCompare` and `useComparePrompts` call `compare()` / `comparePrompts()`, which
themselves fan out `/tokenize` requests — see
[API Integration](./06-api-integration.md#compare--client-side-composition).
Because per-item errors are captured inside `results[]`, the `onError` toast only
fires when the whole fan-out rejects (which `Promise.all` does only if an item's
handler itself throws — but each handler catches and inlines its own error, so in
practice these mutations rarely hit `onError`).

So the mutation's `error` is always a `NormalizedApiError`, and failures
automatically surface as a toast.

## Local state map

| State | Owner | Notes |
| ----- | ----- | ----- |
| Selected model (Tokenize) | `TokenizerPage` `useState` | auto-selected on load |
| Input text (Tokenize) | `TokenizerPage` `useState` | |
| Compare mode (`models`/`prompts`) | `useCompareSession` in `<App>` | tab toggle; added `7e0b235` |
| Across-models: selected models + text | `useCompareSession` in `<App>` | **hoisted** so it survives navigation |
| Across-prompts: model + promptA + promptB | `useCompareSession` in `<App>` | separate state per mode (defaults model to `gpt-5`); added `7e0b235` |
| Token viewer mode (tokens/ids) | `TokenViewer` `useState` | with effective-mode fallback |
| "Show all" caps | `TokenBlocks` / `TokenIdChips` `useState` | reveal beyond 5000 |
| JSON panel open | `JsonViewer` `useState` | |
| Popover open | selectors / widget | |
| Current route | `useHashRoute` | external store via `useSyncExternalStore` |
| Theme | `next-themes` | persisted by the library |

### Why Compare state is hoisted

`<App>` stays mounted across hash-route changes, but the page components unmount
when you navigate away. If Compare state lived inside `ComparePage`, switching to
Tokenize and back would lose the user's selected models and text. So
`useCompareSession()` is instantiated in `<App>` and passed down as a `session`
prop (`App.tsx:10`, `useCompareSession.ts`).

Since `7e0b235`, the session bundles **both comparison modes' state at once** —
`mode`, the across-models state (`selected`, `text`, `mutation`), and the
across-prompts state (`model`, `promptA`, `promptB`, `promptsMutation`) — each
kept independently so toggling between "Across models" and "Across prompts"
never loses input.

```mermaid
graph TD
    App["&lt;App&gt; (always mounted)"]
    Session["useCompareSession()<br/>mode · (selected,text,mutation) · (model,promptA,promptB,promptsMutation)"]
    App --> Session
    App -->|route '/compare'| CP[ComparePage session=…]
    App -->|else| TP[TokenizerPage]
    Session -.persists across.-> CP
```

## Routing data flow

`useHashRoute` (`src/hooks/useHashRoute.ts`) reads `window.location.hash` and
subscribes to `hashchange` via `useSyncExternalStore`:

```ts
useSyncExternalStore(subscribe, getHash, () => "/");
```

- `getHash()` strips the leading `#` and defaults to `/`.
- The third arg (server snapshot) returns `"/"` purely to satisfy
  `useSyncExternalStore` under React 18 strict mode — there is no SSR.
- Navigation is plain `<a href="#/compare">` links in the `Header`.

## Tokenize sequence (detailed)

```mermaid
sequenceDiagram
    actor U as User
    participant TP as TokenizerPage
    participant M as useModels (query)
    participant T as useTokenize (mutation)
    participant API as API

    Note over TP,M: on mount
    TP->>M: useModels()
    M->>API: GET /api/v1/models
    API-->>M: items[]
    M-->>TP: models (cached 30m)
    TP->>TP: auto-select gpt-5 / first non-deprecated

    U->>TP: enter text + Tokenize
    TP->>T: mutate({model,text,include_tokens,include_token_ids})
    T->>API: POST /api/v1/tokenize
    API-->>T: TokenizeResponse
    T-->>TP: data
    TP->>TP: StatsCards + TokenViewer + TokenTables render from data
```

## Compare-across-models sequence (with partial failure)

The mutation now **fans out one `/tokenize` per model** and assembles the
results client-side (changed in `7e0b235`):

```mermaid
sequenceDiagram
    actor U as User
    participant CP as ComparePage (mode=models)
    participant C as useCompare → compare()
    participant API as API
    participant CR as CompareResults

    U->>CP: pick >=2 models + text, Compare
    alt fewer than 2 models
        CP-->>U: toast "Pick at least two models"
    else ok
        CP->>C: mutate({models, text})
        par one /tokenize per model (Promise.all)
            C->>API: POST /api/v1/tokenize {model₁, text}
            C->>API: POST /api/v1/tokenize {model₂, text}
            C->>API: POST /api/v1/tokenize {modelₙ, text}
        end
        API-->>C: per-model TokenizeResponse | inline error
        C-->>CR: { text_length, results[] }
        CR->>CR: sort ok rows asc, sink failures, compute Est. cost + "vs best"
    end
```

## Compare-across-prompts sequence (added `7e0b235`)

```mermaid
sequenceDiagram
    actor U as User
    participant CP as ComparePage (mode=prompts)
    participant C as useComparePrompts → comparePrompts()
    participant API as API
    participant PR as ComparePromptsResults

    U->>CP: pick model + Prompt A + Prompt B, Compare
    alt no model or a prompt empty
        CP-->>U: toast "Pick a model" / "Enter both prompts"
    else ok
        CP->>C: mutate({model, prompts:[A,B]})
        par one /tokenize per prompt (Promise.all)
            C->>API: POST /api/v1/tokenize {model, A}
            C->>API: POST /api/v1/tokenize {model, B}
        end
        API-->>C: per-prompt TokenizeResponse | inline error
        C-->>PR: { model, resolved_tokenizer, results[] }
        PR->>PR: flag fewest-tokens prompt, show +tokens / +%
    end
```

## Data-flow principles

- **Components never call Axios.** They depend on a hook.
- **Hooks never render.** They return data/flags; rendering is the component's
  job.
- **Server state is cached; UI state is ephemeral.** Refreshing the page resets
  all UI state (no persistence) but the model/health caches re-warm quickly.
- **Errors travel as data.** Mutations throw a `NormalizedApiError`; per-model
  compare errors travel inside `results[]`.
