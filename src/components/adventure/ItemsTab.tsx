import { useMemo, useState } from "react";
import { api } from "@/utils/api";
import { ITEMS, type Item } from "@/lib/itemsData";
import { parseTaggedText } from "@/lib/dndTagParser";
import {
  GOLD,
  GOLD_MUTED,
  GOLD_BRIGHT,
  TEXT_DIM,
  SERIF,
  findSectionIndex,
  SourceBadge,
  RarityBadge,
  SearchModal,
} from "./shared";

export function ItemsTab({
  adventureId,
  adventureSource,
  items,
  acceptedPlayers,
  onViewInStory,
}: {
  adventureId: string;
  adventureSource: string;
  items: { id: string; name: string; source: string; createdAt: Date }[];
  acceptedPlayers: Array<{
    id: string;
    user: { id: string; username: string };
    character: Record<string, unknown> | null;
  }>;
  onViewInStory: (sectionIndex: number) => void;
}) {
  const utils = api.useUtils();
  const [showModal, setShowModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addToPlayerItemId, setAddToPlayerItemId] = useState<string | null>(null);

  const [addedSuccess, setAddedSuccess] = useState<string | null>(null);

  const addInventoryItem = api.adventure.addInventoryItem.useMutation({
    onSuccess: () => {
      void utils.adventure.getInventory.invalidate();
      setAddToPlayerItemId(null);
      setAddedSuccess("Item added to inventory!");
      setTimeout(() => setAddedSuccess(null), 2000);
    },
  });

  const addItem = api.adventure.addItem.useMutation({
    onSuccess: () => {
      void utils.adventure.getById.invalidate({ id: adventureId });
      setShowModal(false);
      setSearchText("");
    },
  });

  const removeItem = api.adventure.removeItem.useMutation({
    onSuccess: () => {
      void utils.adventure.getById.invalidate({ id: adventureId });
    },
  });

  const filteredItems = useMemo(() => {
    if (searchText.length < 2) return [];
    const lower = searchText.toLowerCase();
    const results: Item[] = [];
    for (const item of ITEMS) {
      if (item.name.toLowerCase().includes(lower)) {
        results.push(item);
        if (results.length >= 50) break;
      }
    }
    return results;
  }, [searchText]);

  return (
    <div>
      <button
        onClick={() => {
          setSearchText("");
          setShowModal(true);
        }}
        style={{
          background: "linear-gradient(135deg, #8b6914, #c9a84c)",
          color: "#1a1a2e",
          border: "none",
          borderRadius: "6px",
          padding: "10px 24px",
          fontSize: "14px",
          fontFamily: "'Georgia', serif",
          fontWeight: "bold",
          cursor: "pointer",
          letterSpacing: "0.5px",
          marginBottom: "20px",
        }}
      >
        Add Item
      </button>

      {addedSuccess && (
        <p
          style={{
            color: "#4a8c3f",
            fontSize: "13px",
            fontFamily: SERIF,
            marginBottom: "12px",
            padding: "8px 14px",
            background: "rgba(74,140,63,0.1)",
            border: "1px solid rgba(74,140,63,0.3)",
            borderRadius: "6px",
          }}
        >
          {addedSuccess}
        </p>
      )}

      {items.length === 0 ? (
        <div
          style={{
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(201,168,76,0.2)",
            borderRadius: "12px",
            padding: "40px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              color: "#a89060",
              fontSize: "14px",
              fontFamily: "'Georgia', 'Times New Roman', serif",
            }}
          >
            No items added yet. Equip this adventure with some loot.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {items.map((item) => {
            const isExpanded = expandedId === item.id;
            const itemData = ITEMS.find(
              (it) => it.name.toLowerCase() === item.name.toLowerCase(),
            );
            const storyRef = !itemData
              ? findSectionIndex(adventureSource, "item", item.name)
              : null;

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
                      gap: "12px",
                    }}
                  >
                    <span
                      style={{
                        color: GOLD_BRIGHT,
                        fontSize: "14px",
                        fontFamily: "'Georgia', serif",
                      }}
                    >
                      {isExpanded ? "\u25BC" : "\u25B6"} {item.name}
                    </span>
                    <SourceBadge source={item.source} />
                    {itemData && <RarityBadge rarity={itemData.rarity} />}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {acceptedPlayers.length > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddToPlayerItemId(addToPlayerItemId === item.id ? null : item.id);
                        }}
                        style={{
                          background: "none",
                          border: "1px solid rgba(201,168,76,0.3)",
                          color: GOLD_MUTED,
                          fontSize: "11px",
                          cursor: "pointer",
                          padding: "3px 10px",
                          fontFamily: "'Georgia', serif",
                          borderRadius: "4px",
                          whiteSpace: "nowrap",
                        }}
                        title="Add to player inventory"
                      >
                        + Player
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeItem.mutate({ id: item.id });
                      }}
                      disabled={removeItem.isPending}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#e74c3c",
                        fontSize: "16px",
                        cursor: removeItem.isPending
                          ? "default"
                          : "pointer",
                        padding: "4px 8px",
                        fontFamily: "'Georgia', serif",
                        opacity: removeItem.isPending ? 0.5 : 1,
                      }}
                      title="Remove item"
                    >
                      x
                    </button>
                  </div>
                </div>

                {/* Add to Player dropdown */}
                {addToPlayerItemId === item.id && (
                  <div
                    style={{
                      background: "rgba(0,0,0,0.5)",
                      border: "1px solid rgba(201,168,76,0.3)",
                      borderRadius: "8px",
                      padding: "12px 16px",
                      marginTop: "8px",
                    }}
                  >
                    <p
                      style={{
                        color: GOLD,
                        fontSize: "11px",
                        fontFamily: SERIF,
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                        marginBottom: "8px",
                      }}
                    >
                      Add to Player Inventory
                    </p>
                    {!itemData && (
                      <p style={{
                        color: "#e74c3c",
                        fontSize: "11px",
                        fontFamily: SERIF,
                        marginBottom: "8px",
                        fontStyle: "italic",
                      }}>
                        This item is not in official sources and cannot be added to inventory.
                      </p>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {acceptedPlayers.map((player) => {
                        const charName = player.character
                          ? (player.character.name as string) ?? "Unknown"
                          : "No character";
                        return (
                          <button
                            key={player.id}
                            onClick={() => {
                              addInventoryItem.mutate({
                                adventurePlayerId: player.id,
                                itemName: item.name,
                                itemSource: item.source,
                              });
                            }}
                            disabled={addInventoryItem.isPending || !itemData}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              width: "100%",
                              textAlign: "left",
                              padding: "8px 10px",
                              background: "transparent",
                              border: "none",
                              borderBottom: "1px solid rgba(201,168,76,0.1)",
                              cursor: addInventoryItem.isPending || !itemData ? "default" : "pointer",
                              opacity: !itemData ? 0.4 : 1,
                              transition: "background 0.1s",
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background =
                                "rgba(201,168,76,0.1)";
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background =
                                "transparent";
                            }}
                          >
                            <span style={{ color: GOLD_BRIGHT, fontSize: "13px", fontFamily: SERIF, fontWeight: "bold" }}>
                              {player.user.username}
                            </span>
                            <span style={{ color: GOLD_MUTED, fontSize: "12px", fontFamily: SERIF }}>
                              ({charName})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {isExpanded && itemData && (
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
                      {itemData.type && (
                        <span
                          style={{
                            color: GOLD_MUTED,
                            fontSize: "13px",
                            fontFamily: SERIF,
                            fontStyle: "italic",
                          }}
                        >
                          {itemData.type}
                        </span>
                      )}
                      <RarityBadge rarity={itemData.rarity} />
                      <SourceBadge source={itemData.source} />
                    </div>

                    {/* Weight, value */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        marginBottom: "12px",
                        fontSize: "13px",
                        fontFamily: SERIF,
                      }}
                    >
                      {itemData.weight != null && (
                        <div>
                          <span style={{ color: GOLD, fontWeight: "bold" }}>
                            Weight{" "}
                          </span>
                          <span style={{ color: GOLD_BRIGHT }}>
                            {itemData.weight} lb.
                          </span>
                        </div>
                      )}
                      {itemData.value != null && (
                        <div>
                          <span style={{ color: GOLD, fontWeight: "bold" }}>
                            Value{" "}
                          </span>
                          <span style={{ color: GOLD_BRIGHT }}>
                            {itemData.value} gp
                          </span>
                        </div>
                      )}
                      {itemData.reqAttune && (
                        <div>
                          <span style={{ color: GOLD, fontWeight: "bold" }}>
                            Attunement{" "}
                          </span>
                          <span style={{ color: GOLD_BRIGHT }}>
                            {itemData.reqAttune}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Weapon stats */}
                    {itemData.weaponCategory && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          marginBottom: "12px",
                          fontSize: "13px",
                          fontFamily: SERIF,
                        }}
                      >
                        <div>
                          <span style={{ color: GOLD, fontWeight: "bold" }}>
                            Category{" "}
                          </span>
                          <span style={{ color: GOLD_BRIGHT }}>
                            {itemData.weaponCategory}
                          </span>
                        </div>
                        {itemData.dmg1 && (
                          <div>
                            <span
                              style={{ color: GOLD, fontWeight: "bold" }}
                            >
                              Damage{" "}
                            </span>
                            <span style={{ color: GOLD_BRIGHT }}>
                              {itemData.dmg1}
                              {itemData.dmgType
                                ? ` ${itemData.dmgType}`
                                : ""}
                              {itemData.dmg2 ? ` (2H: ${itemData.dmg2})` : ""}
                            </span>
                          </div>
                        )}
                        {itemData.range && (
                          <div>
                            <span
                              style={{ color: GOLD, fontWeight: "bold" }}
                            >
                              Range{" "}
                            </span>
                            <span style={{ color: GOLD_BRIGHT }}>
                              {itemData.range}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* AC for armor/shields */}
                    {(itemData.ac != null || itemData.bonusAc) && (
                      <div
                        style={{
                          marginBottom: "12px",
                          fontSize: "13px",
                          fontFamily: SERIF,
                        }}
                      >
                        {itemData.ac != null && (
                          <div>
                            <span
                              style={{ color: GOLD, fontWeight: "bold" }}
                            >
                              AC{" "}
                            </span>
                            <span style={{ color: GOLD_BRIGHT }}>
                              {itemData.ac}
                            </span>
                          </div>
                        )}
                        {itemData.bonusAc && (
                          <div>
                            <span
                              style={{ color: GOLD, fontWeight: "bold" }}
                            >
                              Bonus AC{" "}
                            </span>
                            <span style={{ color: GOLD_BRIGHT }}>
                              {itemData.bonusAc}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Description */}
                    {itemData.description && (
                      <div
                        style={{
                          borderTop: "1px solid rgba(201,168,76,0.2)",
                          paddingTop: "8px",
                        }}
                      >
                        <p
                          style={{
                            color: GOLD_BRIGHT,
                            fontSize: "13px",
                            fontFamily: SERIF,
                            lineHeight: "1.6",
                          }}
                          dangerouslySetInnerHTML={{
                            __html: parseTaggedText(itemData.description),
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {isExpanded && !itemData && storyRef && (
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
                    <p
                      style={{
                        color: TEXT_DIM,
                        fontSize: "13px",
                        fontFamily: SERIF,
                        marginBottom: "8px",
                      }}
                    >
                      This item was not found in the items data.
                    </p>
                    <button
                      onClick={() => onViewInStory(storyRef.sectionIndex)}
                      style={{
                        background: "none",
                        border: "none",
                        color: GOLD,
                        cursor: "pointer",
                        fontFamily: "'Georgia', serif",
                        fontSize: "13px",
                        padding: "0",
                        textDecoration: "underline",
                      }}
                    >
                      View in Story ({storyRef.sectionName})
                    </button>
                  </div>
                )}

                {isExpanded && !itemData && !storyRef && (
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
                    <p
                      style={{
                        color: TEXT_DIM,
                        fontSize: "13px",
                        fontFamily: SERIF,
                      }}
                    >
                      This item was not found in the items data or the
                      adventure story.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <SearchModal
        title="Add Item"
        open={showModal}
        onClose={() => setShowModal(false)}
        searchText={searchText}
        onSearchChange={setSearchText}
        isPending={addItem.isPending}
      >
        {searchText.length < 2 ? (
          <p
            style={{
              color: "#a89060",
              fontSize: "13px",
              fontFamily: "'Georgia', serif",
              textAlign: "center",
              padding: "20px",
            }}
          >
            Type at least 2 characters to search.
          </p>
        ) : filteredItems.length === 0 ? (
          <p
            style={{
              color: "#a89060",
              fontSize: "13px",
              fontFamily: "'Georgia', serif",
              textAlign: "center",
              padding: "20px",
            }}
          >
            No items found.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {filteredItems.map((item, i) => (
              <button
                key={`${item.name}-${item.source}-${i}`}
                onClick={() =>
                  addItem.mutate({
                    adventureId,
                    name: item.name,
                    source: item.source,
                  })
                }
                disabled={addItem.isPending}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  background: "transparent",
                  border: "none",
                  borderBottom: "1px solid rgba(201,168,76,0.1)",
                  cursor: addItem.isPending ? "default" : "pointer",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(201,168,76,0.1)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "transparent";
                }}
              >
                <span
                  style={{
                    color: "#e8d5a3",
                    fontSize: "14px",
                    fontFamily: "'Georgia', serif",
                    flex: 1,
                  }}
                >
                  {item.name}
                </span>
                <span
                  style={{
                    color: "#a89060",
                    fontSize: "12px",
                    fontFamily: "'Georgia', serif",
                    minWidth: "80px",
                  }}
                >
                  {item.type}
                </span>
                <RarityBadge rarity={item.rarity} />
                <SourceBadge source={item.source} />
              </button>
            ))}
          </div>
        )}
      </SearchModal>
    </div>
  );
}
