import { useState } from "react";
import { api } from "@/utils/api";
import {
  getClassStartingEquipment,
  getBackgroundStartingEquipment,
  type StartingEquipmentPreset,
  type StartingItem,
} from "@/lib/startingEquipmentData";
import { GOLD, GOLD_MUTED, GOLD_BRIGHT, SERIF, SourceBadge } from "./shared";

export function StartingItemsModal({
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
          quantity: si.quantity,
          displayName: si.displayName,
        });
      }
    }

    for (const bi of bgItems) {
      items.push({
        name: bi.name,
        source: bi.source,
        quantity: bi.quantity,
        displayName: bi.displayName,
      });
    }

    if (items.length === 0) return;

    addStartingItems.mutate({
      adventurePlayerId,
      items,
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1001,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "rgba(15,8,3,0.95)",
          border: "2px solid #c9a84c",
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "600px",
          width: "90%",
          maxHeight: "80vh",
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
          <h2
            style={{
              color: GOLD,
              fontSize: "18px",
              fontWeight: "bold",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              fontFamily: SERIF,
            }}
          >
            Starting Equipment
          </h2>
          <button
            onClick={onClose}
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

        <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
          {/* Class equipment presets */}
          {classPresets.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <p
                style={{
                  color: GOLD,
                  fontSize: "12px",
                  fontWeight: "bold",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  marginBottom: "10px",
                  fontFamily: SERIF,
                }}
              >
                {characterClass} Equipment
              </p>

              {/* Preset selection pills */}
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  marginBottom: "12px",
                  flexWrap: "wrap",
                }}
              >
                {classPresets.map((preset, idx) => {
                  const isSelected = idx === selectedPresetIdx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedPresetIdx(idx)}
                      style={{
                        background: isSelected
                          ? "linear-gradient(135deg, #8b6914, #c9a84c)"
                          : "rgba(201,168,76,0.1)",
                        color: isSelected ? "#1a1a2e" : GOLD_BRIGHT,
                        border: isSelected
                          ? "none"
                          : "1px solid rgba(201,168,76,0.3)",
                        borderRadius: "20px",
                        padding: "6px 16px",
                        fontSize: "12px",
                        fontFamily: SERIF,
                        fontWeight: isSelected ? "bold" : "normal",
                        cursor: "pointer",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Selected preset items */}
              {selectedPreset && (
                <div
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(201,168,76,0.15)",
                    borderRadius: "8px",
                    padding: "12px 16px",
                  }}
                >
                  {selectedPreset.items.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "4px 0",
                        borderBottom:
                          idx < selectedPreset.items.length - 1
                            ? "1px solid rgba(201,168,76,0.1)"
                            : "none",
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
                        {item.displayName ?? item.name}
                        {item.quantity > 1 ? ` (x${item.quantity})` : ""}
                      </span>
                      {item.source && <SourceBadge source={item.source} />}
                    </div>
                  ))}
                </div>
              )}

              {classEquip?.goldAlternative && (
                <p
                  style={{
                    color: GOLD_MUTED,
                    fontSize: "12px",
                    fontFamily: SERIF,
                    fontStyle: "italic",
                    marginTop: "8px",
                  }}
                >
                  Gold alternative: {classEquip.goldAlternative}
                </p>
              )}
            </div>
          )}

          {/* Background equipment */}
          {bgItems.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <p
                style={{
                  color: GOLD,
                  fontSize: "12px",
                  fontWeight: "bold",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  marginBottom: "10px",
                  fontFamily: SERIF,
                }}
              >
                {background} Background Equipment
              </p>
              <div
                style={{
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(201,168,76,0.15)",
                  borderRadius: "8px",
                  padding: "12px 16px",
                }}
              >
                {bgItems.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "4px 0",
                      borderBottom:
                        idx < bgItems.length - 1
                          ? "1px solid rgba(201,168,76,0.1)"
                          : "none",
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
                      {item.displayName ?? item.name}
                      {item.quantity > 1 ? ` (x${item.quantity})` : ""}
                    </span>
                    {item.source && <SourceBadge source={item.source} />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {classPresets.length === 0 && bgItems.length === 0 && (
            <p
              style={{
                color: GOLD_MUTED,
                fontSize: "13px",
                fontFamily: SERIF,
                textAlign: "center",
                padding: "20px",
              }}
            >
              No starting equipment data found for this class/background combination.
            </p>
          )}
        </div>

        {/* Confirm button */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
            marginTop: "16px",
            paddingTop: "16px",
            borderTop: "1px solid rgba(201,168,76,0.2)",
          }}
        >
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "1px solid rgba(201,168,76,0.3)",
              color: GOLD_MUTED,
              borderRadius: "6px",
              padding: "8px 20px",
              fontSize: "12px",
              fontFamily: SERIF,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={
              addStartingItems.isPending ||
              (classPresets.length === 0 && bgItems.length === 0)
            }
            style={{
              background: "linear-gradient(135deg, #8b6914, #c9a84c)",
              color: "#1a1a2e",
              border: "none",
              borderRadius: "6px",
              padding: "8px 20px",
              fontSize: "12px",
              fontFamily: SERIF,
              fontWeight: "bold",
              cursor:
                addStartingItems.isPending ||
                (classPresets.length === 0 && bgItems.length === 0)
                  ? "default"
                  : "pointer",
              opacity:
                addStartingItems.isPending ||
                (classPresets.length === 0 && bgItems.length === 0)
                  ? 0.6
                  : 1,
            }}
          >
            {addStartingItems.isPending ? "Adding..." : "Confirm Starting Items"}
          </button>
        </div>
      </div>
    </div>
  );
}
