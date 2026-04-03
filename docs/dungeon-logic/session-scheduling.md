# Dungeon Logic — Session Scheduling & Calendar

## Overview

The session scheduling system allows DMs to schedule game sessions for their adventures, track session status, and give players visibility into upcoming sessions. Each adventure can have multiple sessions, each with a scheduled date/time, optional duration, location, and in-game date reference. Sessions flow through three statuses: SCHEDULED, COMPLETED, and CANCELLED.

Players who are accepted members of an adventure can view all sessions for that adventure. A cross-adventure "upcoming sessions" query lets any user see all their upcoming sessions (as DM or player) in one place, suitable for a dashboard calendar widget.

The feature is implemented as a single tRPC router file with procedures registered under the `adventure.*` namespace.

---

## Key Files

| File | Purpose |
| ---- | ------- |
| `src/server/routers/adventure/sessions.ts` | All session tRPC procedures (registered under `adventure.*`) |
| `prisma/schema.prisma` | `AdventureSession` model and `SessionStatus` enum |

---

## Database Schema

### `SessionStatus` enum

- `SCHEDULED` — session is planned and upcoming
- `COMPLETED` — session has been played
- `CANCELLED` — session was cancelled

### `AdventureSession` — table `"adventure_sessions"`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `String` (cuid) | Primary key |
| `adventureId` | `String` | FK -> `Adventure.id` |
| `title` | `String` | Session title (1-200 chars) |
| `description` | `String?` | Optional description (max 2000 chars) |
| `scheduledAt` | `DateTime` | When the session is scheduled |
| `duration` | `Int?` | Duration in minutes (15-1440) |
| `location` | `String?` | Where the session takes place (max 200 chars) |
| `status` | `SessionStatus` | Default: `SCHEDULED` |
| `inGameDate` | `String?` | In-game calendar date reference (max 200 chars) |
| `createdAt` | `DateTime` | Default: `now()` |
| `updatedAt` | `DateTime` | Auto-updated |

Relations: `adventure` (Adventure).

---

## tRPC Procedures

File: `src/server/routers/adventure/sessions.ts` — procedures are merged into the `adventure` router in `src/server/routers/adventure/index.ts`. Access via `api.adventure.*` on the client.

All procedures are **protected** (require a valid JWT).

| Procedure | Type | Description |
| --------- | ---- | ----------- |
| `adventure.createSession` | mutation | Create a new session for an adventure; DM-only; accepts title, scheduledAt, and optional description, duration, location, inGameDate |
| `adventure.listSessions` | query | List all sessions for an adventure ordered by scheduledAt ascending; includes adventure name; accessible by DM or accepted players |
| `adventure.getSession` | query | Fetch a single session by id with adventure info; accessible by DM or accepted players |
| `adventure.updateSession` | mutation | Partial update of session fields (title, description, scheduledAt, duration, location, inGameDate); DM-only |
| `adventure.updateSessionStatus` | mutation | Update the status field to SCHEDULED, COMPLETED, or CANCELLED; DM-only |
| `adventure.deleteSession` | mutation | Delete a session; DM-only |
| `adventure.getUpcomingSessions` | query | Fetch up to 20 upcoming SCHEDULED sessions (scheduledAt >= now) across all adventures the user is involved in as DM or accepted player; ordered by scheduledAt ascending; includes adventure name and whether the user is the DM |

---

## Authorization Rules

| Action | DM (adventure owner) | Player (accepted) | Non-member |
| ------ | -------------------- | ------------------ | ---------- |
| Create session | Yes | No | No |
| List sessions | Yes | Yes | No |
| Get session | Yes | Yes | No |
| Update session | Yes | No | No |
| Update session status | Yes | No | No |
| Delete session | Yes | No | No |
| Get upcoming sessions | Yes (own adventures) | Yes (joined adventures) | N/A (returns empty) |

---

## Input Validation

| Field | Constraints |
| ----- | ----------- |
| `title` | Required, 1-200 characters |
| `description` | Optional, max 2000 characters |
| `scheduledAt` | Required `Date` (serialized via superjson) |
| `duration` | Optional integer, min 15 minutes, max 1440 minutes (24 hours) |
| `location` | Optional, max 200 characters |
| `inGameDate` | Optional, max 200 characters |
| `status` | Enum: `SCHEDULED`, `COMPLETED`, `CANCELLED` |

---

## Error Scenarios

| Scenario | Error Code | Message |
| -------- | ---------- | ------- |
| Adventure not found | `NOT_FOUND` | Adventure not found |
| Session not found | `NOT_FOUND` | Session not found |
| Non-DM tries to create/update/delete | `FORBIDDEN` | Only the DM can manage sessions |
| Non-member tries to view | `FORBIDDEN` | You do not have access to this adventure |

---

## Upcoming Sessions Query

The `getUpcomingSessions` procedure provides a cross-adventure view of all upcoming sessions for the current user. It queries all `AdventureSession` records where:

1. `status` is `SCHEDULED`
2. `scheduledAt` is in the future (>= now)
3. The linked adventure is either owned by the user (DM) or has the user as an accepted player

Results are ordered by `scheduledAt` ascending and limited to 20 entries. Each result includes the adventure name, source, and a boolean `isDm` flag indicating whether the user is the DM for that adventure.

This is designed for use in a dashboard calendar widget or upcoming sessions sidebar.
