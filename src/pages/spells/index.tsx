import Head from "next/head";
import { useState, useMemo } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { SPELLS, type Spell } from "@/lib/spellsData";

const ALL_CLASSES = [
  "Bard", "Cleric", "Druid", "Paladin", "Ranger",
  "Sorcerer", "Warlock", "Wizard",
];

const SCHOOL_COLORS: Record<string, string> = {
  Abjuration: "#4a90d9",
  Conjuration: "#9b59b6",
  Divination: "#27ae60",
  Enchantment: "#e91e8c",
  Evocation: "#e74c3c",
  Illusion: "#8e44ad",
  Necromancy: "#2c3e50",
  Transmutation: "#e67e22",
};

function levelLabel(level: number): string {
  if (level === 0) return "Cantrip";
  const suffixes = ["st", "nd", "rd"];
  const suffix = suffixes[level - 1] ?? "th";
  return `${level}${suffix} Level`;
}

function SpellCard({ spell }: { spell: Spell }) {
  const schoolColor = SCHOOL_COLORS[spell.school] ?? "#c9a84c";

  return (
    <div style={{
      background: "rgba(0,0,0,0.5)",
      border: "1px solid rgba(201,168,76,0.25)",
      borderRadius: "10px",
      padding: "18px 20px",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      transition: "border-color 0.2s",
    }}
    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.6)")}
    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.25)")}
    >
      {/* Name + school badge */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
        <h3 style={{ color: "#c9a84c", fontSize: "16px", fontWeight: "bold", fontFamily: "'Georgia', serif", letterSpacing: "0.5px", margin: 0 }}>
          {spell.name}
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: schoolColor, display: "inline-block", flexShrink: 0 }} />
          <span style={{ color: "#a89060", fontSize: "11px", fontFamily: "'Georgia', serif", whiteSpace: "nowrap" }}>
            {spell.school}
          </span>
        </div>
      </div>

      {/* Level */}
      <span style={{
        display: "inline-block",
        background: "rgba(201,168,76,0.1)",
        border: "1px solid rgba(201,168,76,0.3)",
        borderRadius: "4px",
        padding: "2px 8px",
        color: "#e8d5a3",
        fontSize: "11px",
        fontFamily: "'Georgia', serif",
        letterSpacing: "0.5px",
        alignSelf: "flex-start",
      }}>
        {levelLabel(spell.level)}
      </span>

      {/* Metadata row */}
      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        {[
          { label: "Cast", value: spell.castingTime },
          { label: "Range", value: spell.range },
          { label: "Duration", value: spell.duration },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ color: "#b8934a", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Georgia', serif" }}>{label}</span>
            <span style={{ color: "#e8d5a3", fontSize: "12px", fontFamily: "'Georgia', serif" }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Components */}
      <div>
        <span style={{ color: "#b8934a", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Georgia', serif" }}>Components: </span>
        <span style={{ color: "#a89060", fontSize: "12px", fontFamily: "'Georgia', serif" }}>{spell.components}</span>
      </div>

      {/* Description */}
      <p style={{
        color: "#a89060",
        fontSize: "13px",
        fontFamily: "'Georgia', serif",
        lineHeight: 1.5,
        margin: 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        display: "-webkit-box",
        WebkitLineClamp: 3,
        WebkitBoxOrient: "vertical",
      }}>
        {spell.description}
      </p>

      {/* Classes */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
        {spell.classes.map((cls) => (
          <span key={cls} style={{
            background: "rgba(201,168,76,0.08)",
            border: "1px solid rgba(201,168,76,0.2)",
            borderRadius: "3px",
            padding: "1px 6px",
            color: "#a89060",
            fontSize: "10px",
            fontFamily: "'Georgia', serif",
          }}>
            {cls}
          </span>
        ))}
      </div>
    </div>
  );
}

function SpellsContent() {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const availableLevels = useMemo(() => {
    const levels = Array.from(new Set(SPELLS.map((s) => s.level))).sort((a, b) => a - b);
    return levels;
  }, []);

  const filteredSpells = useMemo(() => {
    return SPELLS.filter((spell) => {
      if (selectedClass && !spell.classes.includes(selectedClass)) return false;
      if (selectedLevel !== null && spell.level !== selectedLevel) return false;
      if (searchQuery && !spell.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [selectedClass, selectedLevel, searchQuery]);

  const chipBase: React.CSSProperties = {
    border: "1px solid rgba(201,168,76,0.4)",
    borderRadius: "20px",
    padding: "5px 14px",
    fontSize: "12px",
    fontFamily: "'Georgia', serif",
    cursor: "pointer",
    transition: "background 0.15s, color 0.15s",
    letterSpacing: "0.3px",
  };

  const chipActive: React.CSSProperties = {
    ...chipBase,
    background: "linear-gradient(135deg, #8b6914, #c9a84c)",
    color: "#1a1a2e",
    fontWeight: "bold",
    border: "1px solid #c9a84c",
  };

  const chipInactive: React.CSSProperties = {
    ...chipBase,
    background: "transparent",
    color: "#a89060",
  };

  return (
    <>
      <Head>
        <title>Spell Compendium — DnD Tool</title>
      </Head>
      <div style={{ maxWidth: "960px" }}>
        {/* Header */}
        <div style={{ marginBottom: "8px" }}>
          <h1 style={{ color: "#c9a84c", fontSize: "26px", fontWeight: "bold", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px", fontFamily: "'Georgia', serif" }}>
            Spell Compendium
          </h1>
          <p style={{ color: "#a89060", fontSize: "14px", marginBottom: "24px", fontFamily: "'Georgia', serif" }}>
            Browse and filter the arcane arts.
          </p>
        </div>
        <div style={{ width: "80px", height: "2px", background: "#c9a84c", marginBottom: "28px", opacity: 0.6 }} />

        {/* Filter bar */}
        <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "12px", padding: "20px 24px", marginBottom: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Search */}
          <input
            type="text"
            placeholder="Search spells..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: "rgba(30,15,5,0.9)",
              border: "1px solid rgba(201,168,76,0.4)",
              borderRadius: "6px",
              padding: "10px 14px",
              color: "#e8d5a3",
              fontSize: "13px",
              fontFamily: "'Georgia', serif",
              outline: "none",
              width: "100%",
              boxSizing: "border-box",
            }}
          />

          {/* Class filter */}
          <div>
            <div style={{ color: "#b8934a", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Georgia', serif", marginBottom: "8px" }}>Class</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              <button
                onClick={() => setSelectedClass(null)}
                style={selectedClass === null ? chipActive : chipInactive}
              >
                All Classes
              </button>
              {ALL_CLASSES.map((cls) => (
                <button
                  key={cls}
                  onClick={() => setSelectedClass(selectedClass === cls ? null : cls)}
                  style={selectedClass === cls ? chipActive : chipInactive}
                >
                  {cls}
                </button>
              ))}
            </div>
          </div>

          {/* Level filter */}
          <div>
            <div style={{ color: "#b8934a", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Georgia', serif", marginBottom: "8px" }}>Level</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              <button
                onClick={() => setSelectedLevel(null)}
                style={selectedLevel === null ? chipActive : chipInactive}
              >
                All Levels
              </button>
              {availableLevels.map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(selectedLevel === level ? null : level)}
                  style={selectedLevel === level ? chipActive : chipInactive}
                >
                  {levelLabel(level)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Count */}
        <p style={{ color: "#a89060", fontSize: "13px", fontFamily: "'Georgia', serif", marginBottom: "16px" }}>
          Showing {filteredSpells.length} spell{filteredSpells.length !== 1 ? "s" : ""}
        </p>

        {/* Spell grid */}
        {filteredSpells.length === 0 ? (
          <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "12px", padding: "60px 40px", textAlign: "center" }}>
            <p style={{ color: "#e8d5a3", fontSize: "15px", marginBottom: "8px", fontFamily: "'Georgia', serif" }}>No spells found.</p>
            <p style={{ color: "#a89060", fontSize: "13px", fontFamily: "'Georgia', serif" }}>Adjust your filters or search query.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
            {filteredSpells.map((spell) => (
              <SpellCard key={spell.name} spell={spell} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function SpellsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <SpellsContent />
      </Layout>
    </ProtectedRoute>
  );
}
