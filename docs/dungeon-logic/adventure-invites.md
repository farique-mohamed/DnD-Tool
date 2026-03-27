# Dungeon Logic — Adventure Invites

## Overview

The adventure player invite system allows Dungeon Masters to invite players to their adventures using unique invite codes. Players enter the code to request to join, creating a pending request. The DM can then review pending requests and accept or reject each player.

This enables collaborative play by bridging DM-owned adventures with player access, while keeping the DM in full control of who participates.

---

## Database Schema

### `AdventurePlayer` — table `"adventure_players"`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `String` (cuid) | Primary key |
| `adventureId` | `String` | FK → `Adventure.id` |
| `userId` | `String` | FK → `User.id` |
| `characterId` | `String` | FK → `Character.id` — the character joining the adventure |
| `status` | `String` | `"PENDING"`, `"ACCEPTED"`, or `"REJECTED"` |
| `joinedAt` | `DateTime` | Default: `now()` — when the player submitted the join request |
| `resolvedAt` | `DateTime?` | Nullable — set when the DM accepts or rejects the request |

**Unique constraint:** `@@unique([adventureId, userId])` — a user can only have one membership record per adventure.

### `Character` model updates

The `Character` model now includes an `adventurePlayers` relation (`AdventurePlayer[]`), linking characters to the adventures they have joined.

### `Adventure` model updates

The `Adventure` model now includes two additional fields:

| Field | Type | Notes |
|-------|------|-------|
| `inviteCode` | `String` (unique) | Auto-generated cuid; used by players to join the adventure |
| `players` | `AdventurePlayer[]` | Relation — all player membership records for the adventure |

---

## tRPC Procedures

File: `src/server/routers/adventure.ts` — registered as `adventure` in `src/server/routers/_app.ts`.

All procedures are **protected** (require a valid JWT). Access via `api.adventure.*` on the client.

### `adventure.getInviteCode` — query

Returns the unique invite code for a DM's adventure. Only the adventure owner (DM) can retrieve the code.

**Input**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `adventureId` | `string` | Yes | The adventure to get the invite code for |

**Business rules**

- Only the adventure owner can retrieve the invite code.
- Returns the `inviteCode` field from the adventure record.

---

### `adventure.joinByCode` — mutation

Allows a user to request to join an adventure by entering its invite code and selecting a character. Creates a `PENDING` `AdventurePlayer` record linking the chosen character to the adventure.

**Input**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `inviteCode` | `string` | Yes | The invite code shared by the DM |
| `characterId` | `string` | Yes | The character to join with (must belong to the user) |

**Business rules**

- Looks up the adventure by `inviteCode`.
- If the code is invalid, throws a `NOT_FOUND` error.
- Validates that the character exists and belongs to the authenticated user. If not, throws a `BAD_REQUEST` error.
- A character can only be in one adventure at a time (PENDING or ACCEPTED). If the character is already associated with any adventure, the request is rejected with a `BAD_REQUEST` error.
- If the user already has an `ACCEPTED` record for that adventure, throws a `BAD_REQUEST` error (already a member).
- If the user has a previous `REJECTED` record, the status is reset to `PENDING` and the `characterId` is updated (re-request after rejection).
- If the user already has a `PENDING` record, throws a `BAD_REQUEST` error (already pending).
- The adventure owner cannot join their own adventure. DMs can join other DMs' adventures as players.
- Creates a new `AdventurePlayer` record with `status: "PENDING"` and the selected `characterId`.

**Returns:** `{ success: true, adventureName: string }`.

---

### `adventure.getPendingPlayers` — query

Returns all pending join requests for an adventure. Only the adventure owner (DM) can view these.

**Input**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `adventureId` | `string` | Yes | The adventure to get pending players for |

**Business rules**

- Only the adventure owner can view pending requests.
- Filters `AdventurePlayer` records where `status: "PENDING"`.
- Includes the `user` relation (so the DM can see player usernames) and the `character` relation (so the DM can review the character sheet).

**Returns:** `AdventurePlayer[]` with `user` and `character` relations, filtered to `PENDING` status.

---

### `adventure.resolvePlayer` — mutation

Allows the DM to accept or reject a pending player request.

**Input**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `adventurePlayerId` | `string` | Yes | The `AdventurePlayer` record to resolve |
| `action` | `string` | Yes | `"ACCEPTED"` or `"REJECTED"` |

**Business rules**

- Only the adventure owner can resolve player requests.
- Updates the `status` field to the provided action value.
- Sets `resolvedAt` to the current timestamp.
- The target `AdventurePlayer` must exist and belong to an adventure owned by the DM.

**Returns:** the updated `AdventurePlayer` record.

---

### `adventure.getAcceptedPlayers` — query

Returns all accepted players for an adventure. Only the adventure owner (DM) can view this list.

**Input**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `adventureId` | `string` | Yes | The adventure to get accepted players for |

**Business rules**

