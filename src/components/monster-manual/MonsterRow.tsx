import { type MonsterInfo } from "@/lib/bestiaryData";
import { GOLD, GOLD_BRIGHT, GOLD_MUTED, SERIF, getCrColor } from "./theme";

// ---------------------------------------------------------------------------
// Monster list row
// ---------------------------------------------------------------------------

export interface MonsterRowProps {
  monster: MonsterInfo;
  isActive: boolean;
  onClick: () => void;
}

export function MonsterRow({ monster, isActive, onClick }: MonsterRowProps) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "12px 16px",
        background: isActive ? "rgba(201,168,76,0.12)" : "transparent",
        border: "none",
        borderLeft: isActive
          ? `3px solid ${GOLD}`
          : "3px solid transparent",
        borderBottom: `1px solid rgba(201,168,76,0.25)`,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        transition: "background 0.12s",
        fontFamily: SERIF,
      }}
      onMouseEnter={(e) => {
        if (!isActive)
          (e.currentTarget as HTMLButtonElement).style.background =
            "rgba(201,168,76,0.06)";
      }}
      onMouseLeave={(e) => {
        if (!isActive)
          (e.currentTarget as HTMLButtonElement).style.background =
            "transparent";
      }}
    >
      {/* CR badge */}
      <span
        style={{
          minWidth: "36px",
          textAlign: "center",
          background: "rgba(0,0,0,0.4)",
          border: `1px solid ${getCrColor(monster.cr)}`,
          borderRadius: "4px",
          padding: "1px 4px",
          color: getCrColor(monster.cr),
          fontSize: "11px",
          fontFamily: SERIF,
          fontWeight: "bold",
          flexShrink: 0,
        }}
      >
        {monster.cr === "Unknown" ? "?" : monster.cr}
      </span>

      {/* Name + type */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: isActive ? GOLD : GOLD_BRIGHT,
            fontSize: "13px",
            fontFamily: SERIF,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {monster.name}
        </div>
        <div
          style={{
            color: GOLD_MUTED,
            fontSize: "11px",
            fontFamily: SERIF,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {monster.type}
        </div>
      </div>

      {/* Source badge */}
      {monster.source && (
        <span
          style={{
            flexShrink: 0,
            background: "rgba(201,168,76,0.08)",
            border: `1px solid rgba(201,168,76,0.3)`,
            borderRadius: "4px",
            padding: "1px 5px",
            color: GOLD_MUTED,
            fontSize: "10px",
            fontFamily: SERIF,
            letterSpacing: "0.4px",
          }}
        >
          {monster.source}
        </span>
      )}
    </button>
  );
}
