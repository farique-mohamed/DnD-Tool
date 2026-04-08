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
import { SPELLS } from "@/lib/spellsData";
import { getCharacterFeatSpellGrants, type FeatSpellGrant } from "@/lib/featData";
import { type CharacterData, mod, proficiencyBonus } from "./shared";
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

  // Feat spell grants
  const characterFeats: string[] = (() => {
    try { return character.feats ? JSON.parse(character.feats) as string[] : []; }
    catch { return []; }
  })();
  const featSpellGrants = getCharacterFeatSpellGrants(characterFeats, character.rulesSource ?? "PHB")
    .filter((g) => g.level > 0); // exclude cantrips (at-will)

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

  // Spellcasting stats
  const profBonus = proficiencyBonus(character.level);
  const spellSaveDC = 8 + profBonus + spellAbilityMod;
  const spellAttackBonus = profBonus + spellAbilityMod;
  const spellAbilityLabel = spellAbility.charAt(0).toUpperCase() + spellAbility.slice(1);
  const abilityAbbrev = spellAbility.slice(0, 3).toUpperCase();

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

  // Compute maximum castable spell level from spell slots + feat spell grants
  const maxCastableLevel = (() => {
    let maxLvl = 0;
    if (warlockMode) {
      maxLvl = slots[1] ?? 1;
    } else {
      for (let i = slots.length - 1; i >= 0; i--) {
        if ((slots[i] ?? 0) > 0) {
          maxLvl = i + 1;
          break;
        }
      }
    }
    // Also consider feat-granted spell levels
    for (const g of featSpellGrants) {
      if (g.level > maxLvl) maxLvl = g.level;
    }
    return maxLvl;
  })();

  // Filter spells: if the DM assigned per-player spells, show ONLY those (no class filter).
  // If not in an adventure or DM hasn't assigned spells yet, show all class spells.
  const classSpells = (() => {
    const seen = new Set<string>();
    const deduped: typeof SPELLS = [];

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
    fontFamily: "'EB Garamond', 'Georgia', serif",
  };

  if (warlockMode) {
    const pactCount = slots[0] ?? 0;
    const pactLevel = slots[1] ?? 1;
    const usedCount = localUsed[0] ?? 0;

    return (
      <div>
        <SpellcastingStatsBar
          abilityAbbrev={abilityAbbrev}
          spellAbilityLabel={spellAbilityLabel}
          spellAbilityMod={spellAbilityMod}
          spellSaveDC={spellSaveDC}
          spellAttackBonus={spellAttackBonus}
          profBonus={profBonus}
        />
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
              fontFamily: "'EB Garamond', 'Georgia', serif",
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
              fontFamily: "'EB Garamond', 'Georgia', serif",
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
                fontFamily: "'EB Garamond', 'Georgia', serif",
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
                    fontFamily: "'EB Garamond', 'Georgia', serif",
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
                fontFamily: "'EB Garamond', 'Georgia', serif",
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
                fontFamily: "'EB Garamond', 'Georgia', serif",
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
                fontFamily: "'EB Garamond', 'Georgia', serif",
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
              fontFamily: "'EB Garamond', 'Georgia', serif",
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
              fontFamily: "'EB Garamond', 'Georgia', serif",
              fontStyle: "italic",
              marginTop: "16px",
            }}
          >
            Not in an adventure — all class spells shown
          </p>
        )}

        {/* Feat Spell Slots */}
        <FeatSpellSlotsSection grants={featSpellGrants} featNames={characterFeats} />

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

  const hasClassSlots = activeLevels.length > 0;

  return (
    <div>
      <SpellcastingStatsBar
        abilityAbbrev={abilityAbbrev}
        spellAbilityLabel={spellAbilityLabel}
        spellAbilityMod={spellAbilityMod}
        spellSaveDC={spellSaveDC}
        spellAttackBonus={spellAttackBonus}
        profBonus={profBonus}
      />
      {hasClassSlots && (<>
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
            fontFamily: "'EB Garamond', 'Georgia', serif",
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
                  fontFamily: "'EB Garamond', 'Georgia', serif",
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
                      fontFamily: "'EB Garamond', 'Georgia', serif",
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
                  fontFamily: "'EB Garamond', 'Georgia', serif",
                }}
              >
                {count - usedCount} / {count} remaining
              </span>
            </div>
          );
        })}
      </div>
      </>)}

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
              fontFamily: "'EB Garamond', 'Georgia', serif",
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
              fontFamily: "'EB Garamond', 'Georgia', serif",
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
            fontFamily: "'EB Garamond', 'Georgia', serif",
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
            fontFamily: "'EB Garamond', 'Georgia', serif",
            fontStyle: "italic",
            marginTop: "16px",
          }}
        >
          Not in an adventure — all class spells shown
        </p>
      )}

      {/* Feat Spell Slots */}
      <FeatSpellSlotsSection grants={featSpellGrants} featNames={characterFeats} />

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

// ---------------------------------------------------------------------------
// Spellcasting Stats Bar — displays ability, save DC, and attack bonus
// ---------------------------------------------------------------------------

