import { useState, useMemo } from "react";
import { api } from "@/utils/api";
import { useAuth } from "@/hooks/useAuth";
import { CONDITIONS } from "@/lib/conditionData";
import { MONSTER_LIST, type MonsterInfo, abilityMod } from "@/lib/bestiaryData";
import { parseTaggedText } from "@/lib/dndTagParser";
import { GOLD, GOLD_MUTED, GOLD_BRIGHT, TEXT_DIM, SERIF, SourceBadge } from "./shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EncounterTabProps {
  adventureId: string;
  isOwner: boolean;
  acceptedPlayers: Array<{
    id: string;
    user: { id: string; username: string };
    character: {
      id: string;
      name: string;
      characterClass: string;
      level: number;
      maxHp: number;
      currentHp: number;
      tempHp: number;
      armorClass: number;
    } | null;
  }>;
  adventureMonsters: Array<{
    id: string;
    name: string;
    source: string;
  }>;
}

type HpActionType = "damage" | "heal" | "setTempHp";

// ---------------------------------------------------------------------------
// Styling helpers
// ---------------------------------------------------------------------------

const cardStyle: React.CSSProperties = {
  background: "rgba(0,0,0,0.4)",
  border: "1px solid rgba(201,168,76,0.2)",
  borderRadius: "12px",
  padding: "16px 20px",
  marginBottom: "8px",
};

const activeCardStyle: React.CSSProperties = {
  ...cardStyle,
  border: "2px solid #c9a84c",
  boxShadow: "0 0 20px rgba(201,168,76,0.3)",
};

const inactiveCardStyle: React.CSSProperties = {
  ...cardStyle,
  opacity: 0.45,
};

const goldButtonStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #8b6914, #c9a84c)",
  color: "#1a1a2e",
  border: "none",
  borderRadius: "6px",
  padding: "10px 24px",
  fontSize: "14px",
  fontFamily: "'Georgia', serif",
  fontWeight: "bold",
  cursor: "pointer",
  letterSpacing: "0.5px",
};

const dangerButtonStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #8b1e1e, #c0392b)",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  padding: "10px 24px",
  fontSize: "14px",
  fontFamily: "'Georgia', serif",
  fontWeight: "bold",
  cursor: "pointer",
  letterSpacing: "0.5px",
};

const smallButtonStyle: React.CSSProperties = {
  background: "none",
  border: "1px solid rgba(201,168,76,0.3)",
  color: GOLD_MUTED,
  borderRadius: "4px",
  padding: "4px 10px",
  fontFamily: SERIF,
  fontSize: "11px",
  cursor: "pointer",
};

const inputStyle: React.CSSProperties = {
  background: "rgba(30,15,5,0.9)",
  border: "1px solid rgba(201,168,76,0.4)",
  color: "#e8d5a3",
  fontFamily: "'Georgia', serif",
  borderRadius: "6px",
  padding: "8px 12px",
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box" as const,
};

const sectionLabelStyle: React.CSSProperties = {
  color: GOLD_MUTED,
  fontSize: "11px",
  fontFamily: SERIF,
  letterSpacing: "1px",
  textTransform: "uppercase" as const,
  marginBottom: "8px",
};

// ---------------------------------------------------------------------------
// HP bar color
// ---------------------------------------------------------------------------

function hpBarColor(current: number, max: number): string {
  if (max <= 0) return "#888";
  const pct = current / max;
  if (pct > 0.5) return "#4a8c3f";
  if (pct > 0.25) return "#c9a84c";
  return "#c0392b";
}

// ---------------------------------------------------------------------------
// Unique condition names (de-duplicated)
// ---------------------------------------------------------------------------

const UNIQUE_CONDITION_NAMES: string[] = (() => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const c of CONDITIONS) {
    if (!seen.has(c.name)) {
      seen.add(c.name);
      result.push(c.name);
    }
  }
  return result.sort();
})();

// ---------------------------------------------------------------------------
// Monster lookup helper
// ---------------------------------------------------------------------------

