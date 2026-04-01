import Head from "next/head";
import { useRouter } from "next/router";
import { useState, useRef, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { ImportCharacterModal } from "@/components/ImportCharacterModal";
import { useIsMobile } from "@/hooks/useIsMobile";
import { api } from "@/utils/api";
import { downloadCharacterJson } from "@/lib/characterJsonExport";
import { downloadCharacterPdf } from "@/lib/characterPdfExport";

function abilityModifier(score: number): string {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

// ---------------------------------------------------------------------------
// Export Dropdown — small menu on each card
// ---------------------------------------------------------------------------

function ExportDropdown({ character }: {
  character: {
    id: string;
    name: string;
    race: string;
    characterClass: string;
    level: number;
    alignment: string;
    maxHp: number;
    currentHp: number;
    armorClass: number;
    speed: number;
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Lazy-fetch export data only when the user clicks JSON export
  const exportQuery = api.character.export.useQuery(
    { id: character.id },
    { enabled: false },
  );

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleJsonExport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    try {
      const result = await exportQuery.refetch();
      if (result.data) {
        downloadCharacterJson(result.data as Record<string, unknown>, character.name);
      }
    } catch {
      // silent — user can retry
    }
  };

  const handlePdfExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    downloadCharacterPdf(character);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        title="Export character"
        style={{
          background: "none",
          border: "1px solid rgba(201,168,76,0.3)",
          borderRadius: "4px",
          color: "#a89060",
          fontSize: "11px",
          fontFamily: "'Georgia', serif",
          padding: "3px 8px",
          cursor: "pointer",
          letterSpacing: "0.5px",
          transition: "border-color 0.2s, color 0.2s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.7)"; e.currentTarget.style.color = "#c9a84c"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)"; e.currentTarget.style.color = "#a89060"; }}
      >
        Export
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "100%",
            marginTop: "4px",
            background: "rgba(15,8,3,0.95)",
            border: "1px solid rgba(201,168,76,0.4)",
            borderRadius: "6px",
            padding: "4px 0",
            zIndex: 100,
            minWidth: "130px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
          }}
        >
          <button
            onClick={(e) => void handleJsonExport(e)}
            style={{
              display: "block",
              width: "100%",
              background: "none",
              border: "none",
              color: "#e8d5a3",
              fontSize: "12px",
              fontFamily: "'Georgia', serif",
              padding: "8px 14px",
              cursor: "pointer",
              textAlign: "left",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(201,168,76,0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            Export JSON
          </button>
          <button
            onClick={handlePdfExport}
            style={{
              display: "block",
              width: "100%",
              background: "none",
              border: "none",
              color: "#e8d5a3",
              fontSize: "12px",
              fontFamily: "'Georgia', serif",
              padding: "8px 14px",
              cursor: "pointer",
              textAlign: "left",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(201,168,76,0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            Export PDF
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Character Card
// ---------------------------------------------------------------------------

function CharacterCard({ character, onClick, isMobile }: { character: {
  id: string;
  name: string;
  race: string;
  characterClass: string;
  level: number;
  alignment: string;
  maxHp: number;
  currentHp: number;
  armorClass: number;
  speed: number;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  backstory?: string | null;
  adventurePlayers?: Array<{
    status: string;
    adventure: { id: string; name: string; source: string };
  }>;
}; onClick?: () => void; isMobile?: boolean }) {
  const abilities = [
    { label: "STR", value: character.strength },
    { label: "DEX", value: character.dexterity },
    { label: "CON", value: character.constitution },
    { label: "INT", value: character.intelligence },
    { label: "WIS", value: character.wisdom },
    { label: "CHA", value: character.charisma },
  ];

  return (
    <div
      onClick={onClick}
      style={{
        background: "rgba(0,0,0,0.5)",
        border: "1px solid rgba(201,168,76,0.3)",
        borderRadius: "12px",
        padding: "24px",
        transition: "border-color 0.2s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.7)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)")}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ color: "#c9a84c", fontSize: "20px", fontWeight: "bold", letterSpacing: "1px", marginBottom: "4px" }}>
            {character.name}
          </h2>
          <p style={{ color: "#a89060", fontSize: "13px" }}>
            Level {character.level} {character.race} {character.characterClass}
          </p>
          <p style={{ color: "#a89060", fontSize: "12px", marginTop: "2px" }}>{character.alignment}</p>
          {character.adventurePlayers && character.adventurePlayers.length > 0 && (() => {
            const ap = character.adventurePlayers[0]!;
            return (
              <span style={{
                display: "inline-block",
                marginTop: "6px",
                padding: "2px 10px",
                borderRadius: "12px",
                fontSize: "11px",
                fontFamily: "'Georgia', serif",
                letterSpacing: "0.3px",
                background: ap.status === "ACCEPTED" ? "rgba(74,124,42,0.2)" : "rgba(201,168,76,0.15)",
                border: ap.status === "ACCEPTED" ? "1px solid rgba(74,124,42,0.4)" : "1px solid rgba(201,168,76,0.3)",
                color: ap.status === "ACCEPTED" ? "#4a7c2a" : "#a89060",
              }}>
                {ap.status === "ACCEPTED" ? "In" : "Pending"}: {ap.adventure.name}
              </span>
            );
          })()}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#e8d5a3", fontSize: "13px" }}>
              <span style={{ color: "#b8934a" }}>HP:</span> {character.currentHp}/{character.maxHp}
            </div>
            <div style={{ color: "#e8d5a3", fontSize: "13px" }}>
              <span style={{ color: "#b8934a" }}>AC:</span> {character.armorClass}
            </div>
            <div style={{ color: "#e8d5a3", fontSize: "13px" }}>
              <span style={{ color: "#b8934a" }}>Speed:</span> {character.speed}ft
            </div>
          </div>
          <ExportDropdown character={character} />
        </div>
      </div>

      {/* Ability Scores */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(6, 1fr)",
        gap: "8px",
        paddingTop: "16px",
        borderTop: "1px solid rgba(201,168,76,0.15)",
      }}>
        {abilities.map(({ label, value }) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div style={{ color: "#b8934a", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'Georgia', serif", marginBottom: "4px" }}>
              {label}
            </div>
            <div style={{ color: "#e8d5a3", fontSize: "16px", fontWeight: "bold", fontFamily: "'Georgia', serif" }}>
              {value}
            </div>
            <div style={{ color: "#a89060", fontSize: "11px", fontFamily: "'Georgia', serif" }}>
              {abilityModifier(value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page content
// ---------------------------------------------------------------------------

function CharactersContent() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { data: characters, isLoading } = api.character.list.useQuery();
  const [importOpen, setImportOpen] = useState(false);

  return (
    <>
      <Head>
        <title>My Characters — DnD Tool</title>
      </Head>
      <div style={{ maxWidth: "900px" }}>
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "flex-start", justifyContent: "space-between", marginBottom: "8px", gap: isMobile ? "12px" : "0" }}>
          <div>
            <h1 style={{ color: "#c9a84c", fontSize: isMobile ? "20px" : "26px", fontWeight: "bold", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>
              My Characters
            </h1>
            <p style={{ color: "#a89060", fontSize: "14px", marginBottom: "32px" }}>
              Your roster of heroes and villains.
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={() => setImportOpen(true)}
              style={{
                background: "transparent",
                color: "#c9a84c",
                border: "1px solid #c9a84c",
                borderRadius: "6px",
                padding: "12px 20px",
                fontSize: "13px",
                fontFamily: "'Georgia', serif",
                fontWeight: "bold",
                cursor: "pointer",
                letterSpacing: "0.5px",
                whiteSpace: "nowrap",
              }}
            >
              Import Character
            </button>
            <button
              onClick={() => void router.push("/characters/new")}
              style={{ background: "linear-gradient(135deg, #8b6914, #c9a84c)", color: "#1a1a2e", border: "none", borderRadius: "6px", padding: "12px 24px", fontSize: "13px", fontFamily: "'Georgia', serif", fontWeight: "bold", cursor: "pointer", letterSpacing: "0.5px", whiteSpace: "nowrap" }}
            >
              + Create Character
            </button>
          </div>
        </div>
        <div style={{ width: "80px", height: "2px", background: "#c9a84c", marginBottom: "32px", opacity: 0.6 }} />

        {isLoading ? (
          <p style={{ color: "#a89060", fontFamily: "'Georgia', serif", fontSize: "14px" }}>
            Summoning your adventurers...
          </p>
        ) : !characters || characters.length === 0 ? (
          <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "12px", padding: isMobile ? "32px 16px" : "60px 40px", textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>🛡️</div>
            <p style={{ color: "#e8d5a3", fontSize: "15px", marginBottom: "8px" }}>No characters yet.</p>
            <p style={{ color: "#a89060", fontSize: "13px", marginBottom: "24px" }}>Every legend begins with a single character sheet.</p>
            <button
              onClick={() => void router.push("/characters/new")}
              style={{ background: "linear-gradient(135deg, #8b6914, #c9a84c)", color: "#1a1a2e", border: "none", borderRadius: "6px", padding: "12px 28px", fontSize: "14px", fontFamily: "'Georgia', serif", fontWeight: "bold", cursor: "pointer", letterSpacing: "0.5px" }}
            >
              Create Your First Character
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {characters.map((c) => <CharacterCard key={c.id} character={c} onClick={() => void router.push(`/characters/${c.id}`)} isMobile={isMobile} />)}
          </div>
        )}
      </div>

      <ImportCharacterModal open={importOpen} onClose={() => setImportOpen(false)} />
    </>
  );
}

export default function CharactersPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <CharactersContent />
      </Layout>
    </ProtectedRoute>
  );
}
