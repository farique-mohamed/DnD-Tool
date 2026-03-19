import Head from "next/head";
import { useRouter } from "next/router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";

const MOCK_CHARACTERS: unknown[] = [];

function CharactersContent() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>My Characters — DnD Tool</title>
      </Head>
      <div style={{ maxWidth: "900px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "8px",
          }}
        >
          <div>
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
              My Characters
            </h1>
            <p style={{ color: "#a89060", fontSize: "14px", marginBottom: "32px" }}>
              Your roster of heroes and villains.
            </p>
          </div>
          <button
            onClick={() => void router.push("/characters/new")}
            style={{
              background: "linear-gradient(135deg, #8b6914, #c9a84c)",
              color: "#1a1a2e",
              border: "none",
              borderRadius: "6px",
              padding: "12px 24px",
              fontSize: "13px",
              fontFamily: "'Georgia', serif",
              fontWeight: "bold",
              cursor: "pointer",
              letterSpacing: "0.5px",
              whiteSpace: "nowrap",
            }}
          >
            + Create Character
          </button>
        </div>
        <div
          style={{
            width: "80px",
            height: "2px",
            background: "#c9a84c",
            marginBottom: "32px",
            opacity: 0.6,
          }}
        />

        {MOCK_CHARACTERS.length === 0 ? (
          <div
            style={{
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(201,168,76,0.2)",
              borderRadius: "12px",
              padding: "60px 40px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>🛡️</div>
            <p
              style={{
                color: "#e8d5a3",
                fontSize: "15px",
                marginBottom: "8px",
              }}
            >
              No characters yet.
            </p>
            <p style={{ color: "#a89060", fontSize: "13px", marginBottom: "24px" }}>
              Every legend begins with a single character sheet.
            </p>
            <button
              onClick={() => void router.push("/characters/new")}
              style={{
                background: "linear-gradient(135deg, #8b6914, #c9a84c)",
                color: "#1a1a2e",
                border: "none",
                borderRadius: "6px",
                padding: "12px 28px",
                fontSize: "14px",
                fontFamily: "'Georgia', serif",
                fontWeight: "bold",
                cursor: "pointer",
                letterSpacing: "0.5px",
              }}
            >
              Create Your First Character
            </button>
          </div>
        ) : null}
      </div>
    </>
  );
}

export default function CharactersPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <CharactersContent />
      </Layout>
    </ProtectedRoute>
  );
}
