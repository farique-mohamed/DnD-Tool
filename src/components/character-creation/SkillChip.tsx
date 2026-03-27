import { chipBaseStyle } from "./shared";

interface SkillChipProps {
  skill: string;
  selected: boolean;
  locked: boolean;
  disabled: boolean;
  onClick: () => void;
}

export function SkillChip({
  skill,
  selected,
  locked,
  disabled,
  onClick,
}: SkillChipProps) {
  const isActive = selected || locked;
  return (
    <button
      type="button"
      onClick={locked || disabled ? undefined : onClick}
      style={{
        ...chipBaseStyle,
        background: isActive
          ? "rgba(201,168,76,0.25)"
          : "rgba(30,15,5,0.6)",
        borderColor: isActive
          ? "rgba(201,168,76,0.6)"
          : "rgba(201,168,76,0.2)",
        color: isActive ? "#e8d5a3" : "#a89060",
        cursor: locked ? "default" : disabled ? "not-allowed" : "pointer",
        opacity: disabled && !isActive ? 0.5 : 1,
        fontWeight: isActive ? "bold" : "normal",
      }}
    >
      {locked && "* "}{skill}
    </button>
  );
}
