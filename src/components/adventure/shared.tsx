import { parseTaggedText } from "@/lib/dndTagParser";
import {
  ADVENTURE_DATA_MAP,
  type AdventureSection,
} from "@/lib/adventureData";
import { ITEMS, type Item } from "@/lib/itemsData";

// ---------------------------------------------------------------------------
// Styling constants
// ---------------------------------------------------------------------------

export const GOLD = "#c9a84c";
export const GOLD_MUTED = "#a89060";
export const GOLD_BRIGHT = "#e8d5a3";
export const TEXT_DIM = "rgba(232,213,163,0.6)";
export const SERIF = "'Georgia', 'Times New Roman', serif";

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

export const DM_TABS = [
  { key: "story", label: "Story" },
  { key: "monsters", label: "Monsters" },
  { key: "items", label: "Items" },
  { key: "sessionnotes", label: "Session Notes" },
] as const;

export const PLAYER_TABS = [
  { key: "mycharacter", label: "My Character" },
  { key: "inventory", label: "Inventory" },
  { key: "dmnotes", label: "DM Notes" },
  { key: "sessionnotes", label: "My Session Notes" },
] as const;

export const PLAYERS_TAB = { key: "players" as const, label: "Players" };

export type TabKey = "story" | "monsters" | "items" | "players" | "mycharacter" | "inventory" | "dmnotes" | "sessionnotes";

// ---------------------------------------------------------------------------
// Character constants
// ---------------------------------------------------------------------------

export const SAVING_THROW_PROFICIENCIES: Record<string, string[]> = {
  Barbarian: ["strength", "constitution"],
  Bard: ["dexterity", "charisma"],
  Cleric: ["wisdom", "charisma"],
  Druid: ["intelligence", "wisdom"],
  Fighter: ["strength", "constitution"],
  Monk: ["strength", "dexterity"],
  Paladin: ["wisdom", "charisma"],
  Ranger: ["strength", "dexterity"],
  Rogue: ["dexterity", "intelligence"],
  Sorcerer: ["constitution", "charisma"],
  Warlock: ["wisdom", "charisma"],
  Wizard: ["intelligence", "wisdom"],
};

export const ABILITY_NAMES_SHORT: { key: string; label: string }[] = [
  { key: "strength", label: "STR" },
  { key: "dexterity", label: "DEX" },
  { key: "constitution", label: "CON" },
  { key: "intelligence", label: "INT" },
  { key: "wisdom", label: "WIS" },
  { key: "charisma", label: "CHA" },
];

export const SKILLS_LIST: { name: string; ability: string }[] = [
  { name: "Acrobatics", ability: "dexterity" },
  { name: "Animal Handling", ability: "wisdom" },
  { name: "Arcana", ability: "intelligence" },
  { name: "Athletics", ability: "strength" },
  { name: "Deception", ability: "charisma" },
  { name: "History", ability: "intelligence" },
  { name: "Insight", ability: "wisdom" },
  { name: "Intimidation", ability: "charisma" },
  { name: "Investigation", ability: "intelligence" },
  { name: "Medicine", ability: "wisdom" },
  { name: "Nature", ability: "intelligence" },
  { name: "Perception", ability: "wisdom" },
  { name: "Performance", ability: "charisma" },
  { name: "Persuasion", ability: "charisma" },
  { name: "Religion", ability: "intelligence" },
  { name: "Sleight of Hand", ability: "dexterity" },
  { name: "Stealth", ability: "dexterity" },
  { name: "Survival", ability: "wisdom" },
];

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

export function findSectionIndex(
  adventureSource: string,
  searchTag: string,
  name: string,
): { sectionIndex: number; sectionName: string } | null {
  const sections = ADVENTURE_DATA_MAP[adventureSource];
  if (!sections) return null;
  const searchLower = name.toLowerCase();
  for (let i = 0; i < sections.length; i++) {
    const text = JSON.stringify(sections[i]).toLowerCase();
    if (
      text.includes(`{@${searchTag} ${searchLower}`) ||
      text.includes(`{@${searchTag} ${searchLower}|`)
    ) {
      return {
        sectionIndex: i,
        sectionName: sections[i].name ?? `Section ${i + 1}`,
      };
    }
  }
  return null;
}

