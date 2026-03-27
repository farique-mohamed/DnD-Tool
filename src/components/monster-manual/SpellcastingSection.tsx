import { type SpellcastingBlock } from "@/lib/bestiaryData";
import { GOLD, GOLD_BRIGHT, GOLD_BORDER, TEXT_DIM, SERIF } from "./theme";

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

export interface SpellcastingSectionProps {
  blocks: SpellcastingBlock[];
}

export function SpellcastingSection({ blocks }: SpellcastingSectionProps) {
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
