import { useMemo } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { api } from "@/utils/api";
import {
  Card,
  Badge,
  PageHeader,
  GOLD,
  GOLD_BRIGHT,
  GOLD_MUTED,
  GOLD_DARK,
  DANGER_RED,
  SUCCESS_GREEN_BORDER,
  SERIF,
} from "@/components/ui";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatSessionDate(dateVal: string | Date): string {
  const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatSessionTime(dateVal: string | Date): string {
  const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h} hour${h > 1 ? "s" : ""}`;
}

function getMonthKey(dateVal: string | Date): string {
  const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function getStatusColor(status: string): string {
  switch (status) {
    case "SCHEDULED":
      return SUCCESS_GREEN_BORDER;
    case "COMPLETED":
      return GOLD;
    case "CANCELLED":
      return DANGER_RED;
    default:
      return GOLD_MUTED;
  }
}

// ---------------------------------------------------------------------------
// Session Card
// ---------------------------------------------------------------------------

interface SessionData {
  id: string;
  title: string;
  description?: string | null;
  scheduledAt: string | Date;
  duration?: number | null;
  location?: string | null;
  inGameDate?: string | null;
  status: string;
  adventure?: { id: string; name: string } | null;
}

function SessionCard({ session }: { session: SessionData }) {
  const router = useRouter();

  return (
    <div
      style={{ cursor: session.adventure ? "pointer" : "default" }}
      onClick={
        session.adventure
          ? () => void router.push(`/adventures/${session.adventure!.id}`)
          : undefined
      }
    >
    <Card
      variant="light"
      style={{
        padding: "16px 20px",
      }}
    >
      {/* Date and time */}
      <div
        style={{
          color: GOLD_MUTED,
          fontSize: "12px",
          fontFamily: SERIF,
          letterSpacing: "0.5px",
          marginBottom: "6px",
        }}
      >
        {formatSessionDate(session.scheduledAt)} at{" "}
        {formatSessionTime(session.scheduledAt)}
      </div>

      {/* Title */}
      <div
        style={{
          color: GOLD,
          fontSize: "15px",
          fontWeight: "bold",
          fontFamily: SERIF,
          marginBottom: "8px",
        }}
      >
        {session.title}
      </div>

      {/* Meta row */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "10px",
          marginBottom: session.inGameDate || session.description ? "8px" : "0",
        }}
      >
        {session.adventure && (
          <Badge>{session.adventure.name}</Badge>
        )}
        {session.duration && (
          <span
            style={{
              color: GOLD_BRIGHT,
              fontSize: "12px",
              fontFamily: SERIF,
            }}
          >
            Duration: {formatDuration(session.duration)}
          </span>
        )}
        {session.location && (
          <span
            style={{
              color: GOLD_BRIGHT,
              fontSize: "12px",
              fontFamily: SERIF,
            }}
          >
            Location: {session.location}
          </span>
        )}
        <Badge color={getStatusColor(session.status)}>
          {session.status}
        </Badge>
      </div>

      {/* In-game date */}
      {session.inGameDate && (
        <div
          style={{
            color: GOLD_MUTED,
            fontSize: "12px",
            fontFamily: SERIF,
            fontStyle: "italic",
            marginBottom: session.description ? "6px" : "0",
          }}
        >
          In-game: {session.inGameDate}
        </div>
      )}

      {/* Description */}
      {session.description && (
        <div
          style={{
            color: GOLD_BRIGHT,
            fontSize: "12px",
            fontFamily: SERIF,
            opacity: 0.8,
            marginTop: "4px",
          }}
        >
          {session.description}
        </div>
      )}
    </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sessions Calendar Page
// ---------------------------------------------------------------------------

function SessionsCalendarContent() {
  const { data: sessions = [], isLoading } =
    api.adventure.getUpcomingSessions.useQuery();

  const grouped = useMemo(() => {
    const map = new Map<string, SessionData[]>();
    for (const s of sessions as SessionData[]) {
      const key = getMonthKey(s.scheduledAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return map;
  }, [sessions]);

  return (
    <>
      <Head>
        <title>Session Calendar — DnD Tool</title>
      </Head>

      <PageHeader
        title="Session Calendar"
        subtitle="Your upcoming game sessions"
      />

      {isLoading ? (
        <p
          style={{
            color: GOLD_MUTED,
            fontSize: "14px",
            fontFamily: SERIF,
            textAlign: "center",
            padding: "40px 0",
          }}
        >
          Consulting the arcane records...
        </p>
      ) : (sessions as SessionData[]).length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
          }}
        >
          <p
            style={{
              color: GOLD_MUTED,
              fontSize: "16px",
              fontFamily: SERIF,
            }}
          >
            No upcoming sessions scheduled
          </p>
          <p
            style={{
              color: GOLD_DARK,
              fontSize: "13px",
              fontFamily: SERIF,
              marginTop: "8px",
            }}
          >
            When a Dungeon Master schedules a session for one of your adventures,
            it will appear here.
          </p>
        </div>
      ) : (
        <div
          style={{
            maxWidth: "700px",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: "32px",
          }}
        >
          {Array.from(grouped.entries()).map(([month, monthSessions]) => (
            <div key={month}>
              {/* Month heading */}
              <h2
                style={{
                  color: GOLD,
                  fontSize: "14px",
                  fontWeight: "bold",
                  fontFamily: SERIF,
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                  marginBottom: "16px",
                  paddingBottom: "8px",
                  borderBottom: `1px solid ${GOLD_DARK}`,
                }}
              >
                {month}
              </h2>

              {/* Session cards */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {monthSessions.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default function SessionsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <SessionsCalendarContent />
      </Layout>
    </ProtectedRoute>
  );
}
