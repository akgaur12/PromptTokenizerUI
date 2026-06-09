# PromptTokenizer UI — Technical Documentation

> A clean, developer-focused web app for visualizing how AI models tokenize text —
> in the spirit of the OpenAI Tokenizer, with the polish of Linear / Vercel / Stripe.

This is the complete technical documentation for the **PromptTokenizer UI**
frontend. It is written both for developers who have never seen the project
(so they can become productive quickly) and for experienced contributors who
need a long-term reference.

The application is a **single-page React + TypeScript app** built with Vite. It
is a *pure frontend* — it holds no database and no server-side code of its own.
All tokenization work happens on a separate **PromptTokenizer API** that this UI
talks to over HTTP.

---

## How to read this book

If you are brand new, read the sections in order: **Overview → Architecture →
Tech Stack → Project Structure**. After that, jump to whatever you need.

If you are here to make a change, the most useful sections are **Core Modules &
Components**, **API Integration**, and **State & Data Flow**.

---

## Table of contents

| #  | Section | What's inside |
| -- | ------- | ------------- |
| 01 | [Project Overview & Objectives](./01-overview.md) | What the app does, who it's for, goals & non-goals, feature list |
| 02 | [High-Level Architecture](./02-architecture.md) | System context, component layers, data-flow diagrams |
| 03 | [Technology Stack & Dependencies](./03-tech-stack.md) | Every runtime/dev dependency and why it's here |
| 04 | [Directory & File Structure](./04-project-structure.md) | Every file explained, folder conventions |
| 05 | [Core Modules & Components](./05-core-modules.md) | Feature-by-feature implementation details |
| 06 | [API Integration, Endpoints & Contracts](./06-api-integration.md) | Backend endpoints, request/response shapes, client layer |
| 07 | [Data Models & Types](./07-data-models.md) | The TypeScript type system that stands in for a schema |
| 08 | [State Management & Data Flow](./08-state-and-data-flow.md) | React Query, hooks, routing, sequence diagrams |
| 09 | [Configuration & Environment Variables](./09-configuration.md) | `.env`, Vite config, proxy, build-time config |
| 10 | [Build, Deployment & CI/CD](./10-build-deploy.md) | Build pipeline, Vercel deploy, the backend keep-warm strategy |
| 11 | [Styling, Theming & Design System](./11-styling-theming.md) | Tailwind tokens, dark/light theme, shadcn/ui primitives |
| 12 | [Error Handling & Logging](./12-error-handling-logging.md) | Error normalization, toasts, defensive rendering |
| 13 | [Security Considerations](./13-security.md) | Threat surface, auth posture, XSS/clipboard notes |
| 14 | [Testing Strategy & Coverage](./14-testing.md) | Current state, recommended approach, manual test plan |
| 15 | [Development Workflow & Coding Standards](./15-development-workflow.md) | Local setup, conventions, commit/PR practices |
| 16 | [Performance Considerations](./16-performance.md) | Virtual caps, animation, caching, cold-start handling |
| 17 | [Troubleshooting Guide](./17-troubleshooting.md) | Common failures and how to fix them |
| 18 | [Glossary](./18-glossary.md) | Tokenization & project terminology |

---

## 60-second orientation

```text
Browser (this app)                         PromptTokenizer API (separate service)
┌─────────────────────────────┐           ┌──────────────────────────────────┐
│ React SPA (Vite build)      │  HTTP/JSON │ GET  /health                     │
│  • Tokenizer page           │ ─────────► │ GET  /api/v1/models              │
│  • Compare page             │            │ POST /api/v1/tokenize            │
│  • React Query cache        │ ◄───────── │ POST /api/v1/compare             │
│  • Axios client + error map │            └──────────────────────────────────┘
└─────────────────────────────┘
```

- **Stack:** React 18, Vite 6, TypeScript 5.7, Tailwind CSS 3.4, shadcn/ui +
  Radix UI, TanStack React Query 5, Axios.
- **Routing:** hash-based (`#/` tokenize, `#/compare`) — no router library.
- **State:** server state via React Query; local UI state via `useState`.
- **No auth, no database, no backend code in this repo.**
- **Deploy target:** Vercel (static SPA) — see [Build & Deploy](./10-build-deploy.md).

---

## Quick start

```bash
npm install
npm run dev        # Vite dev server on http://localhost:5173
```

The app expects the PromptTokenizer API at `http://localhost:8000` in dev; Vite
proxies `/api` and `/health` there automatically. See
[Configuration](./09-configuration.md) for pointing at other origins.

---

_Documentation generated from the actual implementation at commit `bbfc852`.
When in doubt, the source is the source of truth — file references throughout
this book are written as `path:line` and are clickable in most editors._
