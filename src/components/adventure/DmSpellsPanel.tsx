import { useMemo, useState } from "react";
import { api } from "@/utils/api";
import { useSpells } from "@/hooks/useStaticData";
import type { Spell } from "@/lib/spellsData";
import { LoadingSkeleton } from "@/components/ui";
import {
  GOLD,
  GOLD_MUTED,
  GOLD_BRIGHT,
  SERIF,
  SourceBadge,
  SearchModal,
} from "./shared";

const SCHOOL_COLORS: Record<string, string> = {
  Abjuration: "#5b9bd5",
  Conjuration: "#e2b714",
  Divination: "#a89060",
  Enchantment: "#bb8fd9",
  Evocation: "#e74c3c",
  Illusion: "#9b59b6",
  Necromancy: "#7f8c8d",
  Transmutation: "#27ae60",
};

export function DmSpellsPanel({
  adventurePlayerId,
  adventureId,
  characterClass,
}: {
  adventurePlayerId: string;
  adventureId: string;
  characterClass: string;
}) {
  const utils = api.useUtils();
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [addLevelFilter, setAddLevelFilter] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");

  const { data: playerSpells = [], isLoading } =
    api.adventure.getPlayerSpells.useQuery(
      { adventurePlayerId },
      { enabled: !!adventurePlayerId },
    );

  type PlayerSpell = {
    id: string;
    spellName: string;
    spellSource: string;
    createdAt: string | Date;
  };

  const typedSpells = playerSpells as unknown as PlayerSpell[];

  const addPlayerSpell = api.adventure.addPlayerSpell.useMutation({
    onSuccess: () => {
      void utils.adventure.getPlayerSpells.invalidate({ adventurePlayerId });
    },
  });

  const removePlayerSpell = api.adventure.removePlayerSpell.useMutation({
    onSuccess: () => {
      void utils.adventure.getPlayerSpells.invalidate({ adventurePlayerId });
    },
  });

  const { data: spellHookData, isLoading: spellsHookLoading } = useSpells();

  if (spellsHookLoading || !spellHookData) return <LoadingSkeleton />;
  const { SPELLS } = spellHookData;

  // Already-assigned spell names for dimming in modal
  const assignedNames = useMemo(
    () => new Set(typedSpells.map((s) => s.spellName.toLowerCase())),
    [typedSpells],
  );

  // All spells, deduplicated by name (DM sees every class)
  const allSpells = useMemo(() => {
    const seen = new Set<string>();
    const deduped: Spell[] = [];
    for (const spell of SPELLS) {
      if (!seen.has(spell.name)) {
        seen.add(spell.name);
        deduped.push(spell);
      }
    }
    return deduped;
  }, []);

  // Filter for the add-spell modal
  const addFilteredResults = useMemo(() => {
    if (addSearch.length < 2 && addLevelFilter === null) return [];
    let results = allSpells;
    if (addSearch.length >= 2) {
      const lower = addSearch.toLowerCase();
      results = results.filter((s) => s.name.toLowerCase().includes(lower));
    }
    if (addLevelFilter !== null) {
      results = results.filter((s) => s.level === addLevelFilter);
    }
    return results.slice(0, 50);
  }, [allSpells, addSearch, addLevelFilter]);

  // Filter the assigned-spell list
  const filteredAssigned = useMemo(() => {
    if (!searchText.trim()) return typedSpells;
    const lower = searchText.toLowerCase();
    return typedSpells.filter((s) => s.spellName.toLowerCase().includes(lower));
  }, [typedSpells, searchText]);

  // Resolve spell data from the SPELLS array
  const resolveSpell = (name: string, source: string): Spell | undefined =>
    SPELLS.find(
      (s) =>
        s.name.toLowerCase() === name.toLowerCase() &&
        s.source.toLowerCase() === source.toLowerCase(),
    ) ?? SPELLS.find((s) => s.name.toLowerCase() === name.toLowerCase());

  if (isLoading) {
    return (
      <p style={{ color: GOLD_MUTED, fontSize: "13px", fontFamily: SERIF }}>
        Loading spells...
      </p>
    );
  }

  const levelLabel = (lvl: number) => (lvl === 0 ? "Cantrip" : `Level ${lvl}`);

  return (
    <div>
      {/* Action buttons */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => {
            setAddSearch("");
            setAddLevelFilter(null);
            setShowAddModal(true);
          }}
          style={{
            background: "linear-gradient(135deg, #8b6914, #c9a84c)",
            color: "#1a1a2e",
            border: "none",
            borderRadius: "6px",
            padding: "8px 16px",
            fontSize: "12px",
            fontFamily: SERIF,
            fontWeight: "bold",
            cursor: "pointer",
            letterSpacing: "0.5px",
          }}
        >
          Add Spell
        </button>
        {characterClass && (
          <span
            style={{
              color: GOLD_MUTED,
              fontSize: "12px",
              fontFamily: SERIF,
              alignSelf: "center",
            }}
          >
            All spells ({allSpells.length} available)
          </span>
        )}
      </div>

      {/* Search */}
      {typedSpells.length > 0 && (
        <input
          type="text"
          placeholder="Search assigned spells..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            background: "rgba(30,15,5,0.9)",
            border: "1px solid rgba(201,168,76,0.4)",
            color: GOLD_BRIGHT,
            fontFamily: SERIF,
            borderRadius: "6px",
            padding: "8px 12px",
            width: "100%",
            fontSize: "13px",
            boxSizing: "border-box",
            outline: "none",
            marginBottom: "12px",
          }}
        />
      )}

      {/* Assigned spells list */}
      {typedSpells.length === 0 ? (
        <p
          style={{
            color: GOLD_MUTED,
            fontSize: "13px",
            fontFamily: SERIF,
            fontStyle: "italic",
            textAlign: "center",
            padding: "20px",
          }}
        >
          No spells assigned to this player yet.
        </p>
      ) : filteredAssigned.length === 0 ? (
        <p
          style={{
            color: GOLD_MUTED,
            fontSize: "13px",
            fontFamily: SERIF,
            textAlign: "center",
            padding: "20px",
          }}
        >
          No spells match your search.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {filteredAssigned.map((ps) => {
            const spellData = resolveSpell(ps.spellName, ps.spellSource);
            const isExpanded = expandedId === ps.id;
            const schoolColor =
              spellData && SCHOOL_COLORS[spellData.school]
                ? SCHOOL_COLORS[spellData.school]
                : GOLD_MUTED;

            return (
              <div
                key={ps.id}
                style={{
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid rgba(201,168,76,0.2)",
                  borderRadius: "8px",
                  padding: "10px 14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      flex: 1,
                      cursor: "pointer",
                      flexWrap: "wrap",
                    }}
                    onClick={() => setExpandedId(isExpanded ? null : ps.id)}
                  >
                    <span
                      style={{
                        color: GOLD_BRIGHT,
                        fontSize: "13px",
                        fontFamily: SERIF,
                      }}
                    >
                      {isExpanded ? "\u25BC" : "\u25B6"} {ps.spellName}
                    </span>
                    {spellData && (
                      <>
                        <span
                          style={{
                            color: GOLD,
                            fontSize: "10px",
                            fontFamily: SERIF,
                            background: "rgba(201,168,76,0.15)",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontWeight: "bold",
                          }}
                        >
                          {levelLabel(spellData.level)}
                        </span>
                        <span
                          style={{
                            color: schoolColor,
                            fontSize: "10px",
                            fontFamily: SERIF,
                            background: `${schoolColor}20`,
                            padding: "2px 8px",
                            borderRadius: "4px",
                          }}
                        >
                          {spellData.school}
                        </span>
                      </>
                    )}
                    <SourceBadge source={ps.spellSource} />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removePlayerSpell.mutate({ id: ps.id });
                    }}
                    disabled={removePlayerSpell.isPending}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#e74c3c",
                      fontSize: "14px",
                      cursor: removePlayerSpell.isPending ? "default" : "pointer",
                      padding: "4px 6px",
                      fontFamily: SERIF,
                      opacity: removePlayerSpell.isPending ? 0.5 : 1,
                    }}
                    title="Remove spell"
                  >
                    x
                  </button>
                </div>

                {isExpanded && spellData && (
                  <div
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(201,168,76,0.15)",
                      borderRadius: "8px",
                      padding: "12px 16px",
                      marginTop: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "6px 16px",
                        marginBottom: "10px",
                        fontSize: "12px",
                        fontFamily: SERIF,
                      }}
                    >
                      <div>
                        <span style={{ color: GOLD_MUTED }}>Casting Time: </span>
                        <span style={{ color: GOLD_BRIGHT }}>{spellData.castingTime}</span>
                      </div>
                      <div>
                        <span style={{ color: GOLD_MUTED }}>Range: </span>
                        <span style={{ color: GOLD_BRIGHT }}>{spellData.range}</span>
                      </div>
                      <div>
                        <span style={{ color: GOLD_MUTED }}>Duration: </span>
                        <span style={{ color: GOLD_BRIGHT }}>{spellData.duration}</span>
                      </div>
                      <div>
                        <span style={{ color: GOLD_MUTED }}>Components: </span>
                        <span style={{ color: GOLD_BRIGHT }}>{spellData.components}</span>
                      </div>
                    </div>
                    <p
                      style={{
                        color: GOLD_BRIGHT,
                        fontSize: "12px",
                        fontFamily: SERIF,
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                        margin: 0,
                      }}
                      dangerouslySetInnerHTML={{ __html: spellData.description }}
                    />
                    {spellData.higherLevel && (
                      <p
                        style={{
                          color: GOLD_MUTED,
                          fontSize: "12px",
                          fontFamily: SERIF,
                          lineHeight: 1.6,
                          marginTop: "8px",
                          fontStyle: "italic",
                        }}
                      >
                        <strong>At Higher Levels.</strong> {spellData.higherLevel}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Spell Modal */}
      <SearchModal
        title="Add Spell"
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        searchText={addSearch}
        onSearchChange={setAddSearch}
        isPending={addPlayerSpell.isPending}
      >
        {/* Spell level filter */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            marginBottom: "12px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => setAddLevelFilter(null)}
            style={{
              padding: "4px 10px",
              background:
                addLevelFilter === null
                  ? "rgba(201,168,76,0.3)"
                  : "transparent",
              border: "1px solid rgba(201,168,76,0.3)",
              borderRadius: "4px",
              color: addLevelFilter === null ? GOLD : GOLD_MUTED,
              fontSize: "11px",
              fontFamily: SERIF,
              cursor: "pointer",
              fontWeight: addLevelFilter === null ? "bold" : "normal",
            }}
          >
            All
          </button>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => (
            <button
              key={lvl}
              onClick={() =>
                setAddLevelFilter(addLevelFilter === lvl ? null : lvl)
              }
              style={{
                padding: "4px 10px",
                background:
                  addLevelFilter === lvl
                    ? "rgba(201,168,76,0.3)"
                    : "transparent",
                border: "1px solid rgba(201,168,76,0.3)",
                borderRadius: "4px",
                color: addLevelFilter === lvl ? GOLD : GOLD_MUTED,
                fontSize: "11px",
                fontFamily: SERIF,
                cursor: "pointer",
                fontWeight: addLevelFilter === lvl ? "bold" : "normal",
              }}
            >
              {lvl === 0 ? "Cantrip" : `Lv ${lvl}`}
            </button>
          ))}
        </div>

        {addSearch.length < 2 && addLevelFilter === null ? (
          <p
            style={{
              color: GOLD_MUTED,
              fontSize: "13px",
              fontFamily: SERIF,
              textAlign: "center",
              padding: "20px",
            }}
          >
            Type at least 2 characters or select a spell level to search.
          </p>
        ) : addFilteredResults.length === 0 ? (
          <p
            style={{
              color: GOLD_MUTED,
              fontSize: "13px",
              fontFamily: SERIF,
              textAlign: "center",
              padding: "20px",
            }}
          >
            No spells found.
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              overflowY: "auto",
              flex: 1,
              minHeight: 0,
            }}
          >
            {addFilteredResults.map((spell, i) => {
              const isAssigned = assignedNames.has(spell.name.toLowerCase());
              const schoolColor = SCHOOL_COLORS[spell.school] ?? GOLD_MUTED;

              return (
                <button
                  key={`${spell.name}-${spell.source}-${i}`}
                  onClick={() => {
                    if (!isAssigned) {
                      addPlayerSpell.mutate({
                        adventurePlayerId,
                        spellName: spell.name,
                        spellSource: spell.source,
                      });
                    }
                  }}
                  disabled={addPlayerSpell.isPending || isAssigned}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 12px",
                    background: "transparent",
                    border: "none",
                    borderBottom: "1px solid rgba(201,168,76,0.1)",
                    cursor:
                      addPlayerSpell.isPending || isAssigned
                        ? "default"
                        : "pointer",
                    opacity: isAssigned ? 0.4 : 1,
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isAssigned) {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        "rgba(201,168,76,0.1)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      "transparent";
                  }}
                >
                  <span
                    style={{
                      color: GOLD_BRIGHT,
                      fontSize: "13px",
                      fontFamily: SERIF,
                      flex: 1,
                    }}
                  >
                    {spell.name}
                    {isAssigned && (
                      <span
                        style={{
                          color: GOLD_MUTED,
                          fontSize: "10px",
                          marginLeft: "8px",
                          fontStyle: "italic",
                        }}
                      >
                        (assigned)
                      </span>
                    )}
                  </span>
                  <span
                    style={{
                      color: GOLD,
                      fontSize: "10px",
                      fontFamily: SERIF,
                      minWidth: "50px",
                      textAlign: "center",
                    }}
                  >
                    {levelLabel(spell.level)}
                  </span>
                  <span
                    style={{
                      color: schoolColor,
                      fontSize: "10px",
                      fontFamily: SERIF,
                      minWidth: "80px",
                      textAlign: "center",
                    }}
                  >
                    {spell.school}
                  </span>
                  <SourceBadge source={spell.source} />
                </button>
              );
            })}
          </div>
        )}
      </SearchModal>
    </div>
  );
}