export function parseJsonArray(raw: unknown): string[] {
  if (!raw || typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function modString(score: number): string {
  const m = abilityModifier(score);
  return m >= 0 ? `+${m}` : `${m}`;
}

// ---------------------------------------------------------------------------
// Recursive entry renderer
// ---------------------------------------------------------------------------

export function renderEntries(
  entries: (AdventureSection | string)[],
  depth = 0,
): React.ReactNode {
  return entries.map((entry, i) => {
    if (typeof entry === "string") {
      return (
        <p
          key={i}
          style={{
            color: "#e8d5a3",
            fontSize: "14px",
            lineHeight: "1.7",
            marginBottom: "10px",
            fontFamily: "'Georgia', 'Times New Roman', serif",
          }}
          dangerouslySetInnerHTML={{ __html: parseTaggedText(entry) }}
        />
      );
    }

    const e = entry as AdventureSection;

    if (e.type === "image") return null;

    if (e.type === "entries" || e.type === "section") {
      const HeadingTag = (e.type === "section" || depth === 0) ? "h3" : "h4";
      const fontSize = HeadingTag === "h3" ? "16px" : "14px";
      return (
        <div key={i} style={{ marginBottom: "16px" }}>
          {e.name && (
            <HeadingTag
              style={{
                color: "#c9a84c",
                fontSize,
                fontWeight: "bold",
                letterSpacing: "1px",
                textTransform: "uppercase",
                marginBottom: "8px",
                fontFamily: "'Georgia', 'Times New Roman', serif",
              }}
            >
              {parseTaggedText(e.name)}
            </HeadingTag>
          )}
          {e.entries && renderEntries(e.entries as (AdventureSection | string)[], depth + 1)}
        </div>
      );
    }

    if (e.type === "list") {
      const items = (e.items ?? []) as (AdventureSection | string)[];
      return (
        <ul
          key={i}
          style={{
            paddingLeft: "20px",
            marginBottom: "12px",
            color: "#e8d5a3",
            fontSize: "14px",
            lineHeight: "1.7",
            fontFamily: "'Georgia', 'Times New Roman', serif",
          }}
        >
          {items.map((item, j) => {
            if (typeof item === "string") {
              return (
                <li key={j} dangerouslySetInnerHTML={{ __html: parseTaggedText(item) }} />
              );
            }
            const itemEntry = item as AdventureSection;
            if (itemEntry.name && itemEntry.entries) {
              return (
                <li key={j} style={{ marginBottom: "6px" }}>
                  <strong style={{ color: "#c9a84c" }}>
                    {parseTaggedText(itemEntry.name)}
                  </strong>{" "}
                  {renderEntries(itemEntry.entries as (AdventureSection | string)[], depth + 1)}
                </li>
              );
            }
            if (itemEntry.name) {
              return (
                <li key={j}>
                  <strong style={{ color: "#c9a84c" }}>
                    {parseTaggedText(itemEntry.name)}
                  </strong>
                </li>
              );
            }
            return null;
          })}
        </ul>
      );
    }

    if (e.type === "inset" || e.type === "insetReadaloud") {
      return (
        <aside
          key={i}
          style={{
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(201,168,76,0.4)",
            borderLeft: "3px solid #c9a84c",
            borderRadius: "4px",
            padding: "16px 20px",
            marginBottom: "16px",
            fontStyle: "italic",
          }}
        >
          {e.name && (
            <p
              style={{
                color: "#c9a84c",
                fontSize: "13px",
                fontWeight: "bold",
                marginBottom: "8px",
                fontStyle: "normal",
                letterSpacing: "0.5px",
                fontFamily: "'Georgia', 'Times New Roman', serif",
              }}
            >
              {parseTaggedText(e.name)}
            </p>
          )}
          {e.entries &&
            renderEntries(e.entries as (AdventureSection | string)[], depth + 1)}
        </aside>
      );
    }

    if (e.type === "table") {
      const colLabels = (e.colLabels ?? []) as string[];
      const rows = (e.rows ?? []) as unknown[][];
      return (
        <div
          key={i}
          style={{ overflowX: "auto", marginBottom: "16px" }}
        >
          {e.caption && (
            <p
              style={{
                color: "#c9a84c",
                fontSize: "13px",
                fontWeight: "bold",
                marginBottom: "6px",
                fontFamily: "'Georgia', 'Times New Roman', serif",
                letterSpacing: "0.5px",
              }}
            >
              {parseTaggedText(e.caption as string)}
            </p>
          )}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "13px",
              fontFamily: "'Georgia', 'Times New Roman', serif",
              color: "#e8d5a3",
            }}
          >
            {colLabels.length > 0 && (
              <thead>
                <tr>
                  {colLabels.map((label, j) => (
                    <th
                      key={j}
                      style={{
                        borderBottom: "1px solid rgba(201,168,76,0.4)",
                        padding: "6px 10px",
                        textAlign: "left",
                        color: "#c9a84c",
                        fontWeight: "bold",
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                        fontSize: "11px",
                      }}
                    >
                      {parseTaggedText(label)}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {rows.map((row, j) => {
                const cells = Array.isArray(row) ? row : [];
                return (
                  <tr
                    key={j}
                    style={{
                      background:
                        j % 2 === 0 ? "rgba(0,0,0,0.2)" : "transparent",
                    }}
                  >
                    {cells.map((cell, k) => (
                      <td
                        key={k}
                        style={{
                          padding: "6px 10px",
                          borderBottom: "1px solid rgba(201,168,76,0.1)",
                        }}
                      >
                        {typeof cell === "string"
                          ? parseTaggedText(cell)
                          : typeof cell === "number"
                          ? String(cell)
                          : ""}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    if (e.type === "quote") {
      return (
        <blockquote
          key={i}
          style={{
            borderLeft: "3px solid rgba(201,168,76,0.5)",
            marginLeft: "0",
            paddingLeft: "20px",
            marginBottom: "16px",
            fontStyle: "italic",
            color: "#a89060",
            fontFamily: "'Georgia', 'Times New Roman', serif",
          }}
        >
          {e.entries &&
            renderEntries(e.entries as (AdventureSection | string)[], depth + 1)}
          {e.by && (
            <footer
              style={{
                color: "#c9a84c",
                fontSize: "12px",
                marginTop: "4px",
                fontStyle: "normal",
              }}
            >
              — {parseTaggedText(e.by as string)}
            </footer>
          )}
        </blockquote>
      );
    }

    return null;
  });
}

// ---------------------------------------------------------------------------
// Source badge component
// ---------------------------------------------------------------------------

export function SourceBadge({ source }: { source: string }) {
  return (
    <span
      style={{
        background: "rgba(201,168,76,0.15)",
        color: "#c9a84c",
        fontSize: "10px",
        fontFamily: "'Georgia', serif",
        padding: "2px 8px",
        borderRadius: "4px",
        letterSpacing: "0.5px",
        textTransform: "uppercase",
      }}
    >
      {source}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Rarity badge component
// ---------------------------------------------------------------------------

export function RarityBadge({ rarity }: { rarity: string }) {
  const colorMap: Record<string, string> = {
    common: "#a89060",
    uncommon: "#4a8c3f",
    rare: "#3a7bd5",
    "very rare": "#9b59b6",
    legendary: "#c9a84c",
    artifact: "#e74c3c",
  };
  const color = colorMap[rarity.toLowerCase()] ?? "#a89060";
  return (
    <span
      style={{
        color,
        fontSize: "11px",
        fontFamily: "'Georgia', serif",
        fontStyle: "italic",
      }}
    >
      {rarity}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Search Modal (shared between Monsters and Items)
// ---------------------------------------------------------------------------

export function SearchModal({
  title,
  open,
  onClose,
  searchText,
  onSearchChange,
  isPending,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  searchText: string;
  onSearchChange: (v: string) => void;
  isPending: boolean;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "rgba(15,8,3,0.95)",
          border: "2px solid #c9a84c",
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "600px",
          width: "90%",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h2
            style={{
              color: "#c9a84c",
              fontSize: "18px",
              fontWeight: "bold",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              fontFamily: "'Georgia', 'Times New Roman', serif",
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#a89060",
              fontSize: "20px",
              cursor: "pointer",
              padding: "0 4px",
            }}
          >
            x
          </button>
        </div>

        <input
          type="text"
          placeholder="Search by name..."
          autoFocus
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            background: "rgba(30,15,5,0.9)",
            border: "1px solid rgba(201,168,76,0.4)",
            color: "#e8d5a3",
            fontFamily: "'Georgia', serif",
            borderRadius: "6px",
            padding: "10px 14px",
            width: "100%",
            fontSize: "14px",
            boxSizing: "border-box",
            outline: "none",
            marginBottom: "16px",
          }}
        />

        {isPending && (
          <p
            style={{
              color: "#a89060",
              fontSize: "13px",
              fontFamily: "'Georgia', serif",
              textAlign: "center",
              padding: "12px",
            }}
          >
            Adding...
          </p>
        )}

        <div
          style={{
            overflowY: "auto",
            flex: 1,
            minHeight: 0,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared: Inventory Item Description (used by both player & DM views)
// ---------------------------------------------------------------------------

export function InventoryItemDescription({
  itemData,
  customDescription,
}: {
  itemData: Item | undefined;
  customDescription: string | null | undefined;
}) {
  // Parse attached item from customDescription
  let attachedItemData: Item | undefined;
  let cleanCustomDescription = customDescription;

  if (customDescription?.startsWith("[ATTACHED:")) {
    const endBracket = customDescription.indexOf("]");
    if (endBracket !== -1) {
      const ref = customDescription.slice(10, endBracket);
      const pipeIdx = ref.lastIndexOf("|");
      if (pipeIdx !== -1) {
        const attachedName = ref.slice(0, pipeIdx);
        const attachedSource = ref.slice(pipeIdx + 1);
        attachedItemData = ITEMS.find(
          (it) => it.name === attachedName && it.source === attachedSource,
        );
      }
      cleanCustomDescription = customDescription.slice(endBracket + 1).trim() || null;
    }
  }

  const displayItemData = itemData ?? attachedItemData;

  if (!displayItemData && !cleanCustomDescription) {
    return (
      <p
        style={{
          color: TEXT_DIM,
          fontSize: "13px",
          fontFamily: SERIF,
          fontStyle: "italic",
        }}
      >
        No description available.
      </p>
    );
  }

  return (
    <>
      {attachedItemData && !itemData && (
        <p
          style={{
            color: GOLD_MUTED,
            fontSize: "10px",
            fontFamily: SERIF,
            letterSpacing: "1px",
            textTransform: "uppercase",
            marginBottom: "6px",
          }}
        >
          Based on: {attachedItemData.name}
          {" "}<SourceBadge source={attachedItemData.source} />
        </p>
      )}
      {displayItemData && (
        <>
          {/* Type, rarity, source */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "8px",
              flexWrap: "wrap",
            }}
          >
            {displayItemData.type && (
              <span
                style={{
                  color: GOLD_MUTED,
                  fontSize: "13px",
                  fontFamily: SERIF,
                  fontStyle: "italic",
                }}
              >
                {displayItemData.type}
              </span>
            )}
            <RarityBadge rarity={displayItemData.rarity} />
            <SourceBadge source={displayItemData.source} />
          </div>

          {/* Weight, value, attunement */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              marginBottom: "12px",
              fontSize: "13px",
              fontFamily: SERIF,
            }}
          >
            {displayItemData.weight != null && (
              <div>
                <span style={{ color: GOLD, fontWeight: "bold" }}>Weight </span>
                <span style={{ color: GOLD_BRIGHT }}>{displayItemData.weight} lb.</span>
              </div>
            )}
            {displayItemData.value != null && (
              <div>
                <span style={{ color: GOLD, fontWeight: "bold" }}>Value </span>
                <span style={{ color: GOLD_BRIGHT }}>{displayItemData.value} gp</span>
              </div>
            )}
            {displayItemData.reqAttune && (
              <div>
                <span style={{ color: GOLD, fontWeight: "bold" }}>Attunement </span>
                <span style={{ color: GOLD_BRIGHT }}>{displayItemData.reqAttune}</span>
              </div>
            )}
          </div>

          {/* Weapon stats */}
          {displayItemData.weaponCategory && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                marginBottom: "12px",
                fontSize: "13px",
                fontFamily: SERIF,
              }}
            >
              <div>
                <span style={{ color: GOLD, fontWeight: "bold" }}>Category </span>
                <span style={{ color: GOLD_BRIGHT }}>{displayItemData.weaponCategory}</span>
              </div>
              {displayItemData.dmg1 && (
                <div>
                  <span style={{ color: GOLD, fontWeight: "bold" }}>Damage </span>
                  <span style={{ color: GOLD_BRIGHT }}>
                    {displayItemData.dmg1}
                    {displayItemData.dmgType ? ` ${displayItemData.dmgType}` : ""}
                  </span>
                </div>
              )}
              {displayItemData.range && (
                <div>
                  <span style={{ color: GOLD, fontWeight: "bold" }}>Range </span>
                  <span style={{ color: GOLD_BRIGHT }}>{displayItemData.range}</span>
                </div>
              )}
            </div>
          )}

          {/* AC for armor/shields */}
          {(displayItemData.ac != null || displayItemData.bonusAc) && (
            <div
              style={{
                marginBottom: "12px",
                fontSize: "13px",
                fontFamily: SERIF,
              }}
            >
              {displayItemData.ac != null && (
                <div>
                  <span style={{ color: GOLD, fontWeight: "bold" }}>AC </span>
                  <span style={{ color: GOLD_BRIGHT }}>{displayItemData.ac}</span>
                </div>
              )}
              {displayItemData.bonusAc && (
                <div>
                  <span style={{ color: GOLD, fontWeight: "bold" }}>Bonus AC </span>
                  <span style={{ color: GOLD_BRIGHT }}>{displayItemData.bonusAc}</span>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {displayItemData.description && (
            <div
              style={{
                borderTop: "1px solid rgba(201,168,76,0.2)",
                paddingTop: "8px",
              }}
            >
              <p
                style={{
                  color: GOLD_BRIGHT,
                  fontSize: "13px",
                  fontFamily: SERIF,
                  lineHeight: "1.6",
                }}
                dangerouslySetInnerHTML={{
                  __html: parseTaggedText(displayItemData.description),
                }}
              />
            </div>
          )}
        </>
      )}

      {/* Custom description (DM-added) */}
      {cleanCustomDescription && (
        <div
          style={{
            background: "rgba(201,168,76,0.08)",
            border: "1px solid rgba(201,168,76,0.25)",
            borderLeft: "3px solid #c9a84c",
            borderRadius: "4px",
            padding: "12px 16px",
            marginTop: displayItemData ? "12px" : "0",
          }}
        >
          <p
            style={{
              color: GOLD_MUTED,
              fontSize: "10px",
              fontFamily: SERIF,
              letterSpacing: "1px",
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            DM Note
          </p>
          <p
            style={{
              color: GOLD_BRIGHT,
              fontSize: "13px",
              fontFamily: SERIF,
              lineHeight: "1.6",
              whiteSpace: "pre-wrap",
              margin: 0,
            }}
          >
            {cleanCustomDescription}
          </p>
        </div>
      )}
    </>
  );
}
