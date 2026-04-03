import type { AdventureSection } from "@/lib/adventureData";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useAdventureContent } from "@/hooks/useStaticData";
import { LoadingSkeleton } from "@/components/ui";
import { renderEntries } from "./shared";

export function StoryTab({
  source,
  sectionIndex,
  onSectionIndexChange,
}: {
  source: string;
  sectionIndex: number;
  onSectionIndexChange: (i: number) => void;
}) {
  const isMobile = useIsMobile();
  const { data: advContentData, isLoading: advContentLoading } = useAdventureContent();
  const selectedSectionIndex = sectionIndex;
  const setSelectedSectionIndex = onSectionIndexChange;

  if (advContentLoading || !advContentData) return <LoadingSkeleton />;
  const { ADVENTURE_DATA_MAP } = advContentData;

  const adventureData =
    source in ADVENTURE_DATA_MAP ? ADVENTURE_DATA_MAP[source] ?? null : null;

  if (!adventureData) {
    return (
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
            fontFamily: "'Georgia', 'Times New Roman', serif",
          }}
        >
          Content coming soon for this tome.
        </p>
      </div>
    );
  }

  const selectedSection = adventureData[selectedSectionIndex] ?? null;

  return (
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
            fontFamily: "'Georgia', 'Times New Roman', serif",
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
              fontFamily: "'Georgia', 'Times New Roman', serif",
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
                  fontFamily: "'Georgia', 'Times New Roman', serif",
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

      {/* Content -- Right Panel */}
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
  );
}
