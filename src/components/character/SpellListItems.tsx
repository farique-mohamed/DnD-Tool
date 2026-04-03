import { SPELLS } from "@/lib/spellsData";

// ---------------------------------------------------------------------------
// Shared small components for spell lists
// ---------------------------------------------------------------------------

// Section header with counter badge
export function SectionCounter({
  label,
  current,
  max,
  type,
}: {
  label: string;
  current: number;
  max: number | null;
  type: "known" | "prepared" | null;
}) {
  const atLimit = max !== null && current >= max;
  const typeLabel = type === "prepared" ? "prepared" : "known";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "8px",
        marginTop: "4px",
      }}
    >
      <span
        style={{
          color: "#b8934a",
          fontSize: "11px",
          fontWeight: "bold",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          fontFamily: "'Georgia', serif",
        }}
      >
        {label}
      </span>
      {max !== null && (
        <span
          style={{
            color: atLimit ? "#c9a84c" : "#a89060",
            fontSize: "11px",
            fontFamily: "'Georgia', serif",
            background: atLimit
              ? "rgba(201,168,76,0.12)"
              : "transparent",
            border: atLimit
              ? "1px solid rgba(201,168,76,0.25)"
              : "1px solid transparent",
            borderRadius: "4px",
            padding: "2px 8px",
          }}
        >
          {current} / {max} {typeLabel}
        </span>
      )}
    </div>
  );
}

// Limit reached banner
export function LimitReachedBanner({ label }: { label: string }) {
  return (
    <div
      style={{
        background: "rgba(201,168,76,0.08)",
        border: "1px solid rgba(201,168,76,0.20)",
        borderRadius: "6px",
        padding: "6px 12px",
        marginBottom: "4px",
      }}
    >
      <span
        style={{
          color: "#c9a84c",
          fontSize: "11px",
          fontFamily: "'Georgia', serif",
          fontStyle: "italic",
        }}
      >
        {label.charAt(0).toUpperCase() + label.slice(1)} limit reached —
        remove one to add another
      </span>
    </div>
  );
}

// Browse mode spell row
export function BrowseSpellRow({
  spell,
  isPrepared,
  isAtLimit,
  toggleSpell,
  sourceBadgeStyle,
}: {
  spell: (typeof SPELLS)[number];
  isPrepared: boolean;
  isAtLimit: boolean;
  toggleSpell: (name: string) => void;
  sourceBadgeStyle: React.CSSProperties;
}) {
  const disabled = !isPrepared && isAtLimit;

  return (
    <div
      onClick={() => {
        if (!disabled) toggleSpell(spell.name);
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px 12px",
        borderRadius: "6px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
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
}

// Prepared-list spell row (non-browse mode)
export function PreparedSpellRow({
  spellName,
  isSelected,
  onSelect,
  toggleSpell,
  sourceBadgeStyle,
  isCantrip,
  isAutoKnown = false,
}: {
  spellName: string;
  isSelected: boolean;
  onSelect: () => void;
  toggleSpell: (name: string) => void;
  sourceBadgeStyle: React.CSSProperties;
  isCantrip: boolean;
  isAutoKnown?: boolean;
}) {
  const spellData = SPELLS.find((s) => s.name === spellName);

  return (
    <div
      onClick={onSelect}
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
      {isAutoKnown && (
        <span
          style={{
            fontSize: "9px",
            padding: "1px 6px",
            borderRadius: "3px",
            background: "rgba(74,124,42,0.15)",
            border: "1px solid rgba(74,124,42,0.35)",
            color: "#6aad45",
            fontFamily: "'Georgia', serif",
            letterSpacing: "0.5px",
            textTransform: "uppercase",
            fontWeight: "bold",
          }}
        >
          Auto
        </span>
      )}
      {spellData && (
        <>
          <span style={sourceBadgeStyle}>{spellData.source}</span>
          {isCantrip ? (
            <span
              style={{
                fontSize: "10px",
                padding: "2px 6px",
                borderRadius: "4px",
                background: "rgba(120,180,224,0.10)",
                border: "1px solid rgba(120,180,224,0.30)",
                color: "#7ab4e0",
                fontFamily: "'Georgia', serif",
              }}
            >
              Cantrip
            </span>
          ) : (
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
              Lv {spellData.level}
            </span>
          )}
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
      {!isAutoKnown && (
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
      )}
    </div>
  );
}
