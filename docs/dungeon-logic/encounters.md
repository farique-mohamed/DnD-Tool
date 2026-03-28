# Dungeon Logic — Encounter System

## Overview

The encounter system provides real-time combat tracking for a D&D adventure. Each adventure can have at most one active encounter at a time. The DM creates and manages the encounter, adding player characters and monsters as participants. All participants are tracked on a shared initiative order with round counting, HP management, condition tracking, and death saves.

Players see the encounter in real time via a 3-second polling interval. Monster HP and AC are completely hidden from players (not shown at all — no placeholder text). Death saves can optionally be made private so only the owning player and the DM can see them.

The DM can add monsters via a search bar that queries the full bestiary (`MONSTER_LIST`), which auto-fills HP, AC, and source from the selected monster's stat block. A "Custom Monster" toggle allows manual entry for homebrew creatures. Monster participants are expandable — the DM can click to reveal the full stat block (traits, actions, legendary actions, etc.) inline, matching the format used in the Monsters tab.

The feature is implemented across two files: one tRPC router for server logic and one React component for the UI.

---

## Key Files

| File | Purpose |
| ---- | ------- |
| `src/server/routers/adventure/encounter.ts` | All encounter tRPC procedures (registered under `adventure.*`) |
| `src/components/adventure/EncounterTab.tsx` | Encounter UI tab within the adventure detail page |
| `prisma/schema.prisma` | `Encounter` and `EncounterParticipant` models |

---

## Database Schema

### `Encounter` — table `"encounters"`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `String` (cuid) | Primary key |
| `adventureId` | `String` | FK → `Adventure.id`, unique (one encounter per adventure) |
| `currentTurnIndex` | `Int` | Index into the sorted participants list; default `0` |
| `round` | `Int` | Current combat round; default `1` |
| `privateDeathSaves` | `Boolean` | When `true`, death saves are hidden from other players; default `false` |
| `createdAt` | `DateTime` | Default: `now()` |
| `updatedAt` | `DateTime` | Auto-updated |

Relations: `adventure` (Adventure), `participants` (EncounterParticipant[]).

### `EncounterParticipant` — table `"encounter_participants"`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `String` (cuid) | Primary key |
| `encounterId` | `String` | FK → `Encounter.id`, cascading delete |
| `type` | `EncounterParticipantType` | Enum: `PLAYER` or `MONSTER` |
| `initiativeRoll` | `Int` | Initiative value for sort order |
| `sortOrder` | `Int` | Tiebreaker for equal initiative; default `0` |
| `adventurePlayerId` | `String?` | FK → `AdventurePlayer.id` (set for PLAYER type only) |
| `name` | `String?` | Monster name (set for MONSTER type only) |
| `monsterSource` | `String?` | Monster source book (MONSTER type only) |
| `maxHp` | `Int?` | Maximum HP |
| `currentHp` | `Int?` | Current HP |
| `tempHp` | `Int` | Temporary HP; default `0` |
| `armorClass` | `Int?` | Armor Class |
| `conditions` | `String` | JSON string[] of active condition names; default `"[]"` |
| `deathSaveSuccesses` | `Int` | 0–3; default `0` |
| `deathSaveFailures` | `Int` | 0–3; default `0` |
| `isActive` | `Boolean` | Whether the participant takes turns; default `true` |
| `createdAt` | `DateTime` | Default: `now()` |

---

## tRPC Procedures

File: `src/server/routers/adventure/encounter.ts` — procedures are merged into the `adventure` router in `src/server/routers/adventure/index.ts`. Access via `api.adventure.*` on the client.

All procedures are **protected** (require a valid JWT).

