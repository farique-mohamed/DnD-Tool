import Head from "next/head";
import { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
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

function DashboardContent() {
  const { user } = useAuth();
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  const greeting =
    user !== null ? getRoleGreeting(user.role, user.username) : "";

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

  return (
    <>
      <Head>
        <title>Dashboard — DnD Tool</title>
      </Head>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100vh - 80px)",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "60px 40px",
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(201,168,76,0.2)",
            borderRadius: "12px",
            maxWidth: "500px",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎲</div>
          <h2
            style={{
              color: "#c9a84c",
              fontSize: "22px",
              marginBottom: "12px",
            }}
          >
            {greeting}
          </h2>
          <p style={{ color: "#a89060", fontSize: "14px", lineHeight: "1.7" }}>
            Your dashboard is being prepared by the Dungeon Master. Check back
            soon for quests, campaigns, and epic adventures!
          </p>

          {user?.role === "PLAYER" && (
            <div style={{ marginTop: "32px" }}>
              {requestMessage ? (
                <p
                  style={{
                    color: "#c9a84c",
                    fontSize: "13px",
                    padding: "10px 16px",
                    background: "rgba(201,168,76,0.1)",
                    border: "1px solid rgba(201,168,76,0.3)",
                    borderRadius: "6px",
                  }}
                >
                  {requestMessage}
                </p>
              ) : (
                <>
                  {requestError && (
                    <p
                      style={{
                        color: "#e74c3c",
                        fontSize: "13px",
                        marginBottom: "12px",
                        padding: "8px 12px",
                        background: "rgba(139,42,30,0.2)",
                        border: "1px solid #8b2a1e",
                        borderRadius: "6px",
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
                      padding: "10px 24px",
                      fontSize: "13px",
                      fontFamily: "'Georgia', serif",
                      fontWeight: "bold",
                      cursor: requestDmMutation.isPending
                        ? "not-allowed"
                        : "pointer",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {requestDmMutation.isPending
                      ? "Submitting your petition..."
                      : "Seek the Dungeon Master's Mantle"}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <Layout>
        <DashboardContent />
      </Layout>
    </ProtectedRoute>
  );
}
