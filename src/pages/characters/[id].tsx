import { useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { api } from "@/utils/api";
import { getClassByName, getClassByNameAndSource } from "@/lib/classData";
import { getNewExpertiseAtLevel } from "@/lib/expertiseData";
import type { FeatureEntry, FeatureDescription } from "@/lib/classData";
import { getRaceByName, getRaceByNameAndSource } from "@/lib/raceData";
import type { RaceInfo } from "@/lib/raceData";
import { getSpellSlots, isSpellcaster, isWarlock } from "@/lib/spellSlotData";
import { getCharacterActions, getCharacterActionsWithEquipment } from "@/lib/actionEconomy";
import type { ActionEntry } from "@/lib/actionEconomy";
import {
  type EquipmentSlot,
  type EquippedItems,
  WEAPON_MASTERY_DESCRIPTIONS,
  WEAPON_PROPERTY_DESCRIPTIONS,
  calculateEquippedAC,
  getArmorProficiencyPenalties,
  getEquipmentActions,
} from "@/lib/equipmentData";
import { SPELLS } from "@/lib/spellsData";
import { getConditionsBySource } from "@/lib/conditionData";
import { getFeatsBySource, getFeatByNameAndSource } from "@/lib/featData";
import type { Feat } from "@/lib/featData";
import { ITEMS, type Item } from "@/lib/itemsData";
import {
  getClassStartingEquipment,
  getBackgroundStartingEquipment,
  type StartingEquipmentPreset,
  type StartingItem,
} from "@/lib/startingEquipmentData";
import { parseTaggedText } from "@/lib/dndTagParser";

// Proficiency bonus from level
function proficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}

// Ability score modifier
function mod(score: number): number {
  return Math.floor((score - 10) / 2);
}

function modStr(score: number): string {
  const m = mod(score);
  return m >= 0 ? `+${m}` : `${m}`;
}

const HIT_DIE_AVERAGE: Record<string, number> = {
  Barbarian: 7,
  Bard: 5,
  Cleric: 5,
  Druid: 5,
  Fighter: 6,
  Monk: 5,
  Paladin: 6,
  Ranger: 6,
  Rogue: 5,
  Sorcerer: 4,
  Warlock: 5,
  Wizard: 4,
  Artificer: 5,
  Mystic: 5,
  Sidekick: 5,
};

const HIT_DIE_SIZE: Record<string, number> = {
  Barbarian: 12,
  Bard: 8,
  Cleric: 8,
  Druid: 8,
  Fighter: 10,
  Monk: 8,
  Paladin: 10,
  Ranger: 10,
  Rogue: 8,
  Sorcerer: 6,
  Warlock: 8,
  Wizard: 6,
  Artificer: 8,
  Mystic: 8,
  Sidekick: 8,
};

const SAVING_THROW_PROFICIENCIES: Record<string, string[]> = {
  Barbarian: ["strength", "constitution"],
  Bard: ["dexterity", "charisma"],
  Cleric: ["wisdom", "charisma"],
  Druid: ["intelligence", "wisdom"],
  Fighter: ["strength", "constitution"],
  Monk: ["strength", "dexterity"],
  Paladin: ["wisdom", "charisma"],
  Ranger: ["strength", "dexterity"],
  Rogue: ["dexterity", "intelligence"],
  Sorcerer: ["constitution", "charisma"],
  Warlock: ["wisdom", "charisma"],
  Wizard: ["intelligence", "wisdom"],
};

const SKILLS: { name: string; ability: string }[] = [
  { name: "Acrobatics", ability: "dexterity" },
  { name: "Animal Handling", ability: "wisdom" },
  { name: "Arcana", ability: "intelligence" },
  { name: "Athletics", ability: "strength" },
  { name: "Deception", ability: "charisma" },
  { name: "History", ability: "intelligence" },
  { name: "Insight", ability: "wisdom" },
  { name: "Intimidation", ability: "charisma" },
  { name: "Investigation", ability: "intelligence" },
  { name: "Medicine", ability: "wisdom" },
  { name: "Nature", ability: "intelligence" },
  { name: "Perception", ability: "wisdom" },
  { name: "Performance", ability: "charisma" },
  { name: "Persuasion", ability: "charisma" },
  { name: "Religion", ability: "intelligence" },
  { name: "Sleight of Hand", ability: "dexterity" },
  { name: "Stealth", ability: "dexterity" },
  { name: "Survival", ability: "wisdom" },
];

const ABILITY_NAMES: { key: string; label: string }[] = [
  { key: "strength", label: "STR" },
  { key: "dexterity", label: "DEX" },
  { key: "constitution", label: "CON" },
  { key: "intelligence", label: "INT" },
  { key: "wisdom", label: "WIS" },
  { key: "charisma", label: "CHA" },
];

type CharacterData = {
  id: string;
  name: string;
  race: string;
  characterClass: string;
  level: number;
  alignment: string;
  backstory: string | null;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  maxHp: number;
  currentHp: number;
  tempHp: number;
  armorClass: number;
  speed: number;
  subclass: string | null;
  rulesSource?: string;
  spellSlotsUsed: string;
  skillProficiencies: string; // JSON string[]
  skillExpertise?: string; // JSON string[]
  preparedSpells: string; // JSON string[]
  featureUses: string; // JSON Record<string,number>
  activeConditions?: string; // JSON string[]
  feats?: string; // JSON string[]
  notes?: string;
  background?: string | null;
  equippedItems?: string; // JSON EquippedItems
  adventurePlayers?: Array<{
    id: string;
    status: string;
    adventure: { id: string; name: string; source: string };
  }>;
};

// ---------------------------------------------------------------------------
// HpManager
// ---------------------------------------------------------------------------

