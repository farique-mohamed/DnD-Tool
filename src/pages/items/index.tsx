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
import { getItemImageUrl } from "@/lib/imageUtils";
import { EntityImage } from "@/components/ui/EntityImage";

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
// Item detail panel + empty state (extracted to shared component)
// ---------------------------------------------------------------------------

import { ItemDetailPanel } from "@/components/items/ItemDetailPanel";
import { ItemDetailEmpty } from "@/components/items/ItemDetailPanel";

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
