# Dungeon Logic — DM Notes

## Overview

DM Notes allow the Dungeon Master to send notes to individual players within an adventure. Notes appear in the player's character sheet modal on the adventure detail page. Players receive a notification badge on the adventures list showing unread note counts. Players can react to notes with thumbs up or thumbs down.

---

## Database Schema

### `DmNote` — table `"dm_notes"`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `String` (cuid) | Primary key |
| `adventureId` | `String` | FK → `Adventure.id` |
| `fromUserId` | `String` | FK → `User.id` (relation: "dmNotesSent") — the DM who sent the note |
| `toUserId` | `String` | FK → `User.id` (relation: "dmNotesReceived") — the player receiving the note |
| `characterId` | `String` | FK → `Character.id` — the player's character the note is about |
| `content` | `String` | The note text (1-2000 characters) |
| `reaction` | `String?` | Nullable — `"THUMBS_UP"`, `"THUMBS_DOWN"`, or `null` (no reaction) |
| `readAt` | `DateTime?` | Nullable — set when the recipient views the note; used for unread tracking |
| `createdAt` | `DateTime` | Default: `now()` — when the note was created |

---

## tRPC Procedures

File: `src/server/routers/adventure.ts` — registered as `adventure` in `src/server/routers/_app.ts`.

All procedures are **protected** (require a valid JWT). Access via `api.adventure.*` on the client.

### `adventure.sendNote` — mutation

DM sends a note to a player's character in their adventure.

**Input**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `adventureId` | `string` | Yes | The adventure the note belongs to |
| `toUserId` | `string` | Yes | The recipient player's user ID |
| `characterId` | `string` | Yes | The recipient's character ID |
| `content` | `string` | Yes | The note text (1-2000 characters) |

**Business rules**

- Only the adventure owner (DM) can send notes.
- Validates that the adventure exists and is owned by the authenticated user.
- Creates a `DmNote` record with `fromUserId` set to the authenticated user, the provided `toUserId`, `characterId`, and `content`.

**Returns:** the created `DmNote` record.

---

### `adventure.getNotes` — query

Get all DM notes for a character in an adventure.

**Input**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `adventureId` | `string` | Yes | The adventure to get notes for |
| `characterId` | `string` | Yes | The character to get notes for |

**Business rules**

- Accessible by the adventure owner (DM) or the accepted player who owns the character.
- If the authenticated user is the note recipient (the player), all unread notes (where `readAt` is null and `toUserId` matches the user) are automatically marked as read by setting `readAt` to the current timestamp.
- Returns notes sorted by `createdAt` descending (newest first).

**Returns:** `DmNote[]` sorted by `createdAt` descending.

---

### `adventure.reactToNote` — mutation

Player reacts to a DM note.

**Input**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `noteId` | `string` | Yes | The DM note to react to |
| `reaction` | `string` or `null` | Yes | `"THUMBS_UP"`, `"THUMBS_DOWN"`, or `null` (remove reaction) |

**Business rules**

- Only the note recipient (`toUserId`) can react to a note.
- If the note is not found, throws a `NOT_FOUND` error.
- If a non-recipient tries to react, throws a `FORBIDDEN` error.
- Setting reaction to `null` removes the existing reaction (toggle behavior).

**Returns:** the updated `DmNote` record.

---

### `adventure.getUnreadNoteCount` — query

Get unread DM note counts grouped by adventure for the current user.

**Input**

None — uses the authenticated user's ID.

**Business rules**

- Counts all `DmNote` records where `toUserId` matches the authenticated user and `readAt` is null.
- Groups counts by `adventureId`.
- Used by the adventures list page for notification badges.

**Returns:** unread note counts grouped by `adventureId`.

---

## UI Flow

### DM: Viewing Player Character Sheet

On the adventure detail page (`/adventures/[id]`) Players tab, clicking an accepted player card opens a full read-only character sheet modal. The modal displays:

- Ability scores
- Combat stats (HP, AC, speed)
- Saving throws
- Skills
- Active conditions
- Feats
- Backstory
- A **DM Notes** section at the bottom

### DM: Sending Notes

In the character sheet modal's DM Notes section, the DM can type and send notes to the player. The accepted player card in the Players tab is clickable to open the character sheet modal directly.

### DM Notes Pagination

The DM Notes section in the character sheet modal paginates notes at 5 per page. Prev/Next buttons appear below the notes list when there are more than 5 notes. The scroll-based overflow has been replaced with pagination for a cleaner experience.

### Player: Viewing DM Notes in Character View

Players can see DM notes in the Notes tab of their character view (`/characters/[id]`). If the character is in an accepted adventure, a "DM Notes" section appears below the player's own journal. Notes are fetched via `adventure.getNotes` (which also auto-marks them as read). Each note displays its content, date, and reaction buttons (thumbs up/down).

### Player: Notification Badge

On the adventures list page (`/adventures`), a gold circular badge shows the count of unread DM notes per adventure. This is similar to the pending request badge shown for DMs, providing at-a-glance visibility into new notes. The count is fetched via `adventure.getUnreadNoteCount`.

### Player: Viewing & Reacting to Notes

When a player views notes (via the `adventure.getNotes` query), all unread notes are automatically marked as read on the server side. Each DM note displays thumbs up and thumbs down reaction buttons. Players can toggle reactions — clicking an active reaction removes it, clicking a different reaction switches to it.

---

## Error Scenarios

| Scenario | Error Code | Message |
|----------|------------|---------|
| Only adventure owner can send notes | `FORBIDDEN` | Only the adventure owner can send notes |
| Non-member tries to view notes | `FORBIDDEN` | You do not have access to these notes |
| Note not found for reaction | `NOT_FOUND` | Note not found |
| Non-recipient tries to react | `FORBIDDEN` | Only the recipient can react to a note |

---

## Reusability Notes

- The `DmNote` model follows a simple messaging pattern that could be extended with additional features (e.g., attachments, threading) in the future.
- The `reaction` field uses string values rather than an enum, allowing easy extension with additional reaction types.
- The `readAt` pattern for unread tracking is a lightweight alternative to a separate read-receipts table, suitable for a one-to-one messaging context.
