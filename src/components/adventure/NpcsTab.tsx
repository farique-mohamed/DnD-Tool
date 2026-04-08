import { useState, useCallback, useEffect } from "react";
import { api } from "@/utils/api";
import type { NpcData } from "@/lib/npcData";
import { NpcGenerator } from "./NpcGenerator";
import {
  GOLD,
  GOLD_MUTED,
  GOLD_BRIGHT,
  TEXT_DIM,
  SERIF,
} from "./shared";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NpcRecord {
  id: string;
  name: string;
  race: string;
  gender: string;
  alignment: string;
  occupation: string;
  location: string;
  personalityTraits: string;   // JSON string
  appearance: string;
  voiceMannerism: string;
  background: string;
  motivation: string;
  secret: string;
  notes: string;
  isVisible: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseTraits(raw: string): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function recordToNpcData(rec: NpcRecord): NpcData {
  return {
    name: rec.name,
    race: rec.race,
    gender: rec.gender,
    alignment: rec.alignment,
    occupation: rec.occupation,
    location: rec.location ?? "",
    personalityTraits: parseTraits(rec.personalityTraits),
    appearance: rec.appearance,
    voiceMannerism: rec.voiceMannerism,
    background: rec.background,
    motivation: rec.motivation,
    secret: rec.secret,
    notes: rec.notes,
    isVisible: rec.isVisible ?? false,
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NpcsTab({ adventureId, isOwner = true }: { adventureId: string; isOwner?: boolean }) {
  const utils = api.useUtils();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingNpc, setEditingNpc] = useState<(NpcData & { id: string }) | null>(null);
  const [searchText, setSearchText] = useState("");

  // Data
  const { data: npcs = [], isLoading } = api.adventure.getNpcs.useQuery({ adventureId });

  // Mutations (only used by DM)
  const addNpc = api.adventure.addNpc.useMutation({
    onSuccess: () => {
      void utils.adventure.getNpcs.invalidate({ adventureId });
      setShowModal(false);
    },
  });

  const updateNpc = api.adventure.updateNpc.useMutation({
    onSuccess: () => {
      void utils.adventure.getNpcs.invalidate({ adventureId });
      setEditingNpc(null);
    },
  });

  const removeNpc = api.adventure.removeNpc.useMutation({
    onSuccess: () => {
      void utils.adventure.getNpcs.invalidate({ adventureId });
    },
  });

  const toggleVisibility = api.adventure.toggleNpcVisibility.useMutation({
    onSuccess: () => {
      void utils.adventure.getNpcs.invalidate({ adventureId });
    },
  });

  // Handlers
  const handleAdd = useCallback(
    (npc: NpcData) => {
      addNpc.mutate({
        adventureId,
        name: npc.name,
        race: npc.race,
        gender: npc.gender,
        alignment: npc.alignment,
        occupation: npc.occupation,
        location: npc.location,
        personalityTraits: JSON.stringify(npc.personalityTraits),
        appearance: npc.appearance,
        voiceMannerism: npc.voiceMannerism,
        background: npc.background,
        motivation: npc.motivation,
        secret: npc.secret,
        notes: npc.notes,
        isVisible: npc.isVisible,
      });
    },
    [addNpc, adventureId],
  );

  const handleUpdate = useCallback(
    (npc: NpcData) => {
      if (!editingNpc) return;
      updateNpc.mutate({
        id: editingNpc.id,
        name: npc.name,
        race: npc.race,
        gender: npc.gender,
        alignment: npc.alignment,
        occupation: npc.occupation,
        location: npc.location,
        personalityTraits: JSON.stringify(npc.personalityTraits),
        appearance: npc.appearance,
        voiceMannerism: npc.voiceMannerism,
        background: npc.background,
        motivation: npc.motivation,
        secret: npc.secret,
        notes: npc.notes,
        isVisible: npc.isVisible,
      });
    },
    [updateNpc, editingNpc],
  );

  const handleEdit = useCallback((rec: NpcRecord) => {
    setEditingNpc({ id: rec.id, ...recordToNpcData(rec) });
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      removeNpc.mutate({ id });
    },
    [removeNpc],
  );

  const handleToggleVisibility = useCallback(
    (id: string) => {
      toggleVisibility.mutate({ id });
    },
    [toggleVisibility],
  );

  const npcList = npcs as NpcRecord[];

  // Search / filter
  const filteredNpcs = npcList.filter((npc) => {
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    return (
      npc.name.toLowerCase().includes(q) ||
      (npc.location ?? "").toLowerCase().includes(q) ||
      npc.occupation.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Add button (DM only) */}
      {isOwner && (
        <button
          onClick={() => setShowModal(true)}
          style={{
            background: "linear-gradient(135deg, #8b6914, #c9a84c)",
            color: "#1a1a2e",
            border: "none",
            borderRadius: "6px",
            padding: "10px 24px",
            fontSize: "14px",
            fontFamily: SERIF,
            fontWeight: "bold",
            cursor: "pointer",
            letterSpacing: "0.5px",
            marginBottom: "20px",
          }}
        >
          Add NPC
        </button>
      )}

      {/* Search bar */}
      <div style={{ marginBottom: "16px" }}>
        <input
          type="text"
          placeholder="Search by name, location, or occupation..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            background: "rgba(30,15,5,0.9)",
            border: "1px solid rgba(201,168,76,0.4)",
            color: GOLD_BRIGHT,
            fontFamily: SERIF,
            borderRadius: "6px",
            padding: "10px 14px",
            width: "100%",
            maxWidth: "400px",
            fontSize: "14px",
            boxSizing: "border-box" as const,
            outline: "none",
          }}
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <p style={{ color: GOLD_MUTED, fontFamily: SERIF, fontSize: "14px" }}>
          Loading NPCs...
        </p>
      )}

      {/* Empty state */}
      {!isLoading && npcList.length === 0 && (
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
            {isOwner
              ? "No NPCs added yet. Generate some notable characters for your adventure."
              : "No NPCs have been revealed yet."}
          </p>
        </div>
      )}

      {/* No search results */}
      {!isLoading && npcList.length > 0 && filteredNpcs.length === 0 && (
        <p style={{ color: GOLD_MUTED, fontSize: "14px", fontFamily: SERIF }}>
          No NPCs match your search.
        </p>
      )}

      {/* NPC Cards */}
      {filteredNpcs.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filteredNpcs.map((npcRec) => {
            const isExpanded = expandedId === npcRec.id;
            const traits = parseTraits(npcRec.personalityTraits);
            const isHidden = !npcRec.isVisible;

            return (
              <div
                key={npcRec.id}
                style={{
                  background: "rgba(0,0,0,0.4)",
                  border: isOwner && isHidden
                    ? "1px solid rgba(201,168,76,0.12)"
                    : "1px solid rgba(201,168,76,0.2)",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  opacity: isOwner && isHidden ? 0.6 : 1,
                  transition: "opacity 0.2s",
                }}
              >
                {/* Header row */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : npcRec.id)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", flex: 1, minWidth: 0 }}>
                    <span style={{ color: GOLD_BRIGHT, fontSize: "14px", fontFamily: SERIF }}>
                      {isExpanded ? "\u25BC" : "\u25B6"} {npcRec.name}
                    </span>
                    <span
                      style={{
                        color: GOLD_MUTED,
                        fontSize: "12px",
                        fontFamily: SERIF,
                        fontStyle: "italic",
                      }}
                    >
                      {npcRec.race} {npcRec.occupation}
                    </span>
                    {isOwner && (npcRec.location ?? "") && (
                      <span
                        style={{
                          color: TEXT_DIM,
                          fontSize: "11px",
                          fontFamily: SERIF,
                          fontStyle: "italic",
                        }}
                      >
                        Found in: {npcRec.location}
                      </span>
                    )}
                    {isOwner && isHidden && (
                      <span
                        style={{
                          background: "rgba(231,76,60,0.15)",
                          color: "#e74c3c",
                          fontSize: "10px",
                          fontFamily: SERIF,
                          padding: "2px 8px",
                          borderRadius: "4px",
                          letterSpacing: "0.5px",
                          textTransform: "uppercase",
                          fontWeight: "bold",
                        }}
                      >
                        Hidden
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                    {isOwner && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleVisibility(npcRec.id);
                          }}
                          disabled={toggleVisibility.isPending}
                          style={{
                            background: "none",
                            border: "1px solid rgba(201,168,76,0.3)",
                            borderRadius: "4px",
                            color: npcRec.isVisible ? "#4a8c3f" : GOLD_MUTED,
                            fontSize: "16px",
                            cursor: toggleVisibility.isPending ? "default" : "pointer",
                            padding: "4px 8px",
                            fontFamily: SERIF,
                            opacity: toggleVisibility.isPending ? 0.5 : 1,
                          }}
                          title={npcRec.isVisible ? "Visible to players — click to hide" : "Hidden from players — click to reveal"}
                        >
                          {npcRec.isVisible ? "\uD83D\uDD13" : "\uD83D\uDD12"}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(npcRec);
                          }}
                          style={{
                            background: "none",
                            border: "1px solid rgba(201,168,76,0.3)",
                            borderRadius: "4px",
                            color: GOLD_MUTED,
                            fontSize: "12px",
                            cursor: "pointer",
                            padding: "4px 10px",
                            fontFamily: SERIF,
                          }}
                          title="Edit NPC"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(npcRec.id);
                          }}
                          disabled={removeNpc.isPending}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#e74c3c",
                            fontSize: "16px",
                            cursor: removeNpc.isPending ? "default" : "pointer",
                            padding: "4px 8px",
                            fontFamily: SERIF,
                            opacity: removeNpc.isPending ? 0.5 : 1,
                          }}
                          title="Remove NPC"
                        >
                          x
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
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
                    {/* Core info */}
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
                      <DetailRow label="Race" value={npcRec.race} />
                      <DetailRow label="Gender" value={npcRec.gender} />
                      {isOwner && <DetailRow label="Alignment" value={npcRec.alignment} />}
                      <DetailRow label="Occupation" value={npcRec.occupation} />
                      {isOwner && <DetailRow label="Location" value={npcRec.location ?? ""} />}
                    </div>

                    {/* DM-only details */}
                    {isOwner && (
                      <>
                        {/* Divider */}
                        <div style={{ height: "1px", background: "rgba(201,168,76,0.2)", margin: "8px 0" }} />

                        {/* Personality traits */}
                        {traits.length > 0 && (
                          <div style={{ marginBottom: "12px" }}>
                            <span style={{ color: GOLD, fontWeight: "bold", fontFamily: SERIF, fontSize: "13px" }}>
                              Personality Traits
                            </span>
                            <ul style={{ margin: "4px 0 0 0", paddingLeft: "20px" }}>
                              {traits.map((t, i) => (
                                <li
                                  key={i}
                                  style={{ color: GOLD_BRIGHT, fontFamily: SERIF, fontSize: "13px", lineHeight: "1.6" }}
                                >
                                  {t}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {npcRec.appearance && (
                          <DetailBlock label="Appearance" value={npcRec.appearance} />
                        )}
                        {npcRec.voiceMannerism && (
                          <DetailBlock label="Voice & Mannerism" value={npcRec.voiceMannerism} italic />
                        )}
                        {npcRec.background && (
                          <DetailBlock label="Background" value={npcRec.background} />
                        )}
                        {npcRec.motivation && (
                          <DetailBlock label="Motivation" value={npcRec.motivation} />
                        )}

                        {/* Secret */}
                        {npcRec.secret && (
                          <div
                            style={{
                              border: "1px solid rgba(231,76,60,0.4)",
                              borderLeft: "3px solid #e74c3c",
                              borderRadius: "4px",
                              padding: "10px 14px",
                              marginBottom: "12px",
                              background: "rgba(231,76,60,0.05)",
                            }}
                          >
                            <span style={{ color: "#e74c3c", fontWeight: "bold", fontFamily: SERIF, fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase" }}>
                              Secret (DM Only)
                            </span>
                            <p style={{ color: GOLD_BRIGHT, fontFamily: SERIF, fontSize: "13px", lineHeight: "1.6", margin: "4px 0 0 0", whiteSpace: "pre-wrap" }}>
                              {npcRec.secret}
                            </p>
                          </div>
                        )}

                        {/* DM Notes */}
                        {npcRec.notes && (
                          <div
                            style={{
                              background: "rgba(201,168,76,0.08)",
                              border: "1px solid rgba(201,168,76,0.25)",
                              borderLeft: "3px solid #c9a84c",
                              borderRadius: "4px",
                              padding: "10px 14px",
                            }}
                          >
                            <span style={{ color: GOLD_MUTED, fontWeight: "bold", fontFamily: SERIF, fontSize: "11px", letterSpacing: "1px", textTransform: "uppercase" }}>
                              DM Notes
                            </span>
                            <p style={{ color: GOLD_BRIGHT, fontFamily: SERIF, fontSize: "13px", lineHeight: "1.6", margin: "4px 0 0 0", whiteSpace: "pre-wrap" }}>
                              {npcRec.notes}
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {/* Player notes — client-side via localStorage */}
                    {!isOwner && (
                      <PlayerNpcNotes npcId={npcRec.id} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add NPC Modal */}
      {showModal && (
        <NpcModal
          title="Add NPC"
          onClose={() => setShowModal(false)}
        >
          <NpcGenerator
            onSave={handleAdd}
            onCancel={() => setShowModal(false)}
          />
        </NpcModal>
      )}

      {/* Edit NPC Modal */}
      {editingNpc && (
        <NpcModal
          title="Edit NPC"
          onClose={() => setEditingNpc(null)}
        >
          <NpcGenerator
            initialNpc={editingNpc}
            onSave={handleUpdate}
            onCancel={() => setEditingNpc(null)}
          />
        </NpcModal>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <span style={{ color: GOLD, fontWeight: "bold" }}>{label} </span>
      <span style={{ color: GOLD_BRIGHT }}>{value}</span>
    </div>
  );
}

function DetailBlock({
  label,
  value,
  italic,
}: {
  label: string;
  value: string;
  italic?: boolean;
}) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <span style={{ color: GOLD, fontWeight: "bold", fontFamily: SERIF, fontSize: "13px" }}>
        {label}
      </span>
      <p
        style={{
          color: GOLD_BRIGHT,
          fontFamily: SERIF,
          fontSize: "13px",
          lineHeight: "1.6",
          margin: "4px 0 0 0",
          whiteSpace: "pre-wrap",
          fontStyle: italic ? "italic" : "normal",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function PlayerNpcNotes({ npcId }: { npcId: string }) {
  const storageKey = `dnd_player_npc_notes_${npcId}`;
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) setNotes(saved);
  }, [storageKey]);

  const handleChange = (value: string) => {
    setNotes(value);
    localStorage.setItem(storageKey, value);
  };

  return (
    <div style={{ marginTop: "8px" }}>
      <span
        style={{
          color: GOLD_MUTED,
          fontWeight: "bold",
          fontFamily: SERIF,
          fontSize: "11px",
          letterSpacing: "1px",
          textTransform: "uppercase",
        }}
      >
        My Notes
      </span>
      <textarea
        value={notes}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Write your notes about this NPC..."
        style={{
          width: "100%",
          minHeight: "80px",
          marginTop: "4px",
          padding: "10px 12px",
          background: "rgba(30,15,5,0.9)",
          border: "1px solid rgba(201,168,76,0.4)",
          borderRadius: "6px",
          color: "#e8d5a3",
          fontFamily: "'EB Garamond', 'Georgia', serif",
          fontSize: "13px",
          lineHeight: "1.6",
          outline: "none",
          resize: "vertical",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

function NpcModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "rgba(15,8,3,0.95)",
          border: "2px solid #c9a84c",
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "700px",
          width: "90%",
          maxHeight: "85vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h2
            style={{
              color: "#c9a84c",
              fontSize: "18px",
              fontWeight: "bold",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              fontFamily: SERIF,
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#a89060",
              fontSize: "20px",
              cursor: "pointer",
              padding: "0 4px",
            }}
          >
            x
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
