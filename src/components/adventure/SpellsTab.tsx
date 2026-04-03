import { useMemo, useState } from "react";
import { api } from "@/utils/api";
import { useSpells } from "@/hooks/useStaticData";
import type { Spell } from "@/lib/spellsData";
import { LoadingSkeleton } from "@/components/ui";
import {
  GOLD,
  GOLD_MUTED,
  GOLD_BRIGHT,
  TEXT_DIM,
  SERIF,
  SourceBadge,
  SearchModal,
} from "./shared";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LEVEL_LABELS = [
  "Cantrip",
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

function spellLevelLabel(level: number): string {
  return LEVEL_LABELS[level] ?? `${level}th`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SpellsTab({
  adventureId,
  spells,
}: {
  adventureId: string;
  spells: { id: string; name: string; source: string }[];
}) {
  const utils = api.useUtils();
  const { data: spellData, isLoading: spellsLoading } = useSpells();
  const [showModal, setShowModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters for the search modal
  const [levelFilter, setLevelFilter] = useState<number | null>(null);
  const [classFilter, setClassFilter] = useState<string>("");

  const addSpell = api.adventure.addSpell.useMutation({
    onSuccess: () => {
      void utils.adventure.getById.invalidate({ id: adventureId });
    },
  });

  const removeSpell = api.adventure.removeSpell.useMutation({
    onSuccess: () => {
      void utils.adventure.getById.invalidate({ id: adventureId });
    },
  });

  if (spellsLoading || !spellData) return <LoadingSkeleton />;
  const { SPELLS } = spellData;

  // Collect unique class names from the full spell list (sorted)
  const ALL_SPELL_CLASSES = useMemo(() => {
    const set = new Set<string>();
    for (const s of SPELLS) {
      for (const c of s.classes) set.add(c);
    }
    return Array.from(set).sort();
  }, [SPELLS]);

  // Search & filter spells for the modal
  const filteredSpells = useMemo(() => {
    if (searchText.length < 2 && levelFilter === null && !classFilter)
      return [];
    const lower = searchText.toLowerCase();
    const results: Spell[] = [];
    for (const s of SPELLS) {
      if (searchText.length >= 2 && !s.name.toLowerCase().includes(lower))
        continue;
      if (levelFilter !== null && s.level !== levelFilter) continue;
      if (
        classFilter &&
        !s.classes.map((c) => c.toLowerCase()).includes(classFilter.toLowerCase())
      )
        continue;
      results.push(s);
      if (results.length >= 80) break;
    }
    return results;
  }, [searchText, levelFilter, classFilter]);

  // Build a set of already-added spell names for quick lookup
  const addedSpellKeys = useMemo(() => {
    const set = new Set<string>();
    for (const s of spells) {
      set.add(`${s.name.toLowerCase()}|${s.source.toLowerCase()}`);
    }
    return set;
  }, [spells]);

  return (
    <div>
      <button
        onClick={() => {
          setSearchText("");
          setLevelFilter(null);
          setClassFilter("");
          setShowModal(true);
        }}
        style={{
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
          marginBottom: "20px",
        }}
      >
        Add Spell
      </button>

      {spells.length === 0 ? (
        <div
          style={{
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(201,168,76,0.2)",
            borderRadius: "12px",
            padding: "40px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              color: "#a89060",
              fontSize: "14px",
              fontFamily: "'Georgia', 'Times New Roman', serif",
            }}
          >
            No spells added yet. Curate the spell list for your players.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {spells.map((spell) => {
            const isExpanded = expandedId === spell.id;
            const spellData = SPELLS.find(
              (s) =>
                s.name.toLowerCase() === spell.name.toLowerCase() &&
                s.source.toLowerCase() === spell.source.toLowerCase(),
            );

            return (
              <div
                key={spell.id}
                style={{
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid rgba(201,168,76,0.2)",
                  borderRadius: "8px",
                  padding: "12px 16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    setExpandedId(isExpanded ? null : spell.id)
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        color: GOLD_BRIGHT,
                        fontSize: "14px",
                        fontFamily: "'Georgia', serif",
                      }}
                    >
                      {isExpanded ? "\u25BC" : "\u25B6"} {spell.name}
                    </span>
                    <SourceBadge source={spell.source} />
                    {spellData && (
                      <>
                        <span
                          style={{
                            color: GOLD,
                            fontSize: "11px",
                            fontFamily: "'Georgia', serif",
                            background: "rgba(201,168,76,0.15)",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontWeight: "bold",
                          }}
                        >
                          {spellLevelLabel(spellData.level)}
                        </span>
                        <span
                          style={{
                            color: GOLD_MUTED,
                            fontSize: "11px",
                            fontFamily: "'Georgia', serif",
                            fontStyle: "italic",
                          }}
                        >
                          {spellData.school}
                        </span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSpell.mutate({ id: spell.id });
                    }}
                    disabled={removeSpell.isPending}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#e74c3c",
                      fontSize: "16px",
                      cursor: removeSpell.isPending ? "default" : "pointer",
                      padding: "4px 8px",
                      fontFamily: "'Georgia', serif",
                      opacity: removeSpell.isPending ? 0.5 : 1,
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
                      padding: "16px 20px",
                      marginTop: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    {/* Level, school, source */}
                    <p
                      style={{
                        color: GOLD_MUTED,
                        fontSize: "13px",
                        fontFamily: SERIF,
                        fontStyle: "italic",
                        marginBottom: "8px",
                      }}
                    >
                      {spellData.level === 0
                        ? `${spellData.school} cantrip`
                        : `${spellLevelLabel(spellData.level)}-level ${spellData.school.toLowerCase()}`}
                    </p>

                    {/* Stats */}
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
                        <span style={{ color: GOLD, fontWeight: "bold" }}>
                          Casting Time{" "}
                        </span>
                        <span style={{ color: GOLD_BRIGHT }}>
                          {spellData.castingTime}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: GOLD, fontWeight: "bold" }}>
                          Range{" "}
                        </span>
                        <span style={{ color: GOLD_BRIGHT }}>
                          {spellData.range}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: GOLD, fontWeight: "bold" }}>
                          Components{" "}
                        </span>
                        <span style={{ color: GOLD_BRIGHT }}>
                          {spellData.components}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: GOLD, fontWeight: "bold" }}>
                          Duration{" "}
                        </span>
                        <span style={{ color: GOLD_BRIGHT }}>
                          {spellData.duration}
                        </span>
                      </div>
                    </div>

                    {/* Divider */}
                    <div
                      style={{
                        height: "1px",
                        background: "rgba(201,168,76,0.2)",
                        margin: "8px 0",
                      }}
                    />

                    {/* Description */}
                    <p
                      style={{
                        color: GOLD_BRIGHT,
                        fontSize: "13px",
                        fontFamily: SERIF,
                        lineHeight: "1.6",
                      }}
                      dangerouslySetInnerHTML={{
                        __html: spellData.description,
                      }}
                    />

                    {spellData.higherLevel && (
                      <div style={{ marginTop: "8px" }}>
                        <span
                          style={{
                            color: GOLD,
                            fontWeight: "bold",
                            fontStyle: "italic",
                            fontFamily: SERIF,
                            fontSize: "13px",
                          }}
                        >
                          At Higher Levels.{" "}
                        </span>
                        <span
                          style={{
                            color: GOLD_BRIGHT,
                            fontFamily: SERIF,
                            fontSize: "13px",
                          }}
                          dangerouslySetInnerHTML={{
                            __html: spellData.higherLevel,
                          }}
                        />
                      </div>
                    )}

                    {/* Classes */}
                    <div style={{ marginTop: "8px" }}>
                      <span
                        style={{
                          color: GOLD,
                          fontWeight: "bold",
                          fontFamily: SERIF,
                          fontSize: "13px",
                        }}
                      >
                        Classes{" "}
                      </span>
                      <span
                        style={{
                          color: TEXT_DIM,
                          fontFamily: SERIF,
                          fontSize: "13px",
                        }}
                      >
                        {spellData.classes.join(", ")}
                      </span>
                    </div>
                  </div>
                )}

                {isExpanded && !spellData && (
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
                      This spell was not found in the spell data.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <SearchModal
        title="Add Spell"
        open={showModal}
        onClose={() => setShowModal(false)}
        searchText={searchText}
        onSearchChange={setSearchText}
        isPending={addSpell.isPending}
      >
        {/* Extra filters: level and class */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "12px",
            flexWrap: "wrap",
          }}
        >
          <select
            value={levelFilter === null ? "" : String(levelFilter)}
            onChange={(e) =>
              setLevelFilter(e.target.value === "" ? null : Number(e.target.value))
            }
            style={{
              background: "rgba(30,15,5,0.9)",
              border: "1px solid rgba(201,168,76,0.4)",
              color: "#e8d5a3",
              fontFamily: "'Georgia', serif",
              borderRadius: "6px",
              padding: "6px 10px",
              fontSize: "12px",
              outline: "none",
            }}
          >
            <option value="">All Levels</option>
            {LEVEL_LABELS.map((label, i) => (
              <option key={i} value={String(i)}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            style={{
              background: "rgba(30,15,5,0.9)",
              border: "1px solid rgba(201,168,76,0.4)",
              color: "#e8d5a3",
              fontFamily: "'Georgia', serif",
              borderRadius: "6px",
              padding: "6px 10px",
              fontSize: "12px",
              outline: "none",
            }}
          >
            <option value="">All Classes</option>
            {ALL_SPELL_CLASSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {searchText.length < 2 && levelFilter === null && !classFilter ? (
          <p
            style={{
              color: "#a89060",
              fontSize: "13px",
              fontFamily: "'Georgia', serif",
              textAlign: "center",
              padding: "20px",
            }}
          >
            Type at least 2 characters or select a filter to search.
          </p>
        ) : filteredSpells.length === 0 ? (
          <p
            style={{
              color: "#a89060",
              fontSize: "13px",
              fontFamily: "'Georgia', serif",
              textAlign: "center",
              padding: "20px",
            }}
          >
            No spells found.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {filteredSpells.map((s, i) => {
              const alreadyAdded = addedSpellKeys.has(
                `${s.name.toLowerCase()}|${s.source.toLowerCase()}`,
              );
              return (
                <button
                  key={`${s.name}-${s.source}-${i}`}
                  onClick={() =>
                    addSpell.mutate({
                      adventureId,
                      name: s.name,
                      source: s.source,
                    })
                  }
                  disabled={addSpell.isPending || alreadyAdded}
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
                    cursor:
                      addSpell.isPending || alreadyAdded
                        ? "default"
                        : "pointer",
                    transition: "background 0.1s",
                    opacity: alreadyAdded ? 0.4 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!alreadyAdded)
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
                      fontFamily: "'Georgia', serif",
                      flex: 1,
                    }}
                  >
                    {s.name}
                    {alreadyAdded && (
                      <span
                        style={{
                          color: GOLD_MUTED,
                          fontSize: "11px",
                          marginLeft: "8px",
                          fontStyle: "italic",
                        }}
                      >
                        (added)
                      </span>
                    )}
                  </span>
                  <span
                    style={{
                      color: "#c9a84c",
                      fontSize: "11px",
                      fontFamily: "'Georgia', serif",
                      background: "rgba(201,168,76,0.15)",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontWeight: "bold",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {spellLevelLabel(s.level)}
                  </span>
                  <span
                    style={{
                      color: "#a89060",
                      fontSize: "12px",
                      fontFamily: "'Georgia', serif",
                      minWidth: "80px",
                    }}
                  >
                    {s.school}
                  </span>
                  <SourceBadge source={s.source} />
                </button>
              );
            })}
          </div>
        )}
      </SearchModal>
    </div>
  );
}
