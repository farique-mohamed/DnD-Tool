import Head from "next/head";
import { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { useIsMobile } from "@/hooks/useIsMobile";
import { LIFE_CLASSES, type LifeClass } from "@/lib/lifeData";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GOLD = "#c9a84c";
const GOLD_MUTED = "#a89060";
const GOLD_BRIGHT = "#e8d5a3";
const GOLD_DIM = "rgba(201,168,76,0.15)";
const GOLD_BORDER = "rgba(201,168,76,0.25)";
const TEXT_DIM = "rgba(232,213,163,0.6)";
const SERIF = "'Georgia', 'Times New Roman', serif";

// ---------------------------------------------------------------------------
// Source badge color helper
// ---------------------------------------------------------------------------

const SOURCE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  PHB: { bg: "rgba(74,144,217,0.1)", border: "rgba(74,144,217,0.35)", text: "#7ab4e0" },
  XPHB: { bg: "rgba(46,204,113,0.1)", border: "rgba(46,204,113,0.35)", text: "#6dd5a0" },
  XGE: { bg: "rgba(155,89,182,0.1)", border: "rgba(155,89,182,0.35)", text: "#bb8fd9" },
};

function sourceColor(source: string) {
  return SOURCE_COLORS[source] ?? { bg: GOLD_DIM, border: GOLD_BORDER, text: GOLD_MUTED };
}

// ---------------------------------------------------------------------------
// Roll Random button
// ---------------------------------------------------------------------------

function RollButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "none",
        border: `1px solid ${GOLD_BORDER}`,
        borderRadius: "4px",
        padding: "3px 10px",
        color: GOLD_MUTED,
        fontSize: "11px",
        fontFamily: SERIF,
        cursor: "pointer",
        letterSpacing: "0.3px",
        transition: "background 0.15s, color 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = GOLD_DIM;
        (e.currentTarget as HTMLButtonElement).style.color = GOLD;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "none";
        (e.currentTarget as HTMLButtonElement).style.color = GOLD_MUTED;
      }}
    >
      🎲 Roll Random
    </button>
  );
}

// ---------------------------------------------------------------------------
// Numbered list with highlight
// ---------------------------------------------------------------------------

function NumberedList({
  items,
  highlightIndex,
}: {
  items: string[];
  highlightIndex: number | null;
}) {
  return (
    <ol
      style={{
        margin: 0,
        paddingLeft: "22px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
      }}
    >
      {items.map((item, i) => (
        <li
          key={i}
          style={{
            color: highlightIndex === i ? GOLD : TEXT_DIM,
            fontSize: "13px",
            fontFamily: SERIF,
            lineHeight: "1.7",
            padding: "4px 8px",
            borderRadius: "4px",
            background:
              highlightIndex === i
                ? "rgba(201,168,76,0.12)"
                : "transparent",
            boxShadow:
              highlightIndex === i
                ? "0 0 12px rgba(201,168,76,0.2)"
                : "none",
            transition: "background 0.25s, color 0.25s, box-shadow 0.25s",
          }}
        >
          {item}
        </li>
      ))}
    </ol>
  );
}

// ---------------------------------------------------------------------------
// Class list row
// ---------------------------------------------------------------------------

