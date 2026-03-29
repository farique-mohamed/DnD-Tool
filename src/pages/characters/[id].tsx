import Head from "next/head";
import { useRouter } from "next/router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { api } from "@/utils/api";
import { CharacterSheet, type CharacterData } from "@/components/character";
import { DiceRoller } from "@/components/DiceRoller";

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
