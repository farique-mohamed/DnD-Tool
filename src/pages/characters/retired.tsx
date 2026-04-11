import Head from "next/head";
import { useRouter } from "next/router";
import { useState, useRef, useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { useIsMobile } from "@/hooks/useIsMobile";
import { api } from "@/utils/api";
import { downloadCharacterJson } from "@/lib/characterJsonExport";
import { downloadCharacterPdf } from "@/lib/characterPdfExport";

const SERIF = "'EB Garamond', 'Georgia', serif";
const PAGE_SIZE = 20;

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

  const exportQuery = api.character.export.useQuery(
    { id: character.id },
    { enabled: false },
  );

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
          fontFamily: SERIF,
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
              fontFamily: SERIF,
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
              fontFamily: SERIF,
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
// Retired Character Card — same as CharacterCard but with RETIRED badge
// ---------------------------------------------------------------------------

function RetiredCharacterCard({ character, onClick, isMobile }: { character: {
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
          <span style={{
            display: "inline-block",
            marginTop: "6px",
            padding: "2px 10px",
            borderRadius: "12px",
            fontSize: "11px",
            fontFamily: SERIF,
            letterSpacing: "0.3px",
            background: "rgba(231,76,60,0.15)",
            border: "1px solid rgba(231,76,60,0.4)",
            color: "#e74c3c",
          }}>
            RETIRED
          </span>
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
            <div style={{ color: "#b8934a", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: SERIF, marginBottom: "4px" }}>
              {label}
            </div>
            <div style={{ color: "#e8d5a3", fontSize: "16px", fontWeight: "bold", fontFamily: SERIF }}>
              {value}
            </div>
            <div style={{ color: "#a89060", fontSize: "11px", fontFamily: SERIF }}>
              {abilityModifier(value)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pagination bar
// ---------------------------------------------------------------------------

const paginationButtonStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid rgba(201,168,76,0.4)",
  borderRadius: "6px",
  color: "#c9a84c",
  fontSize: "13px",
  fontFamily: SERIF,
  padding: "8px 16px",
  cursor: "pointer",
  letterSpacing: "0.5px",
  transition: "opacity 0.15s",
};

function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "16px", marginTop: "24px" }}>
      <button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        style={{ ...paginationButtonStyle, opacity: page <= 1 ? 0.4 : 1, cursor: page <= 1 ? "default" : "pointer" }}
      >
        &larr; Previous
      </button>
      <span style={{ color: "#a89060", fontSize: "13px", fontFamily: SERIF }}>
        Page {page} of {totalPages}
      </span>
      <button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        style={{ ...paginationButtonStyle, opacity: page >= totalPages ? 0.4 : 1, cursor: page >= totalPages ? "default" : "pointer" }}
      >
        Next &rarr;
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Active / Retired tab bar
// ---------------------------------------------------------------------------

function CharacterTabs({ currentTab, onTabChange }: { currentTab: "Active" | "Retired"; onTabChange: (tab: "Active" | "Retired") => void }) {
  return (
    <div style={{ display: "flex", gap: "24px", marginBottom: "24px" }}>
      {(["Active", "Retired"] as const).map(tab => {
        const isActive = tab === currentTab;
        return (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            style={{
              background: "none",
              border: "none",
              borderBottom: isActive ? "2px solid #c9a84c" : "2px solid transparent",
              color: isActive ? "#c9a84c" : "#a89060",
              fontSize: "14px",
              fontFamily: SERIF,
              fontWeight: isActive ? "bold" : "normal",
              padding: "8px 4px",
              cursor: "pointer",
              letterSpacing: "0.5px",
              transition: "all 0.15s",
            }}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Retired characters page content
// ---------------------------------------------------------------------------

function RetiredCharactersContent() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [page, setPage] = useState(1);
  const { data, isLoading } = api.character.listRetired.useQuery({ page, pageSize: PAGE_SIZE });

  const characters = data?.characters;
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <Head>
        <title>Retired Characters — DnD Tool</title>
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
        </div>
        <div style={{ width: "80px", height: "2px", background: "#c9a84c", marginBottom: "32px", opacity: 0.6 }} />

        <CharacterTabs
          currentTab="Retired"
          onTabChange={(tab) => {
            if (tab === "Active") void router.push("/characters");
          }}
        />

        {isLoading ? (
          <p style={{ color: "#a89060", fontFamily: SERIF, fontSize: "14px" }}>
            Summoning your retired adventurers...
          </p>
        ) : !characters || characters.length === 0 ? (
          <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "12px", padding: isMobile ? "32px 16px" : "60px 40px", textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>🛡️</div>
            <p style={{ color: "#e8d5a3", fontSize: "15px", marginBottom: "8px" }}>No retired characters.</p>
            <p style={{ color: "#a89060", fontSize: "13px" }}>Your heroes are all still adventuring.</p>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {characters.map((c) => (
                <RetiredCharacterCard
                  key={c.id}
                  character={c}
                  onClick={() => void router.push(`/characters/${c.id}`)}
                  isMobile={isMobile}
                />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </>
  );
}

export default function RetiredCharactersPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <RetiredCharactersContent />
      </Layout>
    </ProtectedRoute>
  );
}
