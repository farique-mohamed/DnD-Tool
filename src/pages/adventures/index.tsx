import Head from "next/head";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";

function AdventuresContent() {
  const adventures: unknown[] = [];

  return (
    <>
      <Head>
        <title>Adventures — DnD Tool</title>
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
          }}
        >
          Adventures
        </h1>
        <p style={{ color: "#a89060", fontSize: "14px", marginBottom: "32px" }}>
          Your ongoing quests and epic campaigns.
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

        {adventures.length === 0 ? (
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
              }}
            >
              No adventures yet, brave soul.
            </p>
            <p style={{ color: "#a89060", fontSize: "13px" }}>
              Wait for a Dungeon Master to invite you, or create your own campaign.
            </p>
          </div>
        ) : null}
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
