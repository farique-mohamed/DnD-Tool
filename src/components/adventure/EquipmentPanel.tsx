import { api } from "@/utils/api";
import { useItems } from "@/hooks/useStaticData";
import type { Item } from "@/lib/itemsData";
import { LoadingSkeleton } from "@/components/ui";
import {
  type EquipmentSlot,
  type EquippedItems,
  WEAPON_MASTERY_DESCRIPTIONS,
  WEAPON_PROPERTY_DESCRIPTIONS,
} from "@/lib/equipmentData";
import { GOLD, GOLD_MUTED, GOLD_BRIGHT, TEXT_DIM, SERIF } from "./shared";

const EQUIPMENT_SLOT_LABELS: Record<EquipmentSlot, string> = {
  mainHand: "Main Hand",
  offHand: "Off Hand",
  armor: "Armor",
  shield: "Shield",
};

const EQUIPMENT_SLOT_ORDER: EquipmentSlot[] = ["mainHand", "offHand", "armor", "shield"];

export function EquipmentPanel({
  adventurePlayerId,
  characterClass,
  dexterity,
  inventoryItems,
}: {
  adventurePlayerId: string;
  characterClass: string;
  dexterity: number;
  inventoryItems: Array<{
    id: string;
    itemName: string;
    itemSource: string;
    quantity: number;
  }>;
}) {
  const utils = api.useUtils();

  const { data: equipmentStatus } = api.adventure.getEquipmentStatus.useQuery(
    { adventurePlayerId },
    { enabled: !!adventurePlayerId },
  );

  const unequipItem = api.adventure.unequipItem.useMutation({
    onSuccess: () => {
      void utils.adventure.getEquipmentStatus.invalidate({ adventurePlayerId });
      void utils.adventure.getInventory.invalidate();
    },
  });

  const { data: itemHookData, isLoading: itemsHookLoading } = useItems();

  if (itemsHookLoading || !itemHookData) return <LoadingSkeleton />;
  const { ITEMS } = itemHookData;

  // Parse equipped items from status or fallback
  const equippedItems: EquippedItems = equipmentStatus?.equippedItems ?? {
    mainHand: null,
    offHand: null,
    armor: null,
    shield: null,
  };

  const computedAC = equipmentStatus?.ac?.ac ?? 10;
  const acBreakdown = equipmentStatus?.ac?.breakdown ?? "10 base";
  const armorPenalties: string[] = equipmentStatus?.armorPenalties?.penalties ?? [];
  const equipmentActions = equipmentStatus?.equipmentActions ?? [];
  const rawMasteries = equipmentStatus?.weaponMasteries ?? [];

  // Flatten weapon masteries into display format
  const weaponMasteries: Array<{ weapon: string; mastery: string; description: string }> =
    rawMasteries.flatMap((wm) =>
      wm.masteries.map((m: string) => ({
        weapon: wm.weaponName,
        mastery: m,
        description: WEAPON_MASTERY_DESCRIPTIONS?.[m] ?? "",
      })),
    );

  const handleUnequip = (slot: EquipmentSlot) => {
    unequipItem.mutate({ adventurePlayerId, slot });
  };

  return (
    <div
      style={{
        background: "rgba(0,0,0,0.5)",
        border: "1px solid rgba(201,168,76,0.3)",
        borderRadius: "12px",
        padding: "20px 24px",
        marginBottom: "20px",
      }}
    >
      {/* Header */}
      <p
        style={{
          color: GOLD,
          fontSize: "14px",
          fontWeight: "bold",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          fontFamily: SERIF,
          marginBottom: "16px",
          paddingBottom: "10px",
          borderBottom: `1px solid rgba(201,168,76,0.25)`,
        }}
      >
        Equipment
      </p>

      {/* Equipment Slots */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
        {EQUIPMENT_SLOT_ORDER.map((slot) => {
          const equippedName = equippedItems[slot];
          const equippedItemData = equippedName
            ? ITEMS.find((it) => it.name.toLowerCase() === equippedName.toLowerCase())
            : undefined;

          return (
            <div
              key={slot}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "8px 12px",
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(201,168,76,0.15)",
                borderRadius: "6px",
              }}
            >
              <span
                style={{
                  color: GOLD_MUTED,
                  fontSize: "12px",
                  fontFamily: SERIF,
                  fontWeight: "bold",
                  letterSpacing: "0.5px",
                  minWidth: "90px",
                  textTransform: "uppercase",
                }}
              >
                {EQUIPMENT_SLOT_LABELS[slot]}
              </span>

              {equippedName ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, flexWrap: "wrap" }}>
                  <span
                    style={{
                      color: GOLD_BRIGHT,
                      fontSize: "14px",
                      fontFamily: SERIF,
                    }}
                  >
                    {equippedName}
                  </span>

                  {/* Weapon properties as tags */}
                  {equippedItemData?.property && equippedItemData.property.length > 0 && (
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      {equippedItemData.property.map((prop) => (
                        <span
                          key={prop}
                          title={WEAPON_PROPERTY_DESCRIPTIONS?.[prop] ?? prop}
                          style={{
                            color: TEXT_DIM,
                            fontSize: "10px",
                            fontFamily: SERIF,
                            background: "rgba(201,168,76,0.1)",
                            border: "1px solid rgba(201,168,76,0.2)",
                            borderRadius: "3px",
                            padding: "1px 6px",
                            letterSpacing: "0.3px",
                          }}
                        >
                          {prop}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Mastery tag */}
                  {equippedItemData?.mastery && equippedItemData.mastery.length > 0 && (
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      {equippedItemData.mastery.map((m) => (
                        <span
                          key={m}
                          title={WEAPON_MASTERY_DESCRIPTIONS?.[m] ?? m}
                          style={{
                            color: "#88aaff",
                            fontSize: "10px",
                            fontFamily: SERIF,
                            background: "rgba(136,170,255,0.1)",
                            border: "1px solid rgba(136,170,255,0.25)",
                            borderRadius: "3px",
                            padding: "1px 6px",
                            letterSpacing: "0.3px",
                            fontWeight: "bold",
                          }}
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => handleUnequip(slot)}
                    disabled={unequipItem.isPending}
                    style={{
                      background: "rgba(204,68,68,0.15)",
                      border: "1px solid rgba(204,68,68,0.35)",
                      color: "#cc4444",
                      borderRadius: "4px",
                      padding: "2px 10px",
                      fontSize: "11px",
                      fontFamily: SERIF,
                      cursor: unequipItem.isPending ? "default" : "pointer",
                      opacity: unequipItem.isPending ? 0.5 : 1,
                      marginLeft: "auto",
                    }}
                  >
                    Unequip
                  </button>
                </div>
              ) : (
                <span
                  style={{
                    color: TEXT_DIM,
                    fontSize: "13px",
                    fontFamily: SERIF,
                    fontStyle: "italic",
                  }}
                >
                  — (none)
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* AC Display */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "10px 14px",
          background: "rgba(201,168,76,0.08)",
          border: "1px solid rgba(201,168,76,0.2)",
          borderRadius: "6px",
          marginBottom: "10px",
        }}
      >
        <span
          style={{
            color: GOLD,
            fontSize: "16px",
            fontWeight: "bold",
            fontFamily: SERIF,
          }}
        >
          AC: {computedAC}
        </span>
        <span
          style={{
            color: TEXT_DIM,
            fontSize: "12px",
            fontFamily: SERIF,
          }}
        >
          ({acBreakdown})
        </span>
      </div>

      {/* Armor Proficiency Warnings */}
      {armorPenalties.length > 0 && (
        <div
          style={{
            padding: "10px 14px",
            background: "rgba(204,68,68,0.08)",
            border: "1px solid rgba(204,68,68,0.25)",
            borderRadius: "6px",
            marginBottom: "10px",
          }}
        >
          {armorPenalties.map((penalty, i) => (
            <p
              key={i}
              style={{
                color: "#cc4444",
                fontSize: "12px",
                fontFamily: SERIF,
                marginBottom: i < armorPenalties.length - 1 ? "4px" : 0,
              }}
            >
              Warning: {penalty}
            </p>
          ))}
        </div>
      )}

      {/* Weapon Mastery Info */}
      {weaponMasteries.length > 0 && (
        <div
          style={{
            padding: "10px 14px",
            background: "rgba(136,170,255,0.06)",
            border: "1px solid rgba(136,170,255,0.2)",
            borderRadius: "6px",
            marginBottom: "10px",
          }}
        >
          <p
            style={{
              color: "#88aaff",
              fontSize: "11px",
              fontFamily: SERIF,
              fontWeight: "bold",
              letterSpacing: "1px",
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            Weapon Mastery
          </p>
          {weaponMasteries.map((wm, i) => (
            <p
              key={i}
              style={{
                color: GOLD_BRIGHT,
                fontSize: "12px",
                fontFamily: SERIF,
                marginBottom: i < weaponMasteries.length - 1 ? "4px" : 0,
              }}
            >
              <span style={{ color: "#88aaff", fontWeight: "bold" }}>{wm.mastery}</span>
              {" "}({wm.weapon})
              {wm.description && (
                <span style={{ color: TEXT_DIM }}> — {wm.description}</span>
              )}
            </p>
          ))}
        </div>
      )}

      {/* Equipment-derived Actions */}
      {equipmentActions.length > 0 && (
        <div
          style={{
            padding: "10px 14px",
            background: "rgba(74,124,42,0.08)",
            border: "1px solid rgba(74,124,42,0.2)",
            borderRadius: "6px",
          }}
        >
          <p
            style={{
              color: "#4a7c2a",
              fontSize: "11px",
              fontFamily: SERIF,
              fontWeight: "bold",
              letterSpacing: "1px",
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            Equipment Actions
          </p>
          {equipmentActions.map((ea, i) => (
            <div
              key={i}
              style={{
                marginBottom: i < equipmentActions.length - 1 ? "6px" : 0,
              }}
            >
              <span
                style={{
                  color: GOLD_BRIGHT,
                  fontSize: "13px",
                  fontFamily: SERIF,
                  fontWeight: "bold",
                }}
              >
                {ea.name}
              </span>
              <span
                style={{
                  color: TEXT_DIM,
                  fontSize: "11px",
                  fontFamily: SERIF,
                  marginLeft: "8px",
                }}
              >
                [{ea.cost}]
              </span>
              <p
                style={{
                  color: GOLD_BRIGHT,
                  fontSize: "12px",
                  fontFamily: SERIF,
                  marginTop: "2px",
                  lineHeight: 1.5,
                }}
              >
                {ea.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
