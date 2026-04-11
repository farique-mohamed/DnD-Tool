import type { Feat } from "@/lib/featData";
import {
  GOLD,
  GOLD_BRIGHT,
  GOLD_MUTED,
  GOLD_BORDER,
  TEXT_DIM,
  SERIF,
  categoryDisplayName,
  categoryColor,
} from "./featConstants";

export function FeatRow({
  feat,
  isActive,
  onClick,
}: {
  feat: Feat;
  isActive: boolean;
  onClick: () => void;
}) {
  const catColor = feat.category ? categoryColor(feat.category) : null;

  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "10px 14px",
        background: isActive ? "rgba(201,168,76,0.1)" : "transparent",
        border: "none",
        borderLeft: isActive ? `3px solid ${GOLD}` : "3px solid transparent",
        borderBottom: `1px solid ${GOLD_BORDER}`,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
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
      {/* Name + source badge + category badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
        <span
          style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            background: catColor ?? GOLD_MUTED,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            color: isActive ? GOLD : GOLD_BRIGHT,
            fontSize: "13px",
            fontFamily: SERIF,
            fontWeight: isActive ? "bold" : "normal",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            flex: 1,
            minWidth: 0,
          }}
        >
          {feat.name}
        </span>
        {/* Source badge */}
        <span
          style={{
            flexShrink: 0,
            background: "rgba(74,144,217,0.1)",
            border: "1px solid rgba(74,144,217,0.35)",
            borderRadius: "3px",
            padding: "0px 5px",
            color: "#7ab4e0",
            fontSize: "10px",
            fontFamily: SERIF,
            letterSpacing: "0.3px",
          }}
        >
          {feat.source}
        </span>
        {/* Category badge */}
        {feat.category && catColor && (
          <span
            style={{
              flexShrink: 0,
              background: `${catColor}15`,
              border: `1px solid ${catColor}55`,
              borderRadius: "3px",
              padding: "0px 5px",
              color: catColor,
              fontSize: "10px",
              fontFamily: SERIF,
              letterSpacing: "0.3px",
            }}
          >
            {categoryDisplayName(feat.category)}
          </span>
        )}
      </div>

      {/* Prerequisite text */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "nowrap",
          overflow: "hidden",
        }}
      >
        {feat.prerequisiteText ? (
          <span
            style={{
              color: TEXT_DIM,
              fontSize: "10px",
              fontFamily: SERIF,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Prereq: {feat.prerequisiteText}
          </span>
        ) : (
          <span
            style={{
              color: TEXT_DIM,
              fontSize: "10px",
              fontFamily: SERIF,
              opacity: 0.5,
            }}
          >
            No prerequisites
          </span>
        )}
      </div>
    </button>
  );
}
