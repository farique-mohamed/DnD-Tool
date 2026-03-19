import Head from "next/head";
import { useRouter } from "next/router";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { useAuth } from "../../hooks/useAuth";

function DashboardContent() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    void router.replace("/");
  };

  return (
    <>
      <Head>
        <title>Dashboard — DnD Tool</title>
      </Head>
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 50%, #16213e 100%)",
        fontFamily: "'Georgia', 'Times New Roman', serif",
      }}>
        {/* Header */}
        <header style={{
          borderBottom: "1px solid rgba(201,168,76,0.3)",
          padding: "16px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <h1 style={{
            color: "#c9a84c",
            fontSize: "20px",
            fontWeight: "bold",
            letterSpacing: "1px",
          }}>
            ⚔️ DnD Tool
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ color: "#a89060", fontSize: "14px" }}>
              Welcome, <span style={{ color: "#c9a84c" }}>{user?.username}</span>
            </span>
            <button
              onClick={handleLogout}
              style={{
                background: "transparent",
                border: "1px solid rgba(201,168,76,0.5)",
                color: "#c9a84c",
                borderRadius: "4px",
                padding: "6px 16px",
                fontSize: "13px",
                fontFamily: "'Georgia', serif",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        </header>

        {/* Main content */}
        <main style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100vh - 65px)",
          padding: "40px",
        }}>
          <div style={{
            textAlign: "center",
            padding: "60px 40px",
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(201,168,76,0.2)",
            borderRadius: "12px",
            maxWidth: "500px",
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎲</div>
            <h2 style={{
              color: "#c9a84c",
              fontSize: "22px",
              marginBottom: "12px",
            }}>
              The Adventure Awaits
            </h2>
            <p style={{ color: "#a89060", fontSize: "14px", lineHeight: "1.7" }}>
              Your dashboard is being prepared by the Dungeon Master. Check back soon for quests, campaigns, and epic adventures!
            </p>
          </div>
        </main>
      </div>
    </>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
