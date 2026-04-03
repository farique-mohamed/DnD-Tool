import Head from "next/head";
import { useState, useMemo } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { useIsMobile } from "@/hooks/useIsMobile";
import { MONSTER_LIST, type MonsterInfo } from "@/lib/bestiaryData";
import { GOLD, GOLD_MUTED, SERIF, PAGE_SIZE } from "@/components/monster-manual/theme";
import { MonsterListSidebar } from "@/components/monster-manual/MonsterListSidebar";
import { MonsterDetailPanel } from "@/components/monster-manual/MonsterDetailPanel";

// ---------------------------------------------------------------------------
// Main page content
// ---------------------------------------------------------------------------

function MonsterManualContent() {
  const isMobile = useIsMobile();
  const [query, setQuery] = useState("");
  const [crFilter, setCrFilter] = useState("All");
  const [selected, setSelected] = useState<MonsterInfo>(MONSTER_LIST[0]!);
  const [page, setPage] = useState(0);
  const [showDetail, setShowDetail] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return MONSTER_LIST.filter((m) => {
      const matchesQuery = q
        ? m.name.toLowerCase().includes(q) ||
          m.type.toLowerCase().includes(q) ||
          m.alignment.toLowerCase().includes(q)
        : true;
      const matchesCr = crFilter === "All" ? true : m.cr === crFilter;
      return matchesQuery && matchesCr;
    });
  }, [query, crFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visibleMonsters = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    setPage(0);
  };

  const handleCrFilter = (val: string) => {
    setCrFilter(val);
    setPage(0);
  };

  const handleSelect = (m: MonsterInfo) => {
    setSelected(m);
    if (isMobile) setShowDetail(true);
  };

  return (
    <>
      <Head>
        <title>Monster Manual — DnD Tool</title>
      </Head>

      {/* Outer wrapper: fills viewport height minus the main padding */}
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
          Monster Manual
        </h1>
        <p style={{ color: GOLD_MUTED, fontSize: "14px", marginBottom: "12px", fontFamily: SERIF }}>
          Consult the ancient tome to know your foes.
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

      {/* Two-column layout: list | detail — fills remaining height */}
      <div style={{ display: "flex", gap: isMobile ? "0" : "24px", flex: 1, overflow: "hidden", minHeight: 0 }}>
        {/* Left: search + filters + list */}
        {(!isMobile || !showDetail) && (
          <MonsterListSidebar
            query={query}
            onQueryChange={handleQueryChange}
            crFilter={crFilter}
            onCrFilterChange={handleCrFilter}
            filteredCount={filtered.length}
            visibleMonsters={visibleMonsters}
            selected={selected}
            onSelect={handleSelect}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            isMobile={isMobile}
          />
        )}

        {/* Right: monster detail */}
        {(!isMobile || showDetail) && (
          <MonsterDetailPanel
            monster={selected}
            isMobile={isMobile}
            onBack={() => setShowDetail(false)}
          />
        )}
      </div>
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
