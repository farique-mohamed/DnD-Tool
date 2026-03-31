import Head from "next/head";
import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { useIsMobile } from "@/hooks/useIsMobile";
import { ThisIsYourLifeGenerator } from "@/components/ThisIsYourLifeGenerator";
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
  AbilityScoreSection,
  CombatSection,
  BackstorySection,
  ABILITY_NAMES,
  type AbilityName,
  type FormState,
} from "@/components/character-creation";

function CreateCharacterContent() {
  const router = useRouter();
  const isMobile = useIsMobile();
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
  const [selectedBgChoiceSkills, setSelectedBgChoiceSkills] = useState<string[]>([]);
  const [selectedClassSkills, setSelectedClassSkills] = useState<string[]>([]);
  const [selectedExpertiseSkills, setSelectedExpertiseSkills] = useState<string[]>([]);

  // Racial ASI state (PHB choice bonuses, e.g., Half-Elf)
  const [racialAsiChoices, setRacialAsiChoices] = useState<string[]>([]);

  // XPHB universal ASI state
  const [xphbAsiMode, setXphbAsiMode] = useState<"2-1" | "1-1-1">("2-1");
  const [xphbAsiChoices, setXphbAsiChoices] = useState<Record<string, number>>({});

  const createCharacter = api.character.create.useMutation({
    onSuccess: () => {
      void router.push("/characters");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  // Resolve current background and class info
  const backgroundInfo: Background | undefined = useMemo(
    () => BACKGROUNDS.find((b) => b.name === form.background),
    [form.background],
  );

  const classInfo = useMemo(
    () => (form.characterClass ? getClassByNameAndSource(form.characterClass, form.rulesSource) : undefined),
    [form.characterClass, form.rulesSource],
  );

  // Look up the selected race's structured data
  const raceInfo = useMemo(
    () => {
      if (!form.race) return undefined;
      // Try exact match with selected rules source first (for races that exist in both PHB and XPHB)
      const exactMatch = getRaceByNameAndSource(form.race, form.rulesSource);
      if (exactMatch) return exactMatch;
      // Fall back to any source (for races from VGM, MPMM, VRGR, etc.)
      return getRaceByName(form.race);
    },
    [form.race, form.rulesSource],
  );

  // Compute racial ability score bonuses per ability
  const racialBonuses: Record<AbilityName, number> = useMemo(() => {
    const bonuses: Record<AbilityName, number> = {
      strength: 0, dexterity: 0, constitution: 0,
      intelligence: 0, wisdom: 0, charisma: 0,
    };

    if (form.rulesSource === "XPHB") {
      // XPHB: use player's universal ASI choices
      for (const [ability, amount] of Object.entries(xphbAsiChoices)) {
        if (ABILITY_NAMES.includes(ability as AbilityName)) {
          bonuses[ability as AbilityName] += amount;
        }
      }
      return bonuses;
    }

    // PHB: use race-specific abilityBonuses
    if (!raceInfo?.abilityBonuses) return bonuses;

    for (const bonus of raceInfo.abilityBonuses) {
      if (bonus.ability === "all") {
        for (const ab of ABILITY_NAMES) {
          bonuses[ab] += bonus.amount;
        }
      } else if (bonus.ability === "choice") {
        // Apply choices from racialAsiChoices
        for (const chosen of racialAsiChoices) {
          if (ABILITY_NAMES.includes(chosen as AbilityName)) {
            bonuses[chosen as AbilityName] += bonus.amount;
          }
        }
      } else if (ABILITY_NAMES.includes(bonus.ability as AbilityName)) {
        bonuses[bonus.ability as AbilityName] += bonus.amount;
      }
    }
    return bonuses;
  }, [form.rulesSource, raceInfo, racialAsiChoices, xphbAsiChoices]);

  // Reset ASI choices when race or rulesSource changes
  const prevRaceRef = useMemo(() => ({ race: form.race, source: form.rulesSource }), [form.race, form.rulesSource]);
  useEffect(() => {
    setRacialAsiChoices([]);
    setXphbAsiChoices({});
  }, [prevRaceRef]);

  // Auto-populate fixed languages when race changes
  useEffect(() => {
    if (!raceInfo) {
      setForm((prev) => ({ ...prev, languages: [] }));
      return;
    }
    const fixed = raceInfo.languages.filter(
      (l) =>
        !l.toLowerCase().includes("extra language") &&
        !l.toLowerCase().includes("other languages"),
    );
    setForm((prev) => ({ ...prev, languages: [...fixed] }));
  }, [raceInfo]);

  // Racial fixed skill proficiencies
  const racialFixedSkills = useMemo(() => raceInfo?.skillProficiencies ?? [], [raceInfo]);

  // Natural Armor AC auto-calculation (Bearfolk-style: 12 + CON modifier)
  const hasNaturalArmor = useMemo(
    () => raceInfo?.traits.some((t) => t.name === "Natural Armor" && t.description.includes("12 + your Constitution modifier")) ?? false,
    [raceInfo],
  );
  const naturalArmorAC = useMemo(() => {
    if (!hasNaturalArmor) return null;
    const totalCon = form.constitution + racialBonuses.constitution;
    const conMod = Math.floor((totalCon - 10) / 2);
    return 12 + conMod;
  }, [hasNaturalArmor, form.constitution, racialBonuses.constitution]);

  // Auto-set AC when Natural Armor is active and race/CON changes
  useEffect(() => {
    if (naturalArmorAC !== null) {
      setForm((prev) => ({ ...prev, armorClass: naturalArmorAC }));
    }
  }, [naturalArmorAC]);

  // Fixed skills from background (auto-selected, locked)
  const bgFixedSkills = backgroundInfo?.skillProficiencies ?? [];

  // Background choice skills
  const bgChoiceFrom = backgroundInfo?.skillChoices?.from ?? [];
  const bgChoiceCount = backgroundInfo?.skillChoices?.count ?? 0;

  // Class skill choices
  const classSkillFrom = classInfo?.skillChoices.from ?? [];
  const classSkillCount = classInfo?.skillChoices.count ?? 0;
  const classIsAnySkill = classSkillFrom.length === 1 && classSkillFrom[0] === "Any skill";

  // Combine all selected skills for submission
  const allSelectedSkills = useMemo(() => {
    const skills = new Set<string>();
    racialFixedSkills.forEach((s) => skills.add(s));
    bgFixedSkills.forEach((s) => skills.add(s));
    selectedBgChoiceSkills.forEach((s) => skills.add(s));
    selectedClassSkills.forEach((s) => skills.add(s));
    return Array.from(skills).sort();
  }, [racialFixedSkills, bgFixedSkills, selectedBgChoiceSkills, selectedClassSkills]);

  // Skills already locked (from race + bg fixed + bg choices) — class choices cannot pick these
  const lockedByBackground = useMemo(() => {
    const set = new Set<string>();
    racialFixedSkills.forEach((s) => set.add(s));
    bgFixedSkills.forEach((s) => set.add(s));
    selectedBgChoiceSkills.forEach((s) => set.add(s));
    return set;
  }, [racialFixedSkills, bgFixedSkills, selectedBgChoiceSkills]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? (parseInt(value) || 0) : value,
    }));

    // Reset skill selections when background or class changes
    if (name === "background") {
      setSelectedBgChoiceSkills([]);
      setSelectedExpertiseSkills([]);
    }
    if (name === "characterClass") {
      setSelectedClassSkills([]);
      setSelectedExpertiseSkills([]);
    }
    // Reset racial ASI choices when race changes
    if (name === "race") {
      setRacialAsiChoices([]);
      setXphbAsiChoices({});
    }
    // Reset class selection when rulebook changes (features differ between versions)
    if (name === "rulesSource") {
      setForm((prev) => ({ ...prev, characterClass: "" }));
      setSelectedClassSkills([]);
      setSelectedExpertiseSkills([]);
      setRacialAsiChoices([]);
      setXphbAsiChoices({});
    }
  };

  const handleRulesSourceChange = (source: "PHB" | "XPHB") => {
    setForm((prev) => ({ ...prev, rulesSource: source, characterClass: "" }));
    setSelectedClassSkills([]);
  };

  const handleAbilityChange = (name: string, value: number) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleXphbAsiModeChange = (mode: "2-1" | "1-1-1") => {
    setXphbAsiMode(mode);
    setXphbAsiChoices({});
  };

  const handleLanguagesChange = useCallback((languages: string[]) => {
    setForm((prev) => ({ ...prev, languages }));
  }, []);

  const handleUseBackstory = useCallback((text: string) => {
    setForm((prev) => ({
      ...prev,
      backstory: prev.backstory ? `${prev.backstory}\n\n${text}` : text,
    }));
    document.getElementById("backstory")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const toggleBgChoiceSkill = (skill: string) => {
    setSelectedBgChoiceSkills((prev) => {
      if (prev.includes(skill)) {
        // If removing a proficient skill, also remove it from expertise
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
        // If removing a proficient skill, also remove it from expertise
        setSelectedExpertiseSkills((ep) => ep.filter((s) => s !== skill));
        return prev.filter((s) => s !== skill);
      }
      if (prev.length >= classSkillCount) return prev;
      return [...prev, skill];
    });
  };

  const expertiseCount = getExpertiseCountAtLevel(form.characterClass, form.rulesSource, 1);

  const toggleExpertiseSkill = (skill: string) => {
    setSelectedExpertiseSkills((prev) => {
      if (prev.includes(skill)) {
        return prev.filter((s) => s !== skill);
      }
      if (prev.length >= expertiseCount) return prev;
      return [...prev, skill];
    });
  };

  // Whether expertise section should show (source-aware)
  const showExpertiseSection = classHasExpertise(form.characterClass, form.rulesSource) && expertiseCount > 0 && allSelectedSkills.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.characterClass || !form.race) return;
    createCharacter.mutate({
      name: form.name,
      rulesSource: form.rulesSource,
      characterClass: form.characterClass,
      race: form.race,
      level: 1 as const,
      alignment: form.alignment as Parameters<typeof createCharacter.mutate>[0]["alignment"],
      background: form.background || undefined,
      backstory: form.backstory || undefined,
      languages: form.languages.length > 0 ? JSON.stringify(form.languages) : undefined,
      skillProficiencies: allSelectedSkills.length > 0 ? JSON.stringify(allSelectedSkills) : undefined,
      skillExpertise: selectedExpertiseSkills.length > 0 ? JSON.stringify(selectedExpertiseSkills) : undefined,
      strength: form.strength + racialBonuses.strength,
      dexterity: form.dexterity + racialBonuses.dexterity,
      constitution: form.constitution + racialBonuses.constitution,
      intelligence: form.intelligence + racialBonuses.intelligence,
      wisdom: form.wisdom + racialBonuses.wisdom,
      charisma: form.charisma + racialBonuses.charisma,
      maxHp: form.maxHp,
      armorClass: form.armorClass,
      speed: form.speed,
    });
  };

  const isLoading = createCharacter.isPending;

  // Whether skill proficiency section should show
  const showSkillSection = form.background || form.characterClass;

  return (
    <>
      <Head>
        <title>Create Character — DnD Tool</title>
      </Head>
      <div style={{ maxWidth: "700px" }}>
        <h1 style={{ color: "#c9a84c", fontSize: isMobile ? "20px" : "26px", fontWeight: "bold", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>
          Create New Character
        </h1>
        <p style={{ color: "#a89060", fontSize: "14px", marginBottom: "32px" }}>
          Breathe life into a new hero — or villain.
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

            {/* Basic Info */}
            <IdentitySection
              form={form}
              isLoading={isLoading}
              onFormChange={handleChange}
              onRulesSourceChange={handleRulesSourceChange}
            />

            {/* Languages */}
            <LanguageSection
              raceInfo={raceInfo}
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

            {/* Skill Expertise (Rogue / Bard at level 1) */}
            {showExpertiseSection && (
              <SkillExpertiseSection
                characterClass={form.characterClass}
                expertiseCount={expertiseCount}
                allSelectedSkills={allSelectedSkills}
                selectedExpertiseSkills={selectedExpertiseSkills}
                onToggleExpertiseSkill={toggleExpertiseSkill}
              />
            )}

            {/* Ability Scores */}
            <AbilityScoreSection
              form={form}
              racialBonuses={racialBonuses}
              raceInfo={raceInfo}
              xphbAsiMode={xphbAsiMode}
              xphbAsiChoices={xphbAsiChoices}
              racialAsiChoices={racialAsiChoices}
              onAbilityChange={handleAbilityChange}
              onXphbAsiModeChange={handleXphbAsiModeChange}
              onXphbAsiChoicesChange={setXphbAsiChoices}
              onRacialAsiChoicesChange={setRacialAsiChoices}
            />

            {/* Combat Stats */}
            <CombatSection
              form={form}
              isLoading={isLoading}
              onFormChange={handleChange}
              naturalArmorAC={naturalArmorAC}
            />

            {/* Backstory */}
            <BackstorySection
              backstory={form.backstory}
              isLoading={isLoading}
              onFormChange={handleChange}
            />

            {error && (
              <div style={{ background: "rgba(139,42,30,0.2)", border: "1px solid #8b2a1e", borderRadius: "6px", padding: "12px 16px", color: "#e8d5a3", fontSize: "14px", fontFamily: "'Georgia', serif" }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "12px", justifyContent: "flex-end", paddingTop: "8px" }}>
              <button type="button" onClick={() => void router.push("/characters")} disabled={isLoading} style={{ background: "transparent", border: "1px solid rgba(201,168,76,0.5)", color: "#c9a84c", borderRadius: "4px", padding: "10px 20px", fontFamily: "'Georgia', serif", fontSize: "13px", cursor: "pointer" }}>
                Cancel
              </button>
              <button type="submit" disabled={isLoading} style={{ background: "linear-gradient(135deg, #8b6914, #c9a84c)", color: "#1a1a2e", border: "none", borderRadius: "6px", padding: "12px 28px", fontSize: "14px", fontFamily: "'Georgia', serif", fontWeight: "bold", cursor: isLoading ? "not-allowed" : "pointer", opacity: isLoading ? 0.7 : 1, letterSpacing: "0.5px" }}>
                {isLoading ? "Forging your legend..." : "Begin the Legend"}
              </button>
            </div>
          </div>
        </form>

        <ThisIsYourLifeGenerator onUseBackstory={handleUseBackstory} />
      </div>
    </>
  );
}

export default function CreateCharacterPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <CreateCharacterContent />
      </Layout>
    </ProtectedRoute>
  );
}
