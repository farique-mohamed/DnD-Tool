import type { ClassInfo } from "@/lib/classData";

// ---------------------------------------------------------------------------
// Theme constants
// ---------------------------------------------------------------------------

const GOLD = "#c9a84c";
const GOLD_MUTED = "#a89060";
const GOLD_BRIGHT = "#e8d5a3";
const GOLD_DIM = "rgba(201,168,76,0.15)";
const GOLD_BORDER = "rgba(201,168,76,0.25)";
const TEXT_DIM = "rgba(232,213,163,0.6)";
const SERIF = "'EB Garamond', 'Georgia', serif";

// ---------------------------------------------------------------------------
// Class info summary card (for use in search results)
// ---------------------------------------------------------------------------

export function ClassInfoCard({
  cls,
  isMobile,
  onBack,
}: {
  cls: ClassInfo;
  isMobile?: boolean;
  onBack?: () => void;
}) {
  const metaRows: Array<{ label: string; value: string }> = [
    { label: "Hit Die", value: cls.hitDie },
    { label: "Source", value: cls.source },
  ];

  if (cls.savingThrows.length > 0) {
    metaRows.push({ label: "Saving Throws", value: cls.savingThrows.join(", ") });
  }
  if (cls.armorProficiencies.length > 0) {
    metaRows.push({ label: "Armor Prof.", value: cls.armorProficiencies.join(", ") });
  }
  if (cls.weaponProficiencies.length > 0) {
    metaRows.push({ label: "Weapon Prof.", value: cls.weaponProficiencies.join(", ") });
  }
  if (cls.skillChoices.count > 0) {
    metaRows.push({
      label: "Skills",
      value: `Choose ${cls.skillChoices.count}${cls.skillChoices.from.length > 0 && cls.skillChoices.from[0] !== "Any skill" ? ` from ${cls.skillChoices.from.join(", ")}` : ""}`,
    });
  }
  if (cls.subclasses.length > 0) {
    metaRows.push({
      label: cls.subclassTitle || "Subclasses",
      value: cls.subclasses.map((sc) => sc.name).join(", "),
    });
  }

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
          {cls.name}
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
          Class &middot; Hit Die: {cls.hitDie}
        </p>
      </div>

      {/* Badges */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
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
          {cls.source}
        </span>
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
          {cls.hitDie}
        </span>
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

      {/* Gradient divider */}
      <div
        style={{
          height: "1px",
          background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
          opacity: 0.5,
        }}
      />

      {/* Description */}
      {cls.description && (
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
            About the {cls.name}
          </div>
          <p
            style={{
              color: TEXT_DIM,
              fontSize: "13px",
              fontFamily: SERIF,
              lineHeight: "1.7",
              margin: 0,
              whiteSpace: "pre-wrap",
              fontStyle: "italic",
            }}
          >
            {cls.description}
          </p>
        </div>
      )}
    </div>
  );
}
