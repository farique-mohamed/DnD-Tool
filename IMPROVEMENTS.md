# DnD Tool - Improvement Ideas

## High-Impact Features

- [x] **Real-time Multiplayer (WebSockets)** - Currently using 3-second polling for dice/encounters. Adding WebSocket support (e.g., Socket.io or Pusher) would make combat encounters, dice rolls, and DM notes feel instant and collaborative.

- [ ] **Character Import/Export** - Export character sheets as PDF or JSON for sharing/backup. Import from D&D Beyond or standard formats would be a killer feature.

- [x] **Campaign Map Support** - Image uploads for battle maps, world maps, or dungeon layouts. Could integrate with encounter tracking for token placement.

- [ ] **DM Elevation Workflow** - The `requestDungeonMaster` is currently a stub. Completing the admin approval flow would make the role system fully functional.

## Medium-Impact Features

- [ ] **Roll Statistics & Analytics** - You're already storing all dice rolls. Adding stats (average rolls, nat 20/1 counts, roll distribution charts) per player/adventure would be fun.

- [ ] **Per-Adventure Dice History** - The `adventureId` link exists but isn't enforced. Filtering dice history by adventure would help during sessions.

- [ ] **Session Scheduling & Calendar** - A campaign calendar for scheduling sessions, tracking in-game time, and noting upcoming events.

- [ ] **Character Art / Avatars** - Image upload support for character portraits and NPC art. Would make character sheets and encounter views more immersive.

- [ ] **Search Across Compendiums** - A global search that spans spells, monsters, items, rules, and classes in one unified search bar.

## Quality-of-Life Improvements

- [x] **Mobile PWA Support** - Add a service worker and manifest for offline access and "Add to Home Screen" on phones - great for players at the table.

- [x] **Dark/Light Theme Toggle** - The D&D gold/brown theme is great, but a lighter option for readability in bright environments.

- [x] **Encounter Templates** - Save and reuse encounter setups (monster groups, environmental conditions) across adventures.

- [x] **NPC Generator** - Random NPC generation with name, personality traits, appearance, and voice notes for DMs improvising.

## Technical Improvements

- [ ] **Move from Polling to SSE/WebSockets** - At minimum for encounters and dice history.

- [ ] **Testing** - No test files found. Adding tests for critical paths (character creation, encounter logic, AC calculation) would prevent regressions.
