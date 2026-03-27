import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/utils/api";
import { GOLD, GOLD_MUTED, GOLD_BRIGHT, SERIF } from "./shared";

export function PlayerDmNotesTab({ adventure }: { adventure: { id: string; players: Array<{ id: string; userId: string; status: string; playerNote?: string; character: { id: string } }> } }) {
  const { user } = useAuth();
  const utils = api.useUtils();
  const [notePage, setNotePage] = useState(0);

  const myPlayerRecord = adventure.players.find(
    (p) => p.userId === user?.userId && p.status === "ACCEPTED",
  );
  const characterId = (myPlayerRecord?.character as { id: string } | undefined)?.id;
  const adventurePlayerId = myPlayerRecord?.id ?? "";
  const initialPlayerNote = (myPlayerRecord?.playerNote as string | undefined) ?? "";

  const [playerNote, setPlayerNote] = useState(initialPlayerNote);
  const [playerNoteSaved, setPlayerNoteSaved] = useState(true);

  const updatePlayerNote = api.adventure.updatePlayerNote.useMutation({
    onSuccess: () => {
      setPlayerNoteSaved(true);
      void utils.adventure.getById.invalidate({ id: adventure.id });
    },
  });

  const handleSavePlayerNote = () => {
    if (!adventurePlayerId) return;
    updatePlayerNote.mutate({ adventurePlayerId, content: playerNote });
  };

  const { data: dmNotes = [], isLoading } = api.adventure.getNotes.useQuery(
    { adventureId: adventure.id, characterId: characterId! },
    { enabled: !!characterId },
  );

  const reactToNote = api.adventure.reactToNote.useMutation({
    onSuccess: () => {
      void utils.adventure.getNotes.invalidate({ adventureId: adventure.id, characterId: characterId! });
    },
  });

  if (!characterId) {
    return (
      <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "12px", padding: "60px 40px", textAlign: "center" }}>
        <p style={{ color: GOLD_MUTED, fontSize: "14px", fontFamily: SERIF }}>No character found in this adventure.</p>
      </div>
    );
  }

  if (isLoading) {
    return <p style={{ color: GOLD_MUTED, fontSize: "13px", fontFamily: SERIF }}>Loading DM notes...</p>;
  }

  const typedNotes = dmNotes as unknown as Array<{
    id: string;
    content: string;
    createdAt: string | Date;
    reaction: string | null;
    fromUser: { username: string };
  }>;

  // Player note to DM section (shared between empty and non-empty states)
  const playerNoteSection = (
    <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px", padding: "28px 32px", marginBottom: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", paddingBottom: "8px", borderBottom: "1px solid rgba(201,168,76,0.2)" }}>
        <p style={{ color: GOLD, fontSize: "12px", fontWeight: "bold", letterSpacing: "2px", textTransform: "uppercase", fontFamily: SERIF, margin: 0 }}>
          Note to DM
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {!playerNoteSaved && (
            <span style={{ color: GOLD_MUTED, fontSize: "11px", fontFamily: SERIF, fontStyle: "italic" }}>
              Unsaved changes
            </span>
          )}
          <button
            onClick={handleSavePlayerNote}
            disabled={updatePlayerNote.isPending || playerNoteSaved}
            style={{
              background: playerNoteSaved ? "rgba(201,168,76,0.1)" : "linear-gradient(135deg, #8b6914, #c9a84c)",
              color: playerNoteSaved ? GOLD_MUTED : "#1a1a2e",
              border: "none",
              borderRadius: "6px",
              padding: "6px 16px",
              fontSize: "12px",
              fontFamily: SERIF,
              fontWeight: "bold",
              cursor: playerNoteSaved ? "default" : "pointer",
              opacity: playerNoteSaved ? 0.6 : 1,
            }}
          >
            {updatePlayerNote.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
      <textarea
        value={playerNote}
        onChange={(e) => { setPlayerNote(e.target.value); setPlayerNoteSaved(false); }}
        placeholder="Write a note for your DM..."
        style={{
          width: "100%",
          minHeight: "100px",
          background: "rgba(30,15,5,0.9)",
          border: "1px solid rgba(201,168,76,0.4)",
          color: GOLD_BRIGHT,
          fontFamily: SERIF,
          borderRadius: "6px",
          padding: "10px 14px",
          fontSize: "13px",
          lineHeight: "1.6",
          boxSizing: "border-box",
          outline: "none",
          resize: "vertical",
        }}
      />
    </div>
  );

  if (typedNotes.length === 0) {
    return (
      <div>
        {playerNoteSection}
        <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "12px", padding: "60px 40px", textAlign: "center" }}>
          <p style={{ color: GOLD_MUTED, fontSize: "14px", fontFamily: SERIF }}>No notes from the DM yet.</p>
        </div>
      </div>
    );
  }

  const NOTES_PER_PAGE = 5;
  const pageNotes = typedNotes.slice(notePage * NOTES_PER_PAGE, (notePage + 1) * NOTES_PER_PAGE);
  const totalPages = Math.ceil(typedNotes.length / NOTES_PER_PAGE);

  const handleReact = (noteId: string, currentReaction: string | null, newReaction: "THUMBS_UP" | "THUMBS_DOWN") => {
    reactToNote.mutate({
      noteId,
      reaction: currentReaction === newReaction ? null : newReaction,
    });
  };

  return (
    <div>
      {playerNoteSection}

    <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px", padding: "28px 32px" }}>
      <p style={{ color: GOLD, fontSize: "12px", fontWeight: "bold", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "16px", paddingBottom: "8px", borderBottom: "1px solid rgba(201,168,76,0.2)", fontFamily: SERIF }}>
        Notes from the Dungeon Master
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: totalPages > 1 ? "16px" : "0" }}>
        {pageNotes.map((note) => (
          <div key={note.id} style={{ background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: "8px", padding: "12px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ color: GOLD_MUTED, fontSize: "11px", fontFamily: SERIF }}>
                {new Date(note.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => handleReact(note.id, note.reaction, "THUMBS_UP")}
                  disabled={reactToNote.isPending}
                  style={{ background: "none", border: "none", fontSize: "16px", cursor: reactToNote.isPending ? "default" : "pointer", opacity: note.reaction === "THUMBS_UP" ? 1 : 0.4, transition: "opacity 0.15s" }}
                  title="Thumbs Up"
                >
                  👍
                </button>
                <button
                  onClick={() => handleReact(note.id, note.reaction, "THUMBS_DOWN")}
                  disabled={reactToNote.isPending}
                  style={{ background: "none", border: "none", fontSize: "16px", cursor: reactToNote.isPending ? "default" : "pointer", opacity: note.reaction === "THUMBS_DOWN" ? 1 : 0.4, transition: "opacity 0.15s" }}
                  title="Thumbs Down"
                >
                  👎
                </button>
              </div>
            </div>
            <p style={{ color: GOLD_BRIGHT, fontSize: "13px", fontFamily: SERIF, lineHeight: 1.6, whiteSpace: "pre-wrap", margin: 0 }}>
              {note.content}
            </p>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
          <button onClick={() => setNotePage((p) => Math.max(0, p - 1))} disabled={notePage === 0} style={{ background: "none", border: "1px solid rgba(201,168,76,0.3)", color: notePage === 0 ? GOLD_MUTED : GOLD, borderRadius: "4px", padding: "4px 12px", fontFamily: SERIF, fontSize: "11px", cursor: notePage === 0 ? "default" : "pointer", opacity: notePage === 0 ? 0.5 : 1 }}>
            Prev
          </button>
          <span style={{ color: GOLD_MUTED, fontSize: "11px", fontFamily: SERIF }}>{notePage + 1} / {totalPages}</span>
          <button onClick={() => setNotePage((p) => Math.min(totalPages - 1, p + 1))} disabled={notePage >= totalPages - 1} style={{ background: "none", border: "1px solid rgba(201,168,76,0.3)", color: notePage >= totalPages - 1 ? GOLD_MUTED : GOLD, borderRadius: "4px", padding: "4px 12px", fontFamily: SERIF, fontSize: "11px", cursor: notePage >= totalPages - 1 ? "default" : "pointer", opacity: notePage >= totalPages - 1 ? 0.5 : 1 }}>
            Next
          </button>
        </div>
      )}
    </div>
    </div>
  );
}
