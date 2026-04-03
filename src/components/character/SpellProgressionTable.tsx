import { useState } from "react";
import { type CharacterData, mod } from "./shared";
import {
  isSpellcaster,
  isWarlock,
  getCantripsKnown,
  getSpellsKnownOrPrepared,
  getSpellManagementType,
  getSpellSlots,
} from "@/lib/spellSlotData";

const SPELLCASTING_ABILITY: Record<string, keyof CharacterData> = {
  Artificer: "intelligence",
  Bard: "charisma",
  Cleric: "wisdom",
  Druid: "wisdom",
  Paladin: "charisma",
  Ranger: "wisdom",
  Sorcerer: "charisma",
  Warlock: "charisma",
  Wizard: "intelligence",
};

/** Classes that never get cantrips from their base class progression. */
function classHasCantrips(
  className: string,
  rulesSource?: string,
): boolean {
  // Check if any level returns a non-zero cantrip count
  for (let lv = 1; lv <= 20; lv++) {
    if (getCantripsKnown(className, lv, rulesSource) > 0) return true;
  }
  return false;
}

export function SpellProgressionTable({
  character,
}: {
  character: CharacterData;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const className = character.characterClass;

  if (!isSpellcaster(className)) return null;

  const warlockMode = isWarlock(className);
  const managementType = getSpellManagementType(className);
  const abilityKey = SPELLCASTING_ABILITY[className];
  const abilityScore = abilityKey
    ? (character[abilityKey] as number)
    : 10;
  const abilityMod = mod(abilityScore);
  const hasCantrips = classHasCantrips(className, character.rulesSource);

  const knownOrPreparedLabel =
    managementType === "known" ? "Spells Known" : "Spells Prepared";

  // Build rows
  const rows: {
    level: number;
    cantrips: number;
    knownOrPrepared: number | null;
    slots: number[];
    // Warlock-specific
    pactSlotCount?: number;
    pactSlotLevel?: number;
  }[] = [];

  for (let lv = 1; lv <= 20; lv++) {
    const cantrips = getCantripsKnown(className, lv, character.rulesSource);
    const knownOrPrepared = getSpellsKnownOrPrepared(
      className,
      lv,
      abilityMod,
      character.rulesSource,
    );
    const slots = getSpellSlots(className, lv);

    if (warlockMode) {
      rows.push({
        level: lv,
        cantrips,
        knownOrPrepared,
        slots,
        pactSlotCount: slots[0],
        pactSlotLevel: slots[1],
      });
    } else {
      rows.push({ level: lv, cantrips, knownOrPrepared, slots });
    }
  }

  const thStyle: React.CSSProperties = {
    padding: "6px 8px",
    fontSize: "11px",
    fontWeight: "bold",
    color: "#c9a84c",
    fontFamily: "'Georgia', serif",
    textAlign: "center",
    borderBottom: "1px solid rgba(201,168,76,0.3)",
    whiteSpace: "nowrap",
  };

  const tdStyle: React.CSSProperties = {
    padding: "5px 8px",
    fontSize: "12px",
    color: "#e8d5a3",
    fontFamily: "'Georgia', serif",
    textAlign: "center",
    borderBottom: "1px solid rgba(201,168,76,0.1)",
  };

  const cell = (value: number | null | undefined) => {
    if (value === null || value === undefined || value === 0) return "\u2014";
    return String(value);
  };

  return (
    <div
      style={{
        marginBottom: "24px",
        border: "1px solid rgba(201,168,76,0.2)",
        borderRadius: "10px",
        overflow: "hidden",
      }}
    >
      {/* Toggle header */}
      <button
        onClick={() => setIsOpen((p) => !p)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          width: "100%",
          padding: "12px 18px",
          background: "rgba(0,0,0,0.5)",
          border: "none",
          color: "#c9a84c",
          fontSize: "12px",
          fontWeight: "bold",
          letterSpacing: "2px",
          textTransform: "uppercase",
          fontFamily: "'Georgia', serif",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span>Spellcasting Progression</span>
        <span style={{ fontSize: "10px" }}>{isOpen ? "\u25BE" : "\u25B8"}</span>
      </button>

      {/* Collapsible table */}
      {isOpen && (
        <div
          style={{
            overflowX: "auto",
            background: "rgba(0,0,0,0.3)",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: warlockMode ? "400px" : "600px",
            }}
          >
            <thead>
              <tr>
                <th style={{ ...thStyle, textAlign: "left", paddingLeft: "14px" }}>
                  Lv
                </th>
                {hasCantrips && <th style={thStyle}>Cantrips</th>}
                <th style={thStyle}>{knownOrPreparedLabel}</th>
                {warlockMode ? (
                  <th style={thStyle}>Pact Slots</th>
                ) : (
                  <>
                    <th style={thStyle}>1st</th>
                    <th style={thStyle}>2nd</th>
                    <th style={thStyle}>3rd</th>
                    <th style={thStyle}>4th</th>
                    <th style={thStyle}>5th</th>
                    <th style={thStyle}>6th</th>
                    <th style={thStyle}>7th</th>
                    <th style={thStyle}>8th</th>
                    <th style={thStyle}>9th</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isCurrent = row.level === character.level;
                const rowStyle: React.CSSProperties = isCurrent
                  ? {
                      background: "rgba(201,168,76,0.15)",
                      border: "1px solid rgba(201,168,76,0.5)",
                    }
                  : {};

                return (
                  <tr key={row.level} style={rowStyle}>
                    <td
                      style={{
                        ...tdStyle,
                        textAlign: "left",
                        paddingLeft: "14px",
                        fontWeight: isCurrent ? "bold" : "normal",
                        color: isCurrent ? "#c9a84c" : "#e8d5a3",
                      }}
                    >
                      {row.level}
                    </td>
                    {hasCantrips && (
                      <td
                        style={{
                          ...tdStyle,
                          fontWeight: isCurrent ? "bold" : "normal",
                        }}
                      >
                        {cell(row.cantrips)}
                      </td>
                    )}
                    <td
                      style={{
                        ...tdStyle,
                        fontWeight: isCurrent ? "bold" : "normal",
                      }}
                    >
                      {row.knownOrPrepared !== null
                        ? row.knownOrPrepared
                        : "\u2014"}
                    </td>
                    {warlockMode ? (
                      <td
                        style={{
                          ...tdStyle,
                          fontWeight: isCurrent ? "bold" : "normal",
                        }}
                      >
                        {row.pactSlotCount && row.pactSlotLevel
                          ? `${row.pactSlotCount} \u00D7 Lv${row.pactSlotLevel}`
                          : "\u2014"}
                      </td>
                    ) : (
                      row.slots.map((slotCount, idx) => (
                        <td
                          key={idx}
                          style={{
                            ...tdStyle,
                            fontWeight: isCurrent ? "bold" : "normal",
                            color:
                              slotCount > 0
                                ? isCurrent
                                  ? "#c9a84c"
                                  : "#e8d5a3"
                                : "#a89060",
                          }}
                        >
                          {cell(slotCount)}
                        </td>
                      ))
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
