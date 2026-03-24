# Dungeon Logic — Session Notes

## Overview

Session Notes allow both the Dungeon Master and players within an adventure to create and edit shared notes. These notes are visible to all adventure members (the adventure owner and all accepted players). Each note is editable only by its author.

Session Notes appear as a tab on the adventure detail page for both DMs and players.

---

## Database Schema

### `SessionNote` — table `"session_notes"`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `String` (cuid) | Primary key |
| `adventureId` | `String` | FK -> `Adventure.id` |
| `userId` | `String` | FK -> `User.id` — the author of the note |
| `title` | `String` | The note title (min 1 character) |
| `content` | `String` | The note body text (default `""`) |
| `createdAt` | `DateTime` | Default: `now()` — when the note was created |
| `updatedAt` | `DateTime` | Auto-updated — when the note was last modified |

### Reverse relations

- `User.sessionNotes` — `SessionNote[]`
- `Adventure.sessionNotes` — `SessionNote[]`

---

## tRPC Procedures

File: `src/server/routers/adventure.ts` — registered as `adventure` in `src/server/routers/_app.ts`.

All procedures are **protected** (require a valid JWT). Access via `api.adventure.*` on the client.

### `adventure.createSessionNote` — mutation

Create a new session note in an adventure.

**Input**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `adventureId` | `string` | Yes | The adventure the note belongs to |
| `title` | `string` | Yes | The note title (min 1 character) |
| `content` | `string` | No | The note body text (default `""`) |

**Business rules**

- Validates that the adventure exists.
- Only the adventure owner or an accepted player can create session notes.
- Creates a `SessionNote` record with `userId` set to the authenticated user.

**Returns:** the created `SessionNote` record with `user` relation (`{ id, username }`).

---

### `adventure.getSessionNotes` — query

Get all session notes for an adventure.

**Input**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `adventureId` | `string` | Yes | The adventure to get notes for |

**Business rules**

- Validates that the adventure exists.
- Only the adventure owner or an accepted player can view session notes.
- Returns notes sorted by `createdAt` descending (newest first).

**Returns:** `SessionNote[]` with `user` relation (`{ id, username }`), sorted by `createdAt` descending.

---

### `adventure.updateSessionNote` — mutation

Update an existing session note's title and/or content.

**Input**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `noteId` | `string` | Yes | The session note to update |
| `title` | `string` | No | New title (min 1 character if provided) |
| `content` | `string` | No | New content |

**Business rules**

- Validates that the note exists.
- Only the note author (`userId`) can edit the note.
- Updates only the fields that are provided.

**Returns:** the updated `SessionNote` record with `user` relation (`{ id, username }`).

---

## UI Flow

### Tab Placement

The "Session Notes" tab appears on the adventure detail page (`/adventures/[id]`) for both DMs and players:

- **DM tabs:** Story, Monsters, Items, Session Notes, Players
- **Player tabs:** My Character, Inventory, Session Notes

### Layout

The Session Notes tab mirrors the Story tab layout:

- **Left sidebar** (sticky, 240px): Lists all session notes in descending order by creation date. Each entry shows the note title, author username, and date. The active note is highlighted with a gold left border and background. An "Add Session Note" button at the top allows creating new notes.
- **Right panel** (flex): Shows the selected note's title, author, date, and content. If the current user is the author, an "Edit" button appears to switch to edit mode with title/content inputs and Save/Cancel buttons.

### Creating Notes

Clicking "Add Session Note" in the sidebar shows an inline form with a title input field. Pressing Enter or clicking "Create" creates the note. Pressing Escape or "Cancel" dismisses the form.

### Editing Notes

Only the note author sees an "Edit" button on the right panel. Edit mode replaces the display with title and content text inputs. Save persists changes via `adventure.updateSessionNote`.

---

## Error Scenarios

| Scenario | Error Code | Message |
|----------|------------|---------|
| Adventure not found | `NOT_FOUND` | Adventure not found |
| Non-member tries to create note | `FORBIDDEN` | Only adventure members can create session notes |
| Non-member tries to view notes | `FORBIDDEN` | Only adventure members can view session notes |
| Session note not found | `NOT_FOUND` | Session note not found |
| Non-author tries to edit note | `FORBIDDEN` | Only the author can edit a session note |

---

## Reusability Notes

- The `SessionNote` model follows a simple collaborative notes pattern that could be extended with additional features (e.g., pinning, categories, rich text) in the future.
- Access control is consistent: any adventure member (owner or accepted player) can create and view notes, but only the author can edit their own notes.