- Only the adventure owner can view accepted players.
- Filters `AdventurePlayer` records where `status: "ACCEPTED"`.
- Includes the `user` relation and the `character` relation.

**Returns:** `AdventurePlayer[]` with `user` and `character` relations, filtered to `ACCEPTED` status.

---

### `adventure.list` — query (updated)

Previously returned only adventures owned by the authenticated user. Now also returns adventures where the user is an `ACCEPTED` player.

**Updated behavior**

- For DMs: returns owned adventures with `_count.players` indicating the number of `PENDING` requests (used for the badge in the UI).
- For players: also returns adventures where the user has an `ACCEPTED` `AdventurePlayer` record.
- Includes the `user` relation (`{ id, username }`) on each adventure, allowing the frontend to distinguish between owned and joined adventures by comparing `adventure.user.id` to the current user.

---

### `adventure.getById` — query (updated)

Previously restricted access to the adventure owner only. Now also allows access for accepted players.

**Updated behavior**

- Allows access if the user owns the adventure OR has an `ACCEPTED` `AdventurePlayer` record.
- Includes the `players` array with the `user` relation and the `character` relation (so the adventure detail page can display participant and character information).
- Still includes associated monsters and items.

---

## UI Flow

### NavBar Labels

The NavBar displays a role-specific label for the adventures link (both link to `/adventures`):

- **DUNGEON_MASTER**: "My Campaigns"
- **PLAYER**: "My Adventures"

### Adventures Page (`/adventures`)

The page title is "Adventures". The "Join Adventure" button is visible for all roles (DMs and players alike), since DMs can join other DMs' adventures as players.

**DM view** — two sections:

1. **My Campaigns** — adventures owned by the DM. Each adventure card displays a "Get Invite Code" button that reveals the unique invite code with a copy-to-clipboard button. A gold badge on the card shows the count of pending join requests (from `_count.players`), giving the DM at-a-glance visibility into new requests.
2. **Joined Adventures** — adventures where the DM has been accepted as a player in another DM's game.

**Player view** — single "My Adventures" section showing adventures where the player has been accepted.

### Joining an Adventure (Two-Step Modal)

Clicking the "Join Adventure" button opens a two-step modal:

1. **Step 1 — Enter Code**: The user enters the invite code shared by the DM.
2. **Step 2 — Select Character**: After entering a valid code, the user selects which of their characters to join with. This calls `adventure.joinByCode` with both the `inviteCode` and `characterId`.

On success, the user is shown a confirmation that their request is pending DM approval.

### Adventure Detail Page (`/adventures/[id]`)

The page is accessible to both adventure owners and accepted players (no DM-only redirect). The breadcrumb navigation is role-aware: it shows "My Campaigns" if the user owns the adventure, or "My Adventures" if the user joined as a player.

### DM: Managing Players

On the `/adventures/[id]` adventure detail page, DMs see a "Players" tab alongside the existing Story, Monsters, Items, and Session Notes tabs. The Players tab presents a unified view with labeled subsections:

1. **Pending Requests** — a labeled subsection within the Players view showing players who have requested to join via invite code. Each entry shows the player's username and a character overview with ability scores, combat stats (HP, AC, speed), and alignment in an expand/collapse layout. "Accept" and "Reject" buttons appear per player. Accepting calls `adventure.resolvePlayer` with action `"ACCEPTED"`, rejecting calls it with `"REJECTED"`. When there are pending requests, this subsection appears at the top; when there are none, it moves to the bottom below the accepted players list.
2. **Accepted Players** — a labeled subsection showing players who have been accepted into the adventure. Each accepted player card is clickable, opening a full read-only character sheet modal displaying ability scores, combat stats, saving throws, skills, active conditions, feats, backstory, and a DM Notes section. See `dm-notes.md` for full DM Notes documentation.

---

## Error Scenarios

| Scenario | Error Code | Message |
|----------|------------|---------|
| Invalid invite code | `NOT_FOUND` | Adventure not found |
| Character not found or not owned by user | `BAD_REQUEST` | Character not found or does not belong to you |
| Already an accepted member | `BAD_REQUEST` | Already a member |
| Already has a pending request | `BAD_REQUEST` | Already requested to join |
| Character already in an adventure | `BAD_REQUEST` | This character is already in an adventure |
| DM tries to join own adventure | `BAD_REQUEST` | You cannot join your own adventure |
| Non-owner tries to get invite code | `FORBIDDEN` | Only the DM can view the invite code |
| Non-owner tries to resolve players | `FORBIDDEN` | Only the DM can resolve player requests |

---

## Reusability Notes

- The `AdventurePlayer` model is a generic membership/invite pattern that could be extended with additional statuses (e.g. `KICKED`, `LEFT`) in the future.
- The `inviteCode` on `Adventure` is a cuid generated at adventure creation time — no separate invite management is needed.
- Re-requesting after rejection is handled by updating the existing record rather than creating a duplicate, respecting the unique constraint on `[adventureId, userId]`.
