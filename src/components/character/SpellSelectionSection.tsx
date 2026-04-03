import { useState } from "react";
import { SPELLS } from "@/lib/spellsData";
import { type CharacterData } from "./shared";
import { SpellDetailPanel } from "./SpellDetailPanel";
import { SpellBrowseMode } from "./SpellBrowseMode";
import { SectionCounter, PreparedSpellRow } from "./SpellListItems";

// ---------------------------------------------------------------------------
// Spell Selection Section (extracted for reuse in both warlock and standard)
// ---------------------------------------------------------------------------

export interface SpellSelectionSectionProps {
  character: CharacterData;
  localPrepared: string[];
  browseMode: boolean;
  setBrowseMode: (v: boolean | ((prev: boolean) => boolean)) => void;
  spellSearch: string;
  setSpellSearch: (v: string) => void;
  spellLevelFilter: number | null;
  setSpellLevelFilter: (v: number | null) => void;
  filteredSpells: typeof SPELLS;
  toggleSpell: (name: string) => void;
  cantripsMax: number;
  spellsMax: number | null;
  spellManagement: "known" | "prepared" | null;
  autoCantrips?: string[];
}

// ---------------------------------------------------------------------------
// Cantrip / Leveled spell grouping helper
// ---------------------------------------------------------------------------

