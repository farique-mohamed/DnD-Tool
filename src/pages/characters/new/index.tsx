import Head from "next/head";
import { useState, useCallback } from "react";
import { useRouter } from "next/router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { ThisIsYourLifeGenerator } from "@/components/ThisIsYourLifeGenerator";
import { api } from "@/utils/api";

const CHARACTER_CLASSES = [
  "Barbarian", "Bard", "Cleric", "Druid", "Fighter",
  "Monk", "Paladin", "Ranger", "Rogue", "Sorcerer", "Warlock", "Wizard",
];

const CHARACTER_RACES = [
  "Human", "Elf", "Dwarf", "Halfling", "Gnome",
  "Half-Elf", "Half-Orc", "Tiefling", "Dragonborn",
];

const ALIGNMENTS = [
  "Lawful Good", "Neutral Good", "Chaotic Good",
  "Lawful Neutral", "True Neutral", "Chaotic Neutral",
  "Lawful Evil", "Neutral Evil", "Chaotic Evil",
];

const labelStyle: React.CSSProperties = {
  display: "block",
  color: "#b8934a",
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: "8px",
  fontFamily: "'Georgia', serif",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  background: "rgba(30,15,5,0.9)",
  border: "1px solid rgba(201,168,76,0.4)",
  borderRadius: "6px",
  color: "#e8d5a3",
  fontSize: "14px",
  fontFamily: "'Georgia', 'Times New Roman', serif",
  outline: "none",
  boxSizing: "border-box",
};

const sectionTitleStyle: React.CSSProperties = {
  color: "#c9a84c",
  fontSize: "13px",
  fontWeight: "bold",
  letterSpacing: "1.5px",
  textTransform: "uppercase",
  marginBottom: "16px",
  paddingBottom: "8px",
  borderBottom: "1px solid rgba(201,168,76,0.2)",
};

