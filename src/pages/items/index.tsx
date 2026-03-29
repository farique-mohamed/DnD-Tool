import Head from "next/head";
import { useState, useMemo } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  ITEMS,
  ITEM_SOURCES,
  ITEM_TYPES,
  ITEM_RARITIES,
  type Item,
} from "@/lib/itemsData";
import { WEAPON_PROPERTY_DESCRIPTIONS, WEAPON_MASTERY_DESCRIPTIONS } from "@/lib/equipmentData";
import { parseTaggedTextToHtml } from "@/lib/dndTagParser";

const PLAYER_SOURCES = new Set(["PHB", "XPHB"]);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GOLD = "#c9a84c";
const GOLD_MUTED = "#a89060";
const GOLD_BRIGHT = "#e8d5a3";
const GOLD_DIM = "rgba(201,168,76,0.15)";
const GOLD_BORDER = "rgba(201,168,76,0.25)";
const TEXT_DIM = "rgba(232,213,163,0.6)";
const SERIF = "'Georgia', 'Times New Roman', serif";

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
// Item list row
// ---------------------------------------------------------------------------

function ItemRow({
  item,
  isActive,
  onClick,
}: {
  item: Item;
  isActive: boolean;
  onClick: () => void;
}) {
  const rColor = rarityColor(item.rarity);

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
      {/* Name + rarity dot + type badge + source badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
        <span
          style={{
            width: "7px",
            height: "7px",
            borderRadius: "50%",
            background: rColor,
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
          {item.name}
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
          {item.source}
        </span>
        {/* Rarity badge */}
        <span
          style={{
            flexShrink: 0,
            background: `${rColor}15`,
            border: `1px solid ${rColor}55`,
            borderRadius: "3px",
            padding: "0px 5px",
            color: rColor,
            fontSize: "10px",
            fontFamily: SERIF,
            letterSpacing: "0.3px",
          }}
        >
          {rarityLabel(item.rarity)}
        </span>
      </div>

      {/* Type · Weight */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "nowrap",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            color: GOLD_MUTED,
            fontSize: "10px",
            fontFamily: SERIF,
            flexShrink: 0,
            opacity: 0.85,
          }}
        >
          {item.type}
        </span>
        {item.weight != null && (
          <span style={{ color: TEXT_DIM, fontSize: "10px", fontFamily: SERIF, flexShrink: 0 }}>
            {item.weight} lb.
          </span>
        )}
        {item.reqAttune && (
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
            Attunement
          </span>
        )}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Item detail panel (right side)
// ---------------------------------------------------------------------------

