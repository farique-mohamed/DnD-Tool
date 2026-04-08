import Head from "next/head";
import { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  getClassesBySource,
  type ClassInfo,
  type SubclassInfo,
  type FeatureEntry,
  type FeatureDescription,
} from "@/lib/classData";

type ActiveTab = "overview" | "progression";

function proficiencyBonus(level: number): number {
  if (level <= 4) return 2;
  if (level <= 8) return 3;
  if (level <= 12) return 4;
  if (level <= 16) return 5;
  return 6;
}

const LABEL_STYLE: React.CSSProperties = {
  color: "#c9a84c",
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "1.2px",
  fontFamily: "'EB Garamond', 'Georgia', serif",
  margin: 0,
  marginBottom: "8px",
};

const BODY_STYLE: React.CSSProperties = {
  color: "#e8d5a3",
  fontSize: "13px",
  fontFamily: "'EB Garamond', 'Georgia', serif",
  margin: 0,
  lineHeight: "1.5",
};

const DIVIDER_STYLE: React.CSSProperties = {
  height: "1px",
  background: "linear-gradient(90deg, transparent, #c9a84c, transparent)",
  opacity: 0.4,
};

/* ---------- Class list sidebar ---------- */

function ClassListPanel({
  classes,
  selected,
  onSelect,
  isMobile,
}: {
  classes: ClassInfo[];
  selected: ClassInfo;
  onSelect: (c: ClassInfo) => void;
  isMobile: boolean;
}) {
  return (
    <div
      style={isMobile ? {
        width: "100%",
        display: "flex",
        flexDirection: "row",
        gap: "6px",
        overflowX: "auto",
        paddingBottom: "8px",
        WebkitOverflowScrolling: "touch",
      } : {
        width: "200px",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}
    >
      {classes.map((cls) => {
        const isActive = cls.name === selected.name;
        return (
          <button
            key={cls.name}
            onClick={() => onSelect(cls)}
            style={{
              textAlign: "left",
              padding: isMobile ? "8px 14px" : "10px 14px",
              ...(isMobile ? { flexShrink: 0, whiteSpace: "nowrap" as const } : {}),
              background: isActive
                ? "rgba(201,168,76,0.15)"
                : "rgba(0,0,0,0.3)",
              border: isActive
                ? "1px solid rgba(201,168,76,0.5)"
                : "1px solid rgba(201,168,76,0.15)",
              borderLeft: isActive
                ? "3px solid #c9a84c"
                : "3px solid transparent",
              borderRadius: "6px",
              color: isActive ? "#c9a84c" : "#e8d5a3",
              fontSize: "13px",
              fontFamily: "'EB Garamond', 'Georgia', serif",
              cursor: "pointer",
              letterSpacing: "0.3px",
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(201,168,76,0.08)";
                (e.currentTarget as HTMLButtonElement).style.color = "#c9a84c";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(0,0,0,0.3)";
                (e.currentTarget as HTMLButtonElement).style.color = "#e8d5a3";
              }
            }}
          >
            {cls.name}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Tab button ---------- */

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active
          ? "linear-gradient(135deg, #8b6914, #c9a84c)"
          : "transparent",
        border: active ? "none" : "1px solid rgba(201,168,76,0.5)",
        color: active ? "#1a1a2e" : "#c9a84c",
        fontWeight: active ? "bold" : "normal",
        borderRadius: "4px",
        padding: "6px 16px",
        fontSize: "13px",
        fontFamily: "'EB Garamond', 'Georgia', serif",
        cursor: "pointer",
        letterSpacing: "0.5px",
        transition: "background 0.15s, color 0.15s",
      }}
    >
      {label}
    </button>
  );
}

/* ---------- Overview tab ---------- */

function OverviewTab({ cls, isMobile }: { cls: ClassInfo; isMobile: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Mechanical details grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: "20px",
        }}
      >
        {cls.savingThrows.length > 0 && (
          <div>
            <p style={LABEL_STYLE}>Saving Throws</p>
            <p style={BODY_STYLE}>{cls.savingThrows.join(", ")}</p>
          </div>
        )}

        {cls.skillChoices.count > 0 && (
          <div>
            <p style={LABEL_STYLE}>Skills</p>
            <p style={BODY_STYLE}>Choose {cls.skillChoices.count}</p>
          </div>
        )}

        {cls.armorProficiencies.length > 0 && (
          <div>
            <p style={LABEL_STYLE}>Armor Proficiencies</p>
            <p style={BODY_STYLE}>{cls.armorProficiencies.join(", ")}</p>
          </div>
        )}

        {cls.weaponProficiencies.length > 0 && (
          <div>
            <p style={LABEL_STYLE}>Weapon Proficiencies</p>
            <p style={BODY_STYLE}>{cls.weaponProficiencies.join(", ")}</p>
          </div>
        )}
      </div>

      {/* Skill list */}
      {cls.skillChoices.count > 0 &&
        cls.skillChoices.from.length > 0 &&
        cls.skillChoices.from[0] !== "Any skill" && (
          <div>
            <p style={LABEL_STYLE}>
              Choose {cls.skillChoices.count} skill
              {cls.skillChoices.count > 1 ? "s" : ""} from
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {cls.skillChoices.from.map((skill) => (
                <span
                  key={skill}
                  style={{
                    background: "rgba(201,168,76,0.08)",
                    border: "1px solid rgba(201,168,76,0.2)",
                    borderRadius: "4px",
                    padding: "3px 10px",
                    color: "#a89060",
                    fontSize: "12px",
                    fontFamily: "'EB Garamond', 'Georgia', serif",
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

      {/* Divider */}
      <div style={{ ...DIVIDER_STYLE, opacity: 0.3 }} />

      {/* Description */}
      {cls.description && (
        <div>
          <p style={{ ...LABEL_STYLE, marginBottom: "12px" }}>
            About the {cls.name}
          </p>
          <p
            style={{
              color: "#d4b896",
              fontSize: "14px",
              fontFamily: "'EB Garamond', 'Georgia', serif",
              lineHeight: "1.75",
              margin: 0,
              fontStyle: "italic",
            }}
          >
            {cls.description}
          </p>
        </div>
      )}
    </div>
  );
}

/* ---------- Feature description renderer ---------- */

function renderFeatureEntry(
  entry: FeatureEntry,
  isSubclass: boolean,
  key: string,
): React.ReactNode {
  const textColor = isSubclass ? "#a89060" : "#e8d5a3";

  switch (entry.type) {
    case "text":
      return (
        <p
          key={key}
          style={{
            color: textColor,
            fontSize: "13px",
            fontFamily: "'EB Garamond', 'Georgia', serif",
            lineHeight: "1.6",
            margin: "0 0 6px 0",
          }}
        >
          {entry.text}
        </p>
      );

    case "list":
      return (
        <ul
          key={key}
          style={{
            margin: "0 0 6px 0",
            paddingLeft: "20px",
            color: textColor,
            fontSize: "13px",
            fontFamily: "'EB Garamond', 'Georgia', serif",
            lineHeight: "1.6",
          }}
        >
          {(entry.items ?? []).map((item, idx) => (
            <li key={idx} style={{ marginBottom: "2px" }}>
              {item}
            </li>
          ))}
        </ul>
      );

    case "section":
      return (
        <div key={key} style={{ marginBottom: "6px" }}>
          {entry.name && (
            <p
              style={{
                color: isSubclass ? "#c9a84c" : "#c9a84c",
                fontSize: "12px",
                fontFamily: "'EB Garamond', 'Georgia', serif",
                fontWeight: "bold",
                letterSpacing: "0.4px",
                margin: "0 0 4px 0",
                textTransform: "uppercase",
              }}
            >
              {entry.name}
            </p>
          )}
          {(entry.children ?? []).map((child, idx) =>
            renderFeatureEntry(child, isSubclass, `${key}-child-${idx}`),
          )}
        </div>
      );

    case "table":
      return (
        <div key={key} style={{ marginBottom: "10px" }}>
          {entry.caption && (
            <p style={{ color: "#c9a84c", fontSize: "12px", fontWeight: "bold", fontFamily: "'EB Garamond', 'Georgia', serif", marginBottom: "6px", letterSpacing: "0.5px" }}>
              {entry.caption}
            </p>
          )}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", fontFamily: "'EB Garamond', 'Georgia', serif" }}>
            {entry.colLabels && entry.colLabels.length > 0 && (
              <thead>
                <tr>
                  {entry.colLabels.map((label, i) => (
                    <th key={i} style={{ color: "#c9a84c", padding: "6px 10px", borderBottom: "1px solid rgba(201,168,76,0.3)", textAlign: "left", fontWeight: "bold", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {(entry.rows ?? []).map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{ color: textColor, padding: "5px 10px", borderBottom: "1px solid rgba(201,168,76,0.1)" }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "inset":
      return (
        <div
          key={key}
          style={{
            margin: "4px 0 8px 0",
            padding: "8px 12px",
            borderLeft: `2px solid ${isSubclass ? "rgba(168,144,96,0.5)" : "rgba(232,213,163,0.3)"}`,
            background: "rgba(0,0,0,0.2)",
            borderRadius: "0 4px 4px 0",
          }}
        >
          {entry.name && (
            <p
              style={{
                color: "#c9a84c",
                fontSize: "11px",
                fontFamily: "'EB Garamond', 'Georgia', serif",
                fontWeight: "bold",
                letterSpacing: "0.6px",
                textTransform: "uppercase",
                margin: "0 0 4px 0",
              }}
            >
              {entry.name}
            </p>
          )}
          {(entry.children ?? []).map((child, idx) =>
            renderFeatureEntry(child, isSubclass, `${key}-inset-${idx}`),
          )}
        </div>
      );

    default:
      return null;
  }
}

/* ---------- Expandable feature block inside a level row ---------- */

function FeatureBlock({
  desc,
}: {
  desc: FeatureDescription;
}) {
  const [expanded, setExpanded] = useState(false);
  const isSubclass = desc.isSubclassFeature;

  // Find the first "text" entry to use as a snippet
  const firstText = desc.entries.find((e) => e.type === "text");
  const hasMore = desc.entries.length > 1 || (firstText && (firstText.text?.length ?? 0) > 200);

  // Truncate the snippet to ~160 chars
  const snippet = firstText?.text
    ? firstText.text.length > 160
      ? firstText.text.slice(0, 160).replace(/\s\S*$/, "") + "…"
      : firstText.text
    : null;

  const nameColor = isSubclass ? "#a89060" : "#e8d5a3";
  const snippetColor = isSubclass ? "rgba(168,144,96,0.75)" : "rgba(232,213,163,0.65)";

  return (
    <div
      style={{
        marginBottom: "8px",
        borderLeft: `2px solid ${isSubclass ? "rgba(168,144,96,0.35)" : "rgba(232,213,163,0.25)"}`,
        paddingLeft: "10px",
      }}
    >
      {/* Feature name + toggle */}
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          fontFamily: "'EB Garamond', 'Georgia', serif",
          fontSize: "13px",
          fontWeight: "bold",
          color: nameColor,
          letterSpacing: "0.3px",
          textAlign: "left",
        }}
      >
        <span
          style={{
            fontSize: "10px",
            color: "#c9a84c",
            opacity: 0.7,
            lineHeight: 1,
            userSelect: "none",
            transition: "transform 0.15s",
            display: "inline-block",
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
          }}
        >
          &#9654;
        </span>
        {desc.name}
        {desc.subclassName && (
          <span
            style={{
              fontSize: "11px",
              color: "#a89060",
              fontWeight: "normal",
              fontStyle: "italic",
            }}
          >
            ({desc.subclassName})
          </span>
        )}
      </button>

      {/* Snippet (always visible when collapsed) */}
      {!expanded && snippet && (
        <p
          style={{
            color: snippetColor,
            fontSize: "12px",
            fontFamily: "'EB Garamond', 'Georgia', serif",
            lineHeight: "1.5",
            margin: "3px 0 0 0",
            fontStyle: "italic",
          }}
        >
          {snippet}
        </p>
      )}

      {/* Full content (when expanded) */}
      {expanded && (
        <div style={{ marginTop: "6px" }}>
          {desc.entries.map((entry, idx) =>
            renderFeatureEntry(entry, isSubclass, `${desc.name}-${desc.level}-${idx}`),
          )}
          {hasMore && (
            <button
              onClick={() => setExpanded(false)}
              style={{
                background: "none",
                border: "none",
                padding: "2px 0",
                cursor: "pointer",
                color: "#c9a84c",
                fontSize: "11px",
                fontFamily: "'EB Garamond', 'Georgia', serif",
                letterSpacing: "0.3px",
                opacity: 0.8,
              }}
            >
              Show less
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Progression tab (formerly Level Table + Subclasses) ---------- */

function ProgressionTab({
  cls,
  selectedSubclass,
  onSelectSubclass,
}: {
  cls: ClassInfo;
  selectedSubclass: SubclassInfo | null;
  onSelectSubclass: (sc: SubclassInfo | null) => void;
}) {
  // Build level -> feature names maps
  const baseByLevel = new Map<number, string[]>();
  for (const f of cls.levelFeatures) {
    if (f.level < 1 || f.level > 20) continue;
    const arr = baseByLevel.get(f.level) ?? [];
    arr.push(f.featureName);
    baseByLevel.set(f.level, arr);
  }

  const subByLevel = new Map<number, string[]>();
  if (selectedSubclass) {
    for (const f of selectedSubclass.features) {
      if (f.level < 1 || f.level > 20) continue;
      const arr = subByLevel.get(f.level) ?? [];
      arr.push(f.featureName);
      subByLevel.set(f.level, arr);
    }
  }

  // Build lookup: (name, level, subclassName?) -> FeatureDescription
  const descMap = new Map<string, FeatureDescription>();
  for (const desc of cls.featureDescriptions) {
    const key = `${desc.name}|${desc.level}|${desc.subclassName ?? ""}`;
    if (!descMap.has(key)) {
      descMap.set(key, desc);
    }
  }

  function getDesc(name: string, level: number, subclassName?: string): FeatureDescription | undefined {
    return descMap.get(`${name}|${level}|${subclassName ?? ""}`);
  }

  const thStyle: React.CSSProperties = {
    color: "#c9a84c",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "1.2px",
    fontFamily: "'EB Garamond', 'Georgia', serif",
    fontWeight: "bold",
    padding: "8px 12px",
    borderBottom: "1px solid rgba(201,168,76,0.4)",
    textAlign: "left",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Subclass selector */}
      {cls.subclasses.length > 0 && (
        <div>
          <p style={{ ...LABEL_STYLE, marginBottom: "10px" }}>
            Choose {cls.subclassTitle}:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {cls.subclasses.map((sc) => {
              const isActive = selectedSubclass?.name === sc.name;
              return (
                <button
                  key={sc.name}
                  onClick={() => onSelectSubclass(isActive ? null : sc)}
                  style={{
                    background: isActive
                      ? "linear-gradient(135deg, #8b6914, #c9a84c)"
                      : "transparent",
                    border: isActive
                      ? "none"
                      : "1px solid rgba(201,168,76,0.4)",
                    borderRadius: "4px",
                    padding: "5px 12px",
                    color: isActive ? "#1a1a2e" : "#c9a84c",
                    fontWeight: isActive ? "bold" : "normal",
                    fontSize: "12px",
                    fontFamily: "'EB Garamond', 'Georgia', serif",
                    cursor: "pointer",
                    transition: "background 0.15s, color 0.15s",
                  }}
                >
                  {sc.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Level table */}
      <div
        style={{
          overflowX: "auto",
          borderRadius: "8px",
          border: "1px solid rgba(201,168,76,0.25)",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: "'EB Garamond', 'Georgia', serif",
          }}
        >
          <thead>
            <tr>
              <th style={{ ...thStyle, width: "56px" }}>Level</th>
              <th style={{ ...thStyle, width: "44px" }}>PB</th>
              <th style={thStyle}>Features</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 20 }, (_, i) => i + 1).map((level) => {
              const baseFeatures = baseByLevel.get(level) ?? [];
              const subFeatures = subByLevel.get(level) ?? [];
              const hasAny = baseFeatures.length > 0 || subFeatures.length > 0;

              // Gather descriptions to render for this level
              const baseDescs = baseFeatures
                .map((name) => getDesc(name, level))
                .filter((d): d is FeatureDescription => d !== undefined);

              // All descriptions for the selected subclass at this level — includes sub-features
              // (e.g. Bear/Eagle) that aren't in subclassFeatures but exist as subclassFeature entries
              const allSubDescs: FeatureDescription[] = selectedSubclass
                ? cls.featureDescriptions.filter(
                    (d) =>
                      d.isSubclassFeature &&
                      d.subclassName === selectedSubclass.shortName &&
                      d.level === level,
                  )
                : [];

              const allDescs = [...baseDescs, ...allSubDescs];

              // Names without descriptions (just show plain text)
              const baseDescNames = new Set(baseDescs.map((d) => d.name));
              const subDescNames = new Set(allSubDescs.map((d) => d.name));

              const baseNamesOnly = baseFeatures.filter((n) => !baseDescNames.has(n));
              const subNamesOnly = subFeatures.filter((n) => !subDescNames.has(n));

              return (
                <tr
                  key={level}
                  style={{
                    background: hasAny
                      ? "rgba(201,168,76,0.05)"
                      : "transparent",
                    borderBottom: "1px solid rgba(201,168,76,0.1)",
                  }}
                >
                  <td
                    style={{
                      padding: "10px 12px",
                      color: "#c9a84c",
                      fontSize: "13px",
                      fontWeight: "bold",
                      whiteSpace: "nowrap",
                      verticalAlign: "top",
                    }}
                  >
                    {level}
                  </td>
                  <td
                    style={{
                      padding: "10px 12px",
                      color: "#a89060",
                      fontSize: "13px",
                      whiteSpace: "nowrap",
                      verticalAlign: "top",
                    }}
                  >
                    +{proficiencyBonus(level)}
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: "13px", verticalAlign: "top" }}>
                    {!hasAny && (
                      <span style={{ color: "rgba(168,144,96,0.4)" }}>—</span>
                    )}

                    {/* Feature blocks (expandable) */}
                    {allDescs.map((desc) => (
                      <FeatureBlock key={`${desc.name}-${desc.level}-${desc.subclassName ?? ""}`} desc={desc} />
                    ))}

                    {/* Plain names without descriptions */}
                    {baseNamesOnly.map((name) => (
                      <div key={`plain-base-${name}`} style={{ marginBottom: "4px" }}>
                        <span style={{ color: "#e8d5a3", fontSize: "13px", fontFamily: "'EB Garamond', 'Georgia', serif" }}>
                          {name}
                        </span>
                      </div>
                    ))}
                    {subNamesOnly.map((name) => (
                      <div key={`plain-sub-${name}`} style={{ marginBottom: "4px" }}>
                        <span style={{ color: "#a89060", fontSize: "13px", fontFamily: "'EB Garamond', 'Georgia', serif" }}>
                          {name}
                        </span>
                      </div>
                    ))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Detail panel (tabs) ---------- */

function ClassDetailPanel({ cls, isMobile }: { cls: ClassInfo; isMobile: boolean }) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [selectedSubclass, setSelectedSubclass] = useState<SubclassInfo | null>(null);

  return (
    <div
      style={{
        flex: 1,
        background: "rgba(0,0,0,0.6)",
        border: "2px solid #c9a84c",
        borderRadius: "12px",
        boxShadow:
          "0 0 40px rgba(201,168,76,0.3), inset 0 0 60px rgba(0,0,0,0.5)",
        padding: isMobile ? "20px 16px" : "36px 40px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        minWidth: 0,
      }}
    >
      {/* Header */}
      <div>
        <h2
          style={{
            color: "#c9a84c",
            fontSize: "28px",
            fontWeight: "bold",
            letterSpacing: "2px",
            textTransform: "uppercase",
            fontFamily: "'EB Garamond', 'Georgia', serif",
            margin: 0,
            marginBottom: "12px",
          }}
        >
          {cls.name}
        </h2>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <span
            style={{
              background:
                "linear-gradient(135deg, rgba(139,105,20,0.4), rgba(201,168,76,0.2))",
              border: "1px solid rgba(201,168,76,0.5)",
              borderRadius: "6px",
              padding: "4px 14px",
              color: "#c9a84c",
              fontSize: "14px",
              fontFamily: "'EB Garamond', 'Georgia', serif",
              fontWeight: "bold",
              letterSpacing: "0.5px",
            }}
          >
            {cls.hitDie}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div style={DIVIDER_STYLE} />

      {/* Tab bar */}
      <div style={{ display: "flex", gap: "8px" }}>
        <TabButton
          label="Overview"
          active={activeTab === "overview"}
          onClick={() => setActiveTab("overview")}
        />
        <TabButton
          label="Progression"
          active={activeTab === "progression"}
          onClick={() => setActiveTab("progression")}
        />
      </div>

      {/* Tab content */}
      {activeTab === "overview" && <OverviewTab cls={cls} isMobile={isMobile} />}
      {activeTab === "progression" && (
        <ProgressionTab
          cls={cls}
          selectedSubclass={selectedSubclass}
          onSelectSubclass={setSelectedSubclass}
        />
      )}
    </div>
  );
}

/* ---------- Page ---------- */

function ClassCompendiumContent() {
  const isMobile = useIsMobile();
  const [selectedSource, setSelectedSource] = useState<"PHB" | "XPHB">("PHB");
  const filteredClasses = getClassesBySource(selectedSource);
  const [selected, setSelected] = useState<ClassInfo>(filteredClasses[0]!);

  const handleSelect = (cls: ClassInfo) => {
    setSelected(cls);
  };

  const handleSourceChange = (source: "PHB" | "XPHB") => {
    if (source === selectedSource) return;
    setSelectedSource(source);
    const newClasses = getClassesBySource(source);
    setSelected(newClasses[0]!);
  };

  return (
    <>
      <Head>
        <title>Class Compendium — DnD Tool</title>
      </Head>
      <div style={{ maxWidth: "960px" }}>
        <h1
          style={{
            color: "#c9a84c",
            fontSize: "26px",
            fontWeight: "bold",
            letterSpacing: "2px",
            textTransform: "uppercase",
            marginBottom: "8px",
            fontFamily: "'EB Garamond', 'Georgia', serif",
          }}
        >
          Class Compendium
        </h1>
        <p
          style={{
            color: "#a89060",
            fontSize: "14px",
            marginBottom: "20px",
            fontFamily: "'EB Garamond', 'Georgia', serif",
          }}
        >
          Every path begins with a choice of calling.
        </p>
        <div style={{ display: "flex", gap: "0", marginBottom: "20px" }}>
          {([
            { label: "Player's Handbook (2014)", value: "PHB" as const },
            { label: "Player's Handbook (2024)", value: "XPHB" as const },
          ]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSourceChange(opt.value)}
              style={{
                background: selectedSource === opt.value
                  ? "linear-gradient(135deg, #8b6914, #c9a84c)"
                  : "rgba(0,0,0,0.4)",
                border: selectedSource === opt.value
                  ? "1px solid #c9a84c"
                  : "1px solid rgba(201,168,76,0.3)",
                color: selectedSource === opt.value ? "#1a1a2e" : "#a89060",
                fontWeight: selectedSource === opt.value ? "bold" : "normal",
                padding: isMobile ? "6px 10px" : "8px 18px",
                fontSize: isMobile ? "11px" : "12px",
                fontFamily: "'EB Garamond', 'Georgia', serif",
                cursor: "pointer",
                letterSpacing: "0.3px",
                borderRadius: opt.value === "PHB" ? "6px 0 0 6px" : "0 6px 6px 0",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div
          style={{
            width: "80px",
            height: "2px",
            background: "#c9a84c",
            marginBottom: "32px",
            opacity: 0.6,
          }}
        />

        <div style={{ display: "flex", gap: isMobile ? "16px" : "24px", alignItems: "flex-start", flexDirection: isMobile ? "column" : "row" }}>
          <ClassListPanel classes={filteredClasses} selected={selected} onSelect={handleSelect} isMobile={isMobile} />
          <ClassDetailPanel key={`${selected.name}-${selected.source}`} cls={selected} isMobile={isMobile} />
        </div>
      </div>
    </>
  );
}

export default function ClassesPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <ClassCompendiumContent />
      </Layout>
    </ProtectedRoute>
  );
}
