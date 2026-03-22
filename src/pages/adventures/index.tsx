import Head from "next/head";
import { useRouter } from "next/router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { api } from "@/utils/api";
import { ADVENTURE_LIST } from "@/lib/adventureData";

function AdventuresContent() {
  const router = useRouter();
  const { data: adventures = [], isLoading } = api.adventure.list.useQuery();

  return (
    <>
      <Head>
        <title>My Adventures — DnD Tool</title>
      </Head>
      <div style={{ maxWidth: "900px" }}>
        <h1
          style={{
            color: "#c9a84c",
            fontSize: "26px",
            fontWeight: "bold",
            letterSpacing: "2px",
            textTransform: "uppercase",
            marginBottom: "8px",
            fontFamily: "'Georgia', 'Times New Roman', serif",
          }}
        >
          My Adventures
        </h1>
        <p style={{ color: "#a89060", fontSize: "14px", marginBottom: "32px", fontFamily: "'Georgia', 'Times New Roman', serif" }}>
          Your DM-created campaigns and ongoing quests.
        </p>
        <div
          style={{
            width: "80px",
            height: "2px",
            background: "#c9a84c",
            marginBottom: "32px",
            opacity: 0.6,
          }}
        />

        {isLoading ? (
          <p style={{ color: "#a89060", fontSize: "14px", fontFamily: "'Georgia', 'Times New Roman', serif" }}>
            Loading your adventures...
          </p>
        ) : adventures.length === 0 ? (
          <div
            style={{
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(201,168,76,0.2)",
              borderRadius: "12px",
              padding: "60px 40px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>🎲</div>
            <p
              style={{
                color: "#e8d5a3",
                fontSize: "15px",
                marginBottom: "8px",
                fontFamily: "'Georgia', 'Times New Roman', serif",
              }}
            >
              No adventures yet, brave soul.
            </p>
            <p style={{ color: "#a89060", fontSize: "13px", fontFamily: "'Georgia', 'Times New Roman', serif" }}>
              Wait for a Dungeon Master to invite you, or create your own campaign.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {adventures.map((adventure) => (
              <div
                key={adventure.id}
                onClick={() => void router.push(`/adventures/${adventure.id}`)}
                style={{
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid rgba(201,168,76,0.2)",
                  borderRadius: "12px",
                  padding: "20px 24px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <div>
                  <h2
                    style={{
                      color: "#c9a84c",
                      fontSize: "16px",
                      fontWeight: "bold",
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      marginBottom: "4px",
                      fontFamily: "'Georgia', 'Times New Roman', serif",
                    }}
                  >
                    {adventure.name}
                  </h2>
                  <p style={{ color: "#a89060", fontSize: "13px", fontFamily: "'Georgia', 'Times New Roman', serif", marginBottom: "2px" }}>
                    {ADVENTURE_LIST.find((a) => a.source === adventure.source)?.name ?? adventure.source}
                  </p>
                  <p style={{ color: "#8b7a5e", fontSize: "11px", fontFamily: "'Georgia', 'Times New Roman', serif" }}>
                    Created{" "}
                    {new Date(adventure.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function AdventuresPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <AdventuresContent />
      </Layout>
    </ProtectedRoute>
  );
}
