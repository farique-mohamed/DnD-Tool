import { useMemo } from "react";
import { SkillChip } from "./SkillChip";
import { sectionTitleStyle, ALL_SKILLS } from "./shared";
import type { Background } from "@/lib/backgroundData";

interface ClassInfo {
  name: string;
  skillChoices: { from: string[]; count: number };
}

interface SkillProficiencySectionProps {
  raceName: string | undefined;
  racialFixedSkills: string[];
  backgroundInfo: Background | undefined;
  classInfo: ClassInfo | undefined;
  selectedBgChoiceSkills: string[];
  selectedClassSkills: string[];
  allSelectedSkills: string[];
  lockedByBackground: Set<string>;
  bgChoiceCount: number;
  bgChoiceFrom: string[];
  classSkillCount: number;
  classSkillFrom: string[];
  classIsAnySkill: boolean;
  onToggleBgChoiceSkill: (skill: string) => void;
  onToggleClassSkill: (skill: string) => void;
}

export function SkillProficiencySection({
  raceName,
  racialFixedSkills,
  backgroundInfo,
  classInfo,
  selectedBgChoiceSkills,
  selectedClassSkills,
  allSelectedSkills,
  lockedByBackground,
  bgChoiceCount,
  bgChoiceFrom,
  classSkillCount,
  classSkillFrom,
  classIsAnySkill,
  onToggleBgChoiceSkill,
  onToggleClassSkill,
}: SkillProficiencySectionProps) {
  const bgFixedSkills = backgroundInfo?.skillProficiencies ?? [];

  const allSkills = useMemo(() => ALL_SKILLS, []);

  return (
    <div>
      <p style={sectionTitleStyle}>Skill Proficiencies</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

        {/* Racial fixed skills */}
        {racialFixedSkills.length > 0 && (
          <div>
            <p style={{ margin: "0 0 8px 0", color: "#a89060", fontSize: "12px", fontFamily: "'EB Garamond', 'Georgia', serif" }}>
              <span style={{ color: "#c9a84c" }}>From Race</span>{" "}
              ({raceName}) — granted automatically
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {racialFixedSkills.map((skill) => (
                <SkillChip key={`race-fixed-${skill}`} skill={skill} selected={false} locked onClick={() => {}} disabled={false} />
              ))}
            </div>
          </div>
        )}

        {/* Background fixed skills */}
        {bgFixedSkills.length > 0 && (
          <div>
            <p style={{ margin: "0 0 8px 0", color: "#a89060", fontSize: "12px", fontFamily: "'EB Garamond', 'Georgia', serif" }}>
              <span style={{ color: "#c9a84c" }}>From Background</span>{" "}
              ({backgroundInfo?.name}) — granted automatically
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {bgFixedSkills.map((skill) => (
                <SkillChip key={`bg-fixed-${skill}`} skill={skill} selected={false} locked onClick={() => {}} disabled={false} />
              ))}
            </div>
          </div>
        )}

        {/* Background choice skills */}
        {bgChoiceCount > 0 && bgChoiceFrom.length > 0 && (
          <div>
            <p style={{ margin: "0 0 8px 0", color: "#a89060", fontSize: "12px", fontFamily: "'EB Garamond', 'Georgia', serif" }}>
              <span style={{ color: "#c9a84c" }}>Background Choice</span>{" "}
              — choose {bgChoiceCount} from the following
              {selectedBgChoiceSkills.length > 0 && (
                <span style={{ color: "#c9a84c", marginLeft: "8px" }}>
                  ({selectedBgChoiceSkills.length}/{bgChoiceCount})
                </span>
              )}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {bgChoiceFrom.map((skill) => {
                const isSelected = selectedBgChoiceSkills.includes(skill);
                const isLocked = bgFixedSkills.includes(skill);
                const isFull = selectedBgChoiceSkills.length >= bgChoiceCount && !isSelected;
                return (
                  <SkillChip
                    key={`bg-choice-${skill}`}
                    skill={skill}
                    selected={isSelected}
                    locked={isLocked}
                    disabled={isFull}
                    onClick={() => onToggleBgChoiceSkill(skill)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Class skill choices */}
        {classSkillCount > 0 && (
          <div>
            <p style={{ margin: "0 0 8px 0", color: "#a89060", fontSize: "12px", fontFamily: "'EB Garamond', 'Georgia', serif" }}>
              <span style={{ color: "#c9a84c" }}>From Class</span>{" "}
              ({classInfo?.name}) — choose {classSkillCount}
              {!classIsAnySkill && " from the following"}
              {classIsAnySkill && " from any skill"}
              {selectedClassSkills.length > 0 && (
                <span style={{ color: "#c9a84c", marginLeft: "8px" }}>
                  ({selectedClassSkills.length}/{classSkillCount})
                </span>
              )}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {(classIsAnySkill ? allSkills : classSkillFrom).map((skill) => {
                const isSelected = selectedClassSkills.includes(skill);
                const isLockedByBg = lockedByBackground.has(skill);
                const isFull = selectedClassSkills.length >= classSkillCount && !isSelected;
                return (
                  <SkillChip
                    key={`class-${skill}`}
                    skill={skill}
                    selected={isSelected}
                    locked={isLockedByBg}
                    disabled={isFull || isLockedByBg}
                    onClick={() => onToggleClassSkill(skill)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Summary of all selected skills */}
        {allSelectedSkills.length > 0 && (
          <div style={{
            background: "rgba(201,168,76,0.06)",
            border: "1px solid rgba(201,168,76,0.15)",
            borderRadius: "6px",
            padding: "10px 14px",
            marginTop: "4px",
          }}>
            <p style={{ margin: 0, color: "#c9a84c", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", fontFamily: "'EB Garamond', 'Georgia', serif" }}>
              Proficient Skills ({allSelectedSkills.length})
            </p>
            <p style={{ margin: "6px 0 0 0", color: "#e8d5a3", fontSize: "12px", fontFamily: "'EB Garamond', 'Georgia', serif" }}>
              {allSelectedSkills.join(", ")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
