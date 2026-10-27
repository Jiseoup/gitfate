<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# gitfate

A just-for-fun web app that reads a developer's saju (Korean Four Pillars fortune) from the time they signed up for GitHub.

## Folder structure

- `src/core/` — pure fortune logic. No `next`, `react`, network, or clock access. Deterministic.
- `src/github/` — GitHub API access (profile, commit timestamps, activity).
- `src/i18n/` — locale loading and lookup. `src/i18n/generated.ts` is generated and git-ignored.
- `locales/` — all user-visible text, one file per language.
- `src/reading/` — assembles core results and text into what pages and share cards render.
- `src/icons/` — the Dev Sign and five-element SVG icons, shared by web pages and share cards (Satori-safe SVG only).
- `src/app/` — Next.js routes (pages, API routes, share card images).
- `data/` — static data files.
- `scripts/` — locale tools (generate and check locale files).
- `tests/` — mirrors `src/` (`tests/core/` for `src/core/`, and so on). `tests/components/` runs in jsdom; everything else runs in node.

## Commands

- `npm run dev` — start the dev server
- `npm test` — run the Vitest suite once
- `npm run build` — production build
- `npm run check:locales` — verify locale files are complete and consistent

## Hard rules

1. For commit patch responses, read only the `Date:` header line. Never store, return, or log emails or message bodies.
2. Calculation results are language-independent. Sentences live only in `locales/`.
3. Randomness comes only from `src/core/seed.ts`. The same input always gives the same result.
4. Never grade or rank people. Scores attach to luck only.
