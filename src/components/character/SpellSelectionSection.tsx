import { useState } from "react";
import { SPELLS } from "@/lib/spellsData";
import { type CharacterData } from "./shared";

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
  isPreparedCaster: boolean;
  preparedMax: number | null;
}

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
  isPreparedCaster,
  preparedMax,
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

  // Find the selected spell's data for the detail panel
  const selectedSpellData = selectedPreparedSpell
    ? SPELLS.find((s) => s.name === selectedPreparedSpell)
    : null;

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
            {isPreparedCaster ? "Prepared Spells" : "Known Spells"}
          </p>
          {preparedMax !== null && (
            <p
              style={{
                color: "#a89060",
                fontSize: "12px",
                fontFamily: "'Georgia', serif",
                marginTop: "4px",
              }}
            >
              {localPrepared.length} / {preparedMax} prepared
            </p>
          )}
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
            {filteredSpells.slice(0, 200).map((spell) => {
              const isPrepared = localPrepared.includes(spell.name);
              return (
                <div
                  key={spell.name}
                  onClick={() => toggleSpell(spell.name)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    background: isPrepared
                      ? "rgba(201,168,76,0.1)"
                      : "rgba(0,0,0,0.3)",
                    border: isPrepared
                      ? "1px solid rgba(201,168,76,0.35)"
                      : "1px solid transparent",
                  }}
                >
                  <span
                    style={{
                      color: isPrepared ? "#c9a84c" : "#a89060",
                      fontSize: "14px",
                    }}
                  >
                    {isPrepared ? "●" : "○"}
                  </span>
                  <span
                    style={{
                      color: "#e8d5a3",
                      fontSize: "13px",
                      fontFamily: "'Georgia', serif",
                      flex: 1,
                    }}
                  >
                    {spell.name}
                  </span>
                  <span style={sourceBadgeStyle}>{spell.source}</span>
                  <span
                    style={{
                      fontSize: "10px",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background: "rgba(201,168,76,0.12)",
                      border: "1px solid rgba(201,168,76,0.25)",
                      color: "#c9a84c",
                      fontFamily: "'Georgia', serif",
                    }}
                  >
                    {spell.level === 0 ? "C" : spell.level}
                  </span>
                  <span
                    style={{
                      color: "#a89060",
                      fontSize: "11px",
                      fontFamily: "'Georgia', serif",
                      minWidth: "60px",
                      textAlign: "right",
                    }}
                  >
                    {spell.school}
                  </span>
                </div>
              );
            })}
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
          No spells prepared. Click &quot;Manage Spells&quot; to add some.
        </p>
      ) : (
        <div style={{ display: "flex", gap: "16px" }}>
          {/* Left column: spell list */}
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
            {localPrepared.map((spellName) => {
              const spellData = SPELLS.find((s) => s.name === spellName);
              const isSelected = selectedPreparedSpell === spellName;
              return (
                <div
                  key={spellName}
                  onClick={() =>
                    setSelectedPreparedSpell(isSelected ? null : spellName)
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    background: isSelected
                      ? "rgba(201,168,76,0.15)"
                      : "rgba(0,0,0,0.4)",
                    border: isSelected
                      ? "1px solid rgba(201,168,76,0.5)"
                      : "1px solid rgba(201,168,76,0.2)",
                    cursor: "pointer",
                  }}
                >
                  <span
                    style={{
                      color: "#e8d5a3",
                      fontSize: "13px",
                      fontFamily: "'Georgia', serif",
                      flex: 1,
                    }}
                  >
                    {spellName}
                  </span>
                  {spellData && (
                    <>
                      <span style={sourceBadgeStyle}>{spellData.source}</span>
                      <span
                        style={{
                          fontSize: "10px",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: "rgba(201,168,76,0.12)",
                          border: "1px solid rgba(201,168,76,0.25)",
                          color: "#c9a84c",
                          fontFamily: "'Georgia', serif",
                        }}
                      >
                        {spellData.level === 0
                          ? "Cantrip"
                          : `Lv ${spellData.level}`}
                      </span>
                      <span
                        style={{
                          color: "#a89060",
                          fontSize: "11px",
                          fontFamily: "'Georgia', serif",
                        }}
                      >
                        {spellData.school}
                      </span>
                    </>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSpell(spellName);
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#a89060",
                      cursor: "pointer",
                      fontSize: "14px",
                      padding: "0 4px",
                      lineHeight: 1,
                    }}
                    title="Remove spell"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>

          {/* Right column: spell detail */}
          <div
            style={{
              flex: 1,
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(201,168,76,0.3)",
              borderRadius: "10px",
              padding: "18px 20px",
              maxHeight: "400px",
              overflowY: "auto",
            }}
          >
            {selectedSpellData ? (
              <div>
                <h3
                  style={{
                    color: "#c9a84c",
                    fontSize: "16px",
                    fontWeight: "bold",
                    fontFamily: "'Georgia', serif",
                    marginBottom: "6px",
                    letterSpacing: "0.5px",
                  }}
                >
                  {selectedSpellData.name}
                </h3>
                <p
                  style={{
                    color: "#a89060",
                    fontSize: "12px",
                    fontFamily: "'Georgia', serif",
                    marginBottom: "12px",
                  }}
                >
                  {selectedSpellData.level === 0
                    ? "Cantrip"
                    : `Level ${selectedSpellData.level}`}{" "}
                  {selectedSpellData.school}
                  {" · "}
                  <span style={{ color: "#7ab4e0" }}>
                    {selectedSpellData.source}
                  </span>
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    marginBottom: "12px",
                  }}
                >
                  {[
                    {
                      label: "Casting Time",
                      value: selectedSpellData.castingTime,
                    },
                    { label: "Range", value: selectedSpellData.range },
                    { label: "Duration", value: selectedSpellData.duration },
                    {
                      label: "Components",
                      value: selectedSpellData.components,
                    },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: "flex", gap: "8px" }}>
                      <span
                        style={{
                          color: "#b8934a",
                          fontSize: "11px",
                          fontFamily: "'Georgia', serif",
                          minWidth: "90px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {label}
                      </span>
                      <span
                        style={{
                          color: "#e8d5a3",
                          fontSize: "12px",
                          fontFamily: "'Georgia', serif",
                        }}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    borderTop: "1px solid rgba(201,168,76,0.15)",
                    paddingTop: "10px",
                  }}
                >
                  <p
                    style={{
                      color: "#e8d5a3",
                      fontSize: "13px",
                      fontFamily: "'Georgia', serif",
                      lineHeight: 1.7,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {selectedSpellData.description}
                  </p>
                  {selectedSpellData.higherLevel && (
                    <div style={{ marginTop: "10px" }}>
                      <p
                        style={{
                          color: "#c9a84c",
                          fontSize: "12px",
                          fontWeight: "bold",
                          fontFamily: "'Georgia', serif",
                          marginBottom: "4px",
                        }}
                      >
                        At Higher Levels
                      </p>
                      <p
                        style={{
                          color: "#e8d5a3",
                          fontSize: "13px",
                          fontFamily: "'Georgia', serif",
                          lineHeight: 1.7,
                        }}
                      >
                        {selectedSpellData.higherLevel}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p
                style={{
                  color: "#a89060",
                  fontSize: "13px",
                  fontFamily: "'Georgia', serif",
                  fontStyle: "italic",
                  textAlign: "center",
                  paddingTop: "40px",
                }}
              >
                Select a spell to view its description
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
