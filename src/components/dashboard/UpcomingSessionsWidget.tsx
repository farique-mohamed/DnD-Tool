import { useRouter } from "next/router";
import { api } from "@/utils/api";
import { DashboardCard } from "./DashboardCard";

function formatShortDate(dateVal: string | Date): string {
  const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatShortTime(dateVal: string | Date): string {
  const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

interface SessionData {
  id: string;
  title: string;
  scheduledAt: string | Date;
  adventure?: { id: string; name: string } | null;
}

export function UpcomingSessionsWidget() {
  const router = useRouter();
  const { data: sessions = [], isLoading } =
    api.adventure.getUpcomingSessions.useQuery();

  const upcoming = (sessions as SessionData[]).slice(0, 3);

  return (
    <DashboardCard
      title="Upcoming Sessions"
      icon="📅"
      isLoading={isLoading}
      linkHref="/sessions"
      linkLabel="View All"
    >
      {upcoming.length === 0 ? (
        <p
          style={{
            color: "#a89060",
            fontSize: "13px",
            fontFamily: "'Georgia', serif",
            textAlign: "center",
            padding: "16px 0",
          }}
        >
          No upcoming sessions scheduled.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {upcoming.map((session) => (
            <div
              key={session.id}
              onClick={() =>
                session.adventure
                  ? void router.push(`/adventures/${session.adventure.id}`)
                  : void router.push("/sessions")
              }
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "2px",
                padding: "10px 12px",
                background: "rgba(0,0,0,0.3)",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(201,168,76,0.08)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(0,0,0,0.3)")
              }
            >
              <div
                style={{
                  color: "#a89060",
                  fontSize: "11px",
                  fontFamily: "'Georgia', serif",
                }}
              >
                {formatShortDate(session.scheduledAt)} at{" "}
                {formatShortTime(session.scheduledAt)}
              </div>
              <div
                style={{
                  color: "#c9a84c",
                  fontSize: "13px",
                  fontWeight: "bold",
                  fontFamily: "'Georgia', serif",
                }}
              >
                {session.title}
              </div>
              {session.adventure && (
                <div
                  style={{
                    color: "#a89060",
                    fontSize: "11px",
                    fontFamily: "'Georgia', serif",
                  }}
                >
                  {session.adventure.name}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  );
}
