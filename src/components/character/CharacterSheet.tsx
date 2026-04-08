import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { isSpellcaster } from "@/lib/spellSlotData";
import { hasFeatSpells } from "@/lib/featData";
import { useIsMobile } from "@/hooks/useIsMobile";
import { type CharacterData, type TabId, proficiencyBonus, mod } from "./shared";
import { HpManager } from "./HpManager";
import { LevelUpPanel } from "./LevelUpPanel";
import { ClassFeaturesTab } from "./ClassFeaturesTab";
import { ActionsTab } from "./ActionsTab";
import { SpellsTab } from "./SpellsTab";
import { OverviewTab } from "./OverviewTab";
import { CharacterInventoryTab } from "./InventoryTab";
import { FamiliarsTab } from "./FamiliarsTab";
import { NotesTab } from "./NotesTab";
import { EquipmentSummary } from "./EquipmentSummary";
import { type EquippedItems, calculateEquippedAC } from "@/lib/equipmentData";
import { ITEMS } from "@/lib/itemsData";

export function CharacterSheet({ character }: { character: CharacterData }) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const prof = proficiencyBonus(character.level);
  const initiative = mod(character.dexterity);
  const passivePerception = 10 + mod(character.wisdom);

  // Compute AC from equipment if available
  const equippedItems: EquippedItems | null = (() => {
    if (!character.equippedItems) return null;
    try {
      return JSON.parse(character.equippedItems) as EquippedItems;
    } catch {
      return null;
    }
  })();

  const displayAC = (() => {
    if (!equippedItems) return character.armorClass;
    const hasAnyEquipped = equippedItems.mainHand || equippedItems.offHand || equippedItems.armor || equippedItems.shield;
    if (!hasAnyEquipped) return character.armorClass;
    const { ac } = calculateEquippedAC(
      equippedItems,
      mod(character.dexterity),
      mod(character.constitution),
      mod(character.wisdom),
      character.characterClass,
      ITEMS,
    );
    return ac;
  })();

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [showLevelUp, setShowLevelUp] = useState(false);

  const spellcaster = isSpellcaster(character.characterClass);

  // Also show Spells tab for characters with spell-granting feats
  const characterFeats: string[] = (() => {
    try { return character.feats ? JSON.parse(character.feats) as string[] : []; }
    catch { return []; }
  })();
  const hasFeatSpellGrants = hasFeatSpells(characterFeats, character.rulesSource ?? "PHB");
  const showSpellsTab = spellcaster || hasFeatSpellGrants;

  const hasAcceptedAdventure = character.adventurePlayers?.some(
    (ap) => ap.status === "ACCEPTED",
  ) ?? false;

  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "features", label: "Class Features" },
    { id: "actions", label: "Actions" },
    ...(showSpellsTab ? [{ id: "spells" as TabId, label: "Spells" }] : []),
    ...(hasAcceptedAdventure ? [{ id: "inventory" as TabId, label: "Inventory" }] : []),
    ...(hasAcceptedAdventure ? [{ id: "familiars" as TabId, label: "Familiars" }] : []),
    { id: "notes" as TabId, label: "Notes" },
  ];

  return (
    <div style={{ maxWidth: "860px" }}>
      {/* Back */}
      <button
        onClick={() => void router.push("/characters")}
        style={{
          background: "transparent",
          border: "none",
          color: "#a89060",
          fontFamily: "'EB Garamond', 'Georgia', serif",
          fontSize: "13px",
          cursor: "pointer",
          marginBottom: "24px",
          padding: 0,
          letterSpacing: "0.3px",
        }}
      >
        ← Back to Characters
      </button>

      {/* Header */}
      <div
        style={{
          background: "rgba(0,0,0,0.6)",
          border: "2px solid #c9a84c",
          borderRadius: "12px",
          boxShadow:
            "0 0 40px rgba(201,168,76,0.3), inset 0 0 60px rgba(0,0,0,0.5)",
          padding: isMobile ? "16px" : "28px 32px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                flexWrap: "wrap",
              }}
            >
              <h1
                style={{
                  color: "#c9a84c",
                  fontSize: isMobile ? "22px" : "28px",
                  fontWeight: "bold",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  marginBottom: "0",
                  fontFamily: "'EB Garamond', 'Georgia', serif",
                }}
              >
                {character.name}
              </h1>
              {character.level < 20 && (
                <button
                  onClick={() => setShowLevelUp(true)}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(201,168,76,0.5)",
                    color: "#c9a84c",
                    borderRadius: "4px",
                    padding: "4px 14px",
                    fontFamily: "'EB Garamond', 'Georgia', serif",
                    fontSize: "11px",
                    cursor: "pointer",
                    letterSpacing: "0.5px",
                  }}
                >
                  Level Up
                </button>
              )}
            </div>
            <p
              style={{
                color: "#a89060",
                fontSize: "14px",
                fontFamily: "'EB Garamond', 'Georgia', serif",
                marginTop: "6px",
              }}
            >
              Level {character.level} {character.race}{" "}
              {character.characterClass}
              {character.subclass ? ` — ${character.subclass}` : ""}
              {character.rulesSource && (
                <span
                  style={{
                    display: "inline-block",
                    marginLeft: "10px",
                    background: "rgba(201,168,76,0.12)",
                    border: "1px solid rgba(201,168,76,0.35)",
                    borderRadius: "4px",
                    padding: "1px 8px",
                    fontSize: "10px",
                    color: "#c9a84c",
                    fontFamily: "'EB Garamond', 'Georgia', serif",
                    letterSpacing: "0.5px",
                    verticalAlign: "middle",
                  }}
                >
                  {character.rulesSource === "XPHB" ? "XPHB 2024" : "PHB 2014"}
                </span>
              )}
            </p>
            <p
              style={{
                color: "#a89060",
                fontSize: "12px",
                marginTop: "2px",
                fontFamily: "'EB Garamond', 'Georgia', serif",
              }}
            >
              {character.alignment}
            </p>
            {character.adventurePlayers && character.adventurePlayers.length > 0 && (() => {
              const ap = character.adventurePlayers[0]!;
              return (
                <Link
                  href={`/adventures/${ap.adventure.id}`}
                  style={{
                    display: "inline-block",
                    marginTop: "10px",
                    padding: "6px 16px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontFamily: "'EB Garamond', 'Georgia', serif",
                    fontWeight: "bold",
                    letterSpacing: "0.5px",
                    background: ap.status === "ACCEPTED"
                      ? "linear-gradient(135deg, rgba(74,124,42,0.3), rgba(74,124,42,0.15))"
                      : "rgba(201,168,76,0.15)",
                    border: ap.status === "ACCEPTED"
                      ? "1px solid rgba(74,124,42,0.5)"
                      : "1px solid rgba(201,168,76,0.3)",
                    color: ap.status === "ACCEPTED" ? "#6abf40" : "#a89060",
                    textDecoration: "none",
                    cursor: "pointer",
                  }}
                >
                  {ap.status === "ACCEPTED" ? "⚔ Go to Adventure" : "⏳ Pending"}: {ap.adventure.name}
                </Link>
              );
            })()}
          </div>
          {/* Combat quick stats */}
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            {[
              { label: "AC", value: displayAC },
              { label: "Speed", value: `${character.speed}ft` },
              {
                label: "Initiative",
                value: initiative >= 0 ? `+${initiative}` : `${initiative}`,
              },
              { label: "Prof. Bonus", value: `+${prof}` },
              { label: "Passive Perc.", value: passivePerception },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div
                  style={{
                    color: "#b8934a",
                    fontSize: "10px",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    fontFamily: "'EB Garamond', 'Georgia', serif",
                    marginBottom: "4px",
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    color: "#e8d5a3",
                    fontSize: "20px",
                    fontWeight: "bold",
                    fontFamily: "'EB Garamond', 'Georgia', serif",
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <HpManager character={character} />

        {/* Equipment Summary (shown if character has equipped items) */}
        <EquipmentSummary character={character} />
      </div>

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "20px",
          flexWrap: isMobile ? "nowrap" : "wrap",
          ...(isMobile ? { overflowX: "auto", WebkitOverflowScrolling: "touch", msOverflowStyle: "none", scrollbarWidth: "none" } : {}),
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: isMobile ? "8px 12px" : "8px 20px",
              borderRadius: "6px",
              border:
                activeTab === tab.id
                  ? "none"
                  : "1px solid rgba(201,168,76,0.4)",
              background:
                activeTab === tab.id
                  ? "linear-gradient(135deg, #8b6914, #c9a84c)"
                  : "transparent",
              color: activeTab === tab.id ? "#1a1a2e" : "#c9a84c",
              fontFamily: "'EB Garamond', 'Georgia', serif",
              fontSize: isMobile ? "11px" : "13px",
              fontWeight: activeTab === tab.id ? "bold" : "normal",
              cursor: "pointer",
              letterSpacing: "0.5px",
              ...(isMobile ? { flexShrink: 0, whiteSpace: "nowrap" } : {}),
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && <OverviewTab character={character} isMobile={isMobile} />}
      {activeTab === "features" && <ClassFeaturesTab character={character} />}
      {activeTab === "actions" && <ActionsTab character={character} />}
      {activeTab === "spells" && spellcaster && (
        <SpellsTab character={character} />
      )}
      {activeTab === "inventory" && hasAcceptedAdventure && (
        <CharacterInventoryTab character={character} />
      )}
      {activeTab === "familiars" && hasAcceptedAdventure && (
        <FamiliarsTab character={character} />
      )}
      {activeTab === "notes" && <NotesTab character={character} />}

      {/* Level Up Modal */}
      {showLevelUp && (
        <LevelUpPanel
          character={character}
          onClose={() => setShowLevelUp(false)}
        />
      )}
    </div>
  );
}
