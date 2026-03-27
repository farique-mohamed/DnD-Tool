import { useState } from "react";
import { api } from "@/utils/api";
import { GOLD, GOLD_MUTED, GOLD_BRIGHT, SERIF } from "./shared";
import { CharacterSheetModal } from "./CharacterSheetModal";

export function PlayersTab({ adventureId, adventureItems, unreadReactionByCharacter }: { adventureId: string; adventureItems: { id: string; name: string; source: string }[]; unreadReactionByCharacter?: Record<string, number> }) {
  const utils = api.useUtils();
  const [expandedPendingId, setExpandedPendingId] = useState<string | null>(null);
  const [sheetModalPlayer, setSheetModalPlayer] = useState<{
    character: Record<string, unknown>;
    username: string;
    userId: string;
    adventurePlayerId: string;
    playerNote?: string;
  } | null>(null);

  const { data: pendingPlayers = [], isLoading: pendingLoading } =
    api.adventure.getPendingPlayers.useQuery({ adventureId });
  const { data: acceptedPlayers = [], isLoading: acceptedLoading } =
    api.adventure.getAcceptedPlayers.useQuery({ adventureId });

  const resolvePlayer = api.adventure.resolvePlayer.useMutation({
    onSuccess: () => {
      void utils.adventure.getPendingPlayers.invalidate({ adventureId });
      void utils.adventure.getAcceptedPlayers.invalidate({ adventureId });
      void utils.adventure.getById.invalidate({ id: adventureId });
    },
  });

  const renderCharacterSummary = (character: Record<string, unknown> | null | undefined) => {
    if (!character) return null;
    const name = character.name as string | undefined;
    const race = character.race as string | undefined;
    const charClass = character.characterClass as string | undefined;
    const level = character.level as number | undefined;
    return (
      <p
        style={{
          color: GOLD_MUTED,
          fontSize: "12px",
          fontFamily: SERIF,
          marginTop: "2px",
        }}
      >
        {name ?? "Unknown"} — Level {level ?? "?"} {race ?? ""} {charClass ?? ""}
      </p>
    );
  };

  const renderCharacterOverview = (character: Record<string, unknown> | null | undefined) => {
    if (!character) return null;
    const strVal = character.strength as number | undefined;
    const dexVal = character.dexterity as number | undefined;
    const conVal = character.constitution as number | undefined;
    const intVal = character.intelligence as number | undefined;
    const wisVal = character.wisdom as number | undefined;
    const chaVal = character.charisma as number | undefined;
    const maxHpVal = character.maxHp as number | undefined;
    const acVal = character.armorClass as number | undefined;
    const speedVal = character.speed as number | undefined;
    const alignmentVal = character.alignment as string | undefined;

    const scores = [
      { label: "STR", value: strVal },
      { label: "DEX", value: dexVal },
      { label: "CON", value: conVal },
      { label: "INT", value: intVal },
      { label: "WIS", value: wisVal },
      { label: "CHA", value: chaVal },
    ];

    return (
      <div
        style={{
          background: "rgba(0,0,0,0.3)",
          border: "1px solid rgba(201,168,76,0.15)",
          borderRadius: "8px",
          padding: "16px 20px",
          marginTop: "10px",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px", marginBottom: "12px" }}>
          {scores.map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div style={{ color: GOLD_MUTED, fontSize: "10px", letterSpacing: "1px", marginBottom: "2px" }}>{stat.label}</div>
              <div style={{ color: GOLD_BRIGHT, fontSize: "16px", fontWeight: "bold" }}>{stat.value ?? "\u2014"}</div>
            </div>
          ))}
        </div>
        <div style={{ height: "1px", background: "rgba(201,168,76,0.2)", margin: "8px 0" }} />
        <div style={{ display: "flex", gap: "24px", marginBottom: "8px", fontSize: "13px", fontFamily: SERIF }}>
          <div>
            <span style={{ color: GOLD, fontWeight: "bold" }}>HP </span>
            <span style={{ color: GOLD_BRIGHT }}>{maxHpVal ?? "\u2014"}</span>
          </div>
          <div>
            <span style={{ color: GOLD, fontWeight: "bold" }}>AC </span>
            <span style={{ color: GOLD_BRIGHT }}>{acVal ?? "\u2014"}</span>
          </div>
          <div>
            <span style={{ color: GOLD, fontWeight: "bold" }}>Speed </span>
            <span style={{ color: GOLD_BRIGHT }}>{speedVal != null ? `${speedVal} ft.` : "\u2014"}</span>
          </div>
        </div>
        {alignmentVal && (
          <div style={{ fontSize: "13px", fontFamily: SERIF, marginBottom: "8px" }}>
            <span style={{ color: GOLD, fontWeight: "bold" }}>Alignment </span>
            <span style={{ color: GOLD_BRIGHT }}>{alignmentVal}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Section Header */}
      <h3
        style={{
          color: GOLD,
          fontSize: "16px",
          fontWeight: "bold",
          letterSpacing: "1px",
          textTransform: "uppercase",
          marginBottom: "16px",
          fontFamily: SERIF,
        }}
      >
        Players
      </h3>

      {/* Pending Requests Subsection */}
      {pendingLoading ? (
        <p style={{ color: GOLD_MUTED, fontSize: "13px", fontFamily: SERIF, marginBottom: "16px" }}>
          Loading pending requests...
        </p>
      ) : pendingPlayers.length > 0 && (
        <div style={{ marginBottom: "40px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "12px",
            }}
          >
            <span
              style={{
                color: GOLD_MUTED,
                fontSize: "12px",
                fontFamily: SERIF,
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              Pending Requests
            </span>
            <span
              style={{
                background: GOLD,
                color: "#1a1a2e",
                borderRadius: "50%",
                width: "20px",
                height: "20px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: "bold",
              }}
            >
              {pendingPlayers.length}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {pendingPlayers.map((player) => {
              const character = (player as unknown as { character?: Record<string, unknown> }).character ?? null;
              const isExpanded = expandedPendingId === player.id;
              return (
                <div
                  key={player.id}
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
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span
                          style={{
                            color: GOLD_BRIGHT,
                            fontSize: "14px",
                            fontFamily: SERIF,
                            fontWeight: "bold",
                          }}
                        >
                          {player.user.username}
                        </span>
                        <span
                          style={{
                            color: GOLD_MUTED,
                            fontSize: "11px",
                            fontFamily: SERIF,
                          }}
                        >
                          Requested{" "}
                          {new Date(player.joinedAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      {renderCharacterSummary(character)}
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      {character && (
                        <button
                          onClick={() => setExpandedPendingId(isExpanded ? null : player.id)}
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
                          {isExpanded ? "Hide Sheet" : "View Sheet"}
                        </button>
                      )}
                      <button
                        onClick={() =>
                          resolvePlayer.mutate({
                            adventurePlayerId: player.id,
                            action: "ACCEPTED",
                          })
                        }
                        disabled={resolvePlayer.isPending}
                        style={{
                          background: "#4a7c2a",
                          color: "#e8d5a3",
                          border: "none",
                          borderRadius: "4px",
                          padding: "6px 16px",
                          fontFamily: SERIF,
                          fontSize: "12px",
                          fontWeight: "bold",
                          cursor: resolvePlayer.isPending ? "default" : "pointer",
                          opacity: resolvePlayer.isPending ? 0.6 : 1,
                        }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() =>
                          resolvePlayer.mutate({
                            adventurePlayerId: player.id,
                            action: "REJECTED",
                          })
                        }
                        disabled={resolvePlayer.isPending}
                        style={{
                          background: "#e74c3c",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          padding: "6px 16px",
                          fontFamily: SERIF,
                          fontSize: "12px",
                          fontWeight: "bold",
                          cursor: resolvePlayer.isPending ? "default" : "pointer",
                          opacity: resolvePlayer.isPending ? 0.6 : 1,
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                  {isExpanded && renderCharacterOverview(character)}
                </div>
              );
            })}
          </div>

          {/* Divider between pending and accepted */}
          <div
            style={{
              height: "1px",
              background: "rgba(201,168,76,0.2)",
              marginTop: "40px",
            }}
          />
        </div>
      )}

      {/* Accepted Players */}
      {acceptedLoading ? (
        <p style={{ color: GOLD_MUTED, fontSize: "13px", fontFamily: SERIF }}>
          Loading accepted players...
        </p>
      ) : acceptedPlayers.length === 0 ? (
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
            No players have been accepted yet.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {acceptedPlayers.map((player) => {
            const character = (player as unknown as { character?: Record<string, unknown> }).character ?? null;
            const userId = (player as unknown as { userId: string }).userId;
            const characterId = (character as { id?: string } | null)?.id;
            const reactionCount = characterId ? (unreadReactionByCharacter?.[characterId] ?? 0) : 0;
            return (
              <div
                key={player.id}
                style={{
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid rgba(201,168,76,0.2)",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: character ? "pointer" : "default",
                  transition: "border-color 0.15s",
                }}
                onClick={() => {
                  if (character) {
                    setSheetModalPlayer({
                      character,
                      username: player.user.username,
                      userId,
                      adventurePlayerId: player.id,
                      playerNote: (player as unknown as { playerNote?: string }).playerNote,
                    });
                  }
                }}
                onMouseEnter={(e) => {
                  if (character) {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(201,168,76,0.5)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(201,168,76,0.2)";
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
                    {player.user.username}
                  </span>
                  {renderCharacterSummary(character)}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span
                    style={{
                      color: GOLD_MUTED,
                      fontSize: "11px",
                      fontFamily: SERIF,
                    }}
                  >
                    Joined{" "}
                    {new Date(player.joinedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  {reactionCount > 0 && (
                    <span
                      style={{
                        background: "#c9a84c",
                        color: "#1a1a2e",
                        borderRadius: "50%",
                        width: "20px",
                        height: "20px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: "bold",
                      }}
                      title={`${reactionCount} new reaction${reactionCount > 1 ? "s" : ""}`}
                    >
                      {reactionCount}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Character Sheet Modal */}
      {sheetModalPlayer && sheetModalPlayer.character && (
        <CharacterSheetModal
          character={sheetModalPlayer.character}
          username={sheetModalPlayer.username}
          adventureId={adventureId}
          toUserId={sheetModalPlayer.userId}
          adventurePlayerId={sheetModalPlayer.adventurePlayerId}
          adventureItems={adventureItems}
          playerNote={sheetModalPlayer.playerNote}
          onClose={() => setSheetModalPlayer(null)}
        />
      )}
    </div>
  );
}
