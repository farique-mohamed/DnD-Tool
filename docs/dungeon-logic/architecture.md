# Dungeon Logic — Architecture

## tRPC Setup

tRPC provides end-to-end type safety from database to UI with no code generation step.

### How it's wired

```
src/server/routers/_app.ts   — Root router (AppRouter type exported from here)
       └── auth              — authRouter (auth.login, auth.register)
       └── user              — userRouter (user.requestDungeonMaster)
       └── dice              — diceRouter (dice.roll, dice.history, dice.globalHistory)
       └── adventure         — adventureRouter (adventure.create, adventure.list, adventure.getById, adventure.addMonster, adventure.removeMonster, adventure.addItem, adventure.removeItem, adventure.getInviteCode, adventure.joinByCode, adventure.getPendingPlayers, adventure.resolvePlayer, adventure.getAcceptedPlayers, adventure.sendNote, adventure.getNotes, adventure.reactToNote, adventure.getUnreadNoteCount, adventure.getUnreadReactionCount, adventure.createSessionNote, adventure.getSessionNotes, adventure.updateSessionNote)
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
     myFeature: myFeatureRouter, // ← add here
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

| Model       | Table          | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `User`      | `"users"`      | Auth identity, stores hashed password and role                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `DiceRoll`  | `"dice_rolls"` | Persisted roll results — linked to `User`, stores diceType, result, optional label, optional adventureId                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `Character` | `"characters"` | Full D&D 5e character sheet — linked to `User`, stores identity (including optional `background` String), `rulesSource` (String, default `"PHB"` — tracks which rulebook version the character uses: `"PHB"` for 2014, `"XPHB"` for 2024), all six ability scores, combat stats (HP, AC, speed), optional `subclass` (String), `spellSlotsUsed` (JSON string storing a number[9] of used slots per spell level 1–9), `skillProficiencies` (JSON string storing a string[] of proficient skill names), `skillExpertise` (JSON string storing a string[] of skill names with expertise — double proficiency bonus), `preparedSpells` (JSON string storing a string[] of prepared/known spell names), `featureUses` (JSON string storing a Record<string, number> of feature name → used count), `activeConditions` (JSON string storing a string[] of active condition/status names, default `"[]"`), `feats` (JSON string storing a string[] of feat names the character has taken, default `"[]"`), `notes` (String, default `""` — free-text notes field for the player's personal journal), and `adventurePlayers` relation (`AdventurePlayer[]`) linking to adventures the character has joined |
| `Adventure` | `"adventures"` | DM-created adventure instance — linked to `User`, stores adventure `name` and book `source` code, `inviteCode` (unique cuid for player invites), and `players` relation to `AdventurePlayer` |
| `AdventureMonster` | `"adventure_monsters"` | Monster assigned to an adventure — linked to `Adventure`, stores monster `name` and `source`; unique constraint on `[adventureId, name, source]` |
| `AdventureItem` | `"adventure_items"` | Item assigned to an adventure — linked to `Adventure`, stores item `name` and `source`; unique constraint on `[adventureId, name, source]` |
| `AdventurePlayer` | `"adventure_players"` | Player-adventure membership with invite status (PENDING/ACCEPTED/REJECTED); stores `characterId` FK → `Character` linking the joining character; `playerNote` (String, default `""` — single editable note from the player visible to the DM); unique per user+adventure |
| `DmNote` | `"dm_notes"` | DM-to-player note within an adventure — linked to `Adventure`, sender `User` (via "dmNotesSent"), recipient `User` (via "dmNotesReceived"), and `Character`; stores `content` (text), optional `reaction` (String: "THUMBS_UP"/"THUMBS_DOWN"/null), `readAt` (nullable DateTime for unread tracking), and `reactionReadAt` (nullable DateTime for DM reaction notification tracking — null means the DM has not yet seen the reaction) |
| `SessionNote` | `"session_notes"` | Shared session note within an adventure — linked to `Adventure` and `User` (author); stores `title`, `content` (default `""`), `createdAt`, `updatedAt`; editable only by the author; visible only to the author |
| `CharacterInventoryItem` | `"character_inventory_items"` | Item in a character's inventory within an adventure — linked to `AdventurePlayer` and `User` (addedBy, via "inventoryItemsAdded"); stores `itemName`, `itemSource`, `quantity` (default 1), `isStartingItem` (boolean), optional `customDescription` (DM-added description for non-official items); unique constraint on `[adventurePlayerId, itemName, itemSource]` |

See `dice-roller.md` for the full `DiceRoll` schema. See `characters.md` for the full `Character` schema.

### Character tRPC procedures

| Procedure                            | Type     | Description                                                                                                                                                                                                                                                                                                             |
| ------------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `character.create`                   | mutation | Create a new character for the authenticated user; `level` is locked to `1` (z.literal(1) — characters can only be created at level 1); accepts optional `background` (string), `skillProficiencies` (JSON string[]), `skillExpertise` (JSON string[]), and `rulesSource` (`"PHB"` or `"XPHB"`, default `"PHB"`) fields |
| `character.list`                     | query    | List all characters belonging to the authenticated user; includes `adventurePlayers` data (filtered to PENDING/ACCEPTED, take 1) with nested `adventure` (`id`, `name`, `source`) to indicate each character's active adventure status |
| `character.getById`                  | query    | Fetch a single character by id (must belong to the user); includes `adventurePlayers` data (filtered to PENDING/ACCEPTED, take 1) with nested `adventure` (`id`, `name`, `source`) to indicate the character's active adventure status |
| `character.updateHp`                 | mutation | Apply heal / damage / setTempHp to a character                                                                                                                                                                                                                                                                          |
| `character.levelUp`                  | mutation | Increment `level` by 1, set `maxHp` and `currentHp` to the player-supplied value, reset `spellSlotsUsed` to `[]`; rejects if already level 20                                                                                                                                                                           |
| `character.updateSpellSlots`         | mutation | Persist the current used-slot counts (array of 9 integers, one per spell level)                                                                                                                                                                                                                                         |
| `character.updateSubclass`           | mutation | Set the character's chosen subclass name                                                                                                                                                                                                                                                                                |
| `character.longRest`                 | mutation | Reset HP to max, clear tempHp, reset all spell slots, and reset long-rest feature uses (Rage, Second Wind, Action Surge, Indomitable, Channel Divinity, Wild Shape, Lay on Hands, Divine Sense, Bardic Inspiration, Arcane Recovery, Countercharm, Flurry of Blows, Patient Defense, Step of the Wind) to 0             |
| `character.shortRest`                | mutation | Restore HP by a player-supplied hit-dice result, reset short-rest feature uses (Second Wind, Action Surge, Flurry of Blows, Patient Defense, Step of the Wind) to 0; if `isWarlock: true` also resets `spellSlotsUsed` for pact magic recovery                                                                          |
| `character.updateSkillProficiencies` | mutation | Persist the full list of proficient skill names as a JSON string[]                                                                                                                                                                                                                                                      |
| `character.updateSkillExpertise`     | mutation | Persist the full list of expertise skill names as a JSON string[] (expertise grants double proficiency bonus)                                                                                                                                                                                                           |
| `character.updatePreparedSpells`     | mutation | Persist the full list of prepared/known spell names as a JSON string[]                                                                                                                                                                                                                                                  |
| `character.updateFeatureUses`        | mutation | Persist the complete feature-use map (Record<string, number>) for tracking per-rest feature consumption                                                                                                                                                                                                                 |
| `character.updateAbilityScores`      | mutation | Update all six ability scores (STR/DEX/CON/INT/WIS/CHA) for the authenticated user's character; each score validated min 1, max 30; used for Ability Score Improvements during level-up                                                                                                                                 |
| `character.updateActiveConditions`   | mutation | Persist the full list of active condition/status names as a JSON string[]                                                                                                                                                                                                                                               |
| `character.updateFeats`              | mutation | Persist the full list of feat names the character has taken as a JSON string[]                                                                                                                                                                                                                                          |
| `character.updateNotes`              | mutation | Persist the character's free-text notes string                                                                                                                                                                                                                                                                          |

### Adventure tRPC procedures

| Procedure          | Type     | Description                                                                                          |
| ------------------ | -------- | ---------------------------------------------------------------------------------------------------- |
| `adventure.create`        | mutation | Create a new adventure for the authenticated user; restricted to DUNGEON_MASTER and ADMIN roles. Automatically extracts all `{@creature}` and `{@item}` references from the adventure book content via `extractAdventureReferences` and bulk-inserts them as `AdventureMonster` and `AdventureItem` records |
| `adventure.list`          | query    | List adventures owned by the authenticated user AND adventures where the user is an ACCEPTED player; includes `user` relation (`{ id, username }`) for ownership check and `_count.players` for pending request count on owned adventures |
| `adventure.getById`       | query    | Fetch a single adventure by id (owner or accepted player), includes associated monsters, items, and players array with user and character relations |
| `adventure.addMonster`    | mutation | Add a monster to an adventure by name and source (from MONSTER_LIST); unique per adventure           |
| `adventure.removeMonster` | mutation | Remove a monster from an adventure by name and source                                                |
| `adventure.addItem`       | mutation | Add an item to an adventure by name and source (from ITEMS); unique per adventure                    |
| `adventure.removeItem`    | mutation | Remove an item from an adventure by name and source                                                  |
| `adventure.getInviteCode`     | query    | Get the unique invite code for a DM's adventure (owner only)                                         |
| `adventure.joinByCode`        | mutation | User requests to join an adventure via invite code and selected character; validates character ownership; rejects if the character is already in another adventure (PENDING or ACCEPTED status); creates PENDING AdventurePlayer record with characterId |
| `adventure.getPendingPlayers` | query    | List pending join requests for an adventure (DM only); includes user and character data               |
| `adventure.resolvePlayer`     | mutation | Accept or reject a pending player request (DM only); sets status and resolvedAt                      |
| `adventure.getAcceptedPlayers`| query    | List accepted players for an adventure (DM only); includes user and character data                    |
| `adventure.sendNote`          | mutation | DM sends a note to a player's character in their adventure; validates ownership; creates DmNote with fromUserId, toUserId, characterId, and content (1-2000 chars) |
| `adventure.getNotes`          | query    | Get all DM notes for a character in an adventure; accessible by adventure owner or the accepted player; auto-marks unread notes as read when the target player views; auto-marks `reactionReadAt` when the DM views notes; returns notes sorted by createdAt descending |
| `adventure.reactToNote`       | mutation | Player reacts to a DM note with THUMBS_UP, THUMBS_DOWN, or null (remove); only the note recipient can react; resets `reactionReadAt` to null so the DM gets notified of new/changed reactions |
| `adventure.getUnreadNoteCount`| query    | Get unread DM note counts grouped by adventureId for the current user; used for notification badges |
| `adventure.getUnreadReactionCount` | query | Get unread reaction counts on DM notes grouped by adventureId and characterId for the current user (DM); used for notification badges on adventure list and player cards |
| `adventure.createSessionNote` | mutation | Create a session note in an adventure; accessible by adventure owner or accepted players; stores title, content, and author userId |
| `adventure.getSessionNotes`   | query    | Get session notes authored by the current user for an adventure ordered by createdAt descending; accessible by adventure owner or accepted players; includes user relation (id, username) |
| `adventure.updateSessionNote` | mutation | Update a session note's title and/or content; only the note author can edit |
| `adventure.getInventory`      | query    | Get all inventory items for a character in an adventure; accessible by adventure owner (DM) or the owning player; returns items ordered by createdAt asc with addedByUser relation |
| `adventure.addInventoryItem`  | mutation | DM adds an item to a player's inventory; creates CharacterInventoryItem or increments quantity if already exists; DM-only |
| `adventure.addStartingItems`  | mutation | Bulk-add starting equipment to a character's inventory; accessible by the player or DM; throws CONFLICT if starting items already exist; marks all items as isStartingItem=true |
| `adventure.removeInventoryItem` | mutation | Remove an item from a character's inventory; DM-only |
| `adventure.updateInventoryItem` | mutation | Update quantity and/or customDescription on an inventory item; DM-only |
| `adventure.updatePlayerNote`   | mutation | Update the player's note to the DM; only the owning player can edit |
| `adventure.getPlayerNote`      | query    | Get the player's note; accessible by the player or the adventure owner (DM) |

---

## Conventions

### File naming

- Pages: `src/pages/featureName/index.tsx` for route `/featureName`
- API routers: `src/server/routers/featureName.ts`
- Reusable components: `src/components/ComponentName.tsx`
- React hooks: `src/hooks/useHookName.ts`
- Server utilities: `src/lib/utilityName.ts` (never imported client-side if using Node APIs)
- Static data modules: `src/lib/featureData.ts` — import JSON directly (no `fs`), export typed arrays and helpers. Example: `src/lib/classData.ts` imports all 15 class JSON files from `data/class/` and exports `CLASS_LIST: ClassInfo[]` (all versions — PHB, XPHB, and unique-source classes; each `ClassInfo` includes a `source` field), `getClassByName(name)`, `getClassesBySource(source)` (filters classes by rulebook source), `getClassByNameAndSource(name, source)`, and `DUAL_SOURCE_CLASS_NAMES` (names of classes that appear in both PHB and XPHB). Subclasses and features are filtered by source: PHB subclasses appear with PHB classes, XPHB with XPHB, and supplemental sources (XGE, TCE, etc.) appear with both. `src/lib/bookData.ts` imports all 53 book JSONs from `data/book/` and exports `BOOK_DATA_MAP: Record<string, BookSection[]>` (source code → data array), `BOOK_LIST: BookInfo[]`, and named exports `DMG_2014_DATA`, `DMG_2024_DATA`, `PHB_2014_DATA`, `PHB_2024_DATA` used by the rules pages. `src/lib/adventureData.ts` imports all 95 adventure JSONs from `data/adventure/` and exports `ADVENTURE_DATA_MAP: Record<string, AdventureSection[]>` (source code → sections array), `ADVENTURE_LIST: AdventureInfo[]` (source, name) — used by the adventure books listing and detail pages.
- `src/lib/spellSlotData.ts` — spell slot tables for full/half/artificer/warlock casters; exports `getSpellSlots(className, level)` returning a 9-element array of total slots per spell level, `isSpellcaster(className)` returning true for classes with any spell slots, `isWarlock(className)` for Pact Magic handling, and `SPELLCASTING_TYPE: Record<string, SpellcastingType>` mapping class names to their casting type.
- `src/lib/actionEconomy.ts` — action economy per class/level; exports `UNIVERSAL_ACTIONS: ActionEntry[]` (actions available to all characters), `CLASS_ACTIONS: Record<string, ClassActionEntry[]>` (class-specific actions keyed by class name, each with a `levelRequired` field), and `getCharacterActions(className, level)` which merges universal and class-specific actions available at the given level.
- `src/lib/itemsData.ts` — imports `data/items-base.json` (196 base items) and `data/items.json` (2526 magic/special items), maps type abbreviations to display names, normalises rarity, parses entries via `parseTaggedText`, de-duplicates by name+source, and exports `ITEMS: Item[]`, `ITEM_SOURCES: string[]`, `ITEM_TYPES: string[]`, `ITEM_RARITIES: string[]`.
- `src/lib/expertiseData.ts` — defines `EXPERTISE_CONFIG: ClassExpertiseConfig[]` mapping each class+source (PHB/XPHB) to the levels and counts where expertise is granted; exports `getExpertiseConfig(className, source)`, `getExpertiseCountAtLevel(className, source, level)` (total picks at or below a level), `getNewExpertiseAtLevel(className, source, level)` (new picks at exactly that level), and `classHasExpertise(className, source)`. Covers Rogue (PHB/XPHB), Bard (PHB/XPHB with different level thresholds), and Ranger (XPHB only).
- `src/lib/backgroundData.ts` — imports `data/backgrounds.json` (160 raw entries), parses `skillProficiencies` into fixed skill names and optional `skillChoices` (from/count), de-duplicates by name (preferring PHB/XPHB sources), and exports `Background` interface, `BACKGROUNDS: Background[]` (sorted by name), and `BACKGROUND_NAMES: string[]`.
- `src/lib/raceData.ts` — static race/species data for all 9 PHB (2014) races and 7 XPHB (2024) species (Half-Elf and Half-Orc removed in 2024); exports `AbilityScoreBonus` interface (ability name, amount, and optional `"choice"` type for races like Half-Elf), `RacialTrait` and `RaceInfo` interfaces (includes `abilityBonuses: AbilityScoreBonus[]` with structured ASI data per race — e.g., Elf: `[{ ability: "dexterity", amount: 2 }]`, Human: `[{ ability: "all", amount: 1 }]`, Half-Elf: fixed CHA +2 plus two `"choice"` +1 picks), `RACES: RaceInfo[]` (all versions), `getRaceByNameAndSource(name, source)` for source-aware lookup, and `getRaceByName(name)` which returns the PHB version for backward compatibility.
- `src/lib/featData.ts` — imports `data/feats.json` (226 raw feats, 214 after filtering out fighting styles), parses entries via `parseTaggedText`, and exports `Feat` interface (name, source, category, prerequisiteText, levelRequired, abilityBonus, entries), `FeatAbilityBonus` interface, `FEATS: Feat[]`, `getFeatsBySource(source)` (PHB returns 149 feats including supplements, XPHB returns 162 feats including supplements), and `getFeatByNameAndSource(name, source)`.
- `src/lib/conditionData.ts` — imports `data/conditionsdiseases.json`, filters out diseases, and exports `CONDITIONS: Condition[]` (each with name, source, and parsed text entries), `getConditionsBySource(source)`, and `getConditionByName(name, source)`.
- `src/lib/dndTagParser.ts` — exports `parseTaggedText(text: string): string`. Converts 5etools `{@tag ...}` markup to readable plain text (e.g. `{@atkr m}` → `"Melee Attack:"`, `{@hit 7}` → `"+7"`, `{@h}14` → `"(avg. 14)"`, `{@recharge 5}` → `"(Recharge 5-6)"`, `{@actSave int}` → `"Intelligence saving throw"`, `{@actSaveFail}` → `"On a failed save,"`, `{@actSaveSuccess}` → `"On a successful save,"`, `{@actSaveSuccessOrFail}` → `"Regardless of the result,"`). Used in `bestiaryData.ts` when decoding action/trait text and spellcasting entries.
- `src/lib/adventureExtractor.ts` — parses adventure book JSON data for `{@creature}` and `{@item}` tags; exports `extractAdventureReferences(adventureSource)` which returns an `AdventureReferences` object containing deduplicated, alphabetically sorted arrays of `{ name, source }` for monsters and items. Used by `adventure.create` to auto-extract references at adventure creation time.
- `src/lib/startingEquipmentData.ts` — parses starting equipment from all class JSONs (`data/class/class-*.json`) and the backgrounds JSON (`data/backgrounds.json`); handles PHB (2014) structured `defaultData` with lowercase keys, XPHB (2024) structured `defaultData` with uppercase keys, and background equipment arrays; exports `StartingEquipmentPreset`, `StartingItem`, `ClassStartingEquipment`, `BackgroundStartingEquipment` interfaces, `getClassStartingEquipment(className, source)`, `getBackgroundStartingEquipment(backgroundName)`, and `ALL_CLASS_STARTING_EQUIPMENT` / `ALL_BACKGROUND_STARTING_EQUIPMENT` arrays. Used by the inventory UI for adding starting items.

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

| Approach            | Pro                      | Con                                              |
| ------------------- | ------------------------ | ------------------------------------------------ |
| localStorage JWT ✓  | Simple, no cookie config | Vulnerable to XSS (acceptable for internal tool) |
| HttpOnly Cookie JWT | XSS-safe                 | Requires CSRF protection, more server setup      |
| NextAuth / Auth.js  | Battle-tested            | Heavy dependency, less control                   |

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