function SpellcastingStatsBar({
  abilityAbbrev,
  spellAbilityLabel,
  spellAbilityMod,
  spellSaveDC,
  spellAttackBonus,
  profBonus,
}: {
  abilityAbbrev: string;
  spellAbilityLabel: string;
  spellAbilityMod: number;
  spellSaveDC: number;
  spellAttackBonus: number;
  profBonus: number;
}) {
  const boxStyle: React.CSSProperties = {
    flex: 1,
    minWidth: "120px",
    background: "rgba(0,0,0,0.5)",
    border: "1px solid rgba(201,168,76,0.3)",
    borderRadius: "10px",
    padding: "14px 18px",
    textAlign: "center",
  };
  const labelStyle: React.CSSProperties = {
    color: "#a89060",
    fontSize: "10px",
    fontFamily: "'EB Garamond', 'Georgia', serif",
    letterSpacing: "1px",
    textTransform: "uppercase",
    marginBottom: "6px",
  };
  const valueStyle: React.CSSProperties = {
    color: "#c9a84c",
    fontSize: "20px",
    fontWeight: "bold",
    fontFamily: "'EB Garamond', 'Georgia', serif",
  };
  const subStyle: React.CSSProperties = {
    color: "#a89060",
    fontSize: "10px",
    fontFamily: "'EB Garamond', 'Georgia', serif",
    marginTop: "2px",
  };

  const fmtMod = (v: number) => (v >= 0 ? `+${v}` : `${v}`);

  return (
    <div style={{
      display: "flex",
      gap: "12px",
      marginBottom: "20px",
      flexWrap: "wrap",
    }}>
      {/* Spellcasting Ability */}
      <div style={boxStyle}>
        <p style={labelStyle}>Spellcasting Ability</p>
        <p style={valueStyle}>{abilityAbbrev}</p>
        <p style={{ ...subStyle, color: "#e8d5a3", fontSize: "11px" }}>
          {spellAbilityLabel} ({fmtMod(spellAbilityMod)})
        </p>
      </div>

      {/* Spell Save DC */}
      <div style={boxStyle}>
        <p style={labelStyle}>Spell Save DC</p>
        <p style={valueStyle}>{spellSaveDC}</p>
        <p style={subStyle}>8 + {profBonus} + {fmtMod(spellAbilityMod)}</p>
      </div>

      {/* Spell Attack Bonus */}
      <div style={boxStyle}>
        <p style={labelStyle}>Spell Attack</p>
        <p style={valueStyle}>{fmtMod(spellAttackBonus)}</p>
        <p style={subStyle}>Prof + {abilityAbbrev} mod</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Feat Spell Slots Section — shows spell slots granted by feats
// ---------------------------------------------------------------------------

function FeatSpellSlotsSection({
  grants,
  featNames,
}: {
  grants: FeatSpellGrant[];
  featNames: string[];
}) {
  if (grants.length === 0) return null;

  const levelOrdinals = ["Cantrip", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th"];
  const frequencyLabel = (f: string) => {
    switch (f) {
      case "daily": return "1/Long Rest";
      case "rest": return "1/Short Rest";
      case "at-will": return "At Will";
      default: return f;
    }
  };

  // Group grants by spell level
  const byLevel = new Map<number, { count: number; frequency: string; canUseSlots: boolean }[]>();
  for (const g of grants) {
    const existing = byLevel.get(g.level) ?? [];
    existing.push({ count: g.count, frequency: g.frequency, canUseSlots: g.canUseSlots });
    byLevel.set(g.level, existing);
  }

  return (
    <div style={{ marginTop: "20px" }}>
      <p style={{
        color: "#c9a84c",
        fontSize: "12px",
        fontWeight: "bold",
        letterSpacing: "2px",
        textTransform: "uppercase",
        marginBottom: "12px",
        paddingBottom: "8px",
        borderBottom: "1px solid rgba(201,168,76,0.2)",
        fontFamily: "'EB Garamond', 'Georgia', serif",
      }}>
        Feat Spells
      </p>
      <p style={{
        color: "#a89060",
        fontSize: "11px",
        fontFamily: "'EB Garamond', 'Georgia', serif",
        marginBottom: "12px",
        fontStyle: "italic",
      }}>
        Spells granted by: {featNames.join(", ")}. Your DM will add the specific spells.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {[...byLevel.entries()].sort(([a], [b]) => a - b).map(([level, entries]) => (
          <div
            key={level}
            style={{
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(201,168,76,0.3)",
              borderRadius: "10px",
              padding: "12px 18px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <span style={{
              color: "#b8934a",
              fontSize: "12px",
              fontFamily: "'EB Garamond', 'Georgia', serif",
              minWidth: "100px",
              fontWeight: "bold",
            }}>
              {levelOrdinals[level] ?? `${level}th`} Level
            </span>
            {entries.map((entry, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "28px",
                  height: "28px",
                  border: "1px solid rgba(100,149,237,0.5)",
                  borderRadius: "50%",
                  color: "#6495ed",
                  fontSize: "14px",
                  fontFamily: "'EB Garamond', 'Georgia', serif",
                }}>
                  {entry.count}
                </span>
                <span style={{
                  fontSize: "10px",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  background: entry.frequency === "rest" ? "rgba(91,155,213,0.12)" : "rgba(74,124,42,0.12)",
                  border: `1px solid ${entry.frequency === "rest" ? "rgba(91,155,213,0.3)" : "rgba(74,124,42,0.3)"}`,
                  color: entry.frequency === "rest" ? "#5b9bd5" : "#4a7c2a",
                  fontFamily: "'EB Garamond', 'Georgia', serif",
                }}>
                  {frequencyLabel(entry.frequency)}
                </span>
                {entry.canUseSlots && (
                  <span style={{
                    color: "#a89060",
                    fontSize: "10px",
                    fontFamily: "'EB Garamond', 'Georgia', serif",
                    fontStyle: "italic",
                  }}>
                    + can use spell slots
                  </span>
                )}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

