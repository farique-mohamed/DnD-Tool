import type { Feat } from "@/lib/featData";
import {
  GOLD,
  GOLD_BRIGHT,
  GOLD_MUTED,
  GOLD_DIM,
  GOLD_BORDER,
  TEXT_DIM,
  SERIF,
  categoryDisplayName,
  categoryColor,
  formatAbilityBonus,
  formatSpellGrant,
} from "./featConstants";

// ---------------------------------------------------------------------------
// Detail panel (right side)
// ---------------------------------------------------------------------------

export function FeatDetailPanel({
  feat,
  isMobile,
  onBack,
}: {
  feat: Feat;
  isMobile?: boolean;
  onBack?: () => void;
}) {
  const catColor = feat.category ? categoryColor(feat.category) : null;

  const metaRows: Array<{ label: string; value: string }> = [];

  if (feat.prerequisiteText) {
    metaRows.push({ label: "Prerequisites", value: feat.prerequisiteText });
  }
  if (feat.levelRequired != null) {
    metaRows.push({ label: "Level Required", value: String(feat.levelRequired) });
  }
  if (feat.abilityBonus) {
    metaRows.push({ label: "Ability Bonus", value: formatAbilityBonus(feat.abilityBonus) });
  }
  metaRows.push({ label: "Source", value: feat.source });

  return (
    <div
      style={{
        flex: 2,
        background: "rgba(0,0,0,0.6)",
        border: `2px solid ${GOLD}`,
        borderRadius: "12px",
        boxShadow:
          "0 0 40px rgba(201,168,76,0.3), inset 0 0 60px rgba(0,0,0,0.5)",
        padding: isMobile ? "20px 16px" : "32px 36px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        minWidth: 0,
        minHeight: 0,
        height: "100%",
        overflowY: "auto",
        boxSizing: "border-box",
      }}
    >
      {/* Back button (mobile only) */}
      {isMobile && onBack && (
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: `1px solid ${GOLD_BORDER}`,
            borderRadius: "6px",
            padding: "6px 14px",
            color: GOLD,
            fontSize: "12px",
            fontFamily: SERIF,
            cursor: "pointer",
            alignSelf: "flex-start",
            letterSpacing: "0.5px",
          }}
        >
          &larr; Back to list
        </button>
      )}

      {/* Header */}
      <div>
        <h2
          style={{
            color: GOLD,
            fontSize: "26px",
            fontWeight: "bold",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            fontFamily: SERIF,
            margin: 0,
            marginBottom: "6px",
          }}
        >
          {feat.name}
        </h2>
        <p
          style={{
            color: GOLD_MUTED,
            fontSize: "13px",
            fontFamily: SERIF,
            fontStyle: "italic",
            margin: 0,
          }}
        >
          Feat
          {feat.category && (
            <>
              {" "}
              &middot;{" "}
              <span style={{ color: catColor ?? GOLD_MUTED }}>
                {categoryDisplayName(feat.category)}
              </span>
            </>
          )}
        </p>
      </div>

      {/* Badges */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {/* Source badge */}
        <span
          style={{
            background: "rgba(74,144,217,0.1)",
            border: "1px solid rgba(74,144,217,0.35)",
            borderRadius: "6px",
            padding: "4px 12px",
            color: "#7ab4e0",
            fontSize: "12px",
            fontFamily: SERIF,
          }}
        >
          {feat.source}
        </span>
        {/* Category badge */}
        {feat.category && catColor && (
          <span
            style={{
              background: `${catColor}15`,
              border: `1px solid ${catColor}55`,
              borderRadius: "6px",
              padding: "4px 12px",
              color: catColor,
              fontSize: "12px",
              fontFamily: SERIF,
              fontWeight: "bold",
            }}
          >
            {categoryDisplayName(feat.category)}
          </span>
        )}
        {/* Level badge */}
        {feat.levelRequired != null && (
          <span
            style={{
              background: GOLD_DIM,
              border: `1px solid ${GOLD_BORDER}`,
              borderRadius: "6px",
              padding: "4px 12px",
              color: GOLD_MUTED,
              fontSize: "12px",
              fontFamily: SERIF,
            }}
          >
            Level {feat.levelRequired}+
          </span>
        )}
      </div>

      {/* Gradient divider */}
      <div
        style={{
          height: "1px",
          background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
          opacity: 0.5,
        }}
      />

      {/* Meta stats */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {metaRows.map(({ label, value }) => (
          <div
            key={label}
            style={{ display: "flex", gap: "8px", alignItems: "baseline" }}
          >
            <span
              style={{
                color: GOLD,
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "1.2px",
                fontFamily: SERIF,
                minWidth: "120px",
                flexShrink: 0,
              }}
            >
              {label}
            </span>
            <span
              style={{
                color: GOLD_BRIGHT,
                fontSize: "13px",
                fontFamily: SERIF,
                lineHeight: "1.5",
              }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Spell Grants */}
      {feat.spellGrants && feat.spellGrants.length > 0 && (
        <div>
          <div
            style={{
              color: GOLD,
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "1.2px",
              fontFamily: SERIF,
              marginBottom: "8px",
            }}
          >
            Spell Grants
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {feat.spellGrants.map((grant, idx) => (
              <div
                key={idx}
                style={{
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(201,168,76,0.15)",
                  borderRadius: "6px",
                  padding: "8px 12px",
                }}
              >
                <span
                  style={{
                    color: GOLD_BRIGHT,
                    fontSize: "12px",
                    fontFamily: SERIF,
                  }}
                >
                  {formatSpellGrant(grant)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gradient divider */}
      <div
        style={{
          height: "1px",
          background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
          opacity: 0.5,
        }}
      />

      {/* Description */}
      <div>
        <div
          style={{
            color: GOLD,
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "1.2px",
            fontFamily: SERIF,
            marginBottom: "10px",
          }}
        >
          Description
        </div>
        {feat.entries.map((entry, idx) => (
          <p
            key={idx}
            style={{
              color: TEXT_DIM,
              fontSize: "13px",
              fontFamily: SERIF,
              lineHeight: "1.7",
              margin: 0,
              marginBottom: idx < feat.entries.length - 1 ? "10px" : 0,
              whiteSpace: "pre-wrap",
            }}
          >
            {entry}
          </p>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty detail placeholder
// ---------------------------------------------------------------------------

export function FeatDetailEmpty({ isMobile }: { isMobile?: boolean }) {
  return (
    <div
      style={{
        flex: 2,
        background: "rgba(0,0,0,0.4)",
        border: `1px solid ${GOLD_BORDER}`,
        borderRadius: "12px",
        display: isMobile ? "none" : "flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 0,
        minHeight: 0,
      }}
    >
      <p
        style={{
          color: GOLD_MUTED,
          fontSize: "14px",
          fontFamily: SERIF,
          fontStyle: "italic",
        }}
      >
        Select a feat to view its details.
      </p>
    </div>
  );
}
