import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/utils/api";
import { ITEMS } from "@/lib/itemsData";
import {
  GOLD,
  GOLD_MUTED,
  GOLD_BRIGHT,
  TEXT_DIM,
  SERIF,
  SourceBadge,
  RarityBadge,
  InventoryItemDescription,
} from "./shared";
import { EquipmentPanel } from "./EquipmentPanel";
import { EquipButton } from "./EquipButton";
import { StartingItemsModal } from "./StartingItemsModal";

export function InventoryTab({
  adventure,
}: {
  adventure: {
    id: string;
    players: Array<{
      id: string;
      userId: string;
      status: string;
      character: Record<string, unknown>;
    }>;
  };
}) {
  const { user } = useAuth();
  const [searchText, setSearchText] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showStartingModal, setShowStartingModal] = useState(false);

  const myPlayerRecord = adventure.players.find(
    (p) => p.userId === user?.userId && p.status === "ACCEPTED",
  );
  const myCharacter = myPlayerRecord?.character ?? null;
  const adventurePlayerId = myPlayerRecord?.id ?? "";

  const { data: inventoryItems = [], isLoading } =
    api.adventure.getInventory.useQuery(
      { adventureId: adventure.id, adventurePlayerId },
      { enabled: !!adventurePlayerId },
    );

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

  if (!myPlayerRecord || !myCharacter) {
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
        <p style={{ color: GOLD_MUTED, fontSize: "14px", fontFamily: SERIF }}>
          No character found for this adventure.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <p style={{ color: GOLD_MUTED, fontSize: "13px", fontFamily: SERIF }}>
        Loading inventory...
      </p>
    );
  }

  const charClass = (myCharacter.characterClass as string) ?? "";
  const classSource = (myCharacter.rulesSource as string) ?? "PHB";
  const background = (myCharacter.background as string) ?? "";

  return (
    <div>
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

      {/* Equipment Panel */}
      {adventurePlayerId && (
        <EquipmentPanel
          adventurePlayerId={adventurePlayerId}
          characterClass={charClass}
          dexterity={(myCharacter.dexterity as number) ?? 10}
          inventoryItems={typedItems.map((it) => ({
            id: it.id,
            itemName: it.itemName,
            itemSource: it.itemSource,
            quantity: it.quantity,
          }))}
        />
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
            color: GOLD_BRIGHT,
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
              color: GOLD_MUTED,
              fontSize: "16px",
              fontFamily: SERIF,
              fontStyle: "italic",
              marginBottom: "8px",
            }}
          >
            Your pack is empty, adventurer...
          </p>
          <p style={{ color: TEXT_DIM, fontSize: "13px", fontFamily: SERIF }}>
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
          <p style={{ color: GOLD_MUTED, fontSize: "14px", fontFamily: SERIF }}>
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
                        color: GOLD_BRIGHT,
                        fontSize: "14px",
                        fontFamily: "'EB Garamond', 'Georgia', serif",
                      }}
                    >
                      {isExpanded ? "\u25BC" : "\u25B6"} {item.itemName}
                    </span>
                    {item.quantity > 1 && (
                      <span
                        style={{
                          color: GOLD,
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
                    <SourceBadge source={item.itemSource} />
                    {itemData && <RarityBadge rarity={itemData.rarity} />}
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
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <EquipButton
                      itemName={item.itemName}
                      itemSource={item.itemSource}
                      adventurePlayerId={adventurePlayerId}
                      itemData={itemData}
                    />
                    <span
                      style={{
                        color: GOLD_MUTED,
                        fontSize: "12px",
                        fontFamily: SERIF,
                      }}
                    >
                      {isExpanded ? "\u25B2" : "\u25BC"}
                    </span>
                  </div>
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
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Starting Items Modal */}
      <StartingItemsModal
        open={showStartingModal}
        onClose={() => setShowStartingModal(false)}
        characterClass={charClass}
        classSource={classSource}
        background={background}
        adventurePlayerId={adventurePlayerId}
        adventureId={adventure.id}
      />
    </div>
  );
}
