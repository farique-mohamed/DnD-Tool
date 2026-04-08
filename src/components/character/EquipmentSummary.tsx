import {
  type EquipmentSlot,
  type EquippedItems,
  WEAPON_MASTERY_DESCRIPTIONS,
  WEAPON_PROPERTY_DESCRIPTIONS,
  getArmorProficiencyPenalties,
} from "@/lib/equipmentData";
import { ITEMS } from "@/lib/itemsData";
import { type CharacterData } from "./shared";

const EQUIP_SLOT_LABELS: Record<string, string> = {
  mainHand: "Main Hand",
  offHand: "Off Hand",
  armor: "Armor",
  shield: "Shield",
};

export function EquipmentSummary({ character }: { character: CharacterData }) {
  const equippedItems: EquippedItems | null = (() => {
    if (!character.equippedItems) return null;
    try {
      return JSON.parse(character.equippedItems) as EquippedItems;
    } catch {
      return null;
    }
  })();

  if (!equippedItems) return null;

  const hasAnyEquipped = equippedItems.mainHand || equippedItems.offHand || equippedItems.armor || equippedItems.shield;
  if (!hasAnyEquipped) return null;

  const slots: EquipmentSlot[] = ["mainHand", "offHand", "armor", "shield"];

  return (
    <div
      style={{
        marginTop: "16px",
        padding: "12px 16px",
        background: "rgba(0,0,0,0.3)",
        border: "1px solid rgba(201,168,76,0.15)",
        borderRadius: "8px",
      }}
    >
      <p
        style={{
          color: "#c9a84c",
          fontSize: "10px",
          fontWeight: "bold",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          fontFamily: "'EB Garamond', 'Georgia', serif",
          marginBottom: "8px",
        }}
      >
        Equipment
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {slots.map((slot) => {
          const name = equippedItems[slot];
          if (!name) return null;
          const itemData = ITEMS.find((it) => it.name.toLowerCase() === name.toLowerCase());
          return (
            <div
              key={slot}
              style={{
                background: "rgba(201,168,76,0.08)",
                border: "1px solid rgba(201,168,76,0.2)",
                borderRadius: "6px",
                padding: "6px 12px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span
                style={{
                  color: "#a89060",
                  fontSize: "10px",
                  fontFamily: "'EB Garamond', 'Georgia', serif",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {EQUIP_SLOT_LABELS[slot]}:
              </span>
              <span
                style={{
                  color: "#e8d5a3",
                  fontSize: "12px",
                  fontFamily: "'EB Garamond', 'Georgia', serif",
                }}
              >
                {name}
              </span>
              {/* Damage for weapons */}
              {itemData?.dmg1 && (
                <span
                  style={{
                    color: "#e8d5a3",
                    fontSize: "10px",
                    fontFamily: "'EB Garamond', 'Georgia', serif",
                    background: "rgba(232,213,163,0.08)",
                    border: "1px solid rgba(232,213,163,0.15)",
                    borderRadius: "3px",
                    padding: "1px 5px",
                  }}
                >
                  {itemData.dmg1}
                  {itemData.dmg2 ? ` / ${itemData.dmg2}` : ""}
                  {itemData.dmgType ? ` ${itemData.dmgType}` : ""}
                </span>
              )}
              {/* Property badge */}
              {itemData?.property && itemData.property.length > 0 && (
                <span
                  title={itemData.property.map(p => {
                    const name = p.charAt(0).toUpperCase() + p.slice(1);
                    return `${name}: ${WEAPON_PROPERTY_DESCRIPTIONS[p] ?? p}`;
                  }).join("\n")}
                  style={{
                    color: "#a89060",
                    fontSize: "9px",
                    fontFamily: "'EB Garamond', 'Georgia', serif",
                    background: "rgba(168,144,96,0.1)",
                    border: "1px solid rgba(168,144,96,0.2)",
                    borderRadius: "3px",
                    padding: "1px 5px",
                  }}
                >
                  {itemData.property.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(", ")}
                </span>
              )}
              {/* Mastery badge */}
              {itemData?.mastery && itemData.mastery.length > 0 && (
                <span
                  title={itemData.mastery.map((m) => WEAPON_MASTERY_DESCRIPTIONS?.[m] ?? m).join(", ")}
                  style={{
                    color: "#88aaff",
                    fontSize: "9px",
                    fontFamily: "'EB Garamond', 'Georgia', serif",
                    background: "rgba(136,170,255,0.1)",
                    border: "1px solid rgba(136,170,255,0.2)",
                    borderRadius: "3px",
                    padding: "1px 5px",
                    fontWeight: "bold",
                  }}
                >
                  {itemData.mastery.join(", ")}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Armor proficiency warnings */}
      {(() => {
        const result = getArmorProficiencyPenalties(
          equippedItems,
          character.characterClass,
          character.strength,
          ITEMS,
        );
        if (!result || result.penalties.length === 0) return null;
        return (
          <div style={{ marginTop: "8px" }}>
            {result.penalties.map((penalty: string, i: number) => (
              <p
                key={i}
                style={{
                  color: "#cc4444",
                  fontSize: "11px",
                  fontFamily: "'EB Garamond', 'Georgia', serif",
                }}
              >
                Warning: {penalty}
              </p>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
