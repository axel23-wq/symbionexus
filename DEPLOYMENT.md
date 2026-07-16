# SymbioNexus AI OS MVP — Deployment Guide

## Quick Start (Development)

1. Install: `npm install`
2. Configure: `cp .env.example .env` → Edit with real Anthropic API key
3. Database: `npx prisma migrate deploy && npm run db:seed`
4. Run: `npm run dev` (Web :3000, API :4000)
5. Login: seller@cafvert.fr / Demo2024!
6. Test: Click 🤖 button on any dashboard page

## Architecture

- **Frontend:** Next.js 16, AIPanel component (floating)
- **Backend:** NestJS 11, modular AI stack (Providers, RAG, WorkflowContext)
- **Database:** Postgres with Prisma, pgvector for embeddings (future)
- **LLM:** Claude API (configurable via AI_PROVIDER)

## Key Features (Implemented)

✅ Floating AI assistant on all dashboard pages
✅ Real-time token streaming from Claude
✅ Module-specific system prompts (marketplace, matchmaking, carbon)
✅ Conversation persistence to Postgres
✅ RAG code indexing & retrieval
✅ Error handling & timeouts
✅ Unit test coverage

## Environment Variables

- **ANTHROPIC_API_KEY** — Required. Get from https://console.anthropic.com/
- **DATABASE_URL** — Postgres connection
- **AI_PROVIDER** — claude (default) | ollama | openai

## Testing

Backend tests: `npm test -- src/ai/tests/` (12 tests)

Manual E2E: Login → Dashboard → Click 🤖 → Type message

## Deployment

See docs/superpowers/specs/ and docs/superpowers/plans/ for complete specs.
