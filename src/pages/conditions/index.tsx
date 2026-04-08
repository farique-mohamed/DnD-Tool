import Head from "next/head";
import { useState, useMemo } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { useIsMobile } from "@/hooks/useIsMobile";
import { parseTaggedText } from "@/lib/dndTagParser";
import {
  ALL_ENTRIES,
  CONDITION_SOURCES,
  type ConditionDetail,
} from "@/lib/conditionData";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GOLD = "#c9a84c";
const GOLD_MUTED = "#a89060";
const GOLD_BRIGHT = "#e8d5a3";
const GOLD_DIM = "rgba(201,168,76,0.15)";
const GOLD_BORDER = "rgba(201,168,76,0.25)";
const TEXT_DIM = "rgba(232,213,163,0.6)";
const SERIF = "'EB Garamond', 'Georgia', serif";

// ---------------------------------------------------------------------------
// Source badge color helper
// ---------------------------------------------------------------------------

const SOURCE_COLORS: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  PHB: {
    bg: "rgba(74,144,217,0.1)",
    border: "rgba(74,144,217,0.35)",
    text: "#7ab4e0",
  },
  XPHB: {
    bg: "rgba(46,204,113,0.1)",
    border: "rgba(46,204,113,0.35)",
    text: "#6dd5a0",
  },
  DMG: {
    bg: "rgba(155,89,182,0.1)",
    border: "rgba(155,89,182,0.35)",
    text: "#bb8fd9",
  },
  XDMG: {
    bg: "rgba(231,76,60,0.1)",
    border: "rgba(231,76,60,0.35)",
    text: "#e8887d",
  },
  MPMM: {
    bg: "rgba(231,76,60,0.1)",
    border: "rgba(231,76,60,0.35)",
    text: "#e8887d",
  },
  ERLW: {
    bg: "rgba(230,126,34,0.1)",
    border: "rgba(230,126,34,0.35)",
    text: "#e8a76d",
  },
  EGW: {
    bg: "rgba(52,152,219,0.1)",
    border: "rgba(52,152,219,0.35)",
    text: "#7cbde8",
  },
  VRGR: {
    bg: "rgba(225,29,72,0.1)",
    border: "rgba(225,29,72,0.35)",
    text: "#e8637e",
  },
  IDRotF: {
    bg: "rgba(14,165,233,0.1)",
    border: "rgba(14,165,233,0.35)",
    text: "#5dc4f0",
  },
  ToA: {
    bg: "rgba(245,158,11,0.1)",
    border: "rgba(245,158,11,0.35)",
    text: "#f5b84d",
  },
  GoS: {
    bg: "rgba(132,204,22,0.1)",
    border: "rgba(132,204,22,0.35)",
    text: "#a3d95c",
  },
  OoW: {
    bg: "rgba(99,102,241,0.1)",
    border: "rgba(99,102,241,0.35)",
    text: "#9597f5",
  },
  OotA: {
    bg: "rgba(217,70,239,0.1)",
    border: "rgba(217,70,239,0.35)",
    text: "#e08ef0",
  },
  FRAiF: {
    bg: "rgba(139,101,8,0.1)",
    border: "rgba(139,101,8,0.35)",
    text: "#b8934a",
  },
  CM: {
    bg: "rgba(74,144,217,0.1)",
    border: "rgba(74,144,217,0.35)",
    text: "#7ab4e0",
  },
  WDMM: {
    bg: "rgba(230,126,34,0.1)",
    border: "rgba(230,126,34,0.35)",
    text: "#e8a76d",
  },
  TftYP: {
    bg: "rgba(46,204,113,0.1)",
    border: "rgba(46,204,113,0.35)",
    text: "#6dd5a0",
  },
};

function sourceColor(source: string) {
  return (
    SOURCE_COLORS[source] ?? {
      bg: GOLD_DIM,
      border: GOLD_BORDER,
      text: GOLD_MUTED,
    }
  );
}

// ---------------------------------------------------------------------------
// Category badge colors
// ---------------------------------------------------------------------------

const CATEGORY_COLORS: Record<
  string,
  { bg: string; border: string; text: string; label: string }
