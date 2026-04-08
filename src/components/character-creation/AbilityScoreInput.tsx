import { labelStyle, inputStyle, bonusBadgeStyle } from "./shared";

interface AbilityScoreInputProps {
  label: string;
  name: string;
  value: number;
  bonus: number;
  onChange: (name: string, value: number) => void;
}

export function AbilityScoreInput({
  label,
  name,
  value,
  bonus,
  onChange,
}: AbilityScoreInputProps) {
  const total = value + bonus;
  const modifier = Math.floor((total - 10) / 2);
  const modStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
      <span style={{ ...labelStyle, marginBottom: 0, textAlign: "center" }}>{label}</span>
      <input
        type="number"
        name={name}
        min={1}
        max={20}
        value={value}
        onChange={(e) => onChange(name, Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
        style={{ ...inputStyle, textAlign: "center", padding: "10px 8px", width: "70px" }}
      />
      {bonus > 0 && (
        <span style={bonusBadgeStyle}>+{bonus}</span>
      )}
      {bonus > 0 ? (
        <span style={{ color: "#e8d5a3", fontSize: "14px", fontWeight: "bold", fontFamily: "'EB Garamond', 'Georgia', serif" }}>
          {total} <span style={{ color: "#a89060", fontSize: "12px", fontWeight: "normal" }}>({modStr})</span>
        </span>
      ) : (
        <span style={{ color: "#a89060", fontSize: "12px", fontFamily: "'EB Garamond', 'Georgia', serif" }}>
          {modStr}
        </span>
      )}
    </div>
  );
}