function HpManager({ character }: { character: CharacterData }) {
  const utils = api.useUtils();
  const [damageAmount, setDamageAmount] = useState<string>("");
  const [healAmount, setHealAmount] = useState<string>("");
  const [tempHpAmount, setTempHpAmount] = useState<string>("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showShortRest, setShowShortRest] = useState(false);
  const [hitDiceToSpend, setHitDiceToSpend] = useState<string>("1");

  const activeConditions: string[] = (() => {
    try {
      return JSON.parse(character.activeConditions || "[]") as string[];
    } catch {
      return [];
    }
  })();

  const allConditions = getConditionsBySource("PHB");

  const updateConditions = api.character.updateActiveConditions.useMutation({
    onSuccess: async () => {
      await utils.character.getById.invalidate({ id: character.id });
    },
    onError: (err) => {
      setFeedback(err.message);
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const toggleCondition = (name: string) => {
    const newList = activeConditions.includes(name)
      ? activeConditions.filter((c) => c !== name)
      : [...activeConditions, name];
    updateConditions.mutate({ id: character.id, activeConditions: newList });
  };

  const updateHp = api.character.updateHp.useMutation({
    onSuccess: async () => {
      await utils.character.getById.invalidate({ id: character.id });
      setDamageAmount("");
      setHealAmount("");
      setTempHpAmount("");
    },
    onError: (err) => {
      setFeedback(err.message);
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const longRest = api.character.longRest.useMutation({
    onSuccess: async () => {
      await utils.character.getById.invalidate({ id: character.id });
    },
    onError: (err) => {
      setFeedback(err.message);
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const shortRest = api.character.shortRest.useMutation({
    onSuccess: async () => {
      await utils.character.getById.invalidate({ id: character.id });
      setShowShortRest(false);
      setHitDiceToSpend("1");
    },
    onError: (err) => {
      setFeedback(err.message);
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const handleDamage = () => {
    const n = parseInt(damageAmount);
    if (!n || n <= 0) return;
    updateHp.mutate({ id: character.id, type: "damage", amount: n });
  };

  const handleHeal = () => {
    const n = parseInt(healAmount);
    if (!n || n <= 0) return;
    updateHp.mutate({ id: character.id, type: "heal", amount: n });
  };

  const handleSetTempHp = () => {
    const n = parseInt(tempHpAmount);
    if (isNaN(n) || n < 0) return;
    updateHp.mutate({ id: character.id, type: "setTempHp", amount: n });
  };

  const handleLongRest = () => {
    if (
      !window.confirm(
        "Take a long rest? This will fully restore HP, clear temp HP, and reset all spell slots.",
      )
    )
      return;
    longRest.mutate({ id: character.id });
  };

  const handleShortRest = () => {
    const dice = parseInt(hitDiceToSpend);
    if (isNaN(dice) || dice < 1) return;
    const conMod = mod(character.constitution);
    const hitDieAvg = HIT_DIE_AVERAGE[character.characterClass] ?? 5;
    const hpRecovered = Math.max(0, (hitDieAvg + conMod) * dice);
    shortRest.mutate({
      id: character.id,
      hpRecovered,
      isWarlock: isWarlock(character.characterClass),
    });
  };

  const conMod = mod(character.constitution);
  const hitDieAvg = HIT_DIE_AVERAGE[character.characterClass] ?? 5;
  const hitDieSize = HIT_DIE_SIZE[character.characterClass] ?? 8;
  const diceCount = parseInt(hitDiceToSpend) || 0;
  const previewHeal = Math.max(0, (hitDieAvg + conMod) * diceCount);

  const isLoading = updateHp.isPending;
  const hpPercent = Math.max(
    0,
    Math.min(100, (character.currentHp / character.maxHp) * 100),
  );

  const inputStyle: React.CSSProperties = {
    width: "70px",
    padding: "8px 10px",
    background: "rgba(30,15,5,0.9)",
    border: "1px solid rgba(201,168,76,0.4)",
    borderRadius: "6px",
    color: "#e8d5a3",
    fontSize: "14px",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    outline: "none",
    textAlign: "center",
  };

  const restButtonStyle: React.CSSProperties = {
    background: "transparent",
    border: "1px solid rgba(201,168,76,0.4)",
    color: "#c9a84c",
    borderRadius: "6px",
    padding: "6px 16px",
    fontFamily: "'Georgia', serif",
    fontSize: "12px",
    cursor: "pointer",
    letterSpacing: "0.5px",
  };

  return (
    <div style={{ marginTop: "20px" }}>
      {/* HP Display */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "6px",
        }}
      >
        <span
          style={{
            color: "#b8934a",
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontFamily: "'Georgia', serif",
          }}
        >
          Hit Points
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            style={{
              color: "#e8d5a3",
              fontSize: "14px",
              fontFamily: "'Georgia', serif",
            }}
          >
            {character.currentHp} / {character.maxHp}
          </span>
          {character.tempHp > 0 && (
            <span
              style={{
                color: "#5b9bd5",
                fontSize: "13px",
                fontFamily: "'Georgia', serif",
              }}
            >
              +{character.tempHp} temp
            </span>
          )}
        </div>
      </div>

      {/* HP bar */}
      <div
        style={{
          background: "rgba(255,255,255,0.1)",
          borderRadius: "4px",
          height: "10px",
          overflow: "hidden",
          position: "relative",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            width: `${hpPercent}%`,
            height: "100%",
            background:
              hpPercent > 50
                ? "#4a7c2a"
                : hpPercent > 25
                  ? "#c9a84c"
                  : "#e74c3c",
            borderRadius: "4px",
            transition: "width 0.3s",
            position: "absolute",
          }}
        />
        {character.tempHp > 0 && (
          <div
            style={{
              width: `${Math.min(100, (character.tempHp / character.maxHp) * 100)}%`,
              height: "100%",
              background: "rgba(91,155,213,0.5)",
              borderRadius: "4px",
              position: "absolute",
              right: 0,
            }}
          />
        )}
      </div>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "flex-end",
        }}
      >
        {/* Damage */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span
            style={{
              color: "#b8934a",
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontFamily: "'Georgia', serif",
            }}
          >
            Damage
          </span>
          <div style={{ display: "flex", gap: "6px" }}>
            <input
              type="number"
              min={1}
              value={damageAmount}
              onChange={(e) => setDamageAmount(e.target.value)}
              placeholder="0"
              style={inputStyle}
              disabled={isLoading}
              onKeyDown={(e) => e.key === "Enter" && handleDamage()}
            />
            <button
              onClick={handleDamage}
              disabled={isLoading || !damageAmount}
              style={{
                background: "linear-gradient(135deg, #8b1a1a, #c0392b)",
                color: "#f8d7d7",
                border: "none",
                borderRadius: "6px",
                padding: "8px 14px",
                fontSize: "13px",
                fontFamily: "'Georgia', serif",
                fontWeight: "bold",
                cursor: isLoading || !damageAmount ? "not-allowed" : "pointer",
                opacity: isLoading || !damageAmount ? 0.6 : 1,
              }}
            >
              Hit
            </button>
          </div>
        </div>

        {/* Heal */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span
            style={{
              color: "#b8934a",
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontFamily: "'Georgia', serif",
            }}
          >
            Heal
          </span>
          <div style={{ display: "flex", gap: "6px" }}>
            <input
              type="number"
              min={1}
              value={healAmount}
              onChange={(e) => setHealAmount(e.target.value)}
              placeholder="0"
              style={inputStyle}
              disabled={isLoading}
              onKeyDown={(e) => e.key === "Enter" && handleHeal()}
            />
            <button
              onClick={handleHeal}
              disabled={isLoading || !healAmount}
              style={{
                background: "linear-gradient(135deg, #2a5c1a, #4a7c2a)",
                color: "#d7f8d7",
                border: "none",
                borderRadius: "6px",
                padding: "8px 14px",
                fontSize: "13px",
                fontFamily: "'Georgia', serif",
                fontWeight: "bold",
                cursor: isLoading || !healAmount ? "not-allowed" : "pointer",
                opacity: isLoading || !healAmount ? 0.6 : 1,
              }}
            >
              Heal
            </button>
          </div>
        </div>

        {/* Temp HP */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span
            style={{
              color: "#5b9bd5",
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontFamily: "'Georgia', serif",
            }}
          >
            Temp HP
          </span>
          <div style={{ display: "flex", gap: "6px" }}>
            <input
              type="number"
              min={0}
              value={tempHpAmount}
              onChange={(e) => setTempHpAmount(e.target.value)}
              placeholder="0"
              style={{ ...inputStyle, borderColor: "rgba(91,155,213,0.5)" }}
              disabled={isLoading}
              onKeyDown={(e) => e.key === "Enter" && handleSetTempHp()}
            />
            <button
              onClick={handleSetTempHp}
              disabled={isLoading || tempHpAmount === ""}
              style={{
                background: "linear-gradient(135deg, #1a3a5c, #2d6a9f)",
                color: "#d0e8f8",
                border: "none",
                borderRadius: "6px",
                padding: "8px 14px",
                fontSize: "13px",
                fontFamily: "'Georgia', serif",
                fontWeight: "bold",
                cursor:
                  isLoading || tempHpAmount === "" ? "not-allowed" : "pointer",
                opacity: isLoading || tempHpAmount === "" ? 0.6 : 1,
              }}
            >
              Set
            </button>
          </div>
        </div>
      </div>

      {/* Rest section */}
      <div
        style={{
          marginTop: "16px",
          paddingTop: "12px",
          borderTop: "1px solid rgba(201,168,76,0.1)",
        }}
      >
        <span
          style={{
            color: "#b8934a",
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontFamily: "'Georgia', serif",
          }}
        >
          Rest
        </span>
        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
          <button
            onClick={() => setShowShortRest((v) => !v)}
            disabled={shortRest.isPending}
            style={restButtonStyle}
          >
            Short Rest
          </button>
          <button
            onClick={handleLongRest}
            disabled={longRest.isPending}
            style={restButtonStyle}
          >
            {longRest.isPending ? "Resting..." : "Long Rest"}
          </button>
        </div>

        {/* Short rest inline panel */}
        {showShortRest && (
          <div
            style={{
              marginTop: "12px",
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(201,168,76,0.25)",
              borderRadius: "8px",
              padding: "14px 16px",
            }}
          >
            <p
              style={{
                color: "#b8934a",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontFamily: "'Georgia', serif",
                marginBottom: "8px",
              }}
            >
              Short Rest — Spend Hit Dice
            </p>
            <p
              style={{
                color: "#a89060",
                fontSize: "12px",
                fontFamily: "'Georgia', serif",
                marginBottom: "10px",
              }}
            >
              d{hitDieSize} + {conMod >= 0 ? `+${conMod}` : conMod} CON per die
              (avg {hitDieAvg + conMod} HP each)
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  color: "#e8d5a3",
                  fontSize: "13px",
                  fontFamily: "'Georgia', serif",
                }}
              >
                Hit dice to spend:
              </span>
              <input
                type="number"
                min={1}
                max={character.level}
                value={hitDiceToSpend}
                onChange={(e) => setHitDiceToSpend(e.target.value)}
                style={{
                  width: "60px",
                  padding: "6px 8px",
                  background: "rgba(30,15,5,0.9)",
                  border: "1px solid rgba(201,168,76,0.4)",
                  borderRadius: "6px",
                  color: "#e8d5a3",
                  fontSize: "14px",
                  fontFamily: "'Georgia', serif",
                  outline: "none",
                  textAlign: "center",
                }}
              />
              {diceCount > 0 && (
                <span
                  style={{
                    color: "#c9a84c",
                    fontSize: "13px",
                    fontFamily: "'Georgia', serif",
                  }}
                >
                  = +{previewHeal} HP
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              <button
                onClick={handleShortRest}
                disabled={shortRest.isPending || diceCount < 1}
                style={{
                  background: "linear-gradient(135deg, #8b6914, #c9a84c)",
                  color: "#1a1a2e",
                  border: "none",
                  borderRadius: "6px",
                  padding: "7px 18px",
                  fontSize: "13px",
                  fontFamily: "'Georgia', serif",
                  fontWeight: "bold",
                  cursor:
                    shortRest.isPending || diceCount < 1
                      ? "not-allowed"
                      : "pointer",
                  opacity: shortRest.isPending || diceCount < 1 ? 0.6 : 1,
                }}
              >
                {shortRest.isPending ? "Resting..." : "Rest"}
              </button>
              <button
                onClick={() => setShowShortRest(false)}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(201,168,76,0.3)",
                  color: "#a89060",
                  borderRadius: "6px",
                  padding: "7px 14px",
                  fontSize: "13px",
                  fontFamily: "'Georgia', serif",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Conditions */}
      <div
        style={{
          marginTop: "12px",
          paddingTop: "12px",
          borderTop: "1px solid rgba(201,168,76,0.1)",
        }}
      >
        <p
          style={{
            color: "#c9a84c",
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "1px",
            fontFamily: "'Georgia', serif",
            margin: "0 0 8px 0",
          }}
        >
          Conditions
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
          {allConditions.map((cond) => {
            const isActive = activeConditions.includes(cond.name);
            return (
              <button
                key={cond.name}
                onClick={() => toggleCondition(cond.name)}
                disabled={updateConditions.isPending}
                title={cond.entries.length > 0 ? cond.entries[0] : cond.name}
                style={
                  isActive
                    ? {
                        background: "rgba(231,76,60,0.2)",
                        border: "1px solid rgba(231,76,60,0.5)",
                        borderRadius: "20px",
                        padding: "3px 10px",
                        fontSize: "10px",
                        fontFamily: "'Georgia', serif",
                        color: "#e74c3c",
                        cursor: updateConditions.isPending
                          ? "not-allowed"
                          : "pointer",
                        fontWeight: "bold",
                      }
                    : {
                        background: "rgba(30,15,5,0.6)",
                        border: "1px solid rgba(201,168,76,0.2)",
                        borderRadius: "20px",
                        padding: "3px 10px",
                        fontSize: "10px",
                        fontFamily: "'Georgia', serif",
                        color: "#a89060",
                        cursor: updateConditions.isPending
                          ? "not-allowed"
                          : "pointer",
                      }
                }
              >
                {cond.name}
              </button>
            );
          })}
        </div>
      </div>

      {feedback && (
        <div
          style={{
            marginTop: "10px",
            color: "#e74c3c",
            fontSize: "12px",
            fontFamily: "'Georgia', serif",
          }}
        >
          {feedback}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Level Up Modal
// ---------------------------------------------------------------------------

const ASI_LEVELS: Record<string, number[]> = {
  Fighter: [4, 6, 8, 12, 14, 16, 19],
  Rogue: [4, 8, 10, 12, 16, 19],
};
const DEFAULT_ASI_LEVELS = [4, 8, 12, 16, 19];

function isAsiLevel(className: string, level: number): boolean {
  return (ASI_LEVELS[className] ?? DEFAULT_ASI_LEVELS).includes(level);
}

const SUBCLASS_UNLOCK_LEVELS: Record<string, number> = {
  Artificer: 3,
  Barbarian: 3,
  Bard: 3,
  Cleric: 1,
  Druid: 2,
  Fighter: 3,
  Monk: 3,
  Paladin: 3,
  Ranger: 3,
  Rogue: 3,
  Sorcerer: 1,
  Warlock: 1,
  Wizard: 2,
};

function LevelUpPanel({
  character,
  onClose,
}: {
  character: CharacterData;
  onClose: () => void;
}) {
  const utils = api.useUtils();
  const conMod = mod(character.constitution);
  const hitDieAvg = HIT_DIE_AVERAGE[character.characterClass] ?? 5;
  const suggestedHp = character.maxHp + hitDieAvg + conMod;
  const [newMaxHp, setNewMaxHp] = useState<string>(String(suggestedHp));
  const [selectedSubclass, setSelectedSubclass] = useState<string>("");
  const [subclassError, setSubclassError] = useState<string>("");
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [expertiseError, setExpertiseError] = useState<string>("");
  const [asiMode, setAsiMode] = useState<"2" | "1-1">("2");
  const [asiAbility1, setAsiAbility1] = useState<string>("");
  const [asiAbility2, setAsiAbility2] = useState<string>("");
  const [asiError, setAsiError] = useState<string>("");
  const [asiOrFeat, setAsiOrFeat] = useState<"asi" | "feat">("asi");
  const [selectedFeat, setSelectedFeat] = useState<string>("");
  const [featSearch, setFeatSearch] = useState<string>("");
  const [featAbilityChoices, setFeatAbilityChoices] = useState<string[]>([]);

  const newLevel = character.level + 1;
  const subclassUnlockLevel =
    SUBCLASS_UNLOCK_LEVELS[character.characterClass] ?? 3;
  const shouldPickSubclass =
    newLevel >= subclassUnlockLevel && !character.subclass;

  const rulesSource = character.rulesSource || "PHB";
  const newExpertiseCount = getNewExpertiseAtLevel(
    character.characterClass,
    rulesSource,
    newLevel,
  );
  const existingExpertise: string[] = (() => {
    try {
      return character.skillExpertise
        ? (JSON.parse(character.skillExpertise) as string[])
        : [];
    } catch {
      return [];
    }
  })();
  const proficientSkills: string[] = (() => {
    try {
      return character.skillProficiencies
        ? (JSON.parse(character.skillProficiencies) as string[])
        : [];
    } catch {
      return [];
    }
  })();
  const eligibleForExpertise = proficientSkills.filter(
    (s) => !existingExpertise.includes(s),
  );

  const classInfo = character.rulesSource
    ? (getClassByNameAndSource(
        character.characterClass,
        character.rulesSource,
      ) ?? getClassByName(character.characterClass))
    : getClassByName(character.characterClass);
  const subclassOptions = classInfo?.subclasses ?? [];

  const showAsi = isAsiLevel(character.characterClass, newLevel);

  // Feat data for feat browser
  const existingFeats: string[] = (() => {
    try {
      return character.feats ? (JSON.parse(character.feats) as string[]) : [];
    } catch {
      return [];
    }
  })();
  const availableFeats: Feat[] = (() => {
    const allFeats = getFeatsBySource(rulesSource as "PHB" | "XPHB");
    return allFeats
      .filter((f) => !existingFeats.includes(f.name))
      .filter((f) => !f.levelRequired || f.levelRequired <= newLevel)
      .sort((a, b) => a.name.localeCompare(b.name));
  })();
  const filteredFeats = featSearch
    ? availableFeats.filter((f) =>
        f.name.toLowerCase().includes(featSearch.toLowerCase()),
      )
    : availableFeats;
  const selectedFeatData = availableFeats.find((f) => f.name === selectedFeat);

  const updateSubclass = api.character.updateSubclass.useMutation();
  const updateSkillExpertise = api.character.updateSkillExpertise.useMutation();
  const updateAbilityScores = api.character.updateAbilityScores.useMutation();
  const updateFeats = api.character.updateFeats.useMutation();

  const levelUp = api.character.levelUp.useMutation({
    onSuccess: async () => {
      await utils.character.getById.invalidate({ id: character.id });
      onClose();
    },
  });

  const toggleExpertiseSkill = (skill: string) => {
    setSelectedExpertise((prev) => {
      if (prev.includes(skill)) return prev.filter((s) => s !== skill);
      if (prev.length >= newExpertiseCount) return prev;
      return [...prev, skill];
    });
    setExpertiseError("");
  };

  const handleConfirm = async () => {
    const hp = parseInt(newMaxHp);
    if (isNaN(hp) || hp < 1) return;
    if (shouldPickSubclass && subclassOptions.length > 0 && !selectedSubclass) {
      setSubclassError("Please choose a subclass before leveling up.");
      return;
    }
    if (
      newExpertiseCount > 0 &&
      selectedExpertise.length !== newExpertiseCount
    ) {
      setExpertiseError(
        `Please choose exactly ${newExpertiseCount} skill${newExpertiseCount !== 1 ? "s" : ""} for expertise.`,
      );
      return;
    }
    if (showAsi) {
      if (asiOrFeat === "asi") {
        if (asiMode === "2" && !asiAbility1) {
          setAsiError(
            "Please choose an ability score for your +2 improvement.",
          );
          return;
        }
        if (asiMode === "1-1" && (!asiAbility1 || !asiAbility2)) {
          setAsiError(
            "Please choose two different ability scores for your +1/+1 improvement.",
          );
          return;
        }
        if (asiMode === "1-1" && asiAbility1 === asiAbility2) {
          setAsiError("Please choose two different ability scores.");
          return;
        }
        // Build updated scores
        const scores: Record<string, number> = {
          strength: character.strength,
          dexterity: character.dexterity,
          constitution: character.constitution,
          intelligence: character.intelligence,
          wisdom: character.wisdom,
          charisma: character.charisma,
        };
        if (asiMode === "2") {
          scores[asiAbility1] = Math.min(20, (scores[asiAbility1] ?? 10) + 2);
        } else {
          scores[asiAbility1] = Math.min(20, (scores[asiAbility1] ?? 10) + 1);
          scores[asiAbility2] = Math.min(20, (scores[asiAbility2] ?? 10) + 1);
        }
        await updateAbilityScores.mutateAsync({
          id: character.id,
          strength: scores.strength ?? character.strength,
          dexterity: scores.dexterity ?? character.dexterity,
          constitution: scores.constitution ?? character.constitution,
          intelligence: scores.intelligence ?? character.intelligence,
          wisdom: scores.wisdom ?? character.wisdom,
          charisma: scores.charisma ?? character.charisma,
        });
      } else {
        // Feat path
        if (!selectedFeat) {
          setAsiError("Please choose a feat.");
          return;
        }
        const feat = selectedFeatData;
        if (feat?.abilityBonus?.choose) {
          const needed = feat.abilityBonus.choose.count;
          const chosen = featAbilityChoices.filter((c) => c !== "").length;
          if (chosen < needed) {
            setAsiError(
              `Please choose ${needed} ability score${needed > 1 ? "s" : ""} for this feat.`,
            );
            return;
          }
        }
        if (feat) {
          // Apply ability bonuses from the feat
          const scores: Record<string, number> = {
            strength: character.strength,
            dexterity: character.dexterity,
            constitution: character.constitution,
            intelligence: character.intelligence,
            wisdom: character.wisdom,
            charisma: character.charisma,
          };
          let hasAbilityChanges = false;
          if (feat.abilityBonus?.fixed) {
            for (const [abbr, bonus] of Object.entries(
              feat.abilityBonus.fixed,
            )) {
              // Map abbreviation to full ability name
              const fullName =
                abbr === "str"
                  ? "strength"
                  : abbr === "dex"
                    ? "dexterity"
                    : abbr === "con"
                      ? "constitution"
                      : abbr === "int"
                        ? "intelligence"
                        : abbr === "wis"
                          ? "wisdom"
                          : abbr === "cha"
                            ? "charisma"
                            : abbr;
              if (scores[fullName] !== undefined) {
                scores[fullName] = Math.min(20, scores[fullName]! + bonus);
                hasAbilityChanges = true;
              }
            }
          }
          if (feat.abilityBonus?.choose && featAbilityChoices.length > 0) {
            for (const abbr of featAbilityChoices) {
              const fullName =
                abbr === "str"
                  ? "strength"
                  : abbr === "dex"
                    ? "dexterity"
                    : abbr === "con"
                      ? "constitution"
                      : abbr === "int"
                        ? "intelligence"
                        : abbr === "wis"
                          ? "wisdom"
                          : abbr === "cha"
                            ? "charisma"
                            : abbr;
              if (scores[fullName] !== undefined) {
                scores[fullName] = Math.min(
                  20,
                  scores[fullName]! + (feat.abilityBonus.choose.amount ?? 1),
                );
                hasAbilityChanges = true;
              }
            }
          }
          if (hasAbilityChanges) {
            await updateAbilityScores.mutateAsync({
              id: character.id,
              strength: scores.strength ?? character.strength,
              dexterity: scores.dexterity ?? character.dexterity,
              constitution: scores.constitution ?? character.constitution,
              intelligence: scores.intelligence ?? character.intelligence,
              wisdom: scores.wisdom ?? character.wisdom,
              charisma: scores.charisma ?? character.charisma,
            });
          }
          // Save the feat
          await updateFeats.mutateAsync({
            id: character.id,
            feats: [...existingFeats, feat.name],
          });
        }
      }
    }
    if (shouldPickSubclass && selectedSubclass) {
      await updateSubclass.mutateAsync({
        id: character.id,
        subclass: selectedSubclass,
      });
    }
    if (newExpertiseCount > 0 && selectedExpertise.length > 0) {
      const combined = [...existingExpertise, ...selectedExpertise];
      await updateSkillExpertise.mutateAsync({
        id: character.id,
        skillExpertise: combined,
      });
    }
    levelUp.mutate({ id: character.id, newMaxHp: hp });
  };

  const isPending =
    levelUp.isPending ||
    updateSubclass.isPending ||
    updateSkillExpertise.isPending ||
    updateAbilityScores.isPending ||
    updateFeats.isPending;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "rgba(15,8,3,0.97)",
          border: "2px solid #c9a84c",
          borderRadius: "12px",
          padding: "32px 36px",
          maxWidth: "420px",
          width: "100%",
          boxShadow: "0 0 60px rgba(201,168,76,0.4)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <h2
          style={{
            color: "#c9a84c",
            fontFamily: "'Georgia', serif",
            fontSize: "20px",
            fontWeight: "bold",
            letterSpacing: "2px",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}
        >
          Level Up
        </h2>
        <p
          style={{
            color: "#a89060",
            fontFamily: "'Georgia', serif",
            fontSize: "13px",
            marginBottom: "24px",
          }}
        >
          {character.name} advances from level {character.level} to level{" "}
          {character.level + 1}.
        </p>

        {/* Subclass selection */}
        {shouldPickSubclass && subclassOptions.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <p
              style={{
                color: "#b8934a",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontFamily: "'Georgia', serif",
                marginBottom: "8px",
              }}
            >
              Choose Your {classInfo?.subclassTitle ?? "Subclass"}
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                maxHeight: "200px",
                overflowY: "auto",
              }}
            >
              {subclassOptions.map((sub) => (
                <button
                  key={sub.name}
                  onClick={() => {
                    setSelectedSubclass(sub.name);
                    setSubclassError("");
                  }}
                  style={{
                    background:
                      selectedSubclass === sub.name
                        ? "rgba(201,168,76,0.15)"
                        : "transparent",
                    border:
                      selectedSubclass === sub.name
                        ? "1px solid #c9a84c"
                        : "1px solid rgba(201,168,76,0.25)",
                    borderRadius: "6px",
                    padding: "8px 14px",
                    color:
                      selectedSubclass === sub.name ? "#c9a84c" : "#e8d5a3",
                    fontFamily: "'Georgia', serif",
                    fontSize: "13px",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  {sub.name}
                </button>
              ))}
            </div>
            {subclassError && (
              <p
                style={{
                  color: "#e74c3c",
                  fontSize: "12px",
                  fontFamily: "'Georgia', serif",
                  marginTop: "6px",
                }}
              >
                {subclassError}
              </p>
            )}
          </div>
        )}

        {/* Expertise selection */}
        {newExpertiseCount > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <p
              style={{
                color: "#b8934a",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontFamily: "'Georgia', serif",
                marginBottom: "8px",
              }}
            >
              Skill Expertise
            </p>
            <p
              style={{
                color: "#a89060",
                fontSize: "12px",
                fontFamily: "'Georgia', serif",
                marginBottom: "10px",
              }}
            >
              Choose {newExpertiseCount} proficient skill
              {newExpertiseCount !== 1 ? "s" : ""} to gain expertise (double
              proficiency bonus).
              {selectedExpertise.length > 0 && (
                <span style={{ color: "#c9a84c", marginLeft: "8px" }}>
                  ({selectedExpertise.length}/{newExpertiseCount})
                </span>
              )}
            </p>
            {eligibleForExpertise.length === 0 ? (
              <p
                style={{
                  color: "#a89060",
                  fontSize: "12px",
                  fontFamily: "'Georgia', serif",
                  fontStyle: "italic",
                }}
              >
                No eligible skills — all proficient skills already have
                expertise.
              </p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {eligibleForExpertise.map((skill) => {
                  const isSelected = selectedExpertise.includes(skill);
                  const isFull =
                    selectedExpertise.length >= newExpertiseCount &&
                    !isSelected;
                  return (
                    <button
                      key={`expertise-${skill}`}
                      onClick={
                        isFull ? undefined : () => toggleExpertiseSkill(skill)
                      }
                      style={{
                        background: isSelected
                          ? "rgba(201,168,76,0.25)"
                          : "rgba(30,15,5,0.6)",
                        border: `1px solid ${isSelected ? "rgba(201,168,76,0.6)" : "rgba(201,168,76,0.2)"}`,
                        color: isSelected ? "#e8d5a3" : "#a89060",
                        borderRadius: "20px",
                        padding: "4px 12px",
                        fontSize: "11px",
                        fontFamily: "'Georgia', serif",
                        cursor: isFull ? "not-allowed" : "pointer",
                        opacity: isFull ? 0.5 : 1,
                        fontWeight: isSelected ? "bold" : "normal",
                      }}
                    >
                      {isSelected && "★ "}
                      {skill}
                    </button>
                  );
                })}
              </div>
            )}
            {expertiseError && (
              <p
                style={{
                  color: "#e74c3c",
                  fontSize: "12px",
                  fontFamily: "'Georgia', serif",
                  marginTop: "6px",
                }}
              >
                {expertiseError}
              </p>
            )}
          </div>
        )}

        {/* ASI / Feat selection */}
        {showAsi && (
          <div
            style={{
              background: "rgba(201,168,76,0.06)",
              border: "1px solid rgba(201,168,76,0.25)",
              borderRadius: "8px",
              padding: "16px 18px",
              marginBottom: "20px",
            }}
          >
            <p
              style={{
                color: "#c9a84c",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "1.2px",
                fontFamily: "'Georgia', serif",
                margin: "0 0 12px 0",
                fontWeight: "bold",
              }}
            >
              Ability Score Improvement
            </p>

            {/* ASI or Feat toggle */}
            <div style={{ display: "flex", gap: "0", marginBottom: "14px" }}>
              <button
                onClick={() => {
                  setAsiOrFeat("asi");
                  setAsiError("");
                }}
                style={{
                  background:
                    asiOrFeat === "asi"
                      ? "linear-gradient(135deg, #8b6914, #c9a84c)"
                      : "rgba(0,0,0,0.4)",
                  border:
                    asiOrFeat === "asi"
                      ? "1px solid #c9a84c"
                      : "1px solid rgba(201,168,76,0.3)",
                  color: asiOrFeat === "asi" ? "#1a1a2e" : "#a89060",
                  fontWeight: asiOrFeat === "asi" ? "bold" : "normal",
                  padding: "8px 18px",
                  fontSize: "12px",
                  fontFamily: "'Georgia', serif",
                  cursor: "pointer",
                  borderRadius: "6px 0 0 6px",
                }}
              >
                Improve Scores
              </button>
              <button
                onClick={() => {
                  setAsiOrFeat("feat");
                  setAsiError("");
                }}
                style={{
                  background:
                    asiOrFeat === "feat"
                      ? "linear-gradient(135deg, #8b6914, #c9a84c)"
                      : "rgba(0,0,0,0.4)",
                  border:
                    asiOrFeat === "feat"
                      ? "1px solid #c9a84c"
                      : "1px solid rgba(201,168,76,0.3)",
                  color: asiOrFeat === "feat" ? "#1a1a2e" : "#a89060",
                  fontWeight: asiOrFeat === "feat" ? "bold" : "normal",
                  padding: "8px 18px",
                  fontSize: "12px",
                  fontFamily: "'Georgia', serif",
                  cursor: "pointer",
                  borderRadius: "0 6px 6px 0",
                }}
              >
                Choose a Feat
              </button>
            </div>

            {asiOrFeat === "asi" ? (
              <>
                {/* Current scores reference */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginBottom: "14px",
                  }}
                >
                  {ABILITY_NAMES.map(({ key, label }) => {
                    const score = character[
                      key as keyof CharacterData
                    ] as number;
                    return (
                      <div
                        key={key}
                        style={{ textAlign: "center", minWidth: "42px" }}
                      >
                        <div
                          style={{
                            color: "#b8934a",
                            fontSize: "9px",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            fontFamily: "'Georgia', serif",
                          }}
                        >
                          {label}
                        </div>
                        <div
                          style={{
                            color: "#e8d5a3",
                            fontSize: "15px",
                            fontWeight: "bold",
                            fontFamily: "'Georgia', serif",
                          }}
                        >
                          {score}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Mode toggle */}
                <div
                  style={{ display: "flex", gap: "6px", marginBottom: "14px" }}
                >
                  <button
                    onClick={() => {
                      setAsiMode("2");
                      setAsiAbility2("");
                      setAsiError("");
                    }}
                    style={{
                      background:
                        asiMode === "2"
                          ? "rgba(201,168,76,0.2)"
                          : "transparent",
                      border:
                        asiMode === "2"
                          ? "1px solid #c9a84c"
                          : "1px solid rgba(201,168,76,0.25)",
                      color: asiMode === "2" ? "#c9a84c" : "#a89060",
                      borderRadius: "20px",
                      padding: "5px 14px",
                      fontSize: "11px",
                      fontFamily: "'Georgia', serif",
                      cursor: "pointer",
                      fontWeight: asiMode === "2" ? "bold" : "normal",
                    }}
                  >
                    +2 to one score
                  </button>
                  <button
                    onClick={() => {
                      setAsiMode("1-1");
                      setAsiError("");
                    }}
                    style={{
                      background:
                        asiMode === "1-1"
                          ? "rgba(201,168,76,0.2)"
                          : "transparent",
                      border:
                        asiMode === "1-1"
                          ? "1px solid #c9a84c"
                          : "1px solid rgba(201,168,76,0.25)",
                      color: asiMode === "1-1" ? "#c9a84c" : "#a89060",
                      borderRadius: "20px",
                      padding: "5px 14px",
                      fontSize: "11px",
                      fontFamily: "'Georgia', serif",
                      cursor: "pointer",
                      fontWeight: asiMode === "1-1" ? "bold" : "normal",
                    }}
                  >
                    +1 to two scores
                  </button>
                </div>

                {/* Ability selectors */}
                {asiMode === "2" ? (
                  <div>
                    <label
                      style={{
                        color: "#a89060",
                        fontSize: "11px",
                        fontFamily: "'Georgia', serif",
                        display: "block",
                        marginBottom: "6px",
                      }}
                    >
                      Choose ability (+2)
                    </label>
                    <select
                      value={asiAbility1}
                      onChange={(e) => {
                        setAsiAbility1(e.target.value);
                        setAsiError("");
                      }}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        background: "rgba(30,15,5,0.9)",
                        border: "1px solid rgba(201,168,76,0.4)",
                        borderRadius: "6px",
                        color: "#e8d5a3",
                        fontSize: "13px",
                        fontFamily: "'Georgia', serif",
                        outline: "none",
                      }}
                    >
                      <option value="">-- Select --</option>
                      {ABILITY_NAMES.map(({ key, label }) => {
                        const current = character[
                          key as keyof CharacterData
                        ] as number;
                        const capped = current >= 20;
                        return (
                          <option key={key} value={key} disabled={capped}>
                            {label} ({current}
                            {capped
                              ? " - MAX"
                              : ` -> ${Math.min(20, current + 2)}`}
                            )
                          </option>
                        );
                      })}
                    </select>
                    {asiAbility1 && (
                      <p
                        style={{
                          color: "#c9a84c",
                          fontSize: "12px",
                          fontFamily: "'Georgia', serif",
                          marginTop: "6px",
                        }}
                      >
                        {
                          ABILITY_NAMES.find((a) => a.key === asiAbility1)
                            ?.label
                        }
                        :{" "}
                        {
                          character[
                            asiAbility1 as keyof CharacterData
                          ] as number
                        }{" "}
                        {"->"}{" "}
                        {Math.min(
                          20,
                          (character[
                            asiAbility1 as keyof CharacterData
                          ] as number) + 2,
                        )}
                      </p>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <label
                        style={{
                          color: "#a89060",
                          fontSize: "11px",
                          fontFamily: "'Georgia', serif",
                          display: "block",
                          marginBottom: "6px",
                        }}
                      >
                        First ability (+1)
                      </label>
                      <select
                        value={asiAbility1}
                        onChange={(e) => {
                          setAsiAbility1(e.target.value);
                          setAsiError("");
                        }}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          background: "rgba(30,15,5,0.9)",
                          border: "1px solid rgba(201,168,76,0.4)",
                          borderRadius: "6px",
                          color: "#e8d5a3",
                          fontSize: "13px",
                          fontFamily: "'Georgia', serif",
                          outline: "none",
                        }}
                      >
                        <option value="">-- Select --</option>
                        {ABILITY_NAMES.map(({ key, label }) => {
                          const current = character[
                            key as keyof CharacterData
                          ] as number;
                          const capped = current >= 20;
                          return (
                            <option
                              key={key}
                              value={key}
                              disabled={capped || key === asiAbility2}
                            >
                              {label} ({current}
                              {capped ? " - MAX" : ` -> ${current + 1}`})
                            </option>
                          );
                        })}
                      </select>
                      {asiAbility1 && (
                        <p
                          style={{
                            color: "#c9a84c",
                            fontSize: "12px",
                            fontFamily: "'Georgia', serif",
                            marginTop: "4px",
                          }}
                        >
                          {
                            ABILITY_NAMES.find((a) => a.key === asiAbility1)
                              ?.label
                          }
                          :{" "}
                          {
                            character[
                              asiAbility1 as keyof CharacterData
                            ] as number
                          }{" "}
                          {"->"}{" "}
                          {Math.min(
                            20,
                            (character[
                              asiAbility1 as keyof CharacterData
                            ] as number) + 1,
                          )}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        style={{
                          color: "#a89060",
                          fontSize: "11px",
                          fontFamily: "'Georgia', serif",
                          display: "block",
                          marginBottom: "6px",
                        }}
                      >
                        Second ability (+1)
                      </label>
                      <select
                        value={asiAbility2}
                        onChange={(e) => {
                          setAsiAbility2(e.target.value);
                          setAsiError("");
                        }}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          background: "rgba(30,15,5,0.9)",
                          border: "1px solid rgba(201,168,76,0.4)",
                          borderRadius: "6px",
                          color: "#e8d5a3",
                          fontSize: "13px",
                          fontFamily: "'Georgia', serif",
                          outline: "none",
                        }}
                      >
                        <option value="">-- Select --</option>
                        {ABILITY_NAMES.map(({ key, label }) => {
                          const current = character[
                            key as keyof CharacterData
                          ] as number;
                          const capped = current >= 20;
                          return (
                            <option
                              key={key}
                              value={key}
                              disabled={capped || key === asiAbility1}
                            >
                              {label} ({current}
                              {capped ? " - MAX" : ` -> ${current + 1}`})
                            </option>
                          );
                        })}
                      </select>
                      {asiAbility2 && (
                        <p
                          style={{
                            color: "#c9a84c",
                            fontSize: "12px",
                            fontFamily: "'Georgia', serif",
                            marginTop: "4px",
                          }}
                        >
                          {
                            ABILITY_NAMES.find((a) => a.key === asiAbility2)
                              ?.label
                          }
                          :{" "}
                          {
                            character[
                              asiAbility2 as keyof CharacterData
                            ] as number
                          }{" "}
                          {"->"}{" "}
                          {Math.min(
                            20,
                            (character[
                              asiAbility2 as keyof CharacterData
                            ] as number) + 1,
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Feat browser */}
                <input
                  type="text"
                  placeholder="Search feats..."
                  value={featSearch}
                  onChange={(e) => setFeatSearch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    background: "rgba(30,15,5,0.9)",
                    border: "1px solid rgba(201,168,76,0.4)",
                    borderRadius: "6px",
                    color: "#e8d5a3",
                    fontSize: "13px",
                    fontFamily: "'Georgia', serif",
                    outline: "none",
                    marginBottom: "10px",
                    boxSizing: "border-box",
                  }}
                />
                <div
                  style={{
                    maxHeight: "300px",
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  {filteredFeats.length === 0 && (
                    <p
                      style={{
                        color: "#a89060",
                        fontSize: "12px",
                        fontFamily: "'Georgia', serif",
                        fontStyle: "italic",
                        padding: "8px 0",
                      }}
                    >
                      No feats found.
                    </p>
                  )}
                  {filteredFeats.map((feat) => {
                    const isSelected = selectedFeat === feat.name;
                    // Build ability bonus summary
                    const abilityParts: string[] = [];
                    if (feat.abilityBonus?.fixed) {
                      for (const [abbr, bonus] of Object.entries(
                        feat.abilityBonus.fixed,
                      )) {
                        const name =
                          abbr === "str"
                            ? "STR"
                            : abbr === "dex"
                              ? "DEX"
                              : abbr === "con"
                                ? "CON"
                                : abbr === "int"
                                  ? "INT"
                                  : abbr === "wis"
                                    ? "WIS"
                                    : abbr === "cha"
                                      ? "CHA"
                                      : abbr.toUpperCase();
                        abilityParts.push(`+${bonus} ${name}`);
                      }
                    }
                    if (feat.abilityBonus?.choose) {
                      const fromNames = feat.abilityBonus.choose.from.map(
                        (a) =>
                          a === "str"
                            ? "STR"
                            : a === "dex"
                              ? "DEX"
                              : a === "con"
                                ? "CON"
                                : a === "int"
                                  ? "INT"
                                  : a === "wis"
                                    ? "WIS"
                                    : a === "cha"
                                      ? "CHA"
                                      : a.toUpperCase(),
                      );
                      abilityParts.push(
                        `Choose +${feat.abilityBonus.choose.amount} from ${fromNames.join("/")}`,
                      );
                    }
                    const abilitySummary = abilityParts.join(", ");
                    // Truncated description (first 2 lines)
                    const descPreview = feat.entries.slice(0, 2).join(" ");
                    const truncated =
                      descPreview.length > 120
                        ? descPreview.slice(0, 120) + "..."
                        : descPreview;

                    return (
                      <div
                        key={feat.name}
                        onClick={() => {
                          setSelectedFeat(feat.name);
                          setFeatAbilityChoices([]);
                          setAsiError("");
                        }}
                        style={{
                          background: isSelected
                            ? "rgba(201,168,76,0.15)"
                            : "rgba(0,0,0,0.3)",
                          border: isSelected
                            ? "1px solid rgba(201,168,76,0.5)"
                            : "1px solid rgba(201,168,76,0.15)",
                          borderRadius: "6px",
                          padding: "10px 14px",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "4px",
                          }}
                        >
                          <span
                            style={{
                              color: isSelected ? "#c9a84c" : "#a89060",
                              fontSize: "13px",
                            }}
                          >
                            {isSelected ? "\u25C9" : "\u25CB"}
                          </span>
                          <span
                            style={{
                              color: "#e8d5a3",
                              fontSize: "13px",
                              fontFamily: "'Georgia', serif",
                              fontWeight: isSelected ? "bold" : "normal",
                            }}
                          >
                            {feat.name}
                          </span>
                          <span
                            style={{
                              background: "rgba(100,149,237,0.2)",
                              border: "1px solid rgba(100,149,237,0.4)",
                              borderRadius: "4px",
                              padding: "1px 6px",
                              color: "#6495ed",
                              fontSize: "10px",
                            }}
                          >
                            {feat.source}
                          </span>
                        </div>
                        {abilitySummary && (
                          <p
                            style={{
                              color: "#c9a84c",
                              fontSize: "11px",
                              fontFamily: "'Georgia', serif",
                              margin: "0 0 2px 21px",
                            }}
                          >
                            {abilitySummary}
                          </p>
                        )}
                        {feat.prerequisiteText && (
                          <p
                            style={{
                              color: "#8a7050",
                              fontSize: "10px",
                              fontFamily: "'Georgia', serif",
                              margin: "0 0 2px 21px",
                              fontStyle: "italic",
                            }}
                          >
                            Requires: {feat.prerequisiteText}
                          </p>
                        )}
                        <p
                          style={{
                            color: "#a89060",
                            fontSize: "11px",
                            fontFamily: "'Georgia', serif",
                            margin: "0 0 0 21px",
                            lineHeight: 1.4,
                          }}
                        >
                          {truncated}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Feat ability bonus choice dropdowns */}
                {selectedFeatData?.abilityBonus?.choose && (
                  <div style={{ marginTop: "12px" }}>
                    <p
                      style={{
                        color: "#b8934a",
                        fontSize: "11px",
                        fontFamily: "'Georgia', serif",
                        marginBottom: "6px",
                      }}
                    >
                      Choose {selectedFeatData.abilityBonus.choose.count}{" "}
                      ability score
                      {selectedFeatData.abilityBonus.choose.count > 1
                        ? "s"
                        : ""}{" "}
                      to increase by +
                      {selectedFeatData.abilityBonus.choose.amount}:
                    </p>
                    {Array.from({
                      length: selectedFeatData.abilityBonus.choose.count,
                    }).map((_, idx) => (
                      <select
                        key={`feat-ability-${idx}`}
                        value={featAbilityChoices[idx] ?? ""}
                        onChange={(e) => {
                          const newChoices = [...featAbilityChoices];
                          newChoices[idx] = e.target.value;
                          setFeatAbilityChoices(newChoices);
                          setAsiError("");
                        }}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          background: "rgba(30,15,5,0.9)",
                          border: "1px solid rgba(201,168,76,0.4)",
                          borderRadius: "6px",
                          color: "#e8d5a3",
                          fontSize: "13px",
                          fontFamily: "'Georgia', serif",
                          outline: "none",
                          marginBottom: "6px",
                        }}
                      >
                        <option value="">-- Select --</option>
                        {selectedFeatData!.abilityBonus!.choose!.from.map(
                          (abbr) => {
                            const label =
                              abbr === "str"
                                ? "STR"
                                : abbr === "dex"
                                  ? "DEX"
                                  : abbr === "con"
                                    ? "CON"
                                    : abbr === "int"
                                      ? "INT"
                                      : abbr === "wis"
                                        ? "WIS"
                                        : abbr === "cha"
                                          ? "CHA"
                                          : abbr.toUpperCase();
                            const fullName =
                              abbr === "str"
                                ? "strength"
                                : abbr === "dex"
                                  ? "dexterity"
                                  : abbr === "con"
                                    ? "constitution"
                                    : abbr === "int"
                                      ? "intelligence"
                                      : abbr === "wis"
                                        ? "wisdom"
                                        : abbr === "cha"
                                          ? "charisma"
                                          : abbr;
                            const current = character[
                              fullName as keyof CharacterData
                            ] as number;
                            const capped = current >= 20;
                            const alreadyChosen = featAbilityChoices.some(
                              (c, i) => i !== idx && c === abbr,
                            );
                            return (
                              <option
                                key={abbr}
                                value={abbr}
                                disabled={capped || alreadyChosen}
                              >
                                {label} ({current}
                                {capped
                                  ? " - MAX"
                                  : ` -> ${Math.min(20, current + (selectedFeatData!.abilityBonus!.choose!.amount ?? 1))}`}
                                )
                              </option>
                            );
                          },
                        )}
                      </select>
                    ))}
                  </div>
                )}
              </>
            )}

            {asiError && (
              <p
                style={{
                  color: "#e74c3c",
                  fontSize: "12px",
                  fontFamily: "'Georgia', serif",
                  marginTop: "8px",
                }}
              >
                {asiError}
              </p>
            )}
          </div>
        )}

        <div style={{ marginBottom: "20px" }}>
          <p
            style={{
              color: "#b8934a",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontFamily: "'Georgia', serif",
              marginBottom: "6px",
            }}
          >
            New Maximum HP
          </p>
          <p
            style={{
              color: "#a89060",
              fontSize: "12px",
              fontFamily: "'Georgia', serif",
              marginBottom: "10px",
            }}
          >
            Suggested: {character.maxHp} + {hitDieAvg} (avg die) +{" "}
            {conMod >= 0 ? `+${conMod}` : conMod} (CON) = {suggestedHp}
          </p>
          <input
            type="number"
            min={1}
            value={newMaxHp}
            onChange={(e) => setNewMaxHp(e.target.value)}
            style={{
              width: "120px",
              padding: "10px 12px",
              background: "rgba(30,15,5,0.9)",
              border: "1px solid rgba(201,168,76,0.5)",
              borderRadius: "6px",
              color: "#e8d5a3",
              fontSize: "16px",
              fontFamily: "'Georgia', serif",
              outline: "none",
              textAlign: "center",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => void handleConfirm()}
            disabled={isPending}
            style={{
              background: "linear-gradient(135deg, #8b6914, #c9a84c)",
              color: "#1a1a2e",
              border: "none",
              borderRadius: "6px",
              padding: "10px 24px",
              fontSize: "14px",
              fontFamily: "'Georgia', serif",
              fontWeight: "bold",
              cursor: isPending ? "not-allowed" : "pointer",
              opacity: isPending ? 0.7 : 1,
              letterSpacing: "0.5px",
            }}
          >
            {isPending ? "Leveling Up..." : "Confirm Level Up"}
          </button>
          <button
            onClick={onClose}
            disabled={isPending}
            style={{
              background: "transparent",
              border: "1px solid rgba(201,168,76,0.4)",
              color: "#a89060",
              borderRadius: "6px",
              padding: "10px 20px",
              fontSize: "14px",
              fontFamily: "'Georgia', serif",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>

        {levelUp.error && (
          <p
            style={{
              color: "#e74c3c",
              fontSize: "12px",
              fontFamily: "'Georgia', serif",
              marginTop: "12px",
            }}
          >
            {levelUp.error.message}
          </p>
        )}
        {updateSubclass.error && (
          <p
            style={{
              color: "#e74c3c",
              fontSize: "12px",
              fontFamily: "'Georgia', serif",
              marginTop: "12px",
            }}
          >
            {updateSubclass.error.message}
          </p>
        )}
        {updateSkillExpertise.error && (
          <p
            style={{
              color: "#e74c3c",
              fontSize: "12px",
              fontFamily: "'Georgia', serif",
              marginTop: "12px",
            }}
          >
            {updateSkillExpertise.error.message}
          </p>
        )}
        {updateAbilityScores.error && (
          <p
            style={{
              color: "#e74c3c",
              fontSize: "12px",
              fontFamily: "'Georgia', serif",
              marginTop: "12px",
            }}
          >
            {updateAbilityScores.error.message}
          </p>
        )}
        {updateFeats.error && (
          <p
            style={{
              color: "#e74c3c",
              fontSize: "12px",
              fontFamily: "'Georgia', serif",
              marginTop: "12px",
            }}
          >
            {updateFeats.error.message}
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Feature description renderer
// ---------------------------------------------------------------------------

function RenderFeatureEntry({
  entry,
  depth = 0,
}: {
  entry: FeatureEntry;
  depth?: number;
}) {
  if (entry.type === "text") {
    return (
      <p
        style={{
          color: "#e8d5a3",
          fontSize: "13px",
          fontFamily: "'Georgia', serif",
          lineHeight: 1.7,
          marginBottom: "6px",
        }}
      >
        {entry.text}
      </p>
    );
  }

  if (entry.type === "list") {
    return (
      <ul
        style={{
          color: "#e8d5a3",
          fontSize: "13px",
          fontFamily: "'Georgia', serif",
          lineHeight: 1.7,
          paddingLeft: "20px",
          marginBottom: "6px",
        }}
      >
        {(entry.items ?? []).map((item, i) => (
          <li key={i} style={{ marginBottom: "3px" }}>
            {item}
          </li>
        ))}
      </ul>
    );
  }

  if (entry.type === "section") {
    return (
      <div style={{ marginBottom: "8px" }}>
        {entry.name && (
          <p
            style={{
              color: "#c9a84c",
              fontSize: "12px",
              fontWeight: "bold",
              fontFamily: "'Georgia', serif",
              marginBottom: "4px",
              letterSpacing: "0.5px",
            }}
          >
            {entry.name}
          </p>
        )}
        {(entry.children ?? []).map((child, i) => (
          <RenderFeatureEntry key={i} entry={child} depth={depth + 1} />
        ))}
      </div>
    );
  }

  if (entry.type === "table") {
    return (
      <div style={{ marginBottom: "10px" }}>
        {entry.caption && (
          <p
            style={{
              color: "#c9a84c",
              fontSize: "12px",
              fontWeight: "bold",
              fontFamily: "'Georgia', serif",
              marginBottom: "6px",
              letterSpacing: "0.5px",
            }}
          >
            {entry.caption}
          </p>
        )}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "12px",
            fontFamily: "'Georgia', serif",
          }}
        >
          {entry.colLabels && entry.colLabels.length > 0 && (
            <thead>
              <tr>
                {entry.colLabels.map((label, i) => (
                  <th
                    key={i}
                    style={{
                      color: "#c9a84c",
                      padding: "6px 10px",
                      borderBottom: "1px solid rgba(201,168,76,0.3)",
                      textAlign: "left",
                      fontWeight: "bold",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {(entry.rows ?? []).map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    style={{
                      color: "#e8d5a3",
                      padding: "5px 10px",
                      borderBottom: "1px solid rgba(201,168,76,0.1)",
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (entry.type === "inset") {
    return (
      <div
        style={{
          background: "rgba(201,168,76,0.05)",
          border: "1px solid rgba(201,168,76,0.2)",
          borderRadius: "6px",
          padding: "12px 16px",
          marginBottom: "8px",
        }}
      >
        {entry.name && (
          <p
            style={{
              color: "#c9a84c",
              fontSize: "11px",
              fontWeight: "bold",
              fontFamily: "'Georgia', serif",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "6px",
            }}
          >
            {entry.name}
          </p>
        )}
        {(entry.children ?? []).map((child, i) => (
          <RenderFeatureEntry key={i} entry={child} depth={depth + 1} />
        ))}
      </div>
    );
  }

  return null;
}

// ---------------------------------------------------------------------------
// Feature usage config
// ---------------------------------------------------------------------------

interface FeatureUsageConfig {
  maxUses: (level: number, abilityScores: Record<string, number>) => number;
  recharge: "short" | "long";
}

const FEATURE_USAGE_CONFIG: Record<string, FeatureUsageConfig> = {
  Rage: {
    maxUses: (level) =>
      level < 3
        ? 2
        : level < 6
          ? 3
          : level < 12
            ? 4
            : level < 17
              ? 5
              : level < 20
                ? 6
                : Infinity,
    recharge: "long",
  },
  "Second Wind": { maxUses: () => 1, recharge: "short" },
  "Action Surge": {
    maxUses: (level) => (level < 17 ? 1 : 2),
    recharge: "short",
  },
  Indomitable: {
    maxUses: (level) => (level < 13 ? 1 : level < 17 ? 2 : 3),
    recharge: "long",
  },
  "Channel Divinity": {
    maxUses: (level) => (level < 6 ? 1 : level < 18 ? 2 : 3),
    recharge: "short",
  },
  "Wild Shape": { maxUses: () => 2, recharge: "short" },
  "Lay on Hands": { maxUses: (level) => level * 5, recharge: "long" },
  "Divine Sense": {
    maxUses: (_level, abs) =>
      1 + Math.max(0, Math.floor(((abs.charisma ?? 10) - 10) / 2)),
    recharge: "long",
  },
  "Bardic Inspiration": {
    maxUses: (_level, abs) =>
      Math.max(1, Math.floor(((abs.charisma ?? 10) - 10) / 2)),
    recharge: "long",
  },
  "Arcane Recovery": { maxUses: () => 1, recharge: "long" },
  "Psionic Power": {
    maxUses: (level) => 2 * (Math.ceil(level / 4) + 1),
    recharge: "long",
  },
};

// ---------------------------------------------------------------------------
// Class Features Tab
// ---------------------------------------------------------------------------

function ClassFeaturesTab({ character }: { character: CharacterData }) {
  const utils = api.useUtils();
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const [localFeatureUses, setLocalFeatureUses] = useState<
    Record<string, number>
  >(() => {
    try {
      return JSON.parse(character.featureUses || "{}") as Record<
        string,
        number
      >;
    } catch {
      return {};
    }
  });

  const updateFeatureUses = api.character.updateFeatureUses.useMutation({
    onSuccess: async () => {
      await utils.character.getById.invalidate({ id: character.id });
    },
  });

  const classInfo = character.rulesSource
    ? (getClassByNameAndSource(
        character.characterClass,
        character.rulesSource,
      ) ?? getClassByName(character.characterClass))
    : getClassByName(character.characterClass);

  if (!classInfo) {
    return (
      <div
        style={{
          color: "#a89060",
          fontFamily: "'Georgia', serif",
          fontSize: "14px",
          padding: "20px 0",
        }}
      >
        Class data not available for {character.characterClass}.
      </div>
    );
  }

  const toggleKey = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const abilityScoresForFeature: Record<string, number> = {
    strength: character.strength,
    dexterity: character.dexterity,
    constitution: character.constitution,
    intelligence: character.intelligence,
    wisdom: character.wisdom,
    charisma: character.charisma,
  };

  const toggleFeatureUse = (
    featName: string,
    slotIdx: number,
    currentUsed: number,
    maxUses: number,
  ) => {
    const newUsed =
      slotIdx < currentUsed
        ? currentUsed - 1
        : Math.min(currentUsed + 1, maxUses);
    const next = { ...localFeatureUses, [featName]: newUsed };
    setLocalFeatureUses(next);
    updateFeatureUses.mutate({ id: character.id, featureUses: next });
  };

  const handlePoolChange = (
    featName: string,
    newUsed: number,
    maxUses: number,
  ) => {
    const clamped = Math.max(0, Math.min(newUsed, maxUses));
    const next = { ...localFeatureUses, [featName]: clamped };
    setLocalFeatureUses(next);
    updateFeatureUses.mutate({ id: character.id, featureUses: next });
  };

  // Group features by level, up to character.level
  const featuresByLevel: Record<number, typeof classInfo.levelFeatures> = {};
  for (const feat of classInfo.levelFeatures) {
    if (feat.level > character.level) continue;
    if (!featuresByLevel[feat.level]) featuresByLevel[feat.level] = [];
    featuresByLevel[feat.level]!.push(feat);
  }

  // Inject actual subclass features when a subclass is selected
  if (character.subclass) {
    const selectedSubclass = classInfo.subclasses.find(
      (sc) => sc.name === character.subclass,
    );
    if (selectedSubclass) {
      for (const scFeat of selectedSubclass.features) {
        if (scFeat.level > character.level) continue;
        if (!featuresByLevel[scFeat.level]) featuresByLevel[scFeat.level] = [];
        // Avoid adding duplicates (the placeholder "Roguish Archetype feature" etc. is already there)
        const alreadyPresent = featuresByLevel[scFeat.level]!.some(
          (f) =>
            f.featureName === scFeat.featureName && f.level === scFeat.level,
        );
        if (!alreadyPresent) {
          featuresByLevel[scFeat.level]!.push(scFeat);
        }
      }
    }
  }

  const levels = Object.keys(featuresByLevel)
    .map(Number)
    .sort((a, b) => a - b);

  const findDescription = (
    featureName: string,
    level: number,
  ): FeatureDescription | undefined => {
    // For subclass features, also match on subclassName
    const selectedSubclass = character.subclass
      ? classInfo.subclasses.find((sc) => sc.name === character.subclass)
      : undefined;
    return classInfo.featureDescriptions.find(
      (d) =>
        d.name === featureName &&
        d.level === level &&
        (!d.isSubclassFeature ||
          d.subclassName === selectedSubclass?.shortName),
    );
  };

  const sectionTitle: React.CSSProperties = {
    color: "#c9a84c",
    fontSize: "12px",
    fontWeight: "bold",
    letterSpacing: "2px",
    textTransform: "uppercase",
    marginBottom: "16px",
    paddingBottom: "8px",
    borderBottom: "1px solid rgba(201,168,76,0.2)",
    fontFamily: "'Georgia', serif",
  };

  return (
    <div>
      {levels.map((level) => (
        <div key={level} style={{ marginBottom: "24px" }}>
          <p style={sectionTitle}>Level {level}</p>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {featuresByLevel[level]!.map((feat) => {
              const key = `${feat.featureName}-${feat.level}`;
              const isExpanded = expandedKeys.has(key);
              const desc = findDescription(feat.featureName, feat.level);
              const isSubclass = feat.isSubclassFeature;
              const usageConfig = FEATURE_USAGE_CONFIG[feat.featureName];
              const maxUses = usageConfig
                ? usageConfig.maxUses(character.level, abilityScoresForFeature)
                : 0;
              const usedCount = localFeatureUses[feat.featureName] ?? 0;
              const showUsage = !!usageConfig && maxUses > 0;
              const usePool =
                showUsage && !isFinite(maxUses) === false && maxUses > 20;

              return (
                <div
                  key={key}
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
                      {feat.featureName}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        fontFamily: "'Georgia', serif",
                        letterSpacing: "0.5px",
                        background: isSubclass
                          ? "rgba(168,144,96,0.15)"
                          : "rgba(201,168,76,0.12)",
                        border: isSubclass
                          ? "1px solid rgba(168,144,96,0.3)"
                          : "1px solid rgba(201,168,76,0.25)",
                        color: isSubclass ? "#a89060" : "#c9a84c",
                      }}
                    >
                      {isSubclass ? "Subclass Feature" : "Class Feature"}
                    </span>
                    {desc && (
                      <button
                        onClick={() => toggleKey(key)}
                        style={{
                          background: "transparent",
                          border: "1px solid rgba(201,168,76,0.3)",
                          color: "#a89060",
                          borderRadius: "4px",
                          padding: "2px 10px",
                          fontSize: "11px",
                          fontFamily: "'Georgia', serif",
                          cursor: "pointer",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {isExpanded ? "Hide" : "Details"}
                      </button>
                    )}
                  </div>

                  {/* Feature usage tracker */}
                  {showUsage && isFinite(maxUses) && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginTop: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          color: "#b8934a",
                          fontSize: "11px",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          fontFamily: "'Georgia', serif",
                        }}
                      >
                        Uses:
                      </span>
                      {usePool ? (
                        // Pool-style (e.g. Lay on Hands): show number input
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <input
                            type="number"
                            min={0}
                            max={maxUses}
                            value={usedCount}
                            onChange={(e) =>
                              handlePoolChange(
                                feat.featureName,
                                parseInt(e.target.value) || 0,
                                maxUses,
                              )
                            }
                            style={{
                              width: "64px",
                              padding: "4px 8px",
                              background: "rgba(30,15,5,0.9)",
                              border: "1px solid rgba(201,168,76,0.4)",
                              borderRadius: "6px",
                              color: "#e8d5a3",
                              fontSize: "13px",
                              fontFamily: "'Georgia', serif",
                              outline: "none",
                              textAlign: "center",
                            }}
                          />
                          <span
                            style={{
                              color: "#a89060",
                              fontSize: "12px",
                              fontFamily: "'Georgia', serif",
                            }}
                          >
                            / {maxUses} used
                          </span>
                        </div>
                      ) : (
                        // Pip-style
                        Array.from({ length: maxUses }, (_, j) => (
                          <button
                            key={j}
                            onClick={() =>
                              toggleFeatureUse(
                                feat.featureName,
                                j,
                                usedCount,
                                maxUses,
                              )
                            }
                            style={{
                              background:
                                j < usedCount
                                  ? "rgba(201,168,76,0.4)"
                                  : "transparent",
                              border: "1px solid #c9a84c",
                              borderRadius: "50%",
                              width: "22px",
                              height: "22px",
                              color: j < usedCount ? "#8b6914" : "#c9a84c",
                              cursor: "pointer",
                              fontSize: "12px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontFamily: "'Georgia', serif",
                            }}
                          >
                            {j < usedCount ? "●" : "○"}
                          </button>
                        ))
                      )}
                      <span
                        style={{
                          fontSize: "10px",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          background:
                            usageConfig.recharge === "short"
                              ? "rgba(91,155,213,0.12)"
                              : "rgba(74,124,42,0.12)",
                          border: `1px solid ${usageConfig.recharge === "short" ? "rgba(91,155,213,0.3)" : "rgba(74,124,42,0.3)"}`,
                          color:
                            usageConfig.recharge === "short"
                              ? "#5b9bd5"
                              : "#4a7c2a",
                          fontFamily: "'Georgia', serif",
                        }}
                      >
                        {usageConfig.recharge === "short"
                          ? "Short Rest"
                          : "Long Rest"}
                      </span>
                      {!usePool && (
                        <span
                          style={{
                            color: "#a89060",
                            fontSize: "12px",
                            fontFamily: "'Georgia', serif",
                          }}
                        >
                          {maxUses - usedCount} / {maxUses} remaining
                        </span>
                      )}
                    </div>
                  )}

                  {isExpanded && desc && (
                    <div
                      style={{
                        marginTop: "12px",
                        borderTop: "1px solid rgba(201,168,76,0.1)",
                        paddingTop: "12px",
                      }}
                    >
                      {desc.entries.map((entry, i) => (
                        <RenderFeatureEntry key={i} entry={entry} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Actions Tab
// ---------------------------------------------------------------------------

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

function ActionsTab({ character }: { character: CharacterData }) {
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

// ---------------------------------------------------------------------------
// Spells Tab
// ---------------------------------------------------------------------------

const SPELLCASTING_ABILITY: Record<string, string> = {
  Artificer: "intelligence",
  Bard: "charisma",
  Cleric: "wisdom",
  Druid: "wisdom",
  Paladin: "charisma",
  Ranger: "wisdom",
  Sorcerer: "charisma",
  Warlock: "charisma",
  Wizard: "intelligence",
};

const PREPARED_CASTERS = ["Cleric", "Druid", "Paladin", "Wizard", "Artificer"];

function SpellsTab({ character }: { character: CharacterData }) {
  const utils = api.useUtils();
  const slots = getSpellSlots(character.characterClass, character.level);
  const warlockMode = isWarlock(character.characterClass);

  const usedRaw: number[] = (() => {
    try {
      const parsed: unknown = JSON.parse(character.spellSlotsUsed || "[]");
      return Array.isArray(parsed) ? (parsed as number[]) : [];
    } catch {
      return [];
    }
  })();
  const [localUsed, setLocalUsed] = useState<number[]>(
    Array.from({ length: 9 }, (_, i) => usedRaw[i] ?? 0),
  );

  // Prepared spells state
  const [localPrepared, setLocalPrepared] = useState<string[]>(() => {
    try {
      return JSON.parse(character.preparedSpells || "[]") as string[];
    } catch {
      return [];
    }
  });
  const [browseMode, setBrowseMode] = useState(false);
  const [spellSearch, setSpellSearch] = useState("");
  const [spellLevelFilter, setSpellLevelFilter] = useState<number | null>(null);

  const updateSpellSlots = api.character.updateSpellSlots.useMutation({
    onSuccess: async () => {
      await utils.character.getById.invalidate({ id: character.id });
    },
  });

  const updatePreparedSpells = api.character.updatePreparedSpells.useMutation({
    onSuccess: async () => {
      await utils.character.getById.invalidate({ id: character.id });
    },
  });

  const toggleSlot = (levelIdx: number, slotIdx: number) => {
    const current = localUsed[levelIdx] ?? 0;
    const maxSlots = slots[levelIdx] ?? 0;
    let newUsed: number;
    if (slotIdx < current) {
      newUsed = current - 1;
    } else {
      newUsed = Math.min(current + 1, maxSlots);
    }
    const next = localUsed.map((v, i) => (i === levelIdx ? newUsed : v));
    setLocalUsed(next);
    updateSpellSlots.mutate({ id: character.id, spellSlotsUsed: next });
  };

  const handleLongRest = () => {
    const zeros = new Array(9).fill(0) as number[];
    setLocalUsed(zeros);
    updateSpellSlots.mutate({ id: character.id, spellSlotsUsed: zeros });
  };

  // Spell management
  const isPreparedCaster = PREPARED_CASTERS.includes(character.characterClass);
  const spellAbility =
    SPELLCASTING_ABILITY[character.characterClass] ?? "intelligence";
  const abilityScores: Record<string, number> = {
    strength: character.strength,
    dexterity: character.dexterity,
    constitution: character.constitution,
    intelligence: character.intelligence,
    wisdom: character.wisdom,
    charisma: character.charisma,
  };
  const spellAbilityMod = mod(abilityScores[spellAbility] ?? 10);
  const preparedMax = isPreparedCaster
    ? Math.max(
        1,
        character.characterClass === "Artificer"
          ? spellAbilityMod + Math.floor(character.level / 2)
          : spellAbilityMod + character.level,
      )
    : null;

  // Compute maximum castable spell level from spell slots
  const maxCastableLevel = (() => {
    if (warlockMode) {
      // For warlocks, slots[1] is the pact slot level
      return slots[1] ?? 1;
    }
    // Standard casters: find the highest index where slots > 0, then level = index + 1
    let maxLvl = 0;
    for (let i = slots.length - 1; i >= 0; i--) {
      if ((slots[i] ?? 0) > 0) {
        maxLvl = i + 1;
        break;
      }
    }
    return maxLvl;
  })();

  // Filter spells for this class, deduplicate by name (keep first occurrence)
  const classSpells = (() => {
    const all = SPELLS.filter((s) =>
      s.classes
        .map((c) => c.toLowerCase())
        .includes(character.characterClass.toLowerCase()),
    );
    const seen = new Set<string>();
    const deduped: typeof all = [];
    for (const spell of all) {
      if (!seen.has(spell.name)) {
        seen.add(spell.name);
        deduped.push(spell);
      }
    }
    return deduped;
  })();

  const filteredSpells = classSpells.filter((s) => {
    // Only show spells the character can actually cast (cantrips always, plus up to maxCastableLevel)
    if (s.level > 0 && s.level > maxCastableLevel) return false;
    const matchesSearch =
      !spellSearch || s.name.toLowerCase().includes(spellSearch.toLowerCase());
    const matchesLevel =
      spellLevelFilter === null || s.level === spellLevelFilter;
    return matchesSearch && matchesLevel;
  });

  const toggleSpell = (spellName: string) => {
    const next = localPrepared.includes(spellName)
      ? localPrepared.filter((s) => s !== spellName)
      : [...localPrepared, spellName];
    setLocalPrepared(next);
    updatePreparedSpells.mutate({ id: character.id, preparedSpells: next });
  };

  const sectionTitle: React.CSSProperties = {
    color: "#c9a84c",
    fontSize: "12px",
    fontWeight: "bold",
    letterSpacing: "2px",
    textTransform: "uppercase",
    marginBottom: "16px",
    paddingBottom: "8px",
    borderBottom: "1px solid rgba(201,168,76,0.2)",
    fontFamily: "'Georgia', serif",
  };

  if (warlockMode) {
    const pactCount = slots[0] ?? 0;
    const pactLevel = slots[1] ?? 1;
    const usedCount = localUsed[0] ?? 0;

    return (
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <p style={sectionTitle}>Pact Magic Slots</p>
          <button
            onClick={handleLongRest}
            disabled={updateSpellSlots.isPending}
            style={{
              background: "transparent",
              border: "1px solid rgba(201,168,76,0.4)",
              color: "#c9a84c",
              borderRadius: "6px",
              padding: "6px 16px",
              fontSize: "12px",
              fontFamily: "'Georgia', serif",
              cursor: "pointer",
              letterSpacing: "0.5px",
            }}
          >
            Short/Long Rest (Restore All)
          </button>
        </div>

        <div
          style={{
            background: "rgba(0,0,0,0.5)",
            border: "1px solid rgba(201,168,76,0.3)",
            borderRadius: "10px",
            padding: "18px 20px",
          }}
        >
          <p
            style={{
              color: "#a89060",
              fontSize: "12px",
              fontFamily: "'Georgia', serif",
              marginBottom: "12px",
            }}
          >
            {pactCount} slot{pactCount !== 1 ? "s" : ""} at spell level{" "}
            {pactLevel} — recharges on short or long rest
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                color: "#b8934a",
                fontSize: "12px",
                fontFamily: "'Georgia', serif",
                minWidth: "120px",
              }}
            >
              Pact Slots (Lv {pactLevel})
            </span>
            <div style={{ display: "flex", gap: "6px" }}>
              {Array.from({ length: pactCount }, (_, j) => (
                <button
                  key={j}
                  onClick={() => toggleSlot(0, j)}
                  title={j < usedCount ? "Click to restore" : "Click to use"}
                  style={{
                    background:
                      j < usedCount ? "rgba(201,168,76,0.4)" : "transparent",
                    border: "1px solid #c9a84c",
                    borderRadius: "50%",
                    width: "28px",
                    height: "28px",
                    color: j < usedCount ? "#8b6914" : "#c9a84c",
                    cursor: "pointer",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Georgia', serif",
                  }}
                >
                  {j < usedCount ? "●" : "○"}
                </button>
              ))}
            </div>
            <span
              style={{
                color: "#a89060",
                fontSize: "12px",
                fontFamily: "'Georgia', serif",
              }}
            >
              {pactCount - usedCount} / {pactCount} remaining
            </span>
          </div>
        </div>

        {/* Spell selection for Warlock */}
        <SpellSelectionSection
          character={character}
          localPrepared={localPrepared}
          browseMode={browseMode}
          setBrowseMode={setBrowseMode}
          spellSearch={spellSearch}
          setSpellSearch={setSpellSearch}
          spellLevelFilter={spellLevelFilter}
          setSpellLevelFilter={setSpellLevelFilter}
          filteredSpells={filteredSpells}
          toggleSpell={toggleSpell}
          isPreparedCaster={isPreparedCaster}
          preparedMax={preparedMax}
        />
      </div>
    );
  }

  // Standard caster
  const activeLevels = slots
    .map((count, i) => ({ count, i }))
    .filter(({ count }) => count > 0);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "4px",
        }}
      >
        <p style={sectionTitle}>Spell Slots</p>
        <button
          onClick={handleLongRest}
          disabled={updateSpellSlots.isPending}
          style={{
            background: "transparent",
            border: "1px solid rgba(201,168,76,0.4)",
            color: "#c9a84c",
            borderRadius: "6px",
            padding: "6px 16px",
            fontSize: "12px",
            fontFamily: "'Georgia', serif",
            cursor: "pointer",
            letterSpacing: "0.5px",
            marginBottom: "16px",
          }}
        >
          Long Rest (Restore All)
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {activeLevels.map(({ count, i }) => {
          const usedCount = localUsed[i] ?? 0;
          const levelOrdinals = [
            "1st",
            "2nd",
            "3rd",
            "4th",
            "5th",
            "6th",
            "7th",
            "8th",
            "9th",
          ];
          return (
            <div
              key={i}
              style={{
                background: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(201,168,76,0.3)",
                borderRadius: "10px",
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  color: "#b8934a",
                  fontSize: "12px",
                  fontFamily: "'Georgia', serif",
                  minWidth: "100px",
                  fontWeight: "bold",
                }}
              >
                {levelOrdinals[i]} Level
              </span>
              <div style={{ display: "flex", gap: "6px" }}>
                {Array.from({ length: count }, (_, j) => (
                  <button
                    key={j}
                    onClick={() => toggleSlot(i, j)}
                    title={j < usedCount ? "Click to restore" : "Click to use"}
                    style={{
                      background:
                        j < usedCount ? "rgba(201,168,76,0.4)" : "transparent",
                      border: "1px solid #c9a84c",
                      borderRadius: "50%",
                      width: "28px",
                      height: "28px",
                      color: j < usedCount ? "#8b6914" : "#c9a84c",
                      cursor: "pointer",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "'Georgia', serif",
                    }}
                  >
                    {j < usedCount ? "●" : "○"}
                  </button>
                ))}
              </div>
              <span
                style={{
                  color: "#a89060",
                  fontSize: "12px",
                  fontFamily: "'Georgia', serif",
                }}
              >
                {count - usedCount} / {count} remaining
              </span>
            </div>
          );
        })}
      </div>

      {/* Spell selection */}
      <SpellSelectionSection
        character={character}
        localPrepared={localPrepared}
        browseMode={browseMode}
        setBrowseMode={setBrowseMode}
        spellSearch={spellSearch}
        setSpellSearch={setSpellSearch}
        spellLevelFilter={spellLevelFilter}
        setSpellLevelFilter={setSpellLevelFilter}
        filteredSpells={filteredSpells}
        toggleSpell={toggleSpell}
        isPreparedCaster={isPreparedCaster}
        preparedMax={preparedMax}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Spell Selection Section (extracted for reuse in both warlock and standard)
// ---------------------------------------------------------------------------

interface SpellSelectionSectionProps {
  character: CharacterData;
  localPrepared: string[];
  browseMode: boolean;
  setBrowseMode: (v: boolean | ((prev: boolean) => boolean)) => void;
  spellSearch: string;
  setSpellSearch: (v: string) => void;
  spellLevelFilter: number | null;
  setSpellLevelFilter: (v: number | null) => void;
  filteredSpells: typeof SPELLS;
  toggleSpell: (name: string) => void;
  isPreparedCaster: boolean;
  preparedMax: number | null;
}

function SpellSelectionSection({
  localPrepared,
  browseMode,
  setBrowseMode,
  spellSearch,
  setSpellSearch,
  spellLevelFilter,
  setSpellLevelFilter,
  filteredSpells,
  toggleSpell,
  isPreparedCaster,
  preparedMax,
}: SpellSelectionSectionProps) {
  const [selectedPreparedSpell, setSelectedPreparedSpell] = useState<
    string | null
  >(null);

  // Source badge style (matching /spells compendium page)
  const sourceBadgeStyle: React.CSSProperties = {
    flexShrink: 0,
    background: "rgba(74,144,217,0.1)",
    border: "1px solid rgba(74,144,217,0.35)",
    borderRadius: "3px",
    padding: "0px 5px",
    color: "#7ab4e0",
    fontSize: "10px",
    fontFamily: "'Georgia', serif",
    letterSpacing: "0.3px",
  };

  // Find the selected spell's data for the detail panel
  const selectedSpellData = selectedPreparedSpell
    ? SPELLS.find((s) => s.name === selectedPreparedSpell)
    : null;

  return (
    <div>
      <div
        style={{
          height: "1px",
          background: "rgba(201,168,76,0.15)",
          margin: "24px 0",
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <div>
          <p
            style={{
              color: "#c9a84c",
              fontSize: "12px",
              fontWeight: "bold",
              letterSpacing: "2px",
              textTransform: "uppercase",
              fontFamily: "'Georgia', serif",
            }}
          >
            {isPreparedCaster ? "Prepared Spells" : "Known Spells"}
          </p>
          {preparedMax !== null && (
            <p
              style={{
                color: "#a89060",
                fontSize: "12px",
                fontFamily: "'Georgia', serif",
                marginTop: "4px",
              }}
            >
              {localPrepared.length} / {preparedMax} prepared
            </p>
          )}
        </div>
        <button
          onClick={() => setBrowseMode((v) => !v)}
          style={{
            background: browseMode
              ? "linear-gradient(135deg, #8b6914, #c9a84c)"
              : "transparent",
            border: browseMode ? "none" : "1px solid rgba(201,168,76,0.4)",
            color: browseMode ? "#1a1a2e" : "#c9a84c",
            borderRadius: "6px",
            padding: "6px 16px",
            fontSize: "12px",
            fontFamily: "'Georgia', serif",
            cursor: "pointer",
            letterSpacing: "0.5px",
            fontWeight: browseMode ? "bold" : "normal",
          }}
        >
          {browseMode ? "Done" : "Manage Spells"}
        </button>
      </div>

      {browseMode ? (
        <div>
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "12px",
              flexWrap: "wrap",
            }}
          >
            <input
              type="text"
              placeholder="Search spells..."
              value={spellSearch}
              onChange={(e) => setSpellSearch(e.target.value)}
              style={{
                flex: 1,
                minWidth: "180px",
                padding: "8px 12px",
                background: "rgba(30,15,5,0.9)",
                border: "1px solid rgba(201,168,76,0.4)",
                borderRadius: "6px",
                color: "#e8d5a3",
                fontSize: "13px",
                fontFamily: "'Georgia', serif",
                outline: "none",
              }}
            />
            <select
              value={spellLevelFilter ?? ""}
              onChange={(e) =>
                setSpellLevelFilter(
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              style={{
                padding: "8px 12px",
                background: "rgba(30,15,5,0.9)",
                border: "1px solid rgba(201,168,76,0.4)",
                borderRadius: "6px",
                color: "#e8d5a3",
                fontSize: "13px",
                fontFamily: "'Georgia', serif",
                outline: "none",
              }}
            >
              <option value="">All Levels</option>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((l) => (
                <option key={l} value={l}>
                  {l === 0 ? "Cantrip" : `Level ${l}`}
                </option>
              ))}
            </select>
          </div>
          <div
            style={{
              maxHeight: "400px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            {filteredSpells.slice(0, 200).map((spell) => {
              const isPrepared = localPrepared.includes(spell.name);
              return (
                <div
                  key={spell.name}
                  onClick={() => toggleSpell(spell.name)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    background: isPrepared
                      ? "rgba(201,168,76,0.1)"
                      : "rgba(0,0,0,0.3)",
                    border: isPrepared
                      ? "1px solid rgba(201,168,76,0.35)"
                      : "1px solid transparent",
                  }}
                >
                  <span
                    style={{
                      color: isPrepared ? "#c9a84c" : "#a89060",
                      fontSize: "14px",
                    }}
                  >
                    {isPrepared ? "●" : "○"}
                  </span>
                  <span
                    style={{
                      color: "#e8d5a3",
                      fontSize: "13px",
                      fontFamily: "'Georgia', serif",
                      flex: 1,
                    }}
                  >
                    {spell.name}
                  </span>
                  <span style={sourceBadgeStyle}>{spell.source}</span>
                  <span
                    style={{
                      fontSize: "10px",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background: "rgba(201,168,76,0.12)",
                      border: "1px solid rgba(201,168,76,0.25)",
                      color: "#c9a84c",
                      fontFamily: "'Georgia', serif",
                    }}
                  >
                    {spell.level === 0 ? "C" : spell.level}
                  </span>
                  <span
                    style={{
                      color: "#a89060",
                      fontSize: "11px",
                      fontFamily: "'Georgia', serif",
                      minWidth: "60px",
                      textAlign: "right",
                    }}
                  >
                    {spell.school}
                  </span>
                </div>
              );
            })}
            {filteredSpells.length > 200 && (
              <p
                style={{
                  color: "#a89060",
                  fontSize: "12px",
                  fontFamily: "'Georgia', serif",
                  textAlign: "center",
                  padding: "8px",
                }}
              >
                Showing 200 of {filteredSpells.length} — use search to filter
              </p>
            )}
          </div>
        </div>
      ) : localPrepared.length === 0 ? (
        <p
          style={{
            color: "#a89060",
            fontSize: "13px",
            fontFamily: "'Georgia', serif",
            fontStyle: "italic",
            padding: "16px 0",
          }}
        >
          No spells prepared. Click &quot;Manage Spells&quot; to add some.
        </p>
      ) : (
        <div style={{ display: "flex", gap: "16px" }}>
          {/* Left column: spell list */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              maxHeight: "400px",
              overflowY: "auto",
            }}
          >
            {localPrepared.map((spellName) => {
              const spellData = SPELLS.find((s) => s.name === spellName);
              const isSelected = selectedPreparedSpell === spellName;
              return (
                <div
                  key={spellName}
                  onClick={() =>
                    setSelectedPreparedSpell(isSelected ? null : spellName)
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    background: isSelected
                      ? "rgba(201,168,76,0.15)"
                      : "rgba(0,0,0,0.4)",
                    border: isSelected
                      ? "1px solid rgba(201,168,76,0.5)"
                      : "1px solid rgba(201,168,76,0.2)",
                    cursor: "pointer",
                  }}
                >
                  <span
                    style={{
                      color: "#e8d5a3",
                      fontSize: "13px",
                      fontFamily: "'Georgia', serif",
                      flex: 1,
                    }}
                  >
                    {spellName}
                  </span>
                  {spellData && (
                    <>
                      <span style={sourceBadgeStyle}>{spellData.source}</span>
                      <span
                        style={{
                          fontSize: "10px",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: "rgba(201,168,76,0.12)",
                          border: "1px solid rgba(201,168,76,0.25)",
                          color: "#c9a84c",
                          fontFamily: "'Georgia', serif",
                        }}
                      >
                        {spellData.level === 0
                          ? "Cantrip"
                          : `Lv ${spellData.level}`}
                      </span>
                      <span
                        style={{
                          color: "#a89060",
                          fontSize: "11px",
                          fontFamily: "'Georgia', serif",
                        }}
                      >
                        {spellData.school}
                      </span>
                    </>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSpell(spellName);
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#a89060",
                      cursor: "pointer",
                      fontSize: "14px",
                      padding: "0 4px",
                      lineHeight: 1,
                    }}
                    title="Remove spell"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>

          {/* Right column: spell detail */}
          <div
            style={{
              flex: 1,
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(201,168,76,0.3)",
              borderRadius: "10px",
              padding: "18px 20px",
              maxHeight: "400px",
              overflowY: "auto",
            }}
          >
            {selectedSpellData ? (
              <div>
                <h3
                  style={{
                    color: "#c9a84c",
                    fontSize: "16px",
                    fontWeight: "bold",
                    fontFamily: "'Georgia', serif",
                    marginBottom: "6px",
                    letterSpacing: "0.5px",
                  }}
                >
                  {selectedSpellData.name}
                </h3>
                <p
                  style={{
                    color: "#a89060",
                    fontSize: "12px",
                    fontFamily: "'Georgia', serif",
                    marginBottom: "12px",
                  }}
                >
                  {selectedSpellData.level === 0
                    ? "Cantrip"
                    : `Level ${selectedSpellData.level}`}{" "}
                  {selectedSpellData.school}
                  {" · "}
                  <span style={{ color: "#7ab4e0" }}>
                    {selectedSpellData.source}
                  </span>
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    marginBottom: "12px",
                  }}
                >
                  {[
                    {
                      label: "Casting Time",
                      value: selectedSpellData.castingTime,
                    },
                    { label: "Range", value: selectedSpellData.range },
                    { label: "Duration", value: selectedSpellData.duration },
                    {
                      label: "Components",
                      value: selectedSpellData.components,
                    },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: "flex", gap: "8px" }}>
                      <span
                        style={{
                          color: "#b8934a",
                          fontSize: "11px",
                          fontFamily: "'Georgia', serif",
                          minWidth: "90px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {label}
                      </span>
                      <span
                        style={{
                          color: "#e8d5a3",
                          fontSize: "12px",
                          fontFamily: "'Georgia', serif",
                        }}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    borderTop: "1px solid rgba(201,168,76,0.15)",
                    paddingTop: "10px",
                  }}
                >
                  <p
                    style={{
                      color: "#e8d5a3",
                      fontSize: "13px",
                      fontFamily: "'Georgia', serif",
                      lineHeight: 1.7,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {selectedSpellData.description}
                  </p>
                  {selectedSpellData.higherLevel && (
                    <div style={{ marginTop: "10px" }}>
                      <p
                        style={{
                          color: "#c9a84c",
                          fontSize: "12px",
                          fontWeight: "bold",
                          fontFamily: "'Georgia', serif",
                          marginBottom: "4px",
                        }}
                      >
                        At Higher Levels
                      </p>
                      <p
                        style={{
                          color: "#e8d5a3",
                          fontSize: "13px",
                          fontFamily: "'Georgia', serif",
                          lineHeight: 1.7,
                        }}
                      >
                        {selectedSpellData.higherLevel}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p
                style={{
                  color: "#a89060",
                  fontSize: "13px",
                  fontFamily: "'Georgia', serif",
                  fontStyle: "italic",
                  textAlign: "center",
                  paddingTop: "40px",
                }}
              >
                Select a spell to view its description
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview Tab (existing content)
// ---------------------------------------------------------------------------

function RaceFeaturesSection({
  character,
  sectionTitle,
}: {
  character: CharacterData;
  sectionTitle: React.CSSProperties;
}) {
  const raceInfo: RaceInfo | undefined =
    getRaceByNameAndSource(character.race, character.rulesSource ?? "PHB") ??
    getRaceByName(character.race);

  if (!raceInfo) {
    return (
      <div
        style={{
          background: "rgba(0,0,0,0.5)",
          border: "1px solid rgba(201,168,76,0.3)",
          borderRadius: "12px",
          padding: "20px 24px",
        }}
      >
        <p style={sectionTitle}>Race Features</p>
        <p
          style={{
            color: "#a89060",
            fontSize: "13px",
            fontFamily: "'Georgia', serif",
            fontStyle: "italic",
          }}
        >
          Race features not available for &ldquo;{character.race}&rdquo;.
        </p>
      </div>
    );
  }

  const badgeStyle: React.CSSProperties = {
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: "12px",
    fontSize: "11px",
    fontFamily: "'Georgia', serif",
    letterSpacing: "0.04em",
    background: "rgba(201,168,76,0.1)",
    border: "1px solid rgba(201,168,76,0.3)",
    color: "#c9a84c",
  };

  return (
    <div
      style={{
        background: "rgba(0,0,0,0.5)",
        border: "1px solid rgba(201,168,76,0.3)",
        borderRadius: "12px",
        padding: "20px 24px",
      }}
    >
      <p style={sectionTitle}>
        {raceInfo.name} {raceInfo.source === "XPHB" ? "(2024)" : "(2014)"} —
        Race Features
      </p>

      {/* Meta info: speed, size, languages */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        <span style={badgeStyle}>Speed: {raceInfo.speed} ft.</span>
        <span style={badgeStyle}>Size: {raceInfo.size}</span>
        {raceInfo.languages.map((lang) => (
          <span key={lang} style={badgeStyle}>
            {lang}
          </span>
        ))}
      </div>

      {/* Ability Score Increase (PHB 2014 races) */}
      {raceInfo.abilityScoreIncrease && (
        <div
          style={{
            marginBottom: "14px",
            padding: "8px 14px",
            background: "rgba(201,168,76,0.06)",
            borderLeft: "3px solid #c9a84c",
            borderRadius: "0 6px 6px 0",
          }}
        >
          <span
            style={{
              color: "#b8934a",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "1.2px",
              fontFamily: "'Georgia', serif",
              fontWeight: "bold",
            }}
          >
            Ability Score Increase
          </span>
          <p
            style={{
              color: "#e8d5a3",
              fontSize: "13px",
              fontFamily: "'Georgia', serif",
              lineHeight: 1.5,
              margin: "4px 0 0",
            }}
          >
            {raceInfo.abilityScoreIncrease}
          </p>
        </div>
      )}

      {/* Racial traits */}
      {raceInfo.traits.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {raceInfo.traits.map((trait) => (
            <div
              key={trait.name}
              style={{
                padding: "10px 14px",
                background: "rgba(201,168,76,0.04)",
                borderLeft: "3px solid rgba(201,168,76,0.5)",
                borderRadius: "0 6px 6px 0",
              }}
            >
              <span
                style={{
                  color: "#c9a84c",
                  fontSize: "13px",
                  fontWeight: "bold",
                  fontFamily: "'Georgia', serif",
                }}
              >
                {trait.name}
              </span>
              <p
                style={{
                  color: "#e8d5a3",
                  fontSize: "13px",
                  fontFamily: "'Georgia', serif",
                  lineHeight: 1.5,
                  margin: "4px 0 0",
                }}
              >
                {trait.description}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* No traits fallback (e.g., PHB Human) */}
      {raceInfo.traits.length === 0 && !raceInfo.abilityScoreIncrease && (
        <p
          style={{
            color: "#a89060",
            fontSize: "13px",
            fontFamily: "'Georgia', serif",
            fontStyle: "italic",
          }}
        >
          No additional racial traits.
        </p>
      )}
    </div>
  );
}

function OverviewTab({ character }: { character: CharacterData }) {
  const utils = api.useUtils();
  const prof = proficiencyBonus(character.level);
  const savingProfs =
    SAVING_THROW_PROFICIENCIES[character.characterClass] ?? [];

  const abilityScores: Record<string, number> = {
    strength: character.strength,
    dexterity: character.dexterity,
    constitution: character.constitution,
    intelligence: character.intelligence,
    wisdom: character.wisdom,
    charisma: character.charisma,
  };

  // Skill proficiencies (read-only from character data)
  const proficientSkills: string[] = (() => {
    try {
      return JSON.parse(character.skillProficiencies || "[]") as string[];
    } catch {
      return [];
    }
  })();

  // Skill expertise (read-only from character data)
  const expertiseSkills: string[] = (() => {
    try {
      return JSON.parse(character.skillExpertise || "[]") as string[];
    } catch {
      return [];
    }
  })();

  const sectionTitle: React.CSSProperties = {
    color: "#c9a84c",
    fontSize: "12px",
    fontWeight: "bold",
    letterSpacing: "2px",
    textTransform: "uppercase",
    marginBottom: "16px",
    paddingBottom: "8px",
    borderBottom: "1px solid rgba(201,168,76,0.2)",
    fontFamily: "'Georgia', serif",
  };

  return (
    <div>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}
      >
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Ability Scores */}
          <div
            style={{
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(201,168,76,0.3)",
              borderRadius: "12px",
              padding: "20px 24px",
            }}
          >
            <p style={sectionTitle}>Ability Scores</p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "12px",
              }}
            >
              {ABILITY_NAMES.map(({ key, label }) => (
                <div
                  key={key}
                  style={{
                    textAlign: "center",
                    background: "rgba(201,168,76,0.05)",
                    border: "1px solid rgba(201,168,76,0.2)",
                    borderRadius: "8px",
                    padding: "12px 8px",
                  }}
                >
                  <div
                    style={{
                      color: "#b8934a",
                      fontSize: "10px",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      fontFamily: "'Georgia', serif",
                      marginBottom: "6px",
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      color: "#e8d5a3",
                      fontSize: "22px",
                      fontWeight: "bold",
                      fontFamily: "'Georgia', serif",
                      lineHeight: 1,
                    }}
                  >
                    {abilityScores[key]}
                  </div>
                  <div
                    style={{
                      color: "#a89060",
                      fontSize: "13px",
                      fontFamily: "'Georgia', serif",
                      marginTop: "4px",
                    }}
                  >
                    {modStr(abilityScores[key]!)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Race Features */}
          <RaceFeaturesSection
            character={character}
            sectionTitle={sectionTitle}
          />

          {/* Saving Throws */}
          <div
            style={{
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(201,168,76,0.3)",
              borderRadius: "12px",
              padding: "20px 24px",
            }}
          >
            <p style={sectionTitle}>Saving Throws</p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {ABILITY_NAMES.map(({ key, label }) => {
                const isProficient = savingProfs.includes(key);
                const total =
                  mod(abilityScores[key]!) + (isProficient ? prof : 0);
                const totalStr = total >= 0 ? `+${total}` : `${total}`;
                return (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <span
                      style={{
                        color: isProficient ? "#c9a84c" : "#a89060",
                        fontSize: "12px",
                      }}
                    >
                      {isProficient ? "●" : "○"}
                    </span>
                    <span
                      style={{
                        color: "#e8d5a3",
                        fontSize: "13px",
                        fontFamily: "'Georgia', serif",
                        flex: 1,
                      }}
                    >
                      {label}
                    </span>
                    <span
                      style={{
                        color: "#e8d5a3",
                        fontSize: "13px",
                        fontFamily: "'Georgia', serif",
                        fontWeight: isProficient ? "bold" : "normal",
                      }}
                    >
                      {totalStr}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: Skills */}
        <div
          style={{
            background: "rgba(0,0,0,0.5)",
            border: "1px solid rgba(201,168,76,0.3)",
            borderRadius: "12px",
            padding: "20px 24px",
            maxHeight: "550px",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              marginBottom: "16px",
              paddingBottom: "8px",
              borderBottom: "1px solid rgba(201,168,76,0.2)",
            }}
          >
            <p
              style={{
                ...sectionTitle,
                marginBottom: 0,
                paddingBottom: 0,
                borderBottom: "none",
              }}
            >
              Skills
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            {SKILLS.map(({ name, ability }) => {
              const score = abilityScores[ability] ?? 10;
              const baseMod = mod(score);
              const hasExpertise = expertiseSkills.includes(name);
              const isProficient = proficientSkills.includes(name);
              const total = hasExpertise
                ? baseMod + prof * 2
                : isProficient
                  ? baseMod + prof
                  : baseMod;
              const skillStr = total >= 0 ? `+${total}` : `${total}`;
              const abilityLabel =
                ABILITY_NAMES.find((a) => a.key === ability)?.label ?? "";
              const indicator = hasExpertise ? "★" : isProficient ? "●" : "○";
              const indicatorColor =
                hasExpertise || isProficient ? "#c9a84c" : "#a89060";
              const isHighlighted = hasExpertise || isProficient;
              return (
                <div
                  key={name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    borderRadius: "4px",
                    padding: "2px 4px",
                  }}
                >
                  <span style={{ color: indicatorColor, fontSize: "12px" }}>
                    {indicator}
                  </span>
                  <span
                    style={{
                      color: "#e8d5a3",
                      fontSize: "13px",
                      fontFamily: "'Georgia', serif",
                      flex: 1,
                      fontWeight: isHighlighted ? "bold" : "normal",
                    }}
                  >
                    {name}
                  </span>
                  <span
                    style={{
                      color: "#a89060",
                      fontSize: "11px",
                      fontFamily: "'Georgia', serif",
                    }}
                  >
                    ({abilityLabel})
                  </span>
                  <span
                    style={{
                      color: isHighlighted ? "#c9a84c" : "#e8d5a3",
                      fontSize: "13px",
                      fontFamily: "'Georgia', serif",
                      fontWeight: isHighlighted ? "bold" : "normal",
                    }}
                  >
                    {skillStr}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Backstory */}
      {character.backstory && (
        <div
          style={{
            background: "rgba(0,0,0,0.5)",
            border: "1px solid rgba(201,168,76,0.3)",
            borderRadius: "12px",
            padding: "20px 24px",
            marginTop: "20px",
          }}
        >
          <p style={sectionTitle}>Backstory</p>
          <p
            style={{
              color: "#e8d5a3",
              fontSize: "14px",
              fontFamily: "'Georgia', serif",
              lineHeight: 1.7,
              whiteSpace: "pre-wrap",
            }}
          >
            {character.backstory}
          </p>
        </div>
      )}

      {/* Feats */}
      {(() => {
        const feats: string[] = (() => {
          try {
            return character.feats
              ? (JSON.parse(character.feats) as string[])
              : [];
          } catch {
            return [];
          }
        })();
        if (feats.length === 0) return null;
        return (
          <div
            style={{
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(201,168,76,0.3)",
              borderRadius: "12px",
              padding: "20px 24px",
              marginTop: "20px",
            }}
          >
            <p style={sectionTitle}>Feats</p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {feats.map((featName) => (
                <FeatCard
                  key={featName}
                  featName={featName}
                  rulesSource={character.rulesSource || "PHB"}
                />
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FeatCard
// ---------------------------------------------------------------------------

function FeatCard({
  featName,
  rulesSource,
}: {
  featName: string;
  rulesSource: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const feat = getFeatByNameAndSource(featName, rulesSource);

  if (!feat) {
    return (
      <span
        style={{
          background: "rgba(201,168,76,0.12)",
          border: "1px solid rgba(201,168,76,0.35)",
          borderRadius: "20px",
          padding: "5px 14px",
          color: "#c9a84c",
          fontSize: "12px",
          fontFamily: "'Georgia', serif",
          fontWeight: "bold",
          display: "inline-block",
        }}
      >
        {featName}
      </span>
    );
  }

  const description = feat.entries.join(" ");
  const snippet =
    description.length > 120
      ? description.slice(0, 120).replace(/\s\S*$/, "") + "..."
      : description;

  const abilityBonusLabel = (() => {
    if (!feat.abilityBonus) return null;
    const parts: string[] = [];
    if (feat.abilityBonus.fixed) {
      for (const [ab, val] of Object.entries(feat.abilityBonus.fixed)) {
        const name = ab.charAt(0).toUpperCase() + ab.slice(1);
        parts.push(`+${val} ${name}`);
      }
    }
    if (feat.abilityBonus.choose) {
      const c = feat.abilityBonus.choose;
      parts.push(
        `+${c.amount} to ${c.count} from ${c.from.map((a) => a.charAt(0).toUpperCase() + a.slice(1)).join("/")}`,
      );
    }
    return parts.length > 0 ? parts.join(", ") : null;
  })();

  return (
    <div
      onClick={() => setExpanded((v) => !v)}
      style={{
        background: "rgba(201,168,76,0.06)",
        border: "1px solid rgba(201,168,76,0.25)",
        borderRadius: "8px",
        padding: "12px 16px",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: expanded ? "8px" : "0",
        }}
      >
        <span
          style={{
            color: "#c9a84c",
            fontSize: "13px",
            fontFamily: "'Georgia', serif",
            fontWeight: "bold",
          }}
        >
          {feat.name}
        </span>
        <span
          style={{
            background: "rgba(100,149,237,0.2)",
            border: "1px solid rgba(100,149,237,0.4)",
            borderRadius: "4px",
            padding: "1px 6px",
            color: "#6495ed",
            fontSize: "10px",
          }}
        >
          {feat.source}
        </span>
        {abilityBonusLabel && (
          <span
            style={{
              background: "rgba(201,168,76,0.15)",
              border: "1px solid rgba(201,168,76,0.3)",
              borderRadius: "4px",
              padding: "1px 8px",
              color: "#c9a84c",
              fontSize: "10px",
              fontFamily: "'Georgia', serif",
            }}
          >
            {abilityBonusLabel}
          </span>
        )}
        <span
          style={{ color: "#a89060", fontSize: "10px", marginLeft: "auto" }}
        >
          {expanded ? "\u25BC" : "\u25BA"}
        </span>
      </div>
      {!expanded && (
        <p
          style={{
            color: "#a89060",
            fontSize: "12px",
            fontFamily: "'Georgia', serif",
            margin: "4px 0 0 0",
            lineHeight: "1.4",
            fontStyle: "italic",
          }}
        >
          {snippet}
        </p>
      )}
      {expanded && (
        <div style={{ marginTop: "4px" }}>
          {feat.entries.map((entry, i) => (
            <p
              key={i}
              style={{
                color: "#e8d5a3",
                fontSize: "13px",
                fontFamily: "'Georgia', serif",
                lineHeight: "1.6",
                margin: "0 0 6px 0",
              }}
            >
              {entry}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inventory Item Description (for character inventory tab)
// ---------------------------------------------------------------------------

function InventoryItemDescription({
  itemData,
  customDescription,
}: {
  itemData: Item | undefined;
  customDescription: string | null | undefined;
}) {
  let attachedItemData: Item | undefined;
  let cleanCustomDescription = customDescription;

  if (customDescription?.startsWith("[ATTACHED:")) {
    const endBracket = customDescription.indexOf("]");
    if (endBracket !== -1) {
      const ref = customDescription.slice(10, endBracket);
      const pipeIdx = ref.lastIndexOf("|");
      if (pipeIdx !== -1) {
        const attachedName = ref.slice(0, pipeIdx);
        const attachedSource = ref.slice(pipeIdx + 1);
        attachedItemData = ITEMS.find(
          (it) => it.name === attachedName && it.source === attachedSource,
        );
      }
      cleanCustomDescription = customDescription.slice(endBracket + 1).trim() || null;
    }
  }

  const displayItemData = itemData ?? attachedItemData;

  if (!displayItemData && !cleanCustomDescription) {
    return (
      <p
        style={{
          color: "rgba(232,213,163,0.6)",
          fontSize: "13px",
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontStyle: "italic",
        }}
      >
        No description available.
      </p>
    );
  }

  return (
    <>
      {attachedItemData && !itemData && (
        <p
          style={{
            color: "#a89060",
            fontSize: "10px",
            fontFamily: "'Georgia', 'Times New Roman', serif",
            letterSpacing: "1px",
            textTransform: "uppercase",
            marginBottom: "6px",
          }}
        >
          Based on: {attachedItemData.name}
          {" "}
          <span
            style={{
              background: "rgba(201,168,76,0.15)",
              color: "#a89060",
              padding: "1px 6px",
              borderRadius: "3px",
              fontSize: "9px",
              letterSpacing: "0.5px",
            }}
          >
            {attachedItemData.source}
          </span>
        </p>
      )}
      {displayItemData && (
        <>
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
            {displayItemData.type && (
              <span
                style={{
                  color: "#a89060",
                  fontSize: "13px",
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  fontStyle: "italic",
                }}
              >
                {displayItemData.type}
              </span>
            )}
            {displayItemData.rarity && displayItemData.rarity !== "none" && (
              <span
                style={{
                  fontSize: "10px",
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  background: "rgba(201,168,76,0.15)",
                  color: "#c9a84c",
                }}
              >
                {displayItemData.rarity}
              </span>
            )}
            <span
              style={{
                background: "rgba(201,168,76,0.15)",
                color: "#a89060",
                padding: "1px 6px",
                borderRadius: "3px",
                fontSize: "9px",
                letterSpacing: "0.5px",
              }}
            >
              {displayItemData.source}
            </span>
          </div>

          {/* Weight, value, attunement */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              marginBottom: "12px",
              fontSize: "13px",
              fontFamily: "'Georgia', 'Times New Roman', serif",
            }}
          >
            {displayItemData.weight != null && (
              <div>
                <span style={{ color: "#c9a84c", fontWeight: "bold" }}>Weight </span>
                <span style={{ color: "#e8d5a3" }}>{displayItemData.weight} lb.</span>
              </div>
            )}
            {displayItemData.value != null && (
              <div>
                <span style={{ color: "#c9a84c", fontWeight: "bold" }}>Value </span>
                <span style={{ color: "#e8d5a3" }}>{displayItemData.value} gp</span>
              </div>
            )}
            {displayItemData.reqAttune && (
              <div>
                <span style={{ color: "#c9a84c", fontWeight: "bold" }}>Attunement </span>
                <span style={{ color: "#e8d5a3" }}>{displayItemData.reqAttune}</span>
              </div>
            )}
          </div>

          {/* Weapon stats */}
          {displayItemData.weaponCategory && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                marginBottom: "12px",
                fontSize: "13px",
                fontFamily: "'Georgia', 'Times New Roman', serif",
              }}
            >
              <div>
                <span style={{ color: "#c9a84c", fontWeight: "bold" }}>Category </span>
                <span style={{ color: "#e8d5a3" }}>{displayItemData.weaponCategory}</span>
              </div>
              {displayItemData.dmg1 && (
                <div>
                  <span style={{ color: "#c9a84c", fontWeight: "bold" }}>Damage </span>
                  <span style={{ color: "#e8d5a3" }}>
                    {displayItemData.dmg1}
                    {displayItemData.dmgType ? ` ${displayItemData.dmgType}` : ""}
                  </span>
                </div>
              )}
              {displayItemData.range && (
                <div>
                  <span style={{ color: "#c9a84c", fontWeight: "bold" }}>Range </span>
                  <span style={{ color: "#e8d5a3" }}>{displayItemData.range}</span>
                </div>
              )}
            </div>
          )}

          {/* AC for armor/shields */}
          {(displayItemData.ac != null || displayItemData.bonusAc) && (
            <div
              style={{
                marginBottom: "12px",
                fontSize: "13px",
                fontFamily: "'Georgia', 'Times New Roman', serif",
              }}
            >
              {displayItemData.ac != null && (
                <div>
                  <span style={{ color: "#c9a84c", fontWeight: "bold" }}>AC </span>
                  <span style={{ color: "#e8d5a3" }}>{displayItemData.ac}</span>
                </div>
              )}
              {displayItemData.bonusAc && (
                <div>
                  <span style={{ color: "#c9a84c", fontWeight: "bold" }}>Bonus AC </span>
                  <span style={{ color: "#e8d5a3" }}>{displayItemData.bonusAc}</span>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {displayItemData.description && (
            <div
              style={{
                borderTop: "1px solid rgba(201,168,76,0.2)",
                paddingTop: "8px",
              }}
            >
              <p
                style={{
                  color: "#e8d5a3",
                  fontSize: "13px",
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  lineHeight: "1.6",
                }}
                dangerouslySetInnerHTML={{
                  __html: parseTaggedText(displayItemData.description),
                }}
              />
            </div>
          )}
        </>
      )}

      {/* Custom description (DM-added) */}
      {cleanCustomDescription && (
        <div
          style={{
            background: "rgba(201,168,76,0.08)",
            border: "1px solid rgba(201,168,76,0.25)",
            borderLeft: "3px solid #c9a84c",
            borderRadius: "4px",
            padding: "12px 16px",
            marginTop: displayItemData ? "12px" : "0",
          }}
        >
          <p
            style={{
              color: "#a89060",
              fontSize: "10px",
              fontFamily: "'Georgia', 'Times New Roman', serif",
              letterSpacing: "1px",
              textTransform: "uppercase",
              marginBottom: "6px",
            }}
          >
            DM Note
          </p>
          <p
            style={{
              color: "#e8d5a3",
              fontSize: "13px",
              fontFamily: "'Georgia', 'Times New Roman', serif",
              lineHeight: "1.6",
              whiteSpace: "pre-wrap",
              margin: 0,
            }}
          >
            {cleanCustomDescription}
          </p>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Starting Items Modal (for character inventory tab)
// ---------------------------------------------------------------------------

function CharacterStartingItemsModal({
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
          quantity: si.quantity ?? 1,
          displayName: si.displayName,
        });
      }
    }

    for (const bi of bgItems) {
      items.push({
        name: bi.name,
        source: bi.source,
        quantity: bi.quantity ?? 1,
        displayName: bi.displayName,
      });
    }

    if (items.length === 0) {
      onClose();
      return;
    }

    addStartingItems.mutate({ adventurePlayerId, items });
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "linear-gradient(180deg, rgba(20,12,5,0.98) 0%, rgba(10,6,2,0.98) 100%)",
          border: "2px solid rgba(201,168,76,0.5)",
          borderRadius: "16px",
          padding: "32px",
          maxWidth: "600px",
          width: "100%",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            color: "#c9a84c",
            fontSize: "16px",
            fontWeight: "bold",
            letterSpacing: "1px",
            textTransform: "uppercase",
            fontFamily: "'Georgia', serif",
            marginBottom: "20px",
          }}
        >
          Starting Equipment
        </h3>

        {/* Class Equipment Presets */}
        {classPresets.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <p
              style={{
                color: "#c9a84c",
                fontSize: "12px",
                fontWeight: "bold",
                letterSpacing: "2px",
                textTransform: "uppercase",
                fontFamily: "'Georgia', serif",
                marginBottom: "12px",
                paddingBottom: "8px",
                borderBottom: "1px solid rgba(201,168,76,0.2)",
              }}
            >
              Class Equipment ({characterClass})
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {classPresets.map((preset, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedPresetIdx(idx)}
                  style={{
                    background:
                      selectedPresetIdx === idx
                        ? "rgba(201,168,76,0.15)"
                        : "rgba(0,0,0,0.3)",
                    border:
                      selectedPresetIdx === idx
                        ? "1px solid rgba(201,168,76,0.5)"
                        : "1px solid rgba(201,168,76,0.15)",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    cursor: "pointer",
                  }}
                >
                  <p
                    style={{
                      color: "#e8d5a3",
                      fontSize: "13px",
                      fontFamily: "'Georgia', serif",
                      marginBottom: "4px",
                      fontWeight: "bold",
                    }}
                  >
                    {preset.label}
                  </p>
                  <p
                    style={{
                      color: "#a89060",
                      fontSize: "12px",
                      fontFamily: "'Georgia', serif",
                    }}
                  >
                    {preset.items.map((it) => it.displayName ?? it.name).join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Background Equipment */}
        {bgItems.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <p
              style={{
                color: "#c9a84c",
                fontSize: "12px",
                fontWeight: "bold",
                letterSpacing: "2px",
                textTransform: "uppercase",
                fontFamily: "'Georgia', serif",
                marginBottom: "12px",
                paddingBottom: "8px",
                borderBottom: "1px solid rgba(201,168,76,0.2)",
              }}
            >
              Background Equipment ({background})
            </p>
            <div
              style={{
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(201,168,76,0.15)",
                borderRadius: "8px",
                padding: "12px 16px",
              }}
            >
              <p
                style={{
                  color: "#a89060",
                  fontSize: "12px",
                  fontFamily: "'Georgia', serif",
                }}
              >
                {bgItems.map((it) => it.displayName ?? it.name).join(", ")}
              </p>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid rgba(201,168,76,0.3)",
              color: "#a89060",
              borderRadius: "6px",
              padding: "8px 20px",
              fontSize: "13px",
              fontFamily: "'Georgia', serif",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={addStartingItems.isPending}
            style={{
              background: "linear-gradient(135deg, #8b6914, #c9a84c)",
              color: "#1a1a2e",
              border: "none",
              borderRadius: "6px",
              padding: "8px 20px",
              fontSize: "13px",
              fontFamily: "'Georgia', serif",
              fontWeight: "bold",
              cursor: addStartingItems.isPending ? "default" : "pointer",
              opacity: addStartingItems.isPending ? 0.6 : 1,
            }}
          >
            {addStartingItems.isPending ? "Adding..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Character Inventory Tab
// ---------------------------------------------------------------------------

function CharacterInventoryTab({ character }: { character: CharacterData }) {
  const [searchText, setSearchText] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showStartingModal, setShowStartingModal] = useState(false);

  const adventurePlayer = character.adventurePlayers?.find(
    (ap) => ap.status === "ACCEPTED",
  );
  const adventurePlayerId = adventurePlayer?.id ?? "";
  const adventureId = adventurePlayer?.adventure.id ?? "";

  const { data: inventoryItems = [], isLoading } =
    api.adventure.getInventory.useQuery(
      { adventureId, adventurePlayerId },
      { enabled: !!adventurePlayerId && !!adventureId },
    );

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

  if (!adventurePlayer) {
    return (
      <div
        style={{
          background: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(201,168,76,0.2)",
          borderRadius: "12px",
          padding: "60px 40px",
          textAlign: "center",
        }}
      >
        <p style={{ color: "#a89060", fontSize: "14px", fontFamily: "'Georgia', serif" }}>
          No accepted adventure found.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <p style={{ color: "#a89060", fontSize: "13px", fontFamily: "'Georgia', serif" }}>
        Loading inventory...
      </p>
    );
  }

  const charClass = character.characterClass ?? "";
  const classSource = character.rulesSource ?? "PHB";
  const background = character.background ?? "";

  return (
    <div>
      {/* Adventure name */}
      <p
        style={{
          color: "#a89060",
          fontSize: "11px",
          fontFamily: "'Georgia', serif",
          letterSpacing: "1px",
          textTransform: "uppercase",
          marginBottom: "16px",
        }}
      >
        Inventory for: {adventurePlayer.adventure.name}
      </p>

      {/* Starting items button */}
      {!hasStartingItems && (
        <button
          onClick={() => setShowStartingModal(true)}
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
          Add Starting Items
        </button>
      )}

      {/* Search input */}
      {typedItems.length > 0 && (
        <input
          type="text"
          placeholder="Search inventory..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            background: "rgba(30,15,5,0.9)",
            border: "1px solid rgba(201,168,76,0.4)",
            color: "#e8d5a3",
            fontFamily: "'Georgia', serif",
            borderRadius: "6px",
            padding: "10px 14px",
            width: "100%",
            fontSize: "14px",
            boxSizing: "border-box",
            outline: "none",
            marginBottom: "16px",
          }}
        />
      )}

      {/* Inventory list */}
      {typedItems.length === 0 ? (
        <div
          style={{
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(201,168,76,0.2)",
            borderRadius: "12px",
            padding: "60px 40px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              color: "#a89060",
              fontSize: "16px",
              fontFamily: "'Georgia', serif",
              fontStyle: "italic",
              marginBottom: "8px",
            }}
          >
            Your pack is empty, adventurer...
          </p>
          <p style={{ color: "rgba(232,213,163,0.6)", fontSize: "13px", fontFamily: "'Georgia', serif" }}>
            Add starting items or wait for your DM to grant you equipment.
          </p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div
          style={{
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(201,168,76,0.2)",
            borderRadius: "12px",
            padding: "40px",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#a89060", fontSize: "14px", fontFamily: "'Georgia', serif" }}>
            No items match your search.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filteredItems.map((item) => {
            const isExpanded = expandedId === item.id;
            const itemData = ITEMS.find(
              (it) =>
                it.name.toLowerCase() === item.itemName.toLowerCase() &&
                it.source.toLowerCase() === item.itemSource.toLowerCase(),
            ) ?? ITEMS.find(
              (it) => it.name.toLowerCase() === item.itemName.toLowerCase(),
            );

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
                      gap: "10px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        color: "#e8d5a3",
                        fontSize: "14px",
                        fontFamily: "'Georgia', serif",
                      }}
                    >
                      {isExpanded ? "\u25BC" : "\u25B6"} {item.itemName}
                    </span>
                    {item.quantity > 1 && (
                      <span
                        style={{
                          color: "#c9a84c",
                          fontSize: "12px",
                          fontFamily: "'Georgia', serif",
                          background: "rgba(201,168,76,0.15)",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontWeight: "bold",
                        }}
                      >
                        x{item.quantity}
                      </span>
                    )}
                    <span
                      style={{
                        background: "rgba(201,168,76,0.15)",
                        color: "#a89060",
                        padding: "1px 6px",
                        borderRadius: "3px",
                        fontSize: "9px",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {item.itemSource}
                    </span>
                    {itemData && itemData.rarity && itemData.rarity !== "none" && (
                      <span
                        style={{
                          fontSize: "10px",
                          fontFamily: "'Georgia', serif",
                          letterSpacing: "0.5px",
                          textTransform: "uppercase",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          background: "rgba(201,168,76,0.15)",
                          color: "#c9a84c",
                        }}
                      >
                        {itemData.rarity}
                      </span>
                    )}
                    {item.isStartingItem && (
                      <span
                        style={{
                          color: "#4a8c3f",
                          fontSize: "10px",
                          fontFamily: "'Georgia', serif",
                          background: "rgba(74,140,63,0.15)",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          letterSpacing: "0.5px",
                          textTransform: "uppercase",
                        }}
                      >
                        Starting
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      color: "#a89060",
                      fontSize: "12px",
                      fontFamily: "'Georgia', 'Times New Roman', serif",
                    }}
                  >
                    {isExpanded ? "\u25B2" : "\u25BC"}
                  </span>
                </div>

                {isExpanded && (
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

      {/* Starting Items Modal */}
      <CharacterStartingItemsModal
        open={showStartingModal}
        onClose={() => setShowStartingModal(false)}
        characterClass={charClass}
        classSource={classSource}
        background={background}
        adventurePlayerId={adventurePlayerId}
        adventureId={adventureId}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// NotesTab
// ---------------------------------------------------------------------------

function NotesTab({ character }: { character: CharacterData }) {
  const utils = api.useUtils();
  const [notes, setNotes] = useState<string>(character.notes || "");
  const [saved, setSaved] = useState(true);

  const updateNotes = api.character.updateNotes.useMutation({
    onSuccess: async () => {
      setSaved(true);
      await utils.character.getById.invalidate({ id: character.id });
    },
  });

  const handleSave = () => {
    updateNotes.mutate({ id: character.id, notes });
  };

  // Determine if the character is in an adventure (for DM notes)
  const adventurePlayer = character.adventurePlayers && character.adventurePlayers.length > 0
    ? character.adventurePlayers[0]!
    : null;
  const adventureId = adventurePlayer?.status === "ACCEPTED" ? adventurePlayer.adventure.id : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div
        style={{
          background: "rgba(0,0,0,0.5)",
          border: "1px solid rgba(201,168,76,0.3)",
          borderRadius: "12px",
          padding: "20px 24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <p
            style={{
              color: "#c9a84c",
              fontSize: "12px",
              fontWeight: "bold",
              letterSpacing: "2px",
              textTransform: "uppercase",
              fontFamily: "'Georgia', serif",
              margin: 0,
            }}
          >
            Adventurer&apos;s Journal
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {!saved && (
              <span
                style={{
                  color: "#a89060",
                  fontSize: "11px",
                  fontFamily: "'Georgia', serif",
                  fontStyle: "italic",
                }}
              >
                Unsaved changes
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saved || updateNotes.isPending}
              style={{
                background: saved
                  ? "rgba(201,168,76,0.1)"
                  : "linear-gradient(135deg, #8b6914, #c9a84c)",
                color: saved ? "#a89060" : "#1a1a2e",
                border: saved ? "1px solid rgba(201,168,76,0.2)" : "none",
                borderRadius: "6px",
                padding: "6px 16px",
                fontSize: "12px",
                fontFamily: "'Georgia', serif",
                fontWeight: "bold",
                cursor: saved ? "default" : "pointer",
                opacity: saved ? 0.6 : 1,
              }}
            >
              {updateNotes.isPending
                ? "Saving..."
                : saved
                  ? "Saved"
                  : "Save Notes"}
            </button>
          </div>
        </div>
        <textarea
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setSaved(false);
          }}
          placeholder="Record your adventures, track quest objectives, note important NPCs, or keep any other information you need..."
          style={{
            width: "100%",
            minHeight: "400px",
            padding: "16px",
            background: "rgba(30,15,5,0.9)",
            border: "1px solid rgba(201,168,76,0.4)",
            borderRadius: "8px",
            color: "#e8d5a3",
            fontSize: "14px",
            fontFamily: "'Georgia', 'Times New Roman', serif",
            lineHeight: "1.7",
            resize: "vertical",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        {updateNotes.error && (
          <p
            style={{
              color: "#e74c3c",
              fontSize: "12px",
              fontFamily: "'Georgia', serif",
              marginTop: "8px",
            }}
          >
            {updateNotes.error.message}
          </p>
        )}
      </div>

      {/* DM Notes section — shown when character is in an adventure */}
      {adventureId && (
        <DmNotesInCharacterView adventureId={adventureId} characterId={character.id} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// DM Notes in Character View (player sees DM notes + can react)
// ---------------------------------------------------------------------------

function DmNotesInCharacterView({ adventureId, characterId }: { adventureId: string; characterId: string }) {
  const utils = api.useUtils();

  const { data: dmNotes = [], isLoading } =
    api.adventure.getNotes.useQuery({ adventureId, characterId });

  const reactToNote = api.adventure.reactToNote.useMutation({
    onSuccess: () => {
      void utils.adventure.getNotes.invalidate({ adventureId, characterId });
      void utils.adventure.getUnreadNoteCount.invalidate();
    },
  });

  type DmNoteItem = {
    id: string;
    content: string;
    createdAt: string | Date;
    reaction: string | null;
    fromUser: { username: string };
  };

  const typedNotes = dmNotes as unknown as DmNoteItem[];

  const handleReact = (noteId: string, currentReaction: string | null, newReaction: "THUMBS_UP" | "THUMBS_DOWN") => {
    reactToNote.mutate({
      noteId,
      reaction: currentReaction === newReaction ? null : newReaction,
    });
  };

  return (
    <div
      style={{
        background: "rgba(0,0,0,0.5)",
        border: "1px solid rgba(201,168,76,0.3)",
        borderRadius: "12px",
        padding: "20px 24px",
      }}
    >
      <p
        style={{
          color: "#c9a84c",
          fontSize: "12px",
          fontWeight: "bold",
          letterSpacing: "2px",
          textTransform: "uppercase",
          fontFamily: "'Georgia', serif",
          margin: 0,
          marginBottom: "16px",
          paddingBottom: "8px",
          borderBottom: "1px solid rgba(201,168,76,0.2)",
        }}
      >
        DM Notes
      </p>

      {isLoading ? (
        <p style={{ color: "#a89060", fontSize: "13px", fontFamily: "'Georgia', serif" }}>
          Loading DM notes...
        </p>
      ) : typedNotes.length === 0 ? (
        <p style={{ color: "#a89060", fontSize: "13px", fontFamily: "'Georgia', serif", fontStyle: "italic" }}>
          No DM notes yet.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {typedNotes.map((note) => (
            <div
              key={note.id}
              style={{
                background: "rgba(201,168,76,0.05)",
                border: "1px solid rgba(201,168,76,0.15)",
                borderRadius: "8px",
                padding: "12px 16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "6px",
                }}
              >
                <span
                  style={{
                    color: "#a89060",
                    fontSize: "11px",
                    fontFamily: "'Georgia', serif",
                  }}
                >
                  {new Date(note.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p
                style={{
                  color: "#e8d5a3",
                  fontSize: "13px",
                  fontFamily: "'Georgia', serif",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  margin: "0 0 10px 0",
                }}
              >
                {note.content}
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => handleReact(note.id, note.reaction, "THUMBS_UP")}
                  disabled={reactToNote.isPending}
                  style={{
                    background: note.reaction === "THUMBS_UP" ? "rgba(201,168,76,0.2)" : "transparent",
                    border: "1px solid rgba(201,168,76,0.3)",
                    borderRadius: "4px",
                    padding: "4px 10px",
                    cursor: reactToNote.isPending ? "default" : "pointer",
                    fontSize: "14px",
                    opacity: reactToNote.isPending ? 0.5 : 1,
                  }}
                  title="Thumbs Up"
                >
                  {"\u{1F44D}"}
                </button>
                <button
                  onClick={() => handleReact(note.id, note.reaction, "THUMBS_DOWN")}
                  disabled={reactToNote.isPending}
                  style={{
                    background: note.reaction === "THUMBS_DOWN" ? "rgba(201,168,76,0.2)" : "transparent",
                    border: "1px solid rgba(201,168,76,0.3)",
                    borderRadius: "4px",
                    padding: "4px 10px",
                    cursor: reactToNote.isPending ? "default" : "pointer",
                    fontSize: "14px",
                    opacity: reactToNote.isPending ? 0.5 : 1,
                  }}
                  title="Thumbs Down"
                >
                  {"\u{1F44E}"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Equipment Summary (compact display in character header)
// ---------------------------------------------------------------------------

const EQUIP_SLOT_LABELS: Record<string, string> = {
  mainHand: "Main Hand",
  offHand: "Off Hand",
  armor: "Armor",
  shield: "Shield",
};

function EquipmentSummary({ character }: { character: CharacterData }) {
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
          fontFamily: "'Georgia', serif",
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
                  fontFamily: "'Georgia', serif",
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
                  fontFamily: "'Georgia', serif",
                }}
              >
                {name}
              </span>
              {/* Mastery badge */}
              {itemData?.mastery && itemData.mastery.length > 0 && (
                <span
                  title={itemData.mastery.map((m) => WEAPON_MASTERY_DESCRIPTIONS?.[m] ?? m).join(", ")}
                  style={{
                    color: "#88aaff",
                    fontSize: "9px",
                    fontFamily: "'Georgia', serif",
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
                  fontFamily: "'Georgia', serif",
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

// ---------------------------------------------------------------------------
// CharacterSheet (main component)
// ---------------------------------------------------------------------------

type TabId = "overview" | "features" | "actions" | "spells" | "notes" | "inventory";

function CharacterSheet({ character }: { character: CharacterData }) {
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

// ---------------------------------------------------------------------------
// Page-level data fetching
// ---------------------------------------------------------------------------

function CharacterDetailContent() {
  const router = useRouter();
  const { id } = router.query;
  const charId = typeof id === "string" ? id : "";

  const {
    data: character,
    isLoading,
    error,
  } = api.character.getById.useQuery({ id: charId }, { enabled: !!charId });

  if (isLoading || !charId) {
    return (
      <p
        style={{
          color: "#a89060",
          fontFamily: "'Georgia', serif",
          fontSize: "14px",
        }}
      >
        Summoning your adventurer...
      </p>
    );
  }

  if (error || !character) {
    return (
      <div
        style={{
          background: "rgba(139,42,30,0.2)",
          border: "1px solid #8b2a1e",
          borderRadius: "6px",
          padding: "16px 20px",
          color: "#e8d5a3",
          fontSize: "14px",
          fontFamily: "'Georgia', serif",
          maxWidth: "500px",
        }}
      >
        {error?.message ?? "Character not found."}
      </div>
    );
  }

  // Normalise the shape: Prisma may return these fields as null/undefined if
  // the migration hasn't run yet in dev, so we provide safe defaults.
  const normalized: CharacterData = {
    ...character,
    subclass: (character as CharacterData).subclass ?? null,
    spellSlotsUsed: (character as CharacterData).spellSlotsUsed ?? "[]",
    skillProficiencies: (character as CharacterData).skillProficiencies ?? "[]",
    preparedSpells: (character as CharacterData).preparedSpells ?? "[]",
    featureUses: (character as CharacterData).featureUses ?? "{}",
    activeConditions: (character as CharacterData).activeConditions ?? "[]",
    notes: (character as CharacterData).notes ?? "",
  };

  return (
    <>
      <Head>
        <title>{character.name} — DnD Tool</title>
      </Head>
      <CharacterSheet character={normalized} />
    </>
  );
}

export default function CharacterDetailPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <CharacterDetailContent />
      </Layout>
    </ProtectedRoute>
  );
}
