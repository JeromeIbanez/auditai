# Claude Code Instructions

## Branch Workflow — STRICTLY ENFORCED

- **All code changes go to `staging` first.** Always `git checkout staging` before making any changes.
- **Push to `origin/staging` automatically** after every commit — no need to ask Jerome.
- **Never push to `main` directly.** `main` has branch protection: PRs require 1 approving review (Jerome) and the CI check must pass. Direct pushes are blocked by GitHub.
- **The QA pipeline auto-merges SIMPLE changes** (UI copy, layout tweaks, minor bug fixes with no logic changes) via the temujin-qa-agent after CI passes.
- **COMPLEX changes always require Jerome's explicit approval.** The QA agent opens a PR — Jerome reviews and merges it. Approval phrases when Jerome says the word: "do it", "push to prod", "push to production", "looks good", "ship it".
- When Jerome approves manually: `git checkout main && git merge staging && git push origin main`, then sync back: `git checkout staging && git merge main && git push origin staging`.

**`main` = production. GitHub enforces this — it cannot be bypassed.**

### What counts as COMPLEX (always needs Jerome's approval):
- New features or significant functionality changes
- Database schema changes (Prisma migrations)
- API contract changes
- Auth or security changes (`src/proxy.ts`, Clerk config)
- Changes to `src/lib/scoring.ts` (core audit methodology)
- Changes to AI prompts in API routes
- Large refactors touching many files
- Environment variable or secrets changes

## Stack

- Next.js 15 App Router · TypeScript · Tailwind · shadcn/ui
- Clerk (auth) · Neon Postgres (Prisma 7 + adapter-neon) · Vercel AI SDK
- AI provider: OpenAI now, Anthropic later — swap via `AI_PROVIDER` env var
- Stripe (payments — not yet wired)

## Key conventions

- Scoring logic lives in `src/lib/scoring.ts` — never delegate the 6-dimension math to the AI
- AI calls always go through `src/lib/ai.ts` `getModel()` — never import providers directly
- Prisma client is a singleton in `src/lib/prisma.ts` using the Neon adapter
- Protected routes: `/dashboard`, `/audit/:id`, `/workflow` — enforced in `src/proxy.ts`
- `src/app/audit/_components/` — wizard step components (client-side only)
- `src/app/workflow/[id]/_components/` — workflow client components

## Environment

Copy `.env.local.example` → `.env.local` and fill in values.
Never commit `.env` or `.env.local` — both are gitignored.
