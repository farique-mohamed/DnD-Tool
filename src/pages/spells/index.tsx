import Head from "next/head";
import { useState, useMemo } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { SPELLS, SPELL_SOURCES, type Spell } from "@/lib/spellsData";
import { SPELL_CLASSES, type SpellClass } from "@/lib/spellClassMap";

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

const SCHOOL_COLORS: Record<string, string> = {
  Abjuration: "#4a90d9",
  Conjuration: "#9b59b6",
  Divination: "#27ae60",
  Enchantment: "#e91e8c",
  Evocation: "#e74c3c",
  Illusion: "#8e44ad",
  Necromancy: "#7f8c8d",
  Transmutation: "#e67e22",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function levelLabel(level: number): string {
  if (level === 0) return "Cantrip";
  const suffixes = ["st", "nd", "rd"];
  const suffix = suffixes[level - 1] ?? "th";
  return `${level}${suffix}`;
}

function levelLabelFull(level: number): string {
  if (level === 0) return "Cantrip";
  const suffixes = ["st", "nd", "rd"];
  const suffix = suffixes[level - 1] ?? "th";
  return `${level}${suffix} Level`;
}

function schoolColor(school: string): string {
  return SCHOOL_COLORS[school] ?? GOLD;
}

// ---------------------------------------------------------------------------
// Spell list row
// ---------------------------------------------------------------------------

function SpellRow({
  spell,
  isActive,
  onClick,
}: {
  spell: Spell;
  isActive: boolean;
  onClick: () => void;
}) {
  const color = schoolColor(spell.school);

  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "10px 14px",
        background: isActive ? "rgba(201,168,76,0.1)" : "transparent",
        border: "none",
        borderLeft: isActive ? `3px solid ${GOLD}` : "3px solid transparent",
        borderBottom: `1px solid ${GOLD_BORDER}`,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
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
      {/* Name + school dot + level badge + source badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
        <span
          style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            background: color,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            color: isActive ? GOLD : GOLD_BRIGHT,
            fontSize: "13px",
            fontFamily: SERIF,
            fontWeight: isActive ? "bold" : "normal",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            flex: 1,
            minWidth: 0,
          }}
        >
          {spell.name}
        </span>
        {/* Source badge */}
        <span
          style={{
            flexShrink: 0,
            background: "rgba(74,144,217,0.1)",
            border: "1px solid rgba(74,144,217,0.35)",
            borderRadius: "3px",
            padding: "0px 5px",
            color: "#7ab4e0",
            fontSize: "10px",
            fontFamily: SERIF,
            letterSpacing: "0.3px",
          }}
        >
          {spell.source}
        </span>
        {/* Level badge */}
        <span
          style={{
            flexShrink: 0,
            background: "rgba(201,168,76,0.1)",
            border: `1px solid rgba(201,168,76,0.3)`,
            borderRadius: "3px",
            padding: "0px 5px",
            color: GOLD_MUTED,
            fontSize: "10px",
            fontFamily: SERIF,
            letterSpacing: "0.3px",
          }}
        >
          {levelLabel(spell.level)}
        </span>
      </div>

      {/* School · Cast · Range */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "nowrap",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            color: color,
            fontSize: "10px",
            fontFamily: SERIF,
            flexShrink: 0,
            opacity: 0.85,
          }}
        >
          {spell.school}
        </span>
        <span style={{ color: TEXT_DIM, fontSize: "10px", fontFamily: SERIF, flexShrink: 0 }}>
          {spell.castingTime}
        </span>
        <span
          style={{
            color: TEXT_DIM,
            fontSize: "10px",
            fontFamily: SERIF,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {spell.range}
        </span>
      </div>

      {/* Duration · Components */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "nowrap",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            color: TEXT_DIM,
            fontSize: "10px",
            fontFamily: SERIF,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            flex: 1,
            minWidth: 0,
          }}
        >
          {spell.duration}
        </span>
        <span
          style={{
            color: GOLD_MUTED,
            fontSize: "10px",
            fontFamily: SERIF,
            flexShrink: 0,
          }}
        >
          {spell.components}
        </span>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Spell detail panel (right side)
// ---------------------------------------------------------------------------

function SpellDetailPanel({ spell }: { spell: Spell }) {
  const color = schoolColor(spell.school);

  const metaRows: Array<{ label: string; value: string }> = [
    { label: "Casting Time", value: spell.castingTime },
    { label: "Range", value: spell.range },
    { label: "Duration", value: spell.duration },
    { label: "Components", value: spell.components },
    { label: "Source", value: spell.source },
  ];

  return (
    <div
      style={{
        flex: 2,
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
          {spell.name}
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
          {levelLabelFull(spell.level)}
          {spell.level > 0 && " · "}
          <span style={{ color: color }}>{spell.school}</span>
        </p>
      </div>

      {/* School badge + level badge + source badge */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <span
          style={{
            background: "rgba(0,0,0,0.4)",
            border: `1px solid ${color}`,
            borderRadius: "6px",
            padding: "4px 12px",
            color: color,
            fontSize: "12px",
            fontFamily: SERIF,
            fontWeight: "bold",
          }}
        >
          {spell.school}
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
          {levelLabelFull(spell.level)}
        </span>
        <span
          style={{
            background: "rgba(74,144,217,0.1)",
            border: "1px solid rgba(74,144,217,0.35)",
            borderRadius: "6px",
            padding: "4px 12px",
            color: "#7ab4e0",
            fontSize: "12px",
            fontFamily: SERIF,
          }}
        >
          {spell.source}
        </span>
      </div>

      {/* Gradient divider */}
      <div
        style={{
          height: "1px",
          background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
          opacity: 0.5,
        }}
      />

      {/* Meta stats */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {metaRows.map(({ label, value }) => (
          <div
            key={label}
            style={{ display: "flex", gap: "8px", alignItems: "baseline" }}
          >
            <span
              style={{
                color: GOLD,
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "1.2px",
                fontFamily: SERIF,
                minWidth: "96px",
                flexShrink: 0,
              }}
            >
              {label}
            </span>
            <span
              style={{
                color: GOLD_BRIGHT,
                fontSize: "13px",
                fontFamily: SERIF,
                lineHeight: "1.5",
              }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Classes */}
      <div>
        <div
          style={{
            color: GOLD,
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "1.2px",
            fontFamily: SERIF,
            marginBottom: "8px",
          }}
        >
          Classes
        </div>
        {spell.classes.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {spell.classes.map((cls) => (
              <span
                key={cls}
                style={{
                  background: "rgba(201,168,76,0.1)",
                  border: "1px solid rgba(201,168,76,0.35)",
                  borderRadius: "6px",
                  padding: "3px 10px",
                  color: GOLD_BRIGHT,
                  fontSize: "11px",
                  fontFamily: SERIF,
                }}
              >
                {cls}
              </span>
            ))}
          </div>
        ) : (
          <span
            style={{
              color: TEXT_DIM,
              fontSize: "12px",
              fontFamily: SERIF,
              fontStyle: "italic",
            }}
          >
            Unknown / Non-class spell
          </span>
        )}
      </div>

      {/* Gradient divider */}
      <div
        style={{
          height: "1px",
          background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
          opacity: 0.5,
        }}
      />

      {/* Description */}
      <div>
        <div
          style={{
            color: GOLD,
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "1.2px",
            fontFamily: SERIF,
            marginBottom: "10px",
          }}
        >
          Description
        </div>
        <p
          style={{
            color: TEXT_DIM,
            fontSize: "13px",
            fontFamily: SERIF,
            lineHeight: "1.7",
            margin: 0,
            whiteSpace: "pre-wrap",
          }}
        >
          {spell.description}
        </p>
      </div>

      {/* At Higher Levels */}
      {spell.higherLevel && (
        <div>
          <div
            style={{
              color: GOLD,
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "1.2px",
              fontFamily: SERIF,
              marginBottom: "8px",
            }}
          >
            At Higher Levels
          </div>
          <p
            style={{
              color: TEXT_DIM,
              fontSize: "13px",
              fontFamily: SERIF,
              lineHeight: "1.7",
              margin: 0,
              whiteSpace: "pre-wrap",
            }}
          >
            {spell.higherLevel}
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty detail placeholder
// ---------------------------------------------------------------------------

function SpellDetailEmpty() {
  return (
    <div
      style={{
        flex: 2,
        background: "rgba(0,0,0,0.4)",
        border: `1px solid ${GOLD_BORDER}`,
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 0,
        minHeight: 0,
      }}
    >
      <p
        style={{
          color: GOLD_MUTED,
          fontSize: "14px",
          fontFamily: SERIF,
          fontStyle: "italic",
        }}
      >
        Select a spell to view its details.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter chip helpers
// ---------------------------------------------------------------------------

function makeChipStyle(active: boolean): React.CSSProperties {
  const base: React.CSSProperties = {
    border: "1px solid rgba(201,168,76,0.4)",
    borderRadius: "20px",
    padding: "4px 12px",
    fontSize: "11px",
    fontFamily: SERIF,
    cursor: "pointer",
    transition: "background 0.15s, color 0.15s",
    letterSpacing: "0.3px",
  };
  if (active) {
    return {
      ...base,
      background: "linear-gradient(135deg, #8b6914, #c9a84c)",
      color: "#1a1a2e",
      fontWeight: "bold",
      border: `1px solid ${GOLD}`,
    };
  }
  return { ...base, background: "transparent", color: GOLD_MUTED };
}

// ---------------------------------------------------------------------------
// Main page content
// ---------------------------------------------------------------------------

function SpellsContent() {
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [selectedClass, setSelectedClass] = useState<SpellClass | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);

  const availableLevels = useMemo(() => {
    return Array.from(new Set(SPELLS.map((s) => s.level))).sort((a, b) => a - b);
  }, []);

  const filteredSpells = useMemo(() => {
    return SPELLS.filter((spell) => {
      if (selectedSource && spell.source !== selectedSource) return false;
      if (selectedLevel !== null && spell.level !== selectedLevel) return false;
      if (selectedClass && !spell.classes.includes(selectedClass)) return false;
      if (searchQuery && !spell.name.toLowerCase().includes(searchQuery.toLowerCase()))
        return false;
      return true;
    });
  }, [selectedSource, selectedLevel, selectedClass, searchQuery]);

  const handleSelect = (spell: Spell) => {
    setSelectedSpell(spell);
  };

  const handleSourceFilter = (src: string | null) => {
    setSelectedSource(src);
  };

  const handleLevelFilter = (level: number | null) => {
    setSelectedLevel(level);
  };

  const handleClassFilter = (cls: SpellClass | null) => {
    setSelectedClass(cls);
  };

  return (
    <>
      <Head>
        <title>Spell Compendium — DnD Tool</title>
      </Head>

      {/* Outer wrapper fills viewport height minus Layout padding */}
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
            Spell Compendium
          </h1>
          <p
            style={{
              color: GOLD_MUTED,
              fontSize: "14px",
              marginBottom: "12px",
              fontFamily: SERIF,
            }}
          >
            Browse and filter the arcane arts.
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

        {/* Two-column layout: list (flex:3) | detail (flex:2) */}
        <div
          style={{
            display: "flex",
            gap: "24px",
            flex: 1,
            overflow: "hidden",
            minHeight: 0,
          }}
        >
          {/* Left column: filters + spell list — takes more horizontal space */}
          <div
            style={{
              flex: 3,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              height: "100%",
              overflow: "hidden",
            }}
          >
            {/* Search */}
            <input
              type="text"
              placeholder="Search spells..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "rgba(30,15,5,0.9)",
                border: "1px solid rgba(201,168,76,0.4)",
                borderRadius: "6px",
                color: GOLD_BRIGHT,
                fontSize: "13px",
                fontFamily: SERIF,
                outline: "none",
                boxSizing: "border-box",
              }}
            />

            {/* Source filter */}
            <div
              style={{
                background: "rgba(0,0,0,0.4)",
                border: `1px solid ${GOLD_BORDER}`,
                borderRadius: "8px",
                padding: "10px 12px",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  color: "#b8934a",
                  fontSize: "9px",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontFamily: SERIF,
                  marginBottom: "7px",
                }}
              >
                Source
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                <button
                  onClick={() => handleSourceFilter(null)}
                  style={makeChipStyle(selectedSource === null)}
                >
                  All
                </button>
                {SPELL_SOURCES.map((src) => (
                  <button
                    key={src}
                    onClick={() =>
                      handleSourceFilter(selectedSource === src ? null : src)
                    }
                    style={makeChipStyle(selectedSource === src)}
                  >
                    {src}
                  </button>
                ))}
              </div>
            </div>

            {/* Class filter */}
            <div
              style={{
                background: "rgba(0,0,0,0.4)",
                border: `1px solid ${GOLD_BORDER}`,
                borderRadius: "8px",
                padding: "10px 12px",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  color: "#b8934a",
                  fontSize: "9px",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontFamily: SERIF,
                  marginBottom: "7px",
                }}
              >
                Class
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                <button
                  onClick={() => handleClassFilter(null)}
                  style={makeChipStyle(selectedClass === null)}
                >
                  All
                </button>
                {SPELL_CLASSES.map((cls) => (
                  <button
                    key={cls}
                    onClick={() =>
                      handleClassFilter(selectedClass === cls ? null : cls)
                    }
                    style={makeChipStyle(selectedClass === cls)}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>

            {/* Level filter */}
            <div
              style={{
                background: "rgba(0,0,0,0.4)",
                border: `1px solid ${GOLD_BORDER}`,
                borderRadius: "8px",
                padding: "10px 12px",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  color: "#b8934a",
                  fontSize: "9px",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontFamily: SERIF,
                  marginBottom: "7px",
                }}
              >
                Level
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                <button
                  onClick={() => handleLevelFilter(null)}
                  style={makeChipStyle(selectedLevel === null)}
                >
                  All
                </button>
                {availableLevels.map((level) => (
                  <button
                    key={level}
                    onClick={() =>
                      handleLevelFilter(selectedLevel === level ? null : level)
                    }
                    style={makeChipStyle(selectedLevel === level)}
                  >
                    {levelLabelFull(level)}
                  </button>
                ))}
              </div>
            </div>

            {/* Results count */}
            <div
              style={{
                color: GOLD_MUTED,
                fontSize: "11px",
                fontFamily: SERIF,
                textAlign: "right",
                flexShrink: 0,
              }}
            >
              {filteredSpells.length} spell{filteredSpells.length !== 1 ? "s" : ""}
            </div>

            {/* Spell list — takes remaining flex space */}
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
              {filteredSpells.length === 0 ? (
                <div style={{ padding: "24px 16px", textAlign: "center" }}>
                  <p
                    style={{
                      color: GOLD_MUTED,
                      fontSize: "13px",
                      fontFamily: SERIF,
                    }}
                  >
                    No spells match your filters.
                  </p>
                </div>
              ) : (
                filteredSpells.map((spell) => (
                  <SpellRow
                    key={`${spell.name}|${spell.source}`}
                    spell={spell}
                    isActive={
                      selectedSpell?.name === spell.name &&
                      selectedSpell?.source === spell.source
                    }
                    onClick={() => handleSelect(spell)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right column: spell detail — smaller */}
          {selectedSpell ? (
            <SpellDetailPanel spell={selectedSpell} />
          ) : (
            <SpellDetailEmpty />
          )}
        </div>
      </div>
    </>
  );
}

export default function SpellsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <SpellsContent />
      </Layout>
    </ProtectedRoute>
  );
}
