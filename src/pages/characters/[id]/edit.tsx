import Head from "next/head";
import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { useIsMobile } from "@/hooks/useIsMobile";
import { api } from "@/utils/api";
import { getClassByNameAndSource } from "@/lib/classData";
import { BACKGROUNDS } from "@/lib/backgroundData";
import type { Background } from "@/lib/backgroundData";
import { classHasExpertise, getExpertiseCountAtLevel } from "@/lib/expertiseData";
import { getRaceByNameAndSource, getRaceByName } from "@/lib/raceData";
import {
  IdentitySection,
  LanguageSection,
  SkillProficiencySection,
  SkillExpertiseSection,
  CombatSection,
  BackstorySection,
  ABILITY_NAMES,
  type AbilityName,
  type FormState,
  labelStyle,
  inputStyle,
  sectionTitleStyle,
} from "@/components/character-creation";

// ---------------------------------------------------------------------------
// Simple ability score inputs — scores already include racial bonuses
// ---------------------------------------------------------------------------

function AbilityScoreEditSection({
  form,
  isLoading,
  onChange,
}: {
  form: FormState;
  isLoading: boolean;
  onChange: (name: string, value: number) => void;
}) {
  const labels: Record<AbilityName, string> = {
    strength: "STR",
    dexterity: "DEX",
    constitution: "CON",
    intelligence: "INT",
    wisdom: "WIS",
    charisma: "CHA",
  };

  return (
    <div>
      <h3 style={sectionTitleStyle}>Ability Scores</h3>
      <p style={{ color: "#a89060", fontSize: "11px", fontFamily: "'EB Garamond', 'Georgia', serif", marginBottom: "14px" }}>
        These values already include any racial bonuses applied during creation.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
        {ABILITY_NAMES.map((ability) => (
          <div key={ability}>
            <label style={labelStyle}>{labels[ability]}</label>
            <input
              type="number"
              min={1}
              max={30}
              value={form[ability]}
              disabled={isLoading}
              onChange={(e) => onChange(ability, parseInt(e.target.value) || 0)}
              style={inputStyle}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edit character content
// ---------------------------------------------------------------------------

function EditCharacterContent() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { id } = router.query;
  const charId = typeof id === "string" ? id : "";

  const { data: character, isLoading: isLoadingChar } = api.character.getById.useQuery(
    { id: charId },
    { enabled: !!charId },
  );

  const [form, setForm] = useState<FormState>({
    name: "",
    rulesSource: "PHB",
    characterClass: "",
    race: "",
    alignment: "True Neutral",
    background: "",
    backstory: "",
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    maxHp: 10,
    armorClass: 10,
    speed: 30,
    languages: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [selectedBgChoiceSkills, setSelectedBgChoiceSkills] = useState<string[]>([]);
  const [selectedClassSkills, setSelectedClassSkills] = useState<string[]>([]);
  const [selectedExpertiseSkills, setSelectedExpertiseSkills] = useState<string[]>([]);

  // Pre-fill form when character data arrives
  useEffect(() => {
    if (!character || initialized) return;

    const parsedLanguages: string[] = (() => {
      if (!character.languages) return [];
      try { return JSON.parse(character.languages) as string[]; } catch { return []; }
    })();

    const parsedSkills: string[] = (() => {
      if (!(character as Record<string, unknown>).skillProficiencies) return [];
      try { return JSON.parse((character as Record<string, unknown>).skillProficiencies as string) as string[]; } catch { return []; }
    })();

    const parsedExpertise: string[] = (() => {
      if (!(character as Record<string, unknown>).skillExpertise) return [];
      try { return JSON.parse((character as Record<string, unknown>).skillExpertise as string) as string[]; } catch { return []; }
    })();

    setForm({
      name: character.name,
      rulesSource: (character.rulesSource as "PHB" | "XPHB") ?? "PHB",
      characterClass: character.characterClass,
      race: character.race,
      alignment: character.alignment ?? "True Neutral",
      background: character.background ?? "",
      backstory: character.backstory ?? "",
      strength: character.strength,
      dexterity: character.dexterity,
      constitution: character.constitution,
      intelligence: character.intelligence,
      wisdom: character.wisdom,
      charisma: character.charisma,
      maxHp: character.maxHp,
      armorClass: character.armorClass,
      speed: character.speed,
      languages: parsedLanguages,
    });

    // Distribute stored skills into bg-choice and class buckets
    // We treat all stored skills as "selected class skills" for simplicity during edit,
    // since we cannot perfectly reconstruct which came from bg vs class vs race.
    setSelectedClassSkills(parsedSkills);
    setSelectedExpertiseSkills(parsedExpertise);
    setInitialized(true);
  }, [character, initialized]);

  const updateCharacter = api.character.update.useMutation({
    onSuccess: () => {
      void router.push(`/characters/${charId}`);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const backgroundInfo: Background | undefined = useMemo(
    () => BACKGROUNDS.find((b) => b.name === form.background),
    [form.background],
  );

  const classInfo = useMemo(
    () => (form.characterClass ? getClassByNameAndSource(form.characterClass, form.rulesSource) : undefined),
    [form.characterClass, form.rulesSource],
  );

  const raceInfo = useMemo(() => {
    if (!form.race) return undefined;
    const exactMatch = getRaceByNameAndSource(form.race, form.rulesSource);
    if (exactMatch) return exactMatch;
    return getRaceByName(form.race);
  }, [form.race, form.rulesSource]);

  const racialFixedSkills = useMemo(() => raceInfo?.skillProficiencies ?? [], [raceInfo]);

  const bgFixedSkills = backgroundInfo?.skillProficiencies ?? [];
  const bgChoiceFrom = backgroundInfo?.skillChoices?.from ?? [];
  const bgChoiceCount = backgroundInfo?.skillChoices?.count ?? 0;

  const classSkillFrom = classInfo?.skillChoices.from ?? [];
  const classSkillCount = classInfo?.skillChoices.count ?? 0;
  const classIsAnySkill = classSkillFrom.length === 1 && classSkillFrom[0] === "Any skill";

  const allSelectedSkills = useMemo(() => {
    const skills = new Set<string>();
    racialFixedSkills.forEach((s) => skills.add(s));
    bgFixedSkills.forEach((s) => skills.add(s));
    selectedBgChoiceSkills.forEach((s) => skills.add(s));
    selectedClassSkills.forEach((s) => skills.add(s));
    return Array.from(skills).sort();
  }, [racialFixedSkills, bgFixedSkills, selectedBgChoiceSkills, selectedClassSkills]);

  const lockedByBackground = useMemo(() => {
    const set = new Set<string>();
    racialFixedSkills.forEach((s) => set.add(s));
    bgFixedSkills.forEach((s) => set.add(s));
    selectedBgChoiceSkills.forEach((s) => set.add(s));
    return set;
  }, [racialFixedSkills, bgFixedSkills, selectedBgChoiceSkills]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? (parseInt(value) || 0) : value,
    }));

    if (name === "background") {
      setSelectedBgChoiceSkills([]);
      setSelectedExpertiseSkills([]);
    }
    if (name === "characterClass") {
      setSelectedClassSkills([]);
      setSelectedExpertiseSkills([]);
    }
    if (name === "rulesSource") {
      setForm((prev) => ({ ...prev, characterClass: "" }));
      setSelectedClassSkills([]);
      setSelectedExpertiseSkills([]);
    }
  };

  const handleRulesSourceChange = (source: "PHB" | "XPHB") => {
    setForm((prev) => ({ ...prev, rulesSource: source, characterClass: "" }));
    setSelectedClassSkills([]);
  };

  const handleAbilityChange = (name: string, value: number) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLanguagesChange = useCallback((languages: string[]) => {
    setForm((prev) => ({ ...prev, languages }));
  }, []);

  const handleUseBackstory = useCallback((text: string) => {
    setForm((prev) => ({
      ...prev,
      backstory: prev.backstory ? `${prev.backstory}\n\n${text}` : text,
    }));
  }, []);

  const toggleBgChoiceSkill = (skill: string) => {
    setSelectedBgChoiceSkills((prev) => {
      if (prev.includes(skill)) {
        setSelectedExpertiseSkills((ep) => ep.filter((s) => s !== skill));
        return prev.filter((s) => s !== skill);
      }
      if (prev.length >= bgChoiceCount) return prev;
      return [...prev, skill];
    });
  };

  const toggleClassSkill = (skill: string) => {
    setSelectedClassSkills((prev) => {
      if (prev.includes(skill)) {
        setSelectedExpertiseSkills((ep) => ep.filter((s) => s !== skill));
        return prev.filter((s) => s !== skill);
      }
      if (prev.length >= classSkillCount) return prev;
      return [...prev, skill];
    });
  };

  const expertiseCount = getExpertiseCountAtLevel(
    form.characterClass,
    form.rulesSource,
    character?.level ?? 1,
  );

  const toggleExpertiseSkill = (skill: string) => {
    setSelectedExpertiseSkills((prev) => {
      if (prev.includes(skill)) return prev.filter((s) => s !== skill);
      if (prev.length >= expertiseCount) return prev;
      return [...prev, skill];
    });
  };

  const showExpertiseSection =
    classHasExpertise(form.characterClass, form.rulesSource) &&
    expertiseCount > 0 &&
    allSelectedSkills.length > 0;

  const showSkillSection = form.background || form.characterClass;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.characterClass || !form.race) return;

    updateCharacter.mutate({
      id: charId,
      name: form.name,
      rulesSource: form.rulesSource,
      characterClass: form.characterClass,
      race: form.race,
      alignment: form.alignment as Parameters<typeof updateCharacter.mutate>[0]["alignment"],
      background: form.background || undefined,
      backstory: form.backstory || undefined,
      languages: form.languages.length > 0 ? JSON.stringify(form.languages) : undefined,
      skillProficiencies: allSelectedSkills.length > 0 ? JSON.stringify(allSelectedSkills) : undefined,
      skillExpertise: selectedExpertiseSkills.length > 0 ? JSON.stringify(selectedExpertiseSkills) : undefined,
      strength: form.strength,
      dexterity: form.dexterity,
      constitution: form.constitution,
      intelligence: form.intelligence,
      wisdom: form.wisdom,
      charisma: form.charisma,
      maxHp: form.maxHp,
      armorClass: form.armorClass,
      speed: form.speed,
    });
  };

  const isLoading = updateCharacter.isPending;

  // --- Loading / error states ---

  if (isLoadingChar || !charId) {
    return (
      <p style={{ color: "#a89060", fontFamily: "'EB Garamond', 'Georgia', serif", fontSize: "14px" }}>
        Summoning your adventurer...
      </p>
    );
  }

  if (!character) {
    return (
      <div style={{
        background: "rgba(139,42,30,0.2)",
        border: "1px solid #8b2a1e",
        borderRadius: "6px",
        padding: "16px 20px",
        color: "#e8d5a3",
        fontSize: "14px",
        fontFamily: "'EB Garamond', 'Georgia', serif",
        maxWidth: "500px",
      }}>
        Character not found.
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Edit {character.name} — DnD Tool</title>
      </Head>
      <div style={{ maxWidth: "700px" }}>
        <h1 style={{
          color: "#c9a84c",
          fontSize: isMobile ? "20px" : "26px",
          fontWeight: "bold",
          letterSpacing: "2px",
          textTransform: "uppercase",
          marginBottom: "8px",
        }}>
          Edit Character
        </h1>
        <p style={{ color: "#a89060", fontSize: "14px", marginBottom: "16px" }}>
          Rewrite the tale of <span style={{ color: "#c9a84c" }}>{character.name}</span>.
        </p>

        {/* Read-only level display */}
        <p style={{
          color: "#a89060",
          fontSize: "12px",
          fontFamily: "'EB Garamond', 'Georgia', serif",
          marginBottom: "32px",
        }}>
          Level: <span style={{ color: "#c9a84c", fontWeight: "bold" }}>{character.level}</span>
          <span style={{ color: "#6a5a3a", marginLeft: "8px", fontSize: "11px" }}>(not editable)</span>
        </p>

        <div style={{ width: "80px", height: "2px", background: "#c9a84c", marginBottom: "32px", opacity: 0.6 }} />

        <form onSubmit={handleSubmit}>
          <div style={{
            background: "rgba(0,0,0,0.6)",
            border: "2px solid #c9a84c",
            borderRadius: "12px",
            boxShadow: "0 0 40px rgba(201,168,76,0.3), inset 0 0 60px rgba(0,0,0,0.5)",
            padding: isMobile ? "20px 16px" : "36px 32px",
            display: "flex",
            flexDirection: "column",
            gap: "28px",
          }}>

            {/* Identity */}
            <IdentitySection
              form={form}
              isLoading={isLoading}
              onFormChange={handleChange}
              onRulesSourceChange={handleRulesSourceChange}
            />

            {/* Languages */}
            <LanguageSection
              raceInfo={raceInfo}
              backgroundLanguageChoiceCount={backgroundInfo?.languageChoiceCount}
              backgroundFixedLanguages={backgroundInfo?.fixedLanguages}
              backgroundName={backgroundInfo?.name}
              selectedLanguages={form.languages}
              onLanguagesChange={handleLanguagesChange}
            />

            {/* Skill Proficiencies */}
            {(showSkillSection || racialFixedSkills.length > 0) && (
              <SkillProficiencySection
                raceName={raceInfo?.name}
                racialFixedSkills={racialFixedSkills}
                backgroundInfo={backgroundInfo}
                classInfo={classInfo}
                selectedBgChoiceSkills={selectedBgChoiceSkills}
                selectedClassSkills={selectedClassSkills}
                allSelectedSkills={allSelectedSkills}
                lockedByBackground={lockedByBackground}
                bgChoiceCount={bgChoiceCount}
                bgChoiceFrom={bgChoiceFrom}
                classSkillCount={classSkillCount}
                classSkillFrom={classSkillFrom}
                classIsAnySkill={classIsAnySkill}
                onToggleBgChoiceSkill={toggleBgChoiceSkill}
                onToggleClassSkill={toggleClassSkill}
              />
            )}

            {/* Skill Expertise */}
            {showExpertiseSection && (
              <SkillExpertiseSection
                characterClass={form.characterClass}
                expertiseCount={expertiseCount}
                allSelectedSkills={allSelectedSkills}
                selectedExpertiseSkills={selectedExpertiseSkills}
                onToggleExpertiseSkill={toggleExpertiseSkill}
              />
            )}

            {/* Ability Scores — simple inputs, bonuses already baked in */}
            <AbilityScoreEditSection
              form={form}
              isLoading={isLoading}
              onChange={handleAbilityChange}
            />

            {/* Combat Stats */}
            <CombatSection
              form={form}
              isLoading={isLoading}
              onFormChange={handleChange}
              naturalArmorAC={null}
            />

            {/* Backstory */}
            <BackstorySection
              backstory={form.backstory}
              characterClass={form.characterClass}
              isLoading={isLoading}
              onFormChange={handleChange}
              onAppendBackstory={handleUseBackstory}
            />

            {error && (
              <div style={{
                background: "rgba(139,42,30,0.2)",
                border: "1px solid #8b2a1e",
                borderRadius: "6px",
                padding: "12px 16px",
                color: "#e8d5a3",
                fontSize: "14px",
                fontFamily: "'EB Garamond', 'Georgia', serif",
              }}>
                {error}
              </div>
            )}

            <div style={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              gap: "12px",
              justifyContent: "flex-end",
              paddingTop: "8px",
            }}>
              <button
                type="button"
                onClick={() => void router.push(`/characters/${charId}`)}
                disabled={isLoading}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(201,168,76,0.5)",
                  color: "#c9a84c",
                  borderRadius: "4px",
                  padding: "10px 20px",
                  fontFamily: "'EB Garamond', 'Georgia', serif",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  background: "linear-gradient(135deg, #8b6914, #c9a84c)",
                  color: "#1a1a2e",
                  border: "none",
                  borderRadius: "6px",
                  padding: "12px 28px",
                  fontSize: "14px",
                  fontFamily: "'EB Garamond', 'Georgia', serif",
                  fontWeight: "bold",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  opacity: isLoading ? 0.7 : 1,
                  letterSpacing: "0.5px",
                }}
              >
                {isLoading ? "Saving your legend..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

export default function EditCharacterPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <EditCharacterContent />
      </Layout>
    </ProtectedRoute>
  );
}
