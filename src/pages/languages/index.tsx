import Head from "next/head";
import { useState, useMemo } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { useIsMobile } from "@/hooks/useIsMobile";
import { LANGUAGES, LANGUAGE_SOURCES, LANGUAGE_TYPES, type LanguageInfo } from "@/lib/languageData";

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

const SOURCE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  PHB: { bg: "rgba(74,144,217,0.1)", border: "rgba(74,144,217,0.35)", text: "#7ab4e0" },
  XPHB: { bg: "rgba(46,204,113,0.1)", border: "rgba(46,204,113,0.35)", text: "#6dd5a0" },
  VGM: { bg: "rgba(155,89,182,0.1)", border: "rgba(155,89,182,0.35)", text: "#bb8fd9" },
  MPMM: { bg: "rgba(231,76,60,0.1)", border: "rgba(231,76,60,0.35)", text: "#e8887d" },
  ERLW: { bg: "rgba(230,126,34,0.1)", border: "rgba(230,126,34,0.35)", text: "#e8a76d" },
  EGW: { bg: "rgba(52,152,219,0.1)", border: "rgba(52,152,219,0.35)", text: "#7cbde8" },
  VRGR: { bg: "rgba(225,29,72,0.1)", border: "rgba(225,29,72,0.35)", text: "#e8637e" },
  GGR: { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.35)", text: "#f5b84d" },
  MOT: { bg: "rgba(14,165,233,0.1)", border: "rgba(14,165,233,0.35)", text: "#5dc4f0" },
  AI: { bg: "rgba(132,204,22,0.1)", border: "rgba(132,204,22,0.35)", text: "#a3d95c" },
  AAG: { bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.35)", text: "#9597f5" },
  SCC: { bg: "rgba(217,70,239,0.1)", border: "rgba(217,70,239,0.35)", text: "#e08ef0" },
  TOB: { bg: "rgba(139,101,8,0.1)", border: "rgba(139,101,8,0.35)", text: "#b8934a" },
};

function sourceColor(source: string) {
  return SOURCE_COLORS[source] ?? { bg: GOLD_DIM, border: GOLD_BORDER, text: GOLD_MUTED };
}

// ---------------------------------------------------------------------------
// Type badge color helper
// ---------------------------------------------------------------------------

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  Standard: { bg: "rgba(46,204,113,0.1)", border: "rgba(46,204,113,0.35)", text: "#6dd5a0" },
  Exotic: { bg: "rgba(155,89,182,0.1)", border: "rgba(155,89,182,0.35)", text: "#bb8fd9" },
  Rare: { bg: "rgba(230,126,34,0.1)", border: "rgba(230,126,34,0.35)", text: "#e8a76d" },
};

function typeColor(type: string) {
  return TYPE_COLORS[type] ?? { bg: GOLD_DIM, border: GOLD_BORDER, text: GOLD_MUTED };
}

// ---------------------------------------------------------------------------
// Language list row
// ---------------------------------------------------------------------------