function ClassRow({
  lifeClass,
  isActive,
  onClick,
}: {
  lifeClass: LifeClass;
  isActive: boolean;
  onClick: () => void;
}) {
  const sc = sourceColor(lifeClass.source);

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
        alignItems: "center",
        gap: "8px",
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
      <span
        style={{
          color: isActive ? GOLD : GOLD_BRIGHT,
          fontSize: "13px",
          fontFamily: SERIF,
          fontWeight: isActive ? "bold" : "normal",
          flex: 1,
          minWidth: 0,
        }}
      >
        {lifeClass.name}
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
        {lifeClass.source}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Detail panel
// ---------------------------------------------------------------------------

function LifeDetailPanel({
  lifeClass,
  isMobile,
  onBack,
}: {
  lifeClass: LifeClass;
  isMobile?: boolean;
  onBack?: () => void;
}) {
  const [rolls, setRolls] = useState<Record<string, number>>({});

  const rollRandom = (key: string, count: number) => {
    const idx = Math.floor(Math.random() * count);
    setRolls((prev) => ({ ...prev, [key]: idx }));
  };

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
          {lifeClass.name}
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
          {lifeClass.source} &middot; {lifeClass.reasons.length} reason
          {lifeClass.reasons.length !== 1 ? "s" : ""} &middot;{" "}
          {lifeClass.categories.length} categor
          {lifeClass.categories.length !== 1 ? "ies" : "y"}
        </p>
      </div>

      {/* Gradient divider */}
      <div
        style={{
          height: "1px",
          background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
          opacity: 0.5,
        }}
      />

      {/* Reasons section */}
      {lifeClass.reasons.length > 0 && (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                color: GOLD,
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "1.2px",
                fontFamily: SERIF,
              }}
            >
              Why did you become a {lifeClass.name}?
            </div>
            <RollButton
              onClick={() => rollRandom("reasons", lifeClass.reasons.length)}
            />
          </div>
          <NumberedList
            items={lifeClass.reasons}
            highlightIndex={rolls["reasons"] ?? null}
          />
        </div>
      )}

      {/* Category sections */}
      {lifeClass.categories.map((cat) => {
        const key = `cat_${cat.name}`;
        return (
          <div key={cat.name}>
            {/* Gradient divider */}
            <div
              style={{
                height: "1px",
                background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
                opacity: 0.3,
                marginBottom: "16px",
              }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  color: GOLD,
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "1.2px",
                  fontFamily: SERIF,
                }}
              >
                {cat.name}
              </div>
              <RollButton
                onClick={() => rollRandom(key, cat.options.length)}
              />
            </div>
            <NumberedList
              items={cat.options}
              highlightIndex={rolls[key] ?? null}
            />
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty detail placeholder
// ---------------------------------------------------------------------------

function LifeDetailEmpty({ isMobile }: { isMobile?: boolean }) {
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
        Select a class to explore backstory options.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page content
// ---------------------------------------------------------------------------

function LifeContent() {
  const isMobile = useIsMobile();
  const [selectedClass, setSelectedClass] = useState<LifeClass | null>(null);

  return (
    <>
      <Head>
        <title>Life Events &amp; Backstory — DnD Tool</title>
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
            Life Events &amp; Backstory
          </h1>
          <p
            style={{
              color: GOLD_MUTED,
              fontSize: "14px",
              marginBottom: "12px",
              fontFamily: SERIF,
            }}
          >
            Roll for inspiration — discover your character&apos;s past.
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
          {/* Left column: class list */}
          <div
            style={{
              flex: 3,
              minWidth: 0,
              display: isMobile && selectedClass ? "none" : "flex",
              flexDirection: "column",
              gap: "10px",
              height: isMobile ? "auto" : "100%",
              overflow: isMobile ? "visible" : "hidden",
            }}
          >
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
              {LIFE_CLASSES.length} class{LIFE_CLASSES.length !== 1 ? "es" : ""}
            </div>

            {/* Scrollable class list */}
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
              {LIFE_CLASSES.map((lc) => (
                <ClassRow
                  key={lc.name}
                  lifeClass={lc}
                  isActive={selectedClass?.name === lc.name}
                  onClick={() => setSelectedClass(lc)}
                />
              ))}
            </div>
          </div>

          {/* Right column: detail */}
          {selectedClass ? (
            <LifeDetailPanel
              key={selectedClass.name}
              lifeClass={selectedClass}
              isMobile={isMobile}
              onBack={() => setSelectedClass(null)}
            />
          ) : (
            <LifeDetailEmpty isMobile={isMobile} />
          )}
        </div>
      </div>
    </>
  );
}

export default function LifePage() {
  return (
    <ProtectedRoute>
      <Layout>
        <LifeContent />
      </Layout>
    </ProtectedRoute>
  );
}
