import Head from "next/head";
import { useState, useMemo } from "react";
import { useRouter } from "next/router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  PageHeader,
  Input,
  Badge,
  Card,
  GOLD,
  GOLD_BRIGHT,
  GOLD_MUTED,
  TEXT_DIM,
  SERIF,
  LoadingSkeleton,
} from "@/components/ui";
import { useSpells, useMonsters, useItems, useClasses, useRaces, useFeats } from "@/hooks/useStaticData";
import type { Spell } from "@/lib/spellsData";
import type { MonsterInfo } from "@/lib/bestiaryData";
import type { Item } from "@/lib/itemsData";
import type { ClassInfo } from "@/lib/classData";
import type { RaceInfo } from "@/lib/raceData";
import type { Feat } from "@/lib/featData";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Category = "All" | "Spells" | "Monsters" | "Items" | "Classes" | "Races" | "Feats";

interface SearchResult {
  name: string;
  category: Category;
  detail: string;
  href: string;
}

// ---------------------------------------------------------------------------
// Category config
// ---------------------------------------------------------------------------

const CATEGORIES: Category[] = ["All", "Spells", "Monsters", "Items", "Classes", "Races", "Feats"];

const CATEGORY_COLORS: Record<Category, string> = {
  All: GOLD,
  Spells: "#9b59b6",
  Monsters: "#e74c3c",
  Items: "#27ae60",
  Classes: "#4a90d9",
  Races: "#e67e22",
  Feats: "#e91e8c",
};

const MAX_PER_CATEGORY = 20;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function levelLabel(level: number): string {
  if (level === 0) return "Cantrip";
  const suffixes = ["st", "nd", "rd"];
  const suffix = suffixes[level - 1] ?? "th";
  return `${level}${suffix} Level`;
}

function buildSpellResults(SPELLS: Spell[], query: string): SearchResult[] {
  const q = query.toLowerCase();
  return SPELLS.filter((s) => s.name.toLowerCase().includes(q)).map((s: Spell) => ({
    name: s.name,
    category: "Spells" as Category,
    detail: `${levelLabel(s.level)} · ${s.school} · ${s.castingTime}`,
    href: "/spells",
  }));
}

function buildMonsterResults(MONSTER_LIST: MonsterInfo[], query: string): SearchResult[] {
  const q = query.toLowerCase();
  return MONSTER_LIST.filter((m) => m.name.toLowerCase().includes(q)).map((m: MonsterInfo) => ({
    name: m.name,
    category: "Monsters" as Category,
    detail: `CR ${m.cr} · ${m.type}${m.hp != null ? ` · ${m.hp} HP` : ""}`,
    href: "/dm/monster-manual",
  }));
}

function buildItemResults(ITEMS: Item[], query: string): SearchResult[] {
  const q = query.toLowerCase();
  return ITEMS.filter((i) => i.name.toLowerCase().includes(q)).map((i: Item) => ({
    name: i.name,
    category: "Items" as Category,
    detail: `${i.type} · ${i.rarity}`,
    href: "/items",
  }));
}

function buildClassResults(CLASS_LIST: ClassInfo[], query: string): SearchResult[] {
  const q = query.toLowerCase();
  return CLASS_LIST.filter((c) => c.name.toLowerCase().includes(q)).map((c: ClassInfo) => ({
    name: c.name,
    category: "Classes" as Category,
    detail: `Source: ${c.source}`,
    href: "/classes",
  }));
}

function buildRaceResults(RACES: RaceInfo[], query: string): SearchResult[] {
  const q = query.toLowerCase();
  return RACES.filter((r) => r.name.toLowerCase().includes(q)).map((r: RaceInfo) => ({
    name: r.name,
    category: "Races" as Category,
    detail: `Source: ${r.source} · Speed: ${r.speed} ft`,
    href: "/races",
  }));
}

