import { api } from "@/utils/api";
import { DashboardCard } from "./DashboardCard";

function timeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function DiceHistoryWidget({ adventureId }: { adventureId: string }) {
  const { data: rolls, isLoading } = api.dice.history.useQuery({ adventureId, limit: 5 });

  return (
    <DashboardCard title="Recent Rolls" icon="🎲" isLoading={isLoading}>
      {!rolls || rolls.length === 0 ? (
        <p
          style={{
            color: "#a89060",
            fontSize: "13px",
            fontFamily: "'Georgia', serif",
            textAlign: "center",
            padding: "16px 0",
          }}
        >
          No dice rolls yet. Use the dice roller to get started!
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {rolls.map((roll) => (
            <div
              key={roll.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 10px",
                background: "rgba(0,0,0,0.3)",
                borderRadius: "8px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span
                  style={{
                    color: "#c9a84c",
                    fontSize: "18px",
                    fontWeight: "bold",
                    fontFamily: "'Georgia', serif",
                    minWidth: "28px",
                    textAlign: "center",
                  }}
                >
                  {roll.result}
                </span>
                <div>
                  <div
                    style={{
                      color: "#e8d5a3",
                      fontSize: "12px",
                      fontFamily: "'Georgia', serif",
                    }}
                  >
                    {roll.diceType}
                    {roll.rollMode !== "NORMAL" && (
                      <span
                        style={{
                          marginLeft: "6px",
                          padding: "1px 6px",
                          borderRadius: "4px",
                          fontSize: "9px",
                          fontWeight: "bold",
                          letterSpacing: "0.5px",
                          background:
                            roll.rollMode === "ADVANTAGE"
                              ? "rgba(74,124,42,0.25)"
                              : "rgba(139,42,30,0.25)",
                          color:
                            roll.rollMode === "ADVANTAGE"
                              ? "#4a7c2a"
                              : "#8b2a1e",
                          border:
                            roll.rollMode === "ADVANTAGE"
                              ? "1px solid rgba(74,124,42,0.4)"
                              : "1px solid rgba(139,42,30,0.4)",
                        }}
                      >
                        {roll.rollMode === "ADVANTAGE" ? "ADV" : "DIS"}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      color: "#8b7a5e",
                      fontSize: "10px",
                      fontFamily: "'Georgia', serif",
                      marginTop: "2px",
                    }}
                  >
                    {roll.label}
                  </div>
                </div>
              </div>
              <span
                style={{
                  color: "#8b7a5e",
                  fontSize: "10px",
                  fontFamily: "'Georgia', serif",
                }}
              >
                {timeAgo(roll.rolledAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  );
}
