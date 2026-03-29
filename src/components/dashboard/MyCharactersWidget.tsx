import { useRouter } from "next/router";
import { api } from "@/utils/api";
import { DashboardCard } from "./DashboardCard";

function HpBar({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  const color = pct > 50 ? "#4a7c2a" : pct > 25 ? "#b8934a" : "#8b2a1e";

  return (
    <div
      style={{
        width: "60px",
        height: "6px",
        background: "rgba(255,255,255,0.08)",
        borderRadius: "3px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: color,
          borderRadius: "3px",
          transition: "width 0.3s",
        }}
      />
    </div>
  );
}

export function MyCharactersWidget() {
  const router = useRouter();
  const { data: characters, isLoading } = api.character.list.useQuery();

  const display = characters?.slice(0, 4);
  const total = characters?.length ?? 0;

  return (
    <DashboardCard
      title="My Characters"
      icon="🛡️"
      isLoading={isLoading}
      linkHref="/characters"
      linkLabel={total > 4 ? `View All (${total})` : "View All"}
    >
      {!display || display.length === 0 ? (
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <p
            style={{
              color: "#a89060",
              fontSize: "13px",
              fontFamily: "'Georgia', serif",
              marginBottom: "12px",
            }}
          >
            No characters yet.
          </p>
          <button
            onClick={() => void router.push("/characters/new")}
            style={{
              background: "linear-gradient(135deg, #8b6914, #c9a84c)",
              color: "#1a1a2e",
              border: "none",
              borderRadius: "6px",
              padding: "8px 20px",
              fontSize: "12px",
              fontFamily: "'Georgia', serif",
              fontWeight: "bold",
              cursor: "pointer",
              letterSpacing: "0.5px",
            }}
          >
            Create Your First Character
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {display.map((c) => {
            const ap =
              c.adventurePlayers && c.adventurePlayers.length > 0
                ? c.adventurePlayers[0]!
                : null;
            return (
              <div
                key={c.id}
                onClick={() => void router.push(`/characters/${c.id}`)}
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
                    {c.name}
                  </div>
                  <div
                    style={{
                      color: "#a89060",
                      fontSize: "11px",
                      fontFamily: "'Georgia', serif",
                      marginTop: "2px",
                    }}
                  >
                    Lvl {c.level} {c.race} {c.characterClass}
                  </div>
                  {ap && (
                    <span
                      style={{
                        display: "inline-block",
                        marginTop: "4px",
                        padding: "1px 8px",
                        borderRadius: "10px",
                        fontSize: "10px",
                        fontFamily: "'Georgia', serif",
                        background:
                          ap.status === "ACCEPTED"
                            ? "rgba(74,124,42,0.2)"
                            : "rgba(201,168,76,0.15)",
                        border:
                          ap.status === "ACCEPTED"
                            ? "1px solid rgba(74,124,42,0.4)"
                            : "1px solid rgba(201,168,76,0.3)",
                        color: ap.status === "ACCEPTED" ? "#4a7c2a" : "#a89060",
                      }}
                    >
                      {ap.status === "ACCEPTED" ? "In" : "Pending"}:{" "}
                      {ap.adventure.name}
                    </span>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      color: "#e8d5a3",
                      fontSize: "12px",
                      fontFamily: "'Georgia', serif",
                      marginBottom: "4px",
                    }}
                  >
                    <span style={{ color: "#b8934a" }}>HP</span>{" "}
                    {c.currentHp}/{c.maxHp}
                  </div>
                  <HpBar current={c.currentHp} max={c.maxHp} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardCard>
  );
}
