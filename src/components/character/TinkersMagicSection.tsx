import { useState } from "react";
import { api } from "@/utils/api";
import { type CharacterData, mod } from "./shared";

// ---------------------------------------------------------------------------
// Tinker's Magic (XPHB Artificer feature)
// ---------------------------------------------------------------------------
// As a Magic action while holding Tinker's Tools, create one mundane item
// from the list below. The item lasts until you finish a Long Rest.
// Uses per Long Rest = Intelligence modifier (minimum 1).
// ---------------------------------------------------------------------------

const TINKER_ITEMS = [
  "Ball Bearings",
  "Basket",
  "Bedroll",
  "Bell",
  "Blanket",
  "Block and Tackle",
  "Bottle (Glass)",
  "Bucket",
  "Caltrops",
  "Candle",
  "Crowbar",
  "Flask",
  "Grappling Hook",
  "Hunting Trap",
  "Jug",
  "Lamp",
  "Manacles",
  "Net",
  "Oil",
  "Paper",
  "Parchment",
  "Pole",
  "Pouch",
  "Rope",
  "Sack",
  "Shovel",
  "Spikes (Iron)",
  "String",
  "Tinderbox",
  "Torch",
  "Vial",
];

export function TinkersMagicSection({
  character,
}: {
  character: CharacterData;
}) {
  const utils = api.useUtils();
  const intMod = mod(character.intelligence);
  const maxUses = Math.max(1, intMod);

  const [localFeatureUses, setLocalFeatureUses] = useState<
    Record<string, number>
  >(() => {
    try {
      return JSON.parse(character.featureUses || "{}") as Record<
        string,
        number
      >;
    } catch {
      return {};
    }
  });

  const updateFeatureUses = api.character.updateFeatureUses.useMutation({
    onSuccess: async () => {
      await utils.character.getById.invalidate({ id: character.id });
    },
  });

  const usedCount = localFeatureUses["Magical Tinkering"] ?? 0;

  const toggleUse = (slotIdx: number) => {
    const newUsed =
      slotIdx < usedCount
        ? usedCount - 1
        : Math.min(usedCount + 1, maxUses);
    const next = { ...localFeatureUses, ["Magical Tinkering"]: newUsed };
    setLocalFeatureUses(next);
    updateFeatureUses.mutate({ id: character.id, featureUses: next });
  };

  const [showItems, setShowItems] = useState(false);

  return (
    <div
      style={{
        background: "rgba(0,0,0,0.5)",
        border: "1px solid rgba(201,168,76,0.3)",
        borderRadius: "10px",
        padding: "18px 20px",
        marginBottom: "24px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexWrap: "wrap",
          marginBottom: "10px",
        }}
      >
        <span
          style={{
            color: "#e8d5a3",
            fontSize: "15px",
            fontWeight: "bold",
            fontFamily: "'EB Garamond', 'Georgia', serif",
            flex: 1,
          }}
        >
          Tinker&apos;s Magic
        </span>
        <span
          style={{
            fontSize: "10px",
            padding: "2px 8px",
            borderRadius: "10px",
            background: "rgba(201,168,76,0.12)",
            border: "1px solid rgba(201,168,76,0.25)",
            color: "#c9a84c",
            fontFamily: "'EB Garamond', 'Georgia', serif",
            letterSpacing: "0.5px",
          }}
        >
          Artificer Feature
        </span>
      </div>

      {/* Description */}
      <p
        style={{
          color: "#a89060",
          fontSize: "12px",
          fontFamily: "'EB Garamond', 'Georgia', serif",
          lineHeight: "1.6",
          marginBottom: "12px",
        }}
      >
        As a Magic action while holding Tinker&apos;s Tools, you can create one
        mundane item from the list below. The item lasts until you finish a Long
        Rest, then vanishes. You also know the{" "}
        <span style={{ color: "#c9a84c", fontWeight: "bold" }}>Mending</span>{" "}
        cantrip (added automatically).
      </p>

      {/* Usage tracker */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "14px",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            color: "#b8934a",
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            fontFamily: "'EB Garamond', 'Georgia', serif",
          }}
        >
          Uses:
        </span>
        {Array.from({ length: maxUses }, (_, j) => (
          <button
            key={j}
            onClick={() => toggleUse(j)}
            style={{
              background:
                j < usedCount ? "rgba(201,168,76,0.4)" : "transparent",
              border: "1px solid #c9a84c",
              borderRadius: "50%",
              width: "22px",
              height: "22px",
              color: j < usedCount ? "#8b6914" : "#c9a84c",
              cursor: "pointer",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'EB Garamond', 'Georgia', serif",
            }}
          >
            {j < usedCount ? "\u25CF" : "\u25CB"}
          </button>
        ))}
        <span
          style={{
            fontSize: "10px",
            padding: "2px 8px",
            borderRadius: "10px",
            background: "rgba(74,124,42,0.12)",
            border: "1px solid rgba(74,124,42,0.3)",
            color: "#4a7c2a",
            fontFamily: "'EB Garamond', 'Georgia', serif",
          }}
        >
          Long Rest
        </span>
        <span
          style={{
            color: "#a89060",
            fontSize: "12px",
            fontFamily: "'EB Garamond', 'Georgia', serif",
          }}
        >
          {maxUses - usedCount} / {maxUses} remaining (INT mod)
        </span>
      </div>

      {/* Item list toggle */}
      <button
        onClick={() => setShowItems((v) => !v)}
        style={{
          background: "transparent",
          border: "1px solid rgba(201,168,76,0.3)",
          color: "#a89060",
          borderRadius: "4px",
          padding: "4px 12px",
          fontSize: "11px",
          fontFamily: "'EB Garamond', 'Georgia', serif",
          cursor: "pointer",
          letterSpacing: "0.5px",
          marginBottom: showItems ? "12px" : "0",
        }}
      >
        {showItems ? "Hide Item List" : "Show Item List"}
      </button>

      {/* Item grid */}
      {showItems && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "4px 12px",
          }}
        >
          {TINKER_ITEMS.map((item) => (
            <span
              key={item}
              style={{
                color: "#c9b87c",
                fontSize: "11px",
                fontFamily: "'EB Garamond', 'Georgia', serif",
                padding: "3px 0",
                borderBottom: "1px solid rgba(201,168,76,0.08)",
              }}
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
