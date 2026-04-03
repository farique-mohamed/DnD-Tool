import { SPELLS } from "@/lib/spellsData";
import { SectionCounter, LimitReachedBanner, BrowseSpellRow } from "./SpellListItems";

// ---------------------------------------------------------------------------
// Browse mode sub-component for SpellSelectionSection
// ---------------------------------------------------------------------------

export function SpellBrowseMode({
  spellSearch,
  setSpellSearch,
  spellLevelFilter,
  setSpellLevelFilter,
  filteredCantrips,
  filteredLeveled,
  filteredSpells,
  localPrepared,
  toggleSpell,
  cantripsMax,
  spellsMax,
  spellManagement,
  preparedCantrips,
  preparedLeveled,
  cantripsAtLimit,
  leveledAtLimit,
  sourceBadgeStyle,
  autoCantrips = [],
}: {
  spellSearch: string;
  setSpellSearch: (v: string) => void;
  spellLevelFilter: number | null;
  setSpellLevelFilter: (v: number | null) => void;
  filteredCantrips: typeof SPELLS;
  filteredLeveled: typeof SPELLS;
  filteredSpells: typeof SPELLS;
  localPrepared: string[];
  toggleSpell: (name: string) => void;
  cantripsMax: number;
  spellsMax: number | null;
  spellManagement: "known" | "prepared" | null;
  preparedCantrips: string[];
  preparedLeveled: string[];
  cantripsAtLimit: boolean;
  leveledAtLimit: boolean;
  sourceBadgeStyle: React.CSSProperties;
  autoCantrips?: string[];
}) {
  const manualCantripsCount = preparedCantrips.filter(
    (n) => !autoCantrips.includes(n),
  ).length;

  // If a specific level filter is active, show flat list; otherwise group
  const showGrouped =
    spellLevelFilter === null &&
    filteredCantrips.length > 0 &&
    filteredLeveled.length > 0;

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "12px",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="Search spells..."
          value={spellSearch}
          onChange={(e) => setSpellSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: "180px",
            padding: "8px 12px",
            background: "rgba(30,15,5,0.9)",
            border: "1px solid rgba(201,168,76,0.4)",
            borderRadius: "6px",
            color: "#e8d5a3",
            fontSize: "13px",
            fontFamily: "'Georgia', serif",
            outline: "none",
          }}
        />
        <select
          value={spellLevelFilter ?? ""}
          onChange={(e) =>
            setSpellLevelFilter(
              e.target.value === "" ? null : Number(e.target.value),
            )
          }
          style={{
            padding: "8px 12px",
            background: "rgba(30,15,5,0.9)",
            border: "1px solid rgba(201,168,76,0.4)",
            borderRadius: "6px",
            color: "#e8d5a3",
            fontSize: "13px",
            fontFamily: "'Georgia', serif",
            outline: "none",
          }}
        >
          <option value="">All Levels</option>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((l) => (
            <option key={l} value={l}>
              {l === 0 ? "Cantrip" : `Level ${l}`}
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          maxHeight: "400px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        {showGrouped ? (
          <>
            {/* Cantrips group */}
            <SectionCounter
              label="Cantrips"
              current={manualCantripsCount}
              max={cantripsMax > 0 ? cantripsMax : null}
              type="known"
            />
            {cantripsAtLimit && <LimitReachedBanner label="cantrip" />}
            {filteredCantrips.slice(0, 100).map((spell) => (
              <BrowseSpellRow
                key={spell.name}
                spell={spell}
                isPrepared={localPrepared.includes(spell.name)}
                isAtLimit={cantripsAtLimit}
                toggleSpell={toggleSpell}
                sourceBadgeStyle={sourceBadgeStyle}
              />
            ))}

            {/* Divider */}
            <div
              style={{
                height: "1px",
                background: "rgba(201,168,76,0.12)",
                margin: "8px 0",
              }}
            />

            {/* Leveled spells group */}
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
            {leveledAtLimit && (
              <LimitReachedBanner
                label={
                  spellManagement === "prepared" ? "prepared spell" : "spell"
                }
              />
            )}
            {filteredLeveled.slice(0, 200).map((spell) => (
              <BrowseSpellRow
                key={spell.name}
                spell={spell}
                isPrepared={localPrepared.includes(spell.name)}
                isAtLimit={leveledAtLimit}
                toggleSpell={toggleSpell}
                sourceBadgeStyle={sourceBadgeStyle}
              />
            ))}
          </>
        ) : (
          <>
            {/* Flat list (when filtering by a specific level) */}
            {spellLevelFilter === 0 && cantripsAtLimit && (
              <LimitReachedBanner label="cantrip" />
            )}
            {spellLevelFilter !== null &&
              spellLevelFilter > 0 &&
              leveledAtLimit && (
                <LimitReachedBanner
                  label={
                    spellManagement === "prepared"
                      ? "prepared spell"
                      : "spell"
                  }
                />
              )}
            {filteredSpells.slice(0, 200).map((spell) => {
              const isCantrip = spell.level === 0;
              const atLimit = isCantrip ? cantripsAtLimit : leveledAtLimit;
              return (
                <BrowseSpellRow
                  key={spell.name}
                  spell={spell}
                  isPrepared={localPrepared.includes(spell.name)}
                  isAtLimit={atLimit}
                  toggleSpell={toggleSpell}
                  sourceBadgeStyle={sourceBadgeStyle}
                />
              );
            })}
          </>
        )}
        {filteredSpells.length > 200 && (
          <p
            style={{
              color: "#a89060",
              fontSize: "12px",
              fontFamily: "'Georgia', serif",
              textAlign: "center",
              padding: "8px",
            }}
          >
            Showing 200 of {filteredSpells.length} — use search to filter
          </p>
        )}
      </div>
    </div>
  );
}