function findMonsterData(name: string | null | undefined, source: string | null | undefined): MonsterInfo | undefined {
  if (!name) return undefined;
  // Exact name match
  const byName = MONSTER_LIST.find((m) => m.name.toLowerCase() === name.toLowerCase());
  if (byName) return byName;
  // Name + source match
  if (source) {
    const byNameSource = MONSTER_LIST.find(
      (m) => m.name.toLowerCase() === name.toLowerCase() && m.source.toLowerCase() === source.toLowerCase(),
    );
    if (byNameSource) return byNameSource;
    // Try source-only match (monsterSource may store the bestiary name)
    const bySource = MONSTER_LIST.find(
      (m) => m.source.toLowerCase() === source.toLowerCase() && m.name.toLowerCase() === name.toLowerCase(),
    );
    if (bySource) return bySource;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Monster stat block renderer (shared pattern from MonstersTab)
// ---------------------------------------------------------------------------

function MonsterStatBlock({ monsterData }: { monsterData: MonsterInfo }) {
  return (
    <div
      style={{
        background: "rgba(0,0,0,0.3)",
        border: "1px solid rgba(201,168,76,0.15)",
        borderRadius: "8px",
        padding: "16px 20px",
        marginTop: "8px",
        marginBottom: "4px",
      }}
    >
      {/* Size, type, alignment */}
      <p
        style={{
          color: GOLD_MUTED,
          fontSize: "13px",
          fontFamily: SERIF,
          fontStyle: "italic",
          marginBottom: "8px",
        }}
      >
        {monsterData.size} {monsterData.type}
        {monsterData.alignment ? `, ${monsterData.alignment}` : ""}
      </p>

      {/* AC, HP, Speed */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          marginBottom: "12px",
          fontSize: "13px",
          fontFamily: SERIF,
        }}
      >
        <div>
          <span style={{ color: GOLD, fontWeight: "bold" }}>Armor Class </span>
          <span style={{ color: GOLD_BRIGHT }}>
            {monsterData.ac ?? "\u2014"}
            {monsterData.acNote ? ` (${monsterData.acNote})` : ""}
          </span>
        </div>
        <div>
          <span style={{ color: GOLD, fontWeight: "bold" }}>Hit Points </span>
          <span style={{ color: GOLD_BRIGHT }}>
            {monsterData.hp ?? "\u2014"}
            {monsterData.hpFormula ? ` (${monsterData.hpFormula})` : ""}
          </span>
        </div>
        <div>
          <span style={{ color: GOLD, fontWeight: "bold" }}>Speed </span>
          <span style={{ color: GOLD_BRIGHT }}>{monsterData.speed || "\u2014"}</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: "rgba(201,168,76,0.2)", margin: "8px 0" }} />

      {/* Ability scores */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: "8px",
          textAlign: "center",
          marginBottom: "12px",
        }}
      >
        {(["str", "dex", "con", "int", "wis", "cha"] as const).map((ab) => (
          <div key={ab}>
            <div
              style={{
                color: GOLD,
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              {ab}
            </div>
            <div style={{ color: GOLD_BRIGHT, fontSize: "14px", fontWeight: "bold" }}>
              {monsterData[ab]}
            </div>
            <div style={{ color: TEXT_DIM, fontSize: "11px" }}>({abilityMod(monsterData[ab])})</div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ height: "1px", background: "rgba(201,168,76,0.2)", margin: "8px 0" }} />

      {/* Secondary stats */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          marginBottom: "12px",
          fontSize: "13px",
          fontFamily: SERIF,
        }}
      >
        {monsterData.savingThrows && (
          <div>
            <span style={{ color: GOLD, fontWeight: "bold" }}>Saving Throws </span>
            <span style={{ color: GOLD_BRIGHT }}>{monsterData.savingThrows}</span>
          </div>
        )}
        {monsterData.skills && (
          <div>
            <span style={{ color: GOLD, fontWeight: "bold" }}>Skills </span>
            <span style={{ color: GOLD_BRIGHT }}>{monsterData.skills}</span>
          </div>
        )}
        {monsterData.damageResistances && (
          <div>
            <span style={{ color: GOLD, fontWeight: "bold" }}>Damage Resistances </span>
            <span style={{ color: GOLD_BRIGHT }}>{monsterData.damageResistances}</span>
          </div>
        )}
        {monsterData.damageImmunities && (
          <div>
            <span style={{ color: GOLD, fontWeight: "bold" }}>Damage Immunities </span>
            <span style={{ color: GOLD_BRIGHT }}>{monsterData.damageImmunities}</span>
          </div>
        )}
        {monsterData.conditionImmunities && (
          <div>
            <span style={{ color: GOLD, fontWeight: "bold" }}>Condition Immunities </span>
            <span style={{ color: GOLD_BRIGHT }}>{monsterData.conditionImmunities}</span>
          </div>
        )}
        {monsterData.senses && (
          <div>
            <span style={{ color: GOLD, fontWeight: "bold" }}>Senses </span>
            <span style={{ color: GOLD_BRIGHT }}>{monsterData.senses}</span>
          </div>
        )}
        {monsterData.languages && (
          <div>
            <span style={{ color: GOLD, fontWeight: "bold" }}>Languages </span>
            <span style={{ color: GOLD_BRIGHT }}>{monsterData.languages}</span>
          </div>
        )}
      </div>

      {/* Traits */}
      {monsterData.traits.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          {monsterData.traits.map((t, ti) => (
            <div key={ti} style={{ marginBottom: "6px" }}>
              <span
                style={{
                  color: GOLD_BRIGHT,
                  fontWeight: "bold",
                  fontStyle: "italic",
                  fontFamily: SERIF,
                  fontSize: "13px",
                }}
              >
                {t.name}.{" "}
              </span>
              <span
                style={{ color: GOLD_BRIGHT, fontFamily: SERIF, fontSize: "13px" }}
                dangerouslySetInnerHTML={{ __html: parseTaggedText(t.text) }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {monsterData.actions.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <h4
            style={{
              color: GOLD,
              fontSize: "14px",
              fontFamily: SERIF,
              fontWeight: "bold",
              borderBottom: "1px solid rgba(201,168,76,0.3)",
              paddingBottom: "4px",
              marginBottom: "8px",
            }}
          >
            Actions
          </h4>
          {monsterData.actions.map((a, ai) => (
            <div key={ai} style={{ marginBottom: "6px" }}>
              <span
                style={{
                  color: GOLD_BRIGHT,
                  fontWeight: "bold",
                  fontStyle: "italic",
                  fontFamily: SERIF,
                  fontSize: "13px",
                }}
              >
                {a.name}.{" "}
              </span>
              <span
                style={{ color: GOLD_BRIGHT, fontFamily: SERIF, fontSize: "13px" }}
                dangerouslySetInnerHTML={{ __html: parseTaggedText(a.text) }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Bonus Actions */}
      {monsterData.bonusActions.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <h4
            style={{
              color: GOLD,
              fontSize: "14px",
              fontFamily: SERIF,
              fontWeight: "bold",
              borderBottom: "1px solid rgba(201,168,76,0.3)",
              paddingBottom: "4px",
              marginBottom: "8px",
            }}
          >
            Bonus Actions
          </h4>
          {monsterData.bonusActions.map((a, ai) => (
            <div key={ai} style={{ marginBottom: "6px" }}>
              <span
                style={{
                  color: GOLD_BRIGHT,
                  fontWeight: "bold",
                  fontStyle: "italic",
                  fontFamily: SERIF,
                  fontSize: "13px",
                }}
              >
                {a.name}.{" "}
              </span>
              <span
                style={{ color: GOLD_BRIGHT, fontFamily: SERIF, fontSize: "13px" }}
                dangerouslySetInnerHTML={{ __html: parseTaggedText(a.text) }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Reactions */}
      {monsterData.reactions.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <h4
            style={{
              color: GOLD,
              fontSize: "14px",
              fontFamily: SERIF,
              fontWeight: "bold",
              borderBottom: "1px solid rgba(201,168,76,0.3)",
              paddingBottom: "4px",
              marginBottom: "8px",
            }}
          >
            Reactions
          </h4>
          {monsterData.reactions.map((a, ai) => (
            <div key={ai} style={{ marginBottom: "6px" }}>
              <span
                style={{
                  color: GOLD_BRIGHT,
                  fontWeight: "bold",
                  fontStyle: "italic",
                  fontFamily: SERIF,
                  fontSize: "13px",
                }}
              >
                {a.name}.{" "}
              </span>
              <span
                style={{ color: GOLD_BRIGHT, fontFamily: SERIF, fontSize: "13px" }}
                dangerouslySetInnerHTML={{ __html: parseTaggedText(a.text) }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Legendary Actions */}
      {monsterData.legendaryActions.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <h4
            style={{
              color: GOLD,
              fontSize: "14px",
              fontFamily: SERIF,
              fontWeight: "bold",
              borderBottom: "1px solid rgba(201,168,76,0.3)",
              paddingBottom: "4px",
              marginBottom: "8px",
            }}
          >
            Legendary Actions
          </h4>
          {monsterData.legendaryActions.map((a, ai) => (
            <div key={ai} style={{ marginBottom: "6px" }}>
              <span
                style={{
                  color: GOLD_BRIGHT,
                  fontWeight: "bold",
                  fontStyle: "italic",
                  fontFamily: SERIF,
                  fontSize: "13px",
                }}
              >
                {a.name}.{" "}
              </span>
              <span
                style={{ color: GOLD_BRIGHT, fontFamily: SERIF, fontSize: "13px" }}
                dangerouslySetInnerHTML={{ __html: parseTaggedText(a.text) }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EncounterTab({ adventureId, isOwner, acceptedPlayers, adventureMonsters }: EncounterTabProps) {
  const { user } = useAuth();
  const utils = api.useUtils();

  // ---- Queries ----
  const { data: encounter, isLoading } = api.adventure.getEncounter.useQuery(
    { adventureId },
    { refetchInterval: 3000 },
  );

  // ---- Mutations ----
  const invalidateEncounter = () => {
    void utils.adventure.getEncounter.invalidate({ adventureId });
  };

  const createEncounter = api.adventure.createEncounter.useMutation({ onSuccess: invalidateEncounter });
  const endEncounter = api.adventure.endEncounter.useMutation({ onSuccess: invalidateEncounter });
  const addPlayer = api.adventure.addEncounterPlayer.useMutation({ onSuccess: invalidateEncounter });
  const addMonster = api.adventure.addEncounterMonster.useMutation({ onSuccess: invalidateEncounter });
  const removeParticipant = api.adventure.removeParticipant.useMutation({ onSuccess: invalidateEncounter });
  const nextTurn = api.adventure.nextTurn.useMutation({ onSuccess: invalidateEncounter });
  const updateHp = api.adventure.updateParticipantHp.useMutation({ onSuccess: invalidateEncounter });
  const updateConditions = api.adventure.updateParticipantConditions.useMutation({ onSuccess: invalidateEncounter });
  const updateDeathSaves = api.adventure.updateDeathSaves.useMutation({ onSuccess: invalidateEncounter });
  const togglePrivateDeathSaves = api.adventure.togglePrivateDeathSaves.useMutation({ onSuccess: invalidateEncounter });
  const updateInitiative = api.adventure.updateInitiative.useMutation({ onSuccess: invalidateEncounter });

  // ---- Local UI state ----
  const [confirmEnd, setConfirmEnd] = useState(false);

  // Add player form
  const [addPlayerId, setAddPlayerId] = useState("");
  const [addPlayerInit, setAddPlayerInit] = useState("");

  // Add monster form
  const [monsterSearchText, setMonsterSearchText] = useState("");
  const [selectedMonster, setSelectedMonster] = useState<MonsterInfo | null>(null);
  const [monsterName, setMonsterName] = useState("");
  const [monsterSource, setMonsterSource] = useState("");
  const [monsterMaxHp, setMonsterMaxHp] = useState("");
  const [monsterAc, setMonsterAc] = useState("");
  const [monsterInit, setMonsterInit] = useState("");
  const [customMonsterMode, setCustomMonsterMode] = useState(false);
  const [showMonsterDropdown, setShowMonsterDropdown] = useState(false);

  // HP edit
  const [hpEditId, setHpEditId] = useState<string | null>(null);
  const [hpAction, setHpAction] = useState<HpActionType>("damage");
  const [hpAmount, setHpAmount] = useState("");

  // Condition edit
  const [condEditId, setCondEditId] = useState<string | null>(null);

  // Initiative edit
  const [initEditId, setInitEditId] = useState<string | null>(null);
  const [initEditValue, setInitEditValue] = useState("");

  // Expanded monster stat block
  const [expandedMonsterId, setExpandedMonsterId] = useState<string | null>(null);

  // ---- Monster search results ----
  const filteredMonsters = useMemo(() => {
    if (monsterSearchText.length < 2) return [];
    const lower = monsterSearchText.toLowerCase();
    const results: MonsterInfo[] = [];
    for (const m of MONSTER_LIST) {
      if (m.name.toLowerCase().includes(lower)) {
        results.push(m);
        if (results.length >= 50) break;
      }
    }
    return results;
  }, [monsterSearchText]);

  // ---- Derived data ----
  const sortedParticipants = useMemo(() => {
    if (!encounter) return [];
    return [...encounter.participants].sort((a, b) => {
      if (b.initiativeRoll !== a.initiativeRoll) return b.initiativeRoll - a.initiativeRoll;
      return a.sortOrder - b.sortOrder;
    });
  }, [encounter]);

  const participantPlayerIds = useMemo(() => {
    if (!encounter) return new Set<string>();
    return new Set(
      encounter.participants
        .filter((p) => p.type === "PLAYER" && p.adventurePlayerId)
        .map((p) => p.adventurePlayerId!),
    );
  }, [encounter]);

  const availablePlayers = useMemo(() => {
    return acceptedPlayers.filter((p) => !participantPlayerIds.has(p.id));
  }, [acceptedPlayers, participantPlayerIds]);

  // Which participant belongs to the current user?
  const myParticipantIds = useMemo(() => {
    if (!encounter || !user) return new Set<string>();
    const ids = new Set<string>();
    for (const p of encounter.participants) {
      if (p.type === "PLAYER" && p.adventurePlayer?.userId === user.userId) {
        ids.add(p.id);
      }
    }
    return ids;
  }, [encounter, user]);

  // Is it my turn?
  const isMyTurn = useMemo(() => {
    if (!encounter || sortedParticipants.length === 0) return false;
    const current = sortedParticipants[encounter.currentTurnIndex];
    if (!current) return false;
    return myParticipantIds.has(current.id);
  }, [encounter, sortedParticipants, myParticipantIds]);

  // ---- Helpers ----
  function canEditParticipant(participantId: string): boolean {
    if (isOwner) return true;
    return myParticipantIds.has(participantId);
  }

  function getParticipantName(p: (typeof sortedParticipants)[number]): string {
    if (p.type === "PLAYER" && p.adventurePlayer) {
      const charName = p.adventurePlayer.character?.name ?? "Unknown";
      const username = p.adventurePlayer.user.username;
      return `${charName} (${username})`;
    }
    return p.name ?? "Unknown Monster";
  }

  function getMaxHp(p: (typeof sortedParticipants)[number]): number {
    if (p.type === "PLAYER" && p.adventurePlayer?.character) {
      return p.adventurePlayer.character.maxHp;
    }
    return p.maxHp ?? 0;
  }

  function getCurrentHp(p: (typeof sortedParticipants)[number]): number {
    if (p.type === "PLAYER" && p.adventurePlayer?.character) {
      return p.adventurePlayer.character.currentHp;
    }
    return p.currentHp ?? 0;
  }

  function getTempHp(p: (typeof sortedParticipants)[number]): number {
    if (p.type === "PLAYER" && p.adventurePlayer?.character) {
      return p.adventurePlayer.character.tempHp;
    }
    return p.tempHp ?? 0;
  }

  function getAc(p: (typeof sortedParticipants)[number]): number {
    if (p.type === "PLAYER" && p.adventurePlayer?.character) {
      return p.adventurePlayer.character.armorClass;
    }
    return p.armorClass ?? 10;
  }

  function getConditions(p: (typeof sortedParticipants)[number]): string[] {
    if (p.type === "PLAYER" && p.adventurePlayer?.character) {
      const raw = p.adventurePlayer.character.activeConditions;
      if (Array.isArray(raw)) return raw as string[];
      if (typeof raw === "string") {
        try { return JSON.parse(raw) as string[]; } catch { return []; }
      }
      return [];
    }
    if (Array.isArray(p.conditions)) return p.conditions as string[];
    if (typeof p.conditions === "string") {
      try { return JSON.parse(p.conditions) as string[]; } catch { return []; }
    }
    return [];
  }

  // ---- Handlers ----
  function handleAddPlayer() {
    if (!addPlayerId || !addPlayerInit) return;
    addPlayer.mutate({
      adventureId,
      adventurePlayerId: addPlayerId,
      initiativeRoll: Number(addPlayerInit),
    });
    setAddPlayerId("");
    setAddPlayerInit("");
  }

  function handleAddMonster() {
    if (!monsterName || !monsterMaxHp || !monsterAc || !monsterInit) return;
    addMonster.mutate({
      adventureId,
      name: monsterName,
      monsterSource: monsterSource || "",
      maxHp: Number(monsterMaxHp),
      armorClass: Number(monsterAc),
      initiativeRoll: Number(monsterInit),
    });
    setMonsterName("");
    setMonsterSource("");
    setMonsterMaxHp("");
    setMonsterAc("");
    setMonsterInit("");
    setMonsterSearchText("");
    setSelectedMonster(null);
    setCustomMonsterMode(false);
  }

  function handleSelectMonster(m: MonsterInfo) {
    setSelectedMonster(m);
    setMonsterName(m.name);
    setMonsterSource(m.source);
    setMonsterMaxHp(m.hp != null ? String(m.hp) : "");
    setMonsterAc(m.ac != null ? String(m.ac) : "");
    setMonsterInit("");
    setMonsterSearchText(m.name);
    setShowMonsterDropdown(false);
  }

  function handleResetMonsterSearch() {
    setMonsterSearchText("");
    setSelectedMonster(null);
    setMonsterName("");
    setMonsterSource("");
    setMonsterMaxHp("");
    setMonsterAc("");
    setMonsterInit("");
    setCustomMonsterMode(false);
  }

  function handleHpApply(participantId: string) {
    const amt = Number(hpAmount);
    if (!amt || amt <= 0) return;
    updateHp.mutate({ participantId, type: hpAction, amount: amt });
    setHpEditId(null);
    setHpAmount("");
    setHpAction("damage");
  }

  function handleToggleCondition(participantId: string, currentConditions: string[], conditionName: string) {
    const next = currentConditions.includes(conditionName)
      ? currentConditions.filter((c) => c !== conditionName)
      : [...currentConditions, conditionName];
    updateConditions.mutate({ participantId, conditions: next });
  }

  function handleInitiativeUpdate(participantId: string) {
    const val = Number(initEditValue);
    if (isNaN(val)) return;
    updateInitiative.mutate({ participantId, initiativeRoll: val });
    setInitEditId(null);
    setInitEditValue("");
  }

  // ---- Loading state ----
  if (isLoading) {
    return (
      <p style={{ color: GOLD_MUTED, fontSize: "13px", fontFamily: SERIF }}>
        Loading encounter...
      </p>
    );
  }

  // ---- No encounter ----
  if (!encounter) {
    if (isOwner) {
      return (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <p style={{ color: GOLD_MUTED, fontSize: "14px", fontFamily: SERIF, marginBottom: "20px" }}>
            No active encounter. Start one to begin combat tracking.
          </p>
          <button
            onClick={() => createEncounter.mutate({ adventureId })}
            disabled={createEncounter.isPending}
            style={{
              ...goldButtonStyle,
              opacity: createEncounter.isPending ? 0.6 : 1,
              cursor: createEncounter.isPending ? "default" : "pointer",
            }}
          >
            {createEncounter.isPending ? "Starting..." : "Start Encounter"}
          </button>
        </div>
      );
    }

    return (
      <div
        style={{
          background: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(201,168,76,0.2)",
          borderRadius: "12px",
          padding: "40px",
          textAlign: "center",
        }}
      >
        <p style={{ color: GOLD_MUTED, fontSize: "14px", fontFamily: SERIF }}>
          No active encounter.
        </p>
      </div>
    );
  }

  // ---- Active encounter ----
  return (
    <div>
      {/* Round & Turn info */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <h3
            style={{
              color: GOLD,
              fontSize: "16px",
              fontWeight: "bold",
              letterSpacing: "1px",
              textTransform: "uppercase",
              fontFamily: SERIF,
              margin: 0,
            }}
          >
            Encounter
          </h3>
          <span style={{ color: GOLD_BRIGHT, fontSize: "14px", fontFamily: SERIF }}>
            Round {encounter.round}
          </span>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {/* Next Turn */}
          {(isOwner || isMyTurn) && (
            <button
              onClick={() => nextTurn.mutate({ adventureId })}
              disabled={nextTurn.isPending || (!isOwner && !isMyTurn)}
              style={{
                ...goldButtonStyle,
                padding: "8px 20px",
                fontSize: "13px",
                opacity: nextTurn.isPending ? 0.6 : 1,
                cursor: nextTurn.isPending ? "default" : "pointer",
              }}
            >
              Next Turn
            </button>
          )}

          {/* DM-only controls */}
          {isOwner && (
            <>
              <button
                onClick={() => togglePrivateDeathSaves.mutate({ adventureId })}
                disabled={togglePrivateDeathSaves.isPending}
                style={{
                  ...smallButtonStyle,
                  padding: "8px 14px",
                  fontSize: "12px",
                  opacity: togglePrivateDeathSaves.isPending ? 0.6 : 1,
                }}
              >
                Death Saves: {encounter.privateDeathSaves ? "Private" : "Public"}
              </button>

              {!confirmEnd ? (
                <button
                  onClick={() => setConfirmEnd(true)}
                  style={{ ...dangerButtonStyle, padding: "8px 20px", fontSize: "13px" }}
                >
                  End Encounter
                </button>
              ) : (
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <span style={{ color: "#e74c3c", fontSize: "12px", fontFamily: SERIF }}>
                    Confirm?
                  </span>
                  <button
                    onClick={() => { endEncounter.mutate({ adventureId }); setConfirmEnd(false); }}
                    disabled={endEncounter.isPending}
                    style={{
                      ...dangerButtonStyle,
                      padding: "6px 14px",
                      fontSize: "12px",
                      opacity: endEncounter.isPending ? 0.6 : 1,
                    }}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmEnd(false)}
                    style={{ ...smallButtonStyle, padding: "6px 14px", fontSize: "12px" }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Initiative Tracker */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "28px" }}>
        {sortedParticipants.map((p, idx) => {
          const isCurrent = idx === encounter.currentTurnIndex;
          const maxHp = getMaxHp(p);
          const currentHp = getCurrentHp(p);
          const tempHp = getTempHp(p);
          const ac = getAc(p);
          const conditions = getConditions(p);
          const canEdit = canEditParticipant(p.id);
          const isMonster = p.type === "MONSTER";
          const showHpDetails = !isMonster || isOwner;
          const isDown = currentHp <= 0 && p.isActive;
          const isMonsterExpanded = expandedMonsterId === p.id;
          const monsterData = isMonster ? findMonsterData(p.name, p.monsterSource) : undefined;

          let style: React.CSSProperties;
          if (!p.isActive) {
            style = inactiveCardStyle;
          } else if (isCurrent) {
            style = activeCardStyle;
          } else {
            style = cardStyle;
          }

          return (
            <div key={p.id} style={style}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                {/* Initiative number */}
                <div
                  style={{
                    minWidth: "44px",
                    height: "44px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isCurrent ? "rgba(201,168,76,0.2)" : "rgba(0,0,0,0.3)",
                    border: `1px solid ${isCurrent ? GOLD : "rgba(201,168,76,0.15)"}`,
                    borderRadius: "8px",
                    flexShrink: 0,
                  }}
                >
                  {initEditId === p.id ? (
                    <input
                      type="number"
                      value={initEditValue}
                      onChange={(e) => setInitEditValue(e.target.value)}
                      onBlur={() => handleInitiativeUpdate(p.id)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleInitiativeUpdate(p.id); }}
                      autoFocus
                      style={{
                        ...inputStyle,
                        width: "40px",
                        padding: "2px 4px",
                        textAlign: "center",
                        fontSize: "16px",
                        fontWeight: "bold",
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        color: isCurrent ? GOLD : GOLD_BRIGHT,
                        fontSize: "18px",
                        fontWeight: "bold",
                        fontFamily: SERIF,
                        cursor: isOwner ? "pointer" : "default",
                      }}
                      onClick={() => {
                        if (isOwner) {
                          setInitEditId(p.id);
                          setInitEditValue(String(p.initiativeRoll));
                        }
                      }}
                      title={isOwner ? "Click to edit initiative" : undefined}
                    >
                      {p.initiativeRoll}
                    </span>
                  )}
                </div>

                {/* Main info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    {/* Monster name: DM can click to expand */}
                    {isMonster && isOwner ? (
                      <span
                        style={{
                          color: p.isActive ? GOLD_BRIGHT : GOLD_MUTED,
                          fontSize: "14px",
                          fontFamily: SERIF,
                          fontWeight: "bold",
                          cursor: "pointer",
                        }}
                        onClick={() => setExpandedMonsterId(isMonsterExpanded ? null : p.id)}
                        title="Click to expand stat block"
                      >
                        {isMonsterExpanded ? "\u25BC" : "\u25B6"} {getParticipantName(p)}
                      </span>
                    ) : (
                      <span
                        style={{
                          color: p.isActive ? GOLD_BRIGHT : GOLD_MUTED,
                          fontSize: "14px",
                          fontFamily: SERIF,
                          fontWeight: "bold",
                        }}
                      >
                        {getParticipantName(p)}
                      </span>
                    )}

                    {/* Type badge */}
                    <span
                      style={{
                        background: isMonster ? "rgba(192,57,43,0.2)" : "rgba(74,140,63,0.2)",
                        color: isMonster ? "#e74c3c" : "#4a8c3f",
                        fontSize: "10px",
                        fontFamily: SERIF,
                        padding: "2px 8px",
                        borderRadius: "4px",
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                      }}
                    >
                      {p.type === "PLAYER" ? "Player" : "Monster"}
                    </span>

                    {/* AC - only show for players, or for monsters when DM */}
                    {showHpDetails && (
                      <span
                        style={{
                          color: GOLD_MUTED,
                          fontSize: "12px",
                          fontFamily: SERIF,
                        }}
                      >
                        AC: {ac}
                      </span>
                    )}

                    {!p.isActive && (
                      <span
                        style={{
                          color: "#888",
                          fontSize: "10px",
                          fontFamily: SERIF,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        Down
                      </span>
                    )}
                  </div>

                  {/* HP Bar - only show for players, or for monsters when DM */}
                  {showHpDetails && (
                    <div style={{ marginTop: "8px" }}>
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <div
                            style={{
                              flex: 1,
                              height: "10px",
                              background: "rgba(0,0,0,0.5)",
                              borderRadius: "5px",
                              overflow: "hidden",
                              display: "flex",
                            }}
                          >
                            {/* Current HP segment */}
                            <div
                              style={{
                                width: `${Math.max(0, Math.min(100, (currentHp / maxHp) * 100))}%`,
                                height: "100%",
                                background: hpBarColor(currentHp, maxHp),
                                transition: "width 0.3s",
                              }}
                            />
                            {/* Temp HP segment */}
                            {tempHp > 0 && (
                              <div
                                style={{
                                  width: `${Math.min(100 - (currentHp / maxHp) * 100, (tempHp / maxHp) * 100)}%`,
                                  height: "100%",
                                  background: "#3a7bd5",
                                  transition: "width 0.3s",
                                }}
                              />
                            )}
                          </div>
                          <span
                            style={{
                              color: GOLD_BRIGHT,
                              fontSize: "12px",
                              fontFamily: SERIF,
                              minWidth: "80px",
                              textAlign: "right",
                              flexShrink: 0,
                            }}
                          >
                            {currentHp}/{maxHp}
                            {tempHp > 0 && (
                              <span style={{ color: "#3a7bd5" }}> +{tempHp}</span>
                            )}
                          </span>
                        </div>

                        {/* HP edit button */}
                        {canEdit && (
                          <div style={{ marginTop: "6px" }}>
                            {hpEditId === p.id ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                {(["damage", "heal", "setTempHp"] as HpActionType[]).map((action) => (
                                  <button
                                    key={action}
                                    onClick={() => setHpAction(action)}
                                    style={{
                                      ...smallButtonStyle,
                                      background: hpAction === action
                                        ? (action === "damage" ? "rgba(192,57,43,0.3)" : action === "heal" ? "rgba(74,140,63,0.3)" : "rgba(58,123,213,0.3)")
                                        : "none",
                                      color: hpAction === action
                                        ? (action === "damage" ? "#e74c3c" : action === "heal" ? "#4a8c3f" : "#3a7bd5")
                                        : GOLD_MUTED,
                                      borderColor: hpAction === action
                                        ? (action === "damage" ? "#e74c3c" : action === "heal" ? "#4a8c3f" : "#3a7bd5")
                                        : "rgba(201,168,76,0.3)",
                                    }}
                                  >
                                    {action === "damage" ? "Damage" : action === "heal" ? "Heal" : "Temp HP"}
                                  </button>
                                ))}
                                <input
                                  type="number"
                                  min="1"
                                  value={hpAmount}
                                  onChange={(e) => setHpAmount(e.target.value)}
                                  placeholder="Amt"
                                  autoFocus
                                  onKeyDown={(e) => { if (e.key === "Enter") handleHpApply(p.id); }}
                                  style={{ ...inputStyle, width: "60px", padding: "4px 8px", fontSize: "12px" }}
                                />
                                <button
                                  onClick={() => handleHpApply(p.id)}
                                  disabled={updateHp.isPending}
                                  style={{
                                    ...smallButtonStyle,
                                    background: "rgba(201,168,76,0.15)",
                                    color: GOLD,
                                    fontWeight: "bold",
                                    opacity: updateHp.isPending ? 0.6 : 1,
                                  }}
                                >
                                  Apply
                                </button>
                                <button
                                  onClick={() => { setHpEditId(null); setHpAmount(""); setHpAction("damage"); }}
                                  style={{ ...smallButtonStyle, color: "#888" }}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setHpEditId(p.id); setHpAmount(""); setHpAction("damage"); }}
                                style={{ ...smallButtonStyle, fontSize: "10px", padding: "2px 8px" }}
                              >
                                Modify HP
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Conditions */}
                  <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
                    {conditions.map((cond) => (
                      <span
                        key={cond}
                        style={{
                          background: "rgba(201,168,76,0.15)",
                          color: GOLD,
                          fontSize: "10px",
                          fontFamily: SERIF,
                          padding: "2px 8px",
                          borderRadius: "10px",
                          letterSpacing: "0.3px",
                          cursor: canEdit ? "pointer" : "default",
                        }}
                        onClick={() => {
                          if (canEdit) handleToggleCondition(p.id, conditions, cond);
                        }}
                        title={canEdit ? `Click to remove ${cond}` : cond}
                      >
                        {cond}
                        {canEdit && " \u00d7"}
                      </span>
                    ))}
                    {canEdit && (
                      condEditId === p.id ? (
                        <div
                          style={{
                            position: "relative",
                            display: "inline-block",
                          }}
                        >
                          <div
                            style={{
                              position: "absolute",
                              top: "100%",
                              left: 0,
                              zIndex: 100,
                              background: "rgba(15,8,3,0.97)",
                              border: "1px solid rgba(201,168,76,0.4)",
                              borderRadius: "8px",
                              padding: "8px",
                              maxHeight: "200px",
                              overflowY: "auto",
                              width: "180px",
                              marginTop: "4px",
                            }}
                          >
                            {UNIQUE_CONDITION_NAMES.map((cond) => {
                              const active = conditions.includes(cond);
                              return (
                                <button
                                  key={cond}
                                  onClick={() => handleToggleCondition(p.id, conditions, cond)}
                                  style={{
                                    display: "block",
                                    width: "100%",
                                    textAlign: "left",
                                    background: active ? "rgba(201,168,76,0.15)" : "transparent",
                                    border: "none",
                                    color: active ? GOLD : GOLD_BRIGHT,
                                    fontSize: "12px",
                                    fontFamily: SERIF,
                                    padding: "4px 8px",
                                    cursor: "pointer",
                                    borderRadius: "4px",
                                  }}
                                >
                                  {active ? "\u2713 " : ""}{cond}
                                </button>
                              );
                            })}
                            <button
                              onClick={() => setCondEditId(null)}
                              style={{
                                ...smallButtonStyle,
                                marginTop: "6px",
                                width: "100%",
                                textAlign: "center",
                                fontSize: "10px",
                              }}
                            >
                              Close
                            </button>
                          </div>
                          <button
                            onClick={() => setCondEditId(null)}
                            style={{
                              ...smallButtonStyle,
                              fontSize: "10px",
                              padding: "2px 8px",
                              background: "rgba(201,168,76,0.15)",
                              color: GOLD,
                            }}
                          >
                            Close Conditions
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setCondEditId(p.id)}
                          style={{ ...smallButtonStyle, fontSize: "10px", padding: "2px 8px" }}
                        >
                          + Condition
                        </button>
                      )
                    )}
                  </div>

                  {/* Death Saves */}
                  {isDown && p.isActive && (
                    <div style={{ marginTop: "8px" }}>
                      {encounter.privateDeathSaves && !isOwner && !myParticipantIds.has(p.id) ? (
                        <span style={{ color: TEXT_DIM, fontSize: "11px", fontFamily: SERIF, fontStyle: "italic" }}>
                          Death saves hidden
                        </span>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          {/* Successes */}
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ color: "#4a8c3f", fontSize: "10px", fontFamily: SERIF, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                              Saves
                            </span>
                            {[0, 1, 2].map((i) => {
                              const filled = i < (p.deathSaveSuccesses ?? 0);
                              const canMark = canEdit;
                              return (
                                <span
                                  key={`s-${i}`}
                                  onClick={() => {
                                    if (!canMark) return;
                                    const newVal = filled ? i : i + 1;
                                    updateDeathSaves.mutate({
                                      participantId: p.id,
                                      successes: newVal,
                                      failures: p.deathSaveFailures ?? 0,
                                    });
                                  }}
                                  style={{
                                    width: "14px",
                                    height: "14px",
                                    borderRadius: "50%",
                                    border: `2px solid ${filled ? "#4a8c3f" : "rgba(74,140,63,0.3)"}`,
                                    background: filled ? "#4a8c3f" : "transparent",
                                    cursor: canMark ? "pointer" : "default",
                                    display: "inline-block",
                                  }}
                                />
                              );
                            })}
                          </div>

                          {/* Failures */}
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ color: "#e74c3c", fontSize: "10px", fontFamily: SERIF, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                              Fails
                            </span>
                            {[0, 1, 2].map((i) => {
                              const filled = i < (p.deathSaveFailures ?? 0);
                              const canMark = canEdit;
                              return (
                                <span
                                  key={`f-${i}`}
                                  onClick={() => {
                                    if (!canMark) return;
                                    const newVal = filled ? i : i + 1;
                                    updateDeathSaves.mutate({
                                      participantId: p.id,
                                      successes: p.deathSaveSuccesses ?? 0,
                                      failures: newVal,
                                    });
                                  }}
                                  style={{
                                    width: "14px",
                                    height: "14px",
                                    borderRadius: "50%",
                                    border: `2px solid ${filled ? "#e74c3c" : "rgba(231,76,60,0.3)"}`,
                                    background: filled ? "#e74c3c" : "transparent",
                                    cursor: canMark ? "pointer" : "default",
                                    display: "inline-block",
                                  }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* DM remove button */}
                {isOwner && (
                  <button
                    onClick={() => removeParticipant.mutate({ participantId: p.id })}
                    disabled={removeParticipant.isPending}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#e74c3c",
                      fontSize: "16px",
                      cursor: removeParticipant.isPending ? "default" : "pointer",
                      padding: "4px 8px",
                      fontFamily: SERIF,
                      opacity: removeParticipant.isPending ? 0.5 : 1,
                      alignSelf: "flex-start",
                      flexShrink: 0,
                    }}
                    title="Remove from encounter"
                  >
                    x
                  </button>
                )}
              </div>

              {/* Expanded monster stat block (DM only) */}
              {isMonster && isOwner && isMonsterExpanded && monsterData && (
                <MonsterStatBlock monsterData={monsterData} />
              )}

              {isMonster && isOwner && isMonsterExpanded && !monsterData && (
                <div
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(201,168,76,0.15)",
                    borderRadius: "8px",
                    padding: "16px 20px",
                    marginTop: "8px",
                    marginBottom: "4px",
                  }}
                >
                  <p
                    style={{
                      color: TEXT_DIM,
                      fontSize: "13px",
                      fontFamily: SERIF,
                    }}
                  >
                    Monster not found in bestiary data. No stat block available.
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {sortedParticipants.length === 0 && (
          <div
            style={{
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(201,168,76,0.2)",
              borderRadius: "12px",
              padding: "40px",
              textAlign: "center",
            }}
          >
            <p style={{ color: GOLD_MUTED, fontSize: "14px", fontFamily: SERIF }}>
              No participants yet. Add players or monsters below.
            </p>
          </div>
        )}
      </div>

      {/* DM Add forms */}
      {isOwner && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* Add Player */}
          {availablePlayers.length > 0 && (
            <div
              style={{
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(201,168,76,0.15)",
                borderRadius: "8px",
                padding: "16px 20px",
              }}
            >
              <p style={sectionLabelStyle}>Add Player</p>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <select
                  value={addPlayerId}
                  onChange={(e) => setAddPlayerId(e.target.value)}
                  style={{
                    ...inputStyle,
                    minWidth: "180px",
                    cursor: "pointer",
                  }}
                >
                  <option value="">Select player...</option>
                  {availablePlayers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.character?.name ?? "No character"} ({p.user.username})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Initiative"
                  value={addPlayerInit}
                  onChange={(e) => setAddPlayerInit(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddPlayer(); }}
                  style={{ ...inputStyle, width: "90px" }}
                />
                <button
                  onClick={handleAddPlayer}
                  disabled={addPlayer.isPending || !addPlayerId || !addPlayerInit}
                  style={{
                    ...goldButtonStyle,
                    padding: "8px 18px",
                    fontSize: "13px",
                    opacity: addPlayer.isPending || !addPlayerId || !addPlayerInit ? 0.5 : 1,
                    cursor: addPlayer.isPending || !addPlayerId || !addPlayerInit ? "default" : "pointer",
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Add from Adventure Monster List */}
          {adventureMonsters.length > 0 && (
            <div
              style={{
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(201,168,76,0.15)",
                borderRadius: "8px",
                padding: "16px 20px",
              }}
            >
              <p style={sectionLabelStyle}>Add from Adventure Monsters</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "240px", overflowY: "auto" }}>
                {adventureMonsters.map((am) => {
                  const monsterData = MONSTER_LIST.find(
                    (m) => m.name.toLowerCase() === am.name.toLowerCase() && m.source === am.source,
                  ) ?? MONSTER_LIST.find(
                    (m) => m.name.toLowerCase() === am.name.toLowerCase(),
                  );
                  return (
                    <button
                      key={am.id}
                      onClick={() => {
                        if (monsterData) {
                          handleSelectMonster(monsterData);
                        } else {
                          setCustomMonsterMode(true);
                          setMonsterName(am.name);
                          setMonsterSource(am.source);
                          setMonsterMaxHp("");
                          setMonsterAc("");
                          setMonsterInit("");
                        }
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 12px",
                        background: "transparent",
                        border: "none",
                        borderBottom: "1px solid rgba(201,168,76,0.08)",
                        cursor: "pointer",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = "rgba(201,168,76,0.1)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                      }}
                    >
                      <span style={{ color: GOLD_BRIGHT, fontSize: "13px", fontFamily: SERIF, flex: 1 }}>
                        {am.name}
                      </span>
                      {monsterData && (
                        <>
                          <span style={{ color: GOLD_MUTED, fontSize: "11px", fontFamily: SERIF }}>
                            CR {monsterData.cr}
                          </span>
                          <span style={{ color: GOLD_MUTED, fontSize: "11px", fontFamily: SERIF }}>
                            HP {monsterData.hp ?? "—"}
                          </span>
                          <span style={{ color: GOLD_MUTED, fontSize: "11px", fontFamily: SERIF }}>
                            AC {monsterData.ac ?? "—"}
                          </span>
                        </>
                      )}
                      <SourceBadge source={am.source} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add Monster */}
          <div
            style={{
              background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(201,168,76,0.15)",
              borderRadius: "8px",
              padding: "16px 20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <p style={{ ...sectionLabelStyle, marginBottom: 0 }}>Add Monster</p>
              <button
                onClick={() => {
                  if (customMonsterMode) {
                    handleResetMonsterSearch();
                  } else {
                    setCustomMonsterMode(true);
                    setSelectedMonster(null);
                    setMonsterSearchText("");
                    setShowMonsterDropdown(false);
                  }
                }}
                style={{
                  ...smallButtonStyle,
                  fontSize: "10px",
                  padding: "2px 10px",
                }}
              >
                {customMonsterMode ? "Search Bestiary" : "Custom Monster"}
              </button>
            </div>

            {customMonsterMode ? (
              /* Custom monster: manual name + source inputs */
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <input
                  type="text"
                  placeholder="Name"
                  value={monsterName}
                  onChange={(e) => setMonsterName(e.target.value)}
                  style={{ ...inputStyle, minWidth: "140px", flex: 1 }}
                />
                <input
                  type="text"
                  placeholder="Source (optional)"
                  value={monsterSource}
                  onChange={(e) => setMonsterSource(e.target.value)}
                  style={{ ...inputStyle, width: "120px" }}
                />
                <input
                  type="number"
                  placeholder="Max HP"
                  value={monsterMaxHp}
                  onChange={(e) => setMonsterMaxHp(e.target.value)}
                  style={{ ...inputStyle, width: "80px" }}
                />
                <input
                  type="number"
                  placeholder="AC"
                  value={monsterAc}
                  onChange={(e) => setMonsterAc(e.target.value)}
                  style={{ ...inputStyle, width: "60px" }}
                />
                <input
                  type="number"
                  placeholder="Initiative"
                  value={monsterInit}
                  onChange={(e) => setMonsterInit(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddMonster(); }}
                  style={{ ...inputStyle, width: "90px" }}
                />
                <button
                  onClick={handleAddMonster}
                  disabled={addMonster.isPending || !monsterName || !monsterMaxHp || !monsterAc || !monsterInit}
                  style={{
                    ...goldButtonStyle,
                    padding: "8px 18px",
                    fontSize: "13px",
                    opacity: addMonster.isPending || !monsterName || !monsterMaxHp || !monsterAc || !monsterInit ? 0.5 : 1,
                    cursor: addMonster.isPending || !monsterName || !monsterMaxHp || !monsterAc || !monsterInit ? "default" : "pointer",
                  }}
                >
                  Add
                </button>
              </div>
            ) : (
              /* Search-based monster add */
              <div>
                {/* Search input with dropdown */}
                <div style={{ position: "relative", marginBottom: selectedMonster ? "8px" : "0" }}>
                  <input
                    type="text"
                    placeholder="Search monsters..."
                    value={monsterSearchText}
                    onChange={(e) => {
                      setMonsterSearchText(e.target.value);
                      setSelectedMonster(null);
                      setMonsterName("");
                      setMonsterSource("");
                      setMonsterMaxHp("");
                      setMonsterAc("");
                      setShowMonsterDropdown(true);
                    }}
                    onFocus={() => {
                      if (monsterSearchText.length >= 2 && !selectedMonster) {
                        setShowMonsterDropdown(true);
                      }
                    }}
                    style={{ ...inputStyle, width: "100%" }}
                  />

                  {/* Search results dropdown */}
                  {showMonsterDropdown && !selectedMonster && monsterSearchText.length >= 2 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        zIndex: 100,
                        background: "rgba(15,8,3,0.97)",
                        border: "1px solid rgba(201,168,76,0.4)",
                        borderRadius: "8px",
                        maxHeight: "300px",
                        overflowY: "auto",
                        marginTop: "4px",
                      }}
                    >
                      {filteredMonsters.length === 0 ? (
                        <p
                          style={{
                            color: "#a89060",
                            fontSize: "13px",
                            fontFamily: SERIF,
                            textAlign: "center",
                            padding: "16px",
                          }}
                        >
                          No monsters found.
                        </p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0px" }}>
                          {filteredMonsters.map((m, i) => (
                            <button
                              key={`${m.name}-${m.source}-${i}`}
                              onClick={() => handleSelectMonster(m)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                width: "100%",
                                textAlign: "left",
                                padding: "10px 12px",
                                background: "transparent",
                                border: "none",
                                borderBottom: "1px solid rgba(201,168,76,0.1)",
                                cursor: "pointer",
                                transition: "background 0.1s",
                              }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background =
                                  "rgba(201,168,76,0.1)";
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.background =
                                  "transparent";
                              }}
                            >
                              <span
                                style={{
                                  color: "#e8d5a3",
                                  fontSize: "14px",
                                  fontFamily: SERIF,
                                  flex: 1,
                                }}
                              >
                                {m.name}
                              </span>
                              <span
                                style={{
                                  color: "#c9a84c",
                                  fontSize: "11px",
                                  fontFamily: SERIF,
                                  background: "rgba(201,168,76,0.15)",
                                  padding: "2px 8px",
                                  borderRadius: "4px",
                                  fontWeight: "bold",
                                }}
                              >
                                CR {m.cr}
                              </span>
                              <span
                                style={{
                                  color: "#a89060",
                                  fontSize: "12px",
                                  fontFamily: SERIF,
                                  minWidth: "80px",
                                }}
                              >
                                {m.type}
                              </span>
                              <SourceBadge source={m.source} />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected monster: show pre-filled fields */}
                {selectedMonster && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1, minWidth: "180px" }}>
                      <span
                        style={{
                          color: GOLD_BRIGHT,
                          fontSize: "13px",
                          fontFamily: SERIF,
                          fontWeight: "bold",
                        }}
                      >
                        {selectedMonster.name}
                      </span>
                      <SourceBadge source={selectedMonster.source} />
                      <span
                        style={{
                          color: GOLD,
                          fontSize: "11px",
                          fontFamily: SERIF,
                          background: "rgba(201,168,76,0.15)",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontWeight: "bold",
                        }}
                      >
                        CR {selectedMonster.cr}
                      </span>
                      <button
                        onClick={handleResetMonsterSearch}
                        style={{
                          ...smallButtonStyle,
                          fontSize: "10px",
                          padding: "2px 6px",
                          color: "#888",
                        }}
                        title="Clear selection"
                      >
                        x
                      </button>
                    </div>
                    <input
                      type="number"
                      placeholder="Max HP"
                      value={monsterMaxHp}
                      onChange={(e) => setMonsterMaxHp(e.target.value)}
                      style={{ ...inputStyle, width: "80px" }}
                    />
                    <input
                      type="number"
                      placeholder="AC"
                      value={monsterAc}
                      onChange={(e) => setMonsterAc(e.target.value)}
                      style={{ ...inputStyle, width: "60px" }}
                    />
                    <input
                      type="number"
                      placeholder="Initiative"
                      value={monsterInit}
                      onChange={(e) => setMonsterInit(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleAddMonster(); }}
                      autoFocus
                      style={{ ...inputStyle, width: "90px" }}
                    />
                    <button
                      onClick={handleAddMonster}
                      disabled={addMonster.isPending || !monsterName || !monsterMaxHp || !monsterAc || !monsterInit}
                      style={{
                        ...goldButtonStyle,
                        padding: "8px 18px",
                        fontSize: "13px",
                        opacity: addMonster.isPending || !monsterName || !monsterMaxHp || !monsterAc || !monsterInit ? 0.5 : 1,
                        cursor: addMonster.isPending || !monsterName || !monsterMaxHp || !monsterAc || !monsterInit ? "default" : "pointer",
                      }}
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