function splitByLevel(spellNames: string[]) {
  const cantrips: string[] = [];
  const leveled: string[] = [];
  for (const name of spellNames) {
    const spell = SPELLS.find((s) => s.name === name);
    if (spell && spell.level === 0) {
      cantrips.push(name);
    } else {
      leveled.push(name);
    }
  }
  return { cantrips, leveled };
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SpellSelectionSection({
  localPrepared,
  browseMode,
  setBrowseMode,
  spellSearch,
  setSpellSearch,
  spellLevelFilter,
  setSpellLevelFilter,
  filteredSpells,
  toggleSpell,
  cantripsMax,
  spellsMax,
  spellManagement,
  autoCantrips = [],
}: SpellSelectionSectionProps) {
  const [selectedPreparedSpell, setSelectedPreparedSpell] = useState<
    string | null
  >(null);

  // Source badge style (matching /spells compendium page)
  const sourceBadgeStyle: React.CSSProperties = {
    flexShrink: 0,
    background: "rgba(74,144,217,0.1)",
    border: "1px solid rgba(74,144,217,0.35)",
    borderRadius: "3px",
    padding: "0px 5px",
    color: "#7ab4e0",
    fontSize: "10px",
    fontFamily: "'Georgia', serif",
    letterSpacing: "0.3px",
  };

  // Split current prepared spells into cantrips vs leveled
  const { cantrips: preparedCantrips, leveled: preparedLeveled } =
    splitByLevel(localPrepared);

  // Split filtered (browsable) spells into cantrips vs leveled
  const filteredCantrips = filteredSpells.filter((s) => s.level === 0);
  const filteredLeveled = filteredSpells.filter((s) => s.level > 0);

  // Limit checks — auto-known cantrips don't count against the limit
  const manualCantripsCount = preparedCantrips.filter(
    (n) => !autoCantrips.includes(n),
  ).length;
  const cantripsAtLimit = cantripsMax > 0 && manualCantripsCount >= cantripsMax;
  const leveledAtLimit =
    spellsMax !== null && preparedLeveled.length >= spellsMax;

  // Section title label
  const sectionLabel =
    spellManagement === "prepared"
      ? "Prepared Spells"
      : spellManagement === "known"
        ? "Known Spells"
        : "Spells";

  return (
    <div>
      <div
        style={{
          height: "1px",
          background: "rgba(201,168,76,0.15)",
          margin: "24px 0",
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <div>
          <p
            style={{
              color: "#c9a84c",
              fontSize: "12px",
              fontWeight: "bold",
              letterSpacing: "2px",
              textTransform: "uppercase",
              fontFamily: "'Georgia', serif",
            }}
          >
            {sectionLabel}
          </p>
        </div>
        <button
          onClick={() => setBrowseMode((v) => !v)}
          style={{
            background: browseMode
              ? "linear-gradient(135deg, #8b6914, #c9a84c)"
              : "transparent",
            border: browseMode ? "none" : "1px solid rgba(201,168,76,0.4)",
            color: browseMode ? "#1a1a2e" : "#c9a84c",
            borderRadius: "6px",
            padding: "6px 16px",
            fontSize: "12px",
            fontFamily: "'Georgia', serif",
            cursor: "pointer",
            letterSpacing: "0.5px",
            fontWeight: browseMode ? "bold" : "normal",
          }}
        >
          {browseMode ? "Done" : "Manage Spells"}
        </button>
      </div>

      {browseMode ? (
        <SpellBrowseMode
          spellSearch={spellSearch}
          setSpellSearch={setSpellSearch}
          spellLevelFilter={spellLevelFilter}
          setSpellLevelFilter={setSpellLevelFilter}
          filteredCantrips={filteredCantrips}
          filteredLeveled={filteredLeveled}
          filteredSpells={filteredSpells}
          localPrepared={localPrepared}
          toggleSpell={toggleSpell}
          cantripsMax={cantripsMax}
          spellsMax={spellsMax}
          spellManagement={spellManagement}
          preparedCantrips={preparedCantrips}
          preparedLeveled={preparedLeveled}
          cantripsAtLimit={cantripsAtLimit}
          leveledAtLimit={leveledAtLimit}
          sourceBadgeStyle={sourceBadgeStyle}
          autoCantrips={autoCantrips}
        />
      ) : localPrepared.length === 0 ? (
        <p
          style={{
            color: "#a89060",
            fontSize: "13px",
            fontFamily: "'Georgia', serif",
            fontStyle: "italic",
            padding: "16px 0",
          }}
        >
          No spells {spellManagement === "prepared" ? "prepared" : "known"}.
          Click &quot;Manage Spells&quot; to add some.
        </p>
      ) : (
        <div style={{ display: "flex", gap: "16px" }}>
          {/* Left column: spell list grouped by cantrips / leveled */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              maxHeight: "400px",
              overflowY: "auto",
            }}
          >
            {/* Cantrips section */}
            {preparedCantrips.length > 0 && (
              <>
                <SectionCounter
                  label="Cantrips"
                  current={manualCantripsCount}
                  max={cantripsMax > 0 ? cantripsMax : null}
                  type="known"
                />
                {preparedCantrips.map((spellName) => (
                  <PreparedSpellRow
                    key={spellName}
                    spellName={spellName}
                    isSelected={selectedPreparedSpell === spellName}
                    onSelect={() =>
                      setSelectedPreparedSpell(
                        selectedPreparedSpell === spellName ? null : spellName,
                      )
                    }
                    toggleSpell={toggleSpell}
                    sourceBadgeStyle={sourceBadgeStyle}
                    isCantrip={true}
                    isAutoKnown={autoCantrips.includes(spellName)}
                  />
                ))}
              </>
            )}

            {/* Leveled spells section */}
            {preparedLeveled.length > 0 && (
              <>
                <SectionCounter
                  label={
                    spellManagement === "prepared"
                      ? "Prepared Spells"
                      : "Leveled Spells"
                  }
                  current={preparedLeveled.length}
                  max={spellsMax}
                  type={spellManagement}
                />
                {preparedLeveled.map((spellName) => (
                  <PreparedSpellRow
                    key={spellName}
                    spellName={spellName}
                    isSelected={selectedPreparedSpell === spellName}
                    onSelect={() =>
                      setSelectedPreparedSpell(
                        selectedPreparedSpell === spellName ? null : spellName,
                      )
                    }
                    toggleSpell={toggleSpell}
                    sourceBadgeStyle={sourceBadgeStyle}
                    isCantrip={false}
                  />
                ))}
              </>
            )}
          </div>

          {/* Right column: spell detail */}
          <SpellDetailPanel spellName={selectedPreparedSpell} />
        </div>
      )}
    </div>
  );
}
