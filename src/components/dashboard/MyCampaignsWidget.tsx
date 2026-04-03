import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/utils/api";
import { ADVENTURE_LIST } from "@/lib/adventureData";
import { DashboardCard } from "./DashboardCard";

export function MyCampaignsWidget() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: adventures = [], isLoading } = api.adventure.list.useQuery();

  const owned = adventures.filter(
    (a) =>
      user &&
      (a as unknown as { userId: string }).userId === user.userId,
  );

  return (
    <DashboardCard
      title="My Campaigns"
      icon="📜"
      isLoading={isLoading}
      linkHref="/adventures"
      linkLabel="View All"
    >
      {owned.length === 0 ? (
        <p
          style={{
            color: "#a89060",
            fontSize: "13px",
            fontFamily: "'Georgia', serif",
            textAlign: "center",
            padding: "16px 0",
          }}
        >
          You haven't created any campaigns yet.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {owned.slice(0, 4).map((adventure) => {
            const pendingCount =
              (adventure as unknown as { _count?: { players?: number } })._count
                ?.players ?? 0;
            return (
              <div
                key={adventure.id}
                onClick={() =>
                  void router.push(`/adventures/${adventure.id}`)
                }
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
                {pendingCount > 0 && (
                  <span
                    style={{
                      background: "#c9a84c",
                      color: "#1a1a2e",
                      borderRadius: "50%",
                      width: "22px",
                      height: "22px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "11px",
                      fontWeight: "bold",
                      flexShrink: 0,
                    }}
                    title={`${pendingCount} pending join request${pendingCount > 1 ? "s" : ""}`}
                  >
                    {pendingCount}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardCard>
  );
}
