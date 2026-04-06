import { getCharacterActions, getCharacterActionsWithEquipment } from "@/lib/actionEconomy";
import type { ActionEntry } from "@/lib/actionEconomy";
import {
  type EquippedItems,
  getEquipmentActions,
} from "@/lib/equipmentData";
import { ITEMS } from "@/lib/itemsData";
import { type CharacterData } from "./shared";

const ACTION_COST_ORDER = [
  "Action",
  "Bonus Action",
  "Reaction",
  "No Action",
  "Special",
] as const;

function costBadgeStyle(cost: string): React.CSSProperties {
  if (cost === "Action") {
    return {
      background: "rgba(201,168,76,0.15)",
      border: "1px solid rgba(201,168,76,0.35)",
      color: "#c9a84c",
    };
  }
  if (cost === "Bonus Action") {
    return {
      background: "rgba(91,155,213,0.15)",
      border: "1px solid rgba(91,155,213,0.35)",
      color: "#5b9bd5",
    };
  }
  if (cost === "Reaction") {
    return {
      background: "rgba(74,124,42,0.15)",
      border: "1px solid rgba(74,124,42,0.35)",
      color: "#4a7c2a",
    };
  }
  if (cost === "No Action") {
    return {
      background: "rgba(201,168,76,0.08)",
      border: "1px solid rgba(201,168,76,0.18)",
      color: "#a89060",
    };
  }
  return {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "#a89060",
  };
}

export function ActionsTab({ character }: { character: CharacterData }) {
  // Parse equipped items if available
  const equippedItems: EquippedItems | undefined = (() => {
    if (!character.equippedItems) return undefined;
    try {
      return JSON.parse(character.equippedItems) as EquippedItems;
    } catch {
      return undefined;
    }
  })();

  // Check if character has chosen the Two-Weapon Fighting *fighting style*
  const hasTwoWeaponFightingStyle = (() => {
    try {
      const selections = JSON.parse(character.levelUpSelections || "{}") as Record<string, string[]>;
      return Object.values(selections).some((arr) => arr.includes("Two-Weapon Fighting"));
    } catch {
      return false;
    }
  })();

  // Compute equipment-based actions if equipment data is available
  const equipmentActionsList = equippedItems
    ? getEquipmentActions(equippedItems, character.characterClass, character.level, ITEMS)
    : undefined;

  // Use equipment-aware actions if equipment data is available, otherwise fall back
  let actions = equipmentActionsList
    ? getCharacterActionsWithEquipment(character.characterClass, character.level, equipmentActionsList)
    : getCharacterActions(character.characterClass, character.level);

  // If the character has the Two-Weapon Fighting fighting style, update the offhand attack description
  if (hasTwoWeaponFightingStyle) {
    actions = actions.map((a) => {
      if (a.name === "Two-Weapon Fighting (Offhand Attack)") {
        return {
          ...a,
          description: "When you take the Attack action with a light melee weapon, attack with a different light melee weapon in your off-hand. You add your ability modifier to the damage of this attack (Two-Weapon Fighting style).",
        };
      }
      // Also update equipment-generated offhand attacks
      if (a.name.includes("Offhand Attack") && a.feature === "Two-Weapon Fighting") {
        return {
          ...a,
          description: a.description.replace(
            "Don't add your ability modifier to damage unless negative.",
            "Add your ability modifier to the damage (Two-Weapon Fighting style).",
          ),
        };
      }
      return a;
    });
  }

  const grouped: Record<string, ActionEntry[]> = {};
  for (const cost of ACTION_COST_ORDER) {
    grouped[cost] = [];
  }
  for (const action of actions) {
    if (grouped[action.cost]) {
      grouped[action.cost]!.push(action);
    }
  }

  // Deduplicate "No Action" entries with same feature (e.g., same weapon property on two weapons)
  const noActions = grouped["No Action"] ?? [];
  if (noActions.length > 0) {
    const featureMap = new Map<string, { action: ActionEntry; weapons: string[]; count: number }>();
    const deduped: ActionEntry[] = [];

    for (const action of noActions) {
      const feature = action.feature ?? "";
      const isWeaponProp = feature.startsWith("Weapon Property:") || feature.startsWith("Weapon Mastery:");

      if (isWeaponProp && featureMap.has(feature)) {
        const existing = featureMap.get(feature)!;
        existing.count += 1;
        const match = action.name.match(/\((.+)\)$/);
        if (match) existing.weapons.push(match[1]!);
      } else if (isWeaponProp) {
        const match = action.name.match(/^(.+?)\s*\((.+)\)$/);
        const baseName = match ? match[1]! : action.name;
        const weaponInfo = match ? match[2]! : "";
        featureMap.set(feature, { action: { ...action, name: baseName }, weapons: [weaponInfo], count: 1 });
      } else {
        deduped.push(action);
      }
    }

    for (const { action, weapons, count } of featureMap.values()) {
      deduped.push({
        ...action,
        name: count > 1 ? action.name : `${action.name} (${weapons[0]})`,
        description: count > 1
          ? `${weapons.join(" & ")}: ${action.description.charAt(0).toLowerCase()}${action.description.slice(1)}`
          : action.description,
        feature: count > 1 ? `${action.feature} (\u00d7${count})` : action.feature,
      });
    }

    grouped["No Action"] = deduped;
  }

  const sectionTitle: React.CSSProperties = {
    color: "#c9a84c",
    fontSize: "12px",
    fontWeight: "bold",
    letterSpacing: "2px",
    textTransform: "uppercase",
    marginBottom: "12px",
    paddingBottom: "8px",
    borderBottom: "1px solid rgba(201,168,76,0.2)",
    fontFamily: "'Georgia', serif",
  };

  return (
    <div>
      {ACTION_COST_ORDER.map((cost) => {
        const group = grouped[cost] ?? [];
        if (group.length === 0) return null;
        return (
          <div key={cost} style={{ marginBottom: "28px" }}>
            <p style={sectionTitle}>{cost}s</p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {group.map((action, i) => (
                <div
                  key={`${action.name}-${i}`}
                  style={{
                    background: "rgba(0,0,0,0.5)",
                    border: "1px solid rgba(201,168,76,0.3)",
                    borderRadius: "10px",
                    padding: "14px 18px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      flexWrap: "wrap",
                      marginBottom: "6px",
                    }}
                  >
                    <span
                      style={{
                        color: "#e8d5a3",
                        fontSize: "14px",
                        fontWeight: "bold",
                        fontFamily: "'Georgia', serif",
                        flex: 1,
                      }}
                    >
                      {action.name}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "2px 10px",
                        borderRadius: "10px",
                        fontFamily: "'Georgia', serif",
                        letterSpacing: "0.5px",
                        ...costBadgeStyle(action.cost),
                      }}
                    >
                      {action.cost}
                    </span>
                  </div>
                  {action.feature && (
                    <p
                      style={{
                        color: "#a89060",
                        fontSize: "11px",
                        fontFamily: "'Georgia', serif",
                        fontStyle: "italic",
                        marginBottom: "4px",
                      }}
                    >
                      {action.feature}
                    </p>
                  )}
                  <p
                    style={{
                      color: "#e8d5a3",
                      fontSize: "13px",
                      fontFamily: "'Georgia', serif",
                      lineHeight: 1.6,
                    }}
                  >
                    {action.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
