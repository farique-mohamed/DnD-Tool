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

  // Compute equipment-based actions if equipment data is available
  const equipmentActionsList = equippedItems
    ? getEquipmentActions(equippedItems, character.characterClass, character.level, ITEMS)
    : undefined;

  // Use equipment-aware actions if equipment data is available, otherwise fall back
  const actions = equipmentActionsList
    ? getCharacterActionsWithEquipment(character.characterClass, character.level, equipmentActionsList)
    : getCharacterActions(character.characterClass, character.level);

  const grouped: Record<string, ActionEntry[]> = {};
  for (const cost of ACTION_COST_ORDER) {
    grouped[cost] = [];
  }
  for (const action of actions) {
    if (grouped[action.cost]) {
      grouped[action.cost]!.push(action);
    }
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
