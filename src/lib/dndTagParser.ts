/**
 * parseTaggedText — converts 5etools {@tag ...} markup into readable plain text.
 *
 * Explicit transformations:
 *   {@atkr m}                  → "Melee Attack:"
 *   {@atkr r}                  → "Ranged Attack:"
 *   {@h}<number>               → "(avg. <number>)"
 *   {@hit <n>}                 → "+<n>"
 *   {@recharge <n>}            → "(Recharge <n>-6)"
 *   {@recharge}                → "(Recharge 6)"
 *   {@actSave <ability>} {@dc n} → "<Ability> Saving Throw: DC <n>"
 *                                (e.g. {@actSave int} {@dc 16} → "Intelligence Saving Throw: DC 16")
 *   {@actSave <ability>}       → "<Ability> saving throw"  (standalone)
 *   {@dc <n>}                  → "DC <n>"  (standalone)
 *   {@actSaveFail}             → "On a failed save,"
 *   {@actSaveSuccess}          → "On a successful save,"
 *   {@actSaveSuccessOrFail}    → "Regardless of the result,"
 *
 * Generic fallback for all other {@tag content} patterns:
 *   - content before the first "|" is used (the "name" part)
 *
 * Handles nesting via a repeated-pass loop.
 */

const ABILITY_NAMES: Record<string, string> = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma",
};

export function parseTaggedText(text: string): string {
  let result = text;
  let prev: string;

  do {
    prev = result;

    // {@atkr m} → "Melee Attack:"  |  {@atkr r} → "Ranged Attack:"
    result = result.replace(/\{@atkr\s+m\}/g, "Melee Attack:");
    result = result.replace(/\{@atkr\s+r\}/g, "Ranged Attack:");

    // {@actSave <ability>} {@dc <n>} → "<Ability> Saving Throw: DC <n>"  (combined form)
    result = result.replace(
      /\{@actSave\s+(\w+)\}\s*\{@dc\s+(\d+)\}/g,
      (_m, ability: string, dc: string) => {
        const name = ABILITY_NAMES[ability.toLowerCase()] ?? ability;
        return `${name} Saving Throw: DC ${dc}`;
      },
    );

    // {@actSave <ability>} → "<Ability> saving throw"  (standalone)
    result = result.replace(/\{@actSave\s+(\w+)\}/g, (_m, ability: string) => {
      const name = ABILITY_NAMES[ability.toLowerCase()] ?? ability;
      return `${name} saving throw`;
    });

    // {@dc <n>} → "DC <n>"  (standalone, after combined form is handled)
    result = result.replace(/\{@dc\s+(\d+)\}/g, (_m, n: string) => `DC ${n}`);

    // {@actSaveFail} → "On a failed save,"
    result = result.replace(/\{@actSaveFail\}/g, "On a failed save,");

    // {@actSaveSuccess} → "On a successful save,"
    result = result.replace(/\{@actSaveSuccess\}/g, "On a successful save,");

    // {@actSaveSuccessOrFail} → "Regardless of the result,"
    result = result.replace(/\{@actSaveSuccessOrFail\}/g, "Regardless of the result,");

    // {@recharge <n>} → "(Recharge <n>-6)"  |  {@recharge} (no arg) → "(Recharge 6)"
    result = result.replace(/\{@recharge\s+(\d+)\}/g, (_m, n: string) => `(Recharge ${n}-6)`);
    result = result.replace(/\{@recharge\}/g, "(Recharge 6)");

    // {@h}<number>  — the number follows immediately after the closing brace
    // Transform the tag itself to a marker, then handle the trailing number below
    result = result.replace(/\{@h\}(\d+)/g, (_m, n: string) => `(avg. ${n})`);
    // Bare {@h} with no following number — drop it
    result = result.replace(/\{@h\}/g, "");

    // {@hit <n>} → "+<n>"
    result = result.replace(/\{@hit\s+([+-]?\d+)\}/g, (_m, n: string) => {
      const num = parseInt(n, 10);
      return num >= 0 ? `+${num}` : String(num);
    });

    // Generic: {@tag content} — use content before first "|"
    result = result.replace(/\{@\w+\s([^}]*)\}/g, (_m, body: string) => {
      const parts = body.split("|");
      return (parts[0] ?? body).trim();
    });
  } while (result !== prev);

  return result;
}

/**
 * parseTaggedTextToHtml — like parseTaggedText but converts {@item} and
 * {@creature} tags into clickable HTML links before falling through to
 * the generic tag stripping.
 */
export function parseTaggedTextToHtml(text: string): string {
  let result = text;

  // {@item Name|Source} → <a href="/items?search=Name">Name</a>
  result = result.replace(
    /\{@item\s+([^|}]+)\|[^}]*\}/g,
    (_m, name: string) =>
      `<a href="/items?search=${encodeURIComponent(name.trim())}" style="color:#c9a84c;text-decoration:underline">${name.trim()}</a>`,
  );

  // {@item Name} (no source)
  result = result.replace(
    /\{@item\s+([^|}]+)\}/g,
    (_m, name: string) =>
      `<a href="/items?search=${encodeURIComponent(name.trim())}" style="color:#c9a84c;text-decoration:underline">${name.trim()}</a>`,
  );

  // {@creature Name|Source} → styled text (no dedicated page yet)
  result = result.replace(
    /\{@creature\s+([^|}]+)\|[^}]*\}/g,
    (_m, name: string) =>
      `<span style="color:#c9a84c;font-style:italic">${name.trim()}</span>`,
  );

  // {@creature Name} (no source)
  result = result.replace(
    /\{@creature\s+([^|}]+)\}/g,
    (_m, name: string) =>
      `<span style="color:#c9a84c;font-style:italic">${name.trim()}</span>`,
  );

  // Now apply all the standard tag transformations
  result = parseTaggedText(result);

  return result;
}
