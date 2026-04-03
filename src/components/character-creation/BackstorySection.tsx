import { useState, useCallback, useMemo } from "react";
import { sectionTitleStyle, labelStyle, inputStyle } from "./shared";
import { useLife } from "@/hooks/useStaticData";
import type { LifeClass } from "@/lib/lifeData";
import { LoadingSkeleton } from "@/components/ui";

interface BackstorySectionProps {
  backstory: string;
  characterClass: string;
  isLoading: boolean;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onAppendBackstory?: (text: string) => void;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const rollButtonStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid rgba(201,168,76,0.4)",
  borderRadius: "4px",
  color: "#a89060",
  fontSize: "11px",
  fontFamily: "'Georgia', serif",
  padding: "2px 8px",
  cursor: "pointer",
  marginLeft: "8px",
  transition: "all 0.15s ease",
  verticalAlign: "middle",
};

const categoryHeadingStyle: React.CSSProperties = {
  color: "#c9a84c",
  fontSize: "12px",
  fontWeight: "bold",
  fontFamily: "'Georgia', serif",
  letterSpacing: "0.05em",
  marginBottom: "6px",
  marginTop: "14px",
};

const listItemStyle: React.CSSProperties = {
  color: "rgba(232,213,163,0.6)",
  fontSize: "12px",
  fontFamily: "'Georgia', 'Times New Roman', serif",
  lineHeight: "1.6",
  listStyleType: "none",
  padding: "2px 6px",
  borderRadius: "4px",
  transition: "all 0.2s ease",
};

const highlightedItemStyle: React.CSSProperties = {
  ...listItemStyle,
  color: "#e8d5a3",
  background: "rgba(201,168,76,0.18)",
  boxShadow: "0 0 8px rgba(201,168,76,0.25)",
};

// ---------------------------------------------------------------------------
// Sub-component: a numbered list with a Roll button
// ---------------------------------------------------------------------------

function RollableList({
  heading,
  items,
  onAppend,
}: {
  heading: string;
  items: string[];
  onAppend?: (text: string) => void;
}) {
  const [highlighted, setHighlighted] = useState<number | null>(null);

  const roll = useCallback(() => {
    setHighlighted(Math.floor(Math.random() * items.length));
  }, [items.length]);

  if (items.length === 0) return null;

  return (
    <div>
      <div style={categoryHeadingStyle}>
        {heading}
        <button type="button" style={rollButtonStyle} onClick={roll} title="Roll randomly">
          🎲 Roll
        </button>
      </div>
      <ol style={{ margin: 0, paddingLeft: "20px" }}>
        {items.map((item, i) => (
          <li
            key={i}
            style={i === highlighted ? highlightedItemStyle : listItemStyle}
          >
            <span style={{ color: "rgba(201,168,76,0.5)", marginRight: "6px", fontSize: "10px" }}>
              {i + 1}.
            </span>
            {item}
            {i === highlighted && onAppend && (
              <button
                type="button"
                onClick={() => onAppend(`${heading}: ${item}`)}
                style={{
                  ...rollButtonStyle,
                  fontSize: "10px",
                  padding: "1px 6px",
                  marginLeft: "6px",
                  color: "#c9a84c",
                  borderColor: "rgba(201,168,76,0.6)",
                }}
                title="Add to backstory"
              >
                + Add
              </button>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Life Inspiration panel
// ---------------------------------------------------------------------------

function LifeInspirationPanel({ lifeClass, onAppend }: { lifeClass: LifeClass; onAppend?: (text: string) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      border: "1px solid rgba(201,168,76,0.25)",
      borderRadius: "8px",
      marginBottom: "16px",
      overflow: "hidden",
    }}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(201,168,76,0.08)",
          border: "none",
          padding: "10px 14px",
          cursor: "pointer",
          color: "#c9a84c",
          fontSize: "12px",
          fontWeight: "bold",
          fontFamily: "'Georgia', serif",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        <span>Life Inspiration — {lifeClass.name}</span>
        <span style={{ fontSize: "10px", color: "#a89060" }}>
          {expanded ? "▲ Collapse" : "▼ Expand"}
        </span>
      </button>

      {expanded && (
        <div style={{ padding: "12px 14px 16px" }}>
          {lifeClass.reasons.length > 0 && (
            <RollableList
              heading={`Why did you become a ${lifeClass.name}?`}
              items={lifeClass.reasons}
              onAppend={onAppend}
            />
          )}

          {lifeClass.categories.map((cat) => (
            <RollableList
              key={cat.name}
              heading={cat.name}
              items={cat.options}
              onAppend={onAppend}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// BackstorySection
// ---------------------------------------------------------------------------

export function BackstorySection({
  backstory,
  characterClass,
  isLoading,
  onFormChange,
  onAppendBackstory,
}: BackstorySectionProps) {
  const { data: lifeHookData, isLoading: lifeHookLoading } = useLife();

  if (lifeHookLoading || !lifeHookData) return <LoadingSkeleton />;
  const { LIFE_CLASSES } = lifeHookData;

  const lifeClass = useMemo(
    () => LIFE_CLASSES.find((lc) => lc.name.toLowerCase() === characterClass.toLowerCase()),
    [characterClass, LIFE_CLASSES],
  );

  return (
    <div>
      <p style={sectionTitleStyle}>Lore</p>

      {lifeClass && (lifeClass.reasons.length > 0 || lifeClass.categories.length > 0) && (
        <LifeInspirationPanel lifeClass={lifeClass} onAppend={onAppendBackstory} />
      )}

      <div>
        <label htmlFor="backstory" style={labelStyle}>Backstory</label>
        <textarea id="backstory" name="backstory" placeholder="Every hero has a tale... (optional)" value={backstory} onChange={onFormChange} rows={5} style={{ ...inputStyle, resize: "vertical", minHeight: "100px" }} disabled={isLoading} />
      </div>
    </div>
  );
}