function buildFeatResults(FEATS: Feat[], query: string): SearchResult[] {
  const q = query.toLowerCase();
  return FEATS.filter((f) => f.name.toLowerCase().includes(q)).map((f: Feat) => ({
    name: f.name,
    category: "Feats" as Category,
    detail: [
      f.category ? `Category: ${f.category}` : null,
      f.prerequisiteText ? `Prereq: ${f.prerequisiteText}` : null,
    ]
      .filter(Boolean)
      .join(" · ") || `Source: ${f.source}`,
    href: "/classes", // feats don't have a dedicated page; link to classes
  }));
}

// ---------------------------------------------------------------------------
// Result card
// ---------------------------------------------------------------------------

function ResultCard({
  result,
  isMobile,
  onClick,
}: {
  result: SearchResult;
  isMobile: boolean;
  onClick: () => void;
}) {
  const catColor = CATEGORY_COLORS[result.category];

  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        padding: isMobile ? "12px 14px" : "10px 16px",
        background: "transparent",
        border: "none",
        borderBottom: "1px solid rgba(201,168,76,0.15)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        fontFamily: SERIF,
        transition: "background 0.12s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          "rgba(201,168,76,0.06)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      {/* Category dot */}
      <span
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: catColor,
          flexShrink: 0,
        }}
      />

      {/* Name + detail */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: GOLD_BRIGHT,
            fontSize: "14px",
            fontFamily: SERIF,
            fontWeight: "bold",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {result.name}
        </div>
        <div
          style={{
            color: TEXT_DIM,
            fontSize: "11px",
            fontFamily: SERIF,
            marginTop: "2px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {result.detail}
        </div>
      </div>

      {/* Category badge */}
      <Badge color={catColor}>{result.category === "Monsters" ? "Monster" : result.category.replace(/s$/, "")}</Badge>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main content
// ---------------------------------------------------------------------------

function SearchContent() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { data: spellData, isLoading: spellsLoading } = useSpells();
  const { data: monsterData, isLoading: monstersLoading } = useMonsters();
  const { data: itemData, isLoading: itemsLoading } = useItems();
  const { data: classData, isLoading: classesLoading } = useClasses();
  const { data: raceData, isLoading: racesLoading } = useRaces();
  const { data: featData, isLoading: featsLoading } = useFeats();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("All");

  const anyLoading = spellsLoading || monstersLoading || itemsLoading || classesLoading || racesLoading || featsLoading;
  if (anyLoading || !spellData || !monsterData || !itemData || !classData || !raceData || !featData) return <LoadingSkeleton />;

  const { SPELLS } = spellData;
  const { MONSTER_LIST } = monsterData;
  const { ITEMS } = itemData;
  const { CLASS_LIST } = classData;
  const { RACES } = raceData;
  const { FEATS } = featData;

  const results = useMemo(() => {
    if (query.length < 2) return { grouped: {} as Record<Category, SearchResult[]>, total: 0 };

    const builders: Array<{ key: Category; fn: (q: string) => SearchResult[] }> = [
      { key: "Spells", fn: (q) => buildSpellResults(SPELLS, q) },
      { key: "Monsters", fn: (q) => buildMonsterResults(MONSTER_LIST, q) },
      { key: "Items", fn: (q) => buildItemResults(ITEMS, q) },
      { key: "Classes", fn: (q) => buildClassResults(CLASS_LIST, q) },
      { key: "Races", fn: (q) => buildRaceResults(RACES, q) },
      { key: "Feats", fn: (q) => buildFeatResults(FEATS, q) },
    ];

    const grouped: Record<string, SearchResult[]> = {};
    let total = 0;

    for (const { key, fn } of builders) {
      if (activeCategory !== "All" && activeCategory !== key) continue;
      const matches = fn(query);
      total += matches.length;
      grouped[key] = matches;
    }

    return { grouped: grouped as Record<Category, SearchResult[]>, total };
  }, [query, activeCategory]);

  const handleResultClick = (result: SearchResult) => {
    void router.push(result.href);
  };

  return (
    <>
      <Head>
        <title>Compendium Search — DnD Tool</title>
      </Head>

      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <PageHeader
          title="Compendium Search"
          subtitle="Search across all compendiums"
        />

        {/* Search input */}
        <div style={{ marginBottom: "16px" }}>
          <Input
            type="text"
            placeholder="Search spells, monsters, items, classes, races, feats..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            style={{ fontSize: "16px", padding: "14px 18px" }}
          />
        </div>

        {/* Category filters */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            marginBottom: "20px",
          }}
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            const color = CATEGORY_COLORS[cat];
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  background: isActive ? `${color}33` : "transparent",
                  border: `1px solid ${isActive ? color : "rgba(201,168,76,0.25)"}`,
                  borderRadius: "6px",
                  padding: "6px 14px",
                  color: isActive ? color : GOLD_MUTED,
                  fontSize: "12px",
                  fontFamily: SERIF,
                  fontWeight: isActive ? "bold" : "normal",
                  cursor: "pointer",
                  letterSpacing: "0.5px",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = color;
                    (e.currentTarget as HTMLButtonElement).style.color = color;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      "rgba(201,168,76,0.25)";
                    (e.currentTarget as HTMLButtonElement).style.color = GOLD_MUTED;
                  }
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Results area */}
        {query.length < 2 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: GOLD_MUTED,
              fontFamily: SERIF,
              fontSize: "14px",
              fontStyle: "italic",
            }}
          >
            Type at least 2 characters to begin your search.
          </div>
        ) : results.total === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: GOLD_MUTED,
              fontFamily: SERIF,
              fontSize: "14px",
              fontStyle: "italic",
            }}
          >
            No results found for &quot;{query}&quot;.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Total count */}
            <div
              style={{
                color: GOLD_MUTED,
                fontSize: "12px",
                fontFamily: SERIF,
                textAlign: "right",
              }}
            >
              {results.total} result{results.total !== 1 ? "s" : ""} found
            </div>

            {/* Grouped results */}
            {(Object.entries(results.grouped) as Array<[Category, SearchResult[]]>)
              .filter(([, items]) => items.length > 0)
              .map(([category, items]) => {
                const truncated = items.length > MAX_PER_CATEGORY;
                const displayItems = truncated
                  ? items.slice(0, MAX_PER_CATEGORY)
                  : items;
                const catColor = CATEGORY_COLORS[category];

                return (
                  <Card key={category} variant="light" padding="0">
                    {/* Category header */}
                    <div
                      style={{
                        padding: isMobile ? "12px 14px" : "10px 16px",
                        borderBottom: "1px solid rgba(201,168,76,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            width: "10px",
                            height: "10px",
                            borderRadius: "50%",
                            background: catColor,
                          }}
                        />
                        <span
                          style={{
                            color: GOLD,
                            fontSize: "14px",
                            fontFamily: SERIF,
                            fontWeight: "bold",
                            letterSpacing: "1px",
                            textTransform: "uppercase",
                          }}
                        >
                          {category}
                        </span>
                      </div>
                      <span
                        style={{
                          color: GOLD_MUTED,
                          fontSize: "11px",
                          fontFamily: SERIF,
                        }}
                      >
                        {items.length} match{items.length !== 1 ? "es" : ""}
                      </span>
                    </div>

                    {/* Result rows */}
                    {displayItems.map((result, idx) => (
                      <ResultCard
                        key={`${result.name}-${idx}`}
                        result={result}
                        isMobile={isMobile}
                        onClick={() => handleResultClick(result)}
                      />
                    ))}

                    {/* Truncation notice */}
                    {truncated && (
                      <div
                        style={{
                          padding: "10px 16px",
                          textAlign: "center",
                          color: GOLD_MUTED,
                          fontSize: "12px",
                          fontFamily: SERIF,
                          fontStyle: "italic",
                        }}
                      >
                        and {items.length - MAX_PER_CATEGORY} more...
                      </div>
                    )}
                  </Card>
                );
              })}
          </div>
        )}
      </div>
    </>
  );
}

export default function SearchPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <SearchContent />
      </Layout>
    </ProtectedRoute>
  );
}
