import { useState } from "react";
import Head from "next/head";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  PHB_2014_DATA,
  PHB_2024_DATA,
  type BookSection,
  type BookEntry,
} from "@/lib/bookData";
import { parseTaggedText } from "@/lib/dndTagParser";

type Edition = "2014" | "2024";

// ---------------------------------------------------------------------------
// Recursive entry renderer
// ---------------------------------------------------------------------------

function renderEntries(
  entries: (BookEntry | string)[],
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
            fontFamily: "'Georgia', 'Times New Roman', serif",
          }}
          dangerouslySetInnerHTML={{ __html: parseTaggedText(entry) }}
        />
      );
    }

    const e = entry as BookEntry;

    if (e.type === "image") return null;

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
                fontFamily: "'Georgia', 'Times New Roman', serif",
              }}
            >
              {parseTaggedText(e.name)}
            </HeadingTag>
          )}
          {e.entries && renderEntries(e.entries as (BookEntry | string)[], depth + 1)}
        </div>
      );
    }

    if (e.type === "list") {
      const items = (e.items ?? []) as (BookEntry | string)[];
      return (
        <ul
          key={i}
          style={{
            paddingLeft: "20px",
            marginBottom: "12px",
            color: "#e8d5a3",
            fontSize: "14px",
            lineHeight: "1.7",
            fontFamily: "'Georgia', 'Times New Roman', serif",
          }}
        >
          {items.map((item, j) => {
            if (typeof item === "string") {
              return (
                <li key={j} dangerouslySetInnerHTML={{ __html: parseTaggedText(item) }} />
              );
            }
            const itemEntry = item as BookEntry;
            if (itemEntry.name && itemEntry.entries) {
              return (
                <li key={j} style={{ marginBottom: "6px" }}>
                  <strong style={{ color: "#c9a84c" }}>
                    {parseTaggedText(itemEntry.name)}
                  </strong>{" "}
                  {renderEntries(itemEntry.entries as (BookEntry | string)[], depth + 1)}
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
                fontFamily: "'Georgia', 'Times New Roman', serif",
              }}
            >
              {parseTaggedText(e.name)}
            </p>
          )}
          {e.entries && renderEntries(e.entries as (BookEntry | string)[], depth + 1)}
        </aside>
      );
    }

    if (e.type === "table") {
      const colLabels = (e.colLabels ?? []) as string[];
      const rows = (e.rows ?? []) as unknown[][];
      return (
        <div key={i} style={{ overflowX: "auto", marginBottom: "16px" }}>
          {e.caption && (
            <p
              style={{
                color: "#c9a84c",
                fontSize: "13px",
                fontWeight: "bold",
                marginBottom: "6px",
                fontFamily: "'Georgia', 'Times New Roman', serif",
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
              fontFamily: "'Georgia', 'Times New Roman', serif",
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
                      background: j % 2 === 0 ? "rgba(0,0,0,0.2)" : "transparent",
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
            fontFamily: "'Georgia', 'Times New Roman', serif",
          }}
        >
          {e.entries && renderEntries(e.entries as (BookEntry | string)[], depth + 1)}
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

    return null;
  });
}

// ---------------------------------------------------------------------------
// Two-column book viewer
// ---------------------------------------------------------------------------

function BookViewer({ data, isMobile }: { data: BookSection[]; isMobile?: boolean }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedSection = data[selectedIndex] ?? null;

  return (
    <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? "16px" : "24px", alignItems: "flex-start" }}>
      {/* Table of Contents */}
      {isMobile ? (
        <select
          value={selectedIndex}
          onChange={(e) => setSelectedIndex(Number(e.target.value))}
          style={{
            width: "100%",
            padding: "10px 14px",
            background: "rgba(30,15,5,0.9)",
            border: "1px solid rgba(201,168,76,0.4)",
            borderRadius: "6px",
            color: "#e8d5a3",
            fontSize: "13px",
            fontFamily: "'Georgia', 'Times New Roman', serif",
            outline: "none",
            cursor: "pointer",
            boxSizing: "border-box",
          }}
        >
          {data.map((section, i) => (
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
            maxHeight: "calc(100vh - 200px)",
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
              fontFamily: "'Georgia', 'Times New Roman', serif",
            }}
          >
            Contents
          </p>
          {data.map((section, i) => {
            const isActive = i === selectedIndex;
            return (
              <button
                key={i}
                onClick={() => setSelectedIndex(i)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 14px",
                  background: isActive ? "rgba(201,168,76,0.15)" : "transparent",
                  border: "none",
                  borderLeft: isActive
                    ? "2px solid #c9a84c"
                    : "2px solid transparent",
                  color: isActive ? "#c9a84c" : "#e8d5a3",
                  fontSize: "13px",
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  cursor: "pointer",
                  lineHeight: "1.4",
                  transition: "background 0.1s, color 0.1s",
                }}
              >
                {section.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
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
                fontFamily: "'Georgia', 'Times New Roman', serif",
              }}
            >
              {selectedSection.name}
            </h2>
            {selectedSection.entries &&
              renderEntries(selectedSection.entries as (BookEntry | string)[], 0)}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page content
// ---------------------------------------------------------------------------

function PhbContent() {
  const isMobile = useIsMobile();
  const [edition, setEdition] = useState<Edition>("2014");

  const currentData: BookSection[] = edition === "2014" ? PHB_2014_DATA : PHB_2024_DATA;

  return (
    <>
      <Head>
        <title>Player&apos;s Handbook — DnD Tool</title>
      </Head>

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
        Player&apos;s Handbook
      </h1>
      <p
        style={{
          color: "#a89060",
          fontSize: "14px",
          marginBottom: "20px",
          fontFamily: "'Georgia', 'Times New Roman', serif",
        }}
      >
        Laws every adventurer must know before entering the dungeon.
      </p>

      {/* Edition tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "28px",
        }}
      >
        {(["2014", "2024"] as Edition[]).map((ed) => {
          const isActive = edition === ed;
          return (
            <button
              key={ed}
              onClick={() => setEdition(ed)}
              style={{
                padding: "6px 20px",
                borderRadius: "20px",
                border: isActive
                  ? "1px solid #c9a84c"
                  : "1px solid rgba(201,168,76,0.3)",
                background: isActive ? "rgba(201,168,76,0.2)" : "transparent",
                color: isActive ? "#c9a84c" : "#a89060",
                fontSize: "13px",
                fontFamily: "'Georgia', 'Times New Roman', serif",
                cursor: "pointer",
                letterSpacing: "0.5px",
                transition: "all 0.15s",
              }}
            >
              {ed}
            </button>
          );
        })}
      </div>

      <div
        style={{
          width: "80px",
          height: "2px",
          background: "#c9a84c",
          marginBottom: "28px",
          opacity: 0.6,
        }}
      />

      <BookViewer data={currentData} isMobile={isMobile} />
    </>
  );
}

export default function RulesForPlayersPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <PhbContent />
      </Layout>
    </ProtectedRoute>
  );
}
