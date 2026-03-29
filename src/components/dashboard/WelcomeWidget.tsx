import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/utils/api";
import type { UserRoleType } from "@/lib/constants";

function getRoleGreeting(role: UserRoleType, username: string): string {
  switch (role) {
    case "DUNGEON_MASTER":
      return `Hail, Dungeon Master ${username}!`;
    case "ADMIN":
      return `Hail, Admin ${username}!`;
    case "PLAYER":
    default:
      return `Hail, Adventurer ${username}!`;
  }
}

export function WelcomeWidget() {
  const { user } = useAuth();
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  const requestDmMutation = api.user.requestDungeonMaster.useMutation({
    onSuccess(data) {
      setRequestMessage(data.message);
      setRequestError(null);
    },
    onError(error) {
      if (error.data?.code === "CONFLICT") {
        setRequestError("You already have a pending petition.");
      } else {
        setRequestError(error.message ?? "Something went wrong. Try again.");
      }
      setRequestMessage(null);
    },
  });

  if (!user) return null;

  const greeting = getRoleGreeting(user.role, user.username);

  return (
    <div
      style={{
        background: "rgba(0,0,0,0.4)",
        border: "1px solid rgba(201,168,76,0.2)",
        borderRadius: "12px",
        padding: "24px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span style={{ fontSize: "32px" }}>🎲</span>
        <div>
          <h2
            style={{
              color: "#c9a84c",
              fontSize: "18px",
              fontWeight: "bold",
              fontFamily: "'Georgia', serif",
              margin: 0,
            }}
          >
            {greeting}
          </h2>
          <p
            style={{
              color: "#a89060",
              fontSize: "13px",
              fontFamily: "'Georgia', serif",
              margin: "4px 0 0 0",
            }}
          >
            Welcome to your adventuring hub.
          </p>
        </div>
      </div>

      {user.role === "PLAYER" && (
        <div>
          {requestMessage ? (
            <p
              style={{
                color: "#c9a84c",
                fontSize: "12px",
                padding: "8px 14px",
                background: "rgba(201,168,76,0.1)",
                border: "1px solid rgba(201,168,76,0.3)",
                borderRadius: "6px",
                fontFamily: "'Georgia', serif",
                margin: 0,
              }}
            >
              {requestMessage}
            </p>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {requestError && (
                <p
                  style={{
                    color: "#e74c3c",
                    fontSize: "12px",
                    padding: "6px 10px",
                    background: "rgba(139,42,30,0.2)",
                    border: "1px solid #8b2a1e",
                    borderRadius: "6px",
                    fontFamily: "'Georgia', serif",
                    margin: 0,
                  }}
                >
                  {requestError}
                </p>
              )}
              <button
                onClick={() => requestDmMutation.mutate()}
                disabled={requestDmMutation.isPending}
                style={{
                  background: requestDmMutation.isPending
                    ? "rgba(201,168,76,0.4)"
                    : "linear-gradient(135deg, #8b6914, #c9a84c)",
                  color: "#1a1a2e",
                  border: "none",
                  borderRadius: "6px",
                  padding: "8px 20px",
                  fontSize: "12px",
                  fontFamily: "'Georgia', serif",
                  fontWeight: "bold",
                  cursor: requestDmMutation.isPending
                    ? "not-allowed"
                    : "pointer",
                  letterSpacing: "0.5px",
                  whiteSpace: "nowrap",
                }}
              >
                {requestDmMutation.isPending
                  ? "Submitting..."
                  : "Seek the Dungeon Master's Mantle"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
