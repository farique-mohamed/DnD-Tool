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
  { key: "sessionnotes", label: "Session Notes" },
] as const;

const PLAYERS_TAB = { key: "players" as const, label: "Players" };

type TabKey = "story" | "monsters" | "items" | "players" | "mycharacter" | "inventory" | "sessionnotes";

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
  onViewInStory,
}: {
  adventureId: string;
  adventureSource: string;
  items: { id: string; name: string; source: string; createdAt: Date }[];
  onViewInStory: (sectionIndex: number) => void;
}) {
  const utils = api.useUtils();
  const [showModal, setShowModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

function CharacterSheetModal({
  character,
  username,
  adventureId,
  toUserId,
  onClose,
}: {
  character: Record<string, unknown>;
  username: string;
  adventureId: string;
  toUserId: string;
  onClose: () => void;
}) {
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
        <div style={{ marginBottom: "24px" }}>
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

        {/* Divider */}
        <div
          style={{
            height: "1px",
            background: "rgba(201,168,76,0.3)",
            marginBottom: "24px",
          }}
        />

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

        {/* DM Notes Section */}
        <div style={{ marginTop: "8px" }}>
          <DmNotesSection
            adventureId={adventureId}
            characterId={characterId}
            toUserId={toUserId}
            playerNotes={notes}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Players Tab (DM only)
// ---------------------------------------------------------------------------

function PlayersTab({ adventureId }: { adventureId: string }) {
  const utils = api.useUtils();
  const [expandedPendingId, setExpandedPendingId] = useState<string | null>(null);
  const [sheetModalPlayer, setSheetModalPlayer] = useState<{
    character: Record<string, unknown>;
    username: string;
    userId: string;
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
  const isAuthor = !!(selectedNote && user && selectedNote.userId === user.userId);

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
          Session Notes
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
                {note.user.username} &mdash;{" "}
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
                      By {selectedNote.user.username} &mdash;{" "}
                      {new Date(selectedNote.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {isAuthor && (
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
                  )}
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
// Inventory Tab (placeholder)
// ---------------------------------------------------------------------------

function InventoryTab() {
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
        Inventory coming soon...
      </p>
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

  // Set default tab once adventure data is available
  const resolvedTab: TabKey = activeTab ?? (isOwner ? "story" : "mycharacter");

  // Count pending players from the adventure.players array
  const pendingPlayerCount = adventure
    ? ((adventure as unknown as { players?: Array<{ status: string }> }).players ?? []).filter(
        (p) => p.status === "PENDING",
      ).length
    : 0;

  // Build tabs dynamically — DM gets Story/Monsters/Items/SessionNotes/Players, Player gets MyCharacter/Inventory/SessionNotes
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
          onViewInStory={(idx) => {
            setStorySectionIndex(idx);
            setActiveTab("story");
          }}
        />
      )}
      {resolvedTab === "players" && isOwner && (
        <PlayersTab adventureId={adventure.id} />
      )}
      {resolvedTab === "sessionnotes" && (
        <SessionNotesTab adventureId={adventure.id} />
      )}
      {resolvedTab === "mycharacter" && !isOwner && (
        <MyCharacterTab adventure={adventure as unknown as { id: string; players: Array<{ userId: string; status: string; character: Record<string, unknown> }> }} />
      )}
      {resolvedTab === "inventory" && !isOwner && (
        <InventoryTab />
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
