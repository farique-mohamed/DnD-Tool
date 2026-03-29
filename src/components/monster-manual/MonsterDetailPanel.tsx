import { type MonsterInfo, crLabel } from "@/lib/bestiaryData";
import { parseTaggedText } from "@/lib/dndTagParser";
import {
  GOLD,
  GOLD_BRIGHT,
  GOLD_MUTED,
  GOLD_DIM,
  GOLD_BORDER,
  TEXT_DIM,
  SERIF,
  LABEL,
  BODY,
  getCrColor,
} from "./theme";
import { AbilityBlock } from "./AbilityBlock";
import { ActionList } from "./ActionList";
import { SpellcastingSection } from "./SpellcastingSection";

// ---------------------------------------------------------------------------
// Monster detail panel (right side)
// ---------------------------------------------------------------------------

export interface MonsterDetailPanelProps {
  monster: MonsterInfo;
  isMobile?: boolean;
  onBack?: () => void;
}

export function MonsterDetailPanel({ monster, isMobile, onBack }: MonsterDetailPanelProps) {
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
            background: "transparent",
            border: `1px solid rgba(201,168,76,0.4)`,
            color: GOLD,
            borderRadius: "4px",
            padding: "6px 14px",
            fontSize: "13px",
            fontFamily: SERIF,
            cursor: "pointer",
            alignSelf: "flex-start",
          }}
        >
          &#8249; Back to list
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
