import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { api } from "@/utils/api";
import { CharacterSheet, type CharacterData } from "@/components/character";
import { DiceRoller } from "@/components/DiceRoller";
import { Modal } from "@/components/ui/Modal";
import { downloadCharacterJson } from "@/lib/characterJsonExport";
import { downloadCharacterPdf } from "@/lib/characterPdfExport";

const SERIF = "'EB Garamond', 'Georgia', serif";

// ---------------------------------------------------------------------------
// Export bar — JSON + PDF buttons shown above the character sheet
// ---------------------------------------------------------------------------

function ExportBar({ character }: { character: CharacterData }) {
  const router = useRouter();
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
    fontFamily: "'EB Garamond', 'Georgia', serif",
    padding: "5px 12px",
    cursor: "pointer",
    letterSpacing: "0.5px",
    transition: "border-color 0.2s, color 0.2s",
  };

  const editButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    borderColor: "rgba(201,168,76,0.6)",
    color: "#c9a84c",
    fontWeight: "bold",
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
        onClick={() => void router.push(`/characters/${character.id}/edit`)}
        style={editButtonStyle}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c9a84c"; e.currentTarget.style.background = "rgba(201,168,76,0.1)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.6)"; e.currentTarget.style.background = "none"; }}
      >
        Edit
      </button>
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
          fontFamily: "'EB Garamond', 'Georgia', serif",
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
          fontFamily: "'EB Garamond', 'Georgia', serif",
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

  // Retirement state
  const isRetired = !!(character as { isRetired?: boolean }).isRetired;
  const rejectedAdventure = normalized.adventurePlayers?.find(
    (ap) => ap.status === "REJECTED"
  );

  return (
    <>
      <Head>
        <title>{character.name} — DnD Tool</title>
      </Head>

      {/* Retired banner */}
      {isRetired && (
        <div style={{
          background: "rgba(231,76,60,0.1)",
          border: "1px solid rgba(231,76,60,0.4)",
          borderRadius: "8px",
          padding: "12px 20px",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}>
          <span style={{
            background: "rgba(231,76,60,0.15)",
            border: "1px solid rgba(231,76,60,0.4)",
            color: "#e74c3c",
            padding: "2px 10px",
            borderRadius: "12px",
            fontSize: "11px",
            fontFamily: SERIF,
            fontWeight: "bold",
            letterSpacing: "0.5px",
          }}>
            RETIRED
          </span>
          <span style={{ color: "#e8d5a3", fontSize: "13px", fontFamily: SERIF }}>
            This character has been retired from active adventuring.
          </span>
        </div>
      )}

      {/* Previous adventure notice for retired characters */}
      {isRetired && rejectedAdventure && (
        <div style={{
          background: "rgba(201,168,76,0.08)",
          border: "1px solid rgba(201,168,76,0.25)",
          borderRadius: "8px",
          padding: "12px 20px",
          marginBottom: "16px",
        }}>
          <p style={{ color: "#a89060", fontSize: "13px", fontFamily: SERIF, margin: 0 }}>
            This character was previously in <strong style={{ color: "#c9a84c" }}>{rejectedAdventure.adventure.name}</strong>. Use an invite code to rejoin.
          </p>
        </div>
      )}

      <ExportBar character={normalized} />
      <RetireActivateBar characterId={charId} characterName={character.name} isRetired={isRetired} />
      <CharacterSheet character={normalized} />
      {!isRetired && adventureId && <DiceRoller adventureId={adventureId} />}
    </>
  );
}

// ---------------------------------------------------------------------------
// Retire / Activate bar
// ---------------------------------------------------------------------------

function RetireActivateBar({ characterId, characterName, isRetired }: { characterId: string; characterName: string; isRetired: boolean }) {
  const utils = api.useUtils();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const retireMutation = api.character.retire.useMutation({
    onSuccess: () => {
      setConfirmOpen(false);
      void utils.character.getById.invalidate({ id: characterId });
      void utils.character.listActive.invalidate();
      void utils.character.listRetired.invalidate();
    },
  });

  const activateMutation = api.character.activate.useMutation({
    onSuccess: () => {
      void utils.character.getById.invalidate({ id: characterId });
      void utils.character.listActive.invalidate();
      void utils.character.listRetired.invalidate();
    },
  });

  if (isRetired) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
        <button
          onClick={() => activateMutation.mutate({ id: characterId })}
          disabled={activateMutation.isPending}
          style={{
            background: "linear-gradient(135deg, #2a5c1a, #4a7c2a)",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            padding: "8px 20px",
            fontSize: "13px",
            fontFamily: SERIF,
            fontWeight: "bold",
            cursor: activateMutation.isPending ? "not-allowed" : "pointer",
            letterSpacing: "0.5px",
            opacity: activateMutation.isPending ? 0.6 : 1,
            transition: "opacity 0.2s",
          }}
        >
          {activateMutation.isPending ? "Activating..." : "Activate Character"}
        </button>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
        <button
          onClick={() => setConfirmOpen(true)}
          style={{
            background: "none",
            border: "1px solid rgba(231,76,60,0.4)",
            borderRadius: "6px",
            color: "#e74c3c",
            padding: "8px 20px",
            fontSize: "13px",
            fontFamily: SERIF,
            fontWeight: "bold",
            cursor: "pointer",
            letterSpacing: "0.5px",
            transition: "border-color 0.2s, background 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(231,76,60,0.7)"; e.currentTarget.style.background = "rgba(231,76,60,0.08)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(231,76,60,0.4)"; e.currentTarget.style.background = "none"; }}
        >
          Retire Character
        </button>
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Retire Character">
        <p style={{ color: "#e8d5a3", fontSize: "14px", fontFamily: SERIF, marginBottom: "8px" }}>
          Are you sure you want to retire <strong style={{ color: "#c9a84c" }}>{characterName}</strong>?
        </p>
        <p style={{ color: "#a89060", fontSize: "13px", fontFamily: SERIF, marginBottom: "24px" }}>
          They will be removed from any active adventures.
        </p>

        {retireMutation.error && (
          <p style={{ color: "#e74c3c", fontSize: "13px", fontFamily: SERIF, marginBottom: "12px" }}>
            {retireMutation.error.message}
          </p>
        )}

        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button
            onClick={() => setConfirmOpen(false)}
            style={{
              background: "transparent",
              border: "1px solid rgba(201,168,76,0.5)",
              color: "#c9a84c",
              borderRadius: "6px",
              padding: "8px 20px",
              fontFamily: SERIF,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => retireMutation.mutate({ id: characterId })}
            disabled={retireMutation.isPending}
            style={{
              background: "linear-gradient(135deg, #6b1a1a, #e74c3c)",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              padding: "8px 20px",
              fontSize: "13px",
              fontFamily: SERIF,
              fontWeight: "bold",
              cursor: retireMutation.isPending ? "not-allowed" : "pointer",
              letterSpacing: "0.5px",
              opacity: retireMutation.isPending ? 0.6 : 1,
            }}
          >
            {retireMutation.isPending ? "Retiring..." : "Confirm Retire"}
          </button>
        </div>
      </Modal>
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
