import type { FeatureEntry } from "@/lib/classData";

export function RenderFeatureEntry({
  entry,
  depth = 0,
}: {
  entry: FeatureEntry;
  depth?: number;
}) {
  if (entry.type === "text") {
    return (
      <p
        style={{
          color: "#e8d5a3",
          fontSize: "13px",
          fontFamily: "'Georgia', serif",
          lineHeight: 1.7,
          marginBottom: "6px",
        }}
      >
        {entry.text}
      </p>
    );
  }

  if (entry.type === "list") {
    return (
      <ul
        style={{
          color: "#e8d5a3",
          fontSize: "13px",
          fontFamily: "'Georgia', serif",
          lineHeight: 1.7,
          paddingLeft: "20px",
          marginBottom: "6px",
        }}
      >
        {(entry.items ?? []).map((item, i) => (
          <li key={i} style={{ marginBottom: "3px" }}>
            {item}
          </li>
        ))}
      </ul>
    );
  }

  if (entry.type === "section") {
    return (
      <div style={{ marginBottom: "8px" }}>
        {entry.name && (
          <p
            style={{
              color: "#c9a84c",
              fontSize: "12px",
              fontWeight: "bold",
              fontFamily: "'Georgia', serif",
              marginBottom: "4px",
              letterSpacing: "0.5px",
            }}
          >
            {entry.name}
          </p>
        )}
        {(entry.children ?? []).map((child, i) => (
          <RenderFeatureEntry key={i} entry={child} depth={depth + 1} />
        ))}
      </div>
    );
  }

  if (entry.type === "table") {
    return (
      <div style={{ marginBottom: "10px" }}>
        {entry.caption && (
          <p
            style={{
              color: "#c9a84c",
              fontSize: "12px",
              fontWeight: "bold",
              fontFamily: "'Georgia', serif",
              marginBottom: "6px",
              letterSpacing: "0.5px",
            }}
          >
            {entry.caption}
          </p>
        )}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "12px",
            fontFamily: "'Georgia', serif",
          }}
        >
          {entry.colLabels && entry.colLabels.length > 0 && (
            <thead>
              <tr>
                {entry.colLabels.map((label, i) => (
                  <th
                    key={i}
                    style={{
                      color: "#c9a84c",
                      padding: "6px 10px",
                      borderBottom: "1px solid rgba(201,168,76,0.3)",
                      textAlign: "left",
                      fontWeight: "bold",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
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
                  <td
                    key={ci}
                    style={{
                      color: "#e8d5a3",
                      padding: "5px 10px",
                      borderBottom: "1px solid rgba(201,168,76,0.1)",
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (entry.type === "inset") {
    return (
      <div
        style={{
          background: "rgba(201,168,76,0.05)",
          border: "1px solid rgba(201,168,76,0.2)",
          borderRadius: "6px",
          padding: "12px 16px",
          marginBottom: "8px",
        }}
      >
        {entry.name && (
          <p
            style={{
              color: "#c9a84c",
              fontSize: "11px",
              fontWeight: "bold",
              fontFamily: "'Georgia', serif",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "6px",
            }}
          >
            {entry.name}
          </p>
        )}
        {(entry.children ?? []).map((child, i) => (
          <RenderFeatureEntry key={i} entry={child} depth={depth + 1} />
        ))}
      </div>
    );
  }

  return null;
}
