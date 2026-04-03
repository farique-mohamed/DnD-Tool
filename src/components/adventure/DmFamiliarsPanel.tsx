import { useMemo, useState } from "react";
import { api } from "@/utils/api";
import { MONSTER_LIST, type MonsterInfo } from "@/lib/bestiaryData";
import {
  GOLD,
  GOLD_MUTED,
  GOLD_BRIGHT,
  SERIF,
  SourceBadge,
  SearchModal,
} from "./shared";
import { findMonsterData, MonsterStatBlock } from "./MonsterStatBlock";

type Familiar = {
  id: string;
  monsterName: string;
  monsterSource: string;
  displayName: string;
  notes: string | null;
  createdAt: string | Date;
};

export function DmFamiliarsPanel({
  adventurePlayerId,
}: {
  adventurePlayerId: string;
}) {
  const utils = api.useUtils();
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [selectedMonster, setSelectedMonster] = useState<MonsterInfo | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [notes, setNotes] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");

  const { data: familiars = [], isLoading } =
    api.adventure.getFamiliars.useQuery(
      { adventurePlayerId },
      { enabled: !!adventurePlayerId },
    );

  const typedFamiliars = familiars as unknown as Familiar[];

  const addFamiliar = api.adventure.addFamiliar.useMutation({
    onSuccess: () => {
      void utils.adventure.getFamiliars.invalidate({ adventurePlayerId });
      setSelectedMonster(null);
      setDisplayName("");
      setNotes("");
      setShowAddModal(false);
    },
  });

  const removeFamiliar = api.adventure.removeFamiliar.useMutation({
    onSuccess: () => {
      void utils.adventure.getFamiliars.invalidate({ adventurePlayerId });
    },
  });

  // Already-assigned familiar names for dimming in modal
  const assignedNames = useMemo(
    () => new Set(typedFamiliars.map((f) => f.monsterName.toLowerCase())),
    [typedFamiliars],
  );

  // All monsters, deduplicated by name
  const allMonsters = useMemo(() => {
    const seen = new Set<string>();
    const deduped: MonsterInfo[] = [];
    for (const monster of MONSTER_LIST) {
      if (!seen.has(monster.name)) {
        seen.add(monster.name);
        deduped.push(monster);
      }
    }
    return deduped;
  }, []);

  // Filter for the add-familiar modal
  const addFilteredResults = useMemo(() => {
    if (addSearch.length < 2) return [];
    const lower = addSearch.toLowerCase();
    return allMonsters
      .filter((m) => m.name.toLowerCase().includes(lower))
      .slice(0, 50);
  }, [allMonsters, addSearch]);

  // Filter the assigned-familiar list
  const filteredAssigned = useMemo(() => {
    if (!searchText.trim()) return typedFamiliars;
    const lower = searchText.toLowerCase();
    return typedFamiliars.filter(
      (f) =>
        f.displayName.toLowerCase().includes(lower) ||
        f.monsterName.toLowerCase().includes(lower),
    );
  }, [typedFamiliars, searchText]);

  function handleAddFamiliar() {
    if (!selectedMonster) return;
    addFamiliar.mutate({
      adventurePlayerId,
      monsterName: selectedMonster.name,
      displayName: displayName.trim() || selectedMonster.name,
      monsterSource: selectedMonster.source,
      notes: notes.trim() || undefined,
    });
  }

  if (isLoading) {
    return (
      <p style={{ color: GOLD_MUTED, fontSize: "13px", fontFamily: SERIF }}>
        Loading familiars...
      </p>
    );
  }

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
            setSelectedMonster(null);
            setDisplayName("");
            setNotes("");
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
          Add Familiar
        </button>
        <span
          style={{
            color: GOLD_MUTED,
            fontSize: "12px",
            fontFamily: SERIF,
            alignSelf: "center",
          }}
        >
          {typedFamiliars.length} familiar{typedFamiliars.length !== 1 ? "s" : ""} assigned
        </span>
      </div>

      {/* Search */}
      {typedFamiliars.length > 0 && (
        <input
          type="text"
          placeholder="Search familiars..."
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

      {/* Assigned familiars list */}
      {typedFamiliars.length === 0 ? (
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
          No familiars assigned to this player yet.
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
          No familiars match your search.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {filteredAssigned.map((fam) => {
            const monsterData = findMonsterData(fam.monsterName, fam.monsterSource);
            const isExpanded = expandedId === fam.id;

            return (
              <div
                key={fam.id}
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
                    onClick={() => setExpandedId(isExpanded ? null : fam.id)}
                  >
                    <span
                      style={{
                        color: GOLD_BRIGHT,
                        fontSize: "13px",
                        fontFamily: SERIF,
                      }}
                    >
                      {isExpanded ? "\u25BC" : "\u25B6"} {fam.displayName}
                    </span>
                    {fam.displayName !== fam.monsterName && (
                      <span
                        style={{
                          color: GOLD_MUTED,
                          fontSize: "11px",
                          fontFamily: SERIF,
                          fontStyle: "italic",
                        }}
                      >
                        ({fam.monsterName})
                      </span>
                    )}
                    <SourceBadge source={fam.monsterSource} />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFamiliar.mutate({ id: fam.id });
                    }}
                    disabled={removeFamiliar.isPending}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#e74c3c",
                      fontSize: "14px",
                      cursor: removeFamiliar.isPending ? "default" : "pointer",
                      padding: "4px 6px",
                      fontFamily: SERIF,
                      opacity: removeFamiliar.isPending ? 0.5 : 1,
                    }}
                    title="Remove familiar"
                  >
                    x
                  </button>
                </div>

                {/* Notes */}
                {isExpanded && fam.notes && (
                  <p
                    style={{
                      color: GOLD_MUTED,
                      fontSize: "12px",
                      fontFamily: SERIF,
                      fontStyle: "italic",
                      marginTop: "6px",
                      marginBottom: "4px",
                    }}
                  >
                    {fam.notes}
                  </p>
                )}

                {/* Monster stat block */}
                {isExpanded && monsterData && (
                  <MonsterStatBlock monsterData={monsterData} />
                )}

                {isExpanded && !monsterData && (
                  <p
                    style={{
                      color: GOLD_MUTED,
                      fontSize: "12px",
                      fontFamily: SERIF,
                      fontStyle: "italic",
                      marginTop: "8px",
                    }}
                  >
                    Monster data not found in bestiary.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Familiar Modal */}
      <SearchModal
        title="Add Familiar"
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        searchText={addSearch}
        onSearchChange={setAddSearch}
        isPending={addFamiliar.isPending}
      >
        {/* If a monster is selected, show the add form */}
        {selectedMonster ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              padding: "8px 0",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(201,168,76,0.1)",
                border: "1px solid rgba(201,168,76,0.3)",
                borderRadius: "8px",
                padding: "10px 14px",
              }}
            >
              <div>
                <span
                  style={{
                    color: GOLD_BRIGHT,
                    fontSize: "14px",
                    fontFamily: SERIF,
                    fontWeight: "bold",
                  }}
                >
                  {selectedMonster.name}
                </span>
                <span style={{ marginLeft: "8px" }}>
                  <SourceBadge source={selectedMonster.source} />
                </span>
                <span
                  style={{
                    color: GOLD_MUTED,
                    fontSize: "11px",
                    fontFamily: SERIF,
                    marginLeft: "8px",
                  }}
                >
                  {selectedMonster.size} {selectedMonster.type}
                </span>
              </div>
              <button
                onClick={() => setSelectedMonster(null)}
                style={{
                  background: "none",
                  border: "1px solid rgba(201,168,76,0.3)",
                  color: GOLD_MUTED,
                  borderRadius: "4px",
                  padding: "4px 10px",
                  fontFamily: SERIF,
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                Change
              </button>
            </div>

            <div>
              <label
                style={{
                  color: GOLD_MUTED,
                  fontSize: "11px",
                  fontFamily: SERIF,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  marginBottom: "4px",
                  display: "block",
                }}
              >
                Display Name
              </label>
              <input
                type="text"
                placeholder={selectedMonster.name}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
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
                }}
              />
            </div>

            <div>
              <label
                style={{
                  color: GOLD_MUTED,
                  fontSize: "11px",
                  fontFamily: SERIF,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  marginBottom: "4px",
                  display: "block",
                }}
              >
                Notes (optional)
              </label>
              <textarea
                placeholder="Any notes about this familiar..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
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
                  resize: "vertical",
                }}
              />
            </div>

            <button
              onClick={handleAddFamiliar}
              disabled={addFamiliar.isPending}
              style={{
                background: "linear-gradient(135deg, #8b6914, #c9a84c)",
                color: "#1a1a2e",
                border: "none",
                borderRadius: "6px",
                padding: "10px 20px",
                fontSize: "13px",
                fontFamily: SERIF,
                fontWeight: "bold",
                cursor: addFamiliar.isPending ? "default" : "pointer",
                letterSpacing: "0.5px",
                opacity: addFamiliar.isPending ? 0.5 : 1,
                alignSelf: "flex-start",
              }}
            >
              {addFamiliar.isPending ? "Adding..." : "Add Familiar"}
            </button>
          </div>
        ) : (
          <>
            {/* Monster search results */}
            {addSearch.length < 2 ? (
              <p
                style={{
                  color: GOLD_MUTED,
                  fontSize: "13px",
                  fontFamily: SERIF,
                  textAlign: "center",
                  padding: "20px",
                }}
              >
                Type at least 2 characters to search for a monster.
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
                No monsters found.
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
                {addFilteredResults.map((monster, i) => {
                  const isAssigned = assignedNames.has(
                    monster.name.toLowerCase(),
                  );

                  return (
                    <button
                      key={`${monster.name}-${monster.source}-${i}`}
                      onClick={() => {
                        if (!isAssigned) {
                          setSelectedMonster(monster);
                          setDisplayName("");
                          setNotes("");
                        }
                      }}
                      disabled={isAssigned}
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
                        cursor: isAssigned ? "default" : "pointer",
                        opacity: isAssigned ? 0.4 : 1,
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => {
                        if (!isAssigned) {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "rgba(201,168,76,0.1)";
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
                        {monster.name}
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
                          color: GOLD_MUTED,
                          fontSize: "11px",
                          fontFamily: SERIF,
                          minWidth: "80px",
                        }}
                      >
                        {monster.size} {monster.type}
                      </span>
                      <SourceBadge source={monster.source} />
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </SearchModal>
    </div>
  );
}
