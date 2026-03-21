# Dungeon Logic — Architecture

## tRPC Setup

tRPC provides end-to-end type safety from database to UI with no code generation step.

### How it's wired

```
src/server/routers/_app.ts   — Root router (AppRouter type exported from here)
       └── auth              — authRouter (auth.login, auth.register)
       └── user              — userRouter (user.requestDungeonMaster)
       └── dice              — diceRouter (dice.roll, dice.history, dice.globalHistory)
       └── (future routers)  — add here and re-export AppRouter type

src/pages/api/trpc/[trpc].ts — Next.js API route that handles all tRPC calls
src/utils/api.ts             — Client-side tRPC React hook factory (typed to AppRouter)
src/pages/_app.tsx           — Providers: api.Provider + QueryClientProvider
```

### Adding a new router

1. Create `src/server/routers/myFeature.ts` and export `myFeatureRouter`.
2. In `src/server/routers/_app.ts`, import and add it:
   ```typescript
   export const appRouter = createTRPCRouter({
     auth: authRouter,
     user: userRouter,
     dice: diceRouter,
     myFeature: myFeatureRouter,   // ← add here
   });
   ```
3. Use it in any component via `api.myFeature.someQuery.useQuery(...)`.

### Context

The tRPC context (`src/server/trpc.ts`) passes `db` (Prisma client) to every procedure. Access it via `ctx.db` in any mutation or query.

Both `publicProcedure` and `protectedProcedure` exist. `protectedProcedure` verifies the JWT from the `Authorization: Bearer <token>` header and exposes `ctx.user` (id, username, role). Use it for any procedure that requires an authenticated user — the dice router uses it exclusively.

---

## Database

- **Prisma** ORM, PostgreSQL 16.
- Schema: `prisma/schema.prisma`.
- Migrations: `prisma/migrations/`.
- Prisma client is a **singleton** in `src/server/db.ts` (safe for Next.js hot reload in dev).

### Schema change workflow

```bash
# 1. Edit prisma/schema.prisma
# 2. Create and apply a migration
pnpm db:migrate
# 3. Regenerate the Prisma client (usually auto-done by migrate)
pnpm db:generate
```

After adding a new model, Prisma will automatically provide `ctx.db.newModel` in all tRPC procedures.

### Current models

| Model | Table | Purpose |
|-------|-------|---------|
| `User` | `"users"` | Auth identity, stores hashed password and role |
| `DiceRoll` | `"dice_rolls"` | Persisted roll results — linked to `User`, stores diceType, result, optional label, optional adventureId |
| `Character` | `"characters"` | Full D&D 5e character sheet — linked to `User`, stores identity, all six ability scores, and combat stats (HP, AC, speed) |

See `dice-roller.md` for the full `DiceRoll` schema. See `characters.md` for the full `Character` schema.

---

## Conventions

### File naming
- Pages: `src/pages/featureName/index.tsx` for route `/featureName`
- API routers: `src/server/routers/featureName.ts`
- Reusable components: `src/components/ComponentName.tsx`
- React hooks: `src/hooks/useHookName.ts`
- Server utilities: `src/lib/utilityName.ts` (never imported client-side if using Node APIs)
- Static data modules: `src/lib/featureData.ts` — import JSON directly (no `fs`), export typed arrays and helpers. Example: `src/lib/classData.ts` imports all 15 class JSON files from `data/class/` and exports `CLASS_LIST: ClassInfo[]` + `getClassByName(name)`. `src/lib/bookData.ts` imports all 53 book JSONs from `data/book/` and exports `BOOK_DATA_MAP: Record<string, BookSection[]>` (source code → data array), `BOOK_LIST: BookInfo[]`, and named exports `DMG_2014_DATA`, `DMG_2024_DATA`, `PHB_2014_DATA`, `PHB_2024_DATA` used by the rules pages. `src/lib/adventureData.ts` imports all 95 adventure JSONs from `data/adventure/` and exports `ADVENTURE_DATA_MAP: Record<string, AdventureSection[]>` (source code → sections array), `ADVENTURE_LIST: AdventureInfo[]` (source, name) — used by the adventure books listing and detail pages.
- `src/lib/dndTagParser.ts` — exports `parseTaggedText(text: string): string`. Converts 5etools `{@tag ...}` markup to readable plain text (e.g. `{@atkr m}` → `"Melee Attack:"`, `{@hit 7}` → `"+7"`, `{@h}14` → `"(avg. 14)"`, `{@recharge 5}` → `"(Recharge 5-6)"`, `{@actSave int}` → `"Intelligence saving throw"`, `{@actSaveFail}` → `"On a failed save,"`, `{@actSaveSuccess}` → `"On a successful save,"`, `{@actSaveSuccessOrFail}` → `"Regardless of the result,"`). Used in `bestiaryData.ts` when decoding action/trait text and spellcasting entries.

### Import alias
`@/` maps to `src/`. Use it for all non-relative imports:
```typescript
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
```

### Mutations vs queries
- **Mutations** (`useMutation`): any write operation (login, register, create, update, delete).
- **Queries** (`useQuery`): any read operation (fetch characters, campaigns, etc.).
- Always use `onSuccess` / `onError` callbacks for mutations rather than `.then()` chains.

### Error handling
- Server throws `TRPCError` with semantic codes (`UNAUTHORIZED`, `NOT_FOUND`, `CONFLICT`, `BAD_REQUEST`).
- Client receives the error message via `onError: (err) => err.message`.
- Zod validation errors are surfaced as `err.data.zodError` if needed for field-level display.

---

## Auth Architecture Decision

**JWT in localStorage** was chosen for simplicity at this stage. Trade-offs:

| Approach | Pro | Con |
|----------|-----|-----|
| localStorage JWT ✓ | Simple, no cookie config | Vulnerable to XSS (acceptable for internal tool) |
| HttpOnly Cookie JWT | XSS-safe | Requires CSRF protection, more server setup |
| NextAuth / Auth.js | Battle-tested | Heavy dependency, less control |

If security requirements increase (e.g. public-facing), migrate to HttpOnly cookies with `sameSite: strict` and add a `protectedProcedure` that reads the cookie server-side.

---

## Docker / Infrastructure

- `docker-compose.yml` runs PostgreSQL 16 on **port 5999** (non-standard to avoid conflicts with local Postgres on 5432).
- App is built with `output: "standalone"` in `next.config.js` for Docker deployments.
- Multi-stage Dockerfile: deps → builder (Prisma generate + Next build) → lean runner.

---

## Superjson

`superjson` is used as the tRPC transformer. It serializes types that plain JSON cannot handle (e.g., `Date`, `BigInt`, `Map`, `Set`). This means:
- Prisma `DateTime` fields arrive as real `Date` objects on the client, not strings.
- No manual `.toISOString()` or `new Date(str)` conversions needed.
