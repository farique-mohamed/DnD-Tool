# Dungeon Logic — NPC Generator

## Overview

The NPC Generator is a client-side tool that creates randomised NPCs on the fly during D&D sessions. It requires no backend — all data pools are bundled in the page component. Accessible to **DUNGEON_MASTER** and **ADMIN** roles.

**Route:** `/npc-generator`
**File:** `src/pages/npc-generator/index.tsx`

---

## Generated Fields

| Field              | Description                                         |
| ------------------ | --------------------------------------------------- |
| Name               | Random first + last name from fantasy name pools     |
| Race               | One of 16 D&D races (Human, Elf, Dwarf, etc.)       |
| Gender             | Male, Female, or Non-binary                          |
| Alignment          | Standard 3x3 alignment grid                          |
| Occupation         | One of 30 fantasy-themed occupations                 |
| Personality Traits | 2–3 traits randomly selected from a pool of 24       |
| Appearance         | One distinguishing physical feature from a pool of 20|
| Voice/Mannerism    | One voice or speech mannerism from a pool of 16      |

---

## Features

- **Generate New NPC** button randomises all fields
- **Copy to Clipboard** copies a plain-text summary for pasting into session notes or chat
- Fully responsive — mobile layout supported via `useIsMobile`
- Uses the project's shared UI components: `Card`, `Button`, `PageHeader`, `Badge`

---

## Navigation

The "NPC Generator" nav item appears in the sidebar for:
- **ADMIN** role (in the admin section)
- **DUNGEON_MASTER** role (between "Rules For Players" and "My Characters")

---

## Data Pools

All name, trait, and attribute pools are defined inline in the page file. No database or API calls are needed. To expand the pools, add entries to the corresponding arrays at the top of `src/pages/npc-generator/index.tsx`.
