import { useState, useCallback } from "react";

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

const BIRTHPLACES: string[] = [
  "Home",
  "Hovel",
  "Inn or tavern",
  "Hospital or healer's care",
  "Carriage or cart",
  "Ruins",
  "Wilderness",
  "Battlefield",
  "Temple or shrine",
  "Ship",
];

const SIBLINGS_RESULTS: string[] = [
  "None",
  "None",
  "One sibling",
  "One sibling",
  "Two siblings",
  "Two siblings",
  "Three siblings",
  "Three siblings",
  "Four siblings",
  "Five or more siblings",
];

const WHO_RAISED_YOU: string[] = [
  "Both parents",
  "Grandparent(s)",
  "Step-parent(s)",
  "Adoptive family",
  "Single parent",
  "Aunt or uncle",
  "Older sibling",
  "City orphanage or foundling home",
];

const CHILDHOOD_HOMES: string[] = [
  "On the streets",
  "Rundown shack",
  "No permanent home — always travelling",
  "Comfortable dwelling",
  "Large house",
  "Mansion or castle",
];

const CHILDHOOD_MEMORIES: string[] = [
  "Always running from something, or hiding",
  "Little-known or ignored by others",
  "Fitting in with peers",
  "Popular and well-liked",
  "Exceptionally gifted or talented",
  "The pride of your family",
];

