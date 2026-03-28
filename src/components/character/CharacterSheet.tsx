import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { isSpellcaster } from "@/lib/spellSlotData";
import { type CharacterData, type TabId, proficiencyBonus, mod } from "./shared";
import { HpManager } from "./HpManager";
import { LevelUpPanel } from "./LevelUpPanel";
import { ClassFeaturesTab } from "./ClassFeaturesTab";
import { ActionsTab } from "./ActionsTab";
import { SpellsTab } from "./SpellsTab";
import { OverviewTab } from "./OverviewTab";
import { CharacterInventoryTab } from "./InventoryTab";
import { NotesTab } from "./NotesTab";
import { EquipmentSummary } from "./EquipmentSummary";

export function CharacterSheet({ character }: { character: CharacterData }) {
  const router = useRouter();
  const prof = proficiencyBonus(character.level);
  const initiative = mod(character.dexterity);
  const passivePerception = 10 + mod(character.wisdom);

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [showLevelUp, setShowLevelUp] = useState(false);

  const spellcaster = isSpellcaster(character.characterClass);

  const hasAcceptedAdventure = character.adventurePlayers?.some(
    (ap) => ap.status === "ACCEPTED",
  ) ?? false;

  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "features", label: "Class Features" },
    { id: "actions", label: "Actions" },
    ...(spellcaster ? [{ id: "spells" as TabId, label: "Spells" }] : []),
    ...(hasAcceptedAdventure ? [{ id: "inventory" as TabId, label: "Inventory" }] : []),
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
          fontFamily: "'Georgia', serif",
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
          padding: "28px 32px",
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
                  fontSize: "28px",
                  fontWeight: "bold",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  marginBottom: "0",
                  fontFamily: "'Georgia', serif",
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
                    fontFamily: "'Georgia', serif",
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
                fontFamily: "'Georgia', serif",
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
                    fontFamily: "'Georgia', serif",
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
                fontFamily: "'Georgia', serif",
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
                    marginTop: "8px",
                    padding: "2px 10px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontFamily: "'Georgia', serif",
                    letterSpacing: "0.3px",
                    background: ap.status === "ACCEPTED" ? "rgba(74,124,42,0.2)" : "rgba(201,168,76,0.15)",
                    border: ap.status === "ACCEPTED" ? "1px solid rgba(74,124,42,0.4)" : "1px solid rgba(201,168,76,0.3)",
                    color: ap.status === "ACCEPTED" ? "#4a7c2a" : "#a89060",
                    textDecoration: "none",
                  }}
                >
                  {ap.status === "ACCEPTED" ? "In" : "Pending"}: {ap.adventure.name}
                </Link>
              );
            })()}
          </div>
          {/* Combat quick stats */}
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            {[
              { label: "AC", value: character.armorClass },
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
                    fontFamily: "'Georgia', serif",
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
                    fontFamily: "'Georgia', serif",
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
          flexWrap: "wrap",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "8px 20px",
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
              fontFamily: "'Georgia', serif",
              fontSize: "13px",
              fontWeight: activeTab === tab.id ? "bold" : "normal",
              cursor: "pointer",
              letterSpacing: "0.5px",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && <OverviewTab character={character} />}
      {activeTab === "features" && <ClassFeaturesTab character={character} />}
      {activeTab === "actions" && <ActionsTab character={character} />}
      {activeTab === "spells" && spellcaster && (
        <SpellsTab character={character} />
      )}
      {activeTab === "inventory" && hasAcceptedAdventure && (
        <CharacterInventoryTab character={character} />
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
