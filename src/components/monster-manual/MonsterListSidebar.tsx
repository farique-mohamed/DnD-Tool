import { type MonsterInfo } from "@/lib/bestiaryData";
import {
  GOLD,
  GOLD_BRIGHT,
  GOLD_MUTED,
  GOLD_BORDER,
  SERIF,
  CR_OPTIONS,
} from "./theme";
import { MonsterRow } from "./MonsterRow";

// ---------------------------------------------------------------------------
// Monster list sidebar (search, filters, list, pagination)
// ---------------------------------------------------------------------------

export interface MonsterListSidebarProps {
  query: string;
  onQueryChange: (val: string) => void;
  crFilter: string;
  onCrFilterChange: (val: string) => void;
  filteredCount: number;
  visibleMonsters: MonsterInfo[];
  selected: MonsterInfo;
  onSelect: (m: MonsterInfo) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isMobile?: boolean;
}

export function MonsterListSidebar({
  query,
  onQueryChange,
  crFilter,
  onCrFilterChange,
  filteredCount,
  visibleMonsters,
  selected,
  onSelect,
  page,
  totalPages,
  onPageChange,
  isMobile,
}: MonsterListSidebarProps) {
  return (
    <div
      style={{
        width: isMobile ? "100%" : "280px",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* Search bar */}
      <input
        type="text"
        placeholder="Search monsters..."
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        style={{
          width: "100%",
          padding: "10px 14px",
          background: "rgba(30,15,5,0.9)",
          border: `1px solid rgba(201,168,76,0.4)`,
          borderRadius: "6px",
          color: GOLD_BRIGHT,
          fontSize: "13px",
          fontFamily: SERIF,
          outline: "none",
          boxSizing: "border-box",
        }}
      />

      {/* CR filter */}
      <select
        value={crFilter}
        onChange={(e) => onCrFilterChange(e.target.value)}
        style={{
          width: "100%",
          padding: "8px 12px",
          background: "rgba(30,15,5,0.9)",
          border: `1px solid rgba(201,168,76,0.4)`,
          borderRadius: "6px",
          color: GOLD_BRIGHT,
          fontSize: "13px",
          fontFamily: SERIF,
          outline: "none",
          cursor: "pointer",
          boxSizing: "border-box",
        }}
      >
        {CR_OPTIONS.map((cr) => (
          <option key={cr} value={cr}>
            {cr === "All" ? "All Challenge Ratings" : `CR ${cr}`}
          </option>
        ))}
      </select>

      {/* Results count */}
      <div
        style={{
          color: GOLD_MUTED,
          fontSize: "11px",
          fontFamily: SERIF,
          textAlign: "right",
        }}
      >
        {filteredCount} creature{filteredCount !== 1 ? "s" : ""}
      </div>

      {/* Monster list -- takes remaining flex space */}
      <div
        style={{
          background: "rgba(0,0,0,0.5)",
          border: `1px solid ${GOLD_BORDER}`,
          borderRadius: "8px",
          overflow: "hidden",
          flex: 1,
          overflowY: "auto",
          minHeight: 0,
        }}
      >
        {visibleMonsters.length === 0 ? (
          <div style={{ padding: "24px 16px", textAlign: "center" }}>
            <p
              style={{
                color: GOLD_MUTED,
                fontSize: "13px",
                fontFamily: SERIF,
              }}
            >
              No creatures match your search.
            </p>
          </div>
        ) : (
          visibleMonsters.map((monster) => (
            <MonsterRow
              key={`${monster.name}-${monster.source}`}
              monster={monster}
              isActive={
                selected.name === monster.name &&
                selected.source === monster.source
              }
              onClick={() => onSelect(monster)}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            gap: "6px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            disabled={page === 0}
            onClick={() => onPageChange(Math.max(0, page - 1))}
            style={{
              background: "transparent",
              border: `1px solid rgba(201,168,76,0.4)`,
              color: page === 0 ? GOLD_MUTED : GOLD,
              borderRadius: "4px",
              padding: "4px 10px",
              fontSize: "12px",
              fontFamily: SERIF,
              cursor: page === 0 ? "default" : "pointer",
              opacity: page === 0 ? 0.4 : 1,
            }}
          >
            ‹ Prev
          </button>
          <span
            style={{
              color: GOLD_MUTED,
              fontSize: "12px",
              fontFamily: SERIF,
              padding: "4px 8px",
              lineHeight: "1.6",
            }}
          >
            {page + 1} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
            style={{
              background: "transparent",
              border: `1px solid rgba(201,168,76,0.4)`,
              color: page >= totalPages - 1 ? GOLD_MUTED : GOLD,
              borderRadius: "4px",
              padding: "4px 10px",
              fontSize: "12px",
              fontFamily: SERIF,
              cursor: page >= totalPages - 1 ? "default" : "pointer",
              opacity: page >= totalPages - 1 ? 0.4 : 1,
            }}
          >
            Next ›
          </button>
        </div>
      )}
    </div>
  );
}