const LIFE_EVENTS: string[] = [
  "Went on an adventure",
  "Suffered a tragedy — a loved one was lost",
  "Received a great boon (treasure, magic item, or powerful friend)",
  "Fell in love",
  "Made a powerful enemy",
  "Had a brush with death",
  "Witnessed something strange and unexplained",
  "Committed a crime — or was accused of one",
  "Spent time living in another culture",
  "Discovered something hidden about yourself or your lineage",
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BackstoryResult {
  birthplace: string;
  siblings: string;
  raisedBy: string;
  childhoodHome: string;
  childhoodMemory: string;
  lifeEvents: string[];
}

interface ThisIsYourLifeGeneratorProps {
  /** Called when the adventurer clicks "Use This Backstory". */
  onUseBackstory: (text: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function roll(sides: number): number {
  return Math.floor(Math.random() * sides);
}

function pickFrom<T>(arr: T[]): T {
  return arr[roll(arr.length)] as T;
}

function rollLifeEvents(count: number): string[] {
  const events: string[] = [];
  for (let i = 0; i < count; i++) {
    events.push(pickFrom(LIFE_EVENTS));
  }
  return events;
}

function buildBackstoryText(result: BackstoryResult): string {
  const eventLines = result.lifeEvents
    .map((e, i) => `  ${i + 1}. ${e}`)
    .join("\n");
  return [
    `Birthplace: ${result.birthplace}`,
    `Siblings: ${result.siblings}`,
    `Raised by: ${result.raisedBy}`,
    `Childhood home: ${result.childhoodHome}`,
    `Childhood memory: ${result.childhoodMemory}`,
    `Life event(s):\n${eventLines}`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const sectionLabelStyle: React.CSSProperties = {
  color: "#b8934a",
  fontSize: "10px",
  textTransform: "uppercase",
  letterSpacing: "0.09em",
  fontFamily: "'Georgia', serif",
  marginBottom: "4px",
};

const sectionValueStyle: React.CSSProperties = {
  color: "#e8d5a3",
  fontSize: "14px",
  fontFamily: "'Georgia', 'Times New Roman', serif",
  lineHeight: "1.5",
};

const rerollButtonStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid rgba(201,168,76,0.35)",
  color: "#a89060",
  borderRadius: "4px",
  padding: "2px 8px",
  fontSize: "11px",
  fontFamily: "'Georgia', serif",
  cursor: "pointer",
  marginLeft: "8px",
  verticalAlign: "middle",
  lineHeight: "1.4",
};

interface ResultRowProps {
  label: string;
  value: string | string[];
  onReroll: () => void;
}

function ResultRow({ label, value, onReroll }: ResultRowProps) {
  const displayValue = Array.isArray(value) ? value : [value];
  return (
    <div
      style={{
        borderBottom: "1px solid rgba(201,168,76,0.12)",
        paddingBottom: "12px",
        marginBottom: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
        <span style={sectionLabelStyle}>{label}</span>
        <button style={rerollButtonStyle} onClick={onReroll} type="button">
          🎲 reroll
        </button>
      </div>
      {displayValue.map((v, i) => (
        <div key={i} style={sectionValueStyle}>
          {displayValue.length > 1 ? `${i + 1}. ` : ""}
          {v}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ThisIsYourLifeGenerator({
  onUseBackstory,
}: ThisIsYourLifeGeneratorProps) {
  const [result, setResult] = useState<BackstoryResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [eventCount, setEventCount] = useState<1 | 2 | 3>(2);

  const rollAll = useCallback(() => {
    setResult({
      birthplace: pickFrom(BIRTHPLACES),
      siblings: pickFrom(SIBLINGS_RESULTS),
      raisedBy: pickFrom(WHO_RAISED_YOU),
      childhoodHome: pickFrom(CHILDHOOD_HOMES),
      childhoodMemory: pickFrom(CHILDHOOD_MEMORIES),
      lifeEvents: rollLifeEvents(eventCount),
    });
    setCopied(false);
  }, [eventCount]);

  const rerollSection = useCallback(
    (section: keyof BackstoryResult) => {
      if (!result) return;
      let updated: BackstoryResult;
      if (section === "lifeEvents") {
        updated = { ...result, lifeEvents: rollLifeEvents(eventCount) };
      } else {
        const tableMap: Record<
          Exclude<keyof BackstoryResult, "lifeEvents">,
          string[]
        > = {
          birthplace: BIRTHPLACES,
          siblings: SIBLINGS_RESULTS,
          raisedBy: WHO_RAISED_YOU,
          childhoodHome: CHILDHOOD_HOMES,
          childhoodMemory: CHILDHOOD_MEMORIES,
        };
        updated = { ...result, [section]: pickFrom(tableMap[section]) };
      }
      setResult(updated);
      setCopied(false);
    },
    [result, eventCount]
  );

  const handleUseBackstory = () => {
    if (!result) return;
    onUseBackstory(buildBackstoryText(result));
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(buildBackstoryText(result));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ marginTop: "36px" }}>
      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
        <h2
          style={{
            color: "#c9a84c",
            fontSize: "18px",
            fontWeight: "bold",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            fontFamily: "'Georgia', serif",
            margin: 0,
          }}
        >
          📜 This Is Your Life
        </h2>
      </div>
      <p
        style={{
          color: "#a89060",
          fontSize: "13px",
          fontFamily: "'Georgia', serif",
          marginBottom: "20px",
          lineHeight: "1.6",
        }}
      >
        Consult the ancient tomes — let fate write your origin. Based on{" "}
        <em>Xanathar&apos;s Guide to Everything</em>.
      </p>

      {/* Event count selector */}
      <div style={{ marginBottom: "20px" }}>
        <span
          style={{
            color: "#b8934a",
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontFamily: "'Georgia', serif",
            marginRight: "12px",
          }}
        >
          Life Events to Roll
        </span>
        {([1, 2, 3] as const).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setEventCount(n)}
            style={{
              background:
                eventCount === n
                  ? "linear-gradient(135deg, #8b6914, #c9a84c)"
                  : "transparent",
              color: eventCount === n ? "#1a1a2e" : "#c9a84c",
              border: "1px solid rgba(201,168,76,0.5)",
              borderRadius: "4px",
              padding: "4px 12px",
              fontFamily: "'Georgia', serif",
              fontSize: "13px",
              fontWeight: eventCount === n ? "bold" : "normal",
              cursor: "pointer",
              marginRight: "6px",
            }}
          >
            {n}
          </button>
        ))}
        <span style={{ color: "#a89060", fontSize: "12px", fontFamily: "'Georgia', serif" }}>
          {eventCount === 1 ? "(young adventurer)" : eventCount === 2 ? "(seasoned adventurer)" : "(veteran adventurer)"}
        </span>
      </div>

      {/* Roll All button */}
      <button
        type="button"
        onClick={rollAll}
        style={{
          background: "linear-gradient(135deg, #8b6914, #c9a84c)",
          color: "#1a1a2e",
          border: "none",
          borderRadius: "6px",
          padding: "12px 28px",
          fontSize: "14px",
          fontFamily: "'Georgia', serif",
          fontWeight: "bold",
          cursor: "pointer",
          letterSpacing: "0.5px",
          marginBottom: "24px",
          display: "inline-block",
        }}
      >
        🎲 Roll the Fates
      </button>

      {/* Results card */}
      {result && (
        <div
          style={{
            background: "rgba(0,0,0,0.6)",
            border: "2px solid #c9a84c",
            borderRadius: "12px",
            boxShadow:
              "0 0 40px rgba(201,168,76,0.3), inset 0 0 60px rgba(0,0,0,0.5)",
            padding: "28px 28px 20px",
          }}
        >
          <ResultRow
            label="Birthplace"
            value={result.birthplace}
            onReroll={() => rerollSection("birthplace")}
          />
          <ResultRow
            label="Siblings"
            value={result.siblings}
            onReroll={() => rerollSection("siblings")}
          />
          <ResultRow
            label="Raised By"
            value={result.raisedBy}
            onReroll={() => rerollSection("raisedBy")}
          />
          <ResultRow
            label="Childhood Home"
            value={result.childhoodHome}
            onReroll={() => rerollSection("childhoodHome")}
          />
          <ResultRow
            label="Childhood Memory"
            value={result.childhoodMemory}
            onReroll={() => rerollSection("childhoodMemory")}
          />
          <ResultRow
            label={`Life Events (${result.lifeEvents.length})`}
            value={result.lifeEvents}
            onReroll={() => rerollSection("lifeEvents")}
          />

          {/* Action buttons */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              justifyContent: "flex-end",
              paddingTop: "8px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={() => void handleCopy()}
              style={{
                background: "transparent",
                border: "1px solid rgba(201,168,76,0.5)",
                color: "#c9a84c",
                borderRadius: "4px",
                padding: "9px 18px",
                fontFamily: "'Georgia', serif",
                fontSize: "13px",
                cursor: "pointer",
                letterSpacing: "0.3px",
              }}
            >
              {copied ? "✓ Copied!" : "Copy Text"}
            </button>
            <button
              type="button"
              onClick={handleUseBackstory}
              style={{
                background: "linear-gradient(135deg, #8b6914, #c9a84c)",
                color: "#1a1a2e",
                border: "none",
                borderRadius: "6px",
                padding: "10px 22px",
                fontSize: "13px",
                fontFamily: "'Georgia', serif",
                fontWeight: "bold",
                cursor: "pointer",
                letterSpacing: "0.5px",
              }}
            >
              ⚔️ Add to Backstory
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
