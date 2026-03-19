import Head from "next/head";
import { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";

const MOCK_MONSTERS = [
  "Goblin",
  "Orc",
  "Troll",
  "Dragon",
  "Vampire",
  "Lich",
  "Beholder",
  "Owlbear",
  "Mimic",
  "Basilisk",
  "Chimera",
  "Harpy",
  "Medusa",
  "Manticore",
  "Griffon",
  "Wyvern",
  "Banshee",
  "Wraith",
  "Spectre",
  "Zombie",
];

function MonsterManualContent() {
  const [query, setQuery] = useState("");

  const filtered = MOCK_MONSTERS.filter((m) =>
    m.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <Head>
        <title>Monster Manual — DnD Tool</title>
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
          Monster Manual
        </h1>
        <p style={{ color: "#a89060", fontSize: "14px", marginBottom: "32px" }}>
          Consult the ancient tome to know your foes.
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

        {/* Search bar */}
        <div style={{ marginBottom: "24px" }}>
          <input
            type="text"
            placeholder="Search monsters..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px",
              background: "rgba(30,15,5,0.9)",
              border: "1px solid rgba(201,168,76,0.4)",
              borderRadius: "6px",
              color: "#e8d5a3",
              fontSize: "14px",
              fontFamily: "'Georgia', 'Times New Roman', serif",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Results */}
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
          {filtered.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center" }}>
              <p style={{ color: "#a89060", fontSize: "14px" }}>
                No creatures found in the tome matching &ldquo;{query}&rdquo;.
              </p>
            </div>
          ) : (
            filtered.map((monster, index) => (
              <div
                key={monster}
                style={{
                  padding: "14px 24px",
                  borderBottom:
                    index < filtered.length - 1
                      ? "1px solid rgba(201,168,76,0.15)"
                      : "none",
                  color: "#e8d5a3",
                  fontSize: "14px",
                  letterSpacing: "0.3px",
                }}
              >
                {monster}
              </div>
            ))
          )}
        </div>

        <p
          style={{
            color: "#a89060",
            fontSize: "12px",
            marginTop: "12px",
            textAlign: "right",
          }}
        >
          {filtered.length} creature{filtered.length !== 1 ? "s" : ""} found
        </p>
      </div>
    </>
  );
}

export default function MonsterManualPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <MonsterManualContent />
      </Layout>
    </ProtectedRoute>
  );
}
