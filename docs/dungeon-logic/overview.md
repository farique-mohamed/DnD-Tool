# Dungeon Logic — Project Overview

## What is DnD Tool?

A full-stack web companion tool for Dungeons & Dragons. Currently in early development — authentication is complete, and the dashboard is a placeholder for future features (character sheets, campaigns, dice rollers, etc.).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (Pages Router) |
| Language | TypeScript (strict mode) |
| API | tRPC v11 (end-to-end type safety) |
| ORM | Prisma 5 |
| Database | PostgreSQL 16 (Docker, port 5999) |
| Auth | JWT via `jsonwebtoken` + bcryptjs |
| State | @tanstack/react-query v5 |
| Serialization | superjson |
| Package Manager | pnpm |

## Directory Structure

```
src/
├── pages/
│   ├── _app.tsx              # App root — tRPC + React Query providers
│   ├── index.tsx             # Login / Register page (public)
│   ├── dashboard/
│   │   └── index.tsx         # Main dashboard (protected)
│   └── unauthorized.tsx      # Auth guard fallback with D&D countdown
├── components/
│   └── ProtectedRoute.tsx    # Reusable auth wrapper for any page
├── hooks/
│   └── useAuth.ts            # Reads JWT from localStorage, exposes user/logout
├── lib/
│   └── jwt.ts                # Server-only: signToken / verifyToken
├── server/
│   ├── db.ts                 # Prisma singleton
│   ├── trpc.ts               # tRPC init, context, publicProcedure
│   └── routers/
│       ├── _app.ts           # Root router (aggregates all sub-routers)
│       └── auth.ts           # auth.login, auth.register mutations
├── styles/
│   └── globals.css           # Box-sizing reset, Georgia font, full-height body
└── utils/
    └── api.ts                # tRPC React client (typed to AppRouter)

docs/
└── dungeon-logic/
    ├── overview.md           # ← this file
    ├── authentication.md     # JWT flow, login/register, token storage
    ├── architecture.md       # tRPC setup, conventions, how to add features
    └── ui-patterns.md        # D&D theme, colors, component conventions
```

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `POSTGRES_USER` | Docker DB user (default: `postgres`) |
| `POSTGRES_PASSWORD` | Docker DB password (required) |
| `POSTGRES_DB` | Docker DB name (default: `dndtool`) |
| `JWT_SECRET` | Secret key for signing/verifying JWTs |

## Dev Commands

```bash
pnpm dev:setup      # Tear down + start docker, run migrations, start dev server
pnpm dev            # Start dev server only
pnpm db:migrate     # Run Prisma migrations
pnpm db:studio      # Open Prisma Studio (visual DB browser)
pnpm db:generate    # Regenerate Prisma client after schema changes
pnpm docker:up      # Start PostgreSQL container
pnpm docker:down    # Stop PostgreSQL container
```
