import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { api } from "@/utils/api";
import { getClassByName } from "@/lib/classData";
import type { FeatureEntry, FeatureDescription } from "@/lib/classData";
import { getSpellSlots, isSpellcaster, isWarlock } from "@/lib/spellSlotData";
import { getCharacterActions } from "@/lib/actionEconomy";
import type { ActionEntry } from "@/lib/actionEconomy";
import { SPELLS } from "@/lib/spellsData";

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
  Barbarian: 7, Bard: 5, Cleric: 5, Druid: 5, Fighter: 6, Monk: 5,
  Paladin: 6, Ranger: 6, Rogue: 5, Sorcerer: 4, Warlock: 5, Wizard: 4,
  Artificer: 5, Mystic: 5, Sidekick: 5,
};

const HIT_DIE_SIZE: Record<string, number> = {
  Barbarian: 12, Bard: 8, Cleric: 8, Druid: 8, Fighter: 10, Monk: 8,
  Paladin: 10, Ranger: 10, Rogue: 8, Sorcerer: 6, Warlock: 8, Wizard: 6,
  Artificer: 8, Mystic: 8, Sidekick: 8,
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
  spellSlotsUsed: string;
  skillProficiencies: string;  // JSON string[]
  preparedSpells: string;      // JSON string[]
  featureUses: string;         // JSON Record<string,number>
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
    if (!window.confirm("Take a long rest? This will fully restore HP, clear temp HP, and reset all spell slots.")) return;
    longRest.mutate({ id: character.id });
  };

  const handleShortRest = () => {
    const dice = parseInt(hitDiceToSpend);
    if (isNaN(dice) || dice < 1) return;
    const conMod = mod(character.constitution);
    const hitDieAvg = HIT_DIE_AVERAGE[character.characterClass] ?? 5;
    const hpRecovered = Math.max(0, (hitDieAvg + conMod) * dice);
    shortRest.mutate({ id: character.id, hpRecovered, isWarlock: isWarlock(character.characterClass) });
  };

  const conMod = mod(character.constitution);
  const hitDieAvg = HIT_DIE_AVERAGE[character.characterClass] ?? 5;
  const hitDieSize = HIT_DIE_SIZE[character.characterClass] ?? 8;
  const diceCount = parseInt(hitDiceToSpend) || 0;
  const previewHeal = Math.max(0, (hitDieAvg + conMod) * diceCount);

  const isLoading = updateHp.isPending;
  const hpPercent = Math.max(0, Math.min(100, (character.currentHp / character.maxHp) * 100));

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <span style={{ color: "#b8934a", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Georgia', serif" }}>
          Hit Points
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ color: "#e8d5a3", fontSize: "14px", fontFamily: "'Georgia', serif" }}>
            {character.currentHp} / {character.maxHp}
          </span>
          {character.tempHp > 0 && (
            <span style={{ color: "#5b9bd5", fontSize: "13px", fontFamily: "'Georgia', serif" }}>
              +{character.tempHp} temp
            </span>
          )}
        </div>
      </div>

      {/* HP bar */}
      <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "4px", height: "10px", overflow: "hidden", position: "relative", marginBottom: "16px" }}>
        <div style={{ width: `${hpPercent}%`, height: "100%", background: hpPercent > 50 ? "#4a7c2a" : hpPercent > 25 ? "#c9a84c" : "#e74c3c", borderRadius: "4px", transition: "width 0.3s", position: "absolute" }} />
        {character.tempHp > 0 && (
          <div style={{
            width: `${Math.min(100, (character.tempHp / character.maxHp) * 100)}%`,
            height: "100%",
            background: "rgba(91,155,213,0.5)",
            borderRadius: "4px",
            position: "absolute",
            right: 0,
          }} />
        )}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "flex-end" }}>
        {/* Damage */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ color: "#b8934a", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Georgia', serif" }}>Damage</span>
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
          <span style={{ color: "#b8934a", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Georgia', serif" }}>Heal</span>
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
          <span style={{ color: "#5b9bd5", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Georgia', serif" }}>Temp HP</span>
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
                cursor: isLoading || tempHpAmount === "" ? "not-allowed" : "pointer",
                opacity: isLoading || tempHpAmount === "" ? 0.6 : 1,
              }}
            >
              Set
            </button>
          </div>
        </div>
      </div>

      {/* Rest section */}
      <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid rgba(201,168,76,0.1)" }}>
        <span style={{ color: "#b8934a", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Georgia', serif" }}>Rest</span>
        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
          <button
            onClick={() => setShowShortRest(v => !v)}
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
          <div style={{
            marginTop: "12px",
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(201,168,76,0.25)",
            borderRadius: "8px",
            padding: "14px 16px",
          }}>
            <p style={{ color: "#b8934a", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Georgia', serif", marginBottom: "8px" }}>
              Short Rest — Spend Hit Dice
            </p>
            <p style={{ color: "#a89060", fontSize: "12px", fontFamily: "'Georgia', serif", marginBottom: "10px" }}>
              d{hitDieSize} + {conMod >= 0 ? `+${conMod}` : conMod} CON per die (avg {hitDieAvg + conMod} HP each)
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ color: "#e8d5a3", fontSize: "13px", fontFamily: "'Georgia', serif" }}>Hit dice to spend:</span>
              <input
                type="number"
                min={1}
                max={character.level}
                value={hitDiceToSpend}
                onChange={e => setHitDiceToSpend(e.target.value)}
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
                <span style={{ color: "#c9a84c", fontSize: "13px", fontFamily: "'Georgia', serif" }}>
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
                  cursor: shortRest.isPending || diceCount < 1 ? "not-allowed" : "pointer",
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

      {feedback && (
        <div style={{ marginTop: "10px", color: "#e74c3c", fontSize: "12px", fontFamily: "'Georgia', serif" }}>{feedback}</div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Level Up Modal
// ---------------------------------------------------------------------------

const SUBCLASS_UNLOCK_LEVELS: Record<string, number> = {
  Artificer: 3, Barbarian: 3, Bard: 3, Cleric: 1, Druid: 2,
  Fighter: 3, Monk: 3, Paladin: 3, Ranger: 3, Rogue: 3,
  Sorcerer: 1, Warlock: 1, Wizard: 2,
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

  const newLevel = character.level + 1;
  const subclassUnlockLevel = SUBCLASS_UNLOCK_LEVELS[character.characterClass] ?? 3;
  const shouldPickSubclass = newLevel >= subclassUnlockLevel && !character.subclass;

  const classInfo = getClassByName(character.characterClass);
  const subclassOptions = classInfo?.subclasses ?? [];

  const updateSubclass = api.character.updateSubclass.useMutation();

  const levelUp = api.character.levelUp.useMutation({
    onSuccess: async () => {
      await utils.character.getById.invalidate({ id: character.id });
      onClose();
    },
  });

  const handleConfirm = async () => {
    const hp = parseInt(newMaxHp);
    if (isNaN(hp) || hp < 1) return;
    if (shouldPickSubclass && subclassOptions.length > 0 && !selectedSubclass) {
      setSubclassError("Please choose a subclass before leveling up.");
      return;
    }
    if (shouldPickSubclass && selectedSubclass) {
      await updateSubclass.mutateAsync({ id: character.id, subclass: selectedSubclass });
    }
    levelUp.mutate({ id: character.id, newMaxHp: hp });
  };

  const isPending = levelUp.isPending || updateSubclass.isPending;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    }}>
      <div style={{
        background: "rgba(15,8,3,0.97)",
        border: "2px solid #c9a84c",
        borderRadius: "12px",
        padding: "32px 36px",
        maxWidth: "420px",
        width: "100%",
        boxShadow: "0 0 60px rgba(201,168,76,0.4)",
        maxHeight: "90vh",
        overflowY: "auto",
      }}>
        <h2 style={{ color: "#c9a84c", fontFamily: "'Georgia', serif", fontSize: "20px", fontWeight: "bold", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>
          Level Up
        </h2>
        <p style={{ color: "#a89060", fontFamily: "'Georgia', serif", fontSize: "13px", marginBottom: "24px" }}>
          {character.name} advances from level {character.level} to level {character.level + 1}.
        </p>

        {/* Subclass selection */}
        {shouldPickSubclass && subclassOptions.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <p style={{ color: "#b8934a", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Georgia', serif", marginBottom: "8px" }}>
              Choose Your {classInfo?.subclassTitle ?? "Subclass"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "200px", overflowY: "auto" }}>
              {subclassOptions.map(sub => (
                <button
                  key={sub.name}
                  onClick={() => { setSelectedSubclass(sub.name); setSubclassError(""); }}
                  style={{
                    background: selectedSubclass === sub.name ? "rgba(201,168,76,0.15)" : "transparent",
                    border: selectedSubclass === sub.name ? "1px solid #c9a84c" : "1px solid rgba(201,168,76,0.25)",
                    borderRadius: "6px",
                    padding: "8px 14px",
                    color: selectedSubclass === sub.name ? "#c9a84c" : "#e8d5a3",
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
              <p style={{ color: "#e74c3c", fontSize: "12px", fontFamily: "'Georgia', serif", marginTop: "6px" }}>
                {subclassError}
              </p>
            )}
          </div>
        )}

        <div style={{ marginBottom: "20px" }}>
          <p style={{ color: "#b8934a", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Georgia', serif", marginBottom: "6px" }}>
            New Maximum HP
          </p>
          <p style={{ color: "#a89060", fontSize: "12px", fontFamily: "'Georgia', serif", marginBottom: "10px" }}>
            Suggested: {character.maxHp} + {hitDieAvg} (avg die) + {conMod >= 0 ? `+${conMod}` : conMod} (CON) = {suggestedHp}
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
          <p style={{ color: "#e74c3c", fontSize: "12px", fontFamily: "'Georgia', serif", marginTop: "12px" }}>
            {levelUp.error.message}
          </p>
        )}
        {updateSubclass.error && (
          <p style={{ color: "#e74c3c", fontSize: "12px", fontFamily: "'Georgia', serif", marginTop: "12px" }}>
            {updateSubclass.error.message}
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Feature description renderer
// ---------------------------------------------------------------------------

function RenderFeatureEntry({ entry, depth = 0 }: { entry: FeatureEntry; depth?: number }) {
  if (entry.type === "text") {
    return (
      <p style={{ color: "#e8d5a3", fontSize: "13px", fontFamily: "'Georgia', serif", lineHeight: 1.7, marginBottom: "6px" }}>
        {entry.text}
      </p>
    );
  }

  if (entry.type === "list") {
    return (
      <ul style={{ color: "#e8d5a3", fontSize: "13px", fontFamily: "'Georgia', serif", lineHeight: 1.7, paddingLeft: "20px", marginBottom: "6px" }}>
        {(entry.items ?? []).map((item, i) => (
          <li key={i} style={{ marginBottom: "3px" }}>{item}</li>
        ))}
      </ul>
    );
  }

  if (entry.type === "section") {
    return (
      <div style={{ marginBottom: "8px" }}>
        {entry.name && (
          <p style={{ color: "#c9a84c", fontSize: "12px", fontWeight: "bold", fontFamily: "'Georgia', serif", marginBottom: "4px", letterSpacing: "0.5px" }}>
            {entry.name}
          </p>
        )}
        {(entry.children ?? []).map((child, i) => (
          <RenderFeatureEntry key={i} entry={child} depth={depth + 1} />
        ))}
      </div>
    );
  }

  if (entry.type === "inset") {
    return (
      <div style={{
        background: "rgba(201,168,76,0.05)",
        border: "1px solid rgba(201,168,76,0.2)",
        borderRadius: "6px",
        padding: "12px 16px",
        marginBottom: "8px",
      }}>
        {entry.name && (
          <p style={{ color: "#c9a84c", fontSize: "11px", fontWeight: "bold", fontFamily: "'Georgia', serif", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>
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
  "Rage": { maxUses: (level) => level < 3 ? 2 : level < 6 ? 3 : level < 12 ? 4 : level < 17 ? 5 : level < 20 ? 6 : Infinity, recharge: "long" },
  "Second Wind": { maxUses: () => 1, recharge: "short" },
  "Action Surge": { maxUses: (level) => level < 17 ? 1 : 2, recharge: "short" },
  "Indomitable": { maxUses: (level) => level < 13 ? 1 : level < 17 ? 2 : 3, recharge: "long" },
  "Channel Divinity": { maxUses: (level) => level < 6 ? 1 : level < 18 ? 2 : 3, recharge: "short" },
  "Wild Shape": { maxUses: () => 2, recharge: "short" },
  "Lay on Hands": { maxUses: (level) => level * 5, recharge: "long" },
  "Divine Sense": { maxUses: (_level, abs) => 1 + Math.max(0, Math.floor(((abs.charisma ?? 10) - 10) / 2)), recharge: "long" },
  "Bardic Inspiration": { maxUses: (_level, abs) => Math.max(1, Math.floor(((abs.charisma ?? 10) - 10) / 2)), recharge: "long" },
  "Arcane Recovery": { maxUses: () => 1, recharge: "long" },
};

// ---------------------------------------------------------------------------
// Class Features Tab
// ---------------------------------------------------------------------------

function ClassFeaturesTab({ character }: { character: CharacterData }) {
  const utils = api.useUtils();
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const [localFeatureUses, setLocalFeatureUses] = useState<Record<string, number>>(() => {
    try { return JSON.parse(character.featureUses || "{}") as Record<string, number>; }
    catch { return {}; }
  });

  const updateFeatureUses = api.character.updateFeatureUses.useMutation({
    onSuccess: async () => { await utils.character.getById.invalidate({ id: character.id }); },
  });

  const classInfo = getClassByName(character.characterClass);

  if (!classInfo) {
    return (
      <div style={{ color: "#a89060", fontFamily: "'Georgia', serif", fontSize: "14px", padding: "20px 0" }}>
        Class data not available for {character.characterClass}.
      </div>
    );
  }

  const toggleKey = (key: string) => {
    setExpandedKeys(prev => {
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

  const toggleFeatureUse = (featName: string, slotIdx: number, currentUsed: number, maxUses: number) => {
    const newUsed = slotIdx < currentUsed ? currentUsed - 1 : Math.min(currentUsed + 1, maxUses);
    const next = { ...localFeatureUses, [featName]: newUsed };
    setLocalFeatureUses(next);
    updateFeatureUses.mutate({ id: character.id, featureUses: next });
  };

  const handlePoolChange = (featName: string, newUsed: number, maxUses: number) => {
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

  const levels = Object.keys(featuresByLevel)
    .map(Number)
    .sort((a, b) => a - b);

  const findDescription = (featureName: string, level: number): FeatureDescription | undefined => {
    return classInfo.featureDescriptions.find(
      d => d.name === featureName && d.level === level
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
      {levels.map(level => (
        <div key={level} style={{ marginBottom: "24px" }}>
          <p style={sectionTitle}>Level {level}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {featuresByLevel[level]!.map((feat) => {
              const key = `${feat.featureName}-${feat.level}`;
              const isExpanded = expandedKeys.has(key);
              const desc = findDescription(feat.featureName, feat.level);
              const isSubclass = feat.isSubclassFeature;
              const usageConfig = FEATURE_USAGE_CONFIG[feat.featureName];
              const maxUses = usageConfig ? usageConfig.maxUses(character.level, abilityScoresForFeature) : 0;
              const usedCount = localFeatureUses[feat.featureName] ?? 0;
              const showUsage = !!usageConfig && maxUses > 0;
              const usePool = showUsage && !isFinite(maxUses) === false && maxUses > 20;

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
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span style={{ color: "#e8d5a3", fontSize: "14px", fontWeight: "bold", fontFamily: "'Georgia', serif", flex: 1 }}>
                      {feat.featureName}
                    </span>
                    <span style={{
                      fontSize: "10px",
                      padding: "2px 8px",
                      borderRadius: "10px",
                      fontFamily: "'Georgia', serif",
                      letterSpacing: "0.5px",
                      background: isSubclass ? "rgba(168,144,96,0.15)" : "rgba(201,168,76,0.12)",
                      border: isSubclass ? "1px solid rgba(168,144,96,0.3)" : "1px solid rgba(201,168,76,0.25)",
                      color: isSubclass ? "#a89060" : "#c9a84c",
                    }}>
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
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                      <span style={{ color: "#b8934a", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'Georgia', serif" }}>
                        Uses:
                      </span>
                      {usePool ? (
                        // Pool-style (e.g. Lay on Hands): show number input
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <input
                            type="number"
                            min={0}
                            max={maxUses}
                            value={usedCount}
                            onChange={e => handlePoolChange(feat.featureName, parseInt(e.target.value) || 0, maxUses)}
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
                          <span style={{ color: "#a89060", fontSize: "12px", fontFamily: "'Georgia', serif" }}>
                            / {maxUses} used
                          </span>
                        </div>
                      ) : (
                        // Pip-style
                        Array.from({ length: maxUses }, (_, j) => (
                          <button
                            key={j}
                            onClick={() => toggleFeatureUse(feat.featureName, j, usedCount, maxUses)}
                            style={{
                              background: j < usedCount ? "rgba(201,168,76,0.4)" : "transparent",
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
                      <span style={{
                        fontSize: "10px",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        background: usageConfig.recharge === "short" ? "rgba(91,155,213,0.12)" : "rgba(74,124,42,0.12)",
                        border: `1px solid ${usageConfig.recharge === "short" ? "rgba(91,155,213,0.3)" : "rgba(74,124,42,0.3)"}`,
                        color: usageConfig.recharge === "short" ? "#5b9bd5" : "#4a7c2a",
                        fontFamily: "'Georgia', serif",
                      }}>
                        {usageConfig.recharge === "short" ? "Short Rest" : "Long Rest"}
                      </span>
                      {!usePool && (
                        <span style={{ color: "#a89060", fontSize: "12px", fontFamily: "'Georgia', serif" }}>
                          {maxUses - usedCount} / {maxUses} remaining
                        </span>
                      )}
                    </div>
                  )}

                  {isExpanded && desc && (
                    <div style={{ marginTop: "12px", borderTop: "1px solid rgba(201,168,76,0.1)", paddingTop: "12px" }}>
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

const ACTION_COST_ORDER = ["Action", "Bonus Action", "Reaction", "No Action", "Special"] as const;

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
  const actions = getCharacterActions(character.characterClass, character.level);

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
      {ACTION_COST_ORDER.map(cost => {
        const group = grouped[cost] ?? [];
        if (group.length === 0) return null;
        return (
          <div key={cost} style={{ marginBottom: "28px" }}>
            <p style={sectionTitle}>{cost}s</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
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
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
                    <span style={{ color: "#e8d5a3", fontSize: "14px", fontWeight: "bold", fontFamily: "'Georgia', serif", flex: 1 }}>
                      {action.name}
                    </span>
                    <span style={{
                      fontSize: "10px",
                      padding: "2px 10px",
                      borderRadius: "10px",
                      fontFamily: "'Georgia', serif",
                      letterSpacing: "0.5px",
                      ...costBadgeStyle(action.cost),
                    }}>
                      {action.cost}
                    </span>
                  </div>
                  {action.feature && (
                    <p style={{ color: "#a89060", fontSize: "11px", fontFamily: "'Georgia', serif", fontStyle: "italic", marginBottom: "4px" }}>
                      {action.feature}
                    </p>
                  )}
                  <p style={{ color: "#e8d5a3", fontSize: "13px", fontFamily: "'Georgia', serif", lineHeight: 1.6 }}>
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
  Artificer: "intelligence", Bard: "charisma", Cleric: "wisdom",
  Druid: "wisdom", Paladin: "charisma", Ranger: "wisdom",
  Sorcerer: "charisma", Warlock: "charisma", Wizard: "intelligence",
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
    Array.from({ length: 9 }, (_, i) => usedRaw[i] ?? 0)
  );

  // Prepared spells state
  const [localPrepared, setLocalPrepared] = useState<string[]>(() => {
    try { return JSON.parse(character.preparedSpells || "[]") as string[]; }
    catch { return []; }
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
    onSuccess: async () => { await utils.character.getById.invalidate({ id: character.id }); },
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
  const spellAbility = SPELLCASTING_ABILITY[character.characterClass] ?? "intelligence";
  const abilityScores: Record<string, number> = {
    strength: character.strength, dexterity: character.dexterity,
    constitution: character.constitution, intelligence: character.intelligence,
    wisdom: character.wisdom, charisma: character.charisma,
  };
  const spellAbilityMod = mod(abilityScores[spellAbility] ?? 10);
  const preparedMax = isPreparedCaster
    ? Math.max(1, character.characterClass === "Artificer"
        ? spellAbilityMod + Math.floor(character.level / 2)
        : spellAbilityMod + character.level)
    : null;

  // Filter spells for this class
  const classSpells = SPELLS.filter(s =>
    s.classes.map(c => c.toLowerCase()).includes(character.characterClass.toLowerCase())
  );

  const filteredSpells = classSpells.filter(s => {
    const matchesSearch = !spellSearch || s.name.toLowerCase().includes(spellSearch.toLowerCase());
    const matchesLevel = spellLevelFilter === null || s.level === spellLevelFilter;
    return matchesSearch && matchesLevel;
  });

  const toggleSpell = (spellName: string) => {
    const next = localPrepared.includes(spellName)
      ? localPrepared.filter(s => s !== spellName)
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
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

        <div style={{
          background: "rgba(0,0,0,0.5)",
          border: "1px solid rgba(201,168,76,0.3)",
          borderRadius: "10px",
          padding: "18px 20px",
        }}>
          <p style={{ color: "#a89060", fontSize: "12px", fontFamily: "'Georgia', serif", marginBottom: "12px" }}>
            {pactCount} slot{pactCount !== 1 ? "s" : ""} at spell level {pactLevel} — recharges on short or long rest
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ color: "#b8934a", fontSize: "12px", fontFamily: "'Georgia', serif", minWidth: "120px" }}>
              Pact Slots (Lv {pactLevel})
            </span>
            <div style={{ display: "flex", gap: "6px" }}>
              {Array.from({ length: pactCount }, (_, j) => (
                <button
                  key={j}
                  onClick={() => toggleSlot(0, j)}
                  title={j < usedCount ? "Click to restore" : "Click to use"}
                  style={{
                    background: j < usedCount ? "rgba(201,168,76,0.4)" : "transparent",
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
            <span style={{ color: "#a89060", fontSize: "12px", fontFamily: "'Georgia', serif" }}>
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
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
          const levelOrdinals = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th"];
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
              <span style={{ color: "#b8934a", fontSize: "12px", fontFamily: "'Georgia', serif", minWidth: "100px", fontWeight: "bold" }}>
                {levelOrdinals[i]} Level
              </span>
              <div style={{ display: "flex", gap: "6px" }}>
                {Array.from({ length: count }, (_, j) => (
                  <button
                    key={j}
                    onClick={() => toggleSlot(i, j)}
                    title={j < usedCount ? "Click to restore" : "Click to use"}
                    style={{
                      background: j < usedCount ? "rgba(201,168,76,0.4)" : "transparent",
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
              <span style={{ color: "#a89060", fontSize: "12px", fontFamily: "'Georgia', serif" }}>
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
  return (
    <div>
      <div style={{ height: "1px", background: "rgba(201,168,76,0.15)", margin: "24px 0" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div>
          <p style={{ color: "#c9a84c", fontSize: "12px", fontWeight: "bold", letterSpacing: "2px", textTransform: "uppercase", fontFamily: "'Georgia', serif" }}>
            {isPreparedCaster ? "Prepared Spells" : "Known Spells"}
          </p>
          {preparedMax !== null && (
            <p style={{ color: "#a89060", fontSize: "12px", fontFamily: "'Georgia', serif", marginTop: "4px" }}>
              {localPrepared.length} / {preparedMax} prepared
            </p>
          )}
        </div>
        <button
          onClick={() => setBrowseMode(v => !v)}
          style={{
            background: browseMode ? "linear-gradient(135deg, #8b6914, #c9a84c)" : "transparent",
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
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Search spells..."
              value={spellSearch}
              onChange={e => setSpellSearch(e.target.value)}
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
              onChange={e => setSpellLevelFilter(e.target.value === "" ? null : Number(e.target.value))}
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
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(l => (
                <option key={l} value={l}>{l === 0 ? "Cantrip" : `Level ${l}`}</option>
              ))}
            </select>
          </div>
          <div style={{ maxHeight: "400px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
            {filteredSpells.slice(0, 200).map(spell => {
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
                    background: isPrepared ? "rgba(201,168,76,0.1)" : "rgba(0,0,0,0.3)",
                    border: isPrepared ? "1px solid rgba(201,168,76,0.35)" : "1px solid transparent",
                  }}
                >
                  <span style={{ color: isPrepared ? "#c9a84c" : "#a89060", fontSize: "14px" }}>
                    {isPrepared ? "●" : "○"}
                  </span>
                  <span style={{ color: "#e8d5a3", fontSize: "13px", fontFamily: "'Georgia', serif", flex: 1 }}>
                    {spell.name}
                  </span>
                  <span style={{
                    fontSize: "10px",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    background: "rgba(201,168,76,0.12)",
                    border: "1px solid rgba(201,168,76,0.25)",
                    color: "#c9a84c",
                    fontFamily: "'Georgia', serif",
                  }}>
                    {spell.level === 0 ? "C" : spell.level}
                  </span>
                  <span style={{ color: "#a89060", fontSize: "11px", fontFamily: "'Georgia', serif", minWidth: "60px", textAlign: "right" }}>
                    {spell.school}
                  </span>
                </div>
              );
            })}
            {filteredSpells.length > 200 && (
              <p style={{ color: "#a89060", fontSize: "12px", fontFamily: "'Georgia', serif", textAlign: "center", padding: "8px" }}>
                Showing 200 of {filteredSpells.length} — use search to filter
              </p>
            )}
          </div>
        </div>
      ) : (
        localPrepared.length === 0 ? (
          <p style={{ color: "#a89060", fontSize: "13px", fontFamily: "'Georgia', serif", fontStyle: "italic", padding: "16px 0" }}>
            No spells prepared. Click &quot;Manage Spells&quot; to add some.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {localPrepared.map(spellName => {
              const spellData = SPELLS.find(s => s.name === spellName);
              return (
                <div key={spellName} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid rgba(201,168,76,0.2)",
                }}>
                  <span style={{ color: "#e8d5a3", fontSize: "13px", fontFamily: "'Georgia', serif", flex: 1 }}>
                    {spellName}
                  </span>
                  {spellData && (
                    <>
                      <span style={{
                        fontSize: "10px",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background: "rgba(201,168,76,0.12)",
                        border: "1px solid rgba(201,168,76,0.25)",
                        color: "#c9a84c",
                        fontFamily: "'Georgia', serif",
                      }}>
                        {spellData.level === 0 ? "Cantrip" : `Lv ${spellData.level}`}
                      </span>
                      <span style={{ color: "#a89060", fontSize: "11px", fontFamily: "'Georgia', serif" }}>
                        {spellData.school}
                      </span>
                    </>
                  )}
                  <button
                    onClick={() => toggleSpell(spellName)}
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
        )
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview Tab (existing content)
// ---------------------------------------------------------------------------

function OverviewTab({ character }: { character: CharacterData }) {
  const utils = api.useUtils();
  const prof = proficiencyBonus(character.level);
  const savingProfs = SAVING_THROW_PROFICIENCIES[character.characterClass] ?? [];

  const abilityScores: Record<string, number> = {
    strength: character.strength,
    dexterity: character.dexterity,
    constitution: character.constitution,
    intelligence: character.intelligence,
    wisdom: character.wisdom,
    charisma: character.charisma,
  };

  // Skill proficiencies (optimistic local state)
  const [localProficientSkills, setLocalProficientSkills] = useState<string[]>(() => {
    try { return JSON.parse(character.skillProficiencies || "[]") as string[]; }
    catch { return []; }
  });

  const updateSkillProficiencies = api.character.updateSkillProficiencies.useMutation({
    onSuccess: async () => { await utils.character.getById.invalidate({ id: character.id }); },
  });

  const toggleSkillProficiency = (skillName: string) => {
    const newList = localProficientSkills.includes(skillName)
      ? localProficientSkills.filter(s => s !== skillName)
      : [...localProficientSkills, skillName];
    setLocalProficientSkills(newList);
    updateSkillProficiencies.mutate({ id: character.id, skillProficiencies: newList });
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Ability Scores */}
          <div style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "12px", padding: "20px 24px" }}>
            <p style={sectionTitle}>Ability Scores</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              {ABILITY_NAMES.map(({ key, label }) => (
                <div key={key} style={{ textAlign: "center", background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px", padding: "12px 8px" }}>
                  <div style={{ color: "#b8934a", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Georgia', serif", marginBottom: "6px" }}>{label}</div>
                  <div style={{ color: "#e8d5a3", fontSize: "22px", fontWeight: "bold", fontFamily: "'Georgia', serif", lineHeight: 1 }}>{abilityScores[key]}</div>
                  <div style={{ color: "#a89060", fontSize: "13px", fontFamily: "'Georgia', serif", marginTop: "4px" }}>{modStr(abilityScores[key]!)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Saving Throws */}
          <div style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "12px", padding: "20px 24px" }}>
            <p style={sectionTitle}>Saving Throws</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {ABILITY_NAMES.map(({ key, label }) => {
                const isProficient = savingProfs.includes(key);
                const total = mod(abilityScores[key]!) + (isProficient ? prof : 0);
                const totalStr = total >= 0 ? `+${total}` : `${total}`;
                return (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ color: isProficient ? "#c9a84c" : "#a89060", fontSize: "12px" }}>{isProficient ? "●" : "○"}</span>
                    <span style={{ color: "#e8d5a3", fontSize: "13px", fontFamily: "'Georgia', serif", flex: 1 }}>{label}</span>
                    <span style={{ color: "#e8d5a3", fontSize: "13px", fontFamily: "'Georgia', serif", fontWeight: isProficient ? "bold" : "normal" }}>{totalStr}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: Skills */}
        <div style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "12px", padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", paddingBottom: "8px", borderBottom: "1px solid rgba(201,168,76,0.2)" }}>
            <p style={{ ...sectionTitle, marginBottom: 0, paddingBottom: 0, borderBottom: "none" }}>Skills</p>
            <span style={{ color: "#a89060", fontSize: "11px", fontFamily: "'Georgia', serif", fontStyle: "italic" }}>click to toggle prof.</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            {SKILLS.map(({ name, ability }) => {
              const score = abilityScores[ability] ?? 10;
              const baseMod = mod(score);
              const isProficient = localProficientSkills.includes(name);
              const total = isProficient ? baseMod + prof : baseMod;
              const skillStr = total >= 0 ? `+${total}` : `${total}`;
              const abilityLabel = ABILITY_NAMES.find(a => a.key === ability)?.label ?? "";
              return (
                <div
                  key={name}
                  onClick={() => toggleSkillProficiency(name)}
                  style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", borderRadius: "4px", padding: "2px 4px" }}
                >
                  <span style={{ color: isProficient ? "#c9a84c" : "#a89060", fontSize: "12px" }}>
                    {isProficient ? "●" : "○"}
                  </span>
                  <span style={{
                    color: "#e8d5a3",
                    fontSize: "13px",
                    fontFamily: "'Georgia', serif",
                    flex: 1,
                    fontWeight: isProficient ? "bold" : "normal",
                  }}>
                    {name}
                  </span>
                  <span style={{ color: "#a89060", fontSize: "11px", fontFamily: "'Georgia', serif" }}>({abilityLabel})</span>
                  <span style={{
                    color: isProficient ? "#c9a84c" : "#e8d5a3",
                    fontSize: "13px",
                    fontFamily: "'Georgia', serif",
                    fontWeight: isProficient ? "bold" : "normal",
                  }}>
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
        <div style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "12px", padding: "20px 24px", marginTop: "20px" }}>
          <p style={sectionTitle}>Backstory</p>
          <p style={{ color: "#e8d5a3", fontSize: "14px", fontFamily: "'Georgia', serif", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
            {character.backstory}
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CharacterSheet (main component)
// ---------------------------------------------------------------------------

type TabId = "overview" | "features" | "actions" | "spells";

function CharacterSheet({ character }: { character: CharacterData }) {
  const router = useRouter();
  const prof = proficiencyBonus(character.level);
  const initiative = mod(character.dexterity);
  const passivePerception = 10 + mod(character.wisdom);

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [showLevelUp, setShowLevelUp] = useState(false);

  const spellcaster = isSpellcaster(character.characterClass);

  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "features", label: "Class Features" },
    { id: "actions", label: "Actions" },
    ...(spellcaster ? [{ id: "spells" as TabId, label: "Spells" }] : []),
  ];

  return (
    <div style={{ maxWidth: "860px" }}>
      {/* Back */}
      <button
        onClick={() => void router.push("/characters")}
        style={{ background: "transparent", border: "none", color: "#a89060", fontFamily: "'Georgia', serif", fontSize: "13px", cursor: "pointer", marginBottom: "24px", padding: 0, letterSpacing: "0.3px" }}
      >
        ← Back to Characters
      </button>

      {/* Header */}
      <div style={{ background: "rgba(0,0,0,0.6)", border: "2px solid #c9a84c", borderRadius: "12px", boxShadow: "0 0 40px rgba(201,168,76,0.3), inset 0 0 60px rgba(0,0,0,0.5)", padding: "28px 32px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
              <h1 style={{ color: "#c9a84c", fontSize: "28px", fontWeight: "bold", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "0", fontFamily: "'Georgia', serif" }}>
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
            <p style={{ color: "#a89060", fontSize: "14px", fontFamily: "'Georgia', serif", marginTop: "6px" }}>
              Level {character.level} {character.race} {character.characterClass}
              {character.subclass ? ` — ${character.subclass}` : ""}
            </p>
            <p style={{ color: "#a89060", fontSize: "12px", marginTop: "2px", fontFamily: "'Georgia', serif" }}>{character.alignment}</p>
          </div>
          {/* Combat quick stats */}
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            {[
              { label: "AC", value: character.armorClass },
              { label: "Speed", value: `${character.speed}ft` },
              { label: "Initiative", value: initiative >= 0 ? `+${initiative}` : `${initiative}` },
              { label: "Prof. Bonus", value: `+${prof}` },
              { label: "Passive Perc.", value: passivePerception },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ color: "#b8934a", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Georgia', serif", marginBottom: "4px" }}>{label}</div>
                <div style={{ color: "#e8d5a3", fontSize: "20px", fontWeight: "bold", fontFamily: "'Georgia', serif" }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        <HpManager character={character} />
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "8px 20px",
              borderRadius: "6px",
              border: activeTab === tab.id ? "none" : "1px solid rgba(201,168,76,0.4)",
              background: activeTab === tab.id ? "linear-gradient(135deg, #8b6914, #c9a84c)" : "transparent",
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
      {activeTab === "spells" && spellcaster && <SpellsTab character={character} />}

      {/* Level Up Modal */}
      {showLevelUp && (
        <LevelUpPanel character={character} onClose={() => setShowLevelUp(false)} />
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

  const { data: character, isLoading, error } = api.character.getById.useQuery(
    { id: charId },
    { enabled: !!charId }
  );

  if (isLoading || !charId) {
    return (
      <p style={{ color: "#a89060", fontFamily: "'Georgia', serif", fontSize: "14px" }}>
        Summoning your adventurer...
      </p>
    );
  }

  if (error || !character) {
    return (
      <div style={{ background: "rgba(139,42,30,0.2)", border: "1px solid #8b2a1e", borderRadius: "6px", padding: "16px 20px", color: "#e8d5a3", fontSize: "14px", fontFamily: "'Georgia', serif", maxWidth: "500px" }}>
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
