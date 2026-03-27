# Dungeon Logic — Equipment System

## Overview

The equipment system allows characters in an adventure to equip weapons, armor, and shields into designated slots. Equipping items affects the character's Armor Class (AC), available combat actions, weapon masteries, and may impose proficiency-based penalties. Equipment state is stored as a JSON string on the Character model and managed through adventure tRPC procedures.

---

## Equipment Slots

Characters have four equipment slots:

| Slot       | Accepts           | Notes                                                    |
| ---------- | ----------------- | -------------------------------------------------------- |
| `mainHand` | Weapons           | Primary weapon slot                                      |
| `offHand`  | Weapons, Shields  | Secondary weapon or shield; cannot hold a two-handed weapon here |
| `armor`    | Armor             | Light, Medium, or Heavy armor                            |
| `shield`   | Shields           | Grants +2 AC (or the shield's AC value)                  |

### Storage Format

Equipment state is stored on the `Character` model as a JSON string in the `equippedItems` field:

```json
{
  "mainHand": null,
  "offHand": null,
  "armor": null,
  "shield": null
}
```

Each slot holds either `null` (empty) or a reference to an inventory item.

---

## Weapon Properties

Weapons in D&D 5e can have the following properties, which affect how they are used in combat:

| Property      | Effect                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------ |
| Finesse       | Can use STR or DEX modifier for attack and damage rolls                                    |
| Light         | Can be used for two-weapon fighting when held in the off hand                              |
| Heavy         | Small creatures have disadvantage on attack rolls with this weapon                         |
| Two-Handed    | Requires both hands to use; cannot equip anything in the off hand                          |
| Versatile     | Can be used with one or two hands; two-handed use deals higher damage                      |
| Thrown        | Can be thrown for a ranged attack using STR modifier                                       |
| Reach         | Adds 5 feet to melee attack reach                                                         |
| Loading       | Can only fire once per action regardless of extra attacks                                  |
| Ammunition    | Requires ammunition to make ranged attacks; ammunition is consumed on use                  |

---

## Weapon Masteries (2024 Rules)

The 2024 (XPHB) rules introduce weapon masteries — special abilities tied to specific weapons that characters can unlock through class features.

| Mastery  | Effect                                                                                      |
| -------- | ------------------------------------------------------------------------------------------- |
| Nick     | When making the extra attack of the Light property, can make it as part of the Attack action |
| Vex      | Hit grants advantage on next attack roll against the same target before end of next turn     |
| Cleave   | On hit, can make an additional attack against an adjacent creature (once per turn)           |
| Graze    | On miss, still deal ability modifier damage to the target                                    |
| Push     | On hit, push a Large or smaller creature 10 feet away                                       |
| Sap      | On hit, the target has disadvantage on its next attack roll before start of your next turn   |
| Slow     | On hit, the target's speed is reduced by 10 feet until the start of your next turn           |
| Topple   | On hit, the target must make a CON saving throw or be knocked prone                          |

---

## Armor Proficiency

### Proficiency by Class

Each class is proficient with specific armor types. Proficiency determines whether a character can effectively wear that armor.

### Penalties for Wearing Non-Proficient Armor

If a character wears armor they are not proficient with:

- **Disadvantage** on all STR and DEX ability checks and saving throws
- **Cannot cast spells**
- **Speed reduced by 10** if wearing heavy armor without meeting the STR requirement

---

## AC Calculation

Armor Class is computed based on the equipped armor, shield, class, and ability scores.

### Base AC by Armor Type

| Armor Type   | AC Calculation                                         |
| ------------ | ------------------------------------------------------ |
| No armor     | `10 + DEX modifier`                                    |
| Light Armor  | `base AC + DEX modifier`                               |
| Medium Armor | `base AC + DEX modifier (max +2)`                      |
| Heavy Armor  | `base AC` (no DEX modifier)                            |

### Special Unarmored Defense

| Class     | Unarmored AC Calculation            |
| --------- | ----------------------------------- |
| Barbarian | `10 + DEX modifier + CON modifier` |
| Monk      | `10 + DEX modifier + WIS modifier` |

### Shield Bonus

A shield adds +2 AC (or the shield's specific AC value) on top of the armor-based AC.

### AC Breakdown

The `getEquipmentStatus` procedure returns a full AC breakdown showing the base value, DEX modifier contribution, shield bonus, and any special class modifiers.

---

## Key Files

| File                              | Purpose                                                                                                  |
| --------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `src/lib/equipmentData.ts`        | Equipment slot types, armor/weapon proficiency by class, AC calculation, armor penalty checks, equipment-based action generation, weapon mastery and property descriptions |
| `src/lib/itemsData.ts`            | Item definitions including `property`, `mastery`, `stealthDisadvantage`, and `strengthRequirement` fields |
| `src/lib/actionEconomy.ts`        | `getCharacterActionsWithEquipment()` — merges equipment-derived actions into the character's action list  |
| `prisma/schema.prisma`            | Character model `equippedItems` field (JSON string)                                                      |
| `src/server/routers/adventure.ts` | `equipItem`, `unequipItem`, `getEquipmentStatus` tRPC procedures                                        |
| `src/pages/adventures/[id].tsx`   | Equipment panel in the Inventory tab                                                                     |
| `src/pages/characters/[id].tsx`   | Equipment summary and equipment-based actions display                                                    |

---

## tRPC Procedures

File: `src/server/routers/adventure.ts` — registered as `adventure` in `src/server/routers/_app.ts`.

All procedures are **protected** (require a valid JWT). Access via `api.adventure.*` on the client.

### `adventure.equipItem` — mutation

Equip an inventory item to a character's equipment slot.

**Input**

| Field          | Type     | Required | Notes                                          |
| -------------- | -------- | -------- | ---------------------------------------------- |
| `adventureId`  | `string` | Yes      | The adventure the character belongs to          |
| `characterId`  | `string` | Yes      | The character equipping the item                |
| `itemName`     | `string` | Yes      | Name of the inventory item to equip             |
| `itemSource`   | `string` | Yes      | Source of the inventory item                    |
| `slot`         | `string` | Yes      | Target slot: `mainHand`, `offHand`, `armor`, or `shield` |

**Business rules**

- Validates that the adventure exists and the user has access.
- Validates that the item is in the character's inventory.
- Validates item type and slot compatibility (e.g., armor items can only go in the `armor` slot).
- Updates the character's `equippedItems` JSON with the item in the specified slot.

**Returns:** the updated equipment state.

---

### `adventure.unequipItem` — mutation

Remove an item from a character's equipment slot.

**Input**

| Field          | Type     | Required | Notes                                          |
| -------------- | -------- | -------- | ---------------------------------------------- |
| `adventureId`  | `string` | Yes      | The adventure the character belongs to          |
| `characterId`  | `string` | Yes      | The character unequipping the item              |
| `slot`         | `string` | Yes      | Slot to clear: `mainHand`, `offHand`, `armor`, or `shield` |

**Business rules**

- Validates that the adventure exists and the user has access.
- Sets the specified slot to `null` in the character's `equippedItems` JSON.

**Returns:** the updated equipment state.

---

### `adventure.getEquipmentStatus` — query

Get the current equipment status for a character, including computed values.

**Input**

| Field          | Type     | Required | Notes                                          |
| -------------- | -------- | -------- | ---------------------------------------------- |
| `adventureId`  | `string` | Yes      | The adventure the character belongs to          |
| `characterId`  | `string` | Yes      | The character to get equipment status for       |

**Business rules**

- Validates that the adventure exists and the user has access (adventure owner or accepted player).
- Reads the character's `equippedItems` JSON and resolves each slot to its item data.
- Computes AC with a full breakdown (base, DEX modifier, shield bonus, class modifiers).
- Checks armor proficiency and reports any penalties.
- Generates equipment-derived actions (weapon attacks, shield interactions).
- Returns weapon mastery info for equipped weapons.

**Returns:** equipment status object including:

- Equipped items per slot
- Computed AC with breakdown
- Armor proficiency penalties (if any)
- Equipment-derived combat actions
- Weapon mastery and property info

---

## Error Scenarios

| Scenario                            | Error Code    | Message                                     |
| ----------------------------------- | ------------- | ------------------------------------------- |
| Adventure not found                 | `NOT_FOUND`   | Adventure not found                         |
| Character not found                 | `NOT_FOUND`   | Character not found                         |
| Item not in inventory               | `NOT_FOUND`   | Item not found in character's inventory     |
| Incompatible item type for slot     | `BAD_REQUEST` | Item cannot be equipped in this slot        |
| Non-member tries to equip/unequip   | `FORBIDDEN`   | Only adventure members can manage equipment |

---

## Inventory Item Restrictions

Only items that exist in the official ITEMS list (from `src/lib/itemsData.ts`) can be added to a player's inventory. Adventure items that are not found in official sources are displayed in the adventure items list but cannot be added to any player's inventory — the Add button is disabled and a "not in official sources" notice is shown.

The `customDescription` field on `CharacterInventoryItem` is retained in the database schema for backward compatibility with previously added items, and the DM can still edit `customDescription` on existing inventory items via `adventure.updateInventoryItem`. However, the UI no longer provides a way to set custom descriptions when adding new items.

---

## Reusability Notes

- The `equipmentData.ts` module is a static data module following the same pattern as `classData.ts`, `spellSlotData.ts`, and `actionEconomy.ts` — imported directly with no filesystem access.
- AC calculation logic is centralized in `equipmentData.ts` and used by both the `getEquipmentStatus` query and the character page display.
- The `getCharacterActionsWithEquipment()` function in `actionEconomy.ts` extends the existing action economy system to include equipment-derived actions alongside class and universal actions.