| Procedure | Type | Description |
| --------- | ---- | ----------- |
| `adventure.createEncounter` | mutation | Create a new encounter for an adventure; DM-only; rejects if an encounter already exists |
| `adventure.getEncounter` | query | Fetch the active encounter with all participants (sorted by initiative desc, sortOrder asc); accessible to DM and accepted players; hides monster HP from players; hides death saves from non-owning players when `privateDeathSaves` is enabled |
| `adventure.endEncounter` | mutation | End and delete the encounter; syncs player conditions back to character sheets before deletion; DM-only |
| `adventure.addEncounterPlayer` | mutation | Add an accepted adventure player to the encounter with an initiative roll; copies character HP, tempHp, AC, and conditions into the participant; DM-only |
| `adventure.addEncounterMonster` | mutation | Add a monster to the encounter with name, source, maxHp, AC, and initiative; DM-only |
| `adventure.removeParticipant` | mutation | Remove a participant from the encounter; syncs conditions back to character sheet for players; DM-only |
| `adventure.nextTurn` | mutation | Advance to the next active participant; increments round when wrapping past the last participant; DM can always advance; players can only advance when it is their turn |
| `adventure.updateParticipantHp` | mutation | Apply damage, healing, or set temp HP on a participant; DM can update any participant; players can only update their own character; monsters are DM-only |
| `adventure.updateParticipantConditions` | mutation | Set the full conditions list for a participant; DM can update any; players can update their own; syncs to character sheet for player participants |
| `adventure.updateDeathSaves` | mutation | Set death save successes (0–3) and failures (0–3); DM or owning player only |
| `adventure.togglePrivateDeathSaves` | mutation | Toggle the `privateDeathSaves` flag on the encounter; DM-only |
| `adventure.updateInitiative` | mutation | Change a participant's initiative roll; DM-only |

---

## Authorization Rules

| Action | DM (adventure owner) | Player (own character) | Player (other character) |
| ------ | -------------------- | ---------------------- | ------------------------ |
| Create / end encounter | Yes | No | No |
| View encounter | Yes | Yes (if accepted) | Yes (if accepted) |
| Add / remove participants | Yes | No | No |
| Advance turn | Yes (always) | Yes (only on their turn) | No |
| Update HP (player) | Yes | Yes | No |
| Update HP (monster) | Yes | No | No |
| Update conditions | Yes | Yes | No |
| Update death saves | Yes | Yes | No |
| Toggle private death saves | Yes | No | No |
| Update initiative | Yes | No | No |

### Data visibility restrictions for players

- **Monster HP**: `maxHp`, `currentHp`, and `tempHp` are set to `null` in the response for all MONSTER-type participants when the viewer is not the DM.
- **Death saves**: When `privateDeathSaves` is `true`, `deathSaveSuccesses` and `deathSaveFailures` are set to `null` for participants that do not belong to the viewing player. The DM always sees all death saves.

---

## HP Management Mechanics

The `updateParticipantHp` procedure supports three operation types:

### Healing (`type: "heal"`)

```
currentHp = min(maxHp, currentHp + amount)
```

Healing cannot exceed maximum HP. Temp HP is unaffected.

### Damage (`type: "damage"`)

Damage is absorbed by temporary HP first:

```
remainingDamage = max(0, amount - tempHp)
tempHp = max(0, tempHp - amount)
currentHp = max(0, currentHp - remainingDamage)
```

HP cannot go below zero.

### Set Temp HP (`type: "setTempHp"`)

```
tempHp = amount
```

Replaces the current temp HP value directly.

### Character sheet sync

When a PLAYER participant's HP is updated, the corresponding `Character` record is also updated with the new `currentHp` and `tempHp` values. This keeps the character sheet in sync with encounter state.

---

## Condition Sync

Conditions are stored as a JSON string array on both `EncounterParticipant.conditions` and `Character.activeConditions`.

### Adding a player to the encounter

When a player is added via `addEncounterPlayer`, their character's `activeConditions` are copied into the participant's `conditions` field.

### During the encounter

When `updateParticipantConditions` is called for a PLAYER participant, both the participant and the linked `Character` record are updated simultaneously.

### Removing a player / ending the encounter

When a player is removed via `removeParticipant` or the encounter ends via `endEncounter`, the participant's current conditions are written back to the character's `activeConditions` field. This ensures conditions applied during combat persist on the character sheet after the encounter ends.

---

## Death Save System

Each participant tracks `deathSaveSuccesses` (0–3) and `deathSaveFailures` (0–3). These values are updated directly via `updateDeathSaves`.

### Private death saves

The DM can toggle `privateDeathSaves` on the encounter. When enabled:

- Each player can only see their own death saves.
- Other players' death save counts are returned as `null` from the `getEncounter` query.
- The DM always sees all death saves regardless of this setting.

The toggle is displayed in the encounter header as a button showing the current state ("Death Saves: Private" or "Death Saves: Public").

---

## Initiative Order and Turn Advancement

