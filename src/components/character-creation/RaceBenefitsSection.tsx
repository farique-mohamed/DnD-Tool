import { useMemo } from "react";
import { sectionTitleStyle, chipBaseStyle, labelStyle, inputStyle } from "./shared";
import type { RaceInfo } from "@/lib/raceData";

interface RaceBenefitsSectionProps {
  raceInfo: RaceInfo | undefined;
  selectedResistance: string;
  onResistanceChange: (resistance: string) => void;
  selectedSkillChoices: string[];
  onToggleSkillChoice: (skill: string) => void;
  selectedToolChoices: string[];
  onToolChoiceChange: (tools: string[]) => void;
}

const fixedChipStyle: React.CSSProperties = {
  ...chipBaseStyle,
  background: "rgba(201,168,76,0.12)",
  borderColor: "rgba(201,168,76,0.35)",
  color: "#a89060",
  cursor: "default",
  opacity: 0.85,
};

const activeChipStyle: React.CSSProperties = {
  ...chipBaseStyle,
  background: "rgba(201,168,76,0.25)",
  borderColor: "#c9a84c",
  color: "#e8d5a3",
};

const inactiveChipStyle: React.CSSProperties = {
  ...chipBaseStyle,
  background: "transparent",
  borderColor: "rgba(201,168,76,0.3)",
  color: "#a89060",
};

const subLabelStyle: React.CSSProperties = {
  margin: "0 0 8px 0",
  color: "#a89060",
  fontSize: "12px",
  fontFamily: "'EB Garamond', 'Georgia', serif",
};

function toolProficiencyLabel(tp: { name?: string; choiceType?: string; choiceCount?: number; choiceFrom?: string[] }): string {
  if (tp.name) return tp.name;
  if (tp.choiceType === "any") return `Choose ${tp.choiceCount ?? 1} tool${(tp.choiceCount ?? 1) > 1 ? "s" : ""}`;
  if (tp.choiceType === "anyArtisansTool") return `Choose ${tp.choiceCount ?? 1} artisan's tool${(tp.choiceCount ?? 1) > 1 ? "s" : ""}`;
  if (tp.choiceType === "anyMusicalInstrument") return `Choose ${tp.choiceCount ?? 1} musical instrument${(tp.choiceCount ?? 1) > 1 ? "s" : ""}`;
  if (tp.choiceFrom) return `Choose ${tp.choiceCount ?? 1} from: ${tp.choiceFrom.join(", ")}`;
  return "Tool proficiency";
}

