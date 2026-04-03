import { useMemo, useState } from "react";
import { api } from "@/utils/api";
import { MONSTER_LIST, type MonsterInfo, abilityMod } from "@/lib/bestiaryData";
import { parseTaggedText } from "@/lib/dndTagParser";
import {
  GOLD,
  GOLD_MUTED,
  GOLD_BRIGHT,
  TEXT_DIM,
  SERIF,
  findSectionIndex,
  SourceBadge,
  SearchModal,
} from "./shared";

export function MonstersTab({
  adventureId,
  adventureSource,
  monsters,
  onViewInStory,
}: {
  adventureId: string;
  adventureSource: string;
  monsters: { id: string; name: string; source: string; createdAt: Date }[];
  onViewInStory: (sectionIndex: number) => void;
}) {
  const utils = api.useUtils();
  const [showModal, setShowModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const addMonster = api.adventure.addMonster.useMutation({
    onSuccess: () => {
      void utils.adventure.getById.invalidate({ id: adventureId });
      setShowModal(false);
      setSearchText("");
    },
  });

  const removeMonster = api.adventure.removeMonster.useMutation({
    onSuccess: () => {
      void utils.adventure.getById.invalidate({ id: adventureId });
    },
  });

  const filteredMonsters = useMemo(() => {
    if (searchText.length < 2) return [];
    const lower = searchText.toLowerCase();
    const results: MonsterInfo[] = [];
    for (const m of MONSTER_LIST) {
      if (m.name.toLowerCase().includes(lower)) {
        results.push(m);
        if (results.length >= 50) break;
      }
    }
    return results;
  }, [searchText]);

  return (
    <div>
      <button
        onClick={() => {
          setSearchText("");
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
        Add Monster
      </button>

      {monsters.length === 0 ? (
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
            No monsters added yet. Add some foes to this adventure.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {monsters.map((monster) => {
            const isExpanded = expandedId === monster.id;
            const monsterData = MONSTER_LIST.find(
              (m) => m.name.toLowerCase() === monster.name.toLowerCase(),
            );
            const storyRef = !monsterData
              ? findSectionIndex(adventureSource, "creature", monster.name)
              : null;

            return (
              <div
                key={monster.id}
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
                    setExpandedId(isExpanded ? null : monster.id)
                  }
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <span
                      style={{
                        color: GOLD_BRIGHT,
                        fontSize: "14px",
                        fontFamily: "'Georgia', serif",
                      }}
                    >
                      {isExpanded ? "\u25BC" : "\u25B6"} {monster.name}
                    </span>
                    <SourceBadge source={monster.source} />
                    {monsterData && (
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
                        CR {monsterData.cr}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMonster.mutate({ id: monster.id });
                    }}
                    disabled={removeMonster.isPending}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#e74c3c",
                      fontSize: "16px",
                      cursor: removeMonster.isPending
                        ? "default"
                        : "pointer",
                      padding: "4px 8px",
                      fontFamily: "'Georgia', serif",
                      opacity: removeMonster.isPending ? 0.5 : 1,
                    }}
                    title="Remove monster"
                  >
                    x
                  </button>
                </div>

                {isExpanded && monsterData && (
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
                      {monsterData.alignment
                        ? `, ${monsterData.alignment}`
                        : ""}
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
                        <span style={{ color: GOLD, fontWeight: "bold" }}>
                          Armor Class{" "}
                        </span>
                        <span style={{ color: GOLD_BRIGHT }}>
                          {monsterData.ac ?? "\u2014"}
                          {monsterData.acNote
                            ? ` (${monsterData.acNote})`
                            : ""}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: GOLD, fontWeight: "bold" }}>
                          Hit Points{" "}
                        </span>
                        <span style={{ color: GOLD_BRIGHT }}>
                          {monsterData.hp ?? "\u2014"}
                          {monsterData.hpFormula
                            ? ` (${monsterData.hpFormula})`
                            : ""}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: GOLD, fontWeight: "bold" }}>
                          Speed{" "}
                        </span>
                        <span style={{ color: GOLD_BRIGHT }}>
                          {monsterData.speed || "\u2014"}
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
                      {(
                        ["str", "dex", "con", "int", "wis", "cha"] as const
                      ).map((ab) => (
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
                          <div
                            style={{
                              color: GOLD_BRIGHT,
                              fontSize: "14px",
                              fontWeight: "bold",
                            }}
                          >
                            {monsterData[ab]}
                          </div>
                          <div
                            style={{
                              color: TEXT_DIM,
                              fontSize: "11px",
                            }}
                          >
                            ({abilityMod(monsterData[ab])})
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Divider */}
                    <div
                      style={{
                        height: "1px",
                        background: "rgba(201,168,76,0.2)",
                        margin: "8px 0",
                      }}
                    />

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
                          <span style={{ color: GOLD, fontWeight: "bold" }}>
                            Saving Throws{" "}
                          </span>
                          <span style={{ color: GOLD_BRIGHT }}>
                            {monsterData.savingThrows}
                          </span>
                        </div>
                      )}
                      {monsterData.skills && (
                        <div>
                          <span style={{ color: GOLD, fontWeight: "bold" }}>
                            Skills{" "}
                          </span>
                          <span style={{ color: GOLD_BRIGHT }}>
                            {monsterData.skills}
                          </span>
                        </div>
                      )}
                      {monsterData.damageResistances && (
                        <div>
                          <span style={{ color: GOLD, fontWeight: "bold" }}>
                            Damage Resistances{" "}
                          </span>
                          <span style={{ color: GOLD_BRIGHT }}>
                            {monsterData.damageResistances}
                          </span>
                        </div>
                      )}
                      {monsterData.damageImmunities && (
                        <div>
                          <span style={{ color: GOLD, fontWeight: "bold" }}>
                            Damage Immunities{" "}
                          </span>
                          <span style={{ color: GOLD_BRIGHT }}>
                            {monsterData.damageImmunities}
                          </span>
                        </div>
                      )}
                      {monsterData.conditionImmunities && (
                        <div>
                          <span style={{ color: GOLD, fontWeight: "bold" }}>
                            Condition Immunities{" "}
                          </span>
                          <span style={{ color: GOLD_BRIGHT }}>
                            {monsterData.conditionImmunities}
                          </span>
                        </div>
                      )}
                      {monsterData.senses && (
                        <div>
                          <span style={{ color: GOLD, fontWeight: "bold" }}>
                            Senses{" "}
                          </span>
                          <span style={{ color: GOLD_BRIGHT }}>
                            {monsterData.senses}
                          </span>
                        </div>
                      )}
                      {monsterData.languages && (
                        <div>
                          <span style={{ color: GOLD, fontWeight: "bold" }}>
                            Languages{" "}
                          </span>
                          <span style={{ color: GOLD_BRIGHT }}>
                            {monsterData.languages}
                          </span>
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
                              style={{
                                color: GOLD_BRIGHT,
                                fontFamily: SERIF,
                                fontSize: "13px",
                              }}
                              dangerouslySetInnerHTML={{
                                __html: parseTaggedText(t.text),
                              }}
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
                              style={{
                                color: GOLD_BRIGHT,
                                fontFamily: SERIF,
                                fontSize: "13px",
                              }}
                              dangerouslySetInnerHTML={{
                                __html: parseTaggedText(a.text),
                              }}
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
                              style={{
                                color: GOLD_BRIGHT,
                                fontFamily: SERIF,
                                fontSize: "13px",
                              }}
                              dangerouslySetInnerHTML={{
                                __html: parseTaggedText(a.text),
                              }}
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
                              style={{
                                color: GOLD_BRIGHT,
                                fontFamily: SERIF,
                                fontSize: "13px",
                              }}
                              dangerouslySetInnerHTML={{
                                __html: parseTaggedText(a.text),
                              }}
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
                              style={{
                                color: GOLD_BRIGHT,
                                fontFamily: SERIF,
                                fontSize: "13px",
                              }}
                              dangerouslySetInnerHTML={{
                                __html: parseTaggedText(a.text),
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {isExpanded && !monsterData && storyRef && (
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
                        marginBottom: "8px",
                      }}
                    >
                      This monster was not found in the bestiary data.
                    </p>
                    <button
                      onClick={() => onViewInStory(storyRef.sectionIndex)}
                      style={{
                        background: "none",
                        border: "none",
                        color: GOLD,
                        cursor: "pointer",
                        fontFamily: "'Georgia', serif",
                        fontSize: "13px",
                        padding: "0",
                        textDecoration: "underline",
                      }}
                    >
                      View in Story ({storyRef.sectionName})
                    </button>
                  </div>
                )}

                {isExpanded && !monsterData && !storyRef && (
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
                      This monster was not found in the bestiary data or the
                      adventure story.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <SearchModal
        title="Add Monster"
        open={showModal}
        onClose={() => setShowModal(false)}
        searchText={searchText}
        onSearchChange={setSearchText}
        isPending={addMonster.isPending}
      >
        {searchText.length < 2 ? (
          <p
            style={{
              color: "#a89060",
              fontSize: "13px",
              fontFamily: "'Georgia', serif",
              textAlign: "center",
              padding: "20px",
            }}
          >
            Type at least 2 characters to search.
          </p>
        ) : filteredMonsters.length === 0 ? (
          <p
            style={{
              color: "#a89060",
              fontSize: "13px",
              fontFamily: "'Georgia', serif",
              textAlign: "center",
              padding: "20px",
            }}
          >
            No monsters found.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {filteredMonsters.map((m, i) => (
              <button
                key={`${m.name}-${m.source}-${i}`}
                onClick={() =>
                  addMonster.mutate({
                    adventureId,
                    name: m.name,
                    source: m.source,
                  })
                }
                disabled={addMonster.isPending}
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
                  cursor: addMonster.isPending ? "default" : "pointer",
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
                    fontFamily: "'Georgia', serif",
                    flex: 1,
                  }}
                >
                  {m.name}
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
                  }}
                >
                  CR {m.cr}
                </span>
                <span
                  style={{
                    color: "#a89060",
                    fontSize: "12px",
                    fontFamily: "'Georgia', serif",
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
      </SearchModal>
    </div>
  );
}
