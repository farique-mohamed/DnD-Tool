import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useBooks } from "@/hooks/useStaticData";
import { LoadingSkeleton } from "@/components/ui";
import { getCoverImageUrl } from "@/lib/imageUtils";
import { EntityImage } from "@/components/ui/EntityImage";

function RuleBooksContent() {
  const { user } = useAuth();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { data: bookData, isLoading: booksLoading } = useBooks();
  const [hoveredSource, setHoveredSource] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== "DUNGEON_MASTER" && user.role !== "ADMIN") {
      void router.replace("/unauthorized");
    }
  }, [user, router]);

  if (booksLoading || !bookData) return <LoadingSkeleton />;
  const { BOOK_LIST } = bookData;

  const handleCardClick = (source: string) => {
    void router.push(`/dm/rule-books/${source}`);
  };

  return (
    <>
      <Head>
        <title>Rule Books — DnD Tool</title>
      </Head>
      <div style={{ maxWidth: "960px" }}>
        <h1
          style={{
            color: "#c9a84c",
            fontSize: isMobile ? "20px" : "26px",
            fontWeight: "bold",
            letterSpacing: "2px",
            textTransform: "uppercase",
            marginBottom: "8px",
            fontFamily: "'Georgia', 'Times New Roman', serif",
          }}
        >
          Rule Books
        </h1>
        <p
          style={{
            color: "#a89060",
            fontSize: "14px",
            marginBottom: "16px",
            fontFamily: "'Georgia', 'Times New Roman', serif",
          }}
        >
          Ancient tomes and sacred texts of the realm.
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
            gridTemplateColumns: isMobile ? "repeat(1, 1fr)" : "repeat(3, 1fr)",
            gap: "16px",
          }}
        >
          {BOOK_LIST.map((book) => {
            const isHovered = hoveredSource === book.source;
            return (
              <div
                key={book.source}
                onClick={() => handleCardClick(book.source)}
                onMouseEnter={() => setHoveredSource(book.source)}
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
                  padding: isMobile ? "16px" : "20px",
                  transition: "border-color 0.15s, background 0.15s",
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                }}
              >
                <EntityImage
                  src={getCoverImageUrl(book.source)}
                  alt={book.name}
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
                  {book.name}
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
                  {book.source}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default function RuleBooksPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <RuleBooksContent />
      </Layout>
    </ProtectedRoute>
  );
}
