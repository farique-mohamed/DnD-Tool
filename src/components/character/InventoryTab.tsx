import { useMemo, useState } from "react";
import { api } from "@/utils/api";
import { ITEMS, type Item } from "@/lib/itemsData";
import { parseTaggedTextToHtml } from "@/lib/dndTagParser";
import { WEAPON_PROPERTY_DESCRIPTIONS, WEAPON_MASTERY_DESCRIPTIONS } from "@/lib/equipmentData";
import { EquipButton } from "@/components/adventure/EquipButton";
import {
  getClassStartingEquipment,
  getBackgroundStartingEquipment,
  type StartingEquipmentPreset,
  type StartingItem,
} from "@/lib/startingEquipmentData";
import { type CharacterData } from "./shared";

function InventoryItemDescription({
  itemData,
  customDescription,
}: {
  itemData: Item | undefined;
  customDescription: string | null | undefined;
}) {
  let attachedItemData: Item | undefined;
  let cleanCustomDescription = customDescription;

  if (customDescription?.startsWith("[ATTACHED:")) {
    const endBracket = customDescription.indexOf("]");
    if (endBracket !== -1) {
      const ref = customDescription.slice(10, endBracket);
      const pipeIdx = ref.lastIndexOf("|");
      if (pipeIdx !== -1) {
        const attachedName = ref.slice(0, pipeIdx);
        const attachedSource = ref.slice(pipeIdx + 1);
        attachedItemData = ITEMS.find(
          (it) => it.name === attachedName && it.source === attachedSource,
        );
      }
      cleanCustomDescription = customDescription.slice(endBracket + 1).trim() || null;
    }
  }

  const displayItemData = itemData ?? attachedItemData;

  if (!displayItemData && !cleanCustomDescription) {
    return (
      <p
        style={{
          color: "rgba(232,213,163,0.6)",
          fontSize: "13px",
          fontFamily: "'EB Garamond', 'Georgia', serif",
          fontStyle: "italic",
        }}
      >
        No description available.
      </p>
    );
  }

  return (
    <>
      {attachedItemData && !itemData && (
        <p
          style={{
            color: "#a89060",
            fontSize: "10px",
            fontFamily: "'EB Garamond', 'Georgia', serif",
            letterSpacing: "1px",
            textTransform: "uppercase",
            marginBottom: "6px",
          }}
        >
          Based on: {attachedItemData.name}
          {" "}
          <span
            style={{
              background: "rgba(201,168,76,0.15)",
              color: "#a89060",
              padding: "1px 6px",
              borderRadius: "3px",
              fontSize: "9px",
              letterSpacing: "0.5px",
            }}
          >
            {attachedItemData.source}
          </span>
        </p>
      )}
      {displayItemData && (
        <>
          {/* Type, rarity, source */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "8px",
              flexWrap: "wrap",
            }}
          >
            {displayItemData.type && (
              <span
                style={{
                  color: "#a89060",
                  fontSize: "13px",
                  fontFamily: "'EB Garamond', 'Georgia', serif",
                  fontStyle: "italic",
                }}
              >
                {displayItemData.type}
              </span>
            )}
            {displayItemData.rarity && displayItemData.rarity !== "none" && (
              <span
                style={{
                  fontSize: "10px",
                  fontFamily: "'EB Garamond', 'Georgia', serif",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  background: "rgba(201,168,76,0.15)",
                  color: "#c9a84c",
                }}
              >
                {displayItemData.rarity}
              </span>
            )}
            <span
              style={{
                background: "rgba(201,168,76,0.15)",
                color: "#a89060",
                padding: "1px 6px",
                borderRadius: "3px",
                fontSize: "9px",
                letterSpacing: "0.5px",
              }}
            >
              {displayItemData.source}
            </span>
          </div>

          {/* Weight, value, attunement */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              marginBottom: "12px",
              fontSize: "13px",
              fontFamily: "'EB Garamond', 'Georgia', serif",
            }}
          >
            {displayItemData.weight != null && (
              <div>
                <span style={{ color: "#c9a84c", fontWeight: "bold" }}>Weight </span>
                <span style={{ color: "#e8d5a3" }}>{displayItemData.weight} lb.</span>
              </div>
            )}
            {displayItemData.value != null && (
              <div>
                <span style={{ color: "#c9a84c", fontWeight: "bold" }}>Value </span>
                <span style={{ color: "#e8d5a3" }}>{displayItemData.value} gp</span>
              </div>
            )}
            {displayItemData.reqAttune && (
              <div>
                <span style={{ color: "#c9a84c", fontWeight: "bold" }}>Attunement </span>
                <span style={{ color: "#e8d5a3" }}>{displayItemData.reqAttune}</span>
              </div>
            )}
          </div>

          {/* Weapon stats */}
          {displayItemData.weaponCategory && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                marginBottom: "12px",
                fontSize: "13px",
                fontFamily: "'EB Garamond', 'Georgia', serif",
              }}
            >
              <div>
                <span style={{ color: "#c9a84c", fontWeight: "bold" }}>Category </span>
                <span style={{ color: "#e8d5a3" }}>{displayItemData.weaponCategory}</span>
              </div>
              {displayItemData.dmg1 && (
                <div>
                  <span style={{ color: "#c9a84c", fontWeight: "bold" }}>Damage </span>
                  <span style={{ color: "#e8d5a3" }}>
                    {displayItemData.dmg1}
                    {displayItemData.dmgType ? ` ${displayItemData.dmgType}` : ""}
                    {displayItemData.dmg2 ? ` (2H: ${displayItemData.dmg2})` : ""}
                  </span>
                </div>
              )}
              {displayItemData.range && (
                <div>
                  <span style={{ color: "#c9a84c", fontWeight: "bold" }}>Range </span>
                  <span style={{ color: "#e8d5a3" }}>{displayItemData.range}</span>
                </div>
              )}
              {displayItemData.property && displayItemData.property.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
                  {displayItemData.property.map((prop) => {
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
                        }}
                      >
                        <div style={{ color: "#c9a84c", fontWeight: "bold", fontSize: "13px", fontFamily: "'EB Garamond', 'Georgia', serif" }}>
                          {displayName}
                        </div>
                        {WEAPON_PROPERTY_DESCRIPTIONS[prop] && (
                          <div style={{ color: "#e8d5a3", fontSize: "12px", fontFamily: "'EB Garamond', 'Georgia', serif", fontStyle: "italic", marginTop: "2px", lineHeight: "1.5" }}>
                            {WEAPON_PROPERTY_DESCRIPTIONS[prop]}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {displayItemData.mastery && displayItemData.mastery.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
                  {displayItemData.mastery.map((mastery) => (
                    <div
                      key={mastery}
                      style={{
                        background: "rgba(0,0,0,0.3)",
                        border: "1px solid rgba(201,168,76,0.15)",
                        borderRadius: "6px",
                        padding: "8px 12px",
                      }}
                    >
                      <div style={{ color: "#c9a84c", fontWeight: "bold", fontSize: "13px", fontFamily: "'EB Garamond', 'Georgia', serif" }}>
                        {mastery}
                      </div>
                      {WEAPON_MASTERY_DESCRIPTIONS[mastery] && (
                        <div style={{ color: "#e8d5a3", fontSize: "12px", fontFamily: "'EB Garamond', 'Georgia', serif", fontStyle: "italic", marginTop: "2px", lineHeight: "1.5" }}>
                          {WEAPON_MASTERY_DESCRIPTIONS[mastery]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AC for armor/shields */}
          {(displayItemData.ac != null || displayItemData.bonusAc) && (
            <div
              style={{
                marginBottom: "12px",
                fontSize: "13px",
                fontFamily: "'EB Garamond', 'Georgia', serif",
              }}
            >
              {displayItemData.ac != null && (
                <div>
                  <span style={{ color: "#c9a84c", fontWeight: "bold" }}>AC </span>
                  <span style={{ color: "#e8d5a3" }}>{displayItemData.ac}</span>
                </div>
              )}
              {displayItemData.bonusAc && (
                <div>
                  <span style={{ color: "#c9a84c", fontWeight: "bold" }}>Bonus AC </span>
                  <span style={{ color: "#e8d5a3" }}>{displayItemData.bonusAc}</span>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {displayItemData.description && (
            <div
              style={{
                borderTop: "1px solid rgba(201,168,76,0.2)",
                paddingTop: "8px",
              }}
            >
              <p
                style={{
                  color: "#e8d5a3",
                  fontSize: "13px",
                  fontFamily: "'EB Garamond', 'Georgia', serif",
                  lineHeight: "1.6",
                }}
                dangerouslySetInnerHTML={{
                  __html: parseTaggedTextToHtml(displayItemData.description),
                }}
              />
            </div>
          )}
        </>
      )}

      {/* Custom description (DM-added) */}
      {cleanCustomDescription && (
        <div
          style={{
            background: "rgba(201,168,76,0.08)",
            border: "1px solid rgba(201,168,76,0.25)",
            borderLeft: "3px solid #c9a84c",
            borderRadius: "4px",
            padding: "12px 16px",
            marginTop: displayItemData ? "12px" : "0",
          }}
        >
          <p
            style={{
              color: "#a89060",
              fontSize: "10px",
              fontFamily: "'EB Garamond', 'Georgia', serif",
              letterSpacing: "1px",
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            DM Note
          </p>
          <p
            style={{
              color: "#e8d5a3",
              fontSize: "13px",
              fontFamily: "'EB Garamond', 'Georgia', serif",
              lineHeight: "1.6",
              whiteSpace: "pre-wrap",
              margin: 0,
            }}
          >
            {cleanCustomDescription}
          </p>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Starting Items Modal (for character inventory tab)
// ---------------------------------------------------------------------------

function CharacterStartingItemsModal({
  open,
  onClose,
  characterClass,
  classSource,
  background,
  adventurePlayerId,
  adventureId,
}: {
  open: boolean;
  onClose: () => void;
  characterClass: string;
  classSource: string;
  background: string;
  adventurePlayerId: string;
  adventureId: string;
}) {
  const utils = api.useUtils();
  const [selectedPresetIdx, setSelectedPresetIdx] = useState(0);

  const addStartingItems = api.adventure.addStartingItems.useMutation({
    onSuccess: () => {
      void utils.adventure.getInventory.invalidate({
        adventureId,
        adventurePlayerId,
      });
      onClose();
    },
  });

  if (!open) return null;

  const classEquip = getClassStartingEquipment(characterClass, classSource);
  const bgEquip = getBackgroundStartingEquipment(background);

  const classPresets: StartingEquipmentPreset[] = classEquip?.presets ?? [];
  const selectedPreset = classPresets[selectedPresetIdx] ?? null;
  const bgItems: StartingItem[] = bgEquip?.items ?? [];

  const handleConfirm = () => {
    const items: Array<{
      name: string;
      source: string;
      quantity?: number;
      displayName?: string;
    }> = [];

    if (selectedPreset) {
      for (const si of selectedPreset.items) {
        items.push({
          name: si.name,
          source: si.source,
          quantity: si.quantity ?? 1,
          displayName: si.displayName,
        });
      }
    }

    for (const bi of bgItems) {
      items.push({
        name: bi.name,
        source: bi.source,
        quantity: bi.quantity ?? 1,
        displayName: bi.displayName,
      });
    }

    if (items.length === 0) {
      onClose();
      return;
    }

    addStartingItems.mutate({ adventurePlayerId, items });
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "linear-gradient(180deg, rgba(20,12,5,0.98) 0%, rgba(10,6,2,0.98) 100%)",
          border: "2px solid rgba(201,168,76,0.5)",
          borderRadius: "16px",
          padding: "32px",
          maxWidth: "600px",
          width: "100%",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            color: "#c9a84c",
            fontSize: "16px",
            fontWeight: "bold",
            letterSpacing: "1px",
            textTransform: "uppercase",
            fontFamily: "'EB Garamond', 'Georgia', serif",
            marginBottom: "20px",
          }}
        >
          Starting Equipment
        </h3>

        {/* Class Equipment Presets */}
        {classPresets.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <p
              style={{
                color: "#c9a84c",
                fontSize: "12px",
                fontWeight: "bold",
                letterSpacing: "2px",
                textTransform: "uppercase",
                fontFamily: "'EB Garamond', 'Georgia', serif",
                marginBottom: "12px",
                paddingBottom: "8px",
                borderBottom: "1px solid rgba(201,168,76,0.2)",
              }}
            >
              Class Equipment ({characterClass})
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {classPresets.map((preset, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedPresetIdx(idx)}
                  style={{
                    background:
                      selectedPresetIdx === idx
                        ? "rgba(201,168,76,0.15)"
                        : "rgba(0,0,0,0.3)",
                    border:
                      selectedPresetIdx === idx
                        ? "1px solid rgba(201,168,76,0.5)"
                        : "1px solid rgba(201,168,76,0.15)",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    cursor: "pointer",
                  }}
                >
                  <p
                    style={{
                      color: "#e8d5a3",
                      fontSize: "13px",
                      fontFamily: "'EB Garamond', 'Georgia', serif",
                      marginBottom: "4px",
                      fontWeight: "bold",
                    }}
                  >
                    {preset.label}
                  </p>
                  <p
                    style={{
                      color: "#a89060",
                      fontSize: "12px",
                      fontFamily: "'EB Garamond', 'Georgia', serif",
                    }}
                  >
                    {preset.items.map((it) => it.displayName ?? it.name).join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Background Equipment */}
        {bgItems.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <p
              style={{
                color: "#c9a84c",
                fontSize: "12px",
                fontWeight: "bold",
                letterSpacing: "2px",
                textTransform: "uppercase",
                fontFamily: "'EB Garamond', 'Georgia', serif",
                marginBottom: "12px",
                paddingBottom: "8px",
                borderBottom: "1px solid rgba(201,168,76,0.2)",
              }}
            >
              Background Equipment ({background})
            </p>
            <div
              style={{
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(201,168,76,0.15)",
                borderRadius: "8px",
                padding: "12px 16px",
              }}
            >
              <p
                style={{
                  color: "#a89060",
                  fontSize: "12px",
                  fontFamily: "'EB Garamond', 'Georgia', serif",
                }}
              >
                {bgItems.map((it) => it.displayName ?? it.name).join(", ")}
              </p>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid rgba(201,168,76,0.3)",
              color: "#a89060",
              borderRadius: "6px",
              padding: "8px 20px",
              fontSize: "13px",
              fontFamily: "'EB Garamond', 'Georgia', serif",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={addStartingItems.isPending}
            style={{
              background: "linear-gradient(135deg, #8b6914, #c9a84c)",
              color: "#1a1a2e",
              border: "none",
              borderRadius: "6px",
              padding: "8px 20px",
              fontSize: "13px",
              fontFamily: "'EB Garamond', 'Georgia', serif",
              fontWeight: "bold",
              cursor: addStartingItems.isPending ? "default" : "pointer",
              opacity: addStartingItems.isPending ? 0.6 : 1,
            }}
          >
            {addStartingItems.isPending ? "Adding..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Character Inventory Tab
// ---------------------------------------------------------------------------

export function CharacterInventoryTab({ character }: { character: CharacterData }) {
  const [searchText, setSearchText] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showStartingModal, setShowStartingModal] = useState(false);
  const [splittingId, setSplittingId] = useState<string | null>(null);
  const [splitAmount, setSplitAmount] = useState(1);

  const adventurePlayer = character.adventurePlayers?.find(
    (ap) => ap.status === "ACCEPTED",
  );
  const adventurePlayerId = adventurePlayer?.id ?? "";
  const adventureId = adventurePlayer?.adventure.id ?? "";

  const utils = api.useUtils();

  const { data: inventoryItems = [], isLoading } =
    api.adventure.getInventory.useQuery(
      { adventureId, adventurePlayerId },
      { enabled: !!adventurePlayerId && !!adventureId },
    );

  const splitItem = api.adventure.splitInventoryItem.useMutation({
    onSuccess: () => {
      void utils.adventure.getInventory.invalidate({
        adventureId,
        adventurePlayerId,
      });
      setSplittingId(null);
      setSplitAmount(1);
    },
  });

  type InventoryItem = {
    id: string;
    adventurePlayerId: string;
    itemName: string;
    itemSource: string;
    quantity: number;
    isStartingItem: boolean;
    customDescription: string | null;
    addedByUserId: string;
    createdAt: string | Date;
    addedByUser: { id: string; username: string };
  };

  const typedItems = inventoryItems as unknown as InventoryItem[];
  const hasStartingItems = typedItems.some((item) => item.isStartingItem);

  const filteredItems = useMemo(() => {
    if (!searchText.trim()) return typedItems;
    const lower = searchText.toLowerCase();
    return typedItems.filter((item) =>
      item.itemName.toLowerCase().includes(lower),
    );
  }, [typedItems, searchText]);

  if (!adventurePlayer) {
    return (
      <div
        style={{
          background: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(201,168,76,0.2)",
          borderRadius: "12px",
          padding: "60px 40px",
          textAlign: "center",
        }}
      >
        <p style={{ color: "#a89060", fontSize: "14px", fontFamily: "'EB Garamond', 'Georgia', serif" }}>
          No accepted adventure found.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <p style={{ color: "#a89060", fontSize: "13px", fontFamily: "'EB Garamond', 'Georgia', serif" }}>
        Loading inventory...
      </p>
    );
  }

  const charClass = character.characterClass ?? "";
  const classSource = character.rulesSource ?? "PHB";
  const background = character.background ?? "";

  return (
    <div>
      {/* Adventure name */}
      <p
        style={{
          color: "#a89060",
          fontSize: "11px",
          fontFamily: "'EB Garamond', 'Georgia', serif",
          letterSpacing: "1px",
          textTransform: "uppercase",
          marginBottom: "16px",
        }}
      >
        Inventory for: {adventurePlayer.adventure.name}
      </p>

      {/* Starting items button */}
      {!hasStartingItems && (
        <button
          onClick={() => setShowStartingModal(true)}
          style={{
            background: "linear-gradient(135deg, #8b6914, #c9a84c)",
            color: "#1a1a2e",
            border: "none",
            borderRadius: "6px",
            padding: "10px 24px",
            fontSize: "14px",
            fontFamily: "'EB Garamond', 'Georgia', serif",
            fontWeight: "bold",
            cursor: "pointer",
            letterSpacing: "0.5px",
            marginBottom: "20px",
          }}
        >
          Add Starting Items
        </button>
      )}

      {/* Search input */}
      {typedItems.length > 0 && (
        <input
          type="text"
          placeholder="Search inventory..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            background: "rgba(30,15,5,0.9)",
            border: "1px solid rgba(201,168,76,0.4)",
            color: "#e8d5a3",
            fontFamily: "'EB Garamond', 'Georgia', serif",
            borderRadius: "6px",
            padding: "10px 14px",
            width: "100%",
            fontSize: "14px",
            boxSizing: "border-box",
            outline: "none",
            marginBottom: "16px",
          }}
        />
      )}

      {/* Inventory list */}
      {typedItems.length === 0 ? (
        <div
          style={{
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(201,168,76,0.2)",
            borderRadius: "12px",
            padding: "60px 40px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              color: "#a89060",
              fontSize: "16px",
              fontFamily: "'EB Garamond', 'Georgia', serif",
              fontStyle: "italic",
              marginBottom: "8px",
            }}
          >
            Your pack is empty, adventurer...
          </p>
          <p style={{ color: "rgba(232,213,163,0.6)", fontSize: "13px", fontFamily: "'EB Garamond', 'Georgia', serif" }}>
            Add starting items or wait for your DM to grant you equipment.
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div
          style={{
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(201,168,76,0.2)",
            borderRadius: "12px",
            padding: "40px",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#a89060", fontSize: "14px", fontFamily: "'EB Garamond', 'Georgia', serif" }}>
            No items match your search.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filteredItems.map((item) => {
            const isExpanded = expandedId === item.id;
            const itemData = ITEMS.find(
              (it) =>
                it.name.toLowerCase() === item.itemName.toLowerCase() &&
                it.source.toLowerCase() === item.itemSource.toLowerCase(),
            ) ?? ITEMS.find(
              (it) => it.name.toLowerCase() === item.itemName.toLowerCase(),
            );

            return (
              <div
                key={item.id}
                style={{
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid rgba(201,168,76,0.2)",
                  borderRadius: "8px",
                  padding: "12px 16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    setExpandedId(isExpanded ? null : item.id)
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        color: "#e8d5a3",
                        fontSize: "14px",
                        fontFamily: "'EB Garamond', 'Georgia', serif",
                      }}
                    >
                      {isExpanded ? "\u25BC" : "\u25B6"} {item.itemName}
                    </span>
                    {item.quantity > 1 && (
                      <span
                        style={{
                          color: "#c9a84c",
                          fontSize: "12px",
                          fontFamily: "'EB Garamond', 'Georgia', serif",
                          background: "rgba(201,168,76,0.15)",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontWeight: "bold",
                        }}
                      >
                        x{item.quantity}
                      </span>
                    )}
                    <span
                      style={{
                        background: "rgba(201,168,76,0.15)",
                        color: "#a89060",
                        padding: "1px 6px",
                        borderRadius: "3px",
                        fontSize: "9px",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {item.itemSource}
                    </span>
                    {itemData && itemData.rarity && itemData.rarity !== "none" && (
                      <span
                        style={{
                          fontSize: "10px",
                          fontFamily: "'EB Garamond', 'Georgia', serif",
                          letterSpacing: "0.5px",
                          textTransform: "uppercase",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          background: "rgba(201,168,76,0.15)",
                          color: "#c9a84c",
                        }}
                      >
                        {itemData.rarity}
                      </span>
                    )}
                    {item.isStartingItem && (
                      <span
                        style={{
                          color: "#4a8c3f",
                          fontSize: "10px",
                          fontFamily: "'EB Garamond', 'Georgia', serif",
                          background: "rgba(74,140,63,0.15)",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          letterSpacing: "0.5px",
                          textTransform: "uppercase",
                        }}
                      >
                        Starting
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      color: "#a89060",
                      fontSize: "12px",
                      fontFamily: "'EB Garamond', 'Georgia', serif",
                    }}
                  >
                    {isExpanded ? "\u25B2" : "\u25BC"}
                  </span>
                </div>

                {isExpanded && (
                  <div
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(201,168,76,0.15)",
                      borderRadius: "8px",
                      padding: "16px 20px",
                      marginTop: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <InventoryItemDescription
                      itemData={itemData}
                      customDescription={item.customDescription}
                    />
                    {adventurePlayerId && (
                      <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        <EquipButton
                          itemName={item.itemName}
                          itemSource={item.itemSource}
                          adventurePlayerId={adventurePlayerId}
                          itemData={itemData}
                        />
                        {item.quantity > 1 && splittingId !== item.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSplittingId(item.id);
                              setSplitAmount(1);
                            }}
                            style={{
                              background: "rgba(168,144,96,0.15)",
                              border: "1px solid rgba(168,144,96,0.3)",
                              color: "#a89060",
                              borderRadius: "6px",
                              padding: "6px 14px",
                              fontSize: "12px",
                              fontFamily: "'EB Garamond', 'Georgia', serif",
                              cursor: "pointer",
                            }}
                          >
                            Split Stack
                          </button>
                        )}
                        {item.quantity > 1 && splittingId === item.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              background: "rgba(0,0,0,0.3)",
                              border: "1px solid rgba(201,168,76,0.2)",
                              borderRadius: "6px",
                              padding: "6px 12px",
                            }}
                          >
                            <span
                              style={{
                                color: "#a89060",
                                fontSize: "12px",
                                fontFamily: "'EB Garamond', 'Georgia', serif",
                              }}
                            >
                              Remove
                            </span>
                            <input
                              type="number"
                              min={1}
                              max={item.quantity - 1}
                              value={splitAmount}
                              onChange={(e) => setSplitAmount(Math.max(1, Math.min(item.quantity - 1, Number(e.target.value) || 1)))}
                              style={{
                                background: "rgba(30,15,5,0.9)",
                                border: "1px solid rgba(201,168,76,0.4)",
                                color: "#e8d5a3",
                                fontFamily: "'EB Garamond', 'Georgia', serif",
                                borderRadius: "4px",
                                padding: "4px 8px",
                                width: "60px",
                                fontSize: "13px",
                                textAlign: "center",
                                outline: "none",
                              }}
                            />
                            <span
                              style={{
                                color: "#a89060",
                                fontSize: "12px",
                                fontFamily: "'EB Garamond', 'Georgia', serif",
                              }}
                            >
                              of {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                splitItem.mutate({
                                  inventoryItemId: item.id,
                                  splitQuantity: splitAmount,
                                })
                              }
                              disabled={splitItem.isPending}
                              style={{
                                background: "linear-gradient(135deg, #8b6914, #c9a84c)",
                                color: "#1a1a2e",
                                border: "none",
                                borderRadius: "4px",
                                padding: "4px 12px",
                                fontSize: "12px",
                                fontFamily: "'EB Garamond', 'Georgia', serif",
                                fontWeight: "bold",
                                cursor: splitItem.isPending ? "default" : "pointer",
                                opacity: splitItem.isPending ? 0.6 : 1,
                              }}
                            >
                              {splitItem.isPending ? "..." : "Confirm"}
                            </button>
                            <button
                              onClick={() => setSplittingId(null)}
                              style={{
                                background: "transparent",
                                border: "1px solid rgba(201,168,76,0.3)",
                                color: "#a89060",
                                borderRadius: "4px",
                                padding: "4px 10px",
                                fontSize: "12px",
                                fontFamily: "'EB Garamond', 'Georgia', serif",
                                cursor: "pointer",
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Starting Items Modal */}
      <CharacterStartingItemsModal
        open={showStartingModal}
        onClose={() => setShowStartingModal(false)}
        characterClass={charClass}
        classSource={classSource}
        background={background}
        adventurePlayerId={adventurePlayerId}
        adventureId={adventureId}
      />
    </div>
  );
}
