import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { DiceRoller } from "@/components/DiceRoller";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/useIsMobile";
import { api } from "@/utils/api";
import { ADVENTURE_LIST } from "@/lib/adventureData";
import {
  DM_TABS,
  PLAYER_TABS,
  PLAYERS_TAB,
  type TabKey,
  StoryTab,
  MonstersTab,
  ItemsTab,
  PlayersTab,
  SessionNotesTab,
  SessionsTab,
  MyCharacterTab,
  InventoryTab,
  PlayerDmNotesTab,
  EncounterTab,
} from "@/components/adventure";

// ---------------------------------------------------------------------------
// Main page content
// ---------------------------------------------------------------------------

function AdventureDetailContent() {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const router = useRouter();
  const id = typeof router.query.id === "string" ? router.query.id : "";

  const [storySectionIndex, setStorySectionIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<TabKey | null>(null);

  const { data: adventure, isLoading } = api.adventure.getById.useQuery(
    { id },
    { enabled: !!id },
  );

  const isOwner = !!(adventure && user && adventure.userId === user.userId);

  const { data: unreadReactionCounts = [] } = api.adventure.getUnreadReactionCount.useQuery(
    undefined,
    { enabled: isOwner },
  );

  // Build a lookup map for the current adventure's character-level reaction counts
  const unreadReactionMap = useMemo(() => {
    const map: Record<string, number> = {};
    let total = 0;
    for (const entry of unreadReactionCounts as unknown as Array<{ adventureId: string; characterId: string; count: number }>) {
      if (adventure && entry.adventureId === adventure.id) {
        map[entry.characterId] = entry.count;
        total += entry.count;
      }
    }
    return { byCharacter: map, total };
  }, [unreadReactionCounts, adventure]);

  // Set default tab once adventure data is available
  const resolvedTab: TabKey = activeTab ?? (isOwner ? "story" : "mycharacter");

  // Count pending players from the adventure.players array
  const pendingPlayerCount = adventure
    ? ((adventure as unknown as { players?: Array<{ status: string }> }).players ?? []).filter(
        (p) => p.status === "PENDING",
      ).length
    : 0;

  // Build tabs dynamically — DM gets Story/Monsters/Items/SessionNotes/Players, Player gets MyCharacter/Inventory/DmNotes/SessionNotes
  const tabs: Array<{ key: string; label: string }> = isOwner
    ? [...DM_TABS, PLAYERS_TAB]
    : [...PLAYER_TABS];

  const adventureInfo = adventure
    ? ADVENTURE_LIST.find((a) => a.source === adventure.source)
    : null;

  if (isLoading || !id) {
    return (
      <p
        style={{
          color: "#a89060",
          fontSize: "14px",
          fontFamily: "'Georgia', 'Times New Roman', serif",
        }}
      >
        Loading adventure...
      </p>
    );
  }

  if (!adventure) {
    return (
      <div
        style={{
          background: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(201,168,76,0.2)",
          borderRadius: "12px",
          padding: isMobile ? "32px 16px" : "60px 40px",
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
          Adventure not found.
        </p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{adventure.name} — DnD Tool</title>
      </Head>

      {/* Breadcrumb */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "20px",
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: "13px",
          color: "#a89060",
        }}
      >
        <button
          onClick={() => void router.push("/adventures")}
          style={{
            background: "none",
            border: "none",
            color: "#c9a84c",
            cursor: "pointer",
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontSize: "13px",
            padding: "0",
            textDecoration: "underline",
          }}
        >
          {isOwner ? "My Campaigns" : "My Adventures"}
        </button>
        <span>/</span>
        <span>{adventure.name}</span>
      </div>

      {/* Heading */}
      <h1
        style={{
          color: "#c9a84c",
          fontSize: isMobile ? "20px" : "26px",
          fontWeight: "bold",
          letterSpacing: "2px",
          textTransform: "uppercase",
          marginBottom: "8px",
          fontFamily: "'Georgia', 'Times New Roman', serif",
        }}
      >
        {adventure.name}
      </h1>

      {/* Subtitle — book name */}
      {adventureInfo && (
        <p
          style={{
            color: "#a89060",
            fontSize: "14px",
            fontFamily: "'Georgia', 'Times New Roman', serif",
            marginBottom: "16px",
          }}
        >
          {adventureInfo.name}
        </p>
      )}

      {/* Divider */}
      <div
        style={{
          width: "80px",
          height: "2px",
          background: "#c9a84c",
          marginBottom: "24px",
          opacity: 0.6,
        }}
      />

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: "0",
          borderBottom: "1px solid rgba(201,168,76,0.3)",
          marginBottom: "24px",
          ...(isMobile ? {
            overflowX: "auto" as const,
            whiteSpace: "nowrap" as const,
            WebkitOverflowScrolling: "touch" as const,
            msOverflowStyle: "none" as const,
            scrollbarWidth: "none" as const,
          } : {}),
        }}
      >
        {tabs.map((tab) => {
          const isActive = resolvedTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabKey)}
              style={{
                padding: isMobile ? "8px 12px" : "12px 24px",
                background: isActive ? "rgba(201,168,76,0.15)" : "transparent",
                border: "none",
                borderBottom: isActive
                  ? "2px solid #c9a84c"
                  : "2px solid transparent",
                color: isActive ? "#c9a84c" : "#a89060",
                fontSize: isMobile ? "11px" : "14px",
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontWeight: "bold",
                letterSpacing: "1px",
                textTransform: "uppercase",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexShrink: 0,
              }}
            >
              {tab.label}
              {tab.key === "players" && pendingPlayerCount > 0 && (
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
                >
                  {pendingPlayerCount}
                </span>
              )}
              {tab.key === "players" && unreadReactionMap.total > 0 && (
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
                  title={`${unreadReactionMap.total} new player reaction${unreadReactionMap.total > 1 ? "s" : ""}`}
                >
                  {unreadReactionMap.total}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {resolvedTab === "story" && isOwner && (
        <StoryTab
          source={adventure.source}
          sectionIndex={storySectionIndex}
          onSectionIndexChange={setStorySectionIndex}
        />
      )}
      {resolvedTab === "monsters" && isOwner && (
        <MonstersTab
          adventureId={adventure.id}
          adventureSource={adventure.source}
          monsters={adventure.monsters}
          onViewInStory={(idx) => {
            setStorySectionIndex(idx);
            setActiveTab("story");
          }}
        />
      )}
      {resolvedTab === "items" && isOwner && (
        <ItemsTab
          adventureId={adventure.id}
          adventureSource={adventure.source}
          items={adventure.items}
          acceptedPlayers={
            ((adventure as unknown as { players: Array<{ id: string; status: string; user: { id: string; username: string }; character: Record<string, unknown> | null }> }).players ?? [])
              .filter((p) => p.status === "ACCEPTED")
              .map((p) => ({ id: p.id, user: p.user, character: p.character }))
          }
          onViewInStory={(idx) => {
            setStorySectionIndex(idx);
            setActiveTab("story");
          }}
        />
      )}
      {resolvedTab === "players" && isOwner && (
        <PlayersTab adventureId={adventure.id} adventureItems={adventure.items} unreadReactionByCharacter={unreadReactionMap.byCharacter} />
      )}
      {resolvedTab === "encounter" && (
        <EncounterTab
          adventureId={adventure.id}
          isOwner={isOwner}
          acceptedPlayers={
            ((adventure as unknown as { players: Array<{ id: string; status: string; user: { id: string; username: string }; character: { id: string; name: string; characterClass: string; level: number; maxHp: number; currentHp: number; tempHp: number; armorClass: number } | null }> }).players ?? [])
              .filter((p) => p.status === "ACCEPTED")
              .map((p) => ({ id: p.id, user: p.user, character: p.character }))
          }
          adventureMonsters={adventure.monsters}
        />
      )}
      {resolvedTab === "sessions" && (
        <SessionsTab adventureId={adventure.id} isOwner={isOwner} />
      )}
      {resolvedTab === "sessionnotes" && (
        <SessionNotesTab adventureId={adventure.id} />
      )}
      {resolvedTab === "mycharacter" && !isOwner && (
        <MyCharacterTab adventure={adventure as unknown as { id: string; players: Array<{ userId: string; status: string; character: Record<string, unknown> }> }} />
      )}
      {resolvedTab === "dmnotes" && !isOwner && (
        <PlayerDmNotesTab adventure={adventure as unknown as { id: string; players: Array<{ id: string; userId: string; status: string; playerNote?: string; character: { id: string } }> }} />
      )}
      {resolvedTab === "inventory" && !isOwner && (
        <InventoryTab
          adventure={
            adventure as unknown as {
              id: string;
              players: Array<{
                id: string;
                userId: string;
                status: string;
                character: Record<string, unknown>;
              }>;
            }
          }
        />
      )}
      {id && <DiceRoller adventureId={id} />}
    </>
  );
}

// ---------------------------------------------------------------------------
// Page export
// ---------------------------------------------------------------------------

export default function AdventureDetailPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <AdventureDetailContent />
      </Layout>
    </ProtectedRoute>
  );
}
