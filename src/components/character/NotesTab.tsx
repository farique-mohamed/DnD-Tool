import { useState } from "react";
import { api } from "@/utils/api";
import { type CharacterData } from "./shared";

export function NotesTab({ character }: { character: CharacterData }) {
  const utils = api.useUtils();
  const [notes, setNotes] = useState<string>(character.notes || "");
  const [saved, setSaved] = useState(true);

  const updateNotes = api.character.updateNotes.useMutation({
    onSuccess: async () => {
      setSaved(true);
      await utils.character.getById.invalidate({ id: character.id });
    },
  });

  const handleSave = () => {
    updateNotes.mutate({ id: character.id, notes });
  };

  // Determine if the character is in an adventure (for DM notes)
  const adventurePlayer = character.adventurePlayers && character.adventurePlayers.length > 0
    ? character.adventurePlayers[0]!
    : null;
  const adventureId = adventurePlayer?.status === "ACCEPTED" ? adventurePlayer.adventure.id : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div
        style={{
          background: "rgba(0,0,0,0.5)",
          border: "1px solid rgba(201,168,76,0.3)",
          borderRadius: "12px",
          padding: "20px 24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
          }}
        >
          <p
            style={{
              color: "#c9a84c",
              fontSize: "12px",
              fontWeight: "bold",
              letterSpacing: "2px",
              textTransform: "uppercase",
              fontFamily: "'EB Garamond', 'Georgia', serif",
              margin: 0,
            }}
          >
            Adventurer&apos;s Journal
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {!saved && (
              <span
                style={{
                  color: "#a89060",
                  fontSize: "11px",
                  fontFamily: "'EB Garamond', 'Georgia', serif",
                  fontStyle: "italic",
                }}
              >
                Unsaved changes
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saved || updateNotes.isPending}
              style={{
                background: saved
                  ? "rgba(201,168,76,0.1)"
                  : "linear-gradient(135deg, #8b6914, #c9a84c)",
                color: saved ? "#a89060" : "#1a1a2e",
                border: saved ? "1px solid rgba(201,168,76,0.2)" : "none",
                borderRadius: "6px",
                padding: "6px 16px",
                fontSize: "12px",
                fontFamily: "'EB Garamond', 'Georgia', serif",
                fontWeight: "bold",
                cursor: saved ? "default" : "pointer",
                opacity: saved ? 0.6 : 1,
              }}
            >
              {updateNotes.isPending
                ? "Saving..."
                : saved
                  ? "Saved"
                  : "Save Notes"}
            </button>
          </div>
        </div>
        <textarea
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setSaved(false);
          }}
          placeholder="Record your adventures, track quest objectives, note important NPCs, or keep any other information you need..."
          style={{
            width: "100%",
            minHeight: "400px",
            padding: "16px",
            background: "rgba(30,15,5,0.9)",
            border: "1px solid rgba(201,168,76,0.4)",
            borderRadius: "8px",
            color: "#e8d5a3",
            fontSize: "14px",
            fontFamily: "'EB Garamond', 'Georgia', serif",
            lineHeight: "1.7",
            resize: "vertical",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        {updateNotes.error && (
          <p
            style={{
              color: "#e74c3c",
              fontSize: "12px",
              fontFamily: "'EB Garamond', 'Georgia', serif",
              marginTop: "8px",
            }}
          >
            {updateNotes.error.message}
          </p>
        )}
      </div>

      {/* DM Notes section — shown when character is in an adventure */}
      {adventureId && (
        <DmNotesInCharacterView adventureId={adventureId} characterId={character.id} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// DM Notes in Character View (player sees DM notes + can react)
// ---------------------------------------------------------------------------

function DmNotesInCharacterView({ adventureId, characterId }: { adventureId: string; characterId: string }) {
  const utils = api.useUtils();

  const { data: dmNotes = [], isLoading } =
    api.adventure.getNotes.useQuery({ adventureId, characterId });

  const reactToNote = api.adventure.reactToNote.useMutation({
    onSuccess: () => {
      void utils.adventure.getNotes.invalidate({ adventureId, characterId });
      void utils.adventure.getUnreadNoteCount.invalidate();
    },
  });

  type DmNoteItem = {
    id: string;
    content: string;
    createdAt: string | Date;
    reaction: string | null;
    fromUser: { username: string };
  };

  const typedNotes = dmNotes as unknown as DmNoteItem[];

  const handleReact = (noteId: string, currentReaction: string | null, newReaction: "THUMBS_UP" | "THUMBS_DOWN") => {
    reactToNote.mutate({
      noteId,
      reaction: currentReaction === newReaction ? null : newReaction,
    });
  };

  return (
    <div
      style={{
        background: "rgba(0,0,0,0.5)",
        border: "1px solid rgba(201,168,76,0.3)",
        borderRadius: "12px",
        padding: "20px 24px",
      }}
    >
      <p
        style={{
          color: "#c9a84c",
          fontSize: "12px",
          fontWeight: "bold",
          letterSpacing: "2px",
          textTransform: "uppercase",
          fontFamily: "'EB Garamond', 'Georgia', serif",
          margin: 0,
          marginBottom: "16px",
          paddingBottom: "8px",
          borderBottom: "1px solid rgba(201,168,76,0.2)",
        }}
      >
        DM Notes
      </p>

      {isLoading ? (
        <p style={{ color: "#a89060", fontSize: "13px", fontFamily: "'EB Garamond', 'Georgia', serif" }}>
          Loading DM notes...
        </p>
      ) : typedNotes.length === 0 ? (
        <p style={{ color: "#a89060", fontSize: "13px", fontFamily: "'EB Garamond', 'Georgia', serif", fontStyle: "italic" }}>
          No DM notes yet.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {typedNotes.map((note) => (
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
                    color: "#a89060",
                    fontSize: "11px",
                    fontFamily: "'EB Garamond', 'Georgia', serif",
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
              </div>
              <p
                style={{
                  color: "#e8d5a3",
                  fontSize: "13px",
                  fontFamily: "'EB Garamond', 'Georgia', serif",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  margin: "0 0 10px 0",
                }}
              >
                {note.content}
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => handleReact(note.id, note.reaction, "THUMBS_UP")}
                  disabled={reactToNote.isPending}
                  style={{
                    background: note.reaction === "THUMBS_UP" ? "rgba(201,168,76,0.2)" : "transparent",
                    border: "1px solid rgba(201,168,76,0.3)",
                    borderRadius: "4px",
                    padding: "4px 10px",
                    cursor: reactToNote.isPending ? "default" : "pointer",
                    fontSize: "14px",
                    opacity: reactToNote.isPending ? 0.5 : 1,
                  }}
                  title="Thumbs Up"
                >
                  {"\u{1F44D}"}
                </button>
                <button
                  onClick={() => handleReact(note.id, note.reaction, "THUMBS_DOWN")}
                  disabled={reactToNote.isPending}
                  style={{
                    background: note.reaction === "THUMBS_DOWN" ? "rgba(201,168,76,0.2)" : "transparent",
                    border: "1px solid rgba(201,168,76,0.3)",
                    borderRadius: "4px",
                    padding: "4px 10px",
                    cursor: reactToNote.isPending ? "default" : "pointer",
                    fontSize: "14px",
                    opacity: reactToNote.isPending ? 0.5 : 1,
                  }}
                  title="Thumbs Down"
                >
                  {"\u{1F44E}"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