function ItemDetailPanel({ item, isMobile, onBack }: { item: Item; isMobile?: boolean; onBack?: () => void }) {
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
  // Properties & Mastery are shown in a dedicated section below meta stats
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

function ItemDetailEmpty({ isMobile }: { isMobile?: boolean }) {
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

// ---------------------------------------------------------------------------
// Main page content
// ---------------------------------------------------------------------------

function ItemsContent() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const isPlayer = user?.role === "PLAYER";

  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedRarity, setSelectedRarity] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // Players can only see PHB and XPHB items
  const availableItems = useMemo(
    () => (isPlayer ? ITEMS.filter((i) => PLAYER_SOURCES.has(i.source)) : ITEMS),
    [isPlayer],
  );
  const availableSources = useMemo(
    () => (isPlayer ? ITEM_SOURCES.filter((s) => PLAYER_SOURCES.has(s)) : ITEM_SOURCES),
    [isPlayer],
  );

  const filteredItems = useMemo(() => {
    return availableItems.filter((item) => {
      if (selectedSource && item.source !== selectedSource) return false;
      if (selectedType && item.type !== selectedType) return false;
      if (selectedRarity && item.rarity !== selectedRarity) return false;
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase()))
        return false;
      return true;
    });
  }, [availableItems, selectedSource, selectedType, selectedRarity, searchQuery]);

  const handleSelect = (item: Item) => {
    setSelectedItem(item);
  };

  const handleSourceFilter = (src: string | null) => {
    setSelectedSource(src);
  };

  const handleTypeFilter = (type: string | null) => {
    setSelectedType(type);
  };

  const handleRarityFilter = (rarity: string | null) => {
    setSelectedRarity(rarity);
  };

  return (
    <>
      <Head>
        <title>Item Vault — DnD Tool</title>
      </Head>

      {/* Outer wrapper fills viewport height minus Layout padding */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: isMobile ? "calc(100vh - 48px)" : "calc(100vh - 80px)",
          overflow: isMobile ? "auto" : "hidden",
        }}
      >
        {/* Page header */}
        <div style={{ marginBottom: "20px", flexShrink: 0 }}>
          <h1
            style={{
              color: GOLD,
              fontSize: isMobile ? "20px" : "26px",
              fontWeight: "bold",
              letterSpacing: "2px",
              textTransform: "uppercase",
              marginBottom: "8px",
              fontFamily: SERIF,
            }}
          >
            Item Vault
          </h1>
          <p
            style={{
              color: GOLD_MUTED,
              fontSize: "14px",
              marginBottom: "12px",
              fontFamily: SERIF,
            }}
          >
            Browse mundane and magical treasures.
          </p>
          <div
            style={{
              width: "80px",
              height: "2px",
              background: GOLD,
              opacity: 0.6,
            }}
          />
        </div>

        {/* Two-column layout: list (flex:3) | detail (flex:2) */}
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: "24px",
            flex: 1,
            overflow: isMobile ? "auto" : "hidden",
            minHeight: 0,
          }}
        >
          {/* Left column: filters + item list */}
          <div
            style={{
              flex: 3,
              minWidth: 0,
              display: isMobile && selectedItem ? "none" : "flex",
              flexDirection: "column",
              gap: "10px",
              height: isMobile ? "auto" : "100%",
              overflow: isMobile ? "visible" : "hidden",
            }}
          >
            {/* Search */}
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "rgba(30,15,5,0.9)",
                border: "1px solid rgba(201,168,76,0.4)",
                borderRadius: "6px",
                color: GOLD_BRIGHT,
                fontSize: "13px",
                fontFamily: SERIF,
                outline: "none",
                boxSizing: "border-box",
              }}
            />

            {/* Filter dropdowns row */}
            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: "8px",
                flexShrink: 0,
              }}
            >
              {/* Type filter */}
              <select
                value={selectedType ?? ""}
                onChange={(e) => handleTypeFilter(e.target.value || null)}
                style={{
                  flex: 1,
                  background: "rgba(30,15,5,0.9)",
                  border: "1px solid rgba(201,168,76,0.4)",
                  borderRadius: "6px",
                  padding: "8px 10px",
                  color: GOLD_BRIGHT,
                  fontSize: "12px",
                  fontFamily: SERIF,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="">All Types</option>
                {ITEM_TYPES.map((type) => (
                  <option key={type} value={type} style={{ background: "#1a0e05" }}>
                    {type}
                  </option>
                ))}
              </select>

              {/* Rarity filter */}
              <select
                value={selectedRarity ?? ""}
                onChange={(e) => handleRarityFilter(e.target.value || null)}
                style={{
                  flex: 1,
                  background: "rgba(30,15,5,0.9)",
                  border: "1px solid rgba(201,168,76,0.4)",
                  borderRadius: "6px",
                  padding: "8px 10px",
                  color: GOLD_BRIGHT,
                  fontSize: "12px",
                  fontFamily: SERIF,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="">All Rarities</option>
                {ITEM_RARITIES.map((rarity) => (
                  <option key={rarity} value={rarity} style={{ background: "#1a0e05" }}>
                    {rarityLabel(rarity)}
                  </option>
                ))}
              </select>

              {/* Source filter */}
              <select
                value={selectedSource ?? ""}
                onChange={(e) => handleSourceFilter(e.target.value || null)}
                style={{
                  flex: 1,
                  background: "rgba(30,15,5,0.9)",
                  border: "1px solid rgba(201,168,76,0.4)",
                  borderRadius: "6px",
                  padding: "8px 10px",
                  color: GOLD_BRIGHT,
                  fontSize: "12px",
                  fontFamily: SERIF,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="">All Sources</option>
                {availableSources.map((src) => (
                  <option key={src} value={src} style={{ background: "#1a0e05" }}>
                    {src}
                  </option>
                ))}
              </select>
            </div>

            {/* Results count */}
            <div
              style={{
                color: GOLD_MUTED,
                fontSize: "11px",
                fontFamily: SERIF,
                textAlign: "right",
                flexShrink: 0,
              }}
            >
              {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
            </div>

            {/* Scrollable item list */}
            <div
              style={{
                background: "rgba(0,0,0,0.5)",
                border: `1px solid ${GOLD_BORDER}`,
                borderRadius: "8px",
                overflow: "hidden",
                flex: 1,
                overflowY: "auto",
                minHeight: 0,
                ...(isMobile ? { maxHeight: "50vh" } : {}),
              }}
            >
              {filteredItems.length === 0 ? (
                <div style={{ padding: "24px 16px", textAlign: "center" }}>
                  <p
                    style={{
                      color: GOLD_MUTED,
                      fontSize: "13px",
                      fontFamily: SERIF,
                    }}
                  >
                    No items match your filters.
                  </p>
                </div>
              ) : (
                filteredItems.map((item) => (
                  <ItemRow
                    key={`${item.name}|${item.source}`}
                    item={item}
                    isActive={
                      selectedItem?.name === item.name &&
                      selectedItem?.source === item.source
                    }
                    onClick={() => handleSelect(item)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right column: item detail */}
          {selectedItem ? (
            <ItemDetailPanel item={selectedItem} isMobile={isMobile} onBack={() => setSelectedItem(null)} />
          ) : (
            <ItemDetailEmpty isMobile={isMobile} />
          )}
        </div>
      </div>
    </>
  );
}

export default function ItemsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <ItemsContent />
      </Layout>
    </ProtectedRoute>
  );
}
