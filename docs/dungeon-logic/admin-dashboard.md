# Dungeon Logic — Admin Dashboard

## Overview

The Admin Dashboard provides system-wide oversight tools exclusively for users with the `ADMIN` role. It covers user management, adventure oversight, DM request handling, and system statistics. All admin pages live under `/admin/*` and all admin tRPC procedures enforce `ADMIN` role checks, throwing `FORBIDDEN` for non-admin callers.

---

## Navigation

The `NavBar` renders the following items for `ADMIN` users:

| Nav Label            | Route                 |
| -------------------- | --------------------- |
| Admin Dashboard      | `/admin`              |
| User Management      | `/admin/users`        |
| Adventure Oversight  | `/admin/adventures`   |
| DM Requests          | `/admin/dm-requests`  |
| Global Settings      | `/admin/settings`     |

---

## Pages

### Admin Dashboard (`/admin`)

**File:** `src/pages/admin/index.tsx`

The dashboard home page displays a stats grid using `admin.getStats`. Statistics shown:

- Total users
- Users by role (PLAYER, DUNGEON_MASTER, ADMIN)
- Total characters
- Total adventures
- Active encounters
- Total dice rolls
- Recent signups (last 7 days)
- Pending DM requests

### User Management (`/admin/users`)

**File:** `src/pages/admin/users/index.tsx`

Paginated user list with:

- **Search** by username (case-insensitive)
- **Role filter** dropdown (PLAYER, DUNGEON_MASTER, ADMIN)
- Per-user info: username, role, created date, character/adventure/dice roll counts
- **Role change** dropdown per user (calls `admin.updateUserRole`)
- **Delete** button with confirmation (calls `admin.deleteUser`)

Uses `admin.getUsers` with `search`, `role`, `page`, and `pageSize` parameters.

### Adventure Oversight (`/admin/adventures`)

**File:** `src/pages/admin/adventures/index.tsx`

Paginated adventure list with:

- **Search** by adventure name (case-insensitive)
- Per-adventure info: name, source, owner username, player/monster/item counts, active encounter status (round number if active)
- Pagination controls

Uses `admin.getAdventures` with `search`, `page`, and `pageSize` parameters.

### DM Requests (`/admin/dm-requests`)

**File:** `src/pages/admin/dm-requests/index.tsx`

Lists pending DM requests with approve and reject actions:

- Each entry shows username and request date
- **Approve** button with confirmation dialog (calls `admin.approveDmRequest` — promotes user to DUNGEON_MASTER)
- **Reject** button with confirmation dialog (calls `admin.rejectDmRequest` — marks request as REJECTED)

Uses `admin.getDmRequests` to fetch pending requests.

---

## tRPC Procedures

**Router file:** `src/server/routers/admin.ts`

All procedures use `protectedProcedure` and check `ctx.user.role === "ADMIN"` at the top, throwing `TRPCError({ code: "FORBIDDEN" })` for non-admin users.

| Procedure                | Type     | Input                                                                 | Description                                                                                                     |
| ------------------------ | -------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `admin.getDmRequests`    | query    | none                                                                  | List pending DM requests with user info (`id`, `username`), ordered by `requestedAt` desc                       |
| `admin.approveDmRequest` | mutation | `{ requestId: string }`                                               | Set request status to APPROVED, record `resolvedAt` and `resolvedBy`; promote user role to DUNGEON_MASTER       |
| `admin.rejectDmRequest`  | mutation | `{ requestId: string }`                                               | Set request status to REJECTED, record `resolvedAt` and `resolvedBy`                                            |
| `admin.getStats`         | query    | none                                                                  | Return system-wide counts: totalUsers, usersByRole, totalCharacters, totalAdventures, activeEncounters, totalDiceRolls, recentSignups (7 days), pendingDmRequests |
| `admin.getUsers`         | query    | `{ search?: string, role?: enum, page?: int, pageSize?: int }`       | Paginated user list; search filters by username (case-insensitive); role filters by role; returns users with character/adventure/dice roll `_count`, plus `total`, `page`, `pageSize` |
| `admin.updateUserRole`   | mutation | `{ userId: string, role: enum }`                                      | Change a user's role; rejects self-role-change with `BAD_REQUEST`                                                |
| `admin.deleteUser`       | mutation | `{ userId: string }`                                                  | Delete a user and all related data in a transaction; rejects self-deletion with `BAD_REQUEST`                    |
| `admin.getAdventures`    | query    | `{ search?: string, page?: int, pageSize?: int }`                    | Paginated adventure list; search filters by name (case-insensitive); returns adventures with owner, player/monster/item `_count`, encounter status, plus `total`, `page`, `pageSize` |

---

## User Deletion — Cascade Order

`admin.deleteUser` wraps all deletions in a `$transaction` to maintain referential integrity. The deletion order:

1. Encounter participants linked through the user's adventure players
2. Character inventory items linked through the user's adventure players
3. Inventory items added by the user (`addedByUserId`)
4. Adventure players
5. DM notes (sent and received)
6. Session notes
7. For adventures owned by the user:
   - Encounter participants in owned adventures
   - Encounters
   - Inventory items in owned adventures
   - Adventure players in owned adventures
   - DM notes in owned adventures
   - Session notes in owned adventures
   - Adventure monsters and items
   - The adventures themselves
8. Characters
9. Dice rolls
10. DM requests
11. The user record

---

## Role-Based Access

All admin functionality is gated at two levels:

1. **Client-side:** `ProtectedRoute` wraps each admin page; `NavBar` only shows admin links for `ADMIN` role users.
2. **Server-side:** Every admin tRPC procedure checks `ctx.user.role !== "ADMIN"` and throws `FORBIDDEN` before executing any database operation.

---

## Key Files

| File                                      | Purpose                                     |
| ----------------------------------------- | ------------------------------------------- |
| `src/server/routers/admin.ts`             | All admin tRPC procedures                   |
| `src/pages/admin/index.tsx`               | Dashboard stats page                        |
| `src/pages/admin/users/index.tsx`         | User management page                        |
| `src/pages/admin/adventures/index.tsx`    | Adventure oversight page                    |
| `src/pages/admin/dm-requests/index.tsx`   | DM request approval/rejection page          |
| `src/pages/admin/settings/index.tsx`      | Global settings placeholder                 |
| `src/components/NavBar.tsx`               | Admin navigation items                      |
