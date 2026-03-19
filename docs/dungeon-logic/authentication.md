# Dungeon Logic — Authentication

## Overview

Authentication uses **JWT (JSON Web Tokens)** issued by the server on login/register, stored client-side in `localStorage`, and checked on every protected page load.

There are no sessions, no cookies, no server-side session store. All auth state lives in the JWT.

---

## User Model (Prisma)

```prisma
enum UserRole {
  PLAYER
  DUNGEON_MASTER
  ADMIN
}

model User {
  id        String   @id @default(cuid())
  username  String   @unique
  password  String                        // bcrypt hash, never plaintext
  role      UserRole @default(PLAYER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@map("users")
}
```

- IDs are **cuid** strings (not integers).
- `username` is the only identifier — no email field.
- Passwords are hashed with **bcryptjs at 12 salt rounds**.
- `role` defaults to `PLAYER` on every new registration. See `docs/dungeon-logic/roles.md` for the full role system.

---

## Auth Flow

### Registration

```
Client                      Server (tRPC)               Database
  |                              |                           |
  |-- auth.register mutation --> |                           |
  |   { username, password }     |                           |
  |                              |-- findUnique(username) -->|
  |                              |<-- null (not found) ------|
  |                              |-- bcrypt.hash(pw, 12) --> |
  |                              |-- user.create() --------> |
  |                              |<-- user record -----------|
  |                              |-- signToken(userId, username)
  |<-- { success, user, token } -|
  |                              |
  |-- localStorage.setItem("dnd_token", token)
  |-- router.push("/dashboard")
```

### Login

```
Client                      Server (tRPC)               Database
  |                              |                           |
  |-- auth.login mutation -----> |                           |
  |   { username, password }     |                           |
  |                              |-- findUnique(username) -->|
  |                              |<-- user record -----------|
  |                              |-- bcrypt.compare(pw, hash)|
  |                              |-- signToken(userId, username)
  |<-- { success, user, token } -|
  |                              |
  |-- localStorage.setItem("dnd_token", token)
  |-- router.push("/dashboard")
```

### Accessing a Protected Page

```
Browser
  |
  |-- navigates to /dashboard
  |
  ProtectedRoute (useEffect on mount)
  |-- localStorage.getItem("dnd_token")
  |-- base64-decode JWT payload
  |-- check payload.exp * 1000 > Date.now()
  |
  |-- VALID:   render page children
  |-- INVALID: router.replace("/unauthorized")

/unauthorized page
  |-- 10-second countdown (setTimeout, not setInterval)
  |-- auto router.replace("/") after countdown hits 0
  |-- "Flee to the Login Scroll" button for immediate exit
```

### Logout

```
useAuth().logout()
  |-- localStorage.removeItem("dnd_token")
  |-- setUser(null) in React state
  |-- caller redirects to "/"
```

---

## Key Files

| File | Role |
|------|------|
| `src/lib/jwt.ts` | **Server-only.** `signToken(payload)` → JWT string. `verifyToken(token)` → decoded payload. Uses `JWT_SECRET` env var. Falls back to `"dev-secret-change-in-production"` if unset. |
| `src/server/routers/auth.ts` | tRPC mutations: `auth.login` and `auth.register`. Both return `{ success, user, token }`. |
| `src/hooks/useAuth.ts` | Client hook. Returns `{ user, isAuthenticated, isLoading, logout }`. Reads token from localStorage on mount. |
| `src/components/ProtectedRoute.tsx` | Wrap any page with this to require authentication. Redirects to `/unauthorized` if token is missing or expired. |
| `src/pages/unauthorized.tsx` | Standalone fallback page. 10s countdown + D&D humour. |

---

## JWT Details

- **Algorithm:** HS256 (jsonwebtoken default)
- **Expiry:** 7 days
- **Payload:** `{ userId: string, username: string, role: UserRoleType, iat: number, exp: number }`
- **Storage:** `localStorage` key `"dnd_token"`
- **Verification on client:** Decode base64 payload, check `exp`. No signature verification on client — server verifies via `verifyToken` when needed for protected API calls.

The `role` field is a `UserRoleType` string (`"PLAYER"`, `"DUNGEON_MASTER"`, or `"ADMIN"`) drawn from the `USER_ROLES` tuple in `src/lib/constants.ts`.

---

## Validation Rules (Zod)

| Field | Login | Register |
|-------|-------|----------|
| `username` | min 1 char | min 3 chars |
| `password` | min 1 char | min 6 chars |

---

## Error Codes

| Scenario | tRPC Error Code | Message |
|----------|----------------|---------|
| Wrong credentials | `UNAUTHORIZED` | "Invalid username or password" |
| Username taken | `CONFLICT` | "Username already taken" |
| Zod validation fail | `BAD_REQUEST` | Field-level error via `zodError` |

---

## How to Add a New Protected Page

1. Create the page file, e.g. `src/pages/characters/index.tsx`
2. Wrap the content component in `<ProtectedRoute>`:

```tsx
import { ProtectedRoute } from "../../components/ProtectedRoute";

function CharactersContent() {
  // your page here
}

export default function CharactersPage() {
  return (
    <ProtectedRoute>
      <CharactersContent />
    </ProtectedRoute>
  );
}
```

That's it. If the user is not authenticated they will be sent to `/unauthorized` automatically.

---

## How to Add a New tRPC Procedure That Requires Auth

Currently there is no `protectedProcedure`. When one is needed:

1. Add a `protectedProcedure` to `src/server/trpc.ts` that reads the JWT from request headers and calls `verifyToken`.
2. Use it in any router mutation/query instead of `publicProcedure`.
3. The client must pass the token via tRPC headers (configured in `src/pages/_app.tsx` `httpBatchLink`).

This is the planned next step for any user-specific data features.
