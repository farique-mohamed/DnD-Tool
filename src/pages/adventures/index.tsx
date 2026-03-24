import { useMemo, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/utils/api";
import { ADVENTURE_LIST } from "@/lib/adventureData";

// ---------------------------------------------------------------------------
// Invite Code Button (DM only) — inline popup showing the code
// ---------------------------------------------------------------------------

function InviteCodeButton({
  adventureId,
  isActive,
  onToggle,
  onClose,
}: {
  adventureId: string;
  isActive: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const { data, isLoading } = api.adventure.getInviteCode.useQuery(
    { adventureId },
    { enabled: isActive },
  );
  const [copied, setCopied] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
          setCopied(false);
        }}
        style={{
          background: "transparent",
          border: "1px solid rgba(201,168,76,0.5)",
          color: "#c9a84c",
          borderRadius: "4px",
          padding: "6px 16px",
          fontFamily: "'Georgia', serif",
          cursor: "pointer",
          fontSize: "12px",
          whiteSpace: "nowrap",
        }}
      >
        Get Invite Code
      </button>

      {isActive && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            background: "rgba(15,8,3,0.95)",
            border: "2px solid #c9a84c",
            borderRadius: "8px",
            padding: "16px",
            zIndex: 100,
            minWidth: "220px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
          }}
        >
          <p
            style={{
              color: "#a89060",
              fontSize: "11px",
              fontFamily: "'Georgia', serif",
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Invite Code
          </p>
          {isLoading ? (
            <p style={{ color: "#e8d5a3", fontSize: "13px", fontFamily: "'Georgia', serif" }}>
              Loading...
            </p>
          ) : data ? (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <code
                style={{
                  flex: 1,
                  background: "rgba(30,15,5,0.9)",
                  border: "1px solid rgba(201,168,76,0.3)",
                  borderRadius: "4px",
                  padding: "8px 10px",
                  color: "#e8d5a3",
                  fontFamily: "monospace",
                  fontSize: "14px",
                  letterSpacing: "1px",
                  userSelect: "all",
                }}
              >
                {data.inviteCode}
              </code>
              <button
                onClick={() => {
                  void navigator.clipboard.writeText(data.inviteCode);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(201,168,76,0.5)",
                  color: copied ? "#4a7c2a" : "#c9a84c",
                  borderRadius: "4px",
                  padding: "6px 10px",
                  fontFamily: "'Georgia', serif",
                  cursor: "pointer",
                  fontSize: "11px",
                  whiteSpace: "nowrap",
                }}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          ) : null}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            style={{
              background: "none",
              border: "none",
              color: "#a89060",
              fontSize: "11px",
              cursor: "pointer",
              fontFamily: "'Georgia', serif",
              padding: "0",
              marginTop: "8px",
            }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

function AdventureCard({
  adventure,
  showInviteCode,
  showPendingBadge,
  activeInviteAdventureId,
  setActiveInviteAdventureId,
  onClick,
  unreadNoteCount,
}: {
  adventure: { id: string; name: string; source: string; createdAt: Date; userId: string; _count?: { players?: number } };
  showInviteCode: boolean;
  showPendingBadge: boolean;
  activeInviteAdventureId: string | null;
  setActiveInviteAdventureId: (id: string | null) => void;
  onClick: () => void;
  unreadNoteCount?: number;
}) {
  const pendingCount = adventure._count?.players ?? 0;
  return (
    <div
      onClick={onClick}
      style={{
        background: "rgba(0,0,0,0.4)",
        border: "1px solid rgba(201,168,76,0.2)",
        borderRadius: "12px",
        padding: "20px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        cursor: "pointer",
      }}
    >
      <div>
        <h2
          style={{
            color: "#c9a84c",
            fontSize: "16px",
            fontWeight: "bold",
            letterSpacing: "1px",
            textTransform: "uppercase",
            marginBottom: "4px",
            fontFamily: "'Georgia', 'Times New Roman', serif",
          }}
        >
          {adventure.name}
        </h2>
        <p style={{ color: "#a89060", fontSize: "13px", fontFamily: "'Georgia', 'Times New Roman', serif", marginBottom: "2px" }}>
          {ADVENTURE_LIST.find((a) => a.source === adventure.source)?.name ?? adventure.source}
        </p>
        <p style={{ color: "#8b7a5e", fontSize: "11px", fontFamily: "'Georgia', 'Times New Roman', serif" }}>
          Created{" "}
          {new Date(adventure.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {showPendingBadge && pendingCount > 0 && (
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
            title={`${pendingCount} pending join request${pendingCount > 1 ? "s" : ""}`}
          >
            {pendingCount}
          </span>
        )}
        {!!unreadNoteCount && unreadNoteCount > 0 && (
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
            title={`${unreadNoteCount} unread DM note${unreadNoteCount > 1 ? "s" : ""}`}
          >
            {unreadNoteCount}
          </span>
        )}
        {showInviteCode && (
          <InviteCodeButton
            adventureId={adventure.id}
            isActive={activeInviteAdventureId === adventure.id}
            onToggle={() =>
              setActiveInviteAdventureId(
                activeInviteAdventureId === adventure.id ? null : adventure.id,
              )
            }
            onClose={() => setActiveInviteAdventureId(null)}
          />
        )}
      </div>
    </div>
  );
}

function AdventuresContent() {
  const router = useRouter();
  const { user } = useAuth();
  const apiUtils = api.useUtils();
  const { data: adventures = [], isLoading } = api.adventure.list.useQuery();
  const { data: unreadNoteCounts = [] } = api.adventure.getUnreadNoteCount.useQuery();

  // Build a lookup map for unread note counts
  const unreadNoteMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const entry of unreadNoteCounts as unknown as Array<{ adventureId: string; count: number }>) {
      map[entry.adventureId] = entry.count;
    }
    return map;
  }, [unreadNoteCounts]);

  // Join Adventure modal state
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [joinStep, setJoinStep] = useState<"code" | "character">("code");
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("");
  const [joinMessage, setJoinMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const { data: characters = [] } = api.character.list.useQuery();

  const joinByCode = api.adventure.joinByCode.useMutation({
    onSuccess: (data) => {
      setJoinMessage({ type: "success", text: `Successfully joined "${data.adventureName}"!` });
      setInviteCodeInput("");
      setJoinStep("code");
      setSelectedCharacterId("");
      void apiUtils.adventure.list.invalidate();
    },
    onError: (err) => {
      setJoinMessage({ type: "error", text: err.message });
    },
  });

  // Invite code popup state (for DM/ADMIN role)
  const [activeInviteAdventureId, setActiveInviteAdventureId] = useState<string | null>(null);

  const isDM = user?.role === "DUNGEON_MASTER" || user?.role === "ADMIN";

  // Split adventures into owned (campaigns) and joined
  const ownedAdventures = adventures.filter(
    (a) => user && (a as unknown as { userId: string }).userId === user.userId,
  );
  const joinedAdventures = adventures.filter(
    (a) => user && (a as unknown as { userId: string }).userId !== user.userId,
  );

  const openJoinModal = () => {
    setShowJoinModal(true);
    setJoinMessage(null);
    setInviteCodeInput("");
    setJoinStep("code");
    setSelectedCharacterId("");
  };

  const handleNextStep = () => {
    if (inviteCodeInput.trim()) {
      setJoinStep("character");
      setJoinMessage(null);
    }
  };

  const handleJoinSubmit = () => {
    if (inviteCodeInput.trim() && selectedCharacterId) {
      joinByCode.mutate({ inviteCode: inviteCodeInput.trim(), characterId: selectedCharacterId });
    }
  };

  // Render a section of adventures with a heading
  const renderSection = (title: string, list: typeof adventures, showInvite: boolean, showBadge: boolean) => (
    <div style={{ marginBottom: "32px" }}>
      <h2
        style={{
          color: "#c9a84c",
          fontSize: "18px",
          fontWeight: "bold",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          marginBottom: "16px",
          fontFamily: "'Georgia', 'Times New Roman', serif",
        }}
      >
        {title}
      </h2>
      {list.length === 0 ? (
        <div
          style={{
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(201,168,76,0.2)",
            borderRadius: "12px",
            padding: "40px",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#a89060", fontSize: "13px", fontFamily: "'Georgia', 'Times New Roman', serif" }}>
            No adventures in this section yet.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {list.map((adventure) => (
            <AdventureCard
              key={adventure.id}
              adventure={adventure as unknown as { id: string; name: string; source: string; createdAt: Date; userId: string; _count?: { players?: number } }}
              showInviteCode={showInvite}
              showPendingBadge={showBadge}
              activeInviteAdventureId={activeInviteAdventureId}
              setActiveInviteAdventureId={setActiveInviteAdventureId}
              unreadNoteCount={unreadNoteMap[adventure.id] ?? 0}
              onClick={() => void router.push(`/adventures/${adventure.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      <Head>
        <title>Adventures — DnD Tool</title>
      </Head>
      <div style={{ maxWidth: "900px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1
              style={{
                color: "#c9a84c",
                fontSize: "26px",
                fontWeight: "bold",
                letterSpacing: "2px",
                textTransform: "uppercase",
                marginBottom: "8px",
                fontFamily: "'Georgia', 'Times New Roman', serif",
              }}
            >
              Adventures
            </h1>
            <p style={{ color: "#a89060", fontSize: "14px", marginBottom: "32px", fontFamily: "'Georgia', 'Times New Roman', serif" }}>
              {isDM ? "Your campaigns and adventures you have joined." : "Your ongoing quests and adventures."}
            </p>
          </div>
          <button
            onClick={openJoinModal}
            style={{
              background: "linear-gradient(135deg, #8b6914, #c9a84c)",
              color: "#1a1a2e",
              border: "none",
              borderRadius: "6px",
              padding: "12px 28px",
              fontSize: "14px",
              fontFamily: "'Georgia', serif",
              fontWeight: "bold",
              cursor: "pointer",
              letterSpacing: "0.5px",
              whiteSpace: "nowrap",
            }}
          >
            Join Adventure
          </button>
        </div>
        <div
          style={{
            width: "80px",
            height: "2px",
            background: "#c9a84c",
            marginBottom: "32px",
            opacity: 0.6,
          }}
        />

        {isLoading ? (
          <p style={{ color: "#a89060", fontSize: "14px", fontFamily: "'Georgia', 'Times New Roman', serif" }}>
            Loading your adventures...
          </p>
        ) : adventures.length === 0 ? (
          <div
            style={{
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(201,168,76,0.2)",
              borderRadius: "12px",
              padding: "60px 40px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>🎲</div>
            <p
              style={{
                color: "#e8d5a3",
                fontSize: "15px",
                marginBottom: "8px",
                fontFamily: "'Georgia', 'Times New Roman', serif",
              }}
            >
              No adventures yet, brave soul.
            </p>
            <p style={{ color: "#a89060", fontSize: "13px", fontFamily: "'Georgia', 'Times New Roman', serif" }}>
              Wait for a Dungeon Master to invite you, or create your own campaign.
            </p>
          </div>
        ) : isDM ? (
          <>
            {renderSection("My Campaigns", ownedAdventures, true, true)}
            {renderSection("Joined Adventures", joinedAdventures, false, false)}
          </>
        ) : (
          renderSection("My Adventures", adventures, false, false)
        )}
      </div>

      {/* Join Adventure Modal */}
      {showJoinModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowJoinModal(false)}
        >
          <div
            style={{
              background: "rgba(15,8,3,0.95)",
              border: "2px solid #c9a84c",
              borderRadius: "12px",
              padding: "32px",
              maxWidth: "440px",
              width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                color: "#c9a84c",
                fontSize: "18px",
                fontWeight: "bold",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                marginBottom: "8px",
                fontFamily: "'Georgia', 'Times New Roman', serif",
              }}
            >
              Join Adventure
            </h2>

            {joinStep === "code" && (
              <>
                <p
                  style={{
                    color: "#a89060",
                    fontSize: "13px",
                    fontFamily: "'Georgia', 'Times New Roman', serif",
                    marginBottom: "20px",
                  }}
                >
                  Enter the invite code provided by your Dungeon Master.
                </p>

                <input
                  type="text"
                  placeholder="Enter invite code..."
                  autoFocus
                  value={inviteCodeInput}
                  onChange={(e) => {
                    setInviteCodeInput(e.target.value);
                    setJoinMessage(null);
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "rgba(30,15,5,0.9)",
                    border: "1px solid rgba(201,168,76,0.3)",
                    borderRadius: "6px",
                    color: "#e8d5a3",
                    fontFamily: "'Georgia', serif",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    outline: "none",
                    marginBottom: "16px",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && inviteCodeInput.trim()) {
                      handleNextStep();
                    }
                  }}
                />

                {joinMessage && (
                  <p
                    style={{
                      color: joinMessage.type === "success" ? "#4a7c2a" : "#e74c3c",
                      fontSize: "13px",
                      fontFamily: "'Georgia', serif",
                      marginBottom: "12px",
                    }}
                  >
                    {joinMessage.text}
                  </p>
                )}

                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => setShowJoinModal(false)}
                    style={{
                      background: "transparent",
                      border: "1px solid rgba(201,168,76,0.5)",
                      color: "#c9a84c",
                      borderRadius: "4px",
                      padding: "6px 16px",
                      fontFamily: "'Georgia', serif",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleNextStep}
                    disabled={!inviteCodeInput.trim()}
                    style={{
                      background: "linear-gradient(135deg, #8b6914, #c9a84c)",
                      color: "#1a1a2e",
                      border: "none",
                      borderRadius: "6px",
                      padding: "12px 28px",
                      fontSize: "14px",
                      fontFamily: "'Georgia', serif",
                      fontWeight: "bold",
                      cursor: !inviteCodeInput.trim() ? "default" : "pointer",
                      letterSpacing: "0.5px",
                      opacity: !inviteCodeInput.trim() ? 0.6 : 1,
                    }}
                  >
                    Next
                  </button>
                </div>
              </>
            )}

            {joinStep === "character" && (
              <>
                <p
                  style={{
                    color: "#a89060",
                    fontSize: "13px",
                    fontFamily: "'Georgia', 'Times New Roman', serif",
                    marginBottom: "20px",
                  }}
                >
                  Select a character to join with.
                </p>

                {characters.length === 0 ? (
                  <div
                    style={{
                      background: "rgba(0,0,0,0.4)",
                      border: "1px solid rgba(201,168,76,0.2)",
                      borderRadius: "8px",
                      padding: "24px",
                      textAlign: "center",
                      marginBottom: "16px",
                    }}
                  >
                    <p
                      style={{
                        color: "#e8d5a3",
                        fontSize: "14px",
                        fontFamily: "'Georgia', serif",
                        marginBottom: "4px",
                      }}
                    >
                      You need to create a character first before joining an adventure.
                    </p>
                    <p
                      style={{
                        color: "#a89060",
                        fontSize: "12px",
                        fontFamily: "'Georgia', serif",
                      }}
                    >
                      Head to &quot;My Characters&quot; to create one.
                    </p>
                  </div>
                ) : (
                  <div style={{ marginBottom: "16px" }}>
                    <select
                      value={selectedCharacterId}
                      onChange={(e) => {
                        setSelectedCharacterId(e.target.value);
                        setJoinMessage(null);
                      }}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        background: "rgba(30,15,5,0.9)",
                        border: "1px solid rgba(201,168,76,0.3)",
                        borderRadius: "6px",
                        color: "#e8d5a3",
                        fontFamily: "'Georgia', serif",
                        fontSize: "14px",
                        boxSizing: "border-box",
                        outline: "none",
                      }}
                    >
                      <option value="" style={{ background: "#1a1a2e", color: "#a89060" }}>
                        -- Select a character --
                      </option>
                      {characters.map((c) => {
                        const char = c as unknown as {
                          id: string;
                          name: string;
                          level: number;
                          characterClass: string;
                          adventurePlayers?: Array<{
                            status: string;
                            adventure: { id: string; name: string; source: string };
                          }>;
                        };
                        const inAdventure = char.adventurePlayers && char.adventurePlayers.length > 0;
                        const adventureName = inAdventure ? char.adventurePlayers![0]!.adventure.name : "";
                        return (
                          <option
                            key={char.id}
                            value={char.id}
                            disabled={!!inAdventure}
                            style={{
                              background: "#1a1a2e",
                              color: inAdventure ? "#665e4a" : "#e8d5a3",
                            }}
                          >
                            {char.name} — Level {char.level} {char.characterClass}
                            {inAdventure ? ` (In: ${adventureName})` : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                {joinMessage && (
                  <p
                    style={{
                      color: joinMessage.type === "success" ? "#4a7c2a" : "#e74c3c",
                      fontSize: "13px",
                      fontFamily: "'Georgia', serif",
                      marginBottom: "12px",
                    }}
                  >
                    {joinMessage.text}
                  </p>
                )}

                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => {
                      setJoinStep("code");
                      setJoinMessage(null);
                    }}
                    style={{
                      background: "transparent",
                      border: "1px solid rgba(201,168,76,0.5)",
                      color: "#c9a84c",
                      borderRadius: "4px",
                      padding: "6px 16px",
                      fontFamily: "'Georgia', serif",
                      cursor: "pointer",
                    }}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleJoinSubmit}
                    disabled={!selectedCharacterId || joinByCode.isPending}
                    style={{
                      background: "linear-gradient(135deg, #8b6914, #c9a84c)",
                      color: "#1a1a2e",
                      border: "none",
                      borderRadius: "6px",
                      padding: "12px 28px",
                      fontSize: "14px",
                      fontFamily: "'Georgia', serif",
                      fontWeight: "bold",
                      cursor: !selectedCharacterId || joinByCode.isPending ? "default" : "pointer",
                      letterSpacing: "0.5px",
                      opacity: !selectedCharacterId || joinByCode.isPending ? 0.6 : 1,
                    }}
                  >
                    {joinByCode.isPending ? "Joining..." : "Join Quest"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function AdventuresPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <AdventuresContent />
      </Layout>
    </ProtectedRoute>
  );
}
