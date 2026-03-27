import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/utils/api";
import { GOLD, GOLD_MUTED, GOLD_BRIGHT, SERIF } from "./shared";

export function SessionNotesTab({ adventureId }: { adventureId: string }) {
  const { user } = useAuth();
  const utils = api.useUtils();
  const [selectedNoteIndex, setSelectedNoteIndex] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const { data: sessionNotes = [], isLoading } =
    api.adventure.getSessionNotes.useQuery({ adventureId });

  const createNote = api.adventure.createSessionNote.useMutation({
    onSuccess: () => {
      setNewTitle("");
      setIsCreating(false);
      void utils.adventure.getSessionNotes.invalidate({ adventureId });
    },
  });

  const updateNote = api.adventure.updateSessionNote.useMutation({
    onSuccess: () => {
      setIsEditing(false);
      void utils.adventure.getSessionNotes.invalidate({ adventureId });
    },
  });

  type SessionNoteItem = {
    id: string;
    title: string;
    content: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    userId: string;
    user: { id: string; username: string };
  };

  const typedNotes = sessionNotes as unknown as SessionNoteItem[];
  const selectedNote: SessionNoteItem | null = typedNotes[selectedNoteIndex] ?? null;
  const handleCreate = () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    createNote.mutate({ adventureId, title: trimmed, content: "" });
  };

  const handleStartEdit = () => {
    if (!selectedNote) return;
    setEditTitle(selectedNote.title);
    setEditContent(selectedNote.content);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!selectedNote) return;
    updateNote.mutate({
      noteId: selectedNote.id,
      title: editTitle.trim() || selectedNote.title,
      content: editContent,
    });
  };

  if (isLoading) {
    return (
      <p style={{ color: GOLD_MUTED, fontSize: "13px", fontFamily: SERIF }}>
        Loading session notes...
      </p>
    );
  }

  return (
    <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
      {/* Left Panel — note list */}
      <div
        style={{
          flex: "0 0 240px",
          minWidth: "200px",
          maxWidth: "280px",
          position: "sticky",
          top: "24px",
          maxHeight: "calc(100vh - 120px)",
          overflowY: "auto",
          background: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(201,168,76,0.2)",
          borderRadius: "8px",
          padding: "12px 0",
        }}
      >
        <p
          style={{
            color: GOLD,
            fontSize: "11px",
            letterSpacing: "1.2px",
            textTransform: "uppercase",
            padding: "0 14px 10px",
            borderBottom: "1px solid rgba(201,168,76,0.15)",
            marginBottom: "8px",
            fontFamily: SERIF,
          }}
        >
          My Session Notes
        </p>

        {/* Add Session Note */}
        {isCreating ? (
          <div style={{ padding: "8px 14px" }}>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Note title..."
              autoFocus
              style={{
                width: "100%",
                padding: "6px 10px",
                background: "rgba(30,15,5,0.9)",
                border: "1px solid rgba(201,168,76,0.3)",
                borderRadius: "4px",
                color: GOLD_BRIGHT,
                fontFamily: SERIF,
                fontSize: "12px",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: "6px",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") setIsCreating(false);
              }}
            />
            <div style={{ display: "flex", gap: "4px" }}>
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim() || createNote.isPending}
                style={{
                  flex: 1,
                  background: "linear-gradient(135deg, #8b6914, #c9a84c)",
                  color: "#1a1a2e",
                  border: "none",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  fontSize: "11px",
                  fontFamily: SERIF,
                  fontWeight: "bold",
                  cursor: !newTitle.trim() ? "default" : "pointer",
                  opacity: !newTitle.trim() ? 0.6 : 1,
                }}
              >
                {createNote.isPending ? "..." : "Create"}
              </button>
              <button
                onClick={() => { setIsCreating(false); setNewTitle(""); }}
                style={{
                  background: "none",
                  border: "1px solid rgba(201,168,76,0.3)",
                  color: GOLD_MUTED,
                  borderRadius: "4px",
                  padding: "4px 8px",
                  fontSize: "11px",
                  fontFamily: SERIF,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            style={{
              display: "block",
              width: "calc(100% - 28px)",
              margin: "0 14px 8px",
              padding: "6px 10px",
              background: "linear-gradient(135deg, #8b6914, #c9a84c)",
              color: "#1a1a2e",
              border: "none",
              borderRadius: "4px",
              fontSize: "11px",
              fontFamily: SERIF,
              fontWeight: "bold",
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            + Add Session Note
          </button>
        )}

        {/* Note list */}
        {typedNotes.map((note, i) => {
          const isActive = i === selectedNoteIndex;
          return (
            <button
              key={note.id}
              onClick={() => { setSelectedNoteIndex(i); setIsEditing(false); }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "8px 14px",
                background: isActive ? "rgba(201,168,76,0.15)" : "transparent",
                border: "none",
                borderLeft: isActive ? "2px solid #c9a84c" : "2px solid transparent",
                color: isActive ? GOLD : GOLD_BRIGHT,
                fontSize: "13px",
                fontFamily: SERIF,
                cursor: "pointer",
                lineHeight: "1.4",
                transition: "background 0.1s, color 0.1s",
              }}
            >
              <span style={{ display: "block", fontWeight: isActive ? "bold" : "normal" }}>
                {note.title}
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: "10px",
                  color: GOLD_MUTED,
                  marginTop: "2px",
                }}
              >
                {new Date(note.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </button>
          );
        })}

        {typedNotes.length === 0 && (
          <p
            style={{
              color: GOLD_MUTED,
              fontSize: "12px",
              fontFamily: SERIF,
              padding: "8px 14px",
              fontStyle: "italic",
            }}
          >
            No session notes yet.
          </p>
        )}
      </div>

      {/* Right Panel — note content */}
      <div style={{ flex: 3, minWidth: 0 }}>
        {selectedNote ? (
          <div
            style={{
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(201,168,76,0.2)",
              borderRadius: "8px",
              padding: "28px 32px",
            }}
          >
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "rgba(30,15,5,0.9)",
                    border: "1px solid rgba(201,168,76,0.3)",
                    borderRadius: "6px",
                    color: GOLD_BRIGHT,
                    fontFamily: SERIF,
                    fontSize: "18px",
                    fontWeight: "bold",
                    outline: "none",
                    boxSizing: "border-box",
                    marginBottom: "16px",
                  }}
                />
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={16}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    background: "rgba(30,15,5,0.9)",
                    border: "1px solid rgba(201,168,76,0.3)",
                    borderRadius: "6px",
                    color: GOLD_BRIGHT,
                    fontFamily: SERIF,
                    fontSize: "14px",
                    lineHeight: "1.7",
                    outline: "none",
                    resize: "vertical",
                    boxSizing: "border-box",
                    marginBottom: "16px",
                  }}
                />
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={handleSaveEdit}
                    disabled={updateNote.isPending}
                    style={{
                      background: "linear-gradient(135deg, #8b6914, #c9a84c)",
                      color: "#1a1a2e",
                      border: "none",
                      borderRadius: "6px",
                      padding: "8px 20px",
                      fontSize: "12px",
                      fontFamily: SERIF,
                      fontWeight: "bold",
                      cursor: updateNote.isPending ? "default" : "pointer",
                      opacity: updateNote.isPending ? 0.6 : 1,
                    }}
                  >
                    {updateNote.isPending ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    style={{
                      background: "none",
                      border: "1px solid rgba(201,168,76,0.3)",
                      color: GOLD_MUTED,
                      borderRadius: "6px",
                      padding: "8px 20px",
                      fontSize: "12px",
                      fontFamily: SERIF,
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "20px",
                  }}
                >
                  <div>
                    <h2
                      style={{
                        color: GOLD,
                        fontSize: "20px",
                        fontWeight: "bold",
                        letterSpacing: "1.5px",
                        textTransform: "uppercase",
                        marginBottom: "6px",
                        fontFamily: SERIF,
                      }}
                    >
                      {selectedNote.title}
                    </h2>
                    <p
                      style={{
                        color: GOLD_MUTED,
                        fontSize: "12px",
                        fontFamily: SERIF,
                      }}
                    >
                      {new Date(selectedNote.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                    <button
                      onClick={handleStartEdit}
                      style={{
                        background: "none",
                        border: "1px solid rgba(201,168,76,0.3)",
                        color: GOLD_MUTED,
                        borderRadius: "4px",
                        padding: "6px 14px",
                        fontFamily: SERIF,
                        fontSize: "12px",
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                </div>
                <p
                  style={{
                    color: GOLD_BRIGHT,
                    fontSize: "14px",
                    fontFamily: SERIF,
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {selectedNote.content || (
                    <span style={{ color: GOLD_MUTED, fontStyle: "italic" }}>
                      No content yet.
                    </span>
                  )}
                </p>
              </>
            )}
          </div>
        ) : (
          <div
            style={{
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(201,168,76,0.2)",
              borderRadius: "12px",
              padding: "60px 40px",
              textAlign: "center",
            }}
          >
            <p style={{ color: GOLD_MUTED, fontSize: "14px", fontFamily: SERIF }}>
              {typedNotes.length === 0
                ? "Create your first session note to get started."
                : "Select a note from the sidebar."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
