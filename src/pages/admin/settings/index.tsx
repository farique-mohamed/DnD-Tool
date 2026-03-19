import Head from "next/head";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";

function GlobalSettingsContent() {
  return (
    <>
      <Head>
        <title>Global Settings — DnD Tool</title>
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
          Global Settings
        </h1>
        <p style={{ color: "#a89060", fontSize: "14px", marginBottom: "32px" }}>
          Adjust the laws of the realm.
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
        <div
          style={{
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(201,168,76,0.2)",
            borderRadius: "12px",
            padding: "40px",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#a89060", fontSize: "14px" }}>
            Global variables and settings coming soon.
          </p>
        </div>
      </div>
    </>
  );
}

export default function GlobalSettingsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <GlobalSettingsContent />
      </Layout>
    </ProtectedRoute>
  );
}
