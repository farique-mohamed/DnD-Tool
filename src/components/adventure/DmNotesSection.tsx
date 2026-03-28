import { useState } from "react";
import { api } from "@/utils/api";
import { GOLD, GOLD_MUTED, GOLD_BRIGHT, SERIF } from "./shared";

export function DmNotesSection({
  adventureId,
  characterId,
  toUserId,
  playerNotes,
}: {
  adventureId: string;
  characterId: string;
  toUserId: string;
  playerNotes: string | null | undefined;
}) {
  const utils = api.useUtils();
  const [noteContent, setNoteContent] = useState("");
  const [notePage, setNotePage] = useState(0);

  const { data: dmNotes = [], isLoading: notesLoading } =
    api.adventure.getNotes.useQuery({ adventureId, characterId });

  const sendNote = api.adventure.sendNote.useMutation({
    onSuccess: () => {
      setNoteContent("");
      void utils.adventure.getNotes.invalidate({ adventureId, characterId });
    },
  });

  const handleSend = () => {
    const trimmed = noteContent.trim();
    if (!trimmed) return;
    sendNote.mutate({ adventureId, toUserId, characterId, content: trimmed });
  };

  const sectionTitle: React.CSSProperties = {
    color: GOLD,
    fontSize: "12px",
    fontWeight: "bold",
    letterSpacing: "2px",
    textTransform: "uppercase",
    marginBottom: "12px",
    paddingBottom: "8px",
    borderBottom: `1px solid rgba(201,168,76,0.2)`,
    fontFamily: SERIF,
  };

  return (
    <div>
      {/* Player's own notes (read-only) */}
      {playerNotes && (
        <div
          style={{
            background: "rgba(0,0,0,0.5)",
            border: "1px solid rgba(201,168,76,0.3)",
            borderRadius: "12px",
            padding: "20px 24px",
            marginBottom: "16px",
          }}
        >
          <p style={sectionTitle}>Player Notes</p>
          <p
            style={{
              color: GOLD_BRIGHT,
              fontSize: "13px",
              fontFamily: SERIF,
              lineHeight: 1.7,
              whiteSpace: "pre-wrap",
            }}
          >
            {playerNotes}
          </p>
        </div>
      )}

      {/* DM Notes */}
      <div
        style={{
          background: "rgba(0,0,0,0.5)",
          border: "1px solid rgba(201,168,76,0.3)",
          borderRadius: "12px",
          padding: "20px 24px",
        }}
      >
        <p style={sectionTitle}>DM Notes</p>

        {notesLoading ? (
          <p style={{ color: GOLD_MUTED, fontSize: "13px", fontFamily: SERIF }}>
            Loading notes...
          </p>
        ) : (() => {
          const typedNotes = dmNotes as unknown as Array<{
            id: string;
            content: string;
            createdAt: string | Date;
            reaction: string | null;
            fromUser: { username: string };
          }>;
          if (typedNotes.length === 0) {
            return (
              <p
                style={{
                  color: GOLD_MUTED,
                  fontSize: "13px",
                  fontFamily: SERIF,
                  marginBottom: "16px",
                }}
              >
                No DM notes yet.
              </p>
            );
          }
          const NOTES_PER_PAGE = 5;
          const pageNotes = typedNotes.slice(notePage * NOTES_PER_PAGE, (notePage + 1) * NOTES_PER_PAGE);
          const totalPages = Math.ceil(typedNotes.length / NOTES_PER_PAGE);
          return (
            <>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  marginBottom: "16px",
                }}
              >
                {pageNotes.map((note) => (
                  <div
                    key={note.id}
                    style={{
                      background: "rgba(201,168,76,0.05)",
                      border: "1px solid rgba(201,168,76,0.15)",
                      borderRadius: "8px",
                      padding: "12px 16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "6px",
                      }}
                    >
                      <span
                        style={{
                          color: GOLD_MUTED,
                          fontSize: "11px",
                          fontFamily: SERIF,
                        }}
                      >
                        {new Date(note.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {note.reaction && (
                        <span
                          style={{
                            fontSize: "16px",
                            color:
                              note.reaction === "THUMBS_UP" ? GOLD : GOLD_MUTED,
                          }}
                          title={
                            note.reaction === "THUMBS_UP"
                              ? "Player reacted: Thumbs Up"
                              : "Player reacted: Thumbs Down"
                          }
                        >
                          {note.reaction === "THUMBS_UP" ? "\u{1F44D}" : "\u{1F44E}"}
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        color: GOLD_BRIGHT,
                        fontSize: "13px",
                        fontFamily: SERIF,
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                        margin: 0,
                      }}
                    >
                      {note.content}
                    </p>
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "12px",
                    marginBottom: "16px",
                  }}
                >
                  <button
                    onClick={() => setNotePage((p) => Math.max(0, p - 1))}
                    disabled={notePage === 0}
                    style={{
                      background: "none",
                      border: "1px solid rgba(201,168,76,0.3)",
                      color: notePage === 0 ? GOLD_MUTED : GOLD,
                      borderRadius: "4px",
                      padding: "4px 12px",
                      fontFamily: SERIF,
                      fontSize: "11px",
                      cursor: notePage === 0 ? "default" : "pointer",
                      opacity: notePage === 0 ? 0.5 : 1,
                    }}
                  >
                    Prev
                  </button>
                  <span
                    style={{
                      color: GOLD_MUTED,
                      fontSize: "11px",
                      fontFamily: SERIF,
                    }}
                  >
                    {notePage + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setNotePage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={notePage >= totalPages - 1}
                    style={{
                      background: "none",
                      border: "1px solid rgba(201,168,76,0.3)",
                      color: notePage >= totalPages - 1 ? GOLD_MUTED : GOLD,
                      borderRadius: "4px",
                      padding: "4px 12px",
                      fontFamily: SERIF,
                      fontSize: "11px",
                      cursor: notePage >= totalPages - 1 ? "default" : "pointer",
                      opacity: notePage >= totalPages - 1 ? 0.5 : 1,
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          );
        })()}

        {/* Send note input */}
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Write a note to this player..."
            rows={2}
            style={{
              flex: 1,
              padding: "10px 14px",
              background: "rgba(30,15,5,0.9)",
              border: "1px solid rgba(201,168,76,0.3)",
              borderRadius: "6px",
              color: GOLD_BRIGHT,
              fontFamily: SERIF,
              fontSize: "13px",
              outline: "none",
              resize: "vertical",
              boxSizing: "border-box",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                handleSend();
              }
            }}
          />
          <button
            onClick={handleSend}
            disabled={!noteContent.trim() || sendNote.isPending}
            style={{
              background: "linear-gradient(135deg, #8b6914, #c9a84c)",
              color: "#1a1a2e",
              border: "none",
              borderRadius: "6px",
              padding: "10px 20px",
              fontSize: "12px",
              fontFamily: SERIF,
              fontWeight: "bold",
              cursor:
                !noteContent.trim() || sendNote.isPending
                  ? "default"
                  : "pointer",
              opacity: !noteContent.trim() || sendNote.isPending ? 0.6 : 1,
              whiteSpace: "nowrap",
            }}
          >
            {sendNote.isPending ? "Sending..." : "Send Note"}
          </button>
        </div>
      </div>
    </div>
  );
}
