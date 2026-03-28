import { type MonsterInfo, abilityMod } from "@/lib/bestiaryData";
import { GOLD, GOLD_BRIGHT, GOLD_MUTED, GOLD_BORDER, SERIF } from "./theme";

// ---------------------------------------------------------------------------
// Ability score block
// ---------------------------------------------------------------------------

export interface AbilityBlockProps {
  monster: MonsterInfo;
}

export function AbilityBlock({ monster }: AbilityBlockProps) {
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
