import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { api } from "@/utils/api";
import { CharacterSheet, type CharacterData } from "@/components/character";
import { DiceRoller } from "@/components/DiceRoller";
import { downloadCharacterJson } from "@/lib/characterJsonExport";
import { downloadCharacterPdf } from "@/lib/characterPdfExport";

// ---------------------------------------------------------------------------
// Export bar — JSON + PDF buttons shown above the character sheet
// ---------------------------------------------------------------------------

function ExportBar({ character }: { character: CharacterData }) {
  const [exporting, setExporting] = useState<"json" | "pdf" | null>(null);

  const exportQuery = api.character.export.useQuery(
    { id: character.id },
    { enabled: false },
  );

  const handleJsonExport = async () => {
    setExporting("json");
    try {
      const result = await exportQuery.refetch();
      if (result.data) {
        downloadCharacterJson(result.data as Record<string, unknown>, character.name);
      }
    } catch {
      // silent
    } finally {
      setExporting(null);
    }
  };

  const handlePdfExport = () => {
    setExporting("pdf");
    try {
      downloadCharacterPdf(character);
    } finally {
      setExporting(null);
    }
  };

  const buttonStyle: React.CSSProperties = {
    background: "none",
    border: "1px solid rgba(201,168,76,0.3)",
    borderRadius: "4px",
    color: "#a89060",
    fontSize: "12px",
    fontFamily: "'Georgia', serif",
    padding: "5px 12px",
    cursor: "pointer",
    letterSpacing: "0.5px",
    transition: "border-color 0.2s, color 0.2s",
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: "8px",
        marginBottom: "12px",
      }}
    >
      <button
        onClick={() => void handleJsonExport()}
        disabled={exporting === "json"}
        style={{
          ...buttonStyle,
          opacity: exporting === "json" ? 0.5 : 1,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.7)"; e.currentTarget.style.color = "#c9a84c"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)"; e.currentTarget.style.color = "#a89060"; }}
      >
        {exporting === "json" ? "Exporting..." : "Export JSON"}
      </button>
      <button
        onClick={handlePdfExport}
        disabled={exporting === "pdf"}
        style={{
          ...buttonStyle,
          opacity: exporting === "pdf" ? 0.5 : 1,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.7)"; e.currentTarget.style.color = "#c9a84c"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)"; e.currentTarget.style.color = "#a89060"; }}
      >
        {exporting === "pdf" ? "Generating..." : "Export PDF"}
      </button>
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

  const activeAdventure = normalized.adventurePlayers?.find(
    (ap) => ap.status === "ACCEPTED"
  );
  const adventureId = activeAdventure?.adventure?.id;

  return (
    <>
      <Head>
        <title>{character.name} — DnD Tool</title>
      </Head>
      <ExportBar character={normalized} />
      <CharacterSheet character={normalized} />
      {adventureId && <DiceRoller adventureId={adventureId} />}
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
