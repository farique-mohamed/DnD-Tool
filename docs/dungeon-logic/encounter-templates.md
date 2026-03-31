# Dungeon Logic -- Encounter Templates

## Overview

Encounter templates let DMs save monster group setups as reusable templates and create new encounters from them. A DM can either save the monsters from an active encounter as a template, or manually create a template from scratch. Templates are personal to the user who created them and can be reused across any adventure they own.

---

## Key Files

| File | Purpose |
| ---- | ------- |
| `src/server/routers/adventure/encounterTemplate.ts` | All encounter template tRPC procedures (registered under `adventure.*`) |
| `prisma/schema.prisma` | `EncounterTemplate` and `EncounterTemplateParticipant` models |

---

## Database Schema

### `EncounterTemplate` -- table `"encounter_templates"`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `String` (cuid) | Primary key |
| `userId` | `String` | FK -> `User.id` |
| `name` | `String` | Template name (1-100 chars) |
| `description` | `String?` | Optional description (max 500 chars) |
| `participants` | `EncounterTemplateParticipant[]` | Monster participants in the template |
| `createdAt` | `DateTime` | Default: `now()` |
| `updatedAt` | `DateTime` | Auto-updated |

### `EncounterTemplateParticipant` -- table `"encounter_template_participants"`

| Field | Type | Notes |
|-------|------|-------|
| `id` | `String` (cuid) | Primary key |
| `templateId` | `String` | FK -> `EncounterTemplate.id`, cascading delete |
| `name` | `String` | Monster name |
| `monsterSource` | `String` | Monster source book |
| `maxHp` | `Int` | Maximum HP |
| `armorClass` | `Int` | Armor Class |
| `initiativeModifier` | `Int?` | Optional initiative modifier |
| `sortOrder` | `Int` | Display order; default `0` |
| `createdAt` | `DateTime` | Default: `now()` |

---

## tRPC Procedures

File: `src/server/routers/adventure/encounterTemplate.ts` -- procedures are merged into the `adventure` router in `src/server/routers/adventure/index.ts`. Access via `api.adventure.*` on the client.

All procedures are **protected** (require a valid JWT).

| Procedure | Type | Description |
| --------- | ---- | ----------- |
| `adventure.saveEncounterAsTemplate` | mutation | Save the monster participants from an active encounter as a reusable template; DM-only (adventure owner); rejects if no encounter exists or if the encounter has no monster participants |
| `adventure.createEncounterTemplate` | mutation | Manually create a template with a list of monster participants; requires DUNGEON_MASTER or ADMIN role |
| `adventure.listEncounterTemplates` | query | List all templates owned by the current user, ordered by createdAt desc; includes participant count and participants array |
| `adventure.getEncounterTemplate` | query | Fetch a single template with all participants ordered by sortOrder; must be owned by the current user |
| `adventure.deleteEncounterTemplate` | mutation | Delete a template; must be owned by the current user; cascade handles participant cleanup |
| `adventure.createEncounterFromTemplate` | mutation | Create a new encounter for an adventure using a template's monsters; DM-only (adventure owner); rejects if an encounter already exists; sets `initiativeRoll` to 0 and `currentHp` to `maxHp` for all participants |

---

## Authorization Rules

| Action | DM (adventure owner) | DUNGEON_MASTER / ADMIN (no adventure context) | Any authenticated user |
| ------ | -------------------- | ---------------------------------------------- | ---------------------- |
| Save encounter as template | Yes | No (requires adventure ownership) | No |
| Create template manually | N/A | Yes | No |
| List own templates | N/A | N/A | Yes |
| Get own template | N/A | N/A | Yes |
| Delete own template | N/A | N/A | Yes |
| Create encounter from template | Yes | No (requires adventure ownership) | No |

### Ownership rules

- Templates are scoped to the user who created them (`userId`).
- `listEncounterTemplates`, `getEncounterTemplate`, and `deleteEncounterTemplate` only operate on templates where `userId` matches the authenticated user.
- `saveEncounterAsTemplate` and `createEncounterFromTemplate` additionally verify that the user owns the specified adventure.

---

## Workflow Examples

### Saving an active encounter as a template

1. DM has an active encounter with several monsters.
2. DM calls `saveEncounterAsTemplate` with the `adventureId` and a `name`.
3. The procedure fetches all MONSTER-type participants from the encounter.
4. An `EncounterTemplate` is created with corresponding `EncounterTemplateParticipant` records.

### Creating a template from scratch

1. DM calls `createEncounterTemplate` with a `name` and an array of `participants`.
2. An `EncounterTemplate` is created with the provided monsters.

### Creating an encounter from a template

1. DM calls `createEncounterFromTemplate` with `adventureId` and `templateId`.
2. The procedure verifies no encounter exists for the adventure.
3. A new `Encounter` is created with `EncounterParticipant` records for each template participant.
4. All participants are created as MONSTER type with `initiativeRoll` set to 0 (DM sets initiative manually) and `currentHp` set to `maxHp`.

---

## Error Scenarios

| Scenario | Error Code | Message |
| -------- | ---------- | ------- |
| Adventure not found | `NOT_FOUND` | Adventure not found |
| Non-DM tries to save encounter as template | `FORBIDDEN` | Only the DM can save encounters as templates |
| No encounter found for adventure | `NOT_FOUND` | No encounter found |
| Encounter has no monster participants | `BAD_REQUEST` | Encounter has no monster participants to save |
| Non-DM/non-ADMIN tries to create template | `FORBIDDEN` | Only Dungeon Masters and Admins can create encounter templates |
| Template not found | `NOT_FOUND` | Encounter template not found |
| User tries to access another user's template | `FORBIDDEN` | You do not have access to this template |
| Non-DM tries to create encounter from template | `FORBIDDEN` | Only the DM can create encounters |
| Encounter already exists for adventure | `CONFLICT` | An encounter already exists for this adventure |
