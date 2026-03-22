import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
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

const TABS = [
  { key: "story", label: "Story" },
  { key: "monsters", label: "Monsters" },
  { key: "items", label: "Items" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

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
// Main page content
// ---------------------------------------------------------------------------

function AdventureDetailContent() {
  const { user } = useAuth();
  const router = useRouter();
  const id = typeof router.query.id === "string" ? router.query.id : "";

  const [activeTab, setActiveTab] = useState<TabKey>("story");
  const [storySectionIndex, setStorySectionIndex] = useState(0);

  useEffect(() => {
    if (user && user.role !== "DUNGEON_MASTER" && user.role !== "ADMIN") {
      void router.replace("/unauthorized");
    }
  }, [user, router]);

  const { data: adventure, isLoading } = api.adventure.getById.useQuery(
    { id },
    { enabled: !!id },
  );

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
          My Adventures
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
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
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
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "story" && (
        <StoryTab
          source={adventure.source}
          sectionIndex={storySectionIndex}
          onSectionIndexChange={setStorySectionIndex}
        />
      )}
      {activeTab === "monsters" && (
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
      {activeTab === "items" && (
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
