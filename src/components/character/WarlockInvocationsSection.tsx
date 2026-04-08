import { useState, useEffect, useCallback } from "react";
import type { CharacterData } from "./shared";

// Invocations Known per level (index 0 = level 1)
const INVOCATIONS_PHB = [
  0, 2, 2, 2, 3, 3, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 8, 8, 8,
];
const INVOCATIONS_XPHB = [
  1, 3, 3, 3, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 9, 10, 10, 10, 10,
];

function getStorageKey(characterId: string) {
  return `dnd_invocations_${characterId}`;
}

function loadInvocations(characterId: string): string[] {
  try {
    const raw = localStorage.getItem(getStorageKey(characterId));
    if (raw) {
      const parsed = JSON.parse(raw) as string[];
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch {
    // ignore
  }
  return [];
}

function saveInvocations(characterId: string, invocations: string[]) {
  localStorage.setItem(getStorageKey(characterId), JSON.stringify(invocations));
}

export function WarlockInvocationsSection({
  character,
}: {
  character: CharacterData;
}) {
  const table =
    character.rulesSource === "XPHB" ? INVOCATIONS_XPHB : INVOCATIONS_PHB;
  const maxKnown = table[character.level - 1] ?? 0;

  const [invocations, setInvocations] = useState<string[]>(() =>
    loadInvocations(character.id),
  );
  const [newInvocation, setNewInvocation] = useState("");

  useEffect(() => {
    saveInvocations(character.id, invocations);
  }, [character.id, invocations]);

  const addInvocation = useCallback(() => {
    const trimmed = newInvocation.trim();
    if (!trimmed) return;
    if (invocations.length >= maxKnown) return;
    if (invocations.includes(trimmed)) return;
    setInvocations((prev) => [...prev, trimmed]);
    setNewInvocation("");
  }, [newInvocation, invocations, maxKnown]);

  const removeInvocation = useCallback((name: string) => {
    setInvocations((prev) => prev.filter((n) => n !== name));
  }, []);

  if (maxKnown === 0) return null;

  const sectionTitle: React.CSSProperties = {
    color: "#c9a84c",
    fontSize: "12px",
    fontWeight: "bold",
    letterSpacing: "2px",
    textTransform: "uppercase",
    fontFamily: "'EB Garamond', 'Georgia', serif",
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
    fontFamily: "'EB Garamond', 'Georgia', serif",
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
    fontFamily: "'EB Garamond', 'Georgia', serif",
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
    fontFamily: "'EB Garamond', 'Georgia', serif",
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
        <span style={sectionTitle}>Eldritch Invocations</span>
        <span
          style={{
            color: "#a89060",
            fontSize: "11px",
            fontFamily: "'EB Garamond', 'Georgia', serif",
          }}
        >
          {invocations.length} / {maxKnown} known
        </span>
      </div>

      {/* Add invocation input */}
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
          value={newInvocation}
          onChange={(e) => setNewInvocation(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") addInvocation();
          }}
          placeholder={
            invocations.length >= maxKnown
              ? "Maximum invocations known"
              : "Add invocation name..."
          }
          disabled={invocations.length >= maxKnown}
          style={{
            ...inputStyle,
            opacity: invocations.length >= maxKnown ? 0.5 : 1,
          }}
        />
        <button
          onClick={addInvocation}
          disabled={
            !newInvocation.trim() || invocations.length >= maxKnown
          }
          style={{
            ...btnStyle,
            opacity:
              !newInvocation.trim() || invocations.length >= maxKnown
                ? 0.5
                : 1,
            cursor:
              !newInvocation.trim() || invocations.length >= maxKnown
                ? "default"
                : "pointer",
          }}
        >
          Add
        </button>
      </div>

      {/* Invocations list */}
      {invocations.length === 0 ? (
        <p
          style={{
            color: "#a89060",
            fontSize: "12px",
            fontFamily: "'EB Garamond', 'Georgia', serif",
            fontStyle: "italic",
            margin: 0,
          }}
        >
          No invocations added yet. Type an invocation name above to add it.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {invocations.map((name) => (
            <div
              key={name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(0,0,0,0.2)",
                border: "1px solid rgba(201,168,76,0.15)",
                borderRadius: "8px",
                padding: "8px 12px",
              }}
            >
              <span
                style={{
                  color: "#e8d5a3",
                  fontSize: "13px",
                  fontFamily: "'EB Garamond', 'Georgia', serif",
                  flex: 1,
                }}
              >
                {name}
              </span>
              <button
                onClick={() => removeInvocation(name)}
                style={removeBtnStyle}
                title="Remove invocation"
              >
                {"\u2715"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
