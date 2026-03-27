import { useState } from "react";
import { api } from "@/utils/api";
import { type Item } from "@/lib/itemsData";
import { type EquipmentSlot } from "@/lib/equipmentData";
import { GOLD_BRIGHT, SERIF } from "./shared";

const EQUIPMENT_SLOT_LABELS: Record<EquipmentSlot, string> = {
  mainHand: "Main Hand",
  offHand: "Off Hand",
  armor: "Armor",
  shield: "Shield",
};

export function EquipButton({
  itemName,
  itemSource,
  adventurePlayerId,
  itemData,
}: {
  itemName: string;
  itemSource: string;
  adventurePlayerId: string;
  itemData: Item | undefined;
}) {
  const utils = api.useUtils();
  const [showSlotMenu, setShowSlotMenu] = useState(false);

  const equipItem = api.adventure.equipItem.useMutation({
    onSuccess: () => {
      void utils.adventure.getEquipmentStatus.invalidate({ adventurePlayerId });
      void utils.adventure.getInventory.invalidate();
      setShowSlotMenu(false);
    },
  });

  if (!itemData) return null;

  const typeLower = (itemData.type ?? "").toLowerCase();
  const isWeapon =
    typeLower.includes("weapon") ||
    typeLower.includes("sword") ||
    typeLower.includes("melee") ||
    typeLower.includes("ranged") ||
    !!itemData.weaponCategory;
  const isArmor = typeLower.includes("armor") && !typeLower.includes("shield");
  const isShield = typeLower.includes("shield");

  if (!isWeapon && !isArmor && !isShield) return null;

  const slots: EquipmentSlot[] = isArmor
    ? ["armor"]
    : isShield
      ? ["shield"]
      : ["mainHand", "offHand"];

  const handleEquip = (slot: EquipmentSlot) => {
    equipItem.mutate({ adventurePlayerId, itemName, itemSource, slot });
  };

  // Single slot — just show a button
  if (slots.length === 1) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleEquip(slots[0]!);
        }}
        disabled={equipItem.isPending}
        style={{
          background: "rgba(74,124,42,0.15)",
          border: "1px solid rgba(74,124,42,0.4)",
          color: "#4a7c2a",
          borderRadius: "4px",
          padding: "3px 12px",
          fontSize: "11px",
          fontFamily: SERIF,
          cursor: equipItem.isPending ? "default" : "pointer",
          opacity: equipItem.isPending ? 0.5 : 1,
          letterSpacing: "0.3px",
        }}
      >
        {equipItem.isPending ? "..." : "Equip"}
      </button>
    );
  }

  // Multiple slots — show dropdown
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowSlotMenu(!showSlotMenu);
        }}
        disabled={equipItem.isPending}
        style={{
          background: "rgba(74,124,42,0.15)",
          border: "1px solid rgba(74,124,42,0.4)",
          color: "#4a7c2a",
          borderRadius: "4px",
          padding: "3px 12px",
          fontSize: "11px",
          fontFamily: SERIF,
          cursor: equipItem.isPending ? "default" : "pointer",
          opacity: equipItem.isPending ? 0.5 : 1,
          letterSpacing: "0.3px",
        }}
      >
        {equipItem.isPending ? "..." : "Equip \u25BC"}
      </button>
      {showSlotMenu && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: "4px",
            background: "rgba(20,10,5,0.98)",
            border: "1px solid rgba(201,168,76,0.4)",
            borderRadius: "6px",
            padding: "4px 0",
            zIndex: 20,
            minWidth: "120px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.6)",
          }}
        >
          {slots.map((slot) => (
            <button
              key={slot}
              onClick={(e) => {
                e.stopPropagation();
                handleEquip(slot);
              }}
              style={{
                display: "block",
                width: "100%",
                background: "transparent",
                border: "none",
                color: GOLD_BRIGHT,
                fontSize: "12px",
                fontFamily: SERIF,
                padding: "6px 14px",
                cursor: "pointer",
                textAlign: "left",
                letterSpacing: "0.3px",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = "rgba(201,168,76,0.15)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = "transparent";
              }}
            >
              {EQUIPMENT_SLOT_LABELS[slot]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
