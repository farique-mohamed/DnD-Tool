import Head from "next/head";
import { useState, useMemo } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { useIsMobile } from "@/hooks/useIsMobile";
import { FEATS, type Feat } from "@/lib/featData";
import { FeatRow } from "@/components/feats/FeatRow";
import { FeatDetailPanel, FeatDetailEmpty } from "@/components/feats/FeatDetailPanel";
import {
  GOLD,
  GOLD_BRIGHT,
  GOLD_MUTED,
  GOLD_BORDER,
  SERIF,
  categoryDisplayName,
} from "@/components/feats/featConstants";

// ---------------------------------------------------------------------------
// Derived filter data
// ---------------------------------------------------------------------------

const FEAT_SOURCES = Array.from(new Set(FEATS.map((f) => f.source))).sort();

const FEAT_CATEGORIES = Array.from(
  new Set(FEATS.map((f) => f.category).filter((c): c is string => c != null)),
).sort();

const FEAT_LEVELS = Array.from(
  new Set(FEATS.map((f) => f.levelRequired).filter((l): l is number => l != null)),
).sort((a, b) => a - b);

// ---------------------------------------------------------------------------
// Main page content
// ---------------------------------------------------------------------------

function FeatsContent() {
  const isMobile = useIsMobile();

  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFeat, setSelectedFeat] = useState<Feat | null>(null);

  const filteredFeats = useMemo(() => {
    return FEATS.filter((feat) => {
      if (selectedSource && feat.source !== selectedSource) return false;
      if (selectedCategory !== null) {
        if (selectedCategory === "__none__") {
          if (feat.category != null) return false;
        } else {
          if (feat.category !== selectedCategory) return false;
        }
      }
      if (selectedLevel !== null && feat.levelRequired !== selectedLevel) return false;
      if (searchQuery && !feat.name.toLowerCase().includes(searchQuery.toLowerCase()))
        return false;
      return true;
    });
  }, [selectedSource, selectedCategory, selectedLevel, searchQuery]);

  const handleSelect = (feat: Feat) => {
    setSelectedFeat(feat);
  };

  return (
    <>
      <Head>
        <title>Feat Compendium — DnD Tool</title>
      </Head>

      {/* Outer wrapper fills viewport height minus Layout padding */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: isMobile ? "calc(100vh - 48px)" : "calc(100vh - 80px)",
          overflow: isMobile ? "auto" : "hidden",
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
            Feat Compendium
          </h1>
          <p
            style={{
              color: GOLD_MUTED,
              fontSize: "14px",
              marginBottom: "12px",
              fontFamily: SERIF,
            }}
          >
            Browse feats and special abilities.
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

        {/* Two-column layout: list (flex:3) | detail (flex:2) */}
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
          {/* Left column: filters + feat list */}
          <div
            style={{
              flex: 3,
              minWidth: 0,
              display: isMobile && selectedFeat ? "none" : "flex",
              flexDirection: "column",
              gap: "10px",
              height: isMobile ? "auto" : "100%",
              overflow: isMobile ? "visible" : "hidden",
            }}
          >
            {/* Search */}
            <input
              type="text"
              placeholder="Search feats..."
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
                {FEAT_SOURCES.map((src) => (
                  <option key={src} value={src} style={{ background: "#1a0e05" }}>
                    {src}
                  </option>
                ))}
              </select>

              {/* Category filter */}
              <select
                value={selectedCategory ?? ""}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
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
                <option value="">All Categories</option>
                {FEAT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} style={{ background: "#1a0e05" }}>
                    {categoryDisplayName(cat)}
                  </option>
                ))}
                <option value="__none__" style={{ background: "#1a0e05" }}>
                  Uncategorized
                </option>
              </select>

              {/* Level filter */}
              <select
                value={selectedLevel === null ? "" : String(selectedLevel)}
                onChange={(e) =>
                  setSelectedLevel(
                    e.target.value === "" ? null : Number(e.target.value),
                  )
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
                <option value="">All Levels</option>
                {FEAT_LEVELS.map((level) => (
                  <option key={level} value={String(level)} style={{ background: "#1a0e05" }}>
                    Level {level}+
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
              {filteredFeats.length} feat{filteredFeats.length !== 1 ? "s" : ""}
            </div>

            {/* Scrollable feat list */}
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
              {filteredFeats.length === 0 ? (
                <div style={{ padding: "24px 16px", textAlign: "center" }}>
                  <p
                    style={{
                      color: GOLD_MUTED,
                      fontSize: "13px",
                      fontFamily: SERIF,
                    }}
                  >
                    No feats match your filters.
                  </p>
                </div>
              ) : (
                filteredFeats.map((feat) => (
                  <FeatRow
                    key={`${feat.name}|${feat.source}`}
                    feat={feat}
                    isActive={
                      selectedFeat?.name === feat.name &&
                      selectedFeat?.source === feat.source
                    }
                    onClick={() => handleSelect(feat)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right column: feat detail */}
          {selectedFeat ? (
            <FeatDetailPanel
              feat={selectedFeat}
              isMobile={isMobile}
              onBack={() => setSelectedFeat(null)}
            />
          ) : (
            <FeatDetailEmpty isMobile={isMobile} />
          )}
        </div>
      </div>
    </>
  );
}

export default function FeatsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <FeatsContent />
      </Layout>
    </ProtectedRoute>
  );
}
