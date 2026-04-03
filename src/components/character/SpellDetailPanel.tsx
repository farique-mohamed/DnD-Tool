import { SPELLS } from "@/lib/spellsData";

// ---------------------------------------------------------------------------
// Spell detail panel (right column in non-browse mode)
// ---------------------------------------------------------------------------

export function SpellDetailPanel({ spellName }: { spellName: string | null }) {
  const selectedSpellData = spellName
    ? SPELLS.find((s) => s.name === spellName)
    : null;

  return (
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
  );
}
