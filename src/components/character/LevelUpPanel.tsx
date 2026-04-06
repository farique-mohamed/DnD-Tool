import { useState } from "react";
import { api } from "@/utils/api";
import { getClassByName, getClassByNameAndSource } from "@/lib/classData";
import { getNewExpertiseAtLevel } from "@/lib/expertiseData";
import { getFeatsBySource } from "@/lib/featData";
import type { Feat } from "@/lib/featData";
import { getLevelUpChoices } from "@/lib/levelUpChoicesData";
import {
  LevelUpFeatureChoices,
  validateFeatureChoices,
  categorizeSelections,
  type FeatureSelections,
} from "./LevelUpFeatureChoices";
import {
  type CharacterData,
  mod,
  HIT_DIE_AVERAGE,
  ABILITY_NAMES,
  isAsiLevel,
  SUBCLASS_UNLOCK_LEVELS,
} from "./shared";

export function LevelUpPanel({
  character,
  onClose,
}: {
  character: CharacterData;
  onClose: () => void;
}) {
  const utils = api.useUtils();
  const conMod = mod(character.constitution);
  const hitDieAvg = HIT_DIE_AVERAGE[character.characterClass] ?? 5;
  const suggestedHp = character.maxHp + hitDieAvg + conMod;
  const [newMaxHp, setNewMaxHp] = useState<string>(String(suggestedHp));
  const [selectedSubclass, setSelectedSubclass] = useState<string>("");
  const [subclassError, setSubclassError] = useState<string>("");
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [expertiseError, setExpertiseError] = useState<string>("");
  const [asiMode, setAsiMode] = useState<"2" | "1-1">("2");
  const [asiAbility1, setAsiAbility1] = useState<string>("");
  const [asiAbility2, setAsiAbility2] = useState<string>("");
  const [asiError, setAsiError] = useState<string>("");
  const [asiOrFeat, setAsiOrFeat] = useState<"asi" | "feat">("asi");
  const [selectedFeat, setSelectedFeat] = useState<string>("");
  const [featSearch, setFeatSearch] = useState<string>("");
  const [expandedFeat, setExpandedFeat] = useState<string>("");
  const [featAbilityChoices, setFeatAbilityChoices] = useState<string[]>([]);
  const [featureSelections, setFeatureSelections] = useState<FeatureSelections>(
    {},
  );
  const [featureChoiceError, setFeatureChoiceError] = useState<string>("");

  const newLevel = character.level + 1;
  const subclassUnlockLevel =
    SUBCLASS_UNLOCK_LEVELS[character.characterClass] ?? 3;
  const shouldPickSubclass =
    newLevel >= subclassUnlockLevel && !character.subclass;

  const rulesSource = character.rulesSource || "PHB";
  const newExpertiseCount = getNewExpertiseAtLevel(
    character.characterClass,
    rulesSource,
    newLevel,
  );
  const existingExpertise: string[] = (() => {
    try {
      return character.skillExpertise
        ? (JSON.parse(character.skillExpertise) as string[])
        : [];
    } catch {
      return [];
    }
  })();
  const proficientSkills: string[] = (() => {
    try {
      return character.skillProficiencies
        ? (JSON.parse(character.skillProficiencies) as string[])
        : [];
    } catch {
      return [];
    }
  })();
  const eligibleForExpertise = proficientSkills.filter(
    (s) => !existingExpertise.includes(s),
  );

  const classInfo = character.rulesSource
    ? (getClassByNameAndSource(
        character.characterClass,
        character.rulesSource,
      ) ?? getClassByName(character.characterClass))
    : getClassByName(character.characterClass);
  const subclassOptions = classInfo?.subclasses ?? [];

  const showAsi = isAsiLevel(character.characterClass, newLevel);

  // Level-up feature choices (languages, skills, fighting styles, etc.)
  // Use selectedSubclass if just picked, otherwise existing subclass
  const effectiveSubclass = selectedSubclass || character.subclass;
  const levelUpChoices = getLevelUpChoices(
    character.characterClass,
    newLevel,
    rulesSource,
    effectiveSubclass,
  );
  const existingLanguages: string[] = (() => {
    try {
      return character.languages
        ? (JSON.parse(character.languages) as string[])
        : [];
    } catch {
      return [];
    }
  })();

  // Feat data for feat browser
  const existingFeats: string[] = (() => {
    try {
      return character.feats ? (JSON.parse(character.feats) as string[]) : [];
    } catch {
      return [];
    }
  })();
  const availableFeats: Feat[] = (() => {
    const allFeats = getFeatsBySource(rulesSource as "PHB" | "XPHB");
    return allFeats
      .filter((f) => !existingFeats.includes(f.name))
      .filter((f) => !f.levelRequired || f.levelRequired <= newLevel)
      .sort((a, b) => a.name.localeCompare(b.name));
  })();
  const filteredFeats = featSearch
    ? availableFeats.filter((f) =>
        f.name.toLowerCase().includes(featSearch.toLowerCase()),
      )
    : availableFeats;
  const selectedFeatData = availableFeats.find((f) => f.name === selectedFeat);

  const updateSubclass = api.character.updateSubclass.useMutation();
  const updateSkillExpertise = api.character.updateSkillExpertise.useMutation();
  const updateAbilityScores = api.character.updateAbilityScores.useMutation();
  const updateFeats = api.character.updateFeats.useMutation();
  const updateLanguages = api.character.updateLanguages.useMutation();
  const updateSkillProficiencies =
    api.character.updateSkillProficiencies.useMutation();
  const updateLevelUpSelections =
    api.character.updateLevelUpSelections.useMutation();

  const levelUp = api.character.levelUp.useMutation({
    onSuccess: async () => {
      await utils.character.getById.invalidate({ id: character.id });
      onClose();
    },
  });

  const toggleExpertiseSkill = (skill: string) => {
    setSelectedExpertise((prev) => {
      if (prev.includes(skill)) return prev.filter((s) => s !== skill);
      if (prev.length >= newExpertiseCount) return prev;
      return [...prev, skill];
    });
    setExpertiseError("");
  };

  const handleConfirm = async () => {
    const hp = parseInt(newMaxHp);
    if (isNaN(hp) || hp < 1) return;
    if (shouldPickSubclass && subclassOptions.length > 0 && !selectedSubclass) {
      setSubclassError("Please choose a subclass before leveling up.");
      return;
    }
    if (
      newExpertiseCount > 0 &&
      selectedExpertise.length !== newExpertiseCount
    ) {
      setExpertiseError(
        `Please choose exactly ${newExpertiseCount} skill${newExpertiseCount !== 1 ? "s" : ""} for expertise.`,
      );
      return;
    }
    if (showAsi) {
      if (asiOrFeat === "asi") {
        if (asiMode === "2" && !asiAbility1) {
          setAsiError(
            "Please choose an ability score for your +2 improvement.",
          );
          return;
        }
        if (asiMode === "1-1" && (!asiAbility1 || !asiAbility2)) {
          setAsiError(
            "Please choose two different ability scores for your +1/+1 improvement.",
          );
          return;
        }
        if (asiMode === "1-1" && asiAbility1 === asiAbility2) {
          setAsiError("Please choose two different ability scores.");
          return;
        }
        // Build updated scores
        const scores: Record<string, number> = {
          strength: character.strength,
          dexterity: character.dexterity,
          constitution: character.constitution,
          intelligence: character.intelligence,
          wisdom: character.wisdom,
          charisma: character.charisma,
        };
        if (asiMode === "2") {
          scores[asiAbility1] = Math.min(20, (scores[asiAbility1] ?? 10) + 2);
        } else {
          scores[asiAbility1] = Math.min(20, (scores[asiAbility1] ?? 10) + 1);
          scores[asiAbility2] = Math.min(20, (scores[asiAbility2] ?? 10) + 1);
        }
        await updateAbilityScores.mutateAsync({
          id: character.id,
          strength: scores.strength ?? character.strength,
          dexterity: scores.dexterity ?? character.dexterity,
          constitution: scores.constitution ?? character.constitution,
          intelligence: scores.intelligence ?? character.intelligence,
          wisdom: scores.wisdom ?? character.wisdom,
          charisma: scores.charisma ?? character.charisma,
        });
      } else {
        // Feat path
        if (!selectedFeat) {
          setAsiError("Please choose a feat.");
          return;
        }
        const feat = selectedFeatData;
        if (feat?.abilityBonus?.choose) {
          const needed = feat.abilityBonus.choose.count;
          const chosen = featAbilityChoices.filter((c) => c !== "").length;
          if (chosen < needed) {
            setAsiError(
              `Please choose ${needed} ability score${needed > 1 ? "s" : ""} for this feat.`,
            );
            return;
          }
        }
        if (feat) {
          // Apply ability bonuses from the feat
          const scores: Record<string, number> = {
            strength: character.strength,
            dexterity: character.dexterity,
            constitution: character.constitution,
            intelligence: character.intelligence,
            wisdom: character.wisdom,
            charisma: character.charisma,
          };
          let hasAbilityChanges = false;
          if (feat.abilityBonus?.fixed) {
            for (const [abbr, bonus] of Object.entries(
              feat.abilityBonus.fixed,
            )) {
              // Map abbreviation to full ability name
              const fullName =
                abbr === "str"
                  ? "strength"
                  : abbr === "dex"
                    ? "dexterity"
                    : abbr === "con"
                      ? "constitution"
                      : abbr === "int"
                        ? "intelligence"
                        : abbr === "wis"
                          ? "wisdom"
                          : abbr === "cha"
                            ? "charisma"
                            : abbr;
              if (scores[fullName] !== undefined) {
                scores[fullName] = Math.min(20, scores[fullName]! + bonus);
                hasAbilityChanges = true;
              }
            }
          }
          if (feat.abilityBonus?.choose && featAbilityChoices.length > 0) {
            for (const abbr of featAbilityChoices) {
              const fullName =
                abbr === "str"
                  ? "strength"
                  : abbr === "dex"
                    ? "dexterity"
                    : abbr === "con"
                      ? "constitution"
                      : abbr === "int"
                        ? "intelligence"
                        : abbr === "wis"
                          ? "wisdom"
                          : abbr === "cha"
                            ? "charisma"
                            : abbr;
              if (scores[fullName] !== undefined) {
                scores[fullName] = Math.min(
                  20,
                  scores[fullName]! + (feat.abilityBonus.choose.amount ?? 1),
                );
                hasAbilityChanges = true;
              }
            }
          }
          if (hasAbilityChanges) {
            await updateAbilityScores.mutateAsync({
              id: character.id,
              strength: scores.strength ?? character.strength,
              dexterity: scores.dexterity ?? character.dexterity,
              constitution: scores.constitution ?? character.constitution,
              intelligence: scores.intelligence ?? character.intelligence,
              wisdom: scores.wisdom ?? character.wisdom,
              charisma: scores.charisma ?? character.charisma,
            });
          }
          // Save the feat
          await updateFeats.mutateAsync({
            id: character.id,
            feats: [...existingFeats, feat.name],
          });
        }
      }
    }
    // Validate feature choices
    if (levelUpChoices.length > 0) {
      const choiceErr = validateFeatureChoices(
        levelUpChoices,
        featureSelections,
      );
      if (choiceErr) {
        setFeatureChoiceError(choiceErr);
        return;
      }
    }
    if (shouldPickSubclass && selectedSubclass) {
      await updateSubclass.mutateAsync({
        id: character.id,
        subclass: selectedSubclass,
      });
    }
    if (newExpertiseCount > 0 && selectedExpertise.length > 0) {
      const combined = [...existingExpertise, ...selectedExpertise];
      await updateSkillExpertise.mutateAsync({
        id: character.id,
        skillExpertise: combined,
      });
    }
    // Save feature choices (languages, skills, other selections)
    if (levelUpChoices.length > 0) {
      const { languages, skills, others } = categorizeSelections(
        levelUpChoices,
        featureSelections,
      );
      if (languages.length > 0) {
        const combined = [...existingLanguages, ...languages];
        await updateLanguages.mutateAsync({
          id: character.id,
          languages: combined,
        });
      }
      if (skills.length > 0) {
        const combined = [...proficientSkills, ...skills];
        await updateSkillProficiencies.mutateAsync({
          id: character.id,
          skillProficiencies: combined,
        });
      }
      if (Object.keys(others).length > 0) {
        // Merge with existing level-up selections
        let existing: Record<string, string[]> = {};
        try {
          existing = character.levelUpSelections
            ? (JSON.parse(character.levelUpSelections) as Record<
                string,
                string[]
              >)
            : {};
        } catch {
          /* empty */
        }
        for (const [k, v] of Object.entries(others)) {
          existing[k] = [...(existing[k] ?? []), ...v];
        }
        await updateLevelUpSelections.mutateAsync({
          id: character.id,
          levelUpSelections: existing,
        });
      }
    }
    levelUp.mutate({ id: character.id, newMaxHp: hp });
  };

  const isPending =
    levelUp.isPending ||
    updateSubclass.isPending ||
    updateSkillExpertise.isPending ||
    updateAbilityScores.isPending ||
    updateFeats.isPending ||
    updateLanguages.isPending ||
    updateSkillProficiencies.isPending ||
    updateLevelUpSelections.isPending;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "rgba(15,8,3,0.97)",
          border: "2px solid #c9a84c",
          borderRadius: "12px",
          padding: "32px 36px",
          maxWidth: "420px",
          width: "100%",
          boxShadow: "0 0 60px rgba(201,168,76,0.4)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <h2
          style={{
            color: "#c9a84c",
            fontFamily: "'Georgia', serif",
            fontSize: "20px",
            fontWeight: "bold",
            letterSpacing: "2px",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}
        >
          Level Up
        </h2>
        <p
          style={{
            color: "#a89060",
            fontFamily: "'Georgia', serif",
            fontSize: "13px",
            marginBottom: "24px",
          }}
        >
          {character.name} advances from level {character.level} to level{" "}
          {character.level + 1}.
        </p>

        {/* Subclass selection */}
        {shouldPickSubclass && subclassOptions.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <p
              style={{
                color: "#b8934a",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontFamily: "'Georgia', serif",
                marginBottom: "8px",
              }}
            >
              Choose Your {classInfo?.subclassTitle ?? "Subclass"}
            </p>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                maxHeight: "200px",
                overflowY: "auto",
              }}
            >
              {subclassOptions.map((sub) => (
                <button
                  key={sub.name}
                  onClick={() => {
                    setSelectedSubclass(sub.name);
                    setSubclassError("");
                  }}
                  style={{
                    background:
                      selectedSubclass === sub.name
                        ? "rgba(201,168,76,0.15)"
                        : "transparent",
                    border:
                      selectedSubclass === sub.name
                        ? "1px solid #c9a84c"
                        : "1px solid rgba(201,168,76,0.25)",
                    borderRadius: "6px",
                    padding: "8px 14px",
                    color:
                      selectedSubclass === sub.name ? "#c9a84c" : "#e8d5a3",
                    fontFamily: "'Georgia', serif",
                    fontSize: "13px",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  {sub.name}
                </button>
              ))}
            </div>
            {subclassError && (
              <p
                style={{
                  color: "#e74c3c",
                  fontSize: "12px",
                  fontFamily: "'Georgia', serif",
                  marginTop: "6px",
                }}
              >
                {subclassError}
              </p>
            )}
          </div>
        )}

        {/* Expertise selection */}
        {newExpertiseCount > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <p
              style={{
                color: "#b8934a",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontFamily: "'Georgia', serif",
                marginBottom: "8px",
              }}
            >
              Skill Expertise
            </p>
            <p
              style={{
                color: "#a89060",
                fontSize: "12px",
                fontFamily: "'Georgia', serif",
                marginBottom: "10px",
              }}
            >
              Choose {newExpertiseCount} proficient skill
              {newExpertiseCount !== 1 ? "s" : ""} to gain expertise (double
              proficiency bonus).
              {selectedExpertise.length > 0 && (
                <span style={{ color: "#c9a84c", marginLeft: "8px" }}>
                  ({selectedExpertise.length}/{newExpertiseCount})
                </span>
              )}
            </p>
            {eligibleForExpertise.length === 0 ? (
              <p
                style={{
                  color: "#a89060",
                  fontSize: "12px",
                  fontFamily: "'Georgia', serif",
                  fontStyle: "italic",
                }}
              >
                No eligible skills — all proficient skills already have
                expertise.
              </p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {eligibleForExpertise.map((skill) => {
                  const isSelected = selectedExpertise.includes(skill);
                  const isFull =
                    selectedExpertise.length >= newExpertiseCount &&
                    !isSelected;
                  return (
                    <button
                      key={`expertise-${skill}`}
                      onClick={
                        isFull ? undefined : () => toggleExpertiseSkill(skill)
                      }
                      style={{
                        background: isSelected
                          ? "rgba(201,168,76,0.25)"
                          : "rgba(30,15,5,0.6)",
                        border: `1px solid ${isSelected ? "rgba(201,168,76,0.6)" : "rgba(201,168,76,0.2)"}`,
                        color: isSelected ? "#e8d5a3" : "#a89060",
                        borderRadius: "20px",
                        padding: "4px 12px",
                        fontSize: "11px",
                        fontFamily: "'Georgia', serif",
                        cursor: isFull ? "not-allowed" : "pointer",
                        opacity: isFull ? 0.5 : 1,
                        fontWeight: isSelected ? "bold" : "normal",
                      }}
                    >
                      {isSelected && "★ "}
                      {skill}
                    </button>
                  );
                })}
              </div>
            )}
            {expertiseError && (
              <p
                style={{
                  color: "#e74c3c",
                  fontSize: "12px",
                  fontFamily: "'Georgia', serif",
                  marginTop: "6px",
                }}
              >
                {expertiseError}
              </p>
            )}
          </div>
        )}

        {/* Feature choices (languages, skills, fighting styles, etc.) */}
        {levelUpChoices.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <LevelUpFeatureChoices
              choices={levelUpChoices}
              existingLanguages={existingLanguages}
              existingSkills={proficientSkills}
              selections={featureSelections}
              onSelectionChange={(s) => {
                setFeatureSelections(s);
                setFeatureChoiceError("");
              }}
            />
            {featureChoiceError && (
              <p
                style={{
                  color: "#e74c3c",
                  fontSize: "12px",
                  fontFamily: "'Georgia', serif",
                  marginTop: "6px",
                }}
              >
                {featureChoiceError}
              </p>
            )}
          </div>
        )}

        {/* ASI / Feat selection */}
        {showAsi && (
          <div
            style={{
              background: "rgba(201,168,76,0.06)",
              border: "1px solid rgba(201,168,76,0.25)",
              borderRadius: "8px",
              padding: "16px 18px",
              marginBottom: "20px",
            }}
          >
            <p
              style={{
                color: "#c9a84c",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "1.2px",
                fontFamily: "'Georgia', serif",
                margin: "0 0 12px 0",
                fontWeight: "bold",
              }}
            >
              Ability Score Improvement
            </p>

            {/* ASI or Feat toggle */}
            <div style={{ display: "flex", gap: "0", marginBottom: "14px" }}>
              <button
                onClick={() => {
                  setAsiOrFeat("asi");
                  setAsiError("");
                }}
                style={{
                  background:
                    asiOrFeat === "asi"
                      ? "linear-gradient(135deg, #8b6914, #c9a84c)"
                      : "rgba(0,0,0,0.4)",
                  border:
                    asiOrFeat === "asi"
                      ? "1px solid #c9a84c"
                      : "1px solid rgba(201,168,76,0.3)",
                  color: asiOrFeat === "asi" ? "#1a1a2e" : "#a89060",
                  fontWeight: asiOrFeat === "asi" ? "bold" : "normal",
                  padding: "8px 18px",
                  fontSize: "12px",
                  fontFamily: "'Georgia', serif",
                  cursor: "pointer",
                  borderRadius: "6px 0 0 6px",
                }}
              >
                Improve Scores
              </button>
              <button
                onClick={() => {
                  setAsiOrFeat("feat");
                  setAsiError("");
                }}
                style={{
                  background:
                    asiOrFeat === "feat"
                      ? "linear-gradient(135deg, #8b6914, #c9a84c)"
                      : "rgba(0,0,0,0.4)",
                  border:
                    asiOrFeat === "feat"
                      ? "1px solid #c9a84c"
                      : "1px solid rgba(201,168,76,0.3)",
                  color: asiOrFeat === "feat" ? "#1a1a2e" : "#a89060",
                  fontWeight: asiOrFeat === "feat" ? "bold" : "normal",
                  padding: "8px 18px",
                  fontSize: "12px",
                  fontFamily: "'Georgia', serif",
                  cursor: "pointer",
                  borderRadius: "0 6px 6px 0",
                }}
              >
                Choose a Feat
              </button>
            </div>

            {asiOrFeat === "asi" ? (
              <>
                {/* Current scores reference */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginBottom: "14px",
                  }}
                >
                  {ABILITY_NAMES.map(({ key, label }) => {
                    const score = character[
                      key as keyof CharacterData
                    ] as number;
                    return (
                      <div
                        key={key}
                        style={{ textAlign: "center", minWidth: "42px" }}
                      >
                        <div
                          style={{
                            color: "#b8934a",
                            fontSize: "9px",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            fontFamily: "'Georgia', serif",
                          }}
                        >
                          {label}
                        </div>
                        <div
                          style={{
                            color: "#e8d5a3",
                            fontSize: "15px",
                            fontWeight: "bold",
                            fontFamily: "'Georgia', serif",
                          }}
                        >
                          {score}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Mode toggle */}
                <div
                  style={{ display: "flex", gap: "6px", marginBottom: "14px" }}
                >
                  <button
                    onClick={() => {
                      setAsiMode("2");
                      setAsiAbility2("");
                      setAsiError("");
                    }}
                    style={{
                      background:
                        asiMode === "2"
                          ? "rgba(201,168,76,0.2)"
                          : "transparent",
                      border:
                        asiMode === "2"
                          ? "1px solid #c9a84c"
                          : "1px solid rgba(201,168,76,0.25)",
                      color: asiMode === "2" ? "#c9a84c" : "#a89060",
                      borderRadius: "20px",
                      padding: "5px 14px",
                      fontSize: "11px",
                      fontFamily: "'Georgia', serif",
                      cursor: "pointer",
                      fontWeight: asiMode === "2" ? "bold" : "normal",
                    }}
                  >
                    +2 to one score
                  </button>
                  <button
                    onClick={() => {
                      setAsiMode("1-1");
                      setAsiError("");
                    }}
                    style={{
                      background:
                        asiMode === "1-1"
                          ? "rgba(201,168,76,0.2)"
                          : "transparent",
                      border:
                        asiMode === "1-1"
                          ? "1px solid #c9a84c"
                          : "1px solid rgba(201,168,76,0.25)",
                      color: asiMode === "1-1" ? "#c9a84c" : "#a89060",
                      borderRadius: "20px",
                      padding: "5px 14px",
                      fontSize: "11px",
                      fontFamily: "'Georgia', serif",
                      cursor: "pointer",
                      fontWeight: asiMode === "1-1" ? "bold" : "normal",
                    }}
                  >
                    +1 to two scores
                  </button>
                </div>

                {/* Ability selectors */}
                {asiMode === "2" ? (
                  <div>
                    <label
                      style={{
                        color: "#a89060",
                        fontSize: "11px",
                        fontFamily: "'Georgia', serif",
                        display: "block",
                        marginBottom: "6px",
                      }}
                    >
                      Choose ability (+2)
                    </label>
                    <select
                      value={asiAbility1}
                      onChange={(e) => {
                        setAsiAbility1(e.target.value);
                        setAsiError("");
                      }}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        background: "rgba(30,15,5,0.9)",
                        border: "1px solid rgba(201,168,76,0.4)",
                        borderRadius: "6px",
                        color: "#e8d5a3",
                        fontSize: "13px",
                        fontFamily: "'Georgia', serif",
                        outline: "none",
                      }}
                    >
                      <option value="">-- Select --</option>
                      {ABILITY_NAMES.map(({ key, label }) => {
                        const current = character[
                          key as keyof CharacterData
                        ] as number;
                        const capped = current >= 20;
                        return (
                          <option key={key} value={key} disabled={capped}>
                            {label} ({current}
                            {capped
                              ? " - MAX"
                              : ` -> ${Math.min(20, current + 2)}`}
                            )
                          </option>
                        );
                      })}
                    </select>
                    {asiAbility1 && (
                      <p
                        style={{
                          color: "#c9a84c",
                          fontSize: "12px",
                          fontFamily: "'Georgia', serif",
                          marginTop: "6px",
                        }}
                      >
                        {
                          ABILITY_NAMES.find((a) => a.key === asiAbility1)
                            ?.label
                        }
                        :{" "}
                        {
                          character[
                            asiAbility1 as keyof CharacterData
                          ] as number
                        }{" "}
                        {"->"}{" "}
                        {Math.min(
                          20,
                          (character[
                            asiAbility1 as keyof CharacterData
                          ] as number) + 2,
                        )}
                      </p>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <label
                        style={{
                          color: "#a89060",
                          fontSize: "11px",
                          fontFamily: "'Georgia', serif",
                          display: "block",
                          marginBottom: "6px",
                        }}
                      >
                        First ability (+1)
                      </label>
                      <select
                        value={asiAbility1}
                        onChange={(e) => {
                          setAsiAbility1(e.target.value);
                          setAsiError("");
                        }}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          background: "rgba(30,15,5,0.9)",
                          border: "1px solid rgba(201,168,76,0.4)",
                          borderRadius: "6px",
                          color: "#e8d5a3",
                          fontSize: "13px",
                          fontFamily: "'Georgia', serif",
                          outline: "none",
                        }}
                      >
                        <option value="">-- Select --</option>
                        {ABILITY_NAMES.map(({ key, label }) => {
                          const current = character[
                            key as keyof CharacterData
                          ] as number;
                          const capped = current >= 20;
                          return (
                            <option
                              key={key}
                              value={key}
                              disabled={capped || key === asiAbility2}
                            >
                              {label} ({current}
                              {capped ? " - MAX" : ` -> ${current + 1}`})
                            </option>
                          );
                        })}
                      </select>
                      {asiAbility1 && (
                        <p
                          style={{
                            color: "#c9a84c",
                            fontSize: "12px",
                            fontFamily: "'Georgia', serif",
                            marginTop: "4px",
                          }}
                        >
                          {
                            ABILITY_NAMES.find((a) => a.key === asiAbility1)
                              ?.label
                          }
                          :{" "}
                          {
                            character[
                              asiAbility1 as keyof CharacterData
                            ] as number
                          }{" "}
                          {"->"}{" "}
                          {Math.min(
                            20,
                            (character[
                              asiAbility1 as keyof CharacterData
                            ] as number) + 1,
                          )}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        style={{
                          color: "#a89060",
                          fontSize: "11px",
                          fontFamily: "'Georgia', serif",
                          display: "block",
                          marginBottom: "6px",
                        }}
                      >
                        Second ability (+1)
                      </label>
                      <select
                        value={asiAbility2}
                        onChange={(e) => {
                          setAsiAbility2(e.target.value);
                          setAsiError("");
                        }}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          background: "rgba(30,15,5,0.9)",
                          border: "1px solid rgba(201,168,76,0.4)",
                          borderRadius: "6px",
                          color: "#e8d5a3",
                          fontSize: "13px",
                          fontFamily: "'Georgia', serif",
                          outline: "none",
                        }}
                      >
                        <option value="">-- Select --</option>
                        {ABILITY_NAMES.map(({ key, label }) => {
                          const current = character[
                            key as keyof CharacterData
                          ] as number;
                          const capped = current >= 20;
                          return (
                            <option
                              key={key}
                              value={key}
                              disabled={capped || key === asiAbility1}
                            >
                              {label} ({current}
                              {capped ? " - MAX" : ` -> ${current + 1}`})
                            </option>
                          );
                        })}
                      </select>
                      {asiAbility2 && (
                        <p
                          style={{
                            color: "#c9a84c",
                            fontSize: "12px",
                            fontFamily: "'Georgia', serif",
                            marginTop: "4px",
                          }}
                        >
                          {
                            ABILITY_NAMES.find((a) => a.key === asiAbility2)
                              ?.label
                          }
                          :{" "}
                          {
                            character[
                              asiAbility2 as keyof CharacterData
                            ] as number
                          }{" "}
                          {"->"}{" "}
                          {Math.min(
                            20,
                            (character[
                              asiAbility2 as keyof CharacterData
                            ] as number) + 1,
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Feat browser */}
                <input
                  type="text"
                  placeholder="Search feats..."
                  value={featSearch}
                  onChange={(e) => setFeatSearch(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    background: "rgba(30,15,5,0.9)",
                    border: "1px solid rgba(201,168,76,0.4)",
                    borderRadius: "6px",
                    color: "#e8d5a3",
                    fontSize: "13px",
                    fontFamily: "'Georgia', serif",
                    outline: "none",
                    marginBottom: "10px",
                    boxSizing: "border-box",
                  }}
                />
                <div
                  style={{
                    maxHeight: "300px",
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  {filteredFeats.length === 0 && (
                    <p
                      style={{
                        color: "#a89060",
                        fontSize: "12px",
                        fontFamily: "'Georgia', serif",
                        fontStyle: "italic",
                        padding: "8px 0",
                      }}
                    >
                      No feats found.
                    </p>
                  )}
                  {filteredFeats.map((feat) => {
                    const isSelected = selectedFeat === feat.name;
                    // Build ability bonus summary
                    const abilityParts: string[] = [];
                    if (feat.abilityBonus?.fixed) {
                      for (const [abbr, bonus] of Object.entries(
                        feat.abilityBonus.fixed,
                      )) {
                        const name =
                          abbr === "str"
                            ? "STR"
                            : abbr === "dex"
                              ? "DEX"
                              : abbr === "con"
                                ? "CON"
                                : abbr === "int"
                                  ? "INT"
                                  : abbr === "wis"
                                    ? "WIS"
                                    : abbr === "cha"
                                      ? "CHA"
                                      : abbr.toUpperCase();
                        abilityParts.push(`+${bonus} ${name}`);
                      }
                    }
                    if (feat.abilityBonus?.choose) {
                      const fromNames = feat.abilityBonus.choose.from.map(
                        (a) =>
                          a === "str"
                            ? "STR"
                            : a === "dex"
                              ? "DEX"
                              : a === "con"
                                ? "CON"
                                : a === "int"
                                  ? "INT"
                                  : a === "wis"
                                    ? "WIS"
                                    : a === "cha"
                                      ? "CHA"
                                      : a.toUpperCase(),
                      );
                      abilityParts.push(
                        `Choose +${feat.abilityBonus.choose.amount} from ${fromNames.join("/")}`,
                      );
                    }
                    const abilitySummary = abilityParts.join(", ");
                    const fullDesc = feat.entries.join(" ");
                    const isFeatExpanded = expandedFeat === feat.name;
                    const needsTruncation = fullDesc.length > 120;
                    const truncated = needsTruncation
                      ? fullDesc.slice(0, 120).replace(/\s\S*$/, "") + "..."
                      : fullDesc;

                    return (
                      <div
                        key={feat.name}
                        onClick={() => {
                          setSelectedFeat(feat.name);
                          setFeatAbilityChoices([]);
                          setAsiError("");
                        }}
                        style={{
                          background: isSelected
                            ? "rgba(201,168,76,0.15)"
                            : "rgba(0,0,0,0.3)",
                          border: isSelected
                            ? "1px solid rgba(201,168,76,0.5)"
                            : "1px solid rgba(201,168,76,0.15)",
                          borderRadius: "6px",
                          padding: "10px 14px",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "4px",
                          }}
                        >
                          <span
                            style={{
                              color: isSelected ? "#c9a84c" : "#a89060",
                              fontSize: "13px",
                            }}
                          >
                            {isSelected ? "\u25C9" : "\u25CB"}
                          </span>
                          <span
                            style={{
                              color: "#e8d5a3",
                              fontSize: "13px",
                              fontFamily: "'Georgia', serif",
                              fontWeight: isSelected ? "bold" : "normal",
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
                        </div>
                        {abilitySummary && (
                          <p
                            style={{
                              color: "#c9a84c",
                              fontSize: "11px",
                              fontFamily: "'Georgia', serif",
                              margin: "0 0 2px 21px",
                            }}
                          >
                            {abilitySummary}
                          </p>
                        )}
                        {feat.prerequisiteText && (
                          <p
                            style={{
                              color: "#8a7050",
                              fontSize: "10px",
                              fontFamily: "'Georgia', serif",
                              margin: "0 0 2px 21px",
                              fontStyle: "italic",
                            }}
                          >
                            Requires: {feat.prerequisiteText}
                          </p>
                        )}
                        <div style={{ margin: "0 0 0 21px" }}>
                          {isFeatExpanded ? (
                            <>
                              {feat.entries.map((entry, i) => (
                                <p
                                  key={i}
                                  style={{
                                    color: "#e8d5a3",
                                    fontSize: "12px",
                                    fontFamily: "'Georgia', serif",
                                    lineHeight: 1.5,
                                    margin: "0 0 4px 0",
                                  }}
                                >
                                  {entry}
                                </p>
                              ))}
                              {needsTruncation && (
                                <span
                                  onClick={(e) => { e.stopPropagation(); setExpandedFeat(""); }}
                                  style={{ color: "#c9a84c", fontSize: "11px", fontFamily: "'Georgia', serif", cursor: "pointer" }}
                                >
                                  Show less
                                </span>
                              )}
                            </>
                          ) : (
                            <p
                              style={{
                                color: "#a89060",
                                fontSize: "11px",
                                fontFamily: "'Georgia', serif",
                                margin: 0,
                                lineHeight: 1.4,
                              }}
                            >
                              {truncated}
                              {needsTruncation && (
                                <span
                                  onClick={(e) => { e.stopPropagation(); setExpandedFeat(feat.name); }}
                                  style={{ color: "#c9a84c", cursor: "pointer", marginLeft: "4px" }}
                                >
                                  Read more
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Feat ability bonus choice dropdowns */}
                {selectedFeatData?.abilityBonus?.choose && (
                  <div style={{ marginTop: "12px" }}>
                    <p
                      style={{
                        color: "#b8934a",
                        fontSize: "11px",
                        fontFamily: "'Georgia', serif",
                        marginBottom: "6px",
                      }}
                    >
                      Choose {selectedFeatData.abilityBonus.choose.count}{" "}
                      ability score
                      {selectedFeatData.abilityBonus.choose.count > 1
                        ? "s"
                        : ""}{" "}
                      to increase by +
                      {selectedFeatData.abilityBonus.choose.amount}:
                    </p>
                    {Array.from({
                      length: selectedFeatData.abilityBonus.choose.count,
                    }).map((_, idx) => (
                      <select
                        key={`feat-ability-${idx}`}
                        value={featAbilityChoices[idx] ?? ""}
                        onChange={(e) => {
                          const newChoices = [...featAbilityChoices];
                          newChoices[idx] = e.target.value;
                          setFeatAbilityChoices(newChoices);
                          setAsiError("");
                        }}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          background: "rgba(30,15,5,0.9)",
                          border: "1px solid rgba(201,168,76,0.4)",
                          borderRadius: "6px",
                          color: "#e8d5a3",
                          fontSize: "13px",
                          fontFamily: "'Georgia', serif",
                          outline: "none",
                          marginBottom: "6px",
                        }}
                      >
                        <option value="">-- Select --</option>
                        {selectedFeatData!.abilityBonus!.choose!.from.map(
                          (abbr) => {
                            const label =
                              abbr === "str"
                                ? "STR"
                                : abbr === "dex"
                                  ? "DEX"
                                  : abbr === "con"
                                    ? "CON"
                                    : abbr === "int"
                                      ? "INT"
                                      : abbr === "wis"
                                        ? "WIS"
                                        : abbr === "cha"
                                          ? "CHA"
                                          : abbr.toUpperCase();
                            const fullName =
                              abbr === "str"
                                ? "strength"
                                : abbr === "dex"
                                  ? "dexterity"
                                  : abbr === "con"
                                    ? "constitution"
                                    : abbr === "int"
                                      ? "intelligence"
                                      : abbr === "wis"
                                        ? "wisdom"
                                        : abbr === "cha"
                                          ? "charisma"
                                          : abbr;
                            const current = character[
                              fullName as keyof CharacterData
                            ] as number;
                            const capped = current >= 20;
                            const alreadyChosen = featAbilityChoices.some(
                              (c, i) => i !== idx && c === abbr,
                            );
                            return (
                              <option
                                key={abbr}
                                value={abbr}
                                disabled={capped || alreadyChosen}
                              >
                                {label} ({current}
                                {capped
                                  ? " - MAX"
                                  : ` -> ${Math.min(20, current + (selectedFeatData!.abilityBonus!.choose!.amount ?? 1))}`}
                                )
                              </option>
                            );
                          },
                        )}
                      </select>
                    ))}
                  </div>
                )}
              </>
            )}

            {asiError && (
              <p
                style={{
                  color: "#e74c3c",
                  fontSize: "12px",
                  fontFamily: "'Georgia', serif",
                  marginTop: "8px",
                }}
              >
                {asiError}
              </p>
            )}
          </div>
        )}

        <div style={{ marginBottom: "20px" }}>
          <p
            style={{
              color: "#b8934a",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontFamily: "'Georgia', serif",
              marginBottom: "6px",
            }}
          >
            New Maximum HP
          </p>
          <p
            style={{
              color: "#a89060",
              fontSize: "12px",
              fontFamily: "'Georgia', serif",
              marginBottom: "10px",
            }}
          >
            Suggested: {character.maxHp} + {hitDieAvg} (avg die) +{" "}
            {conMod >= 0 ? `+${conMod}` : conMod} (CON) = {suggestedHp}
          </p>
          <input
            type="number"
            min={1}
            value={newMaxHp}
            onChange={(e) => setNewMaxHp(e.target.value)}
            style={{
              width: "120px",
              padding: "10px 12px",
              background: "rgba(30,15,5,0.9)",
              border: "1px solid rgba(201,168,76,0.5)",
              borderRadius: "6px",
              color: "#e8d5a3",
              fontSize: "16px",
              fontFamily: "'Georgia', serif",
              outline: "none",
              textAlign: "center",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => void handleConfirm()}
            disabled={isPending}
            style={{
              background: "linear-gradient(135deg, #8b6914, #c9a84c)",
              color: "#1a1a2e",
              border: "none",
              borderRadius: "6px",
              padding: "10px 24px",
              fontSize: "14px",
              fontFamily: "'Georgia', serif",
              fontWeight: "bold",
              cursor: isPending ? "not-allowed" : "pointer",
              opacity: isPending ? 0.7 : 1,
              letterSpacing: "0.5px",
            }}
          >
            {isPending ? "Leveling Up..." : "Confirm Level Up"}
          </button>
          <button
            onClick={onClose}
            disabled={isPending}
            style={{
              background: "transparent",
              border: "1px solid rgba(201,168,76,0.4)",
              color: "#a89060",
              borderRadius: "6px",
              padding: "10px 20px",
              fontSize: "14px",
              fontFamily: "'Georgia', serif",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>

        {levelUp.error && (
          <p
            style={{
              color: "#e74c3c",
              fontSize: "12px",
              fontFamily: "'Georgia', serif",
              marginTop: "12px",
            }}
          >
            {levelUp.error.message}
          </p>
        )}
        {updateSubclass.error && (
          <p
            style={{
              color: "#e74c3c",
              fontSize: "12px",
              fontFamily: "'Georgia', serif",
              marginTop: "12px",
            }}
          >
            {updateSubclass.error.message}
          </p>
        )}
        {updateSkillExpertise.error && (
          <p
            style={{
              color: "#e74c3c",
              fontSize: "12px",
              fontFamily: "'Georgia', serif",
              marginTop: "12px",
            }}
          >
            {updateSkillExpertise.error.message}
          </p>
        )}
        {updateAbilityScores.error && (
          <p
            style={{
              color: "#e74c3c",
              fontSize: "12px",
              fontFamily: "'Georgia', serif",
              marginTop: "12px",
            }}
          >
            {updateAbilityScores.error.message}
          </p>
        )}
        {updateFeats.error && (
          <p
            style={{
              color: "#e74c3c",
              fontSize: "12px",
              fontFamily: "'Georgia', serif",
              marginTop: "12px",
            }}
          >
            {updateFeats.error.message}
          </p>
        )}
        {updateLanguages.error && (
          <p
            style={{
              color: "#e74c3c",
              fontSize: "12px",
              fontFamily: "'Georgia', serif",
              marginTop: "12px",
            }}
          >
            {updateLanguages.error.message}
          </p>
        )}
        {updateLevelUpSelections.error && (
          <p
            style={{
              color: "#e74c3c",
              fontSize: "12px",
              fontFamily: "'Georgia', serif",
              marginTop: "12px",
            }}
          >
            {updateLevelUpSelections.error.message}
          </p>
        )}
      </div>
    </div>
  );
}
