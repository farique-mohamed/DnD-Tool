import { useMemo, useState } from "react";
import { api } from "@/utils/api";
import { ITEMS, type Item } from "@/lib/itemsData";
import {
  GOLD,
  GOLD_MUTED,
  GOLD_BRIGHT,
  SERIF,
  SourceBadge,
  RarityBadge,
  SearchModal,
  InventoryItemDescription,
} from "./shared";
import { StartingItemsModal } from "./StartingItemsModal";

export function DmInventoryPanel({
  adventureId,
  adventurePlayerId,
  adventureItems,
  characterClass,
  classSource,
  background,
}: {
  adventureId: string;
  adventurePlayerId: string;
  adventureItems: { id: string; name: string; source: string }[];
  characterClass: string;
  classSource: string;
  background: string;
}) {
  const utils = api.useUtils();
  const [searchText, setSearchText] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddFromAdventureModal, setShowAddFromAdventureModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showStartingModal, setShowStartingModal] = useState(false);
  const [addItemSearch, setAddItemSearch] = useState("");
  const [editingQtyId, setEditingQtyId] = useState<string | null>(null);
  const [editingQtyValue, setEditingQtyValue] = useState("");

  const { data: inventoryItems = [], isLoading } =
    api.adventure.getInventory.useQuery(
      { adventureId, adventurePlayerId },
      { enabled: !!adventurePlayerId },
    );

  const addInventoryItem = api.adventure.addInventoryItem.useMutation({
    onSuccess: () => {
      void utils.adventure.getInventory.invalidate({ adventureId, adventurePlayerId });
      setShowAddFromAdventureModal(false);
      setShowAddItemModal(false);
      setAddItemSearch("");
    },
  });

  const removeInventoryItem = api.adventure.removeInventoryItem.useMutation({
    onSuccess: () => {
      void utils.adventure.getInventory.invalidate({ adventureId, adventurePlayerId });
    },
  });

  const updateInventoryItem = api.adventure.updateInventoryItem.useMutation({
    onSuccess: () => {
      void utils.adventure.getInventory.invalidate({ adventureId, adventurePlayerId });
      setEditingQtyId(null);
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

  const addItemFilteredResults = useMemo(() => {
    if (addItemSearch.length < 2) return [];
    const lower = addItemSearch.toLowerCase();
    const results: Item[] = [];
    for (const item of ITEMS) {
      if (item.name.toLowerCase().includes(lower)) {
        results.push(item);
        if (results.length >= 50) break;
      }
    }
    return results;
  }, [addItemSearch]);

  if (isLoading) {
    return (
      <p style={{ color: GOLD_MUTED, fontSize: "13px", fontFamily: SERIF }}>
        Loading inventory...
      </p>
    );
  }

  return (
    <div>
      {/* Action buttons */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => {
            setShowAddFromAdventureModal(true);
          }}
          style={{
            background: "linear-gradient(135deg, #8b6914, #c9a84c)",
            color: "#1a1a2e",
            border: "none",
            borderRadius: "6px",
            padding: "8px 16px",
            fontSize: "12px",
            fontFamily: "'Georgia', serif",
            fontWeight: "bold",
            cursor: "pointer",
            letterSpacing: "0.5px",
          }}
        >
          Add from Adventure
        </button>
        <button
          onClick={() => {
            setAddItemSearch("");
            setShowAddItemModal(true);
          }}
          style={{
            background: "linear-gradient(135deg, #8b6914, #c9a84c)",
            color: "#1a1a2e",
            border: "none",
            borderRadius: "6px",
            padding: "8px 16px",
            fontSize: "12px",
            fontFamily: "'Georgia', serif",
            fontWeight: "bold",
            cursor: "pointer",
            letterSpacing: "0.5px",
          }}
        >
          Add Item
        </button>
        {!hasStartingItems && (
          <button
            onClick={() => setShowStartingModal(true)}
            style={{
              background: "none",
              border: "1px solid rgba(201,168,76,0.4)",
              color: GOLD,
              borderRadius: "6px",
              padding: "8px 16px",
              fontSize: "12px",
              fontFamily: "'Georgia', serif",
              fontWeight: "bold",
              cursor: "pointer",
              letterSpacing: "0.5px",
            }}
          >
            Add Starting Items
          </button>
        )}
      </div>

      {/* Search */}
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
            fontFamily: "'Georgia', serif",
            borderRadius: "6px",
            padding: "8px 12px",
            width: "100%",
            fontSize: "13px",
            boxSizing: "border-box",
            outline: "none",
            marginBottom: "12px",
          }}
        />
      )}

      {/* Inventory list */}
      {typedItems.length === 0 ? (
        <p
          style={{
            color: GOLD_MUTED,
            fontSize: "13px",
            fontFamily: SERIF,
            fontStyle: "italic",
            textAlign: "center",
            padding: "20px",
          }}
        >
          No items in inventory yet.
        </p>
      ) : filteredItems.length === 0 ? (
        <p
          style={{
            color: GOLD_MUTED,
            fontSize: "13px",
            fontFamily: SERIF,
            textAlign: "center",
            padding: "20px",
          }}
        >
          No items match your search.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {filteredItems.map((item) => {
            const isExpanded = expandedId === item.id;
            const itemData = ITEMS.find(
              (it) =>
                it.name.toLowerCase() === item.itemName.toLowerCase() &&
                it.source.toLowerCase() === item.itemSource.toLowerCase(),
            ) ?? ITEMS.find(
              (it) => it.name.toLowerCase() === item.itemName.toLowerCase(),
            );
            const isEditingQty = editingQtyId === item.id;

            return (
              <div
                key={item.id}
                style={{
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid rgba(201,168,76,0.2)",
                  borderRadius: "8px",
                  padding: "10px 14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      flex: 1,
                      cursor: "pointer",
                      flexWrap: "wrap",
                    }}
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  >
                    <span
                      style={{
                        color: GOLD_BRIGHT,
                        fontSize: "13px",
                        fontFamily: "'Georgia', serif",
                      }}
                    >
                      {isExpanded ? "\u25BC" : "\u25B6"} {item.itemName}
                    </span>
                    {/* Editable quantity */}
                    {isEditingQty ? (
                      <input
                        type="number"
                        min={0}
                        value={editingQtyValue}
                        onChange={(e) => setEditingQtyValue(e.target.value)}
                        onBlur={() => {
                          const val = parseInt(editingQtyValue, 10);
                          if (!isNaN(val) && val >= 0) {
                            updateInventoryItem.mutate({
                              inventoryItemId: item.id,
                              quantity: val,
                            });
                          } else {
                            setEditingQtyId(null);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            (e.target as HTMLInputElement).blur();
                          }
                          if (e.key === "Escape") setEditingQtyId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        style={{
                          width: "50px",
                          padding: "2px 6px",
                          background: "rgba(30,15,5,0.9)",
                          border: "1px solid rgba(201,168,76,0.5)",
                          borderRadius: "4px",
                          color: GOLD_BRIGHT,
                          fontSize: "12px",
                          fontFamily: SERIF,
                          textAlign: "center",
                          outline: "none",
                        }}
                      />
                    ) : (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingQtyId(item.id);
                          setEditingQtyValue(String(item.quantity));
                        }}
                        style={{
                          color: GOLD,
                          fontSize: "11px",
                          fontFamily: "'Georgia', serif",
                          background: "rgba(201,168,76,0.15)",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontWeight: "bold",
                          cursor: "pointer",
                        }}
                        title="Click to edit quantity"
                      >
                        x{item.quantity}
                      </span>
                    )}
                    <SourceBadge source={item.itemSource} />
                    {item.isStartingItem && (
                      <span
                        style={{
                          color: "#4a8c3f",
                          fontSize: "9px",
                          fontFamily: "'Georgia', serif",
                          background: "rgba(74,140,63,0.15)",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          letterSpacing: "0.5px",
                          textTransform: "uppercase",
                        }}
                      >
                        Starting
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeInventoryItem.mutate({ inventoryItemId: item.id });
                    }}
                    disabled={removeInventoryItem.isPending}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#e74c3c",
                      fontSize: "14px",
                      cursor: removeInventoryItem.isPending ? "default" : "pointer",
                      padding: "4px 6px",
                      fontFamily: "'Georgia', serif",
                      opacity: removeInventoryItem.isPending ? 0.5 : 1,
                    }}
                    title="Remove item"
                  >
                    x
                  </button>
                </div>

                {isExpanded && (
                  <div
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(201,168,76,0.15)",
                      borderRadius: "8px",
                      padding: "12px 16px",
                      marginTop: "8px",
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

      {/* Add from Adventure Modal */}
      {showAddFromAdventureModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1002,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowAddFromAdventureModal(false)}
        >
          <div
            style={{
              background: "rgba(15,8,3,0.95)",
              border: "2px solid #c9a84c",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "500px",
              width: "90%",
              maxHeight: "70vh",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h3
                style={{
                  color: GOLD,
                  fontSize: "16px",
                  fontWeight: "bold",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  fontFamily: SERIF,
                }}
              >
                Add from Adventure Items
              </h3>
              <button
                onClick={() => setShowAddFromAdventureModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: GOLD_MUTED,
                  fontSize: "20px",
                  cursor: "pointer",
                  padding: "0 4px",
                }}
              >
                x
              </button>
            </div>

            {addInventoryItem.isPending && (
              <p style={{ color: GOLD_MUTED, fontSize: "13px", fontFamily: SERIF, textAlign: "center", padding: "8px" }}>
                Adding...
              </p>
            )}

            <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
              {adventureItems.length === 0 ? (
                <p style={{ color: GOLD_MUTED, fontSize: "13px", fontFamily: SERIF, textAlign: "center", padding: "20px" }}>
                  No items in the adventure yet.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {adventureItems.map((advItem) => {
                    const officialItem = ITEMS.find(
                      (it) =>
                        it.name.toLowerCase() === advItem.name.toLowerCase() &&
                        it.source.toLowerCase() === advItem.source.toLowerCase(),
                    ) ?? ITEMS.find(
                      (it) => it.name.toLowerCase() === advItem.name.toLowerCase(),
                    );
                    const isNonOfficial = !officialItem;

                    return (
                      <div
                        key={advItem.id}
                        style={{
                          padding: "8px 12px",
                          borderBottom: "1px solid rgba(201,168,76,0.1)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <span
                            style={{
                              color: GOLD_BRIGHT,
                              fontSize: "13px",
                              fontFamily: SERIF,
                              flex: 1,
                            }}
                          >
                            {advItem.name}
                          </span>
                          <SourceBadge source={advItem.source} />
                          <button
                            onClick={() => {
                              addInventoryItem.mutate({
                                adventurePlayerId,
                                itemName: advItem.name,
                                itemSource: advItem.source,
                              });
                            }}
                            disabled={addInventoryItem.isPending || isNonOfficial}
                            style={{
                              background: isNonOfficial
                                ? "rgba(100,100,100,0.4)"
                                : "linear-gradient(135deg, #8b6914, #c9a84c)",
                              color: isNonOfficial ? GOLD_MUTED : "#1a1a2e",
                              border: "none",
                              borderRadius: "4px",
                              padding: "4px 12px",
                              fontSize: "11px",
                              fontFamily: SERIF,
                              fontWeight: "bold",
                              cursor: addInventoryItem.isPending || isNonOfficial ? "default" : "pointer",
                              opacity: addInventoryItem.isPending ? 0.6 : isNonOfficial ? 0.5 : 1,
                            }}
                            title={isNonOfficial ? "Not in official sources" : undefined}
                          >
                            {isNonOfficial ? "N/A" : "Add"}
                          </button>
                        </div>
                        {isNonOfficial && (
                          <p style={{
                            color: GOLD_MUTED,
                            fontSize: "10px",
                            fontFamily: SERIF,
                            fontStyle: "italic",
                            marginTop: "4px",
                            opacity: 0.7,
                          }}>
                            Not found in official sources — cannot add to inventory
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Item (from all ITEMS) Modal */}
      <SearchModal
        title="Add Item to Inventory"
        open={showAddItemModal}
        onClose={() => setShowAddItemModal(false)}
        searchText={addItemSearch}
        onSearchChange={setAddItemSearch}
        isPending={addInventoryItem.isPending}
      >
        {addItemSearch.length < 2 ? (
          <p style={{ color: GOLD_MUTED, fontSize: "13px", fontFamily: "'Georgia', serif", textAlign: "center", padding: "20px" }}>
            Type at least 2 characters to search.
          </p>
        ) : addItemFilteredResults.length === 0 ? (
          <p style={{ color: GOLD_MUTED, fontSize: "13px", fontFamily: "'Georgia', serif", textAlign: "center", padding: "20px" }}>
            No items found.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {addItemFilteredResults.map((item, i) => (
              <button
                key={`${item.name}-${item.source}-${i}`}
                onClick={() =>
                  addInventoryItem.mutate({
                    adventurePlayerId,
                    itemName: item.name,
                    itemSource: item.source,
                  })
                }
                disabled={addInventoryItem.isPending}
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
                  cursor: addInventoryItem.isPending ? "default" : "pointer",
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
                <span style={{ color: GOLD_BRIGHT, fontSize: "13px", fontFamily: "'Georgia', serif", flex: 1 }}>
                  {item.name}
                </span>
                <span style={{ color: GOLD_MUTED, fontSize: "11px", fontFamily: "'Georgia', serif", minWidth: "70px" }}>
                  {item.type}
                </span>
                <RarityBadge rarity={item.rarity} />
                <SourceBadge source={item.source} />
              </button>
            ))}
          </div>
        )}
      </SearchModal>

      {/* Starting Items Modal */}
      <StartingItemsModal
        open={showStartingModal}
        onClose={() => setShowStartingModal(false)}
        characterClass={characterClass}
        classSource={classSource}
        background={background}
        adventurePlayerId={adventurePlayerId}
        adventureId={adventureId}
      />
    </div>
  );
}
