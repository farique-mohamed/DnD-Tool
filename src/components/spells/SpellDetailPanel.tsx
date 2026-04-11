import type { Spell } from "@/lib/spellsData";

// ---------------------------------------------------------------------------
// Theme constants
// ---------------------------------------------------------------------------

const GOLD = "#c9a84c";
const GOLD_MUTED = "#a89060";
const GOLD_BRIGHT = "#e8d5a3";
const GOLD_DIM = "rgba(201,168,76,0.15)";
const GOLD_BORDER = "rgba(201,168,76,0.25)";
const TEXT_DIM = "rgba(232,213,163,0.6)";
const SERIF = "'EB Garamond', 'Georgia', serif";

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
// Spell detail panel
// ---------------------------------------------------------------------------

export function SpellDetailPanel({
  spell,
  isMobile,
  onBack,
}: {
  spell: Spell;
  isMobile?: boolean;
  onBack?: () => void;
}) {
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
        padding: isMobile ? "20px 16px" : "32px 36px",
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
      {/* Back button (mobile only) */}
      {isMobile && onBack && (
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: `1px solid ${GOLD_BORDER}`,
            borderRadius: "6px",
            padding: "6px 14px",
            color: GOLD,
            fontSize: "12px",
            fontFamily: SERIF,
            cursor: "pointer",
            alignSelf: "flex-start",
            letterSpacing: "0.5px",
          }}
        >
          &larr; Back to list
        </button>
      )}
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

export function SpellDetailEmpty({ isMobile }: { isMobile?: boolean }) {
  return (
    <div
      style={{
        flex: 2,
        background: "rgba(0,0,0,0.4)",
        border: `1px solid ${GOLD_BORDER}`,
        borderRadius: "12px",
        display: isMobile ? "none" : "flex",
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
