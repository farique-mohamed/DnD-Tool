import Head from "next/head";
import { useState, useMemo } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import {
  MONSTER_LIST,
  type MonsterInfo,
  type SpellcastingBlock,
  abilityMod,
  crLabel,
} from "@/lib/bestiaryData";
import { parseTaggedText } from "@/lib/dndTagParser";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GOLD = "#c9a84c";
const GOLD_MUTED = "#a89060";
const GOLD_BRIGHT = "#e8d5a3";
const GOLD_DIM = "rgba(201,168,76,0.15)";
const GOLD_BORDER = "rgba(201,168,76,0.25)";
const TEXT_DIM = "rgba(232,213,163,0.6)";
const SERIF = "'Georgia', 'Times New Roman', serif";

const LABEL: React.CSSProperties = {
  color: GOLD,
  fontSize: "10px",
  textTransform: "uppercase",
  letterSpacing: "1.2px",
  fontFamily: SERIF,
  margin: 0,
  marginBottom: "4px",
};

const BODY: React.CSSProperties = {
  color: GOLD_BRIGHT,
  fontSize: "13px",
  fontFamily: SERIF,
  margin: 0,
  lineHeight: "1.5",
};

// ---------------------------------------------------------------------------
// Filter options
// ---------------------------------------------------------------------------

const CR_OPTIONS = [
  "All",
  "0",
  "1/8",
  "1/4",
  "1/2",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "20",
  "21",
  "22",
  "23",
  "24",
  "25",
  "26",
  "27",
  "28",
  "29",
  "30",
];

const CR_COLOR: Record<string, string> = {
  "0": "#6aaa6a",
  "1/8": "#6aaa6a",
  "1/4": "#82b04a",
  "1/2": "#a8b040",
  "1": "#c9a84c",
  "2": "#c9a84c",
  "3": "#c99040",
  "4": "#c97832",
  "5": "#c96028",
  "6": "#c94820",
  "7": "#c83018",
  "8": "#c82010",
  "9": "#c01010",
  "10": "#b80808",
};

function getCrColor(cr: string): string {
  return CR_COLOR[cr] ?? (parseFloat(cr) > 10 ? "#900000" : "#c9a84c");
}

// ---------------------------------------------------------------------------
// Ability score block
// ---------------------------------------------------------------------------