function LanguageRow({
  language,
  isActive,
  onClick,
}: {
  language: LanguageInfo;
  isActive: boolean;
  onClick: () => void;
}) {
  const sc = sourceColor(language.source);
  const tc = typeColor(language.type);

  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "10px 14px",
        background: isActive ? "rgba(201,168,76,0.1)" : "transparent",
        border: "none",
        borderLeft: isActive ? `3px solid ${GOLD}` : "3px solid transparent",
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
      {/* Name + source badge + type badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
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
          {language.name}
        </span>
        <span
          style={{
            flexShrink: 0,
            background: tc.bg,
            border: `1px solid ${tc.border}`,
            borderRadius: "3px",
            padding: "0px 5px",
            color: tc.text,
            fontSize: "10px",
            fontFamily: SERIF,
            letterSpacing: "0.3px",
          }}
        >
          {language.type}
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
          {language.source}
        </span>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Language detail panel
// ---------------------------------------------------------------------------

function LanguageDetailPanel({
  language,
  isMobile,
  onBack,
}: {
  language: LanguageInfo;
  isMobile?: boolean;
  onBack?: () => void;
}) {
  const sc = sourceColor(language.source);
  const tc = typeColor(language.type);

  const metaRows: Array<{ label: string; value: string }> = [
    { label: "Type", value: language.type },
  ];

  if (language.script) {
    metaRows.push({ label: "Script", value: language.script });
  }
  if (language.origin) {
    metaRows.push({ label: "Origin", value: language.origin });
  }
  if (language.typicalSpeakers.length > 0) {
    metaRows.push({ label: "Typical Speakers", value: language.typicalSpeakers.join(", ") });
  }
  metaRows.push({ label: "Source", value: language.source });

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
          {language.name}
        </h2>
        <p
          style={{
            color: GOLD_MUTED,
            fontSize: "13px",
            fontFamily: SERIF,
            fontStyle: "italic",
            margin: 0,
          }}
        >
          {language.type} Language
        </p>
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
          {language.source}
        </span>
        <span
          style={{
            background: tc.bg,
            border: `1px solid ${tc.border}`,
            borderRadius: "6px",
            padding: "4px 12px",
            color: tc.text,
            fontSize: "12px",
            fontFamily: SERIF,
          }}
        >
          {language.type}
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

      {/* Meta stats */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {metaRows.map(({ label, value }) => (
          <div
            key={label}
            style={{ display: "flex", gap: "8px", alignItems: "baseline" }}
          >
            <span
              style={{
                color: GOLD,
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "1.2px",
                fontFamily: SERIF,
                minWidth: "120px",
                flexShrink: 0,
              }}
            >
              {label}
            </span>
            <span
              style={{
                color: GOLD_BRIGHT,
                fontSize: "13px",
                fontFamily: SERIF,
                lineHeight: "1.5",
              }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty detail placeholder
// ---------------------------------------------------------------------------

function LanguageDetailEmpty({ isMobile }: { isMobile?: boolean }) {
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
        Select a language to view its details.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page content
// ---------------------------------------------------------------------------

function LanguagesContent() {
  const isMobile = useIsMobile();
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageInfo | null>(null);

  const filteredLanguages = useMemo(() => {
    return LANGUAGES.filter((lang) => {
      if (selectedSource && lang.source !== selectedSource) return false;
      if (selectedType && lang.type !== selectedType) return false;
      if (searchQuery && !lang.name.toLowerCase().includes(searchQuery.toLowerCase()))
        return false;
      return true;
    });
  }, [selectedSource, selectedType, searchQuery]);

  return (
    <>
      <Head>
        <title>Language Compendium — DnD Tool</title>
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
            Language Compendium
          </h1>
          <p
            style={{
              color: GOLD_MUTED,
              fontSize: "14px",
              marginBottom: "12px",
              fontFamily: SERIF,
            }}
          >
            Browse and discover the languages spoken across the realms.
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
          {/* Left column: filters + language list */}
          <div
            style={{
              flex: 3,
              minWidth: 0,
              display: isMobile && selectedLanguage ? "none" : "flex",
              flexDirection: "column",
              gap: "10px",
              height: isMobile ? "auto" : "100%",
              overflow: isMobile ? "visible" : "hidden",
            }}
          >
            {/* Search */}
            <input
              type="text"
              placeholder="Search languages..."
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
                {LANGUAGE_SOURCES.map((src) => (
                  <option key={src} value={src} style={{ background: "#1a0e05" }}>
                    {src}
                  </option>
                ))}
              </select>

              {/* Type filter */}
              <select
                value={selectedType ?? ""}
                onChange={(e) => setSelectedType(e.target.value || null)}
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
                <option value="">All Types</option>
                {LANGUAGE_TYPES.map((type) => (
                  <option key={type} value={type} style={{ background: "#1a0e05" }}>
                    {type}
                  </option>
                ))}
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
              {filteredLanguages.length} language{filteredLanguages.length !== 1 ? "s" : ""}
            </div>

            {/* Scrollable language list */}
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
              {filteredLanguages.length === 0 ? (
                <div style={{ padding: "24px 16px", textAlign: "center" }}>
                  <p
                    style={{
                      color: GOLD_MUTED,
                      fontSize: "13px",
                      fontFamily: SERIF,
                    }}
                  >
                    No languages match your filters.
                  </p>
                </div>
              ) : (
                filteredLanguages.map((lang) => (
                  <LanguageRow
                    key={`${lang.name}|${lang.source}`}
                    language={lang}
                    isActive={
                      selectedLanguage?.name === lang.name &&
                      selectedLanguage?.source === lang.source
                    }
                    onClick={() => setSelectedLanguage(lang)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right column: language detail */}
          {selectedLanguage ? (
            <LanguageDetailPanel
              language={selectedLanguage}
              isMobile={isMobile}
              onBack={() => setSelectedLanguage(null)}
            />
          ) : (
            <LanguageDetailEmpty isMobile={isMobile} />
          )}
        </div>
      </div>
    </>
  );
}

export default function LanguagesPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <LanguagesContent />
      </Layout>
    </ProtectedRoute>
  );
}
