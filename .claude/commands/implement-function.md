---
description: Implement a function by first reading relevant dungeon-logic business docs, then delegating to the appropriate agent.
argument-hint: <function requirement>
---

You are implementing a function for the DnD Tool project. The requirement is:

**$ARGUMENTS**

## Step 1 — Identify relevant business logic docs

The dungeon-logic docs live in `docs/dungeon-logic/`. The available files are:

- `docs/dungeon-logic/overview.md`
- `docs/dungeon-logic/architecture.md`
- `docs/dungeon-logic/authentication.md`
- `docs/dungeon-logic/ui-patterns.md`

Read **all** of them now (in parallel), then decide which are relevant to the requirement above. Extract only the sections that directly inform the implementation — ignore the rest.

## Step 2 — Determine the implementation domain

Based on the requirement and the relevant docs, decide which type of agent to use:

- **backend-engineer** — server logic, API endpoints, database interactions, services
- **frontend-engineer** — UI components, hooks, client-side logic
- **database-specialist** — schema changes, queries, migrations
- **security-specialist** — auth, permissions, input validation

If the function spans multiple domains, use the most central one and note what the others need.

## Step 3 — Implement using the appropriate agent

Launch the agent with:

1. The full requirement from `$ARGUMENTS`
2. The relevant excerpts from the dungeon-logic docs (include verbatim — don't summarize)
3. Clear instructions to implement the function, write it into the correct file(s), and follow project conventions. If any edited or created file exceeds 600 lines, break it apart into smaller modules wherever possible.
4. An explicit instruction to **create or update relevant docs** in `docs/dungeon-logic/` at the end of the implementation — add or update a doc file for the feature, and update `architecture.md` models table and `ui-patterns.md` pages table if new routes or models were added.

Do not implement the function yourself — delegate entirely to the agent and report back what was done.

## Step 4 — Agent team check

If the user's requirement did **not** explicitly mention an agent team (e.g. "use agent team", "use a team", "run in parallel with agents"), ask:

> "Would you like me to spin up an agent team to tackle this in parallel? This can speed things up for tasks spanning multiple domains (e.g. DB + backend + frontend at the same time)."

Wait for their answer before proceeding if this step applies.
