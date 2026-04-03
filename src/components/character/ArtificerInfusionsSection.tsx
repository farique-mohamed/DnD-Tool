import { useState, useEffect, useCallback } from "react";
import type { CharacterData } from "./shared";

// Infusions Known per level (index 0 = level 1)
const INFUSIONS_KNOWN = [
  0, 4, 4, 4, 4, 6, 6, 6, 6, 8, 8, 8, 8, 10, 10, 10, 10, 12, 12, 12,
];

// Infused Items (active) per level (index 0 = level 1)
const INFUSED_ITEMS = [
  0, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6,
];

interface ActiveInfusion {
  name: string;
  note: string;
}

interface InfusionData {
  knownInfusions: string[];
  activeInfusions: ActiveInfusion[];
}

function getStorageKey(characterId: string) {
  return `dnd_infusions_${characterId}`;
}

function loadInfusionData(characterId: string): InfusionData {
  try {
    const raw = localStorage.getItem(getStorageKey(characterId));
    if (raw) {
      const parsed = JSON.parse(raw) as InfusionData;
      return {
        knownInfusions: Array.isArray(parsed.knownInfusions)
          ? parsed.knownInfusions
          : [],
        activeInfusions: Array.isArray(parsed.activeInfusions)
          ? parsed.activeInfusions
          : [],
      };
    }
  } catch {
    // ignore
  }
  return { knownInfusions: [], activeInfusions: [] };
}

function saveInfusionData(characterId: string, data: InfusionData) {
  localStorage.setItem(getStorageKey(characterId), JSON.stringify(data));
}

