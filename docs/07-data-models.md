# 07 — Data Models & Types

This project has no database, so its "schema" is the TypeScript type system in
`src/types/index.ts`. These types are the single source of truth for every data
shape that crosses the API boundary. A guiding principle (stated at the top of
the file) is that fields are kept **optional and defensive** so the UI never
crashes on a slightly different payload.

```mermaid
classDiagram
    class RawModel {
        +string id
        +string? label
        +string? group
        +string? provider
        +string? adapter
        +string? tokenizer_ref
        +string? status
        +string? description
        +number? context_window
        +string? notes
        +bool? supports_token_decode
        +bool? supports_browser
        +bool? deprecated
    }
    class Model {
        +string id
        +string name
        +string family
        +string? description
        +string? encoding
        +string? provider
        +number? context_window
        +bool? deprecated
        +string? status
    }
    class ModelsResponse {
        +RawModel[] items
    }
    RawModel ..> Model : normalizeModel()
    ModelsResponse o-- RawModel

    class TokenizeRequest {
        +string model
        +string text
        +bool? include_tokens
        +bool? include_token_ids
    }
    class TokenizeResponse {
        +string? model
        +string? resolved_tokenizer
        +number token_count
        +number word_count
        +number character_count
        +number|null estimated_input_cost
        +string? cost_currency
        +string[]? tokens
        +number[]? token_ids
        +number? context_window
    }

    class CompareRequest {
        +string[] models
        +string text
    }
    class CompareResult {
        +string model
        +string? resolved_tokenizer
        +number|null token_count
        +number? estimated_input_cost
        +string? cost_currency
        +string? error
    }
    class CompareResponse {
        +number text_length
        +CompareResult[] results
    }
    CompareResponse o-- CompareResult

    class ComparePromptsRequest {
        +string model
        +string[] prompts
    }
    class PromptCompareResult {
        +number index
        +number text_length
        +number|null word_count
        +number|null token_count
        +number? estimated_input_cost
        +string? cost_currency
        +string? error
    }
    class ComparePromptsResponse {
        +string model
        +string? resolved_tokenizer
        +PromptCompareResult[] results
    }
    ComparePromptsResponse o-- PromptCompareResult

    class HealthResponse {
        +string status
        +string? service
        +string? version
        +memory? memory
    }

    class NormalizedApiError {
        +ApiErrorCode code
        +number? status
        +string title
        +string message
    }
```

## Models

### `RawModel`
The entry exactly as returned by `GET /api/v1/models`. Only `id` is required;
everything else is optional/nullable. Note the backend uses `label`/`group`/
`tokenizer_ref` rather than the UI's `name`/`family`/`encoding`.

### `Model` (normalized)
The shape used everywhere in the UI, produced by `normalizeModel()`. See the
mapping table in [API Integration](./06-api-integration.md#get-apiv1models).
Key derived field: `deprecated` is `true` if `raw.deprecated === true` **or**
`status` is `"deprecated"`/`"legacy"`.

### `ModelGroup` (`src/hooks/useModels.ts`)
```ts
interface ModelGroup { family: string; models: Model[]; }
```
A view model produced by `groupModelsByFamily()` for the grouped dropdown.

## Tokenize

### `TokenizeRequest` / `TokenizeResponse`
See [API Integration](./06-api-integration.md#post-apiv1tokenize). Important
invariant: when present, `tokens[i]` and `token_ids[i]` describe the **same
token** — all token-viewer and table logic depends on this positional
alignment.

`TokenizeResponse` gained **`resolved_tokenizer`** in `7e0b235` — the tokenizer
the backend resolved the model to. Both compare features read this field (it is
the value they surface as each row's "Tokenizer").

## Compare across models

### `CompareRequest` / `CompareResult` / `CompareResponse`
See [API Integration](./06-api-integration.md#compare--client-side-composition).
These are assembled **client-side** from per-model `/tokenize` calls (not a
backend `/compare` endpoint). `CompareResult` encodes **per-model success or
failure**: a number `token_count` + null `error` means success; null
`token_count` + a string `error` means that one model failed while others may
have succeeded. As of `7e0b235`, `CompareResult` also carries
`estimated_input_cost` and `cost_currency` so the table can rank by price.

## Compare across prompts (added `7e0b235`)

### `ComparePromptsRequest` / `PromptCompareResult` / `ComparePromptsResponse`
The mirror of the across-models types: the **model is fixed and the prompts
vary**. `ComparePromptsRequest` is `{ model, prompts[] }`. Each
`PromptCompareResult` carries the prompt's 0-based `index`, `text_length`,
`word_count`, `token_count`, cost fields, and an inline `error`.
`ComparePromptsResponse` echoes the `model` and the `resolved_tokenizer` shared
by all prompts. See
[API Integration](./06-api-integration.md#comparepromptsbody--one-model-several-prompts-endpointsts).

### `Row` (`src/components/CompareResults/CompareResults.tsx`)
A view model derived from `CompareResult[]` adding `rank`, `deltaPct`, a
resolved display `name`, and (since `7e0b235`) `cost` + `currency`. The previous
`isBest` flag was **removed** in `7e0b235` — the table no longer highlights a
"best" row, relying on the `vs best` column instead. Not part of the API
contract.

## Health

### `HealthResponse`
`status` is the only field the UI strictly relies on (via `isHealthy`). `memory`
is an optional object of megabyte values. An index signature (`[key: string]:
unknown`) lets the API add fields without breaking the type.

## Errors

### `ApiErrorCode`
A union: `MODEL_NOT_SUPPORTED | VALIDATION_ERROR | TOKENIZER_NOT_AVAILABLE |
INTERNAL_ERROR | NETWORK_ERROR | UNKNOWN`.

### `ApiErrorBody`
The expected error envelope from the API: `{ error?: { code?, message?, details? } }`.

### `NormalizedApiError`
The UI-facing error: `{ code, status?, title, message }`. This is what hooks
throw and what toasts render. See
[Error Handling](./12-error-handling-logging.md).

## View-model types (UI-only)

These live in component/hook files, not `types/index.ts`, because they never
cross the API boundary:

| Type | File | Role |
| ---- | ---- | ---- |
| `ModelGroup` | `useModels.ts` | Grouped dropdown data |
| `CompareMode` | `useCompareSession.ts` | `"models" \| "prompts"` — which compare the page shows (added `7e0b235`) |
| `CompareSession` | `useCompareSession.ts` | Hoisted Compare state bundle — now holds **both** modes' state (added `7e0b235`) |
| `Row` | `CompareResults.tsx` | Ranked comparison rows (now with `cost`/`currency`, no `isBest`) |
| `WordSegment`, `ExpensiveWord`, `FrequentToken` | `TokenTables.tsx` | Analytics rows |
| `TokenInfo`, `TooltipState` | `HoverTooltip.tsx` | Tooltip payload |
| `TokenColor` | `token-colors.ts` | Palette entry |