export function RaceBenefitsSection({
  raceInfo,
  selectedResistance,
  onResistanceChange,
  selectedSkillChoices,
  onToggleSkillChoice,
  selectedToolChoices,
  onToolChoiceChange,
}: RaceBenefitsSectionProps) {
  const hasBenefits = useMemo(() => {
    if (!raceInfo) return false;
    return !!(
      raceInfo.darkvision ||
      raceInfo.damageResistances?.length ||
      raceInfo.damageResistanceChoices ||
      raceInfo.conditionImmunities?.length ||
      raceInfo.weaponProficiencies?.length ||
      raceInfo.armorProficiencies?.length ||
      raceInfo.toolProficiencies?.length ||
      raceInfo.skillProficiencyChoices ||
      raceInfo.flySpeed ||
      raceInfo.swimSpeed ||
      raceInfo.climbSpeed
    );
  }, [raceInfo]);

  if (!raceInfo || !hasBenefits) return null;

  return (
    <div>
      <p style={sectionTitleStyle}>Race Benefits</p>
      <p style={{ ...subLabelStyle, marginBottom: "16px" }}>
        Granted by <span style={{ color: "#c9a84c" }}>{raceInfo.name}</span>
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Darkvision */}
        {raceInfo.darkvision && raceInfo.darkvision > 0 && (
          <div>
            <p style={subLabelStyle}>
              <span style={{ color: "#c9a84c" }}>Darkvision</span> — {raceInfo.darkvision} ft.
            </p>
          </div>
        )}

        {/* Alternative speeds */}
        {(raceInfo.flySpeed || raceInfo.swimSpeed || raceInfo.climbSpeed) && (
          <div>
            <p style={subLabelStyle}>
              <span style={{ color: "#c9a84c" }}>Additional Movement</span>
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {raceInfo.flySpeed && <span style={fixedChipStyle}>Fly {raceInfo.flySpeed} ft.</span>}
              {raceInfo.swimSpeed && <span style={fixedChipStyle}>Swim {raceInfo.swimSpeed} ft.</span>}
              {raceInfo.climbSpeed && <span style={fixedChipStyle}>Climb {raceInfo.climbSpeed} ft.</span>}
            </div>
          </div>
        )}

        {/* Damage Resistances - fixed */}
        {raceInfo.damageResistances && raceInfo.damageResistances.length > 0 && (
          <div>
            <p style={subLabelStyle}>
              <span style={{ color: "#c9a84c" }}>Damage Resistances</span> — granted automatically
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {raceInfo.damageResistances.map((r) => (
                <span key={r} style={fixedChipStyle}>{r}</span>
              ))}
            </div>
          </div>
        )}

        {/* Damage Resistances - choice (e.g., Dragonborn) */}
        {raceInfo.damageResistanceChoices && (
          <div>
            <p style={subLabelStyle}>
              <span style={{ color: "#c9a84c" }}>Damage Resistance</span> — choose {raceInfo.damageResistanceChoices.count}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {raceInfo.damageResistanceChoices.from.map((r) => {
                const isSelected = selectedResistance === r;
                return (
                  <span
                    key={r}
                    style={isSelected ? activeChipStyle : inactiveChipStyle}
                    onClick={() => onResistanceChange(isSelected ? "" : r)}
                  >
                    {r}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Condition Immunities */}
        {raceInfo.conditionImmunities && raceInfo.conditionImmunities.length > 0 && (
          <div>
            <p style={subLabelStyle}>
              <span style={{ color: "#c9a84c" }}>Condition Immunities</span> — granted automatically
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {raceInfo.conditionImmunities.map((c) => (
                <span key={c} style={fixedChipStyle}>{c}</span>
              ))}
            </div>
          </div>
        )}

        {/* Weapon Proficiencies */}
        {raceInfo.weaponProficiencies && raceInfo.weaponProficiencies.length > 0 && (
          <div>
            <p style={subLabelStyle}>
              <span style={{ color: "#c9a84c" }}>Weapon Proficiencies</span> — granted automatically
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {raceInfo.weaponProficiencies.map((w) => (
                <span key={w} style={fixedChipStyle}>{w}</span>
              ))}
            </div>
          </div>
        )}

        {/* Armor Proficiencies */}
        {raceInfo.armorProficiencies && raceInfo.armorProficiencies.length > 0 && (
          <div>
            <p style={subLabelStyle}>
              <span style={{ color: "#c9a84c" }}>Armor Proficiencies</span> — granted automatically
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {raceInfo.armorProficiencies.map((a) => (
                <span key={a} style={fixedChipStyle}>{a}</span>
              ))}
            </div>
          </div>
        )}

        {/* Tool Proficiencies */}
        {raceInfo.toolProficiencies && raceInfo.toolProficiencies.length > 0 && (
          <div>
            <p style={subLabelStyle}>
              <span style={{ color: "#c9a84c" }}>Tool Proficiencies</span>
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {raceInfo.toolProficiencies.map((tp, i) => {
                if (tp.name) {
                  // Fixed tool proficiency
                  return <span key={tp.name} style={fixedChipStyle}>{tp.name}</span>;
                }
                // Choice-based tool proficiency — show as label
                return (
                  <span key={`tool-choice-${i}`} style={fixedChipStyle}>
                    {toolProficiencyLabel(tp)}
                  </span>
                );
              })}
            </div>
            {/* Tool choice input for "any" type tools */}
            {raceInfo.toolProficiencies.some((tp) => tp.choiceType || tp.choiceFrom) && (
              <div style={{ marginTop: "10px" }}>
                {raceInfo.toolProficiencies
                  .filter((tp) => tp.choiceType || tp.choiceFrom)
                  .map((tp, i) => {
                    const count = tp.choiceCount ?? 1;
                    if (tp.choiceFrom) {
                      // Choose from specific list
                      return (
                        <div key={`tool-select-${i}`} style={{ marginTop: i > 0 ? "8px" : 0 }}>
                          <label style={labelStyle}>Choose {count} tool{count > 1 ? "s" : ""}</label>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                            {tp.choiceFrom.map((tool) => {
                              const isSelected = selectedToolChoices.includes(tool);
                              return (
                                <span
                                  key={tool}
                                  style={isSelected ? activeChipStyle : inactiveChipStyle}
                                  onClick={() => {
                                    if (isSelected) {
                                      onToolChoiceChange(selectedToolChoices.filter((t) => t !== tool));
                                    } else if (selectedToolChoices.length < count) {
                                      onToolChoiceChange([...selectedToolChoices, tool]);
                                    }
                                  }}
                                >
                                  {tool}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
                    // "any" type — free text input for each slot
                    return (
                      <div key={`tool-input-${i}`} style={{ marginTop: i > 0 ? "8px" : 0 }}>
                        <label style={labelStyle}>{toolProficiencyLabel(tp)}</label>
                        {Array.from({ length: count }).map((_, j) => (
                          <input
                            key={`tool-text-${i}-${j}`}
                            type="text"
                            placeholder={`Tool proficiency ${j + 1}...`}
                            value={selectedToolChoices[j] ?? ""}
                            onChange={(e) => {
                              const updated = [...selectedToolChoices];
                              updated[j] = e.target.value;
                              onToolChoiceChange(updated.filter(Boolean));
                            }}
                            style={{ ...inputStyle, maxWidth: "300px", marginBottom: j < count - 1 ? "6px" : 0 }}
                          />
                        ))}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Skill Proficiency Choices (from race) */}
        {raceInfo.skillProficiencyChoices && (
          <div>
            <p style={subLabelStyle}>
              <span style={{ color: "#c9a84c" }}>Racial Skill Proficiencies</span> — choose {raceInfo.skillProficiencyChoices.count}
              {" "}({selectedSkillChoices.length}/{raceInfo.skillProficiencyChoices.count} selected)
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {(raceInfo.skillProficiencyChoices.from.length > 0
                ? raceInfo.skillProficiencyChoices.from
                : ["Acrobatics", "Animal Handling", "Arcana", "Athletics", "Deception", "History", "Insight", "Intimidation", "Investigation", "Medicine", "Nature", "Perception", "Performance", "Persuasion", "Religion", "Sleight of Hand", "Stealth", "Survival"]
              ).map((skill) => {
                const isSelected = selectedSkillChoices.includes(skill);
                return (
                  <span
                    key={skill}
                    style={isSelected ? activeChipStyle : inactiveChipStyle}
                    onClick={() => {
                      if (isSelected) {
                        onToggleSkillChoice(skill);
                      } else if (selectedSkillChoices.length < raceInfo.skillProficiencyChoices!.count) {
                        onToggleSkillChoice(skill);
                      }
                    }}
                  >
                    {skill}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
