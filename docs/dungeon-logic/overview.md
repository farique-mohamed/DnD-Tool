# Dungeon Logic — Project Overview

## What is DnD Tool?

A full-stack web companion tool for Dungeons & Dragons. Features include authentication, character creation, dice rolling, adventure management with encounter tracking, a reusable component library, and an admin dashboard for user and adventure oversight.

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
│   │   └── index.tsx         # Main dashboard (protected, role-aware greeting)
│   ├── unauthorized.tsx       # Auth guard fallback with D&D countdown
│   ├── admin/
│   │   ├── index.tsx          # Admin Dashboard home — stats grid (ADMIN only)
│   │   ├── users/
│   │   │   └── index.tsx      # User Management — search, role filter, role change, delete (ADMIN only)
│   │   ├── adventures/
│   │   │   └── index.tsx      # Adventure Oversight — search, pagination (ADMIN only)
│   │   └── dm-requests/
│   │       └── index.tsx      # DM request list with approve/reject (ADMIN only)
│   ├── dm/
│   │   ├── adventure-books/
│   │   │   ├── index.tsx     # Adventure books listing (DM-only)
│   │   │   └── [source].tsx  # Adventure book detail — TOC + content (DM-only)
│   └── classes/
│       └── index.tsx         # Class compendium (protected, DM + PLAYER)
├── components/
│   ├── ProtectedRoute.tsx    # Reusable auth wrapper for any page
│   ├── NavBar.tsx            # Vertical sidebar navigation (role-aware)
│   ├── Layout.tsx            # Flex wrapper: NavBar + main content + DiceRoller
│   ├── DiceRoller.tsx        # Floating dice roller popup (fixed bottom-right, all auth pages)
│   ├── ui/
│   │   ├── index.ts          # Barrel export for all UI components and theme tokens
│   │   ├── theme.ts          # Design tokens — color constants, font, common style objects
│   │   ├── Card.tsx          # Card with default (gold border + glow) and light variants
│   │   ├── Button.tsx        # Button with primary/ghost/danger variants and sm/md/lg sizes
│   │   ├── PageHeader.tsx    # Responsive page header with title, subtitle, gold divider
│   │   ├── Input.tsx         # Styled text input
│   │   ├── Select.tsx        # Styled select dropdown
│   │   ├── Badge.tsx         # Small badge/tag component
│   │   ├── Modal.tsx         # Reusable modal overlay
│   │   └── Alert.tsx         # Status message with error/success/info variants
│   └── adventure/
│       └── EncounterTab.tsx  # Encounter combat tracker tab (initiative, HP, conditions, death saves)
├── hooks/
│   └── useAuth.ts            # Reads JWT from localStorage, exposes user/logout/role
├── lib/
│   ├── jwt.ts                # Server-only: signToken / verifyToken (includes role)
│   ├── constants.ts          # USER_ROLES tuple + UserRoleType for type-safe role checks
│   ├── diceConstants.ts      # DICE_TYPES, DICE_SIDES, ROLL_LABELS, ROLL_MODES + type aliases (shared by router and component)
│   ├── equipmentData.ts      # Equipment slots, proficiency, AC calculation, weapon masteries/properties, equipment actions
│   └── classData.ts          # Static D&D 5e class data — imports data/class/ JSONs directly, exports CLASS_LIST + getClassByName
├── server/
│   ├── db.ts                 # Prisma singleton
│   ├── trpc.ts               # tRPC init, context, publicProcedure
│   └── routers/
│       ├── _app.ts           # Root router (aggregates all sub-routers)
│       ├── auth.ts           # auth.login, auth.register mutations
│       ├── user.ts           # user.requestDungeonMaster mutation (stub)
│       ├── admin.ts          # Admin procedures — stats, user management, adventures, DM requests (ADMIN only)
│       ├── dice.ts           # dice.roll mutation, dice.history / dice.globalHistory queries
│       └── adventure/
│           ├── index.ts      # Adventure router aggregating all adventure procedures
│           └── encounter.ts  # Encounter tRPC procedures (create, get, end, participants, HP, conditions, death saves, initiative)
├── styles/
│   └── globals.css           # Box-sizing reset, Georgia font, full-height body
└── utils/
    └── api.ts                # tRPC React client (typed to AppRouter)

docs/
└── dungeon-logic/
    ├── overview.md           # ← this file
    ├── admin-dashboard.md    # Admin dashboard pages, tRPC procedures, role-based access
    ├── authentication.md     # JWT flow, login/register, token storage, role in payload
    ├── architecture.md       # tRPC setup, conventions, how to add features
    ├── ui-patterns.md        # D&D theme, colors, component conventions
    ├── roles.md              # Role system: PLAYER, DUNGEON_MASTER, ADMIN
    ├── dice-roller.md        # Dice roller feature: DB schema, tRPC procedures, UI component
    ├── equipment.md          # Equipment system: slots, weapon properties/masteries, armor proficiency, AC calculation
    └── encounters.md         # Encounter system: combat tracking, initiative, HP, conditions, death saves
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
