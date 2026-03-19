import Head from "next/head";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";

const MOCK_RULES: string[] = [];

function RulesForDmContent() {
  return (
    <>
      <Head>
        <title>Rules For DM — DnD Tool</title>
      </Head>
      <div style={{ maxWidth: "800px" }}>
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
          Rules For DM
        </h1>
        <p style={{ color: "#a89060", fontSize: "14px", marginBottom: "32px" }}>
          The sacred laws that govern those who weave the world.
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

        {MOCK_RULES.length === 0 ? (
          <div
            style={{
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(201,168,76,0.2)",
              borderRadius: "12px",
              padding: "60px 40px",
              textAlign: "center",
            }}
          >
            <p style={{ color: "#a89060", fontSize: "14px" }}>
              The rule scrolls are being transcribed. Check back soon.
            </p>
          </div>
        ) : (
          <div
            style={{
              background: "rgba(0,0,0,0.6)",
              border: "2px solid #c9a84c",
              borderRadius: "12px",
              boxShadow:
                "0 0 40px rgba(201,168,76,0.3), inset 0 0 60px rgba(0,0,0,0.5)",
              overflow: "hidden",
            }}
          >
            {MOCK_RULES.map((rule, index) => (
              <div
                key={index}
                style={{
                  padding: "16px 24px",
                  borderBottom:
                    index < MOCK_RULES.length - 1
                      ? "1px solid rgba(201,168,76,0.15)"
                      : "none",
                  color: "#e8d5a3",
                  fontSize: "14px",
                  lineHeight: "1.6",
                }}
              >
                {rule}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function RulesForDmPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <RulesForDmContent />
      </Layout>
    </ProtectedRoute>
  );
}
