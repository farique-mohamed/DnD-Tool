import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/useIsMobile";
import { api } from "@/utils/api";
import {
  ADVENTURE_LIST,
  ADVENTURE_DATA_MAP,
  type AdventureSection,
} from "@/lib/adventureData";
import { parseTaggedText } from "@/lib/dndTagParser";
import { getInternalImageUrl } from "@/lib/imageUtils";
import { EntityImage } from "@/components/ui/EntityImage";

// ---------------------------------------------------------------------------
// Recursive entry renderer
// ---------------------------------------------------------------------------

function renderEntries(
  entries: (AdventureSection | string)[],
  depth = 0,
): React.ReactNode {
  return entries.map((entry, i) => {
    if (typeof entry === "string") {
      return (
        <p
          key={i}
          style={{
            color: "#e8d5a3",
            fontSize: "14px",
            lineHeight: "1.7",
            marginBottom: "10px",
            fontFamily: "'EB Garamond', 'Georgia', serif",
          }}
          dangerouslySetInnerHTML={{ __html: parseTaggedText(entry) }}
        />
      );
    }

    const e = entry as AdventureSection;

    if (e.type === "image") {
      const href = e.href as { type?: string; path?: string } | undefined;
      if (href?.type === "internal" && href.path) {
        return (
          <div key={i} style={{ margin: "16px 0", textAlign: "center" }}>
            <EntityImage
              src={getInternalImageUrl(href.path)}
              alt={typeof e.title === "string" ? e.title : "Adventure image"}
              width="100%"
              style={{ maxWidth: "600px" }}
            />
            {typeof e.title === "string" && (
              <p
                style={{
                  color: "#a89060",
                  fontSize: "12px",
                  fontFamily: "'EB Garamond', 'Georgia', serif",
                  fontStyle: "italic",
                  marginTop: "6px",
                }}
              >
                {e.title}
              </p>
            )}
          </div>
        );
      }
      return null;
    }

    if (e.type === "gallery") {
      const images = (e.images ?? []) as AdventureSection[];
      return (
        <div key={i} style={{ margin: "16px 0", display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center" }}>
          {images.map((img, j) => {
            const href = img.href as { type?: string; path?: string } | undefined;
            if (href?.type !== "internal" || !href.path) return null;
            return (
              <div key={j} style={{ textAlign: "center" }}>
                <EntityImage
                  src={getInternalImageUrl(href.path)}
                  alt={typeof img.title === "string" ? img.title : "Gallery image"}
                  width="100%"
                  style={{ maxWidth: "600px" }}
                />
                {typeof img.title === "string" && (
                  <p style={{ color: "#a89060", fontSize: "12px", fontFamily: "'EB Garamond', 'Georgia', serif", fontStyle: "italic", marginTop: "6px" }}>
                    {img.title}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    if (e.type === "entries" || e.type === "section") {
      const HeadingTag = (e.type === "section" || depth === 0) ? "h3" : "h4";
      const fontSize = HeadingTag === "h3" ? "16px" : "14px";
      return (
        <div key={i} style={{ marginBottom: "16px" }}>
          {e.name && (
            <HeadingTag
              style={{
                color: "#c9a84c",
                fontSize,
                fontWeight: "bold",
                letterSpacing: "1px",
                textTransform: "uppercase",
                marginBottom: "8px",
                fontFamily: "'EB Garamond', 'Georgia', serif",
              }}
            >
              {parseTaggedText(e.name)}
            </HeadingTag>
          )}
          {e.entries && renderEntries(e.entries as (AdventureSection | string)[], depth + 1)}
        </div>
      );
    }

    if (e.type === "list") {
      const items = (e.items ?? []) as (AdventureSection | string)[];
      return (
        <ul
          key={i}
          style={{
            paddingLeft: "20px",
            marginBottom: "12px",
            color: "#e8d5a3",
            fontSize: "14px",
            lineHeight: "1.7",
            fontFamily: "'EB Garamond', 'Georgia', serif",
          }}
        >
          {items.map((item, j) => {
            if (typeof item === "string") {
              return (
                <li key={j} dangerouslySetInnerHTML={{ __html: parseTaggedText(item) }} />
              );
            }
            const itemEntry = item as AdventureSection;
            if (itemEntry.name && itemEntry.entries) {
              return (
                <li key={j} style={{ marginBottom: "6px" }}>
                  <strong style={{ color: "#c9a84c" }}>
                    {parseTaggedText(itemEntry.name)}
                  </strong>{" "}
                  {renderEntries(itemEntry.entries as (AdventureSection | string)[], depth + 1)}
                </li>
              );
            }
            if (itemEntry.name && itemEntry.entry) {
              return (
                <li key={j} style={{ marginBottom: "6px" }}>
                  <strong style={{ color: "#c9a84c" }}>
                    {parseTaggedText(itemEntry.name)}
                  </strong>{" "}
                  <span dangerouslySetInnerHTML={{ __html: parseTaggedText(itemEntry.entry) }} />
                </li>
              );
            }
            if (itemEntry.name) {
              return (
                <li key={j}>
                  <strong style={{ color: "#c9a84c" }}>
                    {parseTaggedText(itemEntry.name)}
                  </strong>
                </li>
              );
            }
            return null;
          })}
        </ul>
      );
    }

    if (e.type === "inset" || e.type === "insetReadaloud") {
      return (
        <aside
          key={i}
          style={{
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(201,168,76,0.4)",
            borderLeft: "3px solid #c9a84c",
            borderRadius: "4px",
            padding: "16px 20px",
            marginBottom: "16px",
            fontStyle: "italic",
          }}
        >
          {e.name && (
            <p
              style={{
                color: "#c9a84c",
                fontSize: "13px",
                fontWeight: "bold",
                marginBottom: "8px",
                fontStyle: "normal",
                letterSpacing: "0.5px",
                fontFamily: "'EB Garamond', 'Georgia', serif",
              }}
            >
              {parseTaggedText(e.name)}
            </p>
          )}
          {e.entries &&
            renderEntries(e.entries as (AdventureSection | string)[], depth + 1)}
        </aside>
      );
    }

    if (e.type === "table") {
      const colLabels = (e.colLabels ?? []) as string[];
      const rows = (e.rows ?? []) as unknown[][];
      return (
        <div
          key={i}
          style={{ overflowX: "auto", marginBottom: "16px" }}
        >
          {e.caption && (
            <p
              style={{
                color: "#c9a84c",
                fontSize: "13px",
                fontWeight: "bold",
                marginBottom: "6px",
                fontFamily: "'EB Garamond', 'Georgia', serif",
                letterSpacing: "0.5px",
              }}
            >
              {parseTaggedText(e.caption as string)}
            </p>
          )}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "13px",
              fontFamily: "'EB Garamond', 'Georgia', serif",
              color: "#e8d5a3",
            }}
          >
            {colLabels.length > 0 && (
              <thead>
                <tr>
                  {colLabels.map((label, j) => (
                    <th
                      key={j}
                      style={{
                        borderBottom: "1px solid rgba(201,168,76,0.4)",
                        padding: "6px 10px",
                        textAlign: "left",
                        color: "#c9a84c",
                        fontWeight: "bold",
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                        fontSize: "11px",
                      }}
                    >
                      {parseTaggedText(label)}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {rows.map((row, j) => {
                const cells = Array.isArray(row) ? row : [];
                return (
                  <tr
                    key={j}
                    style={{
                      background:
                        j % 2 === 0 ? "rgba(0,0,0,0.2)" : "transparent",
                    }}
                  >
                    {cells.map((cell, k) => (
                      <td
                        key={k}
                        style={{
                          padding: "6px 10px",
                          borderBottom: "1px solid rgba(201,168,76,0.1)",
                        }}
                      >
                        {typeof cell === "string"
                          ? parseTaggedText(cell)
                          : typeof cell === "number"
                          ? String(cell)
                          : ""}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    if (e.type === "quote") {
      return (
        <blockquote
          key={i}
          style={{
            borderLeft: "3px solid rgba(201,168,76,0.5)",
            marginLeft: "0",
            paddingLeft: "20px",
            marginBottom: "16px",
            fontStyle: "italic",
            color: "#a89060",
            fontFamily: "'EB Garamond', 'Georgia', serif",
          }}
        >
          {e.entries &&
            renderEntries(e.entries as (AdventureSection | string)[], depth + 1)}
          {e.by && (
            <footer
              style={{
                color: "#c9a84c",
                fontSize: "12px",
                marginTop: "4px",
                fontStyle: "normal",
              }}
            >
              — {parseTaggedText(e.by as string)}
            </footer>
          )}
        </blockquote>
      );
    }

    // Unknown type — skip
    return null;
  });
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

function AdventureDetailContent() {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const router = useRouter();
  const source =
    typeof router.query.source === "string" ? router.query.source : "";

  useEffect(() => {
    if (user && user.role !== "DUNGEON_MASTER" && user.role !== "ADMIN") {
      void router.replace("/unauthorized");
    }
  }, [user, router]);

  const adventureInfo = ADVENTURE_LIST.find((a) => a.source === source);
  const adventureData = source in ADVENTURE_DATA_MAP ? ADVENTURE_DATA_MAP[source] ?? null : null;

  const [showModal, setShowModal] = useState(false);
  const [adventureName, setAdventureName] = useState("");
  const [adventureCreated, setAdventureCreated] = useState(false);
  const createAdventure = api.adventure.create.useMutation({
    onSuccess: () => {
      setAdventureCreated(true);
      setShowModal(false);
    },
  });

  const [selectedSectionIndex, setSelectedSectionIndex] = useState(0);

  const selectedSection = adventureData?.[selectedSectionIndex] ?? null;

  return (
    <>
      <Head>
        <title>
          {adventureInfo ? adventureInfo.name : "Adventure Book"} — DnD Tool
        </title>
      </Head>

      {/* Breadcrumb */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "20px",
          fontFamily: "'EB Garamond', 'Georgia', serif",
          fontSize: "13px",
          color: "#a89060",
        }}
      >
        <button
          onClick={() => void router.push("/dm/adventure-books")}
          style={{
            background: "none",
            border: "none",
            color: "#c9a84c",
            cursor: "pointer",
            fontFamily: "'EB Garamond', 'Georgia', serif",
            fontSize: "13px",
            padding: "0",
            textDecoration: "underline",
          }}
        >
          Adventure Books
        </button>
        <span>/</span>
        <span>{adventureInfo?.name ?? source}</span>
      </div>

      <h1
        style={{
          color: "#c9a84c",
          fontSize: isMobile ? "20px" : "26px",
          fontWeight: "bold",
          letterSpacing: "2px",
          textTransform: "uppercase",
          marginBottom: "8px",
          fontFamily: "'EB Garamond', 'Georgia', serif",
        }}
      >
        {adventureInfo?.name ?? source}
      </h1>

      <div
        style={{
          width: "80px",
          height: "2px",
          background: "#c9a84c",
          marginBottom: "24px",
          opacity: 0.6,
        }}
      />

      <div style={{ marginBottom: "24px" }}>
        <button
          disabled={createAdventure.isPending}
          onClick={() => {
            setAdventureName(adventureInfo?.name ?? source);
            setAdventureCreated(false);
            setShowModal(true);
          }}
          style={{
            background: "linear-gradient(135deg, #8b6914, #c9a84c)",
            color: "#1a1a2e",
            border: "none",
            borderRadius: "6px",
            padding: "12px 28px",
            fontSize: "14px",
            fontFamily: "'EB Garamond', 'Georgia', serif",
            fontWeight: "bold",
            cursor: createAdventure.isPending ? "default" : "pointer",
            letterSpacing: "0.5px",
            opacity: createAdventure.isPending ? 0.8 : 1,
          }}
        >
          Begin This Adventure
        </button>

        {adventureCreated && (
          <p
            style={{
              color: "#4a8c3f",
              fontSize: "13px",
              fontFamily: "'EB Garamond', 'Georgia', serif",
              marginTop: "10px",
            }}
          >
            Your adventure has been created!{" "}
            <Link
              href="/adventures"
              style={{
                color: "#c9a84c",
                textDecoration: "underline",
              }}
            >
              View My Adventures
            </Link>
          </p>
        )}
      </div>

      {/* Name Your Adventure Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => {
            setShowModal(false);
          }}
        >
          <div
            style={{
              background: "rgba(15,8,3,0.95)",
              border: "2px solid #c9a84c",
              borderRadius: "12px",
              padding: "32px",
              maxWidth: "460px",
              width: "90%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                color: "#c9a84c",
                fontSize: "18px",
                fontWeight: "bold",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                marginBottom: "20px",
                fontFamily: "'EB Garamond', 'Georgia', serif",
              }}
            >
              Name Your Adventure
            </h2>

            <label
              htmlFor="adventure-name-input"
              style={{
                display: "block",
                color: "#a89060",
                fontSize: "12px",
                fontFamily: "'EB Garamond', 'Georgia', serif",
                marginBottom: "8px",
                letterSpacing: "0.5px",
              }}
            >
              Adventure Name
            </label>
            <input
              id="adventure-name-input"
              type="text"
              value={adventureName}
              onChange={(e) => setAdventureName(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && adventureName.trim()) {
                  createAdventure.mutate({ name: adventureName.trim(), source });
                }
              }}
              style={{
                background: "rgba(30,15,5,0.9)",
                border: "1px solid rgba(201,168,76,0.4)",
                color: "#e8d5a3",
                fontFamily: "'EB Garamond', 'Georgia', serif",
                borderRadius: "6px",
                padding: "10px 14px",
                width: "100%",
                fontSize: "14px",
                boxSizing: "border-box",
                outline: "none",
                marginBottom: "8px",
              }}
            />

            {createAdventure.isError && (
              <p
                style={{
                  color: "#c94c4c",
                  fontSize: "13px",
                  fontFamily: "'EB Garamond', 'Georgia', serif",
                  marginBottom: "8px",
                }}
              >
                Failed to create adventure. Please try again.
              </p>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                marginTop: "20px",
              }}
            >
              <button
                onClick={() => {
                  setShowModal(false);
                }}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(201,168,76,0.5)",
                  color: "#c9a84c",
                  borderRadius: "4px",
                  padding: "6px 16px",
                  fontFamily: "'EB Garamond', 'Georgia', serif",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                disabled={createAdventure.isPending || !adventureName.trim()}
                onClick={() => {
                  createAdventure.mutate({ name: adventureName.trim(), source });
                }}
                style={{
                  background:
                    createAdventure.isPending || !adventureName.trim()
                      ? "linear-gradient(135deg, #6b5210, #9a7a38)"
                      : "linear-gradient(135deg, #8b6914, #c9a84c)",
                  color: "#1a1a2e",
                  border: "none",
                  borderRadius: "6px",
                  padding: "12px 28px",
                  fontSize: "14px",
                  fontFamily: "'EB Garamond', 'Georgia', serif",
                  fontWeight: "bold",
                  cursor:
                    createAdventure.isPending || !adventureName.trim()
                      ? "default"
                      : "pointer",
                  letterSpacing: "0.5px",
                  opacity: createAdventure.isPending ? 0.8 : 1,
                }}
              >
                {createAdventure.isPending ? "Summoning..." : "Create Adventure"}
              </button>
            </div>
          </div>
        </div>
      )}

      {!adventureData ? (
        <div
          style={{
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(201,168,76,0.2)",
            borderRadius: "12px",
            padding: "60px 40px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              color: "#a89060",
              fontSize: "14px",
              fontFamily: "'EB Garamond', 'Georgia', serif",
            }}
          >
            Content coming soon for this tome.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? "16px" : "24px", alignItems: "flex-start" }}>
          {/* Table of Contents */}
          {isMobile ? (
            <select
              value={selectedSectionIndex}
              onChange={(e) => setSelectedSectionIndex(Number(e.target.value))}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "rgba(30,15,5,0.9)",
                border: "1px solid rgba(201,168,76,0.4)",
                borderRadius: "6px",
                color: "#e8d5a3",
                fontSize: "13px",
                fontFamily: "'EB Garamond', 'Georgia', serif",
                outline: "none",
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              {adventureData.map((section, i) => (
                <option key={i} value={i}>
                  {section.name ?? `Section ${i + 1}`}
                </option>
              ))}
            </select>
          ) : (
            <div
              style={{
                flex: "0 0 240px",
                minWidth: "200px",
                maxWidth: "280px",
                position: "sticky",
                top: "24px",
                maxHeight: "calc(100vh - 120px)",
                overflowY: "auto",
                background: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(201,168,76,0.2)",
                borderRadius: "8px",
                padding: "12px 0",
              }}
            >
              <p
                style={{
                  color: "#c9a84c",
                  fontSize: "11px",
                  letterSpacing: "1.2px",
                  textTransform: "uppercase",
                  padding: "0 14px 10px",
                  borderBottom: "1px solid rgba(201,168,76,0.15)",
                  marginBottom: "8px",
                  fontFamily: "'EB Garamond', 'Georgia', serif",
                }}
              >
                Contents
              </p>
              {adventureData.map((section, i) => {
                const isActive = i === selectedSectionIndex;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedSectionIndex(i)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 14px",
                      background: isActive
                        ? "rgba(201,168,76,0.15)"
                        : "transparent",
                      border: "none",
                      borderLeft: isActive
                        ? "2px solid #c9a84c"
                        : "2px solid transparent",
                      color: isActive ? "#c9a84c" : "#e8d5a3",
                      fontSize: "13px",
                      fontFamily: "'EB Garamond', 'Georgia', serif",
                      cursor: "pointer",
                      lineHeight: "1.4",
                      transition: "background 0.1s, color 0.1s",
                    }}
                  >
                    {section.name ?? `Section ${i + 1}`}
                  </button>
                );
              })}
            </div>
          )}

          {/* Content — Right Panel */}
          <div style={{ flex: 3, minWidth: 0, width: isMobile ? "100%" : undefined }}>
            {selectedSection && (
              <div
                style={{
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid rgba(201,168,76,0.2)",
                  borderRadius: "8px",
                  padding: isMobile ? "16px" : "28px 32px",
                }}
              >
                <h2
                  style={{
                    color: "#c9a84c",
                    fontSize: "20px",
                    fontWeight: "bold",
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    marginBottom: "20px",
                    fontFamily: "'EB Garamond', 'Georgia', serif",
                  }}
                >
                  {selectedSection.name ?? ""}
                </h2>
                {selectedSection.entries &&
                  renderEntries(
                    selectedSection.entries as (AdventureSection | string)[],
                    0,
                  )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function AdventureDetailPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <AdventureDetailContent />
      </Layout>
    </ProtectedRoute>
  );
}