function AbilityBlock({ monster }: { monster: MonsterInfo }) {
  const abilities: Array<{ abbr: string; score: number }> = [
    { abbr: "STR", score: monster.str },
    { abbr: "DEX", score: monster.dex },
    { abbr: "CON", score: monster.con },
    { abbr: "INT", score: monster.int },
    { abbr: "WIS", score: monster.wis },
    { abbr: "CHA", score: monster.cha },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: "0",
        background: "rgba(201,168,76,0.06)",
        border: `1px solid ${GOLD_BORDER}`,
        borderRadius: "6px",
        overflow: "hidden",
      }}
    >
      {abilities.map(({ abbr, score }, idx) => {
        const mod = abilityMod(score);
        return (
          <div
            key={abbr}
            style={{
              flex: 1,
              textAlign: "center",
              padding: "8px 4px",
              borderRight:
                idx < abilities.length - 1
                  ? `1px solid ${GOLD_BORDER}`
                  : "none",
            }}
          >
            <div
              style={{
                color: GOLD,
                fontSize: "10px",
                fontFamily: SERIF,
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                marginBottom: "2px",
              }}
            >
              {abbr}
            </div>
            <div
              style={{
                color: GOLD_BRIGHT,
                fontSize: "13px",
                fontFamily: SERIF,
                fontWeight: "bold",
                lineHeight: 1,
              }}
            >
              {score}
            </div>
            <div
              style={{
                color: GOLD_MUTED,
                fontSize: "11px",
                fontFamily: SERIF,
              }}
            >
              {mod}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Action list renderer
// ---------------------------------------------------------------------------

function ActionList({
  title,
  actions,
}: {
  title: string;
  actions: MonsterInfo["actions"];
}) {
  if (actions.length === 0) return null;
  return (
    <div>
      <div
        style={{
          borderBottom: `1px solid ${GOLD_BORDER}`,
          marginBottom: "8px",
          paddingBottom: "3px",
        }}
      >
        <span
          style={{
            color: GOLD,
            fontSize: "12px",
            fontFamily: SERIF,
            fontStyle: "italic",
            fontWeight: "bold",
            letterSpacing: "0.5px",
          }}
        >
          {title}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {actions.map((action, idx) => (
          <div key={idx}>
            <span
              style={{
                color: GOLD_BRIGHT,
                fontSize: "13px",
                fontFamily: SERIF,
                fontWeight: "bold",
                fontStyle: "italic",
              }}
            >
              {action.name}.{" "}
            </span>
            <span
              style={{
                color: TEXT_DIM,
                fontSize: "13px",
                fontFamily: SERIF,
                lineHeight: "1.5",
              }}
            >
              {parseTaggedText(action.text)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Spellcasting section renderer
// ---------------------------------------------------------------------------

const SPELL_LEVEL_LABELS: Record<number, string> = {
  0: "Cantrips (at will)",
  1: "1st level",
  2: "2nd level",
  3: "3rd level",
  4: "4th level",
  5: "5th level",
  6: "6th level",
  7: "7th level",
  8: "8th level",
  9: "9th level",
};

function SpellcastingSection({
  blocks,
}: {
  blocks: SpellcastingBlock[];
}) {
  if (blocks.length === 0) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {blocks.map((block, blockIdx) => (
        <div key={blockIdx}>
          {/* Section header */}
          <div
            style={{
              borderBottom: `1px solid ${GOLD_BORDER}`,
              marginBottom: "8px",
              paddingBottom: "3px",
            }}
          >
            <span
              style={{
                color: GOLD,
                fontSize: "12px",
                fontFamily: SERIF,
                fontStyle: "italic",
                fontWeight: "bold",
                letterSpacing: "0.5px",
              }}
            >
              {block.name}
            </span>
          </div>

          {/* Header description (save DC, caster level, etc.) */}
          {block.headerEntries.map((entry, i) => (
            <p
              key={i}
              style={{
                color: TEXT_DIM,
                fontSize: "13px",
                fontFamily: SERIF,
                lineHeight: "1.5",
                margin: 0,
                marginBottom: "8px",
              }}
            >
              {entry}
            </p>
          ))}

          {/* At-will spells */}
          {block.willSpells.length > 0 && (
            <div style={{ marginBottom: "6px" }}>
              <span
                style={{
                  color: GOLD,
                  fontSize: "12px",
                  fontFamily: SERIF,
                  fontWeight: "bold",
                }}
              >
                At will:{" "}
              </span>
              <span
                style={{
                  color: GOLD_BRIGHT,
                  fontSize: "13px",
                  fontFamily: SERIF,
                  fontStyle: "italic",
                }}
              >
                {block.willSpells.join(", ")}
              </span>
            </div>
          )}

          {/* Daily spells */}
          {block.dailySpells.map(({ perDay, spellNames }, i) => (
            <div key={i} style={{ marginBottom: "6px" }}>
              <span
                style={{
                  color: GOLD,
                  fontSize: "12px",
                  fontFamily: SERIF,
                  fontWeight: "bold",
                }}
              >
                {perDay}/day each:{" "}
              </span>
              <span
                style={{
                  color: GOLD_BRIGHT,
                  fontSize: "13px",
                  fontFamily: SERIF,
                  fontStyle: "italic",
                }}
              >
                {spellNames.join(", ")}
              </span>
            </div>
          ))}

          {/* Levelled spells */}
          {block.spells.map(({ level, slots, spellNames }) => (
            <div key={level} style={{ marginBottom: "6px" }}>
              <span
                style={{
                  color: GOLD,
                  fontSize: "12px",
                  fontFamily: SERIF,
                  fontWeight: "bold",
                }}
              >
                {SPELL_LEVEL_LABELS[level] ?? `Level ${level}`}
                {slots !== null ? ` (${slots} slot${slots !== 1 ? "s" : ""})` : ""}
                {": "}
              </span>
              <span
                style={{
                  color: GOLD_BRIGHT,
                  fontSize: "13px",
                  fontFamily: SERIF,
                  fontStyle: "italic",
                }}
              >
                {spellNames.join(", ")}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Monster detail panel (right side)
// ---------------------------------------------------------------------------

function MonsterDetailPanel({ monster }: { monster: MonsterInfo }) {
  const statRows: Array<{ label: string; value: string }> = [];

  if (monster.ac !== null) {
    statRows.push({
      label: "Armor Class",
      value: `${monster.ac}${monster.acNote ? ` (${monster.acNote})` : ""}`,
    });
  }
  if (monster.hp !== null) {
    statRows.push({
      label: "Hit Points",
      value: `${monster.hp}${monster.hpFormula ? ` (${monster.hpFormula})` : ""}`,
    });
  }
  if (monster.speed) {
    statRows.push({ label: "Speed", value: monster.speed });
  }

  return (
    <div
      style={{
        flex: 1,
        background: "rgba(0,0,0,0.6)",
        border: `2px solid ${GOLD}`,
        borderRadius: "12px",
        boxShadow:
          "0 0 40px rgba(201,168,76,0.3), inset 0 0 60px rgba(0,0,0,0.5)",
        padding: "32px 36px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        minWidth: 0,
        minHeight: 0,
        height: "100%",
        overflowY: "auto",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div>
        <h2
          style={{
            color: GOLD,
            fontSize: "26px",
            fontWeight: "bold",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            fontFamily: SERIF,
            margin: 0,
            marginBottom: "6px",
          }}
        >
          {monster.name}
        </h2>
        <p
          style={{
            color: GOLD_MUTED,
            fontSize: "13px",
            fontFamily: SERIF,
            fontStyle: "italic",
            margin: 0,
          }}
        >
          {monster.size} {monster.type},{" "}
          <span style={{ color: TEXT_DIM }}>{monster.alignment}</span>
        </p>
      </div>

      {/* CR + source badge row */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <span
          style={{
            background: "rgba(0,0,0,0.4)",
            border: `1px solid ${getCrColor(monster.cr)}`,
            borderRadius: "6px",
            padding: "4px 12px",
            color: getCrColor(monster.cr),
            fontSize: "13px",
            fontFamily: SERIF,
            fontWeight: "bold",
          }}
        >
          {crLabel(monster.cr)}
        </span>
        <span
          style={{
            background: GOLD_DIM,
            border: `1px solid ${GOLD_BORDER}`,
            borderRadius: "6px",
            padding: "4px 12px",
            color: GOLD_MUTED,
            fontSize: "12px",
            fontFamily: SERIF,
          }}
        >
          {monster.source}
        </span>
      </div>

      {/* Divider */}
      <div
        style={{
          height: "1px",
          background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
          opacity: 0.5,
        }}
      />

      {/* Core stats (AC, HP, Speed) */}
      {statRows.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {statRows.map(({ label, value }) => (
            <div
              key={label}
              style={{ display: "flex", gap: "8px", alignItems: "baseline" }}
            >
              <span style={{ ...LABEL, margin: 0 }}>{label}</span>
              <span style={BODY}>{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Ability scores */}
      <AbilityBlock monster={monster} />

      {/* Secondary stats */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          fontSize: "13px",
          fontFamily: SERIF,
        }}
      >
        {monster.savingThrows && (
          <div>
            <span style={{ color: GOLD, fontWeight: "bold" }}>
              Saving Throws{" "}
            </span>
            <span style={{ color: GOLD_BRIGHT }}>{monster.savingThrows}</span>
          </div>
        )}
        {monster.skills && (
          <div>
            <span style={{ color: GOLD, fontWeight: "bold" }}>Skills </span>
            <span style={{ color: GOLD_BRIGHT }}>{monster.skills}</span>
          </div>
        )}
        {monster.damageResistances && (
          <div>
            <span style={{ color: GOLD, fontWeight: "bold" }}>
              Damage Resistances{" "}
            </span>
            <span style={{ color: GOLD_BRIGHT }}>
              {monster.damageResistances}
            </span>
          </div>
        )}
        {monster.damageImmunities && (
          <div>
            <span style={{ color: GOLD, fontWeight: "bold" }}>
              Damage Immunities{" "}
            </span>
            <span style={{ color: GOLD_BRIGHT }}>
              {monster.damageImmunities}
            </span>
          </div>
        )}
        {monster.conditionImmunities && (
          <div>
            <span style={{ color: GOLD, fontWeight: "bold" }}>
              Condition Immunities{" "}
            </span>
            <span style={{ color: GOLD_BRIGHT }}>
              {monster.conditionImmunities}
            </span>
          </div>
        )}
        {monster.senses && (
          <div>
            <span style={{ color: GOLD, fontWeight: "bold" }}>Senses </span>
            <span style={{ color: GOLD_BRIGHT }}>{monster.senses}</span>
          </div>
        )}
        {monster.languages && (
          <div>
            <span style={{ color: GOLD, fontWeight: "bold" }}>Languages </span>
            <span style={{ color: GOLD_BRIGHT }}>{monster.languages}</span>
          </div>
        )}
      </div>

      {/* Divider */}
      {(monster.traits.length > 0 ||
        monster.actions.length > 0 ||
        monster.legendaryActions.length > 0 ||
        monster.reactions.length > 0 ||
        monster.bonusActions.length > 0 ||
        monster.spellcasting.length > 0) && (
        <div
          style={{
            height: "1px",
            background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
            opacity: 0.5,
          }}
        />
      )}

      {/* Traits */}
      {monster.traits.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {monster.traits.map((trait, idx) => (
            <div key={idx}>
              <span
                style={{
                  color: GOLD_BRIGHT,
                  fontSize: "13px",
                  fontFamily: SERIF,
                  fontWeight: "bold",
                  fontStyle: "italic",
                }}
              >
                {trait.name}.{" "}
              </span>
              <span
                style={{
                  color: TEXT_DIM,
                  fontSize: "13px",
                  fontFamily: SERIF,
                  lineHeight: "1.5",
                }}
              >
                {parseTaggedText(trait.text)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Spellcasting */}
      <SpellcastingSection blocks={monster.spellcasting} />

      {/* Actions */}
      <ActionList title="Actions" actions={monster.actions} />
      <ActionList title="Bonus Actions" actions={monster.bonusActions} />
      <ActionList title="Reactions" actions={monster.reactions} />
      <ActionList title="Legendary Actions" actions={monster.legendaryActions} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Monster list row
// ---------------------------------------------------------------------------

function MonsterRow({
  monster,
  isActive,
  onClick,
}: {
  monster: MonsterInfo;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "12px 16px",
        background: isActive ? "rgba(201,168,76,0.12)" : "transparent",
        border: "none",
        borderLeft: isActive
          ? `3px solid ${GOLD}`
          : "3px solid transparent",
        borderBottom: `1px solid ${GOLD_BORDER}`,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        transition: "background 0.12s",
        fontFamily: SERIF,
      }}
      onMouseEnter={(e) => {
        if (!isActive)
          (e.currentTarget as HTMLButtonElement).style.background =
            "rgba(201,168,76,0.06)";
      }}
      onMouseLeave={(e) => {
        if (!isActive)
          (e.currentTarget as HTMLButtonElement).style.background =
            "transparent";
      }}
    >
      {/* CR badge */}
      <span
        style={{
          minWidth: "36px",
          textAlign: "center",
          background: "rgba(0,0,0,0.4)",
          border: `1px solid ${getCrColor(monster.cr)}`,
          borderRadius: "4px",
          padding: "1px 4px",
          color: getCrColor(monster.cr),
          fontSize: "11px",
          fontFamily: SERIF,
          fontWeight: "bold",
          flexShrink: 0,
        }}
      >
        {monster.cr === "Unknown" ? "?" : monster.cr}
      </span>

      {/* Name + type */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: isActive ? GOLD : GOLD_BRIGHT,
            fontSize: "13px",
            fontFamily: SERIF,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {monster.name}
        </div>
        <div
          style={{
            color: GOLD_MUTED,
            fontSize: "11px",
            fontFamily: SERIF,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {monster.type}
        </div>
      </div>

      {/* Source badge */}
      {monster.source && (
        <span
          style={{
            flexShrink: 0,
            background: "rgba(201,168,76,0.08)",
            border: `1px solid rgba(201,168,76,0.3)`,
            borderRadius: "4px",
            padding: "1px 5px",
            color: GOLD_MUTED,
            fontSize: "10px",
            fontFamily: SERIF,
            letterSpacing: "0.4px",
          }}
        >
          {monster.source}
        </span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main page content
// ---------------------------------------------------------------------------

const PAGE_SIZE = 80;

function MonsterManualContent() {
  const [query, setQuery] = useState("");
  const [crFilter, setCrFilter] = useState("All");
  const [selected, setSelected] = useState<MonsterInfo>(MONSTER_LIST[0]!);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return MONSTER_LIST.filter((m) => {
      const matchesQuery = q
        ? m.name.toLowerCase().includes(q) ||
          m.type.toLowerCase().includes(q) ||
          m.alignment.toLowerCase().includes(q)
        : true;
      const matchesCr = crFilter === "All" ? true : m.cr === crFilter;
      return matchesQuery && matchesCr;
    });
  }, [query, crFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visibleMonsters = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    setPage(0);
  };

  const handleCrFilter = (val: string) => {
    setCrFilter(val);
    setPage(0);
  };

  const handleSelect = (m: MonsterInfo) => {
    setSelected(m);
  };

  return (
    <>
      <Head>
        <title>Monster Manual — DnD Tool</title>
      </Head>

      {/* Outer wrapper: fills viewport height minus the main padding (40px top + 40px bottom) */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 80px)",
          overflow: "hidden",
        }}
      >
      {/* Page header */}
      <div style={{ marginBottom: "20px", flexShrink: 0 }}>
        <h1
          style={{
            color: GOLD,
            fontSize: "26px",
            fontWeight: "bold",
            letterSpacing: "2px",
            textTransform: "uppercase",
            marginBottom: "8px",
            fontFamily: SERIF,
          }}
        >
          Monster Manual
        </h1>
        <p style={{ color: GOLD_MUTED, fontSize: "14px", marginBottom: "12px", fontFamily: SERIF }}>
          Consult the ancient tome to know your foes.
        </p>
        <div
          style={{
            width: "80px",
            height: "2px",
            background: GOLD,
            opacity: 0.6,
          }}
        />
      </div>

      {/* Two-column layout: list | detail — fills remaining height */}
      <div style={{ display: "flex", gap: "24px", flex: 1, overflow: "hidden", minHeight: 0 }}>
        {/* Left: search + filters + list */}
        <div
          style={{
            width: "280px",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            height: "100%",
            overflow: "hidden",
          }}
        >
          {/* Search bar */}
          <input
            type="text"
            placeholder="Search monsters..."
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              background: "rgba(30,15,5,0.9)",
              border: `1px solid rgba(201,168,76,0.4)`,
              borderRadius: "6px",
              color: GOLD_BRIGHT,
              fontSize: "13px",
              fontFamily: SERIF,
              outline: "none",
              boxSizing: "border-box",
            }}
          />

          {/* CR filter */}
          <select
            value={crFilter}
            onChange={(e) => handleCrFilter(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              background: "rgba(30,15,5,0.9)",
              border: `1px solid rgba(201,168,76,0.4)`,
              borderRadius: "6px",
              color: GOLD_BRIGHT,
              fontSize: "13px",
              fontFamily: SERIF,
              outline: "none",
              cursor: "pointer",
              boxSizing: "border-box",
            }}
          >
            {CR_OPTIONS.map((cr) => (
              <option key={cr} value={cr}>
                {cr === "All" ? "All Challenge Ratings" : `CR ${cr}`}
              </option>
            ))}
          </select>

          {/* Results count */}
          <div
            style={{
              color: GOLD_MUTED,
              fontSize: "11px",
              fontFamily: SERIF,
              textAlign: "right",
            }}
          >
            {filtered.length} creature{filtered.length !== 1 ? "s" : ""}
          </div>

          {/* Monster list — takes remaining flex space */}
          <div
            style={{
              background: "rgba(0,0,0,0.5)",
              border: `1px solid ${GOLD_BORDER}`,
              borderRadius: "8px",
              overflow: "hidden",
              flex: 1,
              overflowY: "auto",
              minHeight: 0,
            }}
          >
            {visibleMonsters.length === 0 ? (
              <div style={{ padding: "24px 16px", textAlign: "center" }}>
                <p style={{ color: GOLD_MUTED, fontSize: "13px", fontFamily: SERIF }}>
                  No creatures match your search.
                </p>
              </div>
            ) : (
              visibleMonsters.map((monster) => (
                <MonsterRow
                  key={`${monster.name}-${monster.source}`}
                  monster={monster}
                  isActive={selected.name === monster.name && selected.source === monster.source}
                  onClick={() => handleSelect(monster)}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                gap: "6px",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                style={{
                  background: "transparent",
                  border: `1px solid rgba(201,168,76,0.4)`,
                  color: page === 0 ? GOLD_MUTED : GOLD,
                  borderRadius: "4px",
                  padding: "4px 10px",
                  fontSize: "12px",
                  fontFamily: SERIF,
                  cursor: page === 0 ? "default" : "pointer",
                  opacity: page === 0 ? 0.4 : 1,
                }}
              >
                ‹ Prev
              </button>
              <span
                style={{
                  color: GOLD_MUTED,
                  fontSize: "12px",
                  fontFamily: SERIF,
                  padding: "4px 8px",
                  lineHeight: "1.6",
                }}
              >
                {page + 1} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                style={{
                  background: "transparent",
                  border: `1px solid rgba(201,168,76,0.4)`,
                  color: page >= totalPages - 1 ? GOLD_MUTED : GOLD,
                  borderRadius: "4px",
                  padding: "4px 10px",
                  fontSize: "12px",
                  fontFamily: SERIF,
                  cursor: page >= totalPages - 1 ? "default" : "pointer",
                  opacity: page >= totalPages - 1 ? 0.4 : 1,
                }}
              >
                Next ›
              </button>
            </div>
          )}
        </div>

        {/* Right: monster detail */}
        <MonsterDetailPanel monster={selected} />
      </div>
      </div>
    </>
  );
}

export default function MonsterManualPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <MonsterManualContent />
      </Layout>
    </ProtectedRoute>
  );
}
