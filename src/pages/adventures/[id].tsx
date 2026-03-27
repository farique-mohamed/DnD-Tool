import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/utils/api";
import {
  ADVENTURE_LIST,
  ADVENTURE_DATA_MAP,
  type AdventureSection,
} from "@/lib/adventureData";
import { parseTaggedText } from "@/lib/dndTagParser";
import { MONSTER_LIST, type MonsterInfo, abilityMod } from "@/lib/bestiaryData";
import { ITEMS, type Item } from "@/lib/itemsData";
import {
  getClassStartingEquipment,
  getBackgroundStartingEquipment,
  type StartingEquipmentPreset,
  type StartingItem,
} from "@/lib/startingEquipmentData";
import {
  type EquipmentSlot,
  type EquippedItems,
  CLASS_ARMOR_PROFICIENCY,
  WEAPON_MASTERY_DESCRIPTIONS,
  WEAPON_PROPERTY_DESCRIPTIONS,
  calculateEquippedAC,
  getArmorProficiencyPenalties,
  getEquipmentActions,
  validateEquipment,
} from "@/lib/equipmentData";

// ---------------------------------------------------------------------------
// Tab definitions — easy to extend by adding entries here
// ---------------------------------------------------------------------------

const DM_TABS = [
  { key: "story", label: "Story" },
  { key: "monsters", label: "Monsters" },
  { key: "items", label: "Items" },
  { key: "sessionnotes", label: "Session Notes" },
] as const;

const PLAYER_TABS = [
  { key: "mycharacter", label: "My Character" },
  { key: "inventory", label: "Inventory" },
  { key: "dmnotes", label: "DM Notes" },
  { key: "sessionnotes", label: "My Session Notes" },
] as const;

const PLAYERS_TAB = { key: "players" as const, label: "Players" };

type TabKey = "story" | "monsters" | "items" | "players" | "mycharacter" | "inventory" | "dmnotes" | "sessionnotes";

// ---------------------------------------------------------------------------
// Stat block styling constants
// ---------------------------------------------------------------------------

const GOLD = "#c9a84c";
const GOLD_MUTED = "#a89060";
const GOLD_BRIGHT = "#e8d5a3";
const TEXT_DIM = "rgba(232,213,163,0.6)";
const SERIF = "'Georgia', 'Times New Roman', serif";

// ---------------------------------------------------------------------------
// Helper: find which story section mentions a creature/item
// ---------------------------------------------------------------------------

