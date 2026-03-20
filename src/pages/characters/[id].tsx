import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { api } from "@/utils/api";

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
};

function HpManager({ character }: { character: CharacterData }) {
  const utils = api.useUtils();
  const [damageAmount, setDamageAmount] = useState<string>("");
  const [healAmount, setHealAmount] = useState<string>("");
  const [tempHpAmount, setTempHpAmount] = useState<string>("");
  const [feedback, setFeedback] = useState<string | null>(null);

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

      {/* HP bar — stacked: currentHp green, tempHp blue overlay */}
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

      {feedback && (
        <div style={{ marginTop: "10px", color: "#e74c3c", fontSize: "12px", fontFamily: "'Georgia', serif" }}>{feedback}</div>
      )}
    </div>
  );
}

function CharacterSheet({ character }: { character: CharacterData }) {
  const router = useRouter();
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

  const initiative = mod(character.dexterity);
  const passivePerception = 10 + mod(character.wisdom);

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
            <h1 style={{ color: "#c9a84c", fontSize: "28px", fontWeight: "bold", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "6px", fontFamily: "'Georgia', serif" }}>
              {character.name}
            </h1>
            <p style={{ color: "#a89060", fontSize: "14px", fontFamily: "'Georgia', serif" }}>
              Level {character.level} {character.race} {character.characterClass}
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
          <p style={sectionTitle}>Skills</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            {SKILLS.map(({ name, ability }) => {
              const score = abilityScores[ability] ?? 10;
              const skillMod = mod(score);
              const skillStr = skillMod >= 0 ? `+${skillMod}` : `${skillMod}`;
              const abilityLabel = ABILITY_NAMES.find(a => a.key === ability)?.label ?? "";
              return (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ color: "#a89060", fontSize: "12px" }}>○</span>
                  <span style={{ color: "#e8d5a3", fontSize: "13px", fontFamily: "'Georgia', serif", flex: 1 }}>{name}</span>
                  <span style={{ color: "#a89060", fontSize: "11px", fontFamily: "'Georgia', serif" }}>({abilityLabel})</span>
                  <span style={{ color: "#e8d5a3", fontSize: "13px", fontFamily: "'Georgia', serif" }}>{skillStr}</span>
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

  return (
    <>
      <Head>
        <title>{character.name} — DnD Tool</title>
      </Head>
      <CharacterSheet character={character} />
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