> = {
  condition: {
    bg: "rgba(231,76,60,0.1)",
    border: "rgba(231,76,60,0.35)",
    text: "#e8887d",
    label: "Condition",
  },
  status: {
    bg: "rgba(74,144,217,0.1)",
    border: "rgba(74,144,217,0.35)",
    text: "#7ab4e0",
    label: "Status",
  },
  disease: {
    bg: "rgba(155,89,182,0.1)",
    border: "rgba(155,89,182,0.35)",
    text: "#bb8fd9",
    label: "Disease",
  },
};

// ---------------------------------------------------------------------------
// Rich entry renderer
// ---------------------------------------------------------------------------

interface EntryObject {
  type?: string;
  name?: string;
  entry?: string;
  items?: (string | EntryObject)[];
  entries?: (string | EntryObject)[];
  colLabels?: string[];
  rows?: string[][];
  style?: string;
}

type Entry = string | EntryObject;

function stripTags(text: string): string {
  return parseTaggedText(text);
}

function renderEntries(entries: Entry[], depth = 0): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    if (typeof entry === "string") {
      nodes.push(
        <p
          key={`p-${depth}-${i}`}
          style={{
            color: TEXT_DIM,
            fontSize: "13px",
            fontFamily: SERIF,
            lineHeight: "1.7",
            margin: "0 0 8px 0",
            whiteSpace: "pre-wrap",
          }}
        >
          {stripTags(entry)}
        </p>,
      );
    } else if (entry && typeof entry === "object") {
      if (entry.type === "list" && Array.isArray(entry.items)) {
        nodes.push(
          <ul
            key={`list-${depth}-${i}`}
            style={{
              margin: "4px 0 8px 0",
              paddingLeft: "20px",
              listStyleType: "disc",
            }}
          >
            {entry.items.map((item, j) => {
              if (typeof item === "string") {
                return (
                  <li
                    key={j}
                    style={{
                      color: TEXT_DIM,
                      fontSize: "13px",
                      fontFamily: SERIF,
                      lineHeight: "1.7",
                      marginBottom: "4px",
                    }}
                  >
                    {stripTags(item)}
                  </li>
                );
              }
              // Object with name + entry (e.g. Fatigue, Weakness)
              if (item.type === "item" && item.name && item.entry) {
                return (
                  <li
                    key={j}
                    style={{
                      color: TEXT_DIM,
                      fontSize: "13px",
                      fontFamily: SERIF,
                      lineHeight: "1.7",
                      marginBottom: "4px",
                    }}
                  >
                    <strong style={{ color: GOLD_BRIGHT }}>
                      {stripTags(item.name)}.
                    </strong>{" "}
                    {stripTags(item.entry)}
                  </li>
                );
              }
              // Object with name + entries
              if (item.name && Array.isArray(item.entries)) {
                return (
                  <li
                    key={j}
                    style={{
                      color: TEXT_DIM,
                      fontSize: "13px",
                      fontFamily: SERIF,
                      lineHeight: "1.7",
                      marginBottom: "4px",
                    }}
                  >
                    <strong style={{ color: GOLD_BRIGHT }}>
                      {stripTags(item.name)}.
                    </strong>{" "}
                    {renderEntries(item.entries, depth + 1)}
                  </li>
                );
              }
              // Generic object — recurse
              if (Array.isArray(item.entries)) {
                return (
                  <li key={j}>
                    {renderEntries(item.entries as Entry[], depth + 1)}
                  </li>
                );
              }
              return null;
            })}
          </ul>,
        );
      } else if (entry.type === "entries" && Array.isArray(entry.entries)) {
        if (entry.name) {
          nodes.push(
            <h4
              key={`heading-${depth}-${i}`}
              style={{
                color: GOLD_BRIGHT,
                fontSize: "14px",
                fontWeight: "bold",
                fontFamily: SERIF,
                margin: "12px 0 4px 0",
              }}
            >
              {stripTags(entry.name)}
            </h4>,
          );
        }
        nodes.push(
          ...renderEntries(entry.entries as Entry[], depth + 1),
        );
      } else if (
        entry.type === "table" &&
        Array.isArray(entry.rows)
      ) {
        const labels = entry.colLabels ?? [];
        nodes.push(
          <table
            key={`table-${depth}-${i}`}
            style={{
              width: "100%",
              borderCollapse: "collapse",
              margin: "8px 0",
              fontFamily: SERIF,
              fontSize: "13px",
            }}
          >
            {labels.length > 0 && (
              <thead>
                <tr>
                  {labels.map((label, li) => (
                    <th
                      key={li}
                      style={{
                        textAlign: "left",
                        padding: "6px 10px",
                        color: GOLD,
                        borderBottom: `1px solid ${GOLD_BORDER}`,
                        fontSize: "11px",
                        textTransform: "uppercase",
                        letterSpacing: "0.8px",
                      }}
                    >
                      {stripTags(label)}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {entry.rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      style={{
                        padding: "5px 10px",
                        color: TEXT_DIM,
                        borderBottom: `1px solid rgba(201,168,76,0.1)`,
                      }}
                    >
                      {stripTags(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>,
        );
      }
    }
  }

  return nodes;
}

// ---------------------------------------------------------------------------
// Condition list row
// ---------------------------------------------------------------------------

function ConditionRow({
  entry,
  isActive,
  onClick,
}: {
  entry: ConditionDetail;
  isActive: boolean;
  onClick: () => void;
}) {
  const sc = sourceColor(entry.source);
  const cc = CATEGORY_COLORS[entry.category];

  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "10px 14px",
        background: isActive ? "rgba(201,168,76,0.1)" : "transparent",
        border: "none",
        borderLeft: isActive
          ? `3px solid ${GOLD}`
          : "3px solid transparent",
        borderBottom: `1px solid ${GOLD_BORDER}`,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        transition: "background 0.12s",
        fontFamily: SERIF,
      }}
      onMouseEnter={(e) => {
        if (!isActive)
          (e.currentTarget as HTMLButtonElement).style.background =
            "rgba(201,168,76,0.06)";
      }}
      onMouseLeave={(e) => {
        if (!isActive)
          (e.currentTarget as HTMLButtonElement).style.background =
            "transparent";
      }}
    >
      {/* Name + badges */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          minWidth: 0,
        }}
      >
        <span
          style={{
            color: isActive ? GOLD : GOLD_BRIGHT,
            fontSize: "13px",
            fontFamily: SERIF,
            fontWeight: isActive ? "bold" : "normal",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            flex: 1,
            minWidth: 0,
          }}
        >
          {entry.name}
        </span>
        <span
          style={{
            flexShrink: 0,
            background: sc.bg,
            border: `1px solid ${sc.border}`,
            borderRadius: "3px",
            padding: "0px 5px",
            color: sc.text,
            fontSize: "10px",
            fontFamily: SERIF,
            letterSpacing: "0.3px",
          }}
        >
          {entry.source}
        </span>
        <span
          style={{
            flexShrink: 0,
            background: cc.bg,
            border: `1px solid ${cc.border}`,
            borderRadius: "3px",
            padding: "0px 5px",
            color: cc.text,
            fontSize: "10px",
            fontFamily: SERIF,
            letterSpacing: "0.3px",
          }}
        >
          {cc.label}
        </span>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Condition detail panel
// ---------------------------------------------------------------------------

function ConditionDetailPanel({
  entry,
  isMobile,
  onBack,
}: {
  entry: ConditionDetail;
  isMobile?: boolean;
  onBack?: () => void;
}) {
  const sc = sourceColor(entry.source);
  const cc = CATEGORY_COLORS[entry.category];

  return (
    <div
      style={{
        flex: 2,
        background: "rgba(0,0,0,0.6)",
        border: `2px solid ${GOLD}`,
        borderRadius: "12px",
        boxShadow:
          "0 0 40px rgba(201,168,76,0.3), inset 0 0 60px rgba(0,0,0,0.5)",
        padding: isMobile ? "20px 16px" : "32px 36px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        minWidth: 0,
        minHeight: 0,
        height: "100%",
        overflowY: "auto",
        boxSizing: "border-box",
      }}
    >
      {/* Back button (mobile only) */}
      {isMobile && onBack && (
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: `1px solid ${GOLD_BORDER}`,
            borderRadius: "6px",
            padding: "6px 14px",
            color: GOLD,
            fontSize: "12px",
            fontFamily: SERIF,
            cursor: "pointer",
            alignSelf: "flex-start",
            letterSpacing: "0.5px",
          }}
        >
          &larr; Back to list
        </button>
      )}

      {/* Header */}
      <div>
        <h2
          style={{
            color: GOLD,
            fontSize: "26px",
            fontWeight: "bold",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            fontFamily: SERIF,
            margin: 0,
            marginBottom: "6px",
          }}
        >
          {entry.name}
        </h2>
      </div>

      {/* Badges */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <span
          style={{
            background: sc.bg,
            border: `1px solid ${sc.border}`,
            borderRadius: "6px",
            padding: "4px 12px",
            color: sc.text,
            fontSize: "12px",
            fontFamily: SERIF,
            fontWeight: "bold",
          }}
        >
          {entry.source}
        </span>
        <span
          style={{
            background: cc.bg,
            border: `1px solid ${cc.border}`,
            borderRadius: "6px",
            padding: "4px 12px",
            color: cc.text,
            fontSize: "12px",
            fontFamily: SERIF,
            fontWeight: "bold",
          }}
        >
          {cc.label}
        </span>
      </div>

      {/* Gradient divider */}
      <div
        style={{
          height: "1px",
          background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
          opacity: 0.5,
        }}
      />

      {/* Rich rendered entries */}
      <div>{renderEntries(entry.entries as Entry[])}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty detail placeholder
// ---------------------------------------------------------------------------

function ConditionDetailEmpty({ isMobile }: { isMobile?: boolean }) {
  return (
    <div
      style={{
        flex: 2,
        background: "rgba(0,0,0,0.4)",
        border: `1px solid ${GOLD_BORDER}`,
        borderRadius: "12px",
        display: isMobile ? "none" : "flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 0,
        minHeight: 0,
      }}
    >
      <p
        style={{
          color: GOLD_MUTED,
          fontSize: "14px",
          fontFamily: SERIF,
          fontStyle: "italic",
        }}
      >
        Select a condition or disease to view its details.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page content
// ---------------------------------------------------------------------------

type CategoryFilter = "all" | "condition" | "status" | "disease";

function ConditionsContent() {
  const isMobile = useIsMobile();
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<ConditionDetail | null>(
    null,
  );

  const filteredEntries = useMemo(() => {
    return ALL_ENTRIES.filter((entry) => {
      if (selectedSource && entry.source !== selectedSource) return false;
      if (selectedCategory !== "all" && entry.category !== selectedCategory)
        return false;
      if (
        searchQuery &&
        !entry.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
  }, [selectedSource, selectedCategory, searchQuery]);

  return (
    <>
      <Head>
        <title>Conditions &amp; Diseases — DnD Tool</title>
      </Head>

      {/* Outer wrapper fills viewport height minus Layout padding */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: isMobile ? "calc(100vh - 48px)" : "calc(100vh - 80px)",
          overflow: "hidden",
        }}
      >
        {/* Page header */}
        <div style={{ marginBottom: "20px", flexShrink: 0 }}>
          <h1
            style={{
              color: GOLD,
              fontSize: isMobile ? "20px" : "26px",
              fontWeight: "bold",
              letterSpacing: "2px",
              textTransform: "uppercase",
              marginBottom: "8px",
              fontFamily: SERIF,
            }}
          >
            Conditions &amp; Diseases
          </h1>
          <p
            style={{
              color: GOLD_MUTED,
              fontSize: "14px",
              marginBottom: "12px",
              fontFamily: SERIF,
            }}
          >
            Conditions, statuses, and diseases that affect creatures.
          </p>
          <div
            style={{
              width: "80px",
              height: "2px",
              background: GOLD,
              opacity: 0.6,
            }}
          />
        </div>

        {/* Two-column layout: list | detail */}
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: "24px",
            flex: 1,
            overflow: isMobile ? "auto" : "hidden",
            minHeight: 0,
          }}
        >
          {/* Left column: filters + list */}
          <div
            style={{
              flex: 3,
              minWidth: 0,
              display: isMobile && selectedEntry ? "none" : "flex",
              flexDirection: "column",
              gap: "10px",
              height: isMobile ? "auto" : "100%",
              overflow: isMobile ? "visible" : "hidden",
            }}
          >
            {/* Search */}
            <input
              type="text"
              placeholder="Search conditions & diseases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "rgba(30,15,5,0.9)",
                border: "1px solid rgba(201,168,76,0.4)",
                borderRadius: "6px",
                color: GOLD_BRIGHT,
                fontSize: "13px",
                fontFamily: SERIF,
                outline: "none",
                boxSizing: "border-box",
              }}
            />

            {/* Filter dropdowns row */}
            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: "8px",
                flexShrink: 0,
              }}
            >
              {/* Source filter */}
              <select
                value={selectedSource ?? ""}
                onChange={(e) => setSelectedSource(e.target.value || null)}
                style={{
                  flex: 1,
                  background: "rgba(30,15,5,0.9)",
                  border: "1px solid rgba(201,168,76,0.4)",
                  borderRadius: "6px",
                  padding: "8px 10px",
                  color: GOLD_BRIGHT,
                  fontSize: "12px",
                  fontFamily: SERIF,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="">All Sources</option>
                {CONDITION_SOURCES.map((src) => (
                  <option
                    key={src}
                    value={src}
                    style={{ background: "#1a0e05" }}
                  >
                    {src}
                  </option>
                ))}
              </select>

              {/* Category filter */}
              <select
                value={selectedCategory}
                onChange={(e) =>
                  setSelectedCategory(e.target.value as CategoryFilter)
                }
                style={{
                  flex: 1,
                  background: "rgba(30,15,5,0.9)",
                  border: "1px solid rgba(201,168,76,0.4)",
                  borderRadius: "6px",
                  padding: "8px 10px",
                  color: GOLD_BRIGHT,
                  fontSize: "12px",
                  fontFamily: SERIF,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="all" style={{ background: "#1a0e05" }}>
                  All Categories
                </option>
                <option value="condition" style={{ background: "#1a0e05" }}>
                  Conditions
                </option>
                <option value="status" style={{ background: "#1a0e05" }}>
                  Statuses
                </option>
                <option value="disease" style={{ background: "#1a0e05" }}>
                  Diseases
                </option>
              </select>
            </div>

            {/* Results count */}
            <div
              style={{
                color: GOLD_MUTED,
                fontSize: "11px",
                fontFamily: SERIF,
                textAlign: "right",
                flexShrink: 0,
              }}
            >
              {filteredEntries.length} entr
              {filteredEntries.length !== 1 ? "ies" : "y"}
            </div>

            {/* Scrollable list */}
            <div
              style={{
                background: "rgba(0,0,0,0.5)",
                border: `1px solid ${GOLD_BORDER}`,
                borderRadius: "8px",
                overflow: "hidden",
                flex: 1,
                overflowY: "auto",
                minHeight: 0,
                ...(isMobile ? { maxHeight: "50vh" } : {}),
              }}
            >
              {filteredEntries.length === 0 ? (
                <div style={{ padding: "24px 16px", textAlign: "center" }}>
                  <p
                    style={{
                      color: GOLD_MUTED,
                      fontSize: "13px",
                      fontFamily: SERIF,
                    }}
                  >
                    No entries match your filters.
                  </p>
                </div>
              ) : (
                filteredEntries.map((entry) => (
                  <ConditionRow
                    key={`${entry.name}|${entry.source}`}
                    entry={entry}
                    isActive={
                      selectedEntry?.name === entry.name &&
                      selectedEntry?.source === entry.source
                    }
                    onClick={() => setSelectedEntry(entry)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right column: detail */}
          {selectedEntry ? (
            <ConditionDetailPanel
              entry={selectedEntry}
              isMobile={isMobile}
              onBack={() => setSelectedEntry(null)}
            />
          ) : (
            <ConditionDetailEmpty isMobile={isMobile} />
          )}
        </div>
      </div>
    </>
  );
}

export default function ConditionsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <ConditionsContent />
      </Layout>
    </ProtectedRoute>
  );
}
