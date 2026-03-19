# Dungeon Logic — User Roles

## Overview

The system has three user roles stored as a PostgreSQL enum (`UserRole`) in the `users` table.

| Role | Value | Description |
|------|-------|-------------|
| Player | `PLAYER` | Default role assigned on registration. Can request DM status. |
| Dungeon Master | `DUNGEON_MASTER` | A Player who has been elevated to DM. All DMs are Players; not all Players are DMs. |
| Admin | `ADMIN` | Separate administrative role. Not a Player or DM — a distinct authority. |

---

## Prisma Enum

Defined in `prisma/schema.prisma`:

```prisma
enum UserRole {
  PLAYER
  DUNGEON_MASTER
  ADMIN
}
```

The `User` model carries a `role` field defaulting to `PLAYER`:

```prisma
role UserRole @default(PLAYER)
```

Migration: `prisma/migrations/*/migration.sql` — `add_user_roles`.

---

## Application-Layer Constants

`src/lib/constants.ts` exports a type-strict tuple that mirrors the Prisma enum. Use these for any application-layer role checks, guards, or string comparisons — **do not use plain string literals**.

```ts
export const USER_ROLES = ["PLAYER", "DUNGEON_MASTER", "ADMIN"] as const;
export type UserRoleType = (typeof USER_ROLES)[number];
```

---

## How Roles Are Assigned

### Player (default)

Every user created via `auth.register` is given `role: UserRole.PLAYER` explicitly. The Prisma schema default is also `PLAYER`, providing a double guarantee.

### Dungeon Master

Dungeon Masters are not created at registration. A Player may request the DM role via the `user.requestDungeonMaster` tRPC mutation.

**Current status:** The mutation is scaffolded and returns `{ success: true, message: "Request submitted" }`. The actual approval workflow (admin review, notification, role update) is not yet implemented.

File: `src/server/routers/user.ts`

```ts
// TODO: Implement the actual approval process once the admin
// review workflow is designed.
requestDungeonMaster: publicProcedure.mutation(async () => {
  return { success: true, message: "Request submitted" };
}),
```

### Admin

Admin accounts are **created manually** by directly updating a user's `role` column in the database:

```sql
UPDATE users SET role = 'ADMIN' WHERE username = 'target_username';
```

There is no UI or API endpoint for granting Admin status. This is intentional — admin elevation must be a deliberate, out-of-band operation.

---

## JWT Payload

The `role` field is embedded in the JWT at login and registration:

```ts
// JwtPayload in src/lib/jwt.ts
export interface JwtPayload {
  userId: string;
  username: string;
  role: UserRoleType;
}
```

The role is read client-side from the decoded token via `useAuth()`:

```ts
const { user } = useAuth();
// user.role is "PLAYER" | "DUNGEON_MASTER" | "ADMIN"
```

---

## Dashboard Greeting

`src/pages/dashboard/index.tsx` maps the role to a D&D-themed greeting:

| Role | Greeting |
|------|---------|
| `DUNGEON_MASTER` | "Hail, Dungeon Master [username]!" |
| `PLAYER` | "Hail, Adventurer [username]!" |
| `ADMIN` | "Hail, Admin [username]!" |

---

## Key Files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | `UserRole` enum and `role` field on `User` model |
| `src/lib/constants.ts` | `USER_ROLES` tuple and `UserRoleType` for application-layer type safety |
| `src/lib/jwt.ts` | `JwtPayload` interface includes `role: UserRoleType` |
| `src/server/routers/auth.ts` | Login and register include `role` in token and response |
| `src/server/routers/user.ts` | `user.requestDungeonMaster` stub mutation |
| `src/hooks/useAuth.ts` | `AuthUser` interface exposes `role` from decoded JWT |
| `src/pages/dashboard/index.tsx` | Role-based greeting rendered from `user.role` |
