# Newsroom Frontend - Public News Site

**Part of the Newsroom ecosystem:** This frontend displays articles produced and approved by the AI-powered news pipeline. The frontend is entirely dependent on the backend - it does not contain any content generation logic.

**Related projects:**
- [Backend (newsroom_ai_pipeline)](https://github.com/JoniHonkanen/newsroom) - Handles news generation, enrichment, and publishing
- [Prompt Manager (newsroom_prompt_manager)](https://github.com/JoniHonkanen/newsroom_prompt_manager) - Admin interface for backend management

**Technologies:** Next.js 15, TypeScript, Apollo GraphQL, next-intl

Suomenkielinen (sekä EN / SV) Newsroom-projektin julkinen sivusto, jossa backendin moniajagenttiputken (RSS → rikastus → editoriaalinen päätös → julkaisu) generoimat ja hyväksytyt uutiset näytetään. Tämä repositorio sisältää vain renderöinnin ja käyttöliittymän – ei sisällä uutisten tuottavaa logiikkaa.

English: This is the public frontend of the Newsroom AI Pipeline. It consumes published articles (text + images + metadata) served by the backend GraphQL API and renders them with localization, infinite scrolling, related content blocks and SEO‑friendly routes. All article generation, enrichment, interviews, and editorial review happen in the separate backend repository.

Next.js 15 (App Router) frontend with localization (next-intl), SSR for initial pages, and client-side GraphQL for incremental loading.

## Tech

- Next.js 15 (App Router, SSR + CSR)
- TypeScript
- Internationalization: next-intl
- GraphQL: Apollo Client

## Setup

Prereqs: Node.js 18+, npm or yarn

```bash
npm install
npm run dev
```

Open <http://localhost:3000>

## Backend Requirement

Suora riippuvuus backendistä: Frontend EI sisällä omaa datalähdettä. Jotta uutiset, kuvat ja "related" listat näkyvät, Newsroom backendin GraphQL-palvelun ja static asset -polun (esim. `http://localhost:4000/graphql` ja `http://localhost:4000/static`) täytyy olla käynnissä.

English: This frontend depends entirely on the separate Newsroom backend stack for data. Without the backend (GraphQL + static assets) running, pages will render layout, but article lists / single article pages will be empty or show fallback states.

Quick backend start (in backend repo):

```bash
docker compose up -d   # brings up db, backend, graphql, agents
docker compose logs -f graphql
```

Then set in this frontend (`.env.local`):

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql
```

Verification:

1. Visit `<http://localhost:4000/graphql>` in browser – should show GraphQL endpoint.
1. Open `<http://localhost:4000/static>` – should list or serve image files.
1. Start frontend (`npm run dev`) and load `<http://localhost:3000>` – articles appear.

If articles do not appear: ensure agents have published items (check backend `agents` service logs) and env vars were present at build time.

Scripts:

```bash
npm run dev    # dev server (Turbopack)
npm run build  # production build
npm run start  # start production server
npm run lint   # ESLint
```

## Config

Environment variables (client-exposed):

- NEXT_PUBLIC_API_URL: API origin (e.g. <http://localhost:4000>)
- NEXT_PUBLIC_GRAPHQL_URL (optional): overrides GraphQL endpoint; default `${NEXT_PUBLIC_API_URL}/graphql`

Used for building absolute image URLs and Apollo GraphQL requests (credentials: include). Values are baked at build time.

Other notable frontend-only considerations:

- GraphQL requests include credentials for potential future personalization (keep CORS aligned with backend allowlist).
- If deploying on Vercel, set the environment variables in the project settings; rebuild on changes.
- Images are served from the backend/static path; ensure reverse proxy or direct origin access is allowed (see backend README for proxy examples).


## Routing

- Home: `src/app/[locale]/page.tsx` (SSR)
- Single news: `src/app/[locale]/[slug]/[id]/page.tsx` (SSR)
- Default locale (fi) has no `/fi` prefix. Non-default locales use `/en`, `/sv`, ...

## Data fetching

- SSR pages fetch on the server
- “Load more” on the home page uses Apollo Client (client-side GraphQL)

## URL examples

- `/` (Finnish home)
- `/uutiset/12345` (Finnish news)
- `/en` (English home)
- `/en/news/12345` (English news)

See `frontend_plan.png` and `frontend_plan_seo.png` for data flow and SEO overview.

## Core Features

- Server-Side Rendered landing and article pages for fast first paint & SEO.
- Infinite / paginated news list via client-side Apollo GraphQL (`InfiniteNewsList.tsx`).
- Automatic locale routing: default locale `fi` has no prefix; others mounted under `/[locale]`.
- Related / similar news components (semantic similarity served by backend embeddings).
- Structured components for featured, sidebar, disclaimers, ad banners.
- i18n messages stored under `src/messages/*.json` loaded per locale.
- Clean HTML output suitable for search indexing, Open Graph tags (extendable in layouts).

## High-Level Data Flow (Frontend Perspective)

1. User hits a locale page (e.g. `/en`): Next.js SSR loads initial articles via GraphQL query on the server.
2. User scrolls: client executes further GraphQL queries (Apollo) to fetch more published articles.
3. Single article page (`/[slug]/[id]`) SSR fetches article by ID + related article IDs.
4. Images displayed use absolute URLs built from `NEXT_PUBLIC_API_URL` (or GraphQL host) + `/static/...` returned in article metadata.
5. Similar / featured sections use backend-provided semantic relations (pgvector) – no client-side embedding logic here.

## Internationalization

- Implemented with `next-intl` App Router integration.
- Locale segment: `[locale]` folder contains layouts and pages; default locale (`fi`) served at root without prefix.
- Message catalogs: `src/messages/{fi,en,sv}.json`.
- Navigation / routing helpers under `src/i18n/` (`navigation.ts`, `routing.ts`).
- To add a new locale: add messages JSON, update locale config, and create route translations for slugs.

## Directory Overview

| Path | Purpose |
|------|---------|
| `src/app/[locale]/` | Locale-specific layouts & pages (App Router). |
| `src/components/` | Reusable UI components (cards, grids, sidebar, banners). |
| `src/graphql/queries.js` | GraphQL document definitions. |
| `src/lib/apolloClient.js` | Apollo Client instance configuration. |
| `src/providers/ApolloProvider.jsx` | Context provider wrapping components with Apollo. |
| `src/types/news.ts` | TypeScript types for news objects. |
| `src/utils/` | Utility helpers (dates, news-specific transforms). |
| `src/i18n/` | i18n routing & request helpers. |

## Working With the Backend

Backend repo (generation + editorial pipeline): `newsroom_ai_pipeline` (see provided backend README). This frontend only consumes already published articles.

Required backend services for full local experience:

- GraphQL server (published content): typically `http://localhost:4000/graphql`
- Static assets (images): `http://localhost:4000/static/...`


Minimal combined local dev:

1. Start backend GraphQL service (`python graphql_server.py` or via Docker Compose).
1. Set `.env.local` (or project env vars) for this frontend:

```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql  # optional explicit override
```

1. Install & run frontend:

```bash
npm install
npm run dev
```

1. Visit `http://localhost:3000`.

If you use Docker / reverse proxy domains, ensure CORS allowlists in backend (`server.py`, `graphql_server.py`) include the deployed frontend origins.

## SEO Notes

- Clean locale-specific paths; Finnish default root improves primary audience indexing.
- Each article page includes structured content sections; extend with `<meta>` tags via layout or head config.
- Slugs should be locale-appropriate; ensure backend provides translated slug if necessary.
- Consider adding Open Graph and Twitter Card metadata in a future enhancement.

## Extending

- New component: create under `src/components/` with its own CSS module for style isolation.
- GraphQL query change: modify `src/graphql/queries.js` and update consuming components.
- Additional locale: add messages JSON + configure routing; update any hardcoded slugs.
- Prefetch strategies: use Next.js `fetch` or Apollo SSR for improved TTFB on heavy pages.

