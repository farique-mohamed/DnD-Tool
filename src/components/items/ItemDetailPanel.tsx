import type { Item } from "@/lib/itemsData";
import { WEAPON_PROPERTY_DESCRIPTIONS, WEAPON_MASTERY_DESCRIPTIONS } from "@/lib/equipmentData";
import { parseTaggedTextToHtml } from "@/lib/dndTagParser";
import { getItemImageUrl } from "@/lib/imageUtils";
import { EntityImage } from "@/components/ui/EntityImage";

// ---------------------------------------------------------------------------
// Theme constants
// ---------------------------------------------------------------------------

const GOLD = "#c9a84c";
const GOLD_MUTED = "#a89060";
const GOLD_BRIGHT = "#e8d5a3";
const GOLD_BORDER = "rgba(201,168,76,0.25)";
const TEXT_DIM = "rgba(232,213,163,0.6)";
const SERIF = "'EB Garamond', 'Georgia', serif";

const RARITY_COLORS: Record<string, string> = {
  common: "#9d9d9d",
  uncommon: "#27ae60",
  rare: "#4a90d9",
  "very rare": "#9b59b6",
  legendary: "#e67e22",
  artifact: "#e74c3c",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rarityColor(rarity: string): string {
  return RARITY_COLORS[rarity] ?? GOLD_MUTED;
}

function rarityLabel(rarity: string): string {
  if (rarity === "none" || rarity === "unknown" || rarity === "unknown (magic)")
    return rarity;
  return rarity
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatValue(cp: number): string {
  if (cp >= 100) return `${(cp / 100).toLocaleString()} gp`;
  if (cp >= 10) return `${cp / 10} sp`;
  return `${cp} cp`;
}

// ---------------------------------------------------------------------------
// Item detail panel
// ---------------------------------------------------------------------------

export function ItemDetailPanel({
  item,
  isMobile,
  onBack,
}: {
  item: Item;
  isMobile?: boolean;
  onBack?: () => void;
}) {
  const rColor = rarityColor(item.rarity);

  const metaRows: Array<{ label: string; value: string }> = [
    { label: "Type", value: item.type },
    { label: "Rarity", value: rarityLabel(item.rarity) },
  ];

  if (item.weight != null) {
    metaRows.push({ label: "Weight", value: `${item.weight} lb.` });
  }
  if (item.value != null) {
    metaRows.push({ label: "Value", value: formatValue(item.value) });
  }
  if (item.reqAttune) {
    metaRows.push({
      label: "Attunement",
      value: item.reqAttune === "Yes" ? "Required" : item.reqAttune,
    });
  }
  if (item.weaponCategory) {
    metaRows.push({
      label: "Category",
      value: item.weaponCategory.charAt(0).toUpperCase() + item.weaponCategory.slice(1),
    });
  }
  if (item.dmg1) {
    let dmgText = item.dmgType ? `${item.dmg1} ${item.dmgType}` : item.dmg1;
    if (item.dmg2) dmgText += ` (2H: ${item.dmg2})`;
    metaRows.push({ label: "Damage", value: dmgText });
  }
  if (item.range) {
    metaRows.push({ label: "Range", value: `${item.range} ft.` });
  }
  if (item.ac != null) {
    metaRows.push({ label: "AC", value: String(item.ac) });
  }
  if (item.bonusAc) {
    metaRows.push({ label: "AC Bonus", value: item.bonusAc });
  }
  if (item.bonusWeapon) {
    metaRows.push({ label: "Weapon Bonus", value: item.bonusWeapon });
  }
  if (item.bonusSpellAttack) {
    metaRows.push({ label: "Spell Attack Bonus", value: item.bonusSpellAttack });
  }

  metaRows.push({ label: "Source", value: item.source });

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
      {/* Back button on mobile */}
      {isMobile && onBack && (
        <button
          onClick={onBack}
          style={{
            alignSelf: "flex-start",
            background: "transparent",
            border: "none",
            color: GOLD,
            fontFamily: SERIF,
            fontSize: "13px",
            cursor: "pointer",
            padding: 0,
            marginBottom: "-10px",
          }}
        >
          ← Back to list
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
          {item.name}
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
          {item.type}
          {item.rarity !== "none" && " · "}
          {item.rarity !== "none" && (
            <span style={{ color: rColor }}>{rarityLabel(item.rarity)}</span>
          )}
        </p>
      </div>

      {/* Type badge + rarity badge + source badge */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <span
          style={{
            background: "rgba(0,0,0,0.4)",
            border: `1px solid ${GOLD_MUTED}`,
            borderRadius: "6px",
            padding: "4px 12px",
            color: GOLD_MUTED,
            fontSize: "12px",
            fontFamily: SERIF,
            fontWeight: "bold",
          }}
        >
          {item.type}
        </span>
        <span
          style={{
            background: `${rColor}15`,
            border: `1px solid ${rColor}55`,
            borderRadius: "6px",
            padding: "4px 12px",
            color: rColor,
            fontSize: "12px",
            fontFamily: SERIF,
          }}
        >
          {rarityLabel(item.rarity)}
        </span>
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
          {item.source}
        </span>
      </div>

      {/* Item image */}
      <EntityImage
        src={getItemImageUrl(item.name, item.source)}
        alt={item.name}
        width={isMobile ? "100%" : 240}
        style={{ alignSelf: "center" }}
      />

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

      {/* Properties & Mastery */}
      {((item.property && item.property.length > 0) || (item.mastery && item.mastery.length > 0)) && (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span
            style={{
              color: GOLD,
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "1.2px",
              fontFamily: SERIF,
            }}
          >
            Properties &amp; Mastery
          </span>
          {item.property?.map((prop) => {
            const displayName = prop
              .split("-")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join("-");
            return (
              <div
                key={prop}
                style={{
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(201,168,76,0.15)",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  marginBottom: "0",
                }}
              >
                <div style={{ color: GOLD, fontWeight: "bold", fontSize: "13px", fontFamily: SERIF }}>
                  {displayName}
                </div>
                {WEAPON_PROPERTY_DESCRIPTIONS[prop] && (
                  <div style={{ color: GOLD_BRIGHT, fontSize: "12px", fontFamily: SERIF, fontStyle: "italic", marginTop: "2px", lineHeight: "1.5" }}>
                    {WEAPON_PROPERTY_DESCRIPTIONS[prop]}
                  </div>
                )}
              </div>
            );
          })}
          {item.mastery?.map((mastery) => (
            <div
              key={mastery}
              style={{
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(201,168,76,0.15)",
                borderRadius: "6px",
                padding: "8px 12px",
                marginBottom: "0",
              }}
            >
              <div style={{ color: GOLD, fontWeight: "bold", fontSize: "13px", fontFamily: SERIF }}>
                {mastery}
              </div>
              {WEAPON_MASTERY_DESCRIPTIONS[mastery] && (
                <div style={{ color: GOLD_BRIGHT, fontSize: "12px", fontFamily: SERIF, fontStyle: "italic", marginTop: "2px", lineHeight: "1.5" }}>
                  {WEAPON_MASTERY_DESCRIPTIONS[mastery]}
                </div>
              )}
            </div>
          ))}
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
      {item.description && (
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
          <p
            style={{
              color: TEXT_DIM,
              fontSize: "13px",
              fontFamily: SERIF,
              lineHeight: "1.7",
              margin: 0,
              whiteSpace: "pre-wrap",
            }}
            dangerouslySetInnerHTML={{
              __html: parseTaggedTextToHtml(item.description),
            }}
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty detail placeholder
// ---------------------------------------------------------------------------

export function ItemDetailEmpty({ isMobile }: { isMobile?: boolean }) {
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
        Select an item to view its details.
      </p>
    </div>
  );
}
