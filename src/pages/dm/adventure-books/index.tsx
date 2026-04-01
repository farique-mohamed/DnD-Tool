import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { ADVENTURE_LIST } from "@/lib/adventureData";
import { getCoverImageUrl } from "@/lib/imageUtils";
import { EntityImage } from "@/components/ui/EntityImage";

function AdventureBooksContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [hoveredSource, setHoveredSource] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== "DUNGEON_MASTER" && user.role !== "ADMIN") {
      void router.replace("/unauthorized");
    }
  }, [user, router]);

  return (
    <>
      <Head>
        <title>Adventure Books — DnD Tool</title>
      </Head>
      <div style={{ maxWidth: "960px" }}>
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
          Adventure Books
        </h1>
        <p
          style={{
            color: "#a89060",
            fontSize: "14px",
            marginBottom: "16px",
            fontFamily: "'Georgia', 'Times New Roman', serif",
          }}
        >
          Select an adventure book to use as the basis for your campaign.
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
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "16px",
          }}
        >
          {ADVENTURE_LIST.map((adventure) => {
            const isHovered = hoveredSource === adventure.source;
            return (
              <div
                key={adventure.source}
                onClick={() => void router.push("/dm/adventure-books/" + adventure.source)}
                onMouseEnter={() => setHoveredSource(adventure.source)}
                onMouseLeave={() => setHoveredSource(null)}
                style={{
                  cursor: "pointer",
                  background: isHovered
                    ? "rgba(201,168,76,0.08)"
                    : "rgba(0,0,0,0.4)",
                  border: isHovered
                    ? "1px solid #c9a84c"
                    : "1px solid rgba(201,168,76,0.25)",
                  borderRadius: "8px",
                  padding: "20px",
                  transition: "border-color 0.15s, background 0.15s",
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                }}
              >
                <EntityImage
                  src={getCoverImageUrl(adventure.source)}
                  alt={adventure.name}
                  width="100%"
                  style={{
                    borderRadius: "4px",
                    marginBottom: "12px",
                    border: "none",
                    boxShadow: "none",
                    background: "transparent",
                  }}
                />
                <div
                  style={{
                    color: "#e8d5a3",
                    fontSize: "14px",
                    fontWeight: "bold",
                    marginBottom: "10px",
                    lineHeight: "1.4",
                  }}
                >
                  {adventure.name}
                </div>
                <div
                  style={{
                    display: "inline-block",
                    background: "rgba(201,168,76,0.15)",
                    border: "1px solid rgba(201,168,76,0.4)",
                    borderRadius: "4px",
                    padding: "2px 8px",
                    color: "#c9a84c",
                    fontSize: "11px",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                  }}
                >
                  {adventure.source}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default function AdventureBooksPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <AdventureBooksContent />
      </Layout>
    </ProtectedRoute>
  );
}
