import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/utils/api";
import { ADVENTURE_LIST } from "@/lib/adventureData";
import { DashboardCard } from "./DashboardCard";

export function MyAdventuresWidget() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: adventures = [], isLoading } = api.adventure.list.useQuery();

  const joined = adventures.filter(
    (a) =>
      user &&
      (a as unknown as { userId: string }).userId !== user.userId,
  );

  return (
    <DashboardCard
      title="My Adventures"
      icon="🗺️"
      isLoading={isLoading}
      linkHref="/adventures"
      linkLabel="View All"
    >
      {joined.length === 0 ? (
        <p
          style={{
            color: "#a89060",
            fontSize: "13px",
            fontFamily: "'Georgia', serif",
            textAlign: "center",
            padding: "16px 0",
          }}
        >
          No adventures yet. Join one with an invite code!
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {joined.slice(0, 4).map((adventure) => (
            <div
              key={adventure.id}
              onClick={() => void router.push(`/adventures/${adventure.id}`)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
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
              <div>
                <div
                  style={{
                    color: "#c9a84c",
                    fontSize: "13px",
                    fontWeight: "bold",
                    fontFamily: "'Georgia', serif",
                  }}
                >
                  {adventure.name}
                </div>
                <div
                  style={{
                    color: "#a89060",
                    fontSize: "11px",
                    fontFamily: "'Georgia', serif",
                    marginTop: "2px",
                  }}
                >
                  {ADVENTURE_LIST.find((a) => a.source === adventure.source)?.name ?? adventure.source}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  );
}