function AbilityScoreInput({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: number;
  onChange: (name: string, value: number) => void;
}) {
  const modifier = Math.floor((value - 10) / 2);
  const modStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
      <span style={{ ...labelStyle, marginBottom: 0, textAlign: "center" }}>{label}</span>
      <input
        type="number"
        name={name}
        min={1}
        max={20}
        value={value}
        onChange={(e) => onChange(name, Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
        style={{ ...inputStyle, textAlign: "center", padding: "10px 8px", width: "70px" }}
      />
      <span style={{ color: "#a89060", fontSize: "12px", fontFamily: "'Georgia', serif" }}>
        {modStr}
      </span>
    </div>
  );
}

interface FormState {
  name: string;
  characterClass: string;
  race: string;
  level: number;
  alignment: string;
  backstory: string;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  maxHp: number;
  armorClass: number;
  speed: number;
}

function CreateCharacterContent() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    name: "",
    characterClass: "",
    race: "",
    level: 1,
    alignment: "True Neutral",
    backstory: "",
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    maxHp: 10,
    armorClass: 10,
    speed: 30,
  });
  const [error, setError] = useState<string | null>(null);

  const createCharacter = api.character.create.useMutation({
    onSuccess: () => {
      void router.push("/characters");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? (parseInt(value) || 0) : value,
    }));
  };

  const handleAbilityChange = (name: string, value: number) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUseBackstory = useCallback((text: string) => {
    setForm((prev) => ({
      ...prev,
      backstory: prev.backstory ? `${prev.backstory}\n\n${text}` : text,
    }));
    document.getElementById("backstory")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.characterClass || !form.race) return;
    createCharacter.mutate({
      name: form.name,
      characterClass: form.characterClass,
      race: form.race,
      level: form.level,
      alignment: form.alignment as Parameters<typeof createCharacter.mutate>[0]["alignment"],
      backstory: form.backstory || undefined,
      strength: form.strength,
      dexterity: form.dexterity,
      constitution: form.constitution,
      intelligence: form.intelligence,
      wisdom: form.wisdom,
      charisma: form.charisma,
      maxHp: form.maxHp,
      armorClass: form.armorClass,
      speed: form.speed,
    });
  };

  const isLoading = createCharacter.isPending;

  return (
    <>
      <Head>
        <title>Create Character — DnD Tool</title>
      </Head>
      <div style={{ maxWidth: "700px" }}>
        <h1 style={{ color: "#c9a84c", fontSize: "26px", fontWeight: "bold", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>
          Create New Character
        </h1>
        <p style={{ color: "#a89060", fontSize: "14px", marginBottom: "32px" }}>
          Breathe life into a new hero — or villain.
        </p>
        <div style={{ width: "80px", height: "2px", background: "#c9a84c", marginBottom: "32px", opacity: 0.6 }} />

        <form onSubmit={handleSubmit}>
          <div style={{
            background: "rgba(0,0,0,0.6)",
            border: "2px solid #c9a84c",
            borderRadius: "12px",
            boxShadow: "0 0 40px rgba(201,168,76,0.3), inset 0 0 60px rgba(0,0,0,0.5)",
            padding: "36px 32px",
            display: "flex",
            flexDirection: "column",
            gap: "28px",
          }}>

            {/* Basic Info */}
            <div>
              <p style={sectionTitleStyle}>Identity</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label htmlFor="name" style={labelStyle}>Character Name</label>
                  <input id="name" name="name" type="text" placeholder="Enter a name worthy of legend..." value={form.name} onChange={handleChange} style={inputStyle} required disabled={isLoading} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label htmlFor="race" style={labelStyle}>Race</label>
                    <select id="race" name="race" value={form.race} onChange={handleChange} style={{ ...inputStyle, cursor: "pointer" }} required disabled={isLoading}>
                      <option value="" disabled>Choose your lineage...</option>
                      {CHARACTER_RACES.map((r) => <option key={r} value={r} style={{ background: "#1a1a2e" }}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="characterClass" style={labelStyle}>Class</label>
                    <select id="characterClass" name="characterClass" value={form.characterClass} onChange={handleChange} style={{ ...inputStyle, cursor: "pointer" }} required disabled={isLoading}>
                      <option value="" disabled>Choose your calling...</option>
                      {CHARACTER_CLASSES.map((c) => <option key={c} value={c} style={{ background: "#1a1a2e" }}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label htmlFor="level" style={labelStyle}>Level</label>
                    <input id="level" name="level" type="number" min={1} max={20} value={form.level} onChange={handleChange} style={inputStyle} required disabled={isLoading} />
                  </div>
                  <div>
                    <label htmlFor="alignment" style={labelStyle}>Alignment</label>
                    <select id="alignment" name="alignment" value={form.alignment} onChange={handleChange} style={{ ...inputStyle, cursor: "pointer" }} disabled={isLoading}>
                      {ALIGNMENTS.map((a) => <option key={a} value={a} style={{ background: "#1a1a2e" }}>{a}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Ability Scores */}
            <div>
              <p style={sectionTitleStyle}>Ability Scores</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "12px" }}>
                {([
                  { label: "STR", name: "strength" },
                  { label: "DEX", name: "dexterity" },
                  { label: "CON", name: "constitution" },
                  { label: "INT", name: "intelligence" },
                  { label: "WIS", name: "wisdom" },
                  { label: "CHA", name: "charisma" },
                ] as const).map(({ label, name }) => (
                  <AbilityScoreInput key={name} label={label} name={name} value={form[name]} onChange={handleAbilityChange} />
                ))}
              </div>
            </div>

            {/* Combat Stats */}
            <div>
              <p style={sectionTitleStyle}>Combat</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                <div>
                  <label htmlFor="maxHp" style={labelStyle}>Max HP</label>
                  <input id="maxHp" name="maxHp" type="number" min={1} value={form.maxHp} onChange={handleChange} style={inputStyle} required disabled={isLoading} />
                </div>
                <div>
                  <label htmlFor="armorClass" style={labelStyle}>Armor Class</label>
                  <input id="armorClass" name="armorClass" type="number" min={1} max={30} value={form.armorClass} onChange={handleChange} style={inputStyle} required disabled={isLoading} />
                </div>
                <div>
                  <label htmlFor="speed" style={labelStyle}>Speed (ft)</label>
                  <input id="speed" name="speed" type="number" min={0} max={120} value={form.speed} onChange={handleChange} style={inputStyle} required disabled={isLoading} />
                </div>
              </div>
            </div>

            {/* Backstory */}
            <div>
              <p style={sectionTitleStyle}>Lore</p>
              <div>
                <label htmlFor="backstory" style={labelStyle}>Backstory</label>
                <textarea id="backstory" name="backstory" placeholder="Every hero has a tale... (optional)" value={form.backstory} onChange={handleChange} rows={5} style={{ ...inputStyle, resize: "vertical", minHeight: "100px" }} disabled={isLoading} />
              </div>
            </div>

            {error && (
              <div style={{ background: "rgba(139,42,30,0.2)", border: "1px solid #8b2a1e", borderRadius: "6px", padding: "12px 16px", color: "#e8d5a3", fontSize: "14px", fontFamily: "'Georgia', serif" }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", paddingTop: "8px" }}>
              <button type="button" onClick={() => void router.push("/characters")} disabled={isLoading} style={{ background: "transparent", border: "1px solid rgba(201,168,76,0.5)", color: "#c9a84c", borderRadius: "4px", padding: "10px 20px", fontFamily: "'Georgia', serif", fontSize: "13px", cursor: "pointer" }}>
                Cancel
              </button>
              <button type="submit" disabled={isLoading} style={{ background: "linear-gradient(135deg, #8b6914, #c9a84c)", color: "#1a1a2e", border: "none", borderRadius: "6px", padding: "12px 28px", fontSize: "14px", fontFamily: "'Georgia', serif", fontWeight: "bold", cursor: isLoading ? "not-allowed" : "pointer", opacity: isLoading ? 0.7 : 1, letterSpacing: "0.5px" }}>
                {isLoading ? "Forging your legend..." : "Begin the Legend"}
              </button>
            </div>
          </div>
        </form>

        <ThisIsYourLifeGenerator onUseBackstory={handleUseBackstory} />
      </div>
    </>
  );
}

export default function CreateCharacterPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <CreateCharacterContent />
      </Layout>
    </ProtectedRoute>
  );
}
