import Head from "next/head";
import { useState } from "react";
import { useRouter } from "next/router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";

const CHARACTER_CLASSES = [
  "Barbarian",
  "Bard",
  "Cleric",
  "Druid",
  "Fighter",
  "Monk",
  "Paladin",
  "Ranger",
  "Rogue",
  "Sorcerer",
  "Warlock",
  "Wizard",
];

const CHARACTER_RACES = [
  "Human",
  "Elf",
  "Dwarf",
  "Halfling",
  "Gnome",
  "Half-Elf",
  "Half-Orc",
  "Tiefling",
  "Dragonborn",
];

interface CharacterFormState {
  name: string;
  characterClass: string;
  race: string;
  backstory: string;
}

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

function CreateCharacterContent() {
  const router = useRouter();
  const [form, setForm] = useState<CharacterFormState>({
    name: "",
    characterClass: "",
    race: "",
    backstory: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire to tRPC mutation when character model is ready
    void router.push("/characters");
  };

  return (
    <>
      <Head>
        <title>Create Character — DnD Tool</title>
      </Head>
      <div style={{ maxWidth: "600px" }}>
        <h1
          style={{
            color: "#c9a84c",
            fontSize: "26px",
            fontWeight: "bold",
            letterSpacing: "2px",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}
        >
          Create New Character
        </h1>
        <p style={{ color: "#a89060", fontSize: "14px", marginBottom: "32px" }}>
          Breathe life into a new hero — or villain.
        </p>
        <div
          style={{
            width: "80px",
            height: "2px",
            background: "#c9a84c",
            marginBottom: "32px",
            opacity: 0.6,
          }}
        />

        <form onSubmit={handleSubmit}>
          <div
            style={{
              background: "rgba(0,0,0,0.6)",
              border: "2px solid #c9a84c",
              borderRadius: "12px",
              boxShadow:
                "0 0 40px rgba(201,168,76,0.3), inset 0 0 60px rgba(0,0,0,0.5)",
              padding: "36px 32px",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
          >
            {/* Character Name */}
            <div>
              <label htmlFor="name" style={labelStyle}>
                Character Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Enter a name worthy of legend..."
                value={form.name}
                onChange={handleChange}
                style={inputStyle}
                required
              />
            </div>

            {/* Race */}
            <div>
              <label htmlFor="race" style={labelStyle}>
                Race
              </label>
              <select
                id="race"
                name="race"
                value={form.race}
                onChange={handleChange}
                style={{ ...inputStyle, cursor: "pointer" }}
                required
              >
                <option value="" disabled>
                  Choose your lineage...
                </option>
                {CHARACTER_RACES.map((r) => (
                  <option key={r} value={r} style={{ background: "#1a1a2e" }}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Class */}
            <div>
              <label htmlFor="characterClass" style={labelStyle}>
                Class
              </label>
              <select
                id="characterClass"
                name="characterClass"
                value={form.characterClass}
                onChange={handleChange}
                style={{ ...inputStyle, cursor: "pointer" }}
                required
              >
                <option value="" disabled>
                  Choose your calling...
                </option>
                {CHARACTER_CLASSES.map((c) => (
                  <option key={c} value={c} style={{ background: "#1a1a2e" }}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Backstory */}
            <div>
              <label htmlFor="backstory" style={labelStyle}>
                Backstory
              </label>
              <textarea
                id="backstory"
                name="backstory"
                placeholder="Every hero has a tale... (optional)"
                value={form.backstory}
                onChange={handleChange}
                rows={5}
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  minHeight: "100px",
                }}
              />
            </div>

            {/* Actions */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
                paddingTop: "8px",
              }}
            >
              <button
                type="button"
                onClick={() => void router.push("/characters")}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(201,168,76,0.5)",
                  color: "#c9a84c",
                  borderRadius: "4px",
                  padding: "10px 20px",
                  fontFamily: "'Georgia', serif",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  background: "linear-gradient(135deg, #8b6914, #c9a84c)",
                  color: "#1a1a2e",
                  border: "none",
                  borderRadius: "6px",
                  padding: "12px 28px",
                  fontSize: "14px",
                  fontFamily: "'Georgia', serif",
                  fontWeight: "bold",
                  cursor: "pointer",
                  letterSpacing: "0.5px",
                }}
              >
                Begin the Legend
              </button>
            </div>
          </div>
        </form>
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
