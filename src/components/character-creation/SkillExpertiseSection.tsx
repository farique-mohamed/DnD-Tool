import { sectionTitleStyle, chipBaseStyle } from "./shared";

interface SkillExpertiseSectionProps {
  characterClass: string;
  expertiseCount: number;
  allSelectedSkills: string[];
  selectedExpertiseSkills: string[];
  onToggleExpertiseSkill: (skill: string) => void;
}

export function SkillExpertiseSection({
  characterClass,
  expertiseCount,
  allSelectedSkills,
  selectedExpertiseSkills,
  onToggleExpertiseSkill,
}: SkillExpertiseSectionProps) {
  return (
    <div>
      <p style={sectionTitleStyle}>Skill Expertise</p>
      <p style={{ margin: "0 0 12px 0", color: "#a89060", fontSize: "12px", fontFamily: "'Georgia', serif" }}>
        <span style={{ color: "#c9a84c" }}>{characterClass}</span>{" "}
        — choose {expertiseCount} proficient skill{expertiseCount !== 1 ? "s" : ""} to gain expertise
        {selectedExpertiseSkills.length > 0 && (
          <span style={{ color: "#c9a84c", marginLeft: "8px" }}>
            ({selectedExpertiseSkills.length}/{expertiseCount})
          </span>
        )}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {allSelectedSkills.map((skill) => {
          const isSelected = selectedExpertiseSkills.includes(skill);
          const isFull = selectedExpertiseSkills.length >= expertiseCount && !isSelected;
          return (
            <button
              key={`expertise-${skill}`}
              type="button"
              onClick={isFull ? undefined : () => onToggleExpertiseSkill(skill)}
              style={{
                ...chipBaseStyle,
                background: isSelected
                  ? "rgba(201,168,76,0.35)"
                  : "rgba(30,15,5,0.6)",
                borderColor: isSelected
                  ? "#c9a84c"
                  : "rgba(201,168,76,0.2)",
                color: isSelected ? "#e8d5a3" : "#a89060",
                cursor: isFull ? "not-allowed" : "pointer",
                opacity: isFull ? 0.5 : 1,
                fontWeight: isSelected ? "bold" : "normal",
              }}
            >
              {isSelected && "★ "}{skill}
            </button>
          );
        })}
      </div>
      {selectedExpertiseSkills.length > 0 && (
        <div style={{
          background: "rgba(201,168,76,0.06)",
          border: "1px solid rgba(201,168,76,0.15)",
          borderRadius: "6px",
          padding: "10px 14px",
          marginTop: "12px",
        }}>
          <p style={{ margin: 0, color: "#c9a84c", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", fontFamily: "'Georgia', serif" }}>
            Expertise Skills ({selectedExpertiseSkills.length}/{expertiseCount})
          </p>
          <p style={{ margin: "6px 0 0 0", color: "#e8d5a3", fontSize: "12px", fontFamily: "'Georgia', serif" }}>
            {selectedExpertiseSkills.join(", ")}
          </p>
        </div>
      )}
    </div>
  );
}
