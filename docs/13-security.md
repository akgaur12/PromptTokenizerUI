# 13 — Security Considerations

This is a client-only SPA with no authentication and no secrets, which keeps its
threat surface small. This section documents the posture honestly, including
things to watch.

## Trust & data model

- **No authentication / authorization.** There are no accounts, sessions,
  tokens, cookies, or API keys. The PromptTokenizer API is treated as a public,
  unauthenticated service; the Axios client sends only `Content-Type`
  (`client.ts:13`). See [API Integration](./06-api-integration.md#authentication--authorization).
- **No secrets in the bundle.** The only configuration is `VITE_API_BASE_URL`,
  which is a non-secret public URL. **Never put a secret in a `VITE_`-prefixed
  variable** — Vite inlines those into the client bundle, where they are fully
  visible.
- **User text is sent to the API.** The text a user pastes is transmitted to the
  tokenizer API to be counted. The landing copy says "your text never leaves
  your browser session" — accurate in the sense that it isn't stored or shared,
  but it *is* sent to the API over the network to be tokenized. There is no
  client-side persistence of user text.

## Transport security

- In production the UI should be served over HTTPS (Vercel default) and
  `VITE_API_BASE_URL` should be an `https://` origin so requests are encrypted.
- If the API is on a different origin, it must send appropriate **CORS** headers
  permitting the site origin. The dev proxy sidesteps CORS locally
  (`vite.config.ts`).
- The 30-second Axios timeout (`client.ts:15`) bounds hung requests.

## XSS surface

- React escapes text by default, and the app **never uses
  `dangerouslySetInnerHTML`**. User-provided text (tokens, the prompt) is
  rendered as text nodes, not HTML.
- The custom JSON highlighter (`JsonViewer/highlight.tsx`) builds **React
  elements**, not raw HTML strings — token text is placed in `{children}`, so it
  is escaped. No injection vector there.
- Token blocks render arbitrary user substrings; because they're text children,
  there's no script-execution risk.

## External links & navigation

- Header links to GitHub and Medium use `target="_blank"` with
  `rel="noreferrer noopener"` (`Header.tsx`), preventing reverse-tabnabbing and
  referrer leakage.
- Hash-route navigation is internal `<a href="#/...">` — no open-redirect
  surface.

## Clipboard

- `copyToClipboard` prefers the async Clipboard API in secure contexts and falls
  back to a hidden-textarea `execCommand('copy')` otherwise
  (`lib/utils.ts:61`). It only ever **writes** user-visible content (the token,
  ID, or JSON the user is looking at) — it never reads the clipboard.

## Dependencies & supply chain

- Dependencies are pinned via `package-lock.json`. Run `npm audit` periodically
  and keep Radix/React/Vite current.
- The shadcn/ui primitives are vendored into `src/components/ui/*` (copied, not
  imported as a package), so they don't introduce a separate update channel —
  but they also won't receive upstream security fixes automatically.

## Headers & hardening (recommendations)

The repo does not currently define security headers. For production, consider
adding (via Vercel config) at least:

- `Content-Security-Policy` — the app uses inline JSON-LD in `index.html` and
  Tailwind classes; a CSP allowing `'self'`, the API origin in `connect-src`,
  and the needed image sources would tighten the XSS surface.
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
  and `X-Frame-Options`/`frame-ancestors` to prevent clickjacking.

## What is explicitly out of scope

- Rate limiting, abuse prevention, and request authentication are the **API's**
  responsibility, not this UI's.
- There is no PII handling, since there are no accounts and nothing is persisted.

## Summary risk table

| Area | Status | Notes |
| ---- | ------ | ----- |
| Auth | N/A | No accounts by design |
| Secrets | None in client | Keep it that way (`VITE_` is public) |
| XSS | Low | React escaping; no `dangerouslySetInnerHTML` |
| CSRF | N/A | No auth/cookies/state-changing authenticated calls |
| Clipboard | Low | Write-only, user-initiated |
| Transport | Depends on deploy | Use HTTPS + proper CORS in prod |
| Headers | Not configured | Recommend adding CSP + hardening headers |