### Sort order

Participants are sorted by `initiativeRoll` descending, with `sortOrder` ascending as a tiebreaker. This order determines the turn sequence.

### Turn tracking

The `Encounter.currentTurnIndex` field stores the index of the currently active participant in the sorted list. The UI highlights the current participant's card with a gold border and glow.

### Advancing turns (`nextTurn`)

1. Starting from `currentTurnIndex`, iterate forward through the participant list.
2. Skip participants where `isActive` is `false`.
3. If the index wraps past the end of the list, increment the `round` counter.
4. Update the encounter with the new `currentTurnIndex` and `round`.

The DM can always advance the turn. A player can advance the turn only when the current turn belongs to one of their participants.

### Editing initiative

The DM can click on any participant's initiative number to edit it inline. The `updateInitiative` procedure updates the `initiativeRoll` value, and the participant list re-sorts on the next fetch.

---

## Polling Strategy

The `EncounterTab` component uses a **3-second refetch interval** on the `getEncounter` query:

```tsx
const { data: encounter } = api.adventure.getEncounter.useQuery(
  { adventureId },
  { refetchInterval: 3000 },
);
```

This ensures all players see near-real-time updates to initiative order, HP changes, conditions, and turn advancement without requiring WebSocket infrastructure.

In addition to polling, every mutation's `onSuccess` callback calls `utils.adventure.getEncounter.invalidate()` to trigger an immediate refetch for the user who performed the action.

---

## Frontend Component

File: `src/components/adventure/EncounterTab.tsx`

Rendered as a tab within the adventure detail page (`/adventures/[id]`). Receives `adventureId`, `isOwner`, and `acceptedPlayers` as props.

### Component states

| State | DM view | Player view |
| ----- | ------- | ----------- |
| No encounter | "Start Encounter" button | "No active encounter" message |
| Active encounter | Full controls (add participants, manage HP, advance turns, end encounter) | Limited controls (own HP/conditions, advance turn on own turn) |

### Participant cards

Each participant is rendered as a card in initiative order. Card styling varies:

| State | Style |
| ----- | ----- |
| Current turn | Gold border (`2px solid #c9a84c`) with glow shadow |
| Active (not current) | Default card with subtle border |
| Inactive | Default card at 45% opacity |

Each card displays:
- Initiative number (click-to-edit for DM)
- Participant name (character name + username for players, monster name for monsters)
- Type badge (PLAYER / MONSTER)
- AC value
- HP bar with color coding (green > 50%, gold > 25%, red <= 25%)
- HP numbers (hidden for monsters when viewed by players)
- Temp HP indicator
- Active conditions as tags
- Death save indicators (when HP is 0 and participant is active)
- Action buttons (HP edit, conditions, remove — based on permissions)

### DM controls

- **Add Player form**: dropdown of accepted players not yet in the encounter, initiative roll input
- **Add Monster form**: name, source, max HP, AC, and initiative roll inputs
- **Next Turn** button (always available)
- **Death Saves toggle** button
- **End Encounter** button (with confirmation step)

### Player controls

- **Next Turn** button (visible only on their own turn)
- **HP edit** on their own participant
- **Condition toggle** on their own participant
- **Death save update** on their own participant

---

## Error Scenarios

| Scenario | Error Code | Message |
| -------- | ---------- | ------- |
| Adventure not found | `NOT_FOUND` | Adventure not found |
| Encounter already exists | `CONFLICT` | An encounter already exists for this adventure |
| No encounter found | `NOT_FOUND` | No encounter found |
| Non-DM tries DM-only action | `FORBIDDEN` | Only the DM can create/end encounters, add/remove participants, etc. |
| Non-member tries to view | `FORBIDDEN` | You do not have access to this adventure |
| Player not accepted in adventure | `BAD_REQUEST` | Player not found or not accepted in this adventure |
| Player already in encounter | `CONFLICT` | Player is already in the encounter |
| Participant not found | `NOT_FOUND` | Participant not found |
| Player updates another's HP | `FORBIDDEN` | You can only update your own character's HP |
| Player updates monster HP | `FORBIDDEN` | Only the DM can update monster HP |
| No active participants for turn | `BAD_REQUEST` | No active participants |
| Player advances on wrong turn | `FORBIDDEN` | You can only advance the turn when it is your turn |