export function ArtificerInfusionsSection({
  character,
}: {
  character: CharacterData;
}) {
  const maxKnown = INFUSIONS_KNOWN[character.level - 1] ?? 0;
  const maxActive = INFUSED_ITEMS[character.level - 1] ?? 0;

  const [data, setData] = useState<InfusionData>(() =>
    loadInfusionData(character.id),
  );
  const [newInfusion, setNewInfusion] = useState("");

  useEffect(() => {
    saveInfusionData(character.id, data);
  }, [character.id, data]);

  const addInfusion = useCallback(() => {
    const trimmed = newInfusion.trim();
    if (!trimmed) return;
    if (data.knownInfusions.length >= maxKnown) return;
    if (data.knownInfusions.includes(trimmed)) return;
    setData((prev) => ({
      ...prev,
      knownInfusions: [...prev.knownInfusions, trimmed],
    }));
    setNewInfusion("");
  }, [newInfusion, data.knownInfusions, maxKnown]);

  const removeInfusion = useCallback((name: string) => {
    setData((prev) => ({
      knownInfusions: prev.knownInfusions.filter((n) => n !== name),
      activeInfusions: prev.activeInfusions.filter((a) => a.name !== name),
    }));
  }, []);

  const toggleActive = useCallback(
    (name: string) => {
      setData((prev) => {
        const isActive = prev.activeInfusions.some((a) => a.name === name);
        if (isActive) {
          return {
            ...prev,
            activeInfusions: prev.activeInfusions.filter(
              (a) => a.name !== name,
            ),
          };
        }
        if (prev.activeInfusions.length >= maxActive) return prev;
        return {
          ...prev,
          activeInfusions: [...prev.activeInfusions, { name, note: "" }],
        };
      });
    },
    [maxActive],
  );

  const updateNote = useCallback((name: string, note: string) => {
    setData((prev) => ({
      ...prev,
      activeInfusions: prev.activeInfusions.map((a) =>
        a.name === name ? { ...a, note } : a,
      ),
    }));
  }, []);

  if (maxKnown === 0) return null;

  const activeCount = data.activeInfusions.length;

  const sectionTitle: React.CSSProperties = {
    color: "#c9a84c",
    fontSize: "12px",
    fontWeight: "bold",
    letterSpacing: "2px",
    textTransform: "uppercase",
    fontFamily: "'Georgia', serif",
  };

  const cardStyle: React.CSSProperties = {
    background: "rgba(0,0,0,0.5)",
    border: "1px solid rgba(201,168,76,0.3)",
    borderRadius: "10px",
    padding: "14px 18px",
    marginBottom: "24px",
  };

  const inputStyle: React.CSSProperties = {
    padding: "6px 10px",
    background: "rgba(30,15,5,0.9)",
    border: "1px solid rgba(201,168,76,0.4)",
    borderRadius: "6px",
    color: "#e8d5a3",
    fontSize: "13px",
    fontFamily: "'Georgia', serif",
    outline: "none",
    flex: 1,
    minWidth: "0",
  };

  const btnStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, #8b6914, #c9a84c)",
    border: "none",
    borderRadius: "6px",
    color: "#1a0e00",
    fontSize: "12px",
    fontWeight: "bold",
    fontFamily: "'Georgia', serif",
    padding: "6px 14px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  const removeBtnStyle: React.CSSProperties = {
    background: "transparent",
    border: "1px solid rgba(201,168,76,0.3)",
    borderRadius: "4px",
    color: "#a89060",
    fontSize: "11px",
    fontFamily: "'Georgia', serif",
    padding: "2px 8px",
    cursor: "pointer",
  };

  return (
    <div style={cardStyle}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "14px",
          paddingBottom: "8px",
          borderBottom: "1px solid rgba(201,168,76,0.2)",
        }}
      >
        <span style={sectionTitle}>Artificer Infusions</span>
        <div style={{ display: "flex", gap: "12px" }}>
          <span
            style={{
              color: "#a89060",
              fontSize: "11px",
              fontFamily: "'Georgia', serif",
            }}
          >
            {data.knownInfusions.length} / {maxKnown} known
          </span>
          <span
            style={{
              color: "#a89060",
              fontSize: "11px",
              fontFamily: "'Georgia', serif",
            }}
          >
            {activeCount} / {maxActive} active
          </span>
        </div>
      </div>

      {/* Add infusion input */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "12px",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          value={newInfusion}
          onChange={(e) => setNewInfusion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addInfusion();
          }}
          placeholder={
            data.knownInfusions.length >= maxKnown
              ? "Maximum infusions known"
              : "Add infusion name..."
          }
          disabled={data.knownInfusions.length >= maxKnown}
          style={{
            ...inputStyle,
            opacity: data.knownInfusions.length >= maxKnown ? 0.5 : 1,
          }}
        />
        <button
          onClick={addInfusion}
          disabled={
            !newInfusion.trim() || data.knownInfusions.length >= maxKnown
          }
          style={{
            ...btnStyle,
            opacity:
              !newInfusion.trim() || data.knownInfusions.length >= maxKnown
                ? 0.5
                : 1,
            cursor:
              !newInfusion.trim() || data.knownInfusions.length >= maxKnown
                ? "default"
                : "pointer",
          }}
        >
          Add
        </button>
      </div>

      {/* Known infusions list */}
      {data.knownInfusions.length === 0 ? (
        <p
          style={{
            color: "#a89060",
            fontSize: "12px",
            fontFamily: "'Georgia', serif",
            fontStyle: "italic",
            margin: 0,
          }}
        >
          No infusions added yet. Type an infusion name above to add it.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {data.knownInfusions.map((name) => {
            const active = data.activeInfusions.find((a) => a.name === name);
            const isActive = !!active;
            const canActivate = isActive || activeCount < maxActive;

            return (
              <div
                key={name}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  background: isActive
                    ? "rgba(201,168,76,0.1)"
                    : "rgba(0,0,0,0.2)",
                  border: isActive
                    ? "1px solid rgba(201,168,76,0.4)"
                    : "1px solid rgba(201,168,76,0.15)",
                  borderRadius: "8px",
                  padding: "8px 12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  {/* Active toggle */}
                  <button
                    onClick={() => toggleActive(name)}
                    disabled={!canActivate}
                    title={
                      isActive
                        ? "Deactivate infusion"
                        : canActivate
                          ? "Activate infusion"
                          : "Maximum active infusions reached"
                    }
                    style={{
                      background: isActive
                        ? "rgba(201,168,76,0.4)"
                        : "transparent",
                      border: "1px solid #c9a84c",
                      borderRadius: "50%",
                      width: "20px",
                      height: "20px",
                      color: isActive ? "#8b6914" : "#c9a84c",
                      cursor: canActivate ? "pointer" : "default",
                      fontSize: "11px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "'Georgia', serif",
                      opacity: canActivate ? 1 : 0.4,
                      flexShrink: 0,
                    }}
                  >
                    {isActive ? "\u2714" : "\u25CB"}
                  </button>

                  {/* Name */}
                  <span
                    style={{
                      color: isActive ? "#e8d5a3" : "#a89060",
                      fontSize: "13px",
                      fontFamily: "'Georgia', serif",
                      flex: 1,
                    }}
                  >
                    {name}
                  </span>

                  {/* Active badge */}
                  {isActive && (
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "1px 6px",
                        borderRadius: "10px",
                        background: "rgba(74,124,42,0.15)",
                        border: "1px solid rgba(74,124,42,0.3)",
                        color: "#4a7c2a",
                        fontFamily: "'Georgia', serif",
                      }}
                    >
                      Active
                    </span>
                  )}

                  {/* Remove */}
                  <button
                    onClick={() => removeInfusion(name)}
                    style={removeBtnStyle}
                    title="Remove infusion"
                  >
                    \u2715
                  </button>
                </div>

                {/* Note field for active infusions */}
                {isActive && (
                  <input
                    type="text"
                    value={active?.note ?? ""}
                    onChange={(e) => updateNote(name, e.target.value)}
                    placeholder="Applied to item..."
                    style={{
                      ...inputStyle,
                      fontSize: "11px",
                      padding: "4px 8px",
                      marginLeft: "28px",
                      flex: "unset",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
