import { type MonsterInfo } from "@/lib/bestiaryData";
import { parseTaggedText } from "@/lib/dndTagParser";
import { GOLD, GOLD_BRIGHT, GOLD_BORDER, TEXT_DIM, SERIF } from "./theme";

// ---------------------------------------------------------------------------
// Action list renderer
// ---------------------------------------------------------------------------

export interface ActionListProps {
  title: string;
  actions: MonsterInfo["actions"];
}

export function ActionList({ title, actions }: ActionListProps) {
  if (actions.length === 0) return null;
  return (
    <div>
      <div
        style={{
          borderBottom: `1px solid ${GOLD_BORDER}`,
          marginBottom: "8px",
          paddingBottom: "3px",
        }}
      >
        <span
          style={{
            color: GOLD,
            fontSize: "12px",
            fontFamily: SERIF,
            fontStyle: "italic",
            fontWeight: "bold",
            letterSpacing: "0.5px",
          }}
        >
          {title}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {actions.map((action, idx) => (
          <div key={idx}>
            <span
              style={{
                color: GOLD_BRIGHT,
                fontSize: "13px",
                fontFamily: SERIF,
                fontWeight: "bold",
                fontStyle: "italic",
              }}
            >
              {action.name}.{" "}
            </span>
            <span
              style={{
                color: TEXT_DIM,
                fontSize: "13px",
                fontFamily: SERIF,
                lineHeight: "1.5",
              }}
            >
              {parseTaggedText(action.text)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
