import { useState } from "react";
import { getFeatByNameAndSource } from "@/lib/featData";

export function FeatCard({
  featName,
  rulesSource,
}: {
  featName: string;
  rulesSource: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const feat = getFeatByNameAndSource(featName, rulesSource);

  if (!feat) {
    return (
      <span
        style={{
          background: "rgba(201,168,76,0.12)",
          border: "1px solid rgba(201,168,76,0.35)",
          borderRadius: "20px",
          padding: "5px 14px",
          color: "#c9a84c",
          fontSize: "12px",
          fontFamily: "'EB Garamond', 'Georgia', serif",
          fontWeight: "bold",
          display: "inline-block",
        }}
      >
        {featName}
      </span>
    );
  }

  const description = feat.entries.join(" ");
  const snippet =
    description.length > 120
      ? description.slice(0, 120).replace(/\s\S*$/, "") + "..."
      : description;

  const abilityBonusLabel = (() => {
    if (!feat.abilityBonus) return null;
    const parts: string[] = [];
    if (feat.abilityBonus.fixed) {
      for (const [ab, val] of Object.entries(feat.abilityBonus.fixed)) {
        const name = ab.charAt(0).toUpperCase() + ab.slice(1);
        parts.push(`+${val} ${name}`);
      }
    }
    if (feat.abilityBonus.choose) {
      const c = feat.abilityBonus.choose;
      parts.push(
        `+${c.amount} to ${c.count} from ${c.from.map((a) => a.charAt(0).toUpperCase() + a.slice(1)).join("/")}`,
      );
    }
    return parts.length > 0 ? parts.join(", ") : null;
  })();

  return (
    <div
      onClick={() => setExpanded((v) => !v)}
      style={{
        background: "rgba(201,168,76,0.06)",
        border: "1px solid rgba(201,168,76,0.25)",
        borderRadius: "8px",
        padding: "12px 16px",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: expanded ? "8px" : "0",
        }}
      >
        <span
          style={{
            color: "#c9a84c",
            fontSize: "13px",
            fontFamily: "'EB Garamond', 'Georgia', serif",
            fontWeight: "bold",
          }}
        >
          {feat.name}
        </span>
        <span
          style={{
            background: "rgba(100,149,237,0.2)",
            border: "1px solid rgba(100,149,237,0.4)",
            borderRadius: "4px",
            padding: "1px 6px",
            color: "#6495ed",
            fontSize: "10px",
          }}
        >
          {feat.source}
        </span>
        {abilityBonusLabel && (
          <span
            style={{
              background: "rgba(201,168,76,0.15)",
              border: "1px solid rgba(201,168,76,0.3)",
              borderRadius: "4px",
              padding: "1px 8px",
              color: "#c9a84c",
              fontSize: "10px",
              fontFamily: "'EB Garamond', 'Georgia', serif",
            }}
          >
            {abilityBonusLabel}
          </span>
        )}
        <span
          style={{ color: "#a89060", fontSize: "10px", marginLeft: "auto" }}
        >
          {expanded ? "\u25BC" : "\u25BA"}
        </span>
      </div>
      {!expanded && (
        <p
          style={{
            color: "#a89060",
            fontSize: "12px",
            fontFamily: "'EB Garamond', 'Georgia', serif",
            margin: "4px 0 0 0",
            lineHeight: "1.4",
            fontStyle: "italic",
          }}
        >
          {snippet}
        </p>
      )}
      {expanded && (
        <div style={{ marginTop: "4px" }}>
          {feat.entries.map((entry, i) => (
            <p
              key={i}
              style={{
                color: "#e8d5a3",
                fontSize: "13px",
                fontFamily: "'EB Garamond', 'Georgia', serif",
                lineHeight: "1.6",
                margin: "0 0 6px 0",
              }}
            >
              {entry}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
