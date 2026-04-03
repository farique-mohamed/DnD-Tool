# Dungeon Logic -- Images

## Overview

Entity images are loaded from the [5etools-img](https://github.com/5etools-mirror-3/5etools-img) GitHub mirror repository. Images are fetched directly via raw GitHub URLs at runtime -- no local copies are stored.

---

## Base URL

```
https://raw.githubusercontent.com/5etools-mirror-3/5etools-img/main
```

### Repository directory structure

| Folder       | Pattern                                | Example                                            |
| ------------ | -------------------------------------- | -------------------------------------------------- |
| `bestiary/`  | `bestiary/[SOURCE]/[CreatureName].webp` | `bestiary/MM/Aboleth.webp`                         |
| `bestiary/tokens/` | `bestiary/tokens/[SOURCE]/[CreatureName].webp` | `bestiary/tokens/MM/Aboleth.webp`          |
| `items/`     | `items/[SOURCE]/[ItemName].webp`        | `items/DMG/Flame%20Tongue.webp`                    |
| `spells/`    | `spells/[SOURCE]/[SpellName].webp`      | `spells/PHB/Fireball.webp`                         |
| `covers/`    | `covers/[SOURCE].webp`                  | `covers/DoSI.webp`                                 |
| `adventure/` | `adventure/[SOURCE]/[filename]`         | `adventure/CoS/000-cos01-01.webp`                  |
| `book/`      | `book/[SOURCE]/[filename]`              | `book/DMG/Monster_Size_Chart.webp`                 |

---

## Utility: `src/lib/imageUtils.ts`

| Function                 | Parameters                       | Description                                              |
| ------------------------ | -------------------------------- | -------------------------------------------------------- |
| `get5eToolsImageUrl`     | `(type, source, name)`           | Generic builder -- encodes the name for URL safety       |
| `getMonsterImageUrl`     | `(name, source)`                 | Shorthand for `bestiary/[SOURCE]/[NAME].webp`            |
| `getMonsterTokenUrl`     | `(name, source)`                 | Shorthand for `bestiary/tokens/[SOURCE]/[NAME].webp`     |
| `getItemImageUrl`        | `(name, source)`                 | Shorthand for `items/[SOURCE]/[NAME].webp`               |
| `getSpellImageUrl`       | `(name, source)`                 | Shorthand for `spells/[SOURCE]/[NAME].webp`              |
| `getCoverImageUrl`       | `(source)`                       | Cover image for a book/adventure: `covers/[SOURCE].webp` |
| `getInternalImageUrl`    | `(path)`                         | Resolves an `href.path` from adventure/book JSON entries |

---

## Component: `EntityImage` (`src/components/ui/EntityImage.tsx`)

A themed `<img>` element with graceful error handling. If the image fails to load (HTTP 404, network error), the component hides itself entirely so missing images never break the layout.

### Props

| Prop     | Type                       | Default  | Description                          |
| -------- | -------------------------- | -------- | ------------------------------------ |
| `src`    | `string`                   | required | Image URL                            |
| `alt`    | `string`                   | required | Accessible alt text                  |
| `width`  | `number \| string`         | --       | CSS width                            |
| `height` | `number \| string`         | --       | CSS height                           |
| `style`  | `React.CSSProperties`     | --       | Additional inline styles             |

### Styling

- Gold border (`2px solid #c9a84c`), rounded corners (`8px`), subtle gold box shadow
- `loading="lazy"` for performance
- `object-fit: contain` to preserve aspect ratios
- Dark semi-transparent background behind the image

### Import

```tsx
import { EntityImage } from "@/components/ui";
// or
import { EntityImage } from "@/components/ui/EntityImage";
```

---

## Pages using images

| Page                        | File                                          | Image type         |
| --------------------------- | --------------------------------------------- | ------------------ |
| Monster Manual              | `src/components/monster-manual/MonsterDetailPanel.tsx` | Monster portrait + token |
| Adventure Books list        | `src/pages/dm/adventure-books/index.tsx`      | Book cover         |
| Rule Books list             | `src/pages/dm/rule-books/index.tsx`           | Book cover         |
| Item Vault                  | `src/pages/items/index.tsx`                   | Item illustration  |
| Spell Compendium            | `src/pages/spells/index.tsx`                  | Spell illustration |
| Adventure story renderer    | `src/components/adventure/shared.tsx`         | Adventure/book art |
| Rule Books (per-book)       | `src/pages/dm/rule-books/[source].tsx`        | Book illustrations |
| DM Rules (DMG)              | `src/pages/dm/rules/index.tsx`                | Book illustrations |

### Placement

Images appear only in **detail / expanded views** (never in list rows or sidebar items) to avoid unnecessary network requests when scrolling through large lists.

### Adventure / Book images

Adventure and book JSON data contains `type: "image"` entries with an `href` object:

```json
{
  "type": "image",
  "href": {
    "type": "internal",
    "path": "adventure/CoS/000-cos01-01.webp"
  }
}
```

The `renderEntries` functions in the shared renderer and rule-book pages detect these entries and render them using `getInternalImageUrl(href.path)`.

---

## Caching

`EntityImage` maintains an in-memory `Map<string, "loaded" | "failed">` that persists for the lifetime of the browser tab (survives page navigations within the SPA). This provides two benefits:

- **Failed URL suppression** — URLs that returned 404 or failed to load are remembered. On subsequent renders or navigations, the component returns `null` immediately without making another network request.
- **Loaded URL tracking** — Successfully loaded URLs are marked so the component can skip unnecessary loading states on re-mount.

The browser's own HTTP cache handles the actual image bytes (GitHub's `raw.githubusercontent.com` sends standard `Cache-Control` headers). The in-memory cache is purely for UI state — avoiding flashes and redundant error handling.

---

## Error handling

Not all entities have images in the repository. The `EntityImage` component uses an `onError` handler that caches the failure and hides itself. This means:

- No broken image icons are shown
- No layout shifts -- the image simply does not appear
- No console errors are surfaced to the user
- Failed URLs are never re-requested in the same session
