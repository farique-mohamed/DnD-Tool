import { useState } from "react";
import { api } from "@/utils/api";
import { getSpellSlots, isSpellcaster, isWarlock } from "@/lib/spellSlotData";
import { SPELLS } from "@/lib/spellsData";
import { type CharacterData, mod } from "./shared";
import { SpellSelectionSection } from "./SpellSelectionSection";

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

const PREPARED_CASTERS = ["Cleric", "Druid", "Paladin", "Wizard", "Artificer"];


export function SpellsTab({ character }: { character: CharacterData }) {
  const utils = api.useUtils();
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
  const isPreparedCaster = PREPARED_CASTERS.includes(character.characterClass);
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
  const preparedMax = isPreparedCaster
    ? Math.max(
        1,
        character.characterClass === "Artificer"
          ? spellAbilityMod + Math.floor(character.level / 2)
          : spellAbilityMod + character.level,
      )
    : null;

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

  // Filter spells for this class, deduplicate by name (keep first occurrence)
  const classSpells = (() => {
    const all = SPELLS.filter((s) =>
      s.classes
        .map((c) => c.toLowerCase())
        .includes(character.characterClass.toLowerCase()),
    );
    const seen = new Set<string>();
    const deduped: typeof all = [];
    for (const spell of all) {
      if (!seen.has(spell.name)) {
        seen.add(spell.name);
        deduped.push(spell);
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
    const next = localPrepared.includes(spellName)
      ? localPrepared.filter((s) => s !== spellName)
      : [...localPrepared, spellName];
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
          isPreparedCaster={isPreparedCaster}
          preparedMax={preparedMax}
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
        isPreparedCaster={isPreparedCaster}
        preparedMax={preparedMax}
      />
    </div>
  );
}

