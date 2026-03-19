import Head from "next/head";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
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

  const greeting =
    user !== null ? getRoleGreeting(user.role, user.username) : "";

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
