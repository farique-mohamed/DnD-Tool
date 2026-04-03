import { useState } from "react";
import { api } from "@/utils/api";
import {
  getSpellSlots,
  isSpellcaster,
  isWarlock,
  getCantripsKnown,
  getSpellsKnownOrPrepared,
  getSpellManagementType,
} from "@/lib/spellSlotData";
import { useSpells } from "@/hooks/useStaticData";
import type { Spell } from "@/lib/spellsData";
import { LoadingSkeleton } from "@/components/ui";
import { type CharacterData, mod } from "./shared";
import { SpellSelectionSection } from "./SpellSelectionSection";
import { getAutoKnownCantrips } from "@/lib/autoKnownSpells";

export { isSpellcaster };

const SPELLCASTING_ABILITY: Record<string, string> = {
  Artificer: "intelligence",
  Bard: "charisma",
  Cleric: "wisdom",
  Druid: "wisdom",
  Paladin: "charisma",
  Ranger: "wisdom",
  Sorcerer: "charisma",
  Warlock: "charisma",
  Wizard: "intelligence",
};

export function SpellsTab({ character }: { character: CharacterData }) {
  const utils = api.useUtils();
  const { data: spellHookData, isLoading: spellsHookLoading } = useSpells();

  // Per-player spell filtering
  const activeAdventure = character.adventurePlayers?.find(
    (ap) => ap.status === "ACCEPTED",
  );
  const adventurePlayerId = activeAdventure?.id;
  const adventureId = activeAdventure?.adventure?.id;

  const { data: playerSpells } = api.adventure.getPlayerSpells.useQuery(
    { adventurePlayerId: adventurePlayerId! },
    { enabled: !!adventurePlayerId },
  );

  const isInAdventure = !!adventureId;
  const hasPlayerSpells =
    isInAdventure && playerSpells && playerSpells.length > 0;
  const slots = getSpellSlots(character.characterClass, character.level);
  const warlockMode = isWarlock(character.characterClass);

  const usedRaw: number[] = (() => {
    try {
      const parsed: unknown = JSON.parse(character.spellSlotsUsed || "[]");
      return Array.isArray(parsed) ? (parsed as number[]) : [];
    } catch {
      return [];
    }
  })();
  const [localUsed, setLocalUsed] = useState<number[]>(
    Array.from({ length: 9 }, (_, i) => usedRaw[i] ?? 0),
  );

  // Prepared spells state
  const [localPrepared, setLocalPrepared] = useState<string[]>(() => {
    try {
      return JSON.parse(character.preparedSpells || "[]") as string[];
    } catch {
      return [];
    }
  });
  const [browseMode, setBrowseMode] = useState(false);
  const [spellSearch, setSpellSearch] = useState("");
  const [spellLevelFilter, setSpellLevelFilter] = useState<number | null>(null);

  const updateSpellSlots = api.character.updateSpellSlots.useMutation({
    onSuccess: async () => {
      await utils.character.getById.invalidate({ id: character.id });
    },
  });

  const updatePreparedSpells = api.character.updatePreparedSpells.useMutation({
    onSuccess: async () => {
      await utils.character.getById.invalidate({ id: character.id });
    },
  });

  if (spellsHookLoading || !spellHookData) return <LoadingSkeleton />;
  const { SPELLS } = spellHookData;

  const toggleSlot = (levelIdx: number, slotIdx: number) => {
    const current = localUsed[levelIdx] ?? 0;
    const maxSlots = slots[levelIdx] ?? 0;
    let newUsed: number;
    if (slotIdx < current) {
      newUsed = current - 1;
    } else {
      newUsed = Math.min(current + 1, maxSlots);
    }
    const next = localUsed.map((v, i) => (i === levelIdx ? newUsed : v));
    setLocalUsed(next);
    updateSpellSlots.mutate({ id: character.id, spellSlotsUsed: next });
  };

  const handleLongRest = () => {
    const zeros = new Array(9).fill(0) as number[];
    setLocalUsed(zeros);
    updateSpellSlots.mutate({ id: character.id, spellSlotsUsed: zeros });
  };

  // Spell management
  const spellAbility =
    SPELLCASTING_ABILITY[character.characterClass] ?? "intelligence";
  const abilityScores: Record<string, number> = {
    strength: character.strength,
    dexterity: character.dexterity,
    constitution: character.constitution,
    intelligence: character.intelligence,
    wisdom: character.wisdom,
    charisma: character.charisma,
  };
  const spellAbilityMod = mod(abilityScores[spellAbility] ?? 10);

  // Data-driven spell limits
  const cantripsMax = getCantripsKnown(
    character.characterClass,
    character.level,
    character.rulesSource,
  );
  const spellManagement = getSpellManagementType(character.characterClass);
  const spellsMax = getSpellsKnownOrPrepared(
    character.characterClass,
    character.level,
    spellAbilityMod,
    character.rulesSource,
  );

  // Auto-known cantrips (free, don't count against limit)
  const autoCantrips = getAutoKnownCantrips(
    character.characterClass,
    character.subclass,
    character.rulesSource,
  );

  // Compute maximum castable spell level from spell slots
  const maxCastableLevel = (() => {
    if (warlockMode) {
      // For warlocks, slots[1] is the pact slot level
      return slots[1] ?? 1;
    }
    // Standard casters: find the highest index where slots > 0, then level = index + 1
    let maxLvl = 0;
    for (let i = slots.length - 1; i >= 0; i--) {
      if ((slots[i] ?? 0) > 0) {
        maxLvl = i + 1;
        break;
      }
    }
    return maxLvl;
  })();

  // Filter spells: if the DM assigned per-player spells, show ONLY those (no class filter).
  // If not in an adventure or DM hasn't assigned spells yet, show all class spells.
  const classSpells = (() => {
    const seen = new Set<string>();
    const deduped: Spell[] = [];

    if (hasPlayerSpells) {
      // DM-curated: only show exactly what the DM assigned (any class)
      const playerSpellNames = new Set(
        (playerSpells as Array<{ spellName: string }>).map((s) =>
          s.spellName.toLowerCase(),
        ),
      );
      for (const spell of SPELLS) {
        if (playerSpellNames.has(spell.name.toLowerCase()) && !seen.has(spell.name)) {
          seen.add(spell.name);
          deduped.push(spell);
        }
      }
    } else {
      // No DM spells: show all spells matching the character's class
      for (const spell of SPELLS) {
        if (
          spell.classes.map((c) => c.toLowerCase()).includes(character.characterClass.toLowerCase()) &&
          !seen.has(spell.name)
        ) {
          seen.add(spell.name);
          deduped.push(spell);
        }
      }
    }

    return deduped;
  })();

  const filteredSpells = classSpells.filter((s) => {
    // Only show spells the character can actually cast (cantrips always, plus up to maxCastableLevel)
    if (s.level > 0 && s.level > maxCastableLevel) return false;
    const matchesSearch =
      !spellSearch || s.name.toLowerCase().includes(spellSearch.toLowerCase());
    const matchesLevel =
      spellLevelFilter === null || s.level === spellLevelFilter;
    return matchesSearch && matchesLevel;
  });

  const toggleSpell = (spellName: string) => {
    // If removing, always allow
    if (localPrepared.includes(spellName)) {
      const next = localPrepared.filter((s) => s !== spellName);
      setLocalPrepared(next);
      updatePreparedSpells.mutate({ id: character.id, preparedSpells: next });
      return;
    }

    // Adding — check limits
    const spellData = SPELLS.find((s) => s.name === spellName);
    if (spellData) {
      const isCantrip = spellData.level === 0;
      if (isCantrip && cantripsMax > 0) {
        // Auto-known cantrips don't count against the limit
        const currentCantrips = localPrepared.filter((n) => {
          const s = SPELLS.find((sp) => sp.name === n);
          return s && s.level === 0 && !autoCantrips.includes(n);
        }).length;
        if (currentCantrips >= cantripsMax) return; // at limit
      }
      if (!isCantrip && spellsMax !== null) {
        const currentLeveled = localPrepared.filter((n) => {
          const s = SPELLS.find((sp) => sp.name === n);
          return s && s.level > 0;
        }).length;
        if (currentLeveled >= spellsMax) return; // at limit
      }
    }

    const next = [...localPrepared, spellName];
    setLocalPrepared(next);
    updatePreparedSpells.mutate({ id: character.id, preparedSpells: next });
  };

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

  if (warlockMode) {
    const pactCount = slots[0] ?? 0;
    const pactLevel = slots[1] ?? 1;
    const usedCount = localUsed[0] ?? 0;

    return (
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <p style={sectionTitle}>Pact Magic Slots</p>
          <button
            onClick={handleLongRest}
            disabled={updateSpellSlots.isPending}
            style={{
              background: "transparent",
              border: "1px solid rgba(201,168,76,0.4)",
              color: "#c9a84c",
              borderRadius: "6px",
              padding: "6px 16px",
              fontSize: "12px",
              fontFamily: "'Georgia', serif",
              cursor: "pointer",
              letterSpacing: "0.5px",
            }}
          >
            Short/Long Rest (Restore All)
          </button>
        </div>

        <div
          style={{
            background: "rgba(0,0,0,0.5)",
            border: "1px solid rgba(201,168,76,0.3)",
            borderRadius: "10px",
            padding: "18px 20px",
          }}
        >
          <p
            style={{
              color: "#a89060",
              fontSize: "12px",
              fontFamily: "'Georgia', serif",
              marginBottom: "12px",
            }}
          >
            {pactCount} slot{pactCount !== 1 ? "s" : ""} at spell level{" "}
            {pactLevel} — recharges on short or long rest
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                color: "#b8934a",
                fontSize: "12px",
                fontFamily: "'Georgia', serif",
                minWidth: "120px",
              }}
            >
              Pact Slots (Lv {pactLevel})
            </span>
            <div style={{ display: "flex", gap: "6px" }}>
              {Array.from({ length: pactCount }, (_, j) => (
                <button
                  key={j}
                  onClick={() => toggleSlot(0, j)}
                  title={j < usedCount ? "Click to restore" : "Click to use"}
                  style={{
                    background:
                      j < usedCount ? "rgba(201,168,76,0.4)" : "transparent",
                    border: "1px solid #c9a84c",
                    borderRadius: "50%",
                    width: "28px",
                    height: "28px",
                    color: j < usedCount ? "#8b6914" : "#c9a84c",
                    cursor: "pointer",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Georgia', serif",
                  }}
                >
                  {j < usedCount ? "●" : "○"}
                </button>
              ))}
            </div>
            <span
              style={{
                color: "#a89060",
                fontSize: "12px",
                fontFamily: "'Georgia', serif",
              }}
            >
              {pactCount - usedCount} / {pactCount} remaining
            </span>
          </div>
        </div>

        {/* Player spell status */}
        {hasPlayerSpells && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "16px",
              padding: "8px 14px",
              background: "rgba(201,168,76,0.08)",
              border: "1px solid rgba(201,168,76,0.25)",
              borderRadius: "6px",
            }}
          >
            <span
              style={{
                background: "rgba(201,168,76,0.25)",
                color: "#c9a84c",
                fontSize: "10px",
                fontFamily: "'Georgia', serif",
                padding: "2px 8px",
                borderRadius: "4px",
                letterSpacing: "0.5px",
                textTransform: "uppercase",
                fontWeight: "bold",
              }}
            >
              DM Curated
            </span>
            <span
              style={{
                color: "#a89060",
                fontSize: "12px",
                fontFamily: "'Georgia', serif",
              }}
            >
              Spells assigned to you by your DM
            </span>
          </div>
        )}
        {isInAdventure && !hasPlayerSpells && (
          <p
            style={{
              color: "#a89060",
              fontSize: "12px",
              fontFamily: "'Georgia', serif",
              fontStyle: "italic",
              marginTop: "16px",
            }}
          >
            Your DM hasn&apos;t assigned spells to your character yet — showing all class spells
          </p>
        )}
        {!isInAdventure && (
          <p
            style={{
              color: "#a89060",
              fontSize: "12px",
              fontFamily: "'Georgia', serif",
              fontStyle: "italic",
              marginTop: "16px",
            }}
          >
            Not in an adventure — all class spells shown
          </p>
        )}

        {/* Spell selection for Warlock */}
        <SpellSelectionSection
          character={character}
          localPrepared={localPrepared}
          browseMode={browseMode}
          setBrowseMode={setBrowseMode}
          spellSearch={spellSearch}
          setSpellSearch={setSpellSearch}
          spellLevelFilter={spellLevelFilter}
          setSpellLevelFilter={setSpellLevelFilter}
          filteredSpells={filteredSpells}
          toggleSpell={toggleSpell}
          cantripsMax={cantripsMax}
          spellsMax={spellsMax}
          spellManagement={spellManagement}
          autoCantrips={autoCantrips}
        />
      </div>
    );
  }

  // Standard caster
  const activeLevels = slots
    .map((count, i) => ({ count, i }))
    .filter(({ count }) => count > 0);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "4px",
        }}
      >
        <p style={sectionTitle}>Spell Slots</p>
        <button
          onClick={handleLongRest}
          disabled={updateSpellSlots.isPending}
          style={{
            background: "transparent",
            border: "1px solid rgba(201,168,76,0.4)",
            color: "#c9a84c",
            borderRadius: "6px",
            padding: "6px 16px",
            fontSize: "12px",
            fontFamily: "'Georgia', serif",
            cursor: "pointer",
            letterSpacing: "0.5px",
            marginBottom: "16px",
          }}
        >
          Long Rest (Restore All)
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {activeLevels.map(({ count, i }) => {
          const usedCount = localUsed[i] ?? 0;
          const levelOrdinals = [
            "1st",
            "2nd",
            "3rd",
            "4th",
            "5th",
            "6th",
            "7th",
            "8th",
            "9th",
          ];
          return (
            <div
              key={i}
              style={{
                background: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(201,168,76,0.3)",
                borderRadius: "10px",
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  color: "#b8934a",
                  fontSize: "12px",
                  fontFamily: "'Georgia', serif",
                  minWidth: "100px",
                  fontWeight: "bold",
                }}
              >
                {levelOrdinals[i]} Level
              </span>
              <div style={{ display: "flex", gap: "6px" }}>
                {Array.from({ length: count }, (_, j) => (
                  <button
                    key={j}
                    onClick={() => toggleSlot(i, j)}
                    title={j < usedCount ? "Click to restore" : "Click to use"}
                    style={{
                      background:
                        j < usedCount ? "rgba(201,168,76,0.4)" : "transparent",
                      border: "1px solid #c9a84c",
                      borderRadius: "50%",
                      width: "28px",
                      height: "28px",
                      color: j < usedCount ? "#8b6914" : "#c9a84c",
                      cursor: "pointer",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "'Georgia', serif",
                    }}
                  >
                    {j < usedCount ? "●" : "○"}
                  </button>
                ))}
              </div>
              <span
                style={{
                  color: "#a89060",
                  fontSize: "12px",
                  fontFamily: "'Georgia', serif",
                }}
              >
                {count - usedCount} / {count} remaining
              </span>
            </div>
          );
        })}
      </div>

      {/* Player spell status */}
      {hasPlayerSpells && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "16px",
            padding: "8px 14px",
            background: "rgba(201,168,76,0.08)",
            border: "1px solid rgba(201,168,76,0.25)",
            borderRadius: "6px",
          }}
        >
          <span
            style={{
              background: "rgba(201,168,76,0.25)",
              color: "#c9a84c",
              fontSize: "10px",
              fontFamily: "'Georgia', serif",
              padding: "2px 8px",
              borderRadius: "4px",
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              fontWeight: "bold",
            }}
          >
            DM Curated
          </span>
          <span
            style={{
              color: "#a89060",
              fontSize: "12px",
              fontFamily: "'Georgia', serif",
            }}
          >
            Spells assigned to you by your DM
          </span>
        </div>
      )}
      {isInAdventure && !hasPlayerSpells && (
        <p
          style={{
            color: "#a89060",
            fontSize: "12px",
            fontFamily: "'Georgia', serif",
            fontStyle: "italic",
            marginTop: "16px",
          }}
        >
          Your DM hasn&apos;t assigned spells to your character yet — showing all class spells
        </p>
      )}
      {!isInAdventure && (
        <p
          style={{
            color: "#a89060",
            fontSize: "12px",
            fontFamily: "'Georgia', serif",
            fontStyle: "italic",
            marginTop: "16px",
          }}
        >
          Not in an adventure — all class spells shown
        </p>
      )}

      {/* Spell selection */}
      <SpellSelectionSection
        character={character}
        localPrepared={localPrepared}
        browseMode={browseMode}
        setBrowseMode={setBrowseMode}
        spellSearch={spellSearch}
        setSpellSearch={setSpellSearch}
        spellLevelFilter={spellLevelFilter}
        setSpellLevelFilter={setSpellLevelFilter}
        filteredSpells={filteredSpells}
        toggleSpell={toggleSpell}
        cantripsMax={cantripsMax}
        spellsMax={spellsMax}
        spellManagement={spellManagement}
        autoCantrips={autoCantrips}
      />
    </div>
  );
}