function findSectionIndex(
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

// ---------------------------------------------------------------------------
// Recursive entry renderer (copied from adventure-books/[source].tsx)
// ---------------------------------------------------------------------------

function renderEntries(
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

function SourceBadge({ source }: { source: string }) {
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

function RarityBadge({ rarity }: { rarity: string }) {
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

function SearchModal({
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
// Story Tab
// ---------------------------------------------------------------------------

function StoryTab({
  source,
  sectionIndex,
  onSectionIndexChange,
}: {
  source: string;
  sectionIndex: number;
  onSectionIndexChange: (i: number) => void;
}) {
  const selectedSectionIndex = sectionIndex;
  const setSelectedSectionIndex = onSectionIndexChange;
  const adventureData =
    source in ADVENTURE_DATA_MAP ? ADVENTURE_DATA_MAP[source] ?? null : null;

  if (!adventureData) {
    return (
      <div
        style={{
          background: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(201,168,76,0.2)",
          borderRadius: "12px",
          padding: "60px 40px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            color: "#a89060",
            fontSize: "14px",
            fontFamily: "'Georgia', 'Times New Roman', serif",
          }}
        >
          Content coming soon for this tome.
        </p>
      </div>
    );
  }

  const selectedSection = adventureData[selectedSectionIndex] ?? null;

  return (
    <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
      {/* Table of Contents -- Left Panel */}
      <div
        style={{
          flex: "0 0 240px",
          minWidth: "200px",
          maxWidth: "280px",
          position: "sticky",
          top: "24px",
          maxHeight: "calc(100vh - 120px)",
          overflowY: "auto",
          background: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(201,168,76,0.2)",
          borderRadius: "8px",
          padding: "12px 0",
        }}
      >
        <p
          style={{
            color: "#c9a84c",
            fontSize: "11px",
            letterSpacing: "1.2px",
            textTransform: "uppercase",
            padding: "0 14px 10px",
            borderBottom: "1px solid rgba(201,168,76,0.15)",
            marginBottom: "8px",
            fontFamily: "'Georgia', 'Times New Roman', serif",
          }}
        >
          Contents
        </p>
        {adventureData.map((section, i) => {
          const isActive = i === selectedSectionIndex;
          return (
            <button
              key={i}
              onClick={() => setSelectedSectionIndex(i)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "8px 14px",
                background: isActive
                  ? "rgba(201,168,76,0.15)"
                  : "transparent",
                border: "none",
                borderLeft: isActive
                  ? "2px solid #c9a84c"
                  : "2px solid transparent",
                color: isActive ? "#c9a84c" : "#e8d5a3",
                fontSize: "13px",
                fontFamily: "'Georgia', 'Times New Roman', serif",
                cursor: "pointer",
                lineHeight: "1.4",
                transition: "background 0.1s, color 0.1s",
              }}
            >
              {section.name ?? `Section ${i + 1}`}
            </button>
          );
        })}
      </div>

      {/* Content -- Right Panel */}
      <div style={{ flex: 3, minWidth: 0 }}>
        {selectedSection && (
          <div
            style={{
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(201,168,76,0.2)",
              borderRadius: "8px",
              padding: "28px 32px",
            }}
          >
            <h2
              style={{
                color: "#c9a84c",
                fontSize: "20px",
                fontWeight: "bold",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                marginBottom: "20px",
                fontFamily: "'Georgia', 'Times New Roman', serif",
              }}
            >
              {selectedSection.name ?? ""}
            </h2>
            {selectedSection.entries &&
              renderEntries(
                selectedSection.entries as (AdventureSection | string)[],
                0,
              )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Monsters Tab
// ---------------------------------------------------------------------------

function MonstersTab({
  adventureId,
  adventureSource,
  monsters,
  onViewInStory,
}: {
  adventureId: string;
  adventureSource: string;
  monsters: { id: string; name: string; source: string; createdAt: Date }[];
  onViewInStory: (sectionIndex: number) => void;
}) {
  const utils = api.useUtils();
  const [showModal, setShowModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addMonster = api.adventure.addMonster.useMutation({
    onSuccess: () => {
      void utils.adventure.getById.invalidate({ id: adventureId });
      setShowModal(false);
      setSearchText("");
    },
  });

  const removeMonster = api.adventure.removeMonster.useMutation({
    onSuccess: () => {
      void utils.adventure.getById.invalidate({ id: adventureId });
    },
  });

  const filteredMonsters = useMemo(() => {
    if (searchText.length < 2) return [];
    const lower = searchText.toLowerCase();
    const results: MonsterInfo[] = [];
    for (const m of MONSTER_LIST) {
      if (m.name.toLowerCase().includes(lower)) {
        results.push(m);
        if (results.length >= 50) break;
      }
    }
    return results;
  }, [searchText]);

  return (
    <div>
      <button
        onClick={() => {
          setSearchText("");
          setShowModal(true);
        }}
        style={{
          background: "linear-gradient(135deg, #8b6914, #c9a84c)",
          color: "#1a1a2e",
          border: "none",
          borderRadius: "6px",
          padding: "10px 24px",
          fontSize: "14px",
          fontFamily: "'Georgia', serif",
          fontWeight: "bold",
          cursor: "pointer",
          letterSpacing: "0.5px",
          marginBottom: "20px",
        }}
      >
        Add Monster
      </button>

      {monsters.length === 0 ? (
        <div
          style={{
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(201,168,76,0.2)",
            borderRadius: "12px",
            padding: "40px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              color: "#a89060",
              fontSize: "14px",
              fontFamily: "'Georgia', 'Times New Roman', serif",
            }}
          >
            No monsters added yet. Add some foes to this adventure.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {monsters.map((monster) => {
            const isExpanded = expandedId === monster.id;
            const monsterData = MONSTER_LIST.find(
              (m) => m.name.toLowerCase() === monster.name.toLowerCase(),
            );
            const storyRef = !monsterData
              ? findSectionIndex(adventureSource, "creature", monster.name)
              : null;

            return (
              <div
                key={monster.id}
                style={{
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid rgba(201,168,76,0.2)",
                  borderRadius: "8px",
                  padding: "12px 16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    setExpandedId(isExpanded ? null : monster.id)
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <span
                      style={{
                        color: GOLD_BRIGHT,
                        fontSize: "14px",
                        fontFamily: "'Georgia', serif",
                      }}
                    >
                      {isExpanded ? "\u25BC" : "\u25B6"} {monster.name}
                    </span>
                    <SourceBadge source={monster.source} />
                    {monsterData && (
                      <span
                        style={{
                          color: GOLD,
                          fontSize: "11px",
                          fontFamily: "'Georgia', serif",
                          background: "rgba(201,168,76,0.15)",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontWeight: "bold",
                        }}
                      >
                        CR {monsterData.cr}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMonster.mutate({ id: monster.id });
                    }}
                    disabled={removeMonster.isPending}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#e74c3c",
                      fontSize: "16px",
                      cursor: removeMonster.isPending
                        ? "default"
                        : "pointer",
                      padding: "4px 8px",
                      fontFamily: "'Georgia', serif",
                      opacity: removeMonster.isPending ? 0.5 : 1,
                    }}
                    title="Remove monster"
                  >
                    x
                  </button>
                </div>

                {isExpanded && monsterData && (
                  <div
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(201,168,76,0.15)",
                      borderRadius: "8px",
                      padding: "16px 20px",
                      marginTop: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    {/* Size, type, alignment */}
                    <p
                      style={{
                        color: GOLD_MUTED,
                        fontSize: "13px",
                        fontFamily: SERIF,
                        fontStyle: "italic",
                        marginBottom: "8px",
                      }}
                    >
                      {monsterData.size} {monsterData.type}
                      {monsterData.alignment
                        ? `, ${monsterData.alignment}`
                        : ""}
                    </p>

                    {/* AC, HP, Speed */}
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
                        <span style={{ color: GOLD, fontWeight: "bold" }}>
                          Armor Class{" "}
                        </span>
                        <span style={{ color: GOLD_BRIGHT }}>
                          {monsterData.ac ?? "—"}
                          {monsterData.acNote
                            ? ` (${monsterData.acNote})`
                            : ""}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: GOLD, fontWeight: "bold" }}>
                          Hit Points{" "}
                        </span>
                        <span style={{ color: GOLD_BRIGHT }}>
                          {monsterData.hp ?? "—"}
                          {monsterData.hpFormula
                            ? ` (${monsterData.hpFormula})`
                            : ""}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: GOLD, fontWeight: "bold" }}>
                          Speed{" "}
                        </span>
                        <span style={{ color: GOLD_BRIGHT }}>
                          {monsterData.speed || "—"}
                        </span>
                      </div>
                    </div>

                    {/* Divider */}
                    <div
                      style={{
                        height: "1px",
                        background: "rgba(201,168,76,0.2)",
                        margin: "8px 0",
                      }}
                    />

                    {/* Ability scores */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(6, 1fr)",
                        gap: "8px",
                        textAlign: "center",
                        marginBottom: "12px",
                      }}
                    >
                      {(
                        ["str", "dex", "con", "int", "wis", "cha"] as const
                      ).map((ab) => (
                        <div key={ab}>
                          <div
                            style={{
                              color: GOLD,
                              fontSize: "10px",
                              textTransform: "uppercase",
                              letterSpacing: "1px",
                            }}
                          >
                            {ab}
                          </div>
                          <div
                            style={{
                              color: GOLD_BRIGHT,
                              fontSize: "14px",
                              fontWeight: "bold",
                            }}
                          >
                            {monsterData[ab]}
                          </div>
                          <div
                            style={{
                              color: TEXT_DIM,
                              fontSize: "11px",
                            }}
                          >
                            ({abilityMod(monsterData[ab])})
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Divider */}
                    <div
                      style={{
                        height: "1px",
                        background: "rgba(201,168,76,0.2)",
                        margin: "8px 0",
                      }}
                    />

                    {/* Secondary stats */}
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
                      {monsterData.savingThrows && (
                        <div>
                          <span style={{ color: GOLD, fontWeight: "bold" }}>
                            Saving Throws{" "}
                          </span>
                          <span style={{ color: GOLD_BRIGHT }}>
                            {monsterData.savingThrows}
                          </span>
                        </div>
                      )}
                      {monsterData.skills && (
                        <div>
                          <span style={{ color: GOLD, fontWeight: "bold" }}>
                            Skills{" "}
                          </span>
                          <span style={{ color: GOLD_BRIGHT }}>
                            {monsterData.skills}
                          </span>
                        </div>
                      )}
                      {monsterData.damageResistances && (
                        <div>
                          <span style={{ color: GOLD, fontWeight: "bold" }}>
                            Damage Resistances{" "}
                          </span>
                          <span style={{ color: GOLD_BRIGHT }}>
                            {monsterData.damageResistances}
                          </span>
                        </div>
                      )}
                      {monsterData.damageImmunities && (
                        <div>
                          <span style={{ color: GOLD, fontWeight: "bold" }}>
                            Damage Immunities{" "}
                          </span>
                          <span style={{ color: GOLD_BRIGHT }}>
                            {monsterData.damageImmunities}
                          </span>
                        </div>
                      )}
                      {monsterData.conditionImmunities && (
                        <div>
                          <span style={{ color: GOLD, fontWeight: "bold" }}>
                            Condition Immunities{" "}
                          </span>
                          <span style={{ color: GOLD_BRIGHT }}>
                            {monsterData.conditionImmunities}
                          </span>
                        </div>
                      )}
                      {monsterData.senses && (
                        <div>
                          <span style={{ color: GOLD, fontWeight: "bold" }}>
                            Senses{" "}
                          </span>
                          <span style={{ color: GOLD_BRIGHT }}>
                            {monsterData.senses}
                          </span>
                        </div>
                      )}
                      {monsterData.languages && (
                        <div>
                          <span style={{ color: GOLD, fontWeight: "bold" }}>
                            Languages{" "}
                          </span>
                          <span style={{ color: GOLD_BRIGHT }}>
                            {monsterData.languages}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Traits */}
                    {monsterData.traits.length > 0 && (
                      <div style={{ marginBottom: "12px" }}>
                        {monsterData.traits.map((t, ti) => (
                          <div key={ti} style={{ marginBottom: "6px" }}>
                            <span
                              style={{
                                color: GOLD_BRIGHT,
                                fontWeight: "bold",
                                fontStyle: "italic",
                                fontFamily: SERIF,
                                fontSize: "13px",
                              }}
                            >
                              {t.name}.{" "}
                            </span>
                            <span
                              style={{
                                color: GOLD_BRIGHT,
                                fontFamily: SERIF,
                                fontSize: "13px",
                              }}
                              dangerouslySetInnerHTML={{
                                __html: parseTaggedText(t.text),
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    {monsterData.actions.length > 0 && (
                      <div style={{ marginBottom: "12px" }}>
                        <h4
                          style={{
                            color: GOLD,
                            fontSize: "14px",
                            fontFamily: SERIF,
                            fontWeight: "bold",
                            borderBottom: "1px solid rgba(201,168,76,0.3)",
                            paddingBottom: "4px",
                            marginBottom: "8px",
                          }}
                        >
                          Actions
                        </h4>
                        {monsterData.actions.map((a, ai) => (
                          <div key={ai} style={{ marginBottom: "6px" }}>
                            <span
                              style={{
                                color: GOLD_BRIGHT,
                                fontWeight: "bold",
                                fontStyle: "italic",
                                fontFamily: SERIF,
                                fontSize: "13px",
                              }}
                            >
                              {a.name}.{" "}
                            </span>
                            <span
                              style={{
                                color: GOLD_BRIGHT,
                                fontFamily: SERIF,
                                fontSize: "13px",
                              }}
                              dangerouslySetInnerHTML={{
                                __html: parseTaggedText(a.text),
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Bonus Actions */}
                    {monsterData.bonusActions.length > 0 && (
                      <div style={{ marginBottom: "12px" }}>
                        <h4
                          style={{
                            color: GOLD,
                            fontSize: "14px",
                            fontFamily: SERIF,
                            fontWeight: "bold",
                            borderBottom: "1px solid rgba(201,168,76,0.3)",
                            paddingBottom: "4px",
                            marginBottom: "8px",
                          }}
                        >
                          Bonus Actions
                        </h4>
                        {monsterData.bonusActions.map((a, ai) => (
                          <div key={ai} style={{ marginBottom: "6px" }}>
                            <span
                              style={{
                                color: GOLD_BRIGHT,
                                fontWeight: "bold",
                                fontStyle: "italic",
                                fontFamily: SERIF,
                                fontSize: "13px",
                              }}
                            >
                              {a.name}.{" "}
                            </span>
                            <span
                              style={{
                                color: GOLD_BRIGHT,
                                fontFamily: SERIF,
                                fontSize: "13px",
                              }}
                              dangerouslySetInnerHTML={{
                                __html: parseTaggedText(a.text),
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reactions */}
                    {monsterData.reactions.length > 0 && (
                      <div style={{ marginBottom: "12px" }}>
                        <h4
                          style={{
                            color: GOLD,
                            fontSize: "14px",
                            fontFamily: SERIF,
                            fontWeight: "bold",
                            borderBottom: "1px solid rgba(201,168,76,0.3)",
                            paddingBottom: "4px",
                            marginBottom: "8px",
                          }}
                        >
                          Reactions
                        </h4>
                        {monsterData.reactions.map((a, ai) => (
                          <div key={ai} style={{ marginBottom: "6px" }}>
                            <span
                              style={{
                                color: GOLD_BRIGHT,
                                fontWeight: "bold",
                                fontStyle: "italic",
                                fontFamily: SERIF,
                                fontSize: "13px",
                              }}
                            >
                              {a.name}.{" "}
                            </span>
                            <span
                              style={{
                                color: GOLD_BRIGHT,
                                fontFamily: SERIF,
                                fontSize: "13px",
                              }}
                              dangerouslySetInnerHTML={{
                                __html: parseTaggedText(a.text),
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Legendary Actions */}
                    {monsterData.legendaryActions.length > 0 && (
                      <div style={{ marginBottom: "12px" }}>
                        <h4
                          style={{
                            color: GOLD,
                            fontSize: "14px",
                            fontFamily: SERIF,
                            fontWeight: "bold",
                            borderBottom: "1px solid rgba(201,168,76,0.3)",
                            paddingBottom: "4px",
                            marginBottom: "8px",
                          }}
                        >
                          Legendary Actions
                        </h4>
                        {monsterData.legendaryActions.map((a, ai) => (
                          <div key={ai} style={{ marginBottom: "6px" }}>
                            <span
                              style={{
                                color: GOLD_BRIGHT,
                                fontWeight: "bold",
                                fontStyle: "italic",
                                fontFamily: SERIF,
                                fontSize: "13px",
                              }}
                            >
                              {a.name}.{" "}
                            </span>
                            <span
                              style={{
                                color: GOLD_BRIGHT,
                                fontFamily: SERIF,
                                fontSize: "13px",
                              }}
                              dangerouslySetInnerHTML={{
                                __html: parseTaggedText(a.text),
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {isExpanded && !monsterData && storyRef && (
                  <div
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(201,168,76,0.15)",
                      borderRadius: "8px",
                      padding: "16px 20px",
                      marginTop: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <p
                      style={{
                        color: TEXT_DIM,
                        fontSize: "13px",
                        fontFamily: SERIF,
                        marginBottom: "8px",
                      }}
                    >
                      This monster was not found in the bestiary data.
                    </p>
                    <button
                      onClick={() => onViewInStory(storyRef.sectionIndex)}
                      style={{
                        background: "none",
                        border: "none",
                        color: GOLD,
                        cursor: "pointer",
                        fontFamily: "'Georgia', serif",
                        fontSize: "13px",
                        padding: "0",
                        textDecoration: "underline",
                      }}
                    >
                      View in Story ({storyRef.sectionName})
                    </button>
                  </div>
                )}

                {isExpanded && !monsterData && !storyRef && (
                  <div
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(201,168,76,0.15)",
                      borderRadius: "8px",
                      padding: "16px 20px",
                      marginTop: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <p
                      style={{
                        color: TEXT_DIM,
                        fontSize: "13px",
                        fontFamily: SERIF,
                      }}
                    >
                      This monster was not found in the bestiary data or the
                      adventure story.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <SearchModal
        title="Add Monster"
        open={showModal}
        onClose={() => setShowModal(false)}
        searchText={searchText}
        onSearchChange={setSearchText}
        isPending={addMonster.isPending}
      >
        {searchText.length < 2 ? (
          <p
            style={{
              color: "#a89060",
              fontSize: "13px",
              fontFamily: "'Georgia', serif",
              textAlign: "center",
              padding: "20px",
            }}
          >
            Type at least 2 characters to search.
          </p>
        ) : filteredMonsters.length === 0 ? (
          <p
            style={{
              color: "#a89060",
              fontSize: "13px",
              fontFamily: "'Georgia', serif",
              textAlign: "center",
              padding: "20px",
            }}
          >
            No monsters found.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {filteredMonsters.map((m, i) => (
              <button
                key={`${m.name}-${m.source}-${i}`}
                onClick={() =>
                  addMonster.mutate({
                    adventureId,
                    name: m.name,
                    source: m.source,
                  })
                }
                disabled={addMonster.isPending}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px solid rgba(201,168,76,0.1)",
                  cursor: addMonster.isPending ? "default" : "pointer",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(201,168,76,0.1)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "transparent";
                }}
              >
                <span
                  style={{
                    color: "#e8d5a3",
                    fontSize: "14px",
                    fontFamily: "'Georgia', serif",
                    flex: 1,
                  }}
                >
                  {m.name}
                </span>
                <span
                  style={{
                    color: "#c9a84c",
                    fontSize: "11px",
                    fontFamily: "'Georgia', serif",
                    background: "rgba(201,168,76,0.15)",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontWeight: "bold",
                  }}
                >
                  CR {m.cr}
                </span>
                <span
                  style={{
                    color: "#a89060",
                    fontSize: "12px",
                    fontFamily: "'Georgia', serif",
                    minWidth: "80px",
                  }}
                >
                  {m.type}
                </span>
                <SourceBadge source={m.source} />
              </button>
            ))}
          </div>
        )}
      </SearchModal>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Items Tab
// ---------------------------------------------------------------------------

function ItemsTab({
  adventureId,
  adventureSource,
  items,
  acceptedPlayers,
  onViewInStory,
}: {
  adventureId: string;
  adventureSource: string;
  items: { id: string; name: string; source: string; createdAt: Date }[];
  acceptedPlayers: Array<{
    id: string;
    user: { id: string; username: string };
    character: Record<string, unknown> | null;
  }>;
  onViewInStory: (sectionIndex: number) => void;
}) {
  const utils = api.useUtils();
  const [showModal, setShowModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addToPlayerItemId, setAddToPlayerItemId] = useState<string | null>(null);
  const [addToPlayerCustomDescs, setAddToPlayerCustomDescs] = useState<Record<string, string>>({});
  const [attachedItemsTab, setAttachedItemsTab] = useState<Record<string, { name: string; source: string } | null>>({});
  const [attachSearchTab, setAttachSearchTab] = useState<Record<string, string>>({});

  const [addedSuccess, setAddedSuccess] = useState<string | null>(null);

  const addInventoryItem = api.adventure.addInventoryItem.useMutation({
    onSuccess: () => {
      void utils.adventure.getInventory.invalidate();
      setAddToPlayerItemId(null);
      setAddToPlayerCustomDescs({});
      setAttachedItemsTab({});
      setAttachSearchTab({});
      setAddedSuccess("Item added to inventory!");
      setTimeout(() => setAddedSuccess(null), 2000);
    },
  });

  const addItem = api.adventure.addItem.useMutation({
    onSuccess: () => {
      void utils.adventure.getById.invalidate({ id: adventureId });
      setShowModal(false);
      setSearchText("");
    },
  });

  const removeItem = api.adventure.removeItem.useMutation({
    onSuccess: () => {
      void utils.adventure.getById.invalidate({ id: adventureId });
    },
  });

  const filteredItems = useMemo(() => {
    if (searchText.length < 2) return [];
    const lower = searchText.toLowerCase();
    const results: Item[] = [];
    for (const item of ITEMS) {
      if (item.name.toLowerCase().includes(lower)) {
        results.push(item);
        if (results.length >= 50) break;
      }
    }
    return results;
  }, [searchText]);

  return (
    <div>
      <button
        onClick={() => {
          setSearchText("");
          setShowModal(true);
        }}
        style={{
          background: "linear-gradient(135deg, #8b6914, #c9a84c)",
          color: "#1a1a2e",
          border: "none",
          borderRadius: "6px",
          padding: "10px 24px",
          fontSize: "14px",
          fontFamily: "'Georgia', serif",
          fontWeight: "bold",
          cursor: "pointer",
          letterSpacing: "0.5px",
          marginBottom: "20px",
        }}
      >
        Add Item
      </button>

      {addedSuccess && (
        <p
          style={{
            color: "#4a8c3f",
            fontSize: "13px",
            fontFamily: SERIF,
            marginBottom: "12px",
            padding: "8px 14px",
            background: "rgba(74,140,63,0.1)",
            border: "1px solid rgba(74,140,63,0.3)",
            borderRadius: "6px",
          }}
        >
          {addedSuccess}
        </p>
      )}

      {items.length === 0 ? (
        <div
          style={{
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(201,168,76,0.2)",
            borderRadius: "12px",
            padding: "40px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              color: "#a89060",
              fontSize: "14px",
              fontFamily: "'Georgia', 'Times New Roman', serif",
            }}
          >
            No items added yet. Equip this adventure with some loot.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {items.map((item) => {
            const isExpanded = expandedId === item.id;
            const itemData = ITEMS.find(
              (it) => it.name.toLowerCase() === item.name.toLowerCase(),
            );
            const storyRef = !itemData
              ? findSectionIndex(adventureSource, "item", item.name)
              : null;

            return (
              <div
                key={item.id}
                style={{
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid rgba(201,168,76,0.2)",
                  borderRadius: "8px",
                  padding: "12px 16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    setExpandedId(isExpanded ? null : item.id)
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <span
                      style={{
                        color: GOLD_BRIGHT,
                        fontSize: "14px",
                        fontFamily: "'Georgia', serif",
                      }}
                    >
                      {isExpanded ? "\u25BC" : "\u25B6"} {item.name}
                    </span>
                    <SourceBadge source={item.source} />
                    {itemData && <RarityBadge rarity={itemData.rarity} />}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {acceptedPlayers.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddToPlayerItemId(addToPlayerItemId === item.id ? null : item.id);
                        }}
                        style={{
                          background: "none",
                          border: "1px solid rgba(201,168,76,0.3)",
                          color: GOLD_MUTED,
                          fontSize: "11px",
                          cursor: "pointer",
                          padding: "3px 10px",
                          fontFamily: "'Georgia', serif",
                          borderRadius: "4px",
                          whiteSpace: "nowrap",
                        }}
                        title="Add to player inventory"
                      >
                        + Player
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem.mutate({ id: item.id });
                      }}
                      disabled={removeItem.isPending}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#e74c3c",
                        fontSize: "16px",
                        cursor: removeItem.isPending
                          ? "default"
                          : "pointer",
                        padding: "4px 8px",
                        fontFamily: "'Georgia', serif",
                        opacity: removeItem.isPending ? 0.5 : 1,
                      }}
                      title="Remove item"
                    >
                      x
                    </button>
                  </div>
                </div>

                {/* Add to Player dropdown */}
                {addToPlayerItemId === item.id && (
                  <div
                    style={{
                      background: "rgba(0,0,0,0.5)",
                      border: "1px solid rgba(201,168,76,0.3)",
                      borderRadius: "8px",
                      padding: "12px 16px",
                      marginTop: "8px",
                    }}
                  >
                    <p
                      style={{
                        color: GOLD,
                        fontSize: "11px",
                        fontFamily: SERIF,
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                        marginBottom: "8px",
                      }}
                    >
                      Add to Player Inventory
                    </p>
                    {!itemData && (
                      <>
                        <textarea
                          placeholder="Custom description for this item..."
                          value={addToPlayerCustomDescs[item.id] ?? ""}
                          onChange={(e) => setAddToPlayerCustomDescs(prev => ({ ...prev, [item.id]: e.target.value }))}
                          rows={2}
                          style={{
                            width: "100%",
                            marginBottom: "8px",
                            padding: "6px 10px",
                            background: "rgba(30,15,5,0.9)",
                            border: "1px solid rgba(201,168,76,0.3)",
                            borderRadius: "4px",
                            color: GOLD_BRIGHT,
                            fontFamily: SERIF,
                            fontSize: "12px",
                            outline: "none",
                            resize: "vertical",
                            boxSizing: "border-box",
                          }}
                        />
                        {/* Attach official item */}
                        <div style={{ marginBottom: "8px" }}>
                          {attachedItemsTab[item.id] ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ color: GOLD_MUTED, fontSize: "11px", fontFamily: SERIF }}>
                                Attached: {attachedItemsTab[item.id]!.name}
                              </span>
                              <SourceBadge source={attachedItemsTab[item.id]!.source} />
                              <button
                                onClick={() => setAttachedItemsTab(prev => ({ ...prev, [item.id]: null }))}
                                style={{ background: "none", border: "none", color: "#e74c3c", cursor: "pointer", fontSize: "12px", padding: "0 4px" }}
                              >
                                x
                              </button>
                            </div>
                          ) : (
                            <div style={{ position: "relative" }}>
                              <input
                                type="text"
                                placeholder="Attach official item..."
                                value={attachSearchTab[item.id] ?? ""}
                                onChange={(e) => setAttachSearchTab(prev => ({ ...prev, [item.id]: e.target.value }))}
                                style={{
                                  width: "100%",
                                  padding: "4px 8px",
                                  background: "rgba(30,15,5,0.9)",
                                  border: "1px solid rgba(201,168,76,0.2)",
                                  borderRadius: "4px",
                                  color: GOLD_BRIGHT,
                                  fontFamily: SERIF,
                                  fontSize: "11px",
                                  outline: "none",
                                  boxSizing: "border-box",
                                }}
                              />
                              {(attachSearchTab[item.id] ?? "").length >= 2 && (
                                <div style={{
                                  position: "absolute",
                                  top: "100%",
                                  left: 0,
                                  right: 0,
                                  maxHeight: "150px",
                                  overflowY: "auto",
                                  background: "rgba(20,10,5,0.98)",
                                  border: "1px solid rgba(201,168,76,0.3)",
                                  borderRadius: "4px",
                                  zIndex: 10,
                                }}>
                                  {ITEMS.filter(it => it.name.toLowerCase().includes((attachSearchTab[item.id] ?? "").toLowerCase())).slice(0, 10).map((it, idx) => (
                                    <button
                                      key={`${it.name}-${it.source}-${idx}`}
                                      onClick={() => {
                                        setAttachedItemsTab(prev => ({ ...prev, [item.id]: { name: it.name, source: it.source } }));
                                        setAttachSearchTab(prev => ({ ...prev, [item.id]: "" }));
                                      }}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                        width: "100%",
                                        textAlign: "left",
                                        padding: "4px 8px",
                                        background: "transparent",
                                        border: "none",
                                        borderBottom: "1px solid rgba(201,168,76,0.1)",
                                        cursor: "pointer",
                                        color: GOLD_BRIGHT,
                                        fontFamily: SERIF,
                                        fontSize: "11px",
                                      }}
                                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(201,168,76,0.1)"; }}
                                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                                    >
                                      {it.name} <SourceBadge source={it.source} />
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {acceptedPlayers.map((player) => {
                        const charName = player.character
                          ? (player.character.name as string) ?? "Unknown"
                          : "No character";
                        return (
                          <button
                            key={player.id}
                            onClick={() => {
                              {
                                let desc = (addToPlayerCustomDescs[item.id] ?? "").trim();
                                const attached = attachedItemsTab[item.id];
                                if (attached) {
                                  desc = `[ATTACHED:${attached.name}|${attached.source}]${desc ? "\n" + desc : ""}`;
                                }
                                addInventoryItem.mutate({
                                  adventurePlayerId: player.id,
                                  itemName: item.name,
                                  itemSource: item.source,
                                  customDescription: !itemData && desc ? desc : undefined,
                                });
                              }
                            }}
                            disabled={addInventoryItem.isPending}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              width: "100%",
                              textAlign: "left",
                              padding: "8px 10px",
                              background: "transparent",
                              border: "none",
                              borderBottom: "1px solid rgba(201,168,76,0.1)",
                              cursor: addInventoryItem.isPending ? "default" : "pointer",
                              transition: "background 0.1s",
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background =
                                "rgba(201,168,76,0.1)";
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background =
                                "transparent";
                            }}
                          >
                            <span style={{ color: GOLD_BRIGHT, fontSize: "13px", fontFamily: SERIF, fontWeight: "bold" }}>
                              {player.user.username}
                            </span>
                            <span style={{ color: GOLD_MUTED, fontSize: "12px", fontFamily: SERIF }}>
                              ({charName})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {isExpanded && itemData && (
                  <div
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(201,168,76,0.15)",
                      borderRadius: "8px",
                      padding: "16px 20px",
                      marginTop: "8px",
                      marginBottom: "4px",
                    }}
                  >
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
                      {itemData.type && (
                        <span
                          style={{
                            color: GOLD_MUTED,
                            fontSize: "13px",
                            fontFamily: SERIF,
                            fontStyle: "italic",
                          }}
                        >
                          {itemData.type}
                        </span>
                      )}
                      <RarityBadge rarity={itemData.rarity} />
                      <SourceBadge source={itemData.source} />
                    </div>

                    {/* Weight, value */}
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
                      {itemData.weight != null && (
                        <div>
                          <span style={{ color: GOLD, fontWeight: "bold" }}>
                            Weight{" "}
                          </span>
                          <span style={{ color: GOLD_BRIGHT }}>
                            {itemData.weight} lb.
                          </span>
                        </div>
                      )}
                      {itemData.value != null && (
                        <div>
                          <span style={{ color: GOLD, fontWeight: "bold" }}>
                            Value{" "}
                          </span>
                          <span style={{ color: GOLD_BRIGHT }}>
                            {itemData.value} gp
                          </span>
                        </div>
                      )}
                      {itemData.reqAttune && (
                        <div>
                          <span style={{ color: GOLD, fontWeight: "bold" }}>
                            Attunement{" "}
                          </span>
                          <span style={{ color: GOLD_BRIGHT }}>
                            {itemData.reqAttune}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Weapon stats */}
                    {itemData.weaponCategory && (
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
                          <span style={{ color: GOLD, fontWeight: "bold" }}>
                            Category{" "}
                          </span>
                          <span style={{ color: GOLD_BRIGHT }}>
                            {itemData.weaponCategory}
                          </span>
                        </div>
                        {itemData.dmg1 && (
                          <div>
                            <span
                              style={{ color: GOLD, fontWeight: "bold" }}
                            >
                              Damage{" "}
                            </span>
                            <span style={{ color: GOLD_BRIGHT }}>
                              {itemData.dmg1}
                              {itemData.dmgType
                                ? ` ${itemData.dmgType}`
                                : ""}
                            </span>
                          </div>
                        )}
                        {itemData.range && (
                          <div>
                            <span
                              style={{ color: GOLD, fontWeight: "bold" }}
                            >
                              Range{" "}
                            </span>
                            <span style={{ color: GOLD_BRIGHT }}>
                              {itemData.range}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* AC for armor/shields */}
                    {(itemData.ac != null || itemData.bonusAc) && (
                      <div
                        style={{
                          marginBottom: "12px",
                          fontSize: "13px",
                          fontFamily: SERIF,
                        }}
                      >
                        {itemData.ac != null && (
                          <div>
                            <span
                              style={{ color: GOLD, fontWeight: "bold" }}
                            >
                              AC{" "}
                            </span>
                            <span style={{ color: GOLD_BRIGHT }}>
                              {itemData.ac}
                            </span>
                          </div>
                        )}
                        {itemData.bonusAc && (
                          <div>
                            <span
                              style={{ color: GOLD, fontWeight: "bold" }}
                            >
                              Bonus AC{" "}
                            </span>
                            <span style={{ color: GOLD_BRIGHT }}>
                              {itemData.bonusAc}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Description */}
                    {itemData.description && (
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
                            __html: parseTaggedText(itemData.description),
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {isExpanded && !itemData && storyRef && (
                  <div
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(201,168,76,0.15)",
                      borderRadius: "8px",
                      padding: "16px 20px",
                      marginTop: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <p
                      style={{
                        color: TEXT_DIM,
                        fontSize: "13px",
                        fontFamily: SERIF,
                        marginBottom: "8px",
                      }}
                    >
                      This item was not found in the items data.
                    </p>
                    <button
                      onClick={() => onViewInStory(storyRef.sectionIndex)}
                      style={{
                        background: "none",
                        border: "none",
                        color: GOLD,
                        cursor: "pointer",
                        fontFamily: "'Georgia', serif",
                        fontSize: "13px",
                        padding: "0",
                        textDecoration: "underline",
                      }}
                    >
                      View in Story ({storyRef.sectionName})
                    </button>
                  </div>
                )}

                {isExpanded && !itemData && !storyRef && (
                  <div
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(201,168,76,0.15)",
                      borderRadius: "8px",
                      padding: "16px 20px",
                      marginTop: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <p
                      style={{
                        color: TEXT_DIM,
                        fontSize: "13px",
                        fontFamily: SERIF,
                      }}
                    >
                      This item was not found in the items data or the
                      adventure story.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <SearchModal
        title="Add Item"
        open={showModal}
        onClose={() => setShowModal(false)}
        searchText={searchText}
        onSearchChange={setSearchText}
        isPending={addItem.isPending}
      >
        {searchText.length < 2 ? (
          <p
            style={{
              color: "#a89060",
              fontSize: "13px",
              fontFamily: "'Georgia', serif",
              textAlign: "center",
              padding: "20px",
            }}
          >
            Type at least 2 characters to search.
          </p>
        ) : filteredItems.length === 0 ? (
          <p
            style={{
              color: "#a89060",
              fontSize: "13px",
              fontFamily: "'Georgia', serif",
              textAlign: "center",
              padding: "20px",
            }}
          >
            No items found.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {filteredItems.map((item, i) => (
              <button
                key={`${item.name}-${item.source}-${i}`}
                onClick={() =>
                  addItem.mutate({
                    adventureId,
                    name: item.name,
                    source: item.source,
                  })
                }
                disabled={addItem.isPending}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px solid rgba(201,168,76,0.1)",
                  cursor: addItem.isPending ? "default" : "pointer",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(201,168,76,0.1)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "transparent";
                }}
              >
                <span
                  style={{
                    color: "#e8d5a3",
                    fontSize: "14px",
                    fontFamily: "'Georgia', serif",
                    flex: 1,
                  }}
                >
                  {item.name}
                </span>
                <span
                  style={{
                    color: "#a89060",
                    fontSize: "12px",
                    fontFamily: "'Georgia', serif",
                    minWidth: "80px",
                  }}
                >
                  {item.type}
                </span>
                <RarityBadge rarity={item.rarity} />
                <SourceBadge source={item.source} />
              </button>
            ))}
          </div>
        )}
      </SearchModal>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Saving throw proficiencies by class (for character sheet modal)
// ---------------------------------------------------------------------------

const SAVING_THROW_PROFICIENCIES: Record<string, string[]> = {
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

const ABILITY_NAMES_SHORT: { key: string; label: string }[] = [
  { key: "strength", label: "STR" },
  { key: "dexterity", label: "DEX" },
  { key: "constitution", label: "CON" },
  { key: "intelligence", label: "INT" },
  { key: "wisdom", label: "WIS" },
  { key: "charisma", label: "CHA" },
];

const SKILLS_LIST: { name: string; ability: string }[] = [
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

function parseJsonArray(raw: unknown): string[] {
  if (!raw || typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

function modString(score: number): string {
  const m = abilityModifier(score);
  return m >= 0 ? `+${m}` : `${m}`;
}

// ---------------------------------------------------------------------------
// DM Notes Section (used inside character sheet modal)
// ---------------------------------------------------------------------------

function DmNotesSection({
  adventureId,
  characterId,
  toUserId,
  playerNotes,
}: {
  adventureId: string;
  characterId: string;
  toUserId: string;
  playerNotes: string | null | undefined;
}) {
  const utils = api.useUtils();
  const [noteContent, setNoteContent] = useState("");
  const [notePage, setNotePage] = useState(0);

  const { data: dmNotes = [], isLoading: notesLoading } =
    api.adventure.getNotes.useQuery({ adventureId, characterId });

  const sendNote = api.adventure.sendNote.useMutation({
    onSuccess: () => {
      setNoteContent("");
      void utils.adventure.getNotes.invalidate({ adventureId, characterId });
    },
  });

  const handleSend = () => {
    const trimmed = noteContent.trim();
    if (!trimmed) return;
    sendNote.mutate({ adventureId, toUserId, characterId, content: trimmed });
  };

  const sectionTitle: React.CSSProperties = {
    color: GOLD,
    fontSize: "12px",
    fontWeight: "bold",
    letterSpacing: "2px",
    textTransform: "uppercase",
    marginBottom: "12px",
    paddingBottom: "8px",
    borderBottom: `1px solid rgba(201,168,76,0.2)`,
    fontFamily: SERIF,
  };

  return (
    <div>
      {/* Player's own notes (read-only) */}
      {playerNotes && (
        <div
          style={{
            background: "rgba(0,0,0,0.5)",
            border: "1px solid rgba(201,168,76,0.3)",
            borderRadius: "12px",
            padding: "20px 24px",
            marginBottom: "16px",
          }}
        >
          <p style={sectionTitle}>Player Notes</p>
          <p
            style={{
              color: GOLD_BRIGHT,
              fontSize: "13px",
              fontFamily: SERIF,
              lineHeight: 1.7,
              whiteSpace: "pre-wrap",
            }}
          >
            {playerNotes}
          </p>
        </div>
      )}

      {/* DM Notes */}
      <div
        style={{
          background: "rgba(0,0,0,0.5)",
          border: "1px solid rgba(201,168,76,0.3)",
          borderRadius: "12px",
          padding: "20px 24px",
        }}
      >
        <p style={sectionTitle}>DM Notes</p>

        {notesLoading ? (
          <p style={{ color: GOLD_MUTED, fontSize: "13px", fontFamily: SERIF }}>
            Loading notes...
          </p>
        ) : (() => {
          const typedNotes = dmNotes as unknown as Array<{
            id: string;
            content: string;
            createdAt: string | Date;
            reaction: string | null;
            fromUser: { username: string };
          }>;
          if (typedNotes.length === 0) {
            return (
              <p
                style={{
                  color: GOLD_MUTED,
                  fontSize: "13px",
                  fontFamily: SERIF,
                  marginBottom: "16px",
                }}
              >
                No DM notes yet.
              </p>
            );
          }
          const NOTES_PER_PAGE = 5;
          const pageNotes = typedNotes.slice(notePage * NOTES_PER_PAGE, (notePage + 1) * NOTES_PER_PAGE);
          const totalPages = Math.ceil(typedNotes.length / NOTES_PER_PAGE);
          return (
            <>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  marginBottom: "16px",
                }}
              >
                {pageNotes.map((note) => (
                  <div
                    key={note.id}
                    style={{
                      background: "rgba(201,168,76,0.05)",
                      border: "1px solid rgba(201,168,76,0.15)",
                      borderRadius: "8px",
                      padding: "12px 16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "6px",
                      }}
                    >
                      <span
                        style={{
                          color: GOLD_MUTED,
                          fontSize: "11px",
                          fontFamily: SERIF,
                        }}
                      >
                        {new Date(note.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {note.reaction && (
                        <span
                          style={{
                            fontSize: "16px",
                            color:
                              note.reaction === "THUMBS_UP" ? GOLD : GOLD_MUTED,
                          }}
                          title={
                            note.reaction === "THUMBS_UP"
                              ? "Player reacted: Thumbs Up"
                              : "Player reacted: Thumbs Down"
                          }
                        >
                          {note.reaction === "THUMBS_UP" ? "\u{1F44D}" : "\u{1F44E}"}
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        color: GOLD_BRIGHT,
                        fontSize: "13px",
                        fontFamily: SERIF,
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                        margin: 0,
                      }}
                    >
                      {note.content}
                    </p>
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "12px",
                    marginBottom: "16px",
                  }}
                >
                  <button
                    onClick={() => setNotePage((p) => Math.max(0, p - 1))}
                    disabled={notePage === 0}
                    style={{
                      background: "none",
                      border: "1px solid rgba(201,168,76,0.3)",
                      color: notePage === 0 ? GOLD_MUTED : GOLD,
                      borderRadius: "4px",
                      padding: "4px 12px",
                      fontFamily: SERIF,
                      fontSize: "11px",
                      cursor: notePage === 0 ? "default" : "pointer",
                      opacity: notePage === 0 ? 0.5 : 1,
                    }}
                  >
                    Prev
                  </button>
                  <span
                    style={{
                      color: GOLD_MUTED,
                      fontSize: "11px",
                      fontFamily: SERIF,
                    }}
                  >
                    {notePage + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setNotePage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={notePage >= totalPages - 1}
                    style={{
                      background: "none",
                      border: "1px solid rgba(201,168,76,0.3)",
                      color: notePage >= totalPages - 1 ? GOLD_MUTED : GOLD,
                      borderRadius: "4px",
                      padding: "4px 12px",
                      fontFamily: SERIF,
                      fontSize: "11px",
                      cursor: notePage >= totalPages - 1 ? "default" : "pointer",
                      opacity: notePage >= totalPages - 1 ? 0.5 : 1,
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          );
        })()}

        {/* Send note input */}
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Write a note to this player..."
            rows={2}
            style={{
              flex: 1,
              padding: "10px 14px",
              background: "rgba(30,15,5,0.9)",
              border: "1px solid rgba(201,168,76,0.3)",
              borderRadius: "6px",
              color: GOLD_BRIGHT,
              fontFamily: SERIF,
              fontSize: "13px",
              outline: "none",
              resize: "vertical",
              boxSizing: "border-box",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                handleSend();
              }
            }}
          />
          <button
            onClick={handleSend}
            disabled={!noteContent.trim() || sendNote.isPending}
            style={{
              background: "linear-gradient(135deg, #8b6914, #c9a84c)",
              color: "#1a1a2e",
              border: "none",
              borderRadius: "6px",
              padding: "10px 20px",
              fontSize: "12px",
              fontFamily: SERIF,
              fontWeight: "bold",
              cursor:
                !noteContent.trim() || sendNote.isPending
                  ? "default"
                  : "pointer",
              opacity: !noteContent.trim() || sendNote.isPending ? 0.6 : 1,
              whiteSpace: "nowrap",
            }}
          >
            {sendNote.isPending ? "Sending..." : "Send Note"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Character Sheet Modal (read-only, opened from Players Tab)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// DM Inventory Panel (used inside character sheet modal Inventory tab)
// ---------------------------------------------------------------------------

function DmInventoryPanel({
  adventureId,
  adventurePlayerId,
  adventureItems,
  characterClass,
  classSource,
  background,
}: {
  adventureId: string;
  adventurePlayerId: string;
  adventureItems: { id: string; name: string; source: string }[];
  characterClass: string;
  classSource: string;
  background: string;
}) {
  const utils = api.useUtils();
  const [searchText, setSearchText] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddFromAdventureModal, setShowAddFromAdventureModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showStartingModal, setShowStartingModal] = useState(false);
  const [addItemSearch, setAddItemSearch] = useState("");
  const [editingQtyId, setEditingQtyId] = useState<string | null>(null);
  const [editingQtyValue, setEditingQtyValue] = useState("");
  const [adventureCustomDescs, setAdventureCustomDescs] = useState<Record<string, string>>({});
  const [attachedItems, setAttachedItems] = useState<Record<string, { name: string; source: string } | null>>({});
  const [attachSearch, setAttachSearch] = useState<Record<string, string>>({});

  const { data: inventoryItems = [], isLoading } =
    api.adventure.getInventory.useQuery(
      { adventureId, adventurePlayerId },
      { enabled: !!adventurePlayerId },
    );

  const addInventoryItem = api.adventure.addInventoryItem.useMutation({
    onSuccess: () => {
      void utils.adventure.getInventory.invalidate({ adventureId, adventurePlayerId });
      setShowAddFromAdventureModal(false);
      setShowAddItemModal(false);
      setAddItemSearch("");
      setAdventureCustomDescs({});
      setAttachedItems({});
      setAttachSearch({});
    },
  });

  const removeInventoryItem = api.adventure.removeInventoryItem.useMutation({
    onSuccess: () => {
      void utils.adventure.getInventory.invalidate({ adventureId, adventurePlayerId });
    },
  });

  const updateInventoryItem = api.adventure.updateInventoryItem.useMutation({
    onSuccess: () => {
      void utils.adventure.getInventory.invalidate({ adventureId, adventurePlayerId });
      setEditingQtyId(null);
    },
  });

  type InventoryItem = {
    id: string;
    adventurePlayerId: string;
    itemName: string;
    itemSource: string;
    quantity: number;
    isStartingItem: boolean;
    customDescription: string | null;
    addedByUserId: string;
    createdAt: string | Date;
    addedByUser: { id: string; username: string };
  };

  const typedItems = inventoryItems as unknown as InventoryItem[];
  const hasStartingItems = typedItems.some((item) => item.isStartingItem);

  const filteredItems = useMemo(() => {
    if (!searchText.trim()) return typedItems;
    const lower = searchText.toLowerCase();
    return typedItems.filter((item) =>
      item.itemName.toLowerCase().includes(lower),
    );
  }, [typedItems, searchText]);

  const addItemFilteredResults = useMemo(() => {
    if (addItemSearch.length < 2) return [];
    const lower = addItemSearch.toLowerCase();
    const results: Item[] = [];
    for (const item of ITEMS) {
      if (item.name.toLowerCase().includes(lower)) {
        results.push(item);
        if (results.length >= 50) break;
      }
    }
    return results;
  }, [addItemSearch]);

  if (isLoading) {
    return (
      <p style={{ color: GOLD_MUTED, fontSize: "13px", fontFamily: SERIF }}>
        Loading inventory...
      </p>
    );
  }

  return (
    <div>
      {/* Action buttons */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => {
            setShowAddFromAdventureModal(true);
            setAdventureCustomDescs({});
            setAttachedItems({});
            setAttachSearch({});
          }}
          style={{
            background: "linear-gradient(135deg, #8b6914, #c9a84c)",
            color: "#1a1a2e",
            border: "none",
            borderRadius: "6px",
            padding: "8px 16px",
            fontSize: "12px",
            fontFamily: "'Georgia', serif",
            fontWeight: "bold",
            cursor: "pointer",
            letterSpacing: "0.5px",
          }}
        >
          Add from Adventure
        </button>
        <button
          onClick={() => {
            setAddItemSearch("");
            setShowAddItemModal(true);
          }}
          style={{
            background: "linear-gradient(135deg, #8b6914, #c9a84c)",
            color: "#1a1a2e",
            border: "none",
            borderRadius: "6px",
            padding: "8px 16px",
            fontSize: "12px",
            fontFamily: "'Georgia', serif",
            fontWeight: "bold",
            cursor: "pointer",
            letterSpacing: "0.5px",
          }}
        >
          Add Item
        </button>
        {!hasStartingItems && (
          <button
            onClick={() => setShowStartingModal(true)}
            style={{
              background: "none",
              border: "1px solid rgba(201,168,76,0.4)",
              color: GOLD,
              borderRadius: "6px",
              padding: "8px 16px",
              fontSize: "12px",
              fontFamily: "'Georgia', serif",
              fontWeight: "bold",
              cursor: "pointer",
              letterSpacing: "0.5px",
            }}
          >
            Add Starting Items
          </button>
        )}
      </div>

      {/* Search */}
      {typedItems.length > 0 && (
        <input
          type="text"
          placeholder="Search inventory..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            background: "rgba(30,15,5,0.9)",
            border: "1px solid rgba(201,168,76,0.4)",
            color: GOLD_BRIGHT,
            fontFamily: "'Georgia', serif",
            borderRadius: "6px",
            padding: "8px 12px",
            width: "100%",
            fontSize: "13px",
            boxSizing: "border-box",
            outline: "none",
            marginBottom: "12px",
          }}
        />
      )}

      {/* Inventory list */}
      {typedItems.length === 0 ? (
        <p
          style={{
            color: GOLD_MUTED,
            fontSize: "13px",
            fontFamily: SERIF,
            fontStyle: "italic",
            textAlign: "center",
            padding: "20px",
          }}
        >
          No items in inventory yet.
        </p>
      ) : filteredItems.length === 0 ? (
        <p
          style={{
            color: GOLD_MUTED,
            fontSize: "13px",
            fontFamily: SERIF,
            textAlign: "center",
            padding: "20px",
          }}
        >
          No items match your search.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {filteredItems.map((item) => {
            const isExpanded = expandedId === item.id;
            const itemData = ITEMS.find(
              (it) =>
                it.name.toLowerCase() === item.itemName.toLowerCase() &&
                it.source.toLowerCase() === item.itemSource.toLowerCase(),
            ) ?? ITEMS.find(
              (it) => it.name.toLowerCase() === item.itemName.toLowerCase(),
            );
            const isEditingQty = editingQtyId === item.id;

            return (
              <div
                key={item.id}
                style={{
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid rgba(201,168,76,0.2)",
                  borderRadius: "8px",
                  padding: "10px 14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      flex: 1,
                      cursor: "pointer",
                      flexWrap: "wrap",
                    }}
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  >
                    <span
                      style={{
                        color: GOLD_BRIGHT,
                        fontSize: "13px",
                        fontFamily: "'Georgia', serif",
                      }}
                    >
                      {isExpanded ? "\u25BC" : "\u25B6"} {item.itemName}
                    </span>
                    {/* Editable quantity */}
                    {isEditingQty ? (
                      <input
                        type="number"
                        min={0}
                        value={editingQtyValue}
                        onChange={(e) => setEditingQtyValue(e.target.value)}
                        onBlur={() => {
                          const val = parseInt(editingQtyValue, 10);
                          if (!isNaN(val) && val >= 0) {
                            updateInventoryItem.mutate({
                              inventoryItemId: item.id,
                              quantity: val,
                            });
                          } else {
                            setEditingQtyId(null);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            (e.target as HTMLInputElement).blur();
                          }
                          if (e.key === "Escape") setEditingQtyId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        style={{
                          width: "50px",
                          padding: "2px 6px",
                          background: "rgba(30,15,5,0.9)",
                          border: "1px solid rgba(201,168,76,0.5)",
                          borderRadius: "4px",
                          color: GOLD_BRIGHT,
                          fontSize: "12px",
                          fontFamily: SERIF,
                          textAlign: "center",
                          outline: "none",
                        }}
                      />
                    ) : (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingQtyId(item.id);
                          setEditingQtyValue(String(item.quantity));
                        }}
                        style={{
                          color: GOLD,
                          fontSize: "11px",
                          fontFamily: "'Georgia', serif",
                          background: "rgba(201,168,76,0.15)",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontWeight: "bold",
                          cursor: "pointer",
                        }}
                        title="Click to edit quantity"
                      >
                        x{item.quantity}
                      </span>
                    )}
                    <SourceBadge source={item.itemSource} />
                    {item.isStartingItem && (
                      <span
                        style={{
                          color: "#4a8c3f",
                          fontSize: "9px",
                          fontFamily: "'Georgia', serif",
                          background: "rgba(74,140,63,0.15)",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          letterSpacing: "0.5px",
                          textTransform: "uppercase",
                        }}
                      >
                        Starting
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeInventoryItem.mutate({ inventoryItemId: item.id });
                    }}
                    disabled={removeInventoryItem.isPending}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#e74c3c",
                      fontSize: "14px",
                      cursor: removeInventoryItem.isPending ? "default" : "pointer",
                      padding: "4px 6px",
                      fontFamily: "'Georgia', serif",
                      opacity: removeInventoryItem.isPending ? 0.5 : 1,
                    }}
                    title="Remove item"
                  >
                    x
                  </button>
                </div>

                {isExpanded && (
                  <div
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(201,168,76,0.15)",
                      borderRadius: "8px",
                      padding: "12px 16px",
                      marginTop: "8px",
                    }}
                  >
                    <InventoryItemDescription
                      itemData={itemData}
                      customDescription={item.customDescription}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add from Adventure Modal */}
      {showAddFromAdventureModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1002,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowAddFromAdventureModal(false)}
        >
          <div
            style={{
              background: "rgba(15,8,3,0.95)",
              border: "2px solid #c9a84c",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "500px",
              width: "90%",
              maxHeight: "70vh",
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
              <h3
                style={{
                  color: GOLD,
                  fontSize: "16px",
                  fontWeight: "bold",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  fontFamily: SERIF,
                }}
              >
                Add from Adventure Items
              </h3>
              <button
                onClick={() => setShowAddFromAdventureModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: GOLD_MUTED,
                  fontSize: "20px",
                  cursor: "pointer",
                  padding: "0 4px",
                }}
              >
                x
              </button>
            </div>

            {addInventoryItem.isPending && (
              <p style={{ color: GOLD_MUTED, fontSize: "13px", fontFamily: SERIF, textAlign: "center", padding: "8px" }}>
                Adding...
              </p>
            )}

            <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
              {adventureItems.length === 0 ? (
                <p style={{ color: GOLD_MUTED, fontSize: "13px", fontFamily: SERIF, textAlign: "center", padding: "20px" }}>
                  No items in the adventure yet.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {adventureItems.map((advItem) => {
                    const officialItem = ITEMS.find(
                      (it) =>
                        it.name.toLowerCase() === advItem.name.toLowerCase() &&
                        it.source.toLowerCase() === advItem.source.toLowerCase(),
                    ) ?? ITEMS.find(
                      (it) => it.name.toLowerCase() === advItem.name.toLowerCase(),
                    );
                    const isNonOfficial = !officialItem;

                    return (
                      <div
                        key={advItem.id}
                        style={{
                          padding: "8px 12px",
                          borderBottom: "1px solid rgba(201,168,76,0.1)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <span
                            style={{
                              color: GOLD_BRIGHT,
                              fontSize: "13px",
                              fontFamily: SERIF,
                              flex: 1,
                            }}
                          >
                            {advItem.name}
                          </span>
                          <SourceBadge source={advItem.source} />
                          <button
                            onClick={() => {
                              let desc = (adventureCustomDescs[advItem.id] ?? "").trim();
                              const attached = attachedItems[advItem.id];
                              if (attached) {
                                desc = `[ATTACHED:${attached.name}|${attached.source}]${desc ? "\n" + desc : ""}`;
                              }
                              addInventoryItem.mutate({
                                adventurePlayerId,
                                itemName: advItem.name,
                                itemSource: advItem.source,
                                customDescription: isNonOfficial && desc
                                  ? desc
                                  : undefined,
                              });
                            }}
                            disabled={addInventoryItem.isPending}
                            style={{
                              background: "linear-gradient(135deg, #8b6914, #c9a84c)",
                              color: "#1a1a2e",
                              border: "none",
                              borderRadius: "4px",
                              padding: "4px 12px",
                              fontSize: "11px",
                              fontFamily: SERIF,
                              fontWeight: "bold",
                              cursor: addInventoryItem.isPending ? "default" : "pointer",
                              opacity: addInventoryItem.isPending ? 0.6 : 1,
                            }}
                          >
                            Add
                          </button>
                        </div>
                        {isNonOfficial && (
                          <>
                            <textarea
                              placeholder="Custom description (not found in official data)..."
                              value={adventureCustomDescs[advItem.id] ?? ""}
                              onChange={(e) => setAdventureCustomDescs(prev => ({ ...prev, [advItem.id]: e.target.value }))}
                              rows={2}
                              style={{
                                width: "100%",
                                marginTop: "6px",
                                padding: "6px 10px",
                                background: "rgba(30,15,5,0.9)",
                                border: "1px solid rgba(201,168,76,0.3)",
                                borderRadius: "4px",
                                color: GOLD_BRIGHT,
                                fontFamily: SERIF,
                                fontSize: "12px",
                                outline: "none",
                                resize: "vertical",
                                boxSizing: "border-box",
                              }}
                            />
                            {/* Attach official item */}
                            <div style={{ marginTop: "6px" }}>
                              {attachedItems[advItem.id] ? (
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <span style={{ color: GOLD_MUTED, fontSize: "11px", fontFamily: SERIF }}>
                                    Attached: {attachedItems[advItem.id]!.name}
                                  </span>
                                  <SourceBadge source={attachedItems[advItem.id]!.source} />
                                  <button
                                    onClick={() => setAttachedItems(prev => ({ ...prev, [advItem.id]: null }))}
                                    style={{ background: "none", border: "none", color: "#e74c3c", cursor: "pointer", fontSize: "12px", padding: "0 4px" }}
                                  >
                                    x
                                  </button>
                                </div>
                              ) : (
                                <div style={{ position: "relative" }}>
                                  <input
                                    type="text"
                                    placeholder="Attach official item..."
                                    value={attachSearch[advItem.id] ?? ""}
                                    onChange={(e) => setAttachSearch(prev => ({ ...prev, [advItem.id]: e.target.value }))}
                                    style={{
                                      width: "100%",
                                      padding: "4px 8px",
                                      background: "rgba(30,15,5,0.9)",
                                      border: "1px solid rgba(201,168,76,0.2)",
                                      borderRadius: "4px",
                                      color: GOLD_BRIGHT,
                                      fontFamily: SERIF,
                                      fontSize: "11px",
                                      outline: "none",
                                      boxSizing: "border-box",
                                    }}
                                  />
                                  {(attachSearch[advItem.id] ?? "").length >= 2 && (
                                    <div style={{
                                      position: "absolute",
                                      top: "100%",
                                      left: 0,
                                      right: 0,
                                      maxHeight: "150px",
                                      overflowY: "auto",
                                      background: "rgba(20,10,5,0.98)",
                                      border: "1px solid rgba(201,168,76,0.3)",
                                      borderRadius: "4px",
                                      zIndex: 10,
                                    }}>
                                      {ITEMS.filter(it => it.name.toLowerCase().includes((attachSearch[advItem.id] ?? "").toLowerCase())).slice(0, 10).map((it, idx) => (
                                        <button
                                          key={`${it.name}-${it.source}-${idx}`}
                                          onClick={() => {
                                            setAttachedItems(prev => ({ ...prev, [advItem.id]: { name: it.name, source: it.source } }));
                                            setAttachSearch(prev => ({ ...prev, [advItem.id]: "" }));
                                          }}
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                            width: "100%",
                                            textAlign: "left",
                                            padding: "4px 8px",
                                            background: "transparent",
                                            border: "none",
                                            borderBottom: "1px solid rgba(201,168,76,0.1)",
                                            cursor: "pointer",
                                            color: GOLD_BRIGHT,
                                            fontFamily: SERIF,
                                            fontSize: "11px",
                                          }}
                                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(201,168,76,0.1)"; }}
                                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                                        >
                                          {it.name} <SourceBadge source={it.source} />
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Item (from all ITEMS) Modal */}
      <SearchModal
        title="Add Item to Inventory"
        open={showAddItemModal}
        onClose={() => setShowAddItemModal(false)}
        searchText={addItemSearch}
        onSearchChange={setAddItemSearch}
        isPending={addInventoryItem.isPending}
      >
        {addItemSearch.length < 2 ? (
          <p style={{ color: GOLD_MUTED, fontSize: "13px", fontFamily: "'Georgia', serif", textAlign: "center", padding: "20px" }}>
            Type at least 2 characters to search.
          </p>
        ) : addItemFilteredResults.length === 0 ? (
          <p style={{ color: GOLD_MUTED, fontSize: "13px", fontFamily: "'Georgia', serif", textAlign: "center", padding: "20px" }}>
            No items found.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {addItemFilteredResults.map((item, i) => (
              <button
                key={`${item.name}-${item.source}-${i}`}
                onClick={() =>
                  addInventoryItem.mutate({
                    adventurePlayerId,
                    itemName: item.name,
                    itemSource: item.source,
                  })
                }
                disabled={addInventoryItem.isPending}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px solid rgba(201,168,76,0.1)",
                  cursor: addInventoryItem.isPending ? "default" : "pointer",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(201,168,76,0.1)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "transparent";
                }}
              >
                <span style={{ color: GOLD_BRIGHT, fontSize: "13px", fontFamily: "'Georgia', serif", flex: 1 }}>
                  {item.name}
                </span>
                <span style={{ color: GOLD_MUTED, fontSize: "11px", fontFamily: "'Georgia', serif", minWidth: "70px" }}>
                  {item.type}
                </span>
                <RarityBadge rarity={item.rarity} />
                <SourceBadge source={item.source} />
              </button>
            ))}
          </div>
        )}
      </SearchModal>

      {/* Starting Items Modal */}
      <StartingItemsModal
        open={showStartingModal}
        onClose={() => setShowStartingModal(false)}
        characterClass={characterClass}
        classSource={classSource}
        background={background}
        adventurePlayerId={adventurePlayerId}
        adventureId={adventureId}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Character Sheet Modal (with tabs: Sheet, Notes, Inventory)
// ---------------------------------------------------------------------------

type CharSheetTab = "sheet" | "notes" | "inventory";

function CharacterSheetModal({
  character,
  username,
  adventureId,
  toUserId,
  adventurePlayerId,
  adventureItems,
  playerNote,
  onClose,
}: {
  character: Record<string, unknown>;
  username: string;
  adventureId: string;
  toUserId: string;
  adventurePlayerId: string;
  adventureItems: { id: string; name: string; source: string }[];
  playerNote?: string;
  onClose: () => void;
}) {
  const [charSheetTab, setCharSheetTab] = useState<CharSheetTab>("sheet");

  const name = character.name as string | undefined;
  const race = character.race as string | undefined;
  const charClass = character.characterClass as string | undefined;
  const level = (character.level as number | undefined) ?? 1;
  const subclass = character.subclass as string | undefined;
  const alignment = character.alignment as string | undefined;
  const backstory = character.backstory as string | undefined;
  const background = character.background as string | undefined;
  const notes = character.notes as string | undefined;
  const characterId = character.id as string;
  const classSource = (character.rulesSource as string) ?? "PHB";

  const str = (character.strength as number | undefined) ?? 10;
  const dex = (character.dexterity as number | undefined) ?? 10;
  const con = (character.constitution as number | undefined) ?? 10;
  const int = (character.intelligence as number | undefined) ?? 10;
  const wis = (character.wisdom as number | undefined) ?? 10;
  const cha = (character.charisma as number | undefined) ?? 10;
  const maxHp = (character.maxHp as number | undefined) ?? 0;
  const currentHp = (character.currentHp as number | undefined) ?? 0;
  const tempHp = (character.tempHp as number | undefined) ?? 0;
  const ac = (character.armorClass as number | undefined) ?? 10;
  const speed = (character.speed as number | undefined) ?? 30;

  const abilityScores: Record<string, number> = {
    strength: str,
    dexterity: dex,
    constitution: con,
    intelligence: int,
    wisdom: wis,
    charisma: cha,
  };

  const prof = Math.ceil(level / 4) + 1;
  const initiative = abilityModifier(dex);
  const initiativeStr = initiative >= 0 ? `+${initiative}` : `${initiative}`;

  const savingProfs = SAVING_THROW_PROFICIENCIES[charClass ?? ""] ?? [];
  const proficientSkills = parseJsonArray(character.skillProficiencies);
  const expertiseSkills = parseJsonArray(character.skillExpertise);
  const activeConditions = parseJsonArray(character.activeConditions);
  const feats = parseJsonArray(character.feats);

  const sectionTitle: React.CSSProperties = {
    color: GOLD,
    fontSize: "12px",
    fontWeight: "bold",
    letterSpacing: "2px",
    textTransform: "uppercase",
    marginBottom: "12px",
    paddingBottom: "8px",
    borderBottom: "1px solid rgba(201,168,76,0.2)",
    fontFamily: SERIF,
  };

  const charSheetTabs: Array<{ key: CharSheetTab; label: string }> = [
    { key: "sheet", label: "Character Sheet" },
    { key: "notes", label: "Notes" },
    { key: "inventory", label: "Inventory" },
  ];

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        zIndex: 1000,
        overflowY: "auto",
        padding: "40px 20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "linear-gradient(180deg, rgba(20,12,5,0.98) 0%, rgba(10,6,2,0.98) 100%)",
          border: "2px solid rgba(201,168,76,0.5)",
          borderRadius: "16px",
          padding: "32px",
          maxWidth: "800px",
          width: "100%",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "1px solid rgba(201,168,76,0.3)",
            color: GOLD_MUTED,
            borderRadius: "4px",
            padding: "4px 12px",
            fontFamily: SERIF,
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          Close
        </button>

        {/* Header */}
        <div style={{ marginBottom: "16px" }}>
          <p
            style={{
              color: GOLD_MUTED,
              fontSize: "11px",
              fontFamily: SERIF,
              letterSpacing: "1px",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}
          >
            {username}&apos;s Character
          </p>
          <h2
            style={{
              color: GOLD,
              fontSize: "24px",
              fontWeight: "bold",
              fontFamily: SERIF,
              letterSpacing: "1px",
              marginBottom: "4px",
            }}
          >
            {name ?? "Unknown"}
          </h2>
          <p
            style={{
              color: GOLD_BRIGHT,
              fontSize: "14px",
              fontFamily: SERIF,
              lineHeight: 1.6,
            }}
          >
            Level {level} {race ?? ""} {charClass ?? ""}
            {subclass ? ` (${subclass})` : ""}
            {alignment ? ` \u2014 ${alignment}` : ""}
            {background ? ` \u2014 ${background}` : ""}
          </p>
        </div>

        {/* Tab bar */}
        <div
          style={{
            display: "flex",
            gap: "0",
            borderBottom: "1px solid rgba(201,168,76,0.3)",
            marginBottom: "24px",
          }}
        >
          {charSheetTabs.map((tab) => {
            const isActive = charSheetTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setCharSheetTab(tab.key)}
                style={{
                  padding: "10px 20px",
                  background: isActive ? "rgba(201,168,76,0.15)" : "transparent",
                  border: "none",
                  borderBottom: isActive
                    ? "2px solid #c9a84c"
                    : "2px solid transparent",
                  color: isActive ? GOLD : GOLD_MUTED,
                  fontSize: "12px",
                  fontFamily: SERIF,
                  fontWeight: "bold",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Character Sheet tab */}
        {charSheetTab === "sheet" && (
          <>
            {/* Ability Scores */}
            <div
              style={{
                background: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(201,168,76,0.3)",
                borderRadius: "12px",
                padding: "20px 24px",
                marginBottom: "16px",
              }}
            >
              <p style={sectionTitle}>Ability Scores</p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(6, 1fr)",
                  gap: "12px",
                }}
              >
                {ABILITY_NAMES_SHORT.map(({ key, label }) => (
                  <div
                    key={key}
                    style={{
                      textAlign: "center",
                      background: "rgba(201,168,76,0.05)",
                      border: "1px solid rgba(201,168,76,0.2)",
                      borderRadius: "8px",
                      padding: "12px 8px",
                    }}
                  >
                    <div
                      style={{
                        color: "#b8934a",
                        fontSize: "10px",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        fontFamily: SERIF,
                        marginBottom: "6px",
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        color: GOLD_BRIGHT,
                        fontSize: "22px",
                        fontWeight: "bold",
                        fontFamily: SERIF,
                        lineHeight: 1,
                      }}
                    >
                      {abilityScores[key]}
                    </div>
                    <div
                      style={{
                        color: GOLD_MUTED,
                        fontSize: "13px",
                        fontFamily: SERIF,
                        marginTop: "4px",
                      }}
                    >
                      {modString(abilityScores[key]!)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Combat Stats */}
            <div
              style={{
                background: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(201,168,76,0.3)",
                borderRadius: "12px",
                padding: "20px 24px",
                marginBottom: "16px",
              }}
            >
              <p style={sectionTitle}>Combat</p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "16px",
                  fontSize: "13px",
                  fontFamily: SERIF,
                }}
              >
                <div>
                  <div style={{ color: GOLD_MUTED, fontSize: "10px", letterSpacing: "1px", marginBottom: "4px" }}>HP</div>
                  <div style={{ color: GOLD_BRIGHT, fontSize: "18px", fontWeight: "bold" }}>
                    {currentHp}/{maxHp}
                    {tempHp > 0 && (
                      <span style={{ color: GOLD_MUTED, fontSize: "13px", fontWeight: "normal" }}>
                        {" "}(+{tempHp} temp)
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div style={{ color: GOLD_MUTED, fontSize: "10px", letterSpacing: "1px", marginBottom: "4px" }}>AC</div>
                  <div style={{ color: GOLD_BRIGHT, fontSize: "18px", fontWeight: "bold" }}>{ac}</div>
                </div>
                <div>
                  <div style={{ color: GOLD_MUTED, fontSize: "10px", letterSpacing: "1px", marginBottom: "4px" }}>SPEED</div>
                  <div style={{ color: GOLD_BRIGHT, fontSize: "18px", fontWeight: "bold" }}>{speed} ft.</div>
                </div>
                <div>
                  <div style={{ color: GOLD_MUTED, fontSize: "10px", letterSpacing: "1px", marginBottom: "4px" }}>INITIATIVE</div>
                  <div style={{ color: GOLD_BRIGHT, fontSize: "18px", fontWeight: "bold" }}>{initiativeStr}</div>
                </div>
                <div>
                  <div style={{ color: GOLD_MUTED, fontSize: "10px", letterSpacing: "1px", marginBottom: "4px" }}>PROFICIENCY</div>
                  <div style={{ color: GOLD_BRIGHT, fontSize: "18px", fontWeight: "bold" }}>+{prof}</div>
                </div>
              </div>
            </div>

            {/* Saving Throws & Skills side by side */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                marginBottom: "16px",
              }}
            >
              {/* Saving Throws */}
              <div
                style={{
                  background: "rgba(0,0,0,0.5)",
                  border: "1px solid rgba(201,168,76,0.3)",
                  borderRadius: "12px",
                  padding: "20px 24px",
                }}
              >
                <p style={sectionTitle}>Saving Throws</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {ABILITY_NAMES_SHORT.map(({ key, label }) => {
                    const isProficient = savingProfs.includes(key);
                    const total =
                      abilityModifier(abilityScores[key]!) + (isProficient ? prof : 0);
                    const totalStr = total >= 0 ? `+${total}` : `${total}`;
                    return (
                      <div
                        key={key}
                        style={{ display: "flex", alignItems: "center", gap: "10px" }}
                      >
                        <span style={{ color: isProficient ? GOLD : GOLD_MUTED, fontSize: "12px" }}>
                          {isProficient ? "\u25CF" : "\u25CB"}
                        </span>
                        <span
                          style={{
                            color: GOLD_BRIGHT,
                            fontSize: "13px",
                            fontFamily: SERIF,
                            flex: 1,
                          }}
                        >
                          {label}
                        </span>
                        <span
                          style={{
                            color: GOLD_BRIGHT,
                            fontSize: "13px",
                            fontFamily: SERIF,
                            fontWeight: isProficient ? "bold" : "normal",
                          }}
                        >
                          {totalStr}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Skills */}
              <div
                style={{
                  background: "rgba(0,0,0,0.5)",
                  border: "1px solid rgba(201,168,76,0.3)",
                  borderRadius: "12px",
                  padding: "20px 24px",
                  maxHeight: "400px",
                  overflowY: "auto",
                }}
              >
                <p style={sectionTitle}>Skills</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                  {SKILLS_LIST.map(({ name: skillName, ability }) => {
                    const score = abilityScores[ability] ?? 10;
                    const baseMod = abilityModifier(score);
                    const hasExpertise = expertiseSkills.includes(skillName);
                    const isProficient = proficientSkills.includes(skillName);
                    const total = hasExpertise
                      ? baseMod + prof * 2
                      : isProficient
                        ? baseMod + prof
                        : baseMod;
                    const skillStr = total >= 0 ? `+${total}` : `${total}`;
                    const indicator = hasExpertise ? "\u2605" : isProficient ? "\u25CF" : "\u25CB";
                    const indicatorColor = hasExpertise || isProficient ? GOLD : GOLD_MUTED;
                    const isHighlighted = hasExpertise || isProficient;
                    const abilityLabel = ABILITY_NAMES_SHORT.find((a) => a.key === ability)?.label ?? "";
                    return (
                      <div
                        key={skillName}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "2px 4px",
                        }}
                      >
                        <span style={{ color: indicatorColor, fontSize: "12px" }}>{indicator}</span>
                        <span
                          style={{
                            color: GOLD_BRIGHT,
                            fontSize: "13px",
                            fontFamily: SERIF,
                            flex: 1,
                            fontWeight: isHighlighted ? "bold" : "normal",
                          }}
                        >
                          {skillName}
                        </span>
                        <span style={{ color: GOLD_MUTED, fontSize: "11px", fontFamily: SERIF }}>
                          ({abilityLabel})
                        </span>
                        <span
                          style={{
                            color: isHighlighted ? GOLD : GOLD_BRIGHT,
                            fontSize: "13px",
                            fontFamily: SERIF,
                            fontWeight: isHighlighted ? "bold" : "normal",
                          }}
                        >
                          {skillStr}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Active Conditions */}
            {activeConditions.length > 0 && (
              <div
                style={{
                  background: "rgba(0,0,0,0.5)",
                  border: "1px solid rgba(201,168,76,0.3)",
                  borderRadius: "12px",
                  padding: "20px 24px",
                  marginBottom: "16px",
                }}
              >
                <p style={sectionTitle}>Active Conditions</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {activeConditions.map((cond) => (
                    <span
                      key={cond}
                      style={{
                        background: "rgba(231,76,60,0.15)",
                        border: "1px solid rgba(201,168,76,0.4)",
                        borderRadius: "20px",
                        padding: "4px 14px",
                        fontSize: "12px",
                        fontFamily: SERIF,
                        color: "#e74c3c",
                        fontWeight: "bold",
                      }}
                    >
                      {cond}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Feats */}
            {feats.length > 0 && (
              <div
                style={{
                  background: "rgba(0,0,0,0.5)",
                  border: "1px solid rgba(201,168,76,0.3)",
                  borderRadius: "12px",
                  padding: "20px 24px",
                  marginBottom: "16px",
                }}
              >
                <p style={sectionTitle}>Feats</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {feats.map((feat) => (
                    <span
                      key={feat}
                      style={{
                        background: "rgba(201,168,76,0.1)",
                        border: "1px solid rgba(201,168,76,0.3)",
                        borderRadius: "20px",
                        padding: "4px 14px",
                        fontSize: "12px",
                        fontFamily: SERIF,
                        color: GOLD_BRIGHT,
                      }}
                    >
                      {feat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Backstory */}
            {backstory && (
              <div
                style={{
                  background: "rgba(0,0,0,0.5)",
                  border: "1px solid rgba(201,168,76,0.3)",
                  borderRadius: "12px",
                  padding: "20px 24px",
                  marginBottom: "16px",
                }}
              >
                <p style={sectionTitle}>Backstory</p>
                <p
                  style={{
                    color: GOLD_BRIGHT,
                    fontSize: "14px",
                    fontFamily: SERIF,
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {backstory}
                </p>
              </div>
            )}
          </>
        )}

        {/* Notes tab */}
        {charSheetTab === "notes" && (
          <>
            {/* Player's Note to DM (read-only) */}
            <div
              style={{
                background: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(101,168,126,0.3)",
                borderLeft: "3px solid rgba(101,168,126,0.6)",
                borderRadius: "12px",
                padding: "20px 24px",
                marginBottom: "16px",
              }}
            >
              <p
                style={{
                  color: GOLD,
                  fontSize: "12px",
                  fontWeight: "bold",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  marginBottom: "12px",
                  paddingBottom: "8px",
                  borderBottom: "1px solid rgba(201,168,76,0.2)",
                  fontFamily: SERIF,
                }}
              >
                Player&apos;s Note
              </p>
              {playerNote ? (
                <p
                  style={{
                    color: GOLD_BRIGHT,
                    fontSize: "13px",
                    fontFamily: SERIF,
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                    margin: 0,
                  }}
                >
                  {playerNote}
                </p>
              ) : (
                <p
                  style={{
                    color: GOLD_MUTED,
                    fontSize: "13px",
                    fontFamily: SERIF,
                    fontStyle: "italic",
                    margin: 0,
                  }}
                >
                  No note from player.
                </p>
              )}
            </div>
          <DmNotesSection
            adventureId={adventureId}
            characterId={characterId}
            toUserId={toUserId}
            playerNotes={null}
          />
          </>
        )}

        {/* Inventory tab */}
        {charSheetTab === "inventory" && (
          <DmInventoryPanel
            adventureId={adventureId}
            adventurePlayerId={adventurePlayerId}
            adventureItems={adventureItems}
            characterClass={charClass ?? ""}
            classSource={classSource}
            background={background ?? ""}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Players Tab (DM only)
// ---------------------------------------------------------------------------

function PlayersTab({ adventureId, adventureItems, unreadReactionByCharacter }: { adventureId: string; adventureItems: { id: string; name: string; source: string }[]; unreadReactionByCharacter?: Record<string, number> }) {
  const utils = api.useUtils();
  const [expandedPendingId, setExpandedPendingId] = useState<string | null>(null);
  const [sheetModalPlayer, setSheetModalPlayer] = useState<{
    character: Record<string, unknown>;
    username: string;
    userId: string;
    adventurePlayerId: string;
    playerNote?: string;
  } | null>(null);

  const { data: pendingPlayers = [], isLoading: pendingLoading } =
    api.adventure.getPendingPlayers.useQuery({ adventureId });
  const { data: acceptedPlayers = [], isLoading: acceptedLoading } =
    api.adventure.getAcceptedPlayers.useQuery({ adventureId });

  const resolvePlayer = api.adventure.resolvePlayer.useMutation({
    onSuccess: () => {
      void utils.adventure.getPendingPlayers.invalidate({ adventureId });
      void utils.adventure.getAcceptedPlayers.invalidate({ adventureId });
      void utils.adventure.getById.invalidate({ id: adventureId });
    },
  });

  const renderCharacterSummary = (character: Record<string, unknown> | null | undefined) => {
    if (!character) return null;
    const name = character.name as string | undefined;
    const race = character.race as string | undefined;
    const charClass = character.characterClass as string | undefined;
    const level = character.level as number | undefined;
    return (
      <p
        style={{
          color: GOLD_MUTED,
          fontSize: "12px",
          fontFamily: SERIF,
          marginTop: "2px",
        }}
      >
        {name ?? "Unknown"} — Level {level ?? "?"} {race ?? ""} {charClass ?? ""}
      </p>
    );
  };

  const renderCharacterOverview = (character: Record<string, unknown> | null | undefined) => {
    if (!character) return null;
    const strVal = character.strength as number | undefined;
    const dexVal = character.dexterity as number | undefined;
    const conVal = character.constitution as number | undefined;
    const intVal = character.intelligence as number | undefined;
    const wisVal = character.wisdom as number | undefined;
    const chaVal = character.charisma as number | undefined;
    const maxHpVal = character.maxHp as number | undefined;
    const acVal = character.armorClass as number | undefined;
    const speedVal = character.speed as number | undefined;
    const alignmentVal = character.alignment as string | undefined;

    const scores = [
      { label: "STR", value: strVal },
      { label: "DEX", value: dexVal },
      { label: "CON", value: conVal },
      { label: "INT", value: intVal },
      { label: "WIS", value: wisVal },
      { label: "CHA", value: chaVal },
    ];

    return (
      <div
        style={{
          background: "rgba(0,0,0,0.3)",
          border: "1px solid rgba(201,168,76,0.15)",
          borderRadius: "8px",
          padding: "16px 20px",
          marginTop: "10px",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px", marginBottom: "12px" }}>
          {scores.map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div style={{ color: GOLD_MUTED, fontSize: "10px", letterSpacing: "1px", marginBottom: "2px" }}>{stat.label}</div>
              <div style={{ color: GOLD_BRIGHT, fontSize: "16px", fontWeight: "bold" }}>{stat.value ?? "\u2014"}</div>
            </div>
          ))}
        </div>
        <div style={{ height: "1px", background: "rgba(201,168,76,0.2)", margin: "8px 0" }} />
        <div style={{ display: "flex", gap: "24px", marginBottom: "8px", fontSize: "13px", fontFamily: SERIF }}>
          <div>
            <span style={{ color: GOLD, fontWeight: "bold" }}>HP </span>
            <span style={{ color: GOLD_BRIGHT }}>{maxHpVal ?? "\u2014"}</span>
          </div>
          <div>
            <span style={{ color: GOLD, fontWeight: "bold" }}>AC </span>
            <span style={{ color: GOLD_BRIGHT }}>{acVal ?? "\u2014"}</span>
          </div>
          <div>
            <span style={{ color: GOLD, fontWeight: "bold" }}>Speed </span>
            <span style={{ color: GOLD_BRIGHT }}>{speedVal != null ? `${speedVal} ft.` : "\u2014"}</span>
          </div>
        </div>
        {alignmentVal && (
          <div style={{ fontSize: "13px", fontFamily: SERIF, marginBottom: "8px" }}>
            <span style={{ color: GOLD, fontWeight: "bold" }}>Alignment </span>
            <span style={{ color: GOLD_BRIGHT }}>{alignmentVal}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Section Header */}
      <h3
        style={{
          color: GOLD,
          fontSize: "16px",
          fontWeight: "bold",
          letterSpacing: "1px",
          textTransform: "uppercase",
          marginBottom: "16px",
          fontFamily: SERIF,
        }}
      >
        Players
      </h3>

      {/* Pending Requests Subsection */}
      {pendingLoading ? (
        <p style={{ color: GOLD_MUTED, fontSize: "13px", fontFamily: SERIF, marginBottom: "16px" }}>
          Loading pending requests...
        </p>
      ) : pendingPlayers.length > 0 && (
        <div style={{ marginBottom: "40px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "12px",
            }}
          >
            <span
              style={{
                color: GOLD_MUTED,
                fontSize: "12px",
                fontFamily: SERIF,
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              Pending Requests
            </span>
            <span
              style={{
                background: GOLD,
                color: "#1a1a2e",
                borderRadius: "50%",
                width: "20px",
                height: "20px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: "bold",
              }}
            >
              {pendingPlayers.length}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {pendingPlayers.map((player) => {
              const character = (player as unknown as { character?: Record<string, unknown> }).character ?? null;
              const isExpanded = expandedPendingId === player.id;
              return (
                <div
                  key={player.id}
                  style={{
                    background: "rgba(0,0,0,0.4)",
                    border: "1px solid rgba(201,168,76,0.2)",
                    borderRadius: "8px",
                    padding: "12px 16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            color: GOLD_BRIGHT,
                            fontSize: "14px",
                            fontFamily: SERIF,
                            fontWeight: "bold",
                          }}
                        >
                          {player.user.username}
                        </span>
                        <span
                          style={{
                            color: GOLD_MUTED,
                            fontSize: "11px",
                            fontFamily: SERIF,
                          }}
                        >
                          Requested{" "}
                          {new Date(player.joinedAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      {renderCharacterSummary(character)}
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      {character && (
                        <button
                          onClick={() => setExpandedPendingId(isExpanded ? null : player.id)}
                          style={{
                            background: "none",
                            border: "1px solid rgba(201,168,76,0.3)",
                            color: GOLD_MUTED,
                            borderRadius: "4px",
                            padding: "4px 10px",
                            fontFamily: SERIF,
                            fontSize: "11px",
                            cursor: "pointer",
                          }}
                        >
                          {isExpanded ? "Hide Sheet" : "View Sheet"}
                        </button>
                      )}
                      <button
                        onClick={() =>
                          resolvePlayer.mutate({
                            adventurePlayerId: player.id,
                            action: "ACCEPTED",
                          })
                        }
                        disabled={resolvePlayer.isPending}
                        style={{
                          background: "#4a7c2a",
                          color: "#e8d5a3",
                          border: "none",
                          borderRadius: "4px",
                          padding: "6px 16px",
                          fontFamily: SERIF,
                          fontSize: "12px",
                          fontWeight: "bold",
                          cursor: resolvePlayer.isPending ? "default" : "pointer",
                          opacity: resolvePlayer.isPending ? 0.6 : 1,
                        }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() =>
                          resolvePlayer.mutate({
                            adventurePlayerId: player.id,
                            action: "REJECTED",
                          })
                        }
                        disabled={resolvePlayer.isPending}
                        style={{
                          background: "#e74c3c",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          padding: "6px 16px",
                          fontFamily: SERIF,
                          fontSize: "12px",
                          fontWeight: "bold",
                          cursor: resolvePlayer.isPending ? "default" : "pointer",
                          opacity: resolvePlayer.isPending ? 0.6 : 1,
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                  {isExpanded && renderCharacterOverview(character)}
                </div>
              );
            })}
          </div>

          {/* Divider between pending and accepted */}
          <div
            style={{
              height: "1px",
              background: "rgba(201,168,76,0.2)",
              marginTop: "40px",
            }}
          />
        </div>
      )}

      {/* Accepted Players */}
      {acceptedLoading ? (
        <p style={{ color: GOLD_MUTED, fontSize: "13px", fontFamily: SERIF }}>
          Loading accepted players...
        </p>
      ) : acceptedPlayers.length === 0 ? (
        <div
          style={{
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(201,168,76,0.2)",
            borderRadius: "12px",
            padding: "40px",
            textAlign: "center",
          }}
        >
          <p style={{ color: GOLD_MUTED, fontSize: "14px", fontFamily: SERIF }}>
            No players have been accepted yet.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {acceptedPlayers.map((player) => {
            const character = (player as unknown as { character?: Record<string, unknown> }).character ?? null;
            const userId = (player as unknown as { userId: string }).userId;
            const characterId = (character as { id?: string } | null)?.id;
            const reactionCount = characterId ? (unreadReactionByCharacter?.[characterId] ?? 0) : 0;
            return (
              <div
                key={player.id}
                style={{
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid rgba(201,168,76,0.2)",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: character ? "pointer" : "default",
                  transition: "border-color 0.15s",
                }}
                onClick={() => {
                  if (character) {
                    setSheetModalPlayer({
                      character,
                      username: player.user.username,
                      userId,
                      adventurePlayerId: player.id,
                      playerNote: (player as unknown as { playerNote?: string }).playerNote,
                    });
                  }
                }}
                onMouseEnter={(e) => {
                  if (character) {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(201,168,76,0.5)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(201,168,76,0.2)";
                }}
              >
                <div>
                  <span
                    style={{
                      color: GOLD_BRIGHT,
                      fontSize: "14px",
                      fontFamily: SERIF,
                      fontWeight: "bold",
                    }}
                  >
                    {player.user.username}
                  </span>
                  {renderCharacterSummary(character)}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span
                    style={{
                      color: GOLD_MUTED,
                      fontSize: "11px",
                      fontFamily: SERIF,
                    }}
                  >
                    Joined{" "}
                    {new Date(player.joinedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  {reactionCount > 0 && (
                    <span
                      style={{
                        background: "#c9a84c",
                        color: "#1a1a2e",
                        borderRadius: "50%",
                        width: "20px",
                        height: "20px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: "bold",
                      }}
                      title={`${reactionCount} new reaction${reactionCount > 1 ? "s" : ""}`}
                    >
                      {reactionCount}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Character Sheet Modal */}
      {sheetModalPlayer && sheetModalPlayer.character && (
        <CharacterSheetModal
          character={sheetModalPlayer.character}
          username={sheetModalPlayer.username}
          adventureId={adventureId}
          toUserId={sheetModalPlayer.userId}
          adventurePlayerId={sheetModalPlayer.adventurePlayerId}
          adventureItems={adventureItems}
          playerNote={sheetModalPlayer.playerNote}
          onClose={() => setSheetModalPlayer(null)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Session Notes Tab (mirrors StoryTab layout)
// ---------------------------------------------------------------------------

function SessionNotesTab({ adventureId }: { adventureId: string }) {
  const { user } = useAuth();
  const utils = api.useUtils();
  const [selectedNoteIndex, setSelectedNoteIndex] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const { data: sessionNotes = [], isLoading } =
    api.adventure.getSessionNotes.useQuery({ adventureId });

  const createNote = api.adventure.createSessionNote.useMutation({
    onSuccess: () => {
      setNewTitle("");
      setIsCreating(false);
      void utils.adventure.getSessionNotes.invalidate({ adventureId });
    },
  });

  const updateNote = api.adventure.updateSessionNote.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      void utils.adventure.getSessionNotes.invalidate({ adventureId });
    },
  });

  type SessionNoteItem = {
    id: string;
    title: string;
    content: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    userId: string;
    user: { id: string; username: string };
  };

  const typedNotes = sessionNotes as unknown as SessionNoteItem[];
  const selectedNote: SessionNoteItem | null = typedNotes[selectedNoteIndex] ?? null;
  const handleCreate = () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    createNote.mutate({ adventureId, title: trimmed, content: "" });
  };

  const handleStartEdit = () => {
    if (!selectedNote) return;
    setEditTitle(selectedNote.title);
    setEditContent(selectedNote.content);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!selectedNote) return;
    updateNote.mutate({
      noteId: selectedNote.id,
      title: editTitle.trim() || selectedNote.title,
      content: editContent,
    });
  };

  if (isLoading) {
    return (
      <p style={{ color: GOLD_MUTED, fontSize: "13px", fontFamily: SERIF }}>
        Loading session notes...
      </p>
    );
  }

  return (
    <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
      {/* Left Panel — note list */}
      <div
        style={{
          flex: "0 0 240px",
          minWidth: "200px",
          maxWidth: "280px",
          position: "sticky",
          top: "24px",
          maxHeight: "calc(100vh - 120px)",
          overflowY: "auto",
          background: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(201,168,76,0.2)",
          borderRadius: "8px",
          padding: "12px 0",
        }}
      >
        <p
          style={{
            color: GOLD,
            fontSize: "11px",
            letterSpacing: "1.2px",
            textTransform: "uppercase",
            padding: "0 14px 10px",
            borderBottom: "1px solid rgba(201,168,76,0.15)",
            marginBottom: "8px",
            fontFamily: SERIF,
          }}
        >
          My Session Notes
        </p>

        {/* Add Session Note */}
        {isCreating ? (
          <div style={{ padding: "8px 14px" }}>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Note title..."
              autoFocus
              style={{
                width: "100%",
                padding: "6px 10px",
                background: "rgba(30,15,5,0.9)",
                border: "1px solid rgba(201,168,76,0.3)",
                borderRadius: "4px",
                color: GOLD_BRIGHT,
                fontFamily: SERIF,
                fontSize: "12px",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: "6px",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") setIsCreating(false);
              }}
            />
            <div style={{ display: "flex", gap: "4px" }}>
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim() || createNote.isPending}
                style={{
                  flex: 1,
                  background: "linear-gradient(135deg, #8b6914, #c9a84c)",
                  color: "#1a1a2e",
                  border: "none",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  fontSize: "11px",
                  fontFamily: SERIF,
                  fontWeight: "bold",
                  cursor: !newTitle.trim() ? "default" : "pointer",
                  opacity: !newTitle.trim() ? 0.6 : 1,
                }}
              >
                {createNote.isPending ? "..." : "Create"}
              </button>
              <button
                onClick={() => { setIsCreating(false); setNewTitle(""); }}
                style={{
                  background: "none",
                  border: "1px solid rgba(201,168,76,0.3)",
                  color: GOLD_MUTED,
                  borderRadius: "4px",
                  padding: "4px 8px",
                  fontSize: "11px",
                  fontFamily: SERIF,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            style={{
              display: "block",
              width: "calc(100% - 28px)",
              margin: "0 14px 8px",
              padding: "6px 10px",
              background: "linear-gradient(135deg, #8b6914, #c9a84c)",
              color: "#1a1a2e",
              border: "none",
              borderRadius: "4px",
              fontSize: "11px",
              fontFamily: SERIF,
              fontWeight: "bold",
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            + Add Session Note
          </button>
        )}

        {/* Note list */}
        {typedNotes.map((note, i) => {
          const isActive = i === selectedNoteIndex;
          return (
            <button
              key={note.id}
              onClick={() => { setSelectedNoteIndex(i); setIsEditing(false); }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "8px 14px",
                background: isActive ? "rgba(201,168,76,0.15)" : "transparent",
                border: "none",
                borderLeft: isActive ? "2px solid #c9a84c" : "2px solid transparent",
                color: isActive ? GOLD : GOLD_BRIGHT,
                fontSize: "13px",
                fontFamily: SERIF,
                cursor: "pointer",
                lineHeight: "1.4",
                transition: "background 0.1s, color 0.1s",
              }}
            >
              <span style={{ display: "block", fontWeight: isActive ? "bold" : "normal" }}>
                {note.title}
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: "10px",
                  color: GOLD_MUTED,
                  marginTop: "2px",
                }}
              >
                {new Date(note.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </button>
          );
        })}

        {typedNotes.length === 0 && (
          <p
            style={{
              color: GOLD_MUTED,
              fontSize: "12px",
              fontFamily: SERIF,
              padding: "8px 14px",
              fontStyle: "italic",
            }}
          >
            No session notes yet.
          </p>
        )}
      </div>

      {/* Right Panel — note content */}
      <div style={{ flex: 3, minWidth: 0 }}>
        {selectedNote ? (
          <div
            style={{
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(201,168,76,0.2)",
              borderRadius: "8px",
              padding: "28px 32px",
            }}
          >
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "rgba(30,15,5,0.9)",
                    border: "1px solid rgba(201,168,76,0.3)",
                    borderRadius: "6px",
                    color: GOLD_BRIGHT,
                    fontFamily: SERIF,
                    fontSize: "18px",
                    fontWeight: "bold",
                    outline: "none",
                    boxSizing: "border-box",
                    marginBottom: "16px",
                  }}
                />
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={16}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    background: "rgba(30,15,5,0.9)",
                    border: "1px solid rgba(201,168,76,0.3)",
                    borderRadius: "6px",
                    color: GOLD_BRIGHT,
                    fontFamily: SERIF,
                    fontSize: "14px",
                    lineHeight: "1.7",
                    outline: "none",
                    resize: "vertical",
                    boxSizing: "border-box",
                    marginBottom: "16px",
                  }}
                />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={handleSaveEdit}
                    disabled={updateNote.isPending}
                    style={{
                      background: "linear-gradient(135deg, #8b6914, #c9a84c)",
                      color: "#1a1a2e",
                      border: "none",
                      borderRadius: "6px",
                      padding: "8px 20px",
                      fontSize: "12px",
                      fontFamily: SERIF,
                      fontWeight: "bold",
                      cursor: updateNote.isPending ? "default" : "pointer",
                      opacity: updateNote.isPending ? 0.6 : 1,
                    }}
                  >
                    {updateNote.isPending ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    style={{
                      background: "none",
                      border: "1px solid rgba(201,168,76,0.3)",
                      color: GOLD_MUTED,
                      borderRadius: "6px",
                      padding: "8px 20px",
                      fontSize: "12px",
                      fontFamily: SERIF,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "20px",
                  }}
                >
                  <div>
                    <h2
                      style={{
                        color: GOLD,
                        fontSize: "20px",
                        fontWeight: "bold",
                        letterSpacing: "1.5px",
                        textTransform: "uppercase",
                        marginBottom: "6px",
                        fontFamily: SERIF,
                      }}
                    >
                      {selectedNote.title}
                    </h2>
                    <p
                      style={{
                        color: GOLD_MUTED,
                        fontSize: "12px",
                        fontFamily: SERIF,
                      }}
                    >
                      {new Date(selectedNote.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                    <button
                      onClick={handleStartEdit}
                      style={{
                        background: "none",
                        border: "1px solid rgba(201,168,76,0.3)",
                        color: GOLD_MUTED,
                        borderRadius: "4px",
                        padding: "6px 14px",
                        fontFamily: SERIF,
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                </div>
                <p
                  style={{
                    color: GOLD_BRIGHT,
                    fontSize: "14px",
                    fontFamily: SERIF,
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {selectedNote.content || (
                    <span style={{ color: GOLD_MUTED, fontStyle: "italic" }}>
                      No content yet.
                    </span>
                  )}
                </p>
              </>
            )}
          </div>
        ) : (
          <div
            style={{
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(201,168,76,0.2)",
              borderRadius: "12px",
              padding: "60px 40px",
              textAlign: "center",
            }}
          >
            <p style={{ color: GOLD_MUTED, fontSize: "14px", fontFamily: SERIF }}>
              {typedNotes.length === 0
                ? "Create your first session note to get started."
                : "Select a note from the sidebar."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// My Character Tab (player view)
// ---------------------------------------------------------------------------

function MyCharacterTab({ adventure }: { adventure: { id: string; players: Array<{ userId: string; status: string; character: Record<string, unknown> }> } }) {
  const { user } = useAuth();

  const myPlayerRecord = (adventure.players as Array<{ userId: string; status: string; character: Record<string, unknown> }>).find(
    (p) => p.userId === user?.userId && p.status === "ACCEPTED",
  );
  const myCharacter = myPlayerRecord?.character ?? null;

  if (!myCharacter) {
    return (
      <div
        style={{
          background: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(201,168,76,0.2)",
          borderRadius: "12px",
          padding: "60px 40px",
          textAlign: "center",
        }}
      >
        <p style={{ color: GOLD_MUTED, fontSize: "14px", fontFamily: SERIF }}>
          No character found for this adventure.
        </p>
      </div>
    );
  }

  const name = myCharacter.name as string | undefined;
  const race = myCharacter.race as string | undefined;
  const charClass = myCharacter.characterClass as string | undefined;
  const level = (myCharacter.level as number | undefined) ?? 1;
  const subclass = myCharacter.subclass as string | undefined;
  const alignment = myCharacter.alignment as string | undefined;
  const maxHp = (myCharacter.maxHp as number | undefined) ?? 0;
  const currentHp = (myCharacter.currentHp as number | undefined) ?? 0;
  const tempHp = (myCharacter.tempHp as number | undefined) ?? 0;
  const ac = (myCharacter.armorClass as number | undefined) ?? 10;
  const speed = (myCharacter.speed as number | undefined) ?? 30;
  const str = (myCharacter.strength as number | undefined) ?? 10;
  const dex = (myCharacter.dexterity as number | undefined) ?? 10;
  const con = (myCharacter.constitution as number | undefined) ?? 10;
  const int = (myCharacter.intelligence as number | undefined) ?? 10;
  const wis = (myCharacter.wisdom as number | undefined) ?? 10;
  const cha = (myCharacter.charisma as number | undefined) ?? 10;
  const characterId = myCharacter.id as string;

  const abilityScores = [
    { label: "STR", value: str },
    { label: "DEX", value: dex },
    { label: "CON", value: con },
    { label: "INT", value: int },
    { label: "WIS", value: wis },
    { label: "CHA", value: cha },
  ];

  const modString = (score: number) => {
    const m = Math.floor((score - 10) / 2);
    return m >= 0 ? `+${m}` : `${m}`;
  };

  return (
    <div
      style={{
        background: "rgba(0,0,0,0.4)",
        border: "1px solid rgba(201,168,76,0.2)",
        borderRadius: "12px",
        padding: "32px",
        maxWidth: "700px",
      }}
    >
      {/* Character header */}
      <div style={{ marginBottom: "24px" }}>
        <h2
          style={{
            color: GOLD,
            fontSize: "22px",
            fontWeight: "bold",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            fontFamily: SERIF,
            marginBottom: "4px",
          }}
        >
          {name ?? "Unknown"}
        </h2>
        <p style={{ color: GOLD_BRIGHT, fontSize: "14px", fontFamily: SERIF, marginBottom: "2px" }}>
          Level {level} {race ?? ""} {charClass ?? ""}
          {subclass ? ` (${subclass})` : ""}
        </p>
        {alignment && (
          <p style={{ color: GOLD_MUTED, fontSize: "12px", fontFamily: SERIF }}>
            {alignment}
          </p>
        )}
      </div>

      {/* Combat stats */}
      <div
        style={{
          display: "flex",
          gap: "24px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        {[
          { label: "HP", value: `${currentHp}/${maxHp}${tempHp > 0 ? ` (+${tempHp})` : ""}` },
          { label: "AC", value: ac },
          { label: "Speed", value: `${speed} ft.` },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "rgba(201,168,76,0.08)",
              border: "1px solid rgba(201,168,76,0.2)",
              borderRadius: "8px",
              padding: "12px 20px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                color: GOLD_MUTED,
                fontSize: "10px",
                letterSpacing: "1px",
                textTransform: "uppercase",
                marginBottom: "4px",
                fontFamily: SERIF,
              }}
            >
              {stat.label}
            </div>
            <div
              style={{
                color: GOLD_BRIGHT,
                fontSize: "18px",
                fontWeight: "bold",
                fontFamily: SERIF,
              }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Ability scores */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: "8px",
          marginBottom: "24px",
        }}
      >
        {abilityScores.map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "rgba(201,168,76,0.05)",
              border: "1px solid rgba(201,168,76,0.15)",
              borderRadius: "8px",
              padding: "10px 4px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                color: GOLD_MUTED,
                fontSize: "10px",
                letterSpacing: "1px",
                marginBottom: "4px",
                fontFamily: SERIF,
              }}
            >
              {stat.label}
            </div>
            <div
              style={{
                color: GOLD_BRIGHT,
                fontSize: "18px",
                fontWeight: "bold",
                fontFamily: SERIF,
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                color: GOLD_MUTED,
                fontSize: "11px",
                fontFamily: SERIF,
              }}
            >
              {modString(stat.value)}
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div
        style={{
          height: "1px",
          background: "rgba(201,168,76,0.2)",
          marginBottom: "24px",
        }}
      />

      {/* Link to full character sheet */}
      <Link
        href={`/characters/${characterId}`}
        style={{
          display: "inline-block",
          background: "linear-gradient(135deg, #8b6914, #c9a84c)",
          color: "#1a1a2e",
          borderRadius: "6px",
          padding: "10px 24px",
          fontSize: "13px",
          fontFamily: SERIF,
          fontWeight: "bold",
          textDecoration: "none",
          letterSpacing: "0.5px",
        }}
      >
        Open Full Character Sheet
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared: Inventory Item Description (used by both player & DM views)
// ---------------------------------------------------------------------------

function InventoryItemDescription({
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

// ---------------------------------------------------------------------------
// Starting Items Modal (shared between player & DM views)
// ---------------------------------------------------------------------------

function StartingItemsModal({
  open,
  onClose,
  characterClass,
  classSource,
  background,
  adventurePlayerId,
  adventureId,
}: {
  open: boolean;
  onClose: () => void;
  characterClass: string;
  classSource: string;
  background: string;
  adventurePlayerId: string;
  adventureId: string;
}) {
  const utils = api.useUtils();
  const [selectedPresetIdx, setSelectedPresetIdx] = useState(0);

  const addStartingItems = api.adventure.addStartingItems.useMutation({
    onSuccess: () => {
      void utils.adventure.getInventory.invalidate({
        adventureId,
        adventurePlayerId,
      });
      onClose();
    },
  });

  if (!open) return null;

  const classEquip = getClassStartingEquipment(characterClass, classSource);
  const bgEquip = getBackgroundStartingEquipment(background);

  const classPresets: StartingEquipmentPreset[] = classEquip?.presets ?? [];
  const selectedPreset = classPresets[selectedPresetIdx] ?? null;
  const bgItems: StartingItem[] = bgEquip?.items ?? [];

  const handleConfirm = () => {
    const items: Array<{
      name: string;
      source: string;
      quantity?: number;
      displayName?: string;
    }> = [];

    if (selectedPreset) {
      for (const si of selectedPreset.items) {
        items.push({
          name: si.name,
          source: si.source,
          quantity: si.quantity,
          displayName: si.displayName,
        });
      }
    }

    for (const bi of bgItems) {
      items.push({
        name: bi.name,
        source: bi.source,
        quantity: bi.quantity,
        displayName: bi.displayName,
      });
    }

    if (items.length === 0) return;

    addStartingItems.mutate({
      adventurePlayerId,
      items,
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1001,
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
              color: GOLD,
              fontSize: "18px",
              fontWeight: "bold",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              fontFamily: SERIF,
            }}
          >
            Starting Equipment
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: GOLD_MUTED,
              fontSize: "20px",
              cursor: "pointer",
              padding: "0 4px",
            }}
          >
            x
          </button>
        </div>

        <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
          {/* Class equipment presets */}
          {classPresets.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <p
                style={{
                  color: GOLD,
                  fontSize: "12px",
                  fontWeight: "bold",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  marginBottom: "10px",
                  fontFamily: SERIF,
                }}
              >
                {characterClass} Equipment
              </p>

              {/* Preset selection pills */}
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  marginBottom: "12px",
                  flexWrap: "wrap",
                }}
              >
                {classPresets.map((preset, idx) => {
                  const isSelected = idx === selectedPresetIdx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedPresetIdx(idx)}
                      style={{
                        background: isSelected
                          ? "linear-gradient(135deg, #8b6914, #c9a84c)"
                          : "rgba(201,168,76,0.1)",
                        color: isSelected ? "#1a1a2e" : GOLD_BRIGHT,
                        border: isSelected
                          ? "none"
                          : "1px solid rgba(201,168,76,0.3)",
                        borderRadius: "20px",
                        padding: "6px 16px",
                        fontSize: "12px",
                        fontFamily: SERIF,
                        fontWeight: isSelected ? "bold" : "normal",
                        cursor: "pointer",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Selected preset items */}
              {selectedPreset && (
                <div
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(201,168,76,0.15)",
                    borderRadius: "8px",
                    padding: "12px 16px",
                  }}
                >
                  {selectedPreset.items.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "4px 0",
                        borderBottom:
                          idx < selectedPreset.items.length - 1
                            ? "1px solid rgba(201,168,76,0.1)"
                            : "none",
                      }}
                    >
                      <span
                        style={{
                          color: GOLD_BRIGHT,
                          fontSize: "13px",
                          fontFamily: SERIF,
                          flex: 1,
                        }}
                      >
                        {item.displayName ?? item.name}
                        {item.quantity > 1 ? ` (x${item.quantity})` : ""}
                      </span>
                      {item.source && <SourceBadge source={item.source} />}
                    </div>
                  ))}
                </div>
              )}

              {classEquip?.goldAlternative && (
                <p
                  style={{
                    color: GOLD_MUTED,
                    fontSize: "12px",
                    fontFamily: SERIF,
                    fontStyle: "italic",
                    marginTop: "8px",
                  }}
                >
                  Gold alternative: {classEquip.goldAlternative}
                </p>
              )}
            </div>
          )}

          {/* Background equipment */}
          {bgItems.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <p
                style={{
                  color: GOLD,
                  fontSize: "12px",
                  fontWeight: "bold",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  marginBottom: "10px",
                  fontFamily: SERIF,
                }}
              >
                {background} Background Equipment
              </p>
              <div
                style={{
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(201,168,76,0.15)",
                  borderRadius: "8px",
                  padding: "12px 16px",
                }}
              >
                {bgItems.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "4px 0",
                      borderBottom:
                        idx < bgItems.length - 1
                          ? "1px solid rgba(201,168,76,0.1)"
                          : "none",
                    }}
                  >
                    <span
                      style={{
                        color: GOLD_BRIGHT,
                        fontSize: "13px",
                        fontFamily: SERIF,
                        flex: 1,
                      }}
                    >
                      {item.displayName ?? item.name}
                      {item.quantity > 1 ? ` (x${item.quantity})` : ""}
                    </span>
                    {item.source && <SourceBadge source={item.source} />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {classPresets.length === 0 && bgItems.length === 0 && (
            <p
              style={{
                color: GOLD_MUTED,
                fontSize: "13px",
                fontFamily: SERIF,
                textAlign: "center",
                padding: "20px",
              }}
            >
              No starting equipment data found for this class/background combination.
            </p>
          )}
        </div>

        {/* Confirm button */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
            marginTop: "16px",
            paddingTop: "16px",
            borderTop: "1px solid rgba(201,168,76,0.2)",
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "1px solid rgba(201,168,76,0.3)",
              color: GOLD_MUTED,
              borderRadius: "6px",
              padding: "8px 20px",
              fontSize: "12px",
              fontFamily: SERIF,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={
              addStartingItems.isPending ||
              (classPresets.length === 0 && bgItems.length === 0)
            }
            style={{
              background: "linear-gradient(135deg, #8b6914, #c9a84c)",
              color: "#1a1a2e",
              border: "none",
              borderRadius: "6px",
              padding: "8px 20px",
              fontSize: "12px",
              fontFamily: SERIF,
              fontWeight: "bold",
              cursor:
                addStartingItems.isPending ||
                (classPresets.length === 0 && bgItems.length === 0)
                  ? "default"
                  : "pointer",
              opacity:
                addStartingItems.isPending ||
                (classPresets.length === 0 && bgItems.length === 0)
                  ? 0.6
                  : 1,
            }}
          >
            {addStartingItems.isPending ? "Adding..." : "Confirm Starting Items"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Equipment Panel (Player View — shown inside Inventory Tab)
// ---------------------------------------------------------------------------

const EQUIPMENT_SLOT_LABELS: Record<EquipmentSlot, string> = {
  mainHand: "Main Hand",
  offHand: "Off Hand",
  armor: "Armor",
  shield: "Shield",
};

const EQUIPMENT_SLOT_ORDER: EquipmentSlot[] = ["mainHand", "offHand", "armor", "shield"];

function EquipmentPanel({
  adventurePlayerId,
  characterClass,
  dexterity,
  inventoryItems,
}: {
  adventurePlayerId: string;
  characterClass: string;
  dexterity: number;
  inventoryItems: Array<{
    id: string;
    itemName: string;
    itemSource: string;
    quantity: number;
  }>;
}) {
  const utils = api.useUtils();

  const { data: equipmentStatus } = api.adventure.getEquipmentStatus.useQuery(
    { adventurePlayerId },
    { enabled: !!adventurePlayerId },
  );

  const equipItem = api.adventure.equipItem.useMutation({
    onSuccess: () => {
      void utils.adventure.getEquipmentStatus.invalidate({ adventurePlayerId });
      void utils.adventure.getInventory.invalidate();
    },
  });

  const unequipItem = api.adventure.unequipItem.useMutation({
    onSuccess: () => {
      void utils.adventure.getEquipmentStatus.invalidate({ adventurePlayerId });
      void utils.adventure.getInventory.invalidate();
    },
  });

  // Parse equipped items from status or fallback
  const equippedItems: EquippedItems = equipmentStatus?.equippedItems ?? {
    mainHand: null,
    offHand: null,
    armor: null,
    shield: null,
  };

  const computedAC = equipmentStatus?.ac?.ac ?? 10;
  const acBreakdown = equipmentStatus?.ac?.breakdown ?? "10 base";
  const armorPenalties: string[] = equipmentStatus?.armorPenalties?.penalties ?? [];
  const equipmentActions = equipmentStatus?.equipmentActions ?? [];
  const rawMasteries = equipmentStatus?.weaponMasteries ?? [];

  // Flatten weapon masteries into display format
  const weaponMasteries: Array<{ weapon: string; mastery: string; description: string }> =
    rawMasteries.flatMap((wm) =>
      wm.masteries.map((m: string) => ({
        weapon: wm.weaponName,
        mastery: m,
        description: WEAPON_MASTERY_DESCRIPTIONS?.[m] ?? "",
      })),
    );

  const handleUnequip = (slot: EquipmentSlot) => {
    unequipItem.mutate({ adventurePlayerId, slot });
  };

  // Determine valid slots for an item based on its type
  const getValidSlots = (itemData: Item | undefined): EquipmentSlot[] => {
    if (!itemData) return [];
    const typeLower = (itemData.type ?? "").toLowerCase();
    if (typeLower.includes("armor") && !typeLower.includes("shield")) return ["armor"];
    if (typeLower.includes("shield")) return ["shield"];
    if (
      typeLower.includes("weapon") ||
      typeLower.includes("sword") ||
      typeLower.includes("melee") ||
      typeLower.includes("ranged") ||
      itemData.weaponCategory
    ) {
      return ["mainHand", "offHand"];
    }
    return [];
  };

  return (
    <div
      style={{
        background: "rgba(0,0,0,0.5)",
        border: "1px solid rgba(201,168,76,0.3)",
        borderRadius: "12px",
        padding: "20px 24px",
        marginBottom: "20px",
      }}
    >
      {/* Header */}
      <p
        style={{
          color: GOLD,
          fontSize: "14px",
          fontWeight: "bold",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          fontFamily: SERIF,
          marginBottom: "16px",
          paddingBottom: "10px",
          borderBottom: `1px solid rgba(201,168,76,0.25)`,
        }}
      >
        Equipment
      </p>

      {/* Equipment Slots */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
        {EQUIPMENT_SLOT_ORDER.map((slot) => {
          const equippedName = equippedItems[slot];
          const equippedItemData = equippedName
            ? ITEMS.find((it) => it.name.toLowerCase() === equippedName.toLowerCase())
            : undefined;

          return (
            <div
              key={slot}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "8px 12px",
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(201,168,76,0.15)",
                borderRadius: "6px",
              }}
            >
              <span
                style={{
                  color: GOLD_MUTED,
                  fontSize: "12px",
                  fontFamily: SERIF,
                  fontWeight: "bold",
                  letterSpacing: "0.5px",
                  minWidth: "90px",
                  textTransform: "uppercase",
                }}
              >
                {EQUIPMENT_SLOT_LABELS[slot]}
              </span>

              {equippedName ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, flexWrap: "wrap" }}>
                  <span
                    style={{
                      color: GOLD_BRIGHT,
                      fontSize: "14px",
                      fontFamily: SERIF,
                    }}
                  >
                    {equippedName}
                  </span>

                  {/* Weapon properties as tags */}
                  {equippedItemData?.property && equippedItemData.property.length > 0 && (
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      {equippedItemData.property.map((prop) => (
                        <span
                          key={prop}
                          title={WEAPON_PROPERTY_DESCRIPTIONS?.[prop] ?? prop}
                          style={{
                            color: TEXT_DIM,
                            fontSize: "10px",
                            fontFamily: SERIF,
                            background: "rgba(201,168,76,0.1)",
                            border: "1px solid rgba(201,168,76,0.2)",
                            borderRadius: "3px",
                            padding: "1px 6px",
                            letterSpacing: "0.3px",
                          }}
                        >
                          {prop}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Mastery tag */}
                  {equippedItemData?.mastery && equippedItemData.mastery.length > 0 && (
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      {equippedItemData.mastery.map((m) => (
                        <span
                          key={m}
                          title={WEAPON_MASTERY_DESCRIPTIONS?.[m] ?? m}
                          style={{
                            color: "#88aaff",
                            fontSize: "10px",
                            fontFamily: SERIF,
                            background: "rgba(136,170,255,0.1)",
                            border: "1px solid rgba(136,170,255,0.25)",
                            borderRadius: "3px",
                            padding: "1px 6px",
                            letterSpacing: "0.3px",
                            fontWeight: "bold",
                          }}
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => handleUnequip(slot)}
                    disabled={unequipItem.isPending}
                    style={{
                      background: "rgba(204,68,68,0.15)",
                      border: "1px solid rgba(204,68,68,0.35)",
                      color: "#cc4444",
                      borderRadius: "4px",
                      padding: "2px 10px",
                      fontSize: "11px",
                      fontFamily: SERIF,
                      cursor: unequipItem.isPending ? "default" : "pointer",
                      opacity: unequipItem.isPending ? 0.5 : 1,
                      marginLeft: "auto",
                    }}
                  >
                    Unequip
                  </button>
                </div>
              ) : (
                <span
                  style={{
                    color: TEXT_DIM,
                    fontSize: "13px",
                    fontFamily: SERIF,
                    fontStyle: "italic",
                  }}
                >
                  — (none)
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* AC Display */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "10px 14px",
          background: "rgba(201,168,76,0.08)",
          border: "1px solid rgba(201,168,76,0.2)",
          borderRadius: "6px",
          marginBottom: "10px",
        }}
      >
        <span
          style={{
            color: GOLD,
            fontSize: "16px",
            fontWeight: "bold",
            fontFamily: SERIF,
          }}
        >
          AC: {computedAC}
        </span>
        <span
          style={{
            color: TEXT_DIM,
            fontSize: "12px",
            fontFamily: SERIF,
          }}
        >
          ({acBreakdown})
        </span>
      </div>

      {/* Armor Proficiency Warnings */}
      {armorPenalties.length > 0 && (
        <div
          style={{
            padding: "10px 14px",
            background: "rgba(204,68,68,0.08)",
            border: "1px solid rgba(204,68,68,0.25)",
            borderRadius: "6px",
            marginBottom: "10px",
          }}
        >
          {armorPenalties.map((penalty, i) => (
            <p
              key={i}
              style={{
                color: "#cc4444",
                fontSize: "12px",
                fontFamily: SERIF,
                marginBottom: i < armorPenalties.length - 1 ? "4px" : 0,
              }}
            >
              Warning: {penalty}
            </p>
          ))}
        </div>
      )}

      {/* Weapon Mastery Info */}
      {weaponMasteries.length > 0 && (
        <div
          style={{
            padding: "10px 14px",
            background: "rgba(136,170,255,0.06)",
            border: "1px solid rgba(136,170,255,0.2)",
            borderRadius: "6px",
            marginBottom: "10px",
          }}
        >
          <p
            style={{
              color: "#88aaff",
              fontSize: "11px",
              fontFamily: SERIF,
              fontWeight: "bold",
              letterSpacing: "1px",
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            Weapon Mastery
          </p>
          {weaponMasteries.map((wm, i) => (
            <p
              key={i}
              style={{
                color: GOLD_BRIGHT,
                fontSize: "12px",
                fontFamily: SERIF,
                marginBottom: i < weaponMasteries.length - 1 ? "4px" : 0,
              }}
            >
              <span style={{ color: "#88aaff", fontWeight: "bold" }}>{wm.mastery}</span>
              {" "}({wm.weapon})
              {wm.description && (
                <span style={{ color: TEXT_DIM }}> — {wm.description}</span>
              )}
            </p>
          ))}
        </div>
      )}

      {/* Equipment-derived Actions */}
      {equipmentActions.length > 0 && (
        <div
          style={{
            padding: "10px 14px",
            background: "rgba(74,124,42,0.08)",
            border: "1px solid rgba(74,124,42,0.2)",
            borderRadius: "6px",
          }}
        >
          <p
            style={{
              color: "#4a7c2a",
              fontSize: "11px",
              fontFamily: SERIF,
              fontWeight: "bold",
              letterSpacing: "1px",
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            Equipment Actions
          </p>
          {equipmentActions.map((ea, i) => (
            <div
              key={i}
              style={{
                marginBottom: i < equipmentActions.length - 1 ? "6px" : 0,
              }}
            >
              <span
                style={{
                  color: GOLD_BRIGHT,
                  fontSize: "13px",
                  fontFamily: SERIF,
                  fontWeight: "bold",
                }}
              >
                {ea.name}
              </span>
              <span
                style={{
                  color: TEXT_DIM,
                  fontSize: "11px",
                  fontFamily: SERIF,
                  marginLeft: "8px",
                }}
              >
                [{ea.cost}]
              </span>
              <p
                style={{
                  color: GOLD_BRIGHT,
                  fontSize: "12px",
                  fontFamily: SERIF,
                  marginTop: "2px",
                  lineHeight: 1.5,
                }}
              >
                {ea.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Equip Button (shown on inventory items)
// ---------------------------------------------------------------------------

function EquipButton({
  itemName,
  itemSource,
  adventurePlayerId,
  itemData,
}: {
  itemName: string;
  itemSource: string;
  adventurePlayerId: string;
  itemData: Item | undefined;
}) {
  const utils = api.useUtils();
  const [showSlotMenu, setShowSlotMenu] = useState(false);

  const equipItem = api.adventure.equipItem.useMutation({
    onSuccess: () => {
      void utils.adventure.getEquipmentStatus.invalidate({ adventurePlayerId });
      void utils.adventure.getInventory.invalidate();
      setShowSlotMenu(false);
    },
  });

  if (!itemData) return null;

  const typeLower = (itemData.type ?? "").toLowerCase();
  const isWeapon =
    typeLower.includes("weapon") ||
    typeLower.includes("sword") ||
    typeLower.includes("melee") ||
    typeLower.includes("ranged") ||
    !!itemData.weaponCategory;
  const isArmor = typeLower.includes("armor") && !typeLower.includes("shield");
  const isShield = typeLower.includes("shield");

  if (!isWeapon && !isArmor && !isShield) return null;

  const slots: EquipmentSlot[] = isArmor
    ? ["armor"]
    : isShield
      ? ["shield"]
      : ["mainHand", "offHand"];

  const handleEquip = (slot: EquipmentSlot) => {
    equipItem.mutate({ adventurePlayerId, itemName, itemSource, slot });
  };

  // Single slot — just show a button
  if (slots.length === 1) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleEquip(slots[0]!);
        }}
        disabled={equipItem.isPending}
        style={{
          background: "rgba(74,124,42,0.15)",
          border: "1px solid rgba(74,124,42,0.4)",
          color: "#4a7c2a",
          borderRadius: "4px",
          padding: "3px 12px",
          fontSize: "11px",
          fontFamily: SERIF,
          cursor: equipItem.isPending ? "default" : "pointer",
          opacity: equipItem.isPending ? 0.5 : 1,
          letterSpacing: "0.3px",
        }}
      >
        {equipItem.isPending ? "..." : "Equip"}
      </button>
    );
  }

  // Multiple slots — show dropdown
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowSlotMenu(!showSlotMenu);
        }}
        disabled={equipItem.isPending}
        style={{
          background: "rgba(74,124,42,0.15)",
          border: "1px solid rgba(74,124,42,0.4)",
          color: "#4a7c2a",
          borderRadius: "4px",
          padding: "3px 12px",
          fontSize: "11px",
          fontFamily: SERIF,
          cursor: equipItem.isPending ? "default" : "pointer",
          opacity: equipItem.isPending ? 0.5 : 1,
          letterSpacing: "0.3px",
        }}
      >
        {equipItem.isPending ? "..." : "Equip \u25BC"}
      </button>
      {showSlotMenu && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: "4px",
            background: "rgba(20,10,5,0.98)",
            border: "1px solid rgba(201,168,76,0.4)",
            borderRadius: "6px",
            padding: "4px 0",
            zIndex: 20,
            minWidth: "120px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.6)",
          }}
        >
          {slots.map((slot) => (
            <button
              key={slot}
              onClick={(e) => {
                e.stopPropagation();
                handleEquip(slot);
              }}
              style={{
                display: "block",
                width: "100%",
                background: "transparent",
                border: "none",
                color: GOLD_BRIGHT,
                fontSize: "12px",
                fontFamily: SERIF,
                padding: "6px 14px",
                cursor: "pointer",
                textAlign: "left",
                letterSpacing: "0.3px",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = "rgba(201,168,76,0.15)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = "transparent";
              }}
            >
              {EQUIPMENT_SLOT_LABELS[slot]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inventory Tab (Player View)
// ---------------------------------------------------------------------------

function InventoryTab({
  adventure,
}: {
  adventure: {
    id: string;
    players: Array<{
      id: string;
      userId: string;
      status: string;
      character: Record<string, unknown>;
    }>;
  };
}) {
  const { user } = useAuth();
  const [searchText, setSearchText] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showStartingModal, setShowStartingModal] = useState(false);

  const myPlayerRecord = adventure.players.find(
    (p) => p.userId === user?.userId && p.status === "ACCEPTED",
  );
  const myCharacter = myPlayerRecord?.character ?? null;
  const adventurePlayerId = myPlayerRecord?.id ?? "";

  const { data: inventoryItems = [], isLoading } =
    api.adventure.getInventory.useQuery(
      { adventureId: adventure.id, adventurePlayerId },
      { enabled: !!adventurePlayerId },
    );

  type InventoryItem = {
    id: string;
    adventurePlayerId: string;
    itemName: string;
    itemSource: string;
    quantity: number;
    isStartingItem: boolean;
    customDescription: string | null;
    addedByUserId: string;
    createdAt: string | Date;
    addedByUser: { id: string; username: string };
  };

  const typedItems = inventoryItems as unknown as InventoryItem[];

  const hasStartingItems = typedItems.some((item) => item.isStartingItem);

  const filteredItems = useMemo(() => {
    if (!searchText.trim()) return typedItems;
    const lower = searchText.toLowerCase();
    return typedItems.filter((item) =>
      item.itemName.toLowerCase().includes(lower),
    );
  }, [typedItems, searchText]);

  if (!myPlayerRecord || !myCharacter) {
    return (
      <div
        style={{
          background: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(201,168,76,0.2)",
          borderRadius: "12px",
          padding: "60px 40px",
          textAlign: "center",
        }}
      >
        <p style={{ color: GOLD_MUTED, fontSize: "14px", fontFamily: SERIF }}>
          No character found for this adventure.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <p style={{ color: GOLD_MUTED, fontSize: "13px", fontFamily: SERIF }}>
        Loading inventory...
      </p>
    );
  }

  const charClass = (myCharacter.characterClass as string) ?? "";
  const classSource = (myCharacter.rulesSource as string) ?? "PHB";
  const background = (myCharacter.background as string) ?? "";

  return (
    <div>
      {/* Starting items button */}
      {!hasStartingItems && (
        <button
          onClick={() => setShowStartingModal(true)}
          style={{
            background: "linear-gradient(135deg, #8b6914, #c9a84c)",
            color: "#1a1a2e",
            border: "none",
            borderRadius: "6px",
            padding: "10px 24px",
            fontSize: "14px",
            fontFamily: "'Georgia', serif",
            fontWeight: "bold",
            cursor: "pointer",
            letterSpacing: "0.5px",
            marginBottom: "20px",
          }}
        >
          Add Starting Items
        </button>
      )}

      {/* Equipment Panel */}
      {adventurePlayerId && (
        <EquipmentPanel
          adventurePlayerId={adventurePlayerId}
          characterClass={charClass}
          dexterity={(myCharacter.dexterity as number) ?? 10}
          inventoryItems={typedItems.map((it) => ({
            id: it.id,
            itemName: it.itemName,
            itemSource: it.itemSource,
            quantity: it.quantity,
          }))}
        />
      )}

      {/* Search input */}
      {typedItems.length > 0 && (
        <input
          type="text"
          placeholder="Search inventory..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            background: "rgba(30,15,5,0.9)",
            border: "1px solid rgba(201,168,76,0.4)",
            color: GOLD_BRIGHT,
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
      )}

      {/* Inventory list */}
      {typedItems.length === 0 ? (
        <div
          style={{
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(201,168,76,0.2)",
            borderRadius: "12px",
            padding: "60px 40px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              color: GOLD_MUTED,
              fontSize: "16px",
              fontFamily: SERIF,
              fontStyle: "italic",
              marginBottom: "8px",
            }}
          >
            Your pack is empty, adventurer...
          </p>
          <p style={{ color: TEXT_DIM, fontSize: "13px", fontFamily: SERIF }}>
            Add starting items or wait for your DM to grant you equipment.
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div
          style={{
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(201,168,76,0.2)",
            borderRadius: "12px",
            padding: "40px",
            textAlign: "center",
          }}
        >
          <p style={{ color: GOLD_MUTED, fontSize: "14px", fontFamily: SERIF }}>
            No items match your search.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filteredItems.map((item) => {
            const isExpanded = expandedId === item.id;
            const itemData = ITEMS.find(
              (it) =>
                it.name.toLowerCase() === item.itemName.toLowerCase() &&
                it.source.toLowerCase() === item.itemSource.toLowerCase(),
            ) ?? ITEMS.find(
              (it) => it.name.toLowerCase() === item.itemName.toLowerCase(),
            );

            return (
              <div
                key={item.id}
                style={{
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid rgba(201,168,76,0.2)",
                  borderRadius: "8px",
                  padding: "12px 16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    setExpandedId(isExpanded ? null : item.id)
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        color: GOLD_BRIGHT,
                        fontSize: "14px",
                        fontFamily: "'Georgia', serif",
                      }}
                    >
                      {isExpanded ? "\u25BC" : "\u25B6"} {item.itemName}
                    </span>
                    {item.quantity > 1 && (
                      <span
                        style={{
                          color: GOLD,
                          fontSize: "12px",
                          fontFamily: "'Georgia', serif",
                          background: "rgba(201,168,76,0.15)",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontWeight: "bold",
                        }}
                      >
                        x{item.quantity}
                      </span>
                    )}
                    <SourceBadge source={item.itemSource} />
                    {itemData && <RarityBadge rarity={itemData.rarity} />}
                    {item.isStartingItem && (
                      <span
                        style={{
                          color: "#4a8c3f",
                          fontSize: "10px",
                          fontFamily: "'Georgia', serif",
                          background: "rgba(74,140,63,0.15)",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          letterSpacing: "0.5px",
                          textTransform: "uppercase",
                        }}
                      >
                        Starting
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <EquipButton
                      itemName={item.itemName}
                      itemSource={item.itemSource}
                      adventurePlayerId={adventurePlayerId}
                      itemData={itemData}
                    />
                    <span
                      style={{
                        color: GOLD_MUTED,
                        fontSize: "12px",
                        fontFamily: SERIF,
                      }}
                    >
                      {isExpanded ? "\u25B2" : "\u25BC"}
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(201,168,76,0.15)",
                      borderRadius: "8px",
                      padding: "16px 20px",
                      marginTop: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <InventoryItemDescription
                      itemData={itemData}
                      customDescription={item.customDescription}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Starting Items Modal */}
      <StartingItemsModal
        open={showStartingModal}
        onClose={() => setShowStartingModal(false)}
        characterClass={charClass}
        classSource={classSource}
        background={background}
        adventurePlayerId={adventurePlayerId}
        adventureId={adventure.id}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Player DM Notes tab (read-only view of notes from the DM + reactions)
// ---------------------------------------------------------------------------

function PlayerDmNotesTab({ adventure }: { adventure: { id: string; players: Array<{ id: string; userId: string; status: string; playerNote?: string; character: { id: string } }> } }) {
  const { user } = useAuth();
  const utils = api.useUtils();
  const [notePage, setNotePage] = useState(0);

  const myPlayerRecord = adventure.players.find(
    (p) => p.userId === user?.userId && p.status === "ACCEPTED",
  );
  const characterId = (myPlayerRecord?.character as { id: string } | undefined)?.id;
  const adventurePlayerId = myPlayerRecord?.id ?? "";
  const initialPlayerNote = (myPlayerRecord?.playerNote as string | undefined) ?? "";

  const [playerNote, setPlayerNote] = useState(initialPlayerNote);
  const [playerNoteSaved, setPlayerNoteSaved] = useState(true);

  const updatePlayerNote = api.adventure.updatePlayerNote.useMutation({
    onSuccess: () => {
      setPlayerNoteSaved(true);
      void utils.adventure.getById.invalidate({ id: adventure.id });
    },
  });

  const handleSavePlayerNote = () => {
    if (!adventurePlayerId) return;
    updatePlayerNote.mutate({ adventurePlayerId, content: playerNote });
  };

  const { data: dmNotes = [], isLoading } = api.adventure.getNotes.useQuery(
    { adventureId: adventure.id, characterId: characterId! },
    { enabled: !!characterId },
  );

  const reactToNote = api.adventure.reactToNote.useMutation({
    onSuccess: () => {
      void utils.adventure.getNotes.invalidate({ adventureId: adventure.id, characterId: characterId! });
    },
  });

  if (!characterId) {
    return (
      <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "12px", padding: "60px 40px", textAlign: "center" }}>
        <p style={{ color: GOLD_MUTED, fontSize: "14px", fontFamily: SERIF }}>No character found in this adventure.</p>
      </div>
    );
  }

  if (isLoading) {
    return <p style={{ color: GOLD_MUTED, fontSize: "13px", fontFamily: SERIF }}>Loading DM notes...</p>;
  }

  const typedNotes = dmNotes as unknown as Array<{
    id: string;
    content: string;
    createdAt: string | Date;
    reaction: string | null;
    fromUser: { username: string };
  }>;

  if (typedNotes.length === 0) {
    return (
      <div>
        {/* Note to DM */}
        <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px", padding: "28px 32px", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", paddingBottom: "8px", borderBottom: "1px solid rgba(201,168,76,0.2)" }}>
            <p style={{ color: GOLD, fontSize: "12px", fontWeight: "bold", letterSpacing: "2px", textTransform: "uppercase", fontFamily: SERIF, margin: 0 }}>
              Note to DM
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {!playerNoteSaved && (
                <span style={{ color: GOLD_MUTED, fontSize: "11px", fontFamily: SERIF, fontStyle: "italic" }}>
                  Unsaved changes
                </span>
              )}
              <button
                onClick={handleSavePlayerNote}
                disabled={updatePlayerNote.isPending || playerNoteSaved}
                style={{
                  background: playerNoteSaved ? "rgba(201,168,76,0.1)" : "linear-gradient(135deg, #8b6914, #c9a84c)",
                  color: playerNoteSaved ? GOLD_MUTED : "#1a1a2e",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 16px",
                  fontSize: "12px",
                  fontFamily: SERIF,
                  fontWeight: "bold",
                  cursor: playerNoteSaved ? "default" : "pointer",
                  opacity: playerNoteSaved ? 0.6 : 1,
                }}
              >
                {updatePlayerNote.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
          <textarea
            value={playerNote}
            onChange={(e) => { setPlayerNote(e.target.value); setPlayerNoteSaved(false); }}
            placeholder="Write a note for your DM..."
            style={{
              width: "100%",
              minHeight: "100px",
              background: "rgba(30,15,5,0.9)",
              border: "1px solid rgba(201,168,76,0.4)",
              color: GOLD_BRIGHT,
              fontFamily: SERIF,
              borderRadius: "6px",
              padding: "10px 14px",
              fontSize: "13px",
              lineHeight: "1.6",
              boxSizing: "border-box",
              outline: "none",
              resize: "vertical",
            }}
          />
        </div>

        <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "12px", padding: "60px 40px", textAlign: "center" }}>
          <p style={{ color: GOLD_MUTED, fontSize: "14px", fontFamily: SERIF }}>No notes from the DM yet.</p>
        </div>
      </div>
    );
  }

  const NOTES_PER_PAGE = 5;
  const pageNotes = typedNotes.slice(notePage * NOTES_PER_PAGE, (notePage + 1) * NOTES_PER_PAGE);
  const totalPages = Math.ceil(typedNotes.length / NOTES_PER_PAGE);

  const handleReact = (noteId: string, currentReaction: string | null, newReaction: "THUMBS_UP" | "THUMBS_DOWN") => {
    reactToNote.mutate({
      noteId,
      reaction: currentReaction === newReaction ? null : newReaction,
    });
  };

  return (
    <div>
      {/* Note to DM */}
      <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px", padding: "28px 32px", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", paddingBottom: "8px", borderBottom: "1px solid rgba(201,168,76,0.2)" }}>
          <p style={{ color: GOLD, fontSize: "12px", fontWeight: "bold", letterSpacing: "2px", textTransform: "uppercase", fontFamily: SERIF, margin: 0 }}>
            Note to DM
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {!playerNoteSaved && (
              <span style={{ color: GOLD_MUTED, fontSize: "11px", fontFamily: SERIF, fontStyle: "italic" }}>
                Unsaved changes
              </span>
            )}
            <button
              onClick={handleSavePlayerNote}
              disabled={updatePlayerNote.isPending || playerNoteSaved}
              style={{
                background: playerNoteSaved ? "rgba(201,168,76,0.1)" : "linear-gradient(135deg, #8b6914, #c9a84c)",
                color: playerNoteSaved ? GOLD_MUTED : "#1a1a2e",
                border: "none",
                borderRadius: "6px",
                padding: "6px 16px",
                fontSize: "12px",
                fontFamily: SERIF,
                fontWeight: "bold",
                cursor: playerNoteSaved ? "default" : "pointer",
                opacity: playerNoteSaved ? 0.6 : 1,
              }}
            >
              {updatePlayerNote.isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
        <textarea
          value={playerNote}
          onChange={(e) => { setPlayerNote(e.target.value); setPlayerNoteSaved(false); }}
          placeholder="Write a note for your DM..."
          style={{
            width: "100%",
            minHeight: "100px",
            background: "rgba(30,15,5,0.9)",
            border: "1px solid rgba(201,168,76,0.4)",
            color: GOLD_BRIGHT,
            fontFamily: SERIF,
            borderRadius: "6px",
            padding: "10px 14px",
            fontSize: "13px",
            lineHeight: "1.6",
            boxSizing: "border-box",
            outline: "none",
            resize: "vertical",
          }}
        />
      </div>

    <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px", padding: "28px 32px" }}>
      <p style={{ color: GOLD, fontSize: "12px", fontWeight: "bold", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "16px", paddingBottom: "8px", borderBottom: "1px solid rgba(201,168,76,0.2)", fontFamily: SERIF }}>
        Notes from the Dungeon Master
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: totalPages > 1 ? "16px" : "0" }}>
        {pageNotes.map((note) => (
          <div key={note.id} style={{ background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: "8px", padding: "12px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ color: GOLD_MUTED, fontSize: "11px", fontFamily: SERIF }}>
                {new Date(note.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => handleReact(note.id, note.reaction, "THUMBS_UP")}
                  disabled={reactToNote.isPending}
                  style={{ background: "none", border: "none", fontSize: "16px", cursor: reactToNote.isPending ? "default" : "pointer", opacity: note.reaction === "THUMBS_UP" ? 1 : 0.4, transition: "opacity 0.15s" }}
                  title="Thumbs Up"
                >
                  👍
                </button>
                <button
                  onClick={() => handleReact(note.id, note.reaction, "THUMBS_DOWN")}
                  disabled={reactToNote.isPending}
                  style={{ background: "none", border: "none", fontSize: "16px", cursor: reactToNote.isPending ? "default" : "pointer", opacity: note.reaction === "THUMBS_DOWN" ? 1 : 0.4, transition: "opacity 0.15s" }}
                  title="Thumbs Down"
                >
                  👎
                </button>
              </div>
            </div>
            <p style={{ color: GOLD_BRIGHT, fontSize: "13px", fontFamily: SERIF, lineHeight: 1.6, whiteSpace: "pre-wrap", margin: 0 }}>
              {note.content}
            </p>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
          <button onClick={() => setNotePage((p) => Math.max(0, p - 1))} disabled={notePage === 0} style={{ background: "none", border: "1px solid rgba(201,168,76,0.3)", color: notePage === 0 ? GOLD_MUTED : GOLD, borderRadius: "4px", padding: "4px 12px", fontFamily: SERIF, fontSize: "11px", cursor: notePage === 0 ? "default" : "pointer", opacity: notePage === 0 ? 0.5 : 1 }}>
            Prev
          </button>
          <span style={{ color: GOLD_MUTED, fontSize: "11px", fontFamily: SERIF }}>{notePage + 1} / {totalPages}</span>
          <button onClick={() => setNotePage((p) => Math.min(totalPages - 1, p + 1))} disabled={notePage >= totalPages - 1} style={{ background: "none", border: "1px solid rgba(201,168,76,0.3)", color: notePage >= totalPages - 1 ? GOLD_MUTED : GOLD, borderRadius: "4px", padding: "4px 12px", fontFamily: SERIF, fontSize: "11px", cursor: notePage >= totalPages - 1 ? "default" : "pointer", opacity: notePage >= totalPages - 1 ? 0.5 : 1 }}>
            Next
          </button>
        </div>
      )}
    </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page content
// ---------------------------------------------------------------------------

function AdventureDetailContent() {
  const { user } = useAuth();
  const router = useRouter();
  const id = typeof router.query.id === "string" ? router.query.id : "";

  const [storySectionIndex, setStorySectionIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<TabKey | null>(null);

  const { data: adventure, isLoading } = api.adventure.getById.useQuery(
    { id },
    { enabled: !!id },
  );

  const isOwner = !!(adventure && user && adventure.userId === user.userId);

  const { data: unreadReactionCounts = [] } = api.adventure.getUnreadReactionCount.useQuery(
    undefined,
    { enabled: isOwner },
  );

  // Build a lookup map for the current adventure's character-level reaction counts
  const unreadReactionMap = useMemo(() => {
    const map: Record<string, number> = {};
    let total = 0;
    for (const entry of unreadReactionCounts as unknown as Array<{ adventureId: string; characterId: string; count: number }>) {
      if (adventure && entry.adventureId === adventure.id) {
        map[entry.characterId] = entry.count;
        total += entry.count;
      }
    }
    return { byCharacter: map, total };
  }, [unreadReactionCounts, adventure]);

  // Set default tab once adventure data is available
  const resolvedTab: TabKey = activeTab ?? (isOwner ? "story" : "mycharacter");

  // Count pending players from the adventure.players array
  const pendingPlayerCount = adventure
    ? ((adventure as unknown as { players?: Array<{ status: string }> }).players ?? []).filter(
        (p) => p.status === "PENDING",
      ).length
    : 0;

  // Build tabs dynamically — DM gets Story/Monsters/Items/SessionNotes/Players, Player gets MyCharacter/Inventory/DmNotes/SessionNotes
  const tabs: Array<{ key: string; label: string }> = isOwner
    ? [...DM_TABS, PLAYERS_TAB]
    : [...PLAYER_TABS];

  const adventureInfo = adventure
    ? ADVENTURE_LIST.find((a) => a.source === adventure.source)
    : null;

  if (isLoading || !id) {
    return (
      <p
        style={{
          color: "#a89060",
          fontSize: "14px",
          fontFamily: "'Georgia', 'Times New Roman', serif",
        }}
      >
        Loading adventure...
      </p>
    );
  }

  if (!adventure) {
    return (
      <div
        style={{
          background: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(201,168,76,0.2)",
          borderRadius: "12px",
          padding: "60px 40px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            color: "#a89060",
            fontSize: "14px",
            fontFamily: "'Georgia', 'Times New Roman', serif",
          }}
        >
          Adventure not found.
        </p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{adventure.name} — DnD Tool</title>
      </Head>

      {/* Breadcrumb */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "20px",
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: "13px",
          color: "#a89060",
        }}
      >
        <button
          onClick={() => void router.push("/adventures")}
          style={{
            background: "none",
            border: "none",
            color: "#c9a84c",
            cursor: "pointer",
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: "13px",
            padding: "0",
            textDecoration: "underline",
          }}
        >
          {isOwner ? "My Campaigns" : "My Adventures"}
        </button>
        <span>/</span>
        <span>{adventure.name}</span>
      </div>

      {/* Heading */}
      <h1
        style={{
          color: "#c9a84c",
          fontSize: "26px",
          fontWeight: "bold",
          letterSpacing: "2px",
          textTransform: "uppercase",
          marginBottom: "8px",
          fontFamily: "'Georgia', 'Times New Roman', serif",
        }}
      >
        {adventure.name}
      </h1>

      {/* Subtitle — book name */}
      {adventureInfo && (
        <p
          style={{
            color: "#a89060",
            fontSize: "14px",
            fontFamily: "'Georgia', 'Times New Roman', serif",
            marginBottom: "16px",
          }}
        >
          {adventureInfo.name}
        </p>
      )}

      {/* Divider */}
      <div
        style={{
          width: "80px",
          height: "2px",
          background: "#c9a84c",
          marginBottom: "24px",
          opacity: 0.6,
        }}
      />

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: "0",
          borderBottom: "1px solid rgba(201,168,76,0.3)",
          marginBottom: "24px",
        }}
      >
        {tabs.map((tab) => {
          const isActive = resolvedTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabKey)}
              style={{
                padding: "12px 24px",
                background: isActive ? "rgba(201,168,76,0.15)" : "transparent",
                border: "none",
                borderBottom: isActive
                  ? "2px solid #c9a84c"
                  : "2px solid transparent",
                color: isActive ? "#c9a84c" : "#a89060",
                fontSize: "14px",
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontWeight: "bold",
                letterSpacing: "1px",
                textTransform: "uppercase",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {tab.label}
              {tab.key === "players" && pendingPlayerCount > 0 && (
                <span
                  style={{
                    background: "#c9a84c",
                    color: "#1a1a2e",
                    borderRadius: "50%",
                    width: "20px",
                    height: "20px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: "bold",
                  }}
                >
                  {pendingPlayerCount}
                </span>
              )}
              {tab.key === "players" && unreadReactionMap.total > 0 && (
                <span
                  style={{
                    background: "#c9a84c",
                    color: "#1a1a2e",
                    borderRadius: "50%",
                    width: "20px",
                    height: "20px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: "bold",
                  }}
                  title={`${unreadReactionMap.total} new player reaction${unreadReactionMap.total > 1 ? "s" : ""}`}
                >
                  {unreadReactionMap.total}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {resolvedTab === "story" && isOwner && (
        <StoryTab
          source={adventure.source}
          sectionIndex={storySectionIndex}
          onSectionIndexChange={setStorySectionIndex}
        />
      )}
      {resolvedTab === "monsters" && isOwner && (
        <MonstersTab
          adventureId={adventure.id}
          adventureSource={adventure.source}
          monsters={adventure.monsters}
          onViewInStory={(idx) => {
            setStorySectionIndex(idx);
            setActiveTab("story");
          }}
        />
      )}
      {resolvedTab === "items" && isOwner && (
        <ItemsTab
          adventureId={adventure.id}
          adventureSource={adventure.source}
          items={adventure.items}
          acceptedPlayers={
            ((adventure as unknown as { players: Array<{ id: string; status: string; user: { id: string; username: string }; character: Record<string, unknown> | null }> }).players ?? [])
              .filter((p) => p.status === "ACCEPTED")
              .map((p) => ({ id: p.id, user: p.user, character: p.character }))
          }
          onViewInStory={(idx) => {
            setStorySectionIndex(idx);
            setActiveTab("story");
          }}
        />
      )}
      {resolvedTab === "players" && isOwner && (
        <PlayersTab adventureId={adventure.id} adventureItems={adventure.items} unreadReactionByCharacter={unreadReactionMap.byCharacter} />
      )}
      {resolvedTab === "sessionnotes" && (
        <SessionNotesTab adventureId={adventure.id} />
      )}
      {resolvedTab === "mycharacter" && !isOwner && (
        <MyCharacterTab adventure={adventure as unknown as { id: string; players: Array<{ userId: string; status: string; character: Record<string, unknown> }> }} />
      )}
      {resolvedTab === "dmnotes" && !isOwner && (
        <PlayerDmNotesTab adventure={adventure as unknown as { id: string; players: Array<{ id: string; userId: string; status: string; playerNote?: string; character: { id: string } }> }} />
      )}
      {resolvedTab === "inventory" && !isOwner && (
        <InventoryTab
          adventure={
            adventure as unknown as {
              id: string;
              players: Array<{
                id: string;
                userId: string;
                status: string;
                character: Record<string, unknown>;
              }>;
            }
          }
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Page export
// ---------------------------------------------------------------------------

export default function AdventureDetailPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <AdventureDetailContent />
      </Layout>
    </ProtectedRoute>
  );
}
