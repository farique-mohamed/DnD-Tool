import Head from "next/head";
import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { ThisIsYourLifeGenerator } from "@/components/ThisIsYourLifeGenerator";
import { api } from "@/utils/api";
import { getClassesBySource, getClassByNameAndSource } from "@/lib/classData";
import { BACKGROUNDS, BACKGROUND_NAMES } from "@/lib/backgroundData";
import type { Background } from "@/lib/backgroundData";
import { classHasExpertise, getExpertiseCountAtLevel } from "@/lib/expertiseData";
import { getRaceByNameAndSource } from "@/lib/raceData";
import type { AbilityScoreBonus } from "@/lib/raceData";

const CHARACTER_RACES = [
  "Human", "Elf", "Dwarf", "Halfling", "Gnome",
  "Half-Elf", "Half-Orc", "Tiefling", "Dragonborn",
];

const ALIGNMENTS = [
  "Lawful Good", "Neutral Good", "Chaotic Good",
  "Lawful Neutral", "True Neutral", "Chaotic Neutral",
  "Lawful Evil", "Neutral Evil", "Chaotic Evil",
];

const labelStyle: React.CSSProperties = {
  display: "block",
  color: "#b8934a",
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: "8px",
  fontFamily: "'Georgia', serif",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  background: "rgba(30,15,5,0.9)",
  border: "1px solid rgba(201,168,76,0.4)",
  borderRadius: "6px",
  color: "#e8d5a3",
  fontSize: "14px",
  fontFamily: "'Georgia', 'Times New Roman', serif",
  outline: "none",
  boxSizing: "border-box",
};

const sectionTitleStyle: React.CSSProperties = {
  color: "#c9a84c",
  fontSize: "13px",
  fontWeight: "bold",
  letterSpacing: "1.5px",
  textTransform: "uppercase",
  marginBottom: "16px",
  paddingBottom: "8px",
  borderBottom: "1px solid rgba(201,168,76,0.2)",
};

const chipBaseStyle: React.CSSProperties = {
  borderRadius: "20px",
  padding: "4px 12px",
  fontSize: "11px",
  fontFamily: "'Georgia', serif",
  cursor: "pointer",
  border: "1px solid",
  transition: "all 0.15s ease",
  userSelect: "none",
};

const bonusBadgeStyle: React.CSSProperties = {
  display: "inline-block",
  background: "rgba(201,168,76,0.25)",
  border: "1px solid rgba(201,168,76,0.5)",
  borderRadius: "10px",
  padding: "1px 7px",
  fontSize: "10px",
  fontWeight: "bold",
  color: "#c9a84c",
  fontFamily: "'Georgia', serif",
  lineHeight: "16px",
};

function AbilityScoreInput({
  label,
  name,
  value,
  bonus,
  onChange,
}: {
  label: string;
  name: string;
  value: number;
  bonus: number;
  onChange: (name: string, value: number) => void;
}) {
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
        <span style={{ color: "#e8d5a3", fontSize: "14px", fontWeight: "bold", fontFamily: "'Georgia', serif" }}>
          {total} <span style={{ color: "#a89060", fontSize: "12px", fontWeight: "normal" }}>({modStr})</span>
        </span>
      ) : (
        <span style={{ color: "#a89060", fontSize: "12px", fontFamily: "'Georgia', serif" }}>
          {modStr}
        </span>
      )}
    </div>
  );
}

function SkillChip({
  skill,
  selected,
  locked,
  disabled,
  onClick,
}: {
  skill: string;
  selected: boolean;
  locked: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
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

const ABILITY_NAMES = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"] as const;
type AbilityName = typeof ABILITY_NAMES[number];

interface FormState {
  name: string;
  rulesSource: "PHB" | "XPHB";
  characterClass: string;
  race: string;
  alignment: string;
  background: string;
  backstory: string;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  maxHp: number;
  armorClass: number;
  speed: number;
}

function CreateCharacterContent() {
  const router = useRouter();
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

  const filteredClasses = useMemo(
    () => getClassesBySource(form.rulesSource),
    [form.rulesSource],
  );

  // Look up the selected race's structured data
  const raceInfo = useMemo(
    () => (form.race ? getRaceByNameAndSource(form.race, form.rulesSource) : undefined),
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

  // Fixed skills from background (auto-selected, locked)
  const bgFixedSkills = backgroundInfo?.skillProficiencies ?? [];

  // Background choice skills
  const bgChoiceFrom = backgroundInfo?.skillChoices?.from ?? [];
  const bgChoiceCount = backgroundInfo?.skillChoices?.count ?? 0;

  // Class skill choices
  const classSkillFrom = classInfo?.skillChoices.from ?? [];
  const classSkillCount = classInfo?.skillChoices.count ?? 0;
  const classIsAnySkill = classSkillFrom.length === 1 && classSkillFrom[0] === "Any skill";

  // All 18 standard skills for "Any skill" class option
  const allSkills = useMemo(() => [
    "Acrobatics", "Animal Handling", "Arcana", "Athletics",
    "Deception", "History", "Insight", "Intimidation",
    "Investigation", "Medicine", "Nature", "Perception",
    "Performance", "Persuasion", "Religion", "Sleight of Hand",
    "Stealth", "Survival",
  ], []);

  // Combine all selected skills for submission
  const allSelectedSkills = useMemo(() => {
    const skills = new Set<string>();
    bgFixedSkills.forEach((s) => skills.add(s));
    selectedBgChoiceSkills.forEach((s) => skills.add(s));
    selectedClassSkills.forEach((s) => skills.add(s));
    return Array.from(skills).sort();
  }, [bgFixedSkills, selectedBgChoiceSkills, selectedClassSkills]);

  // Skills already locked (from bg fixed + bg choices) — class choices cannot pick these
  const lockedByBackground = useMemo(() => {
    const set = new Set<string>();
    bgFixedSkills.forEach((s) => set.add(s));
    selectedBgChoiceSkills.forEach((s) => set.add(s));
    return set;
  }, [bgFixedSkills, selectedBgChoiceSkills]);

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

  const handleAbilityChange = (name: string, value: number) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

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
        <h1 style={{ color: "#c9a84c", fontSize: "26px", fontWeight: "bold", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px" }}>
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
            padding: "36px 32px",
            display: "flex",
            flexDirection: "column",
            gap: "28px",
          }}>

            {/* Basic Info */}
            <div>
              <p style={sectionTitleStyle}>Identity</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label style={labelStyle}>Rulebook Edition</label>
                  <div style={{ display: "flex", gap: "0" }}>
                    {([
                      { label: "Player's Handbook (2014)", value: "PHB" as const },
                      { label: "Player's Handbook (2024)", value: "XPHB" as const },
                    ]).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          if (opt.value !== form.rulesSource) {
                            setForm((prev) => ({ ...prev, rulesSource: opt.value, characterClass: "" }));
                            setSelectedClassSkills([]);
                          }
                        }}
                        disabled={isLoading}
                        style={{
                          background: form.rulesSource === opt.value
                            ? "linear-gradient(135deg, #8b6914, #c9a84c)"
                            : "rgba(0,0,0,0.4)",
                          border: form.rulesSource === opt.value
                            ? "1px solid #c9a84c"
                            : "1px solid rgba(201,168,76,0.3)",
                          color: form.rulesSource === opt.value ? "#1a1a2e" : "#a89060",
                          fontWeight: form.rulesSource === opt.value ? "bold" : "normal",
                          padding: "8px 18px",
                          fontSize: "12px",
                          fontFamily: "'Georgia', serif",
                          cursor: isLoading ? "not-allowed" : "pointer",
                          letterSpacing: "0.3px",
                          borderRadius: opt.value === "PHB" ? "6px 0 0 6px" : "0 6px 6px 0",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="name" style={labelStyle}>Character Name</label>
                  <input id="name" name="name" type="text" placeholder="Enter a name worthy of legend..." value={form.name} onChange={handleChange} style={inputStyle} required disabled={isLoading} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label htmlFor="race" style={labelStyle}>Race</label>
                    <select id="race" name="race" value={form.race} onChange={handleChange} style={{ ...inputStyle, cursor: "pointer" }} required disabled={isLoading}>
                      <option value="" disabled>Choose your lineage...</option>
                      {CHARACTER_RACES.map((r) => <option key={r} value={r} style={{ background: "#1a1a2e" }}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "8px" }}>
                      <label htmlFor="characterClass" style={{ ...labelStyle, marginBottom: 0 }}>Class</label>
                      <a
                        href="/classes"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#a89060", fontSize: "11px", fontFamily: "'Georgia', serif", textDecoration: "none", letterSpacing: "0.3px" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#c9a84c"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#a89060"; }}
                      >
                        Browse all classes →
                      </a>
                    </div>
                    <select id="characterClass" name="characterClass" value={form.characterClass} onChange={handleChange} style={{ ...inputStyle, cursor: "pointer" }} required disabled={isLoading}>
                      <option value="" disabled>Choose your calling...</option>
                      {filteredClasses.map((c) => <option key={c.name} value={c.name} style={{ background: "#1a1a2e" }}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="alignment" style={labelStyle}>Alignment</label>
                  <select id="alignment" name="alignment" value={form.alignment} onChange={handleChange} style={{ ...inputStyle, cursor: "pointer" }} disabled={isLoading}>
                    {ALIGNMENTS.map((a) => <option key={a} value={a} style={{ background: "#1a1a2e" }}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="background" style={labelStyle}>Background</label>
                  <select id="background" name="background" value={form.background} onChange={handleChange} style={{ ...inputStyle, cursor: "pointer" }} disabled={isLoading}>
                    <option value="">Choose your origins...</option>
                    {BACKGROUND_NAMES.map((b) => <option key={b} value={b} style={{ background: "#1a1a2e" }}>{b}</option>)}
                  </select>
                </div>
              </div>

              {/* Class info panel */}
              {form.characterClass && (() => {
                const ci = getClassByNameAndSource(form.characterClass, form.rulesSource);
                if (!ci) return null;
                return (
                  <div style={{
                    background: "rgba(201,168,76,0.06)",
                    border: "1px solid rgba(201,168,76,0.25)",
                    borderRadius: "8px",
                    padding: "16px 18px",
                    marginTop: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}>
                    <p style={{ color: "#c9a84c", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1.2px", fontFamily: "'Georgia', serif", margin: 0 }}>
                      {ci.name} — Class Overview
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      <span style={{ background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "4px", padding: "3px 10px", color: "#e8d5a3", fontSize: "12px", fontFamily: "'Georgia', serif" }}>
                        Hit Die: {ci.hitDie}
                      </span>
                      {ci.savingThrows.length > 0 && (
                        <span style={{ background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "4px", padding: "3px 10px", color: "#e8d5a3", fontSize: "12px", fontFamily: "'Georgia', serif" }}>
                          Saves: {ci.savingThrows.join(", ")}
                        </span>
                      )}
                    </div>
                    {ci.armorProficiencies.length > 0 && (
                      <p style={{ margin: 0, color: "#a89060", fontSize: "12px", fontFamily: "'Georgia', serif" }}>
                        <span style={{ color: "#c9a84c" }}>Armor:</span>{" "}
                        {ci.armorProficiencies.join(", ")}
                      </p>
                    )}
                    {ci.weaponProficiencies.length > 0 && (
                      <p style={{ margin: 0, color: "#a89060", fontSize: "12px", fontFamily: "'Georgia', serif" }}>
                        <span style={{ color: "#c9a84c" }}>Weapons:</span>{" "}
                        {ci.weaponProficiencies.join(", ")}
                      </p>
                    )}
                    {ci.skillChoices.count > 0 && (
                      <p style={{ margin: 0, color: "#a89060", fontSize: "12px", fontFamily: "'Georgia', serif" }}>
                        <span style={{ color: "#c9a84c" }}>Skills:</span>{" "}
                        Choose {ci.skillChoices.count} from{" "}
                        {ci.skillChoices.from.length > 0 && ci.skillChoices.from[0] !== "Any skill"
                          ? ci.skillChoices.from.join(", ")
                          : "any skill"}
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Skill Proficiencies */}
            {showSkillSection && (
              <div>
                <p style={sectionTitleStyle}>Skill Proficiencies</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                  {/* Background fixed skills */}
                  {bgFixedSkills.length > 0 && (
                    <div>
                      <p style={{ margin: "0 0 8px 0", color: "#a89060", fontSize: "12px", fontFamily: "'Georgia', serif" }}>
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
                      <p style={{ margin: "0 0 8px 0", color: "#a89060", fontSize: "12px", fontFamily: "'Georgia', serif" }}>
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
                              onClick={() => toggleBgChoiceSkill(skill)}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Class skill choices */}
                  {classSkillCount > 0 && (
                    <div>
                      <p style={{ margin: "0 0 8px 0", color: "#a89060", fontSize: "12px", fontFamily: "'Georgia', serif" }}>
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
                              onClick={() => toggleClassSkill(skill)}
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
                      <p style={{ margin: 0, color: "#c9a84c", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", fontFamily: "'Georgia', serif" }}>
                        Proficient Skills ({allSelectedSkills.length})
                      </p>
                      <p style={{ margin: "6px 0 0 0", color: "#e8d5a3", fontSize: "12px", fontFamily: "'Georgia', serif" }}>
                        {allSelectedSkills.join(", ")}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Skill Expertise (Rogue / Bard at level 1) */}
            {showExpertiseSection && (
              <div>
                <p style={sectionTitleStyle}>Skill Expertise</p>
                <p style={{ margin: "0 0 12px 0", color: "#a89060", fontSize: "12px", fontFamily: "'Georgia', serif" }}>
                  <span style={{ color: "#c9a84c" }}>{form.characterClass}</span>{" "}
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
                        onClick={isFull ? undefined : () => toggleExpertiseSkill(skill)}
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
            )}

            {/* Ability Scores */}
            <div>
              <p style={sectionTitleStyle}>Ability Scores</p>

              {/* XPHB universal ASI chooser */}
              {form.rulesSource === "XPHB" && form.race && (
                <div style={{
                  background: "rgba(201,168,76,0.06)",
                  border: "1px solid rgba(201,168,76,0.25)",
                  borderRadius: "8px",
                  padding: "14px 16px",
                  marginBottom: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}>
                  <p style={{ margin: 0, color: "#c9a84c", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1.2px", fontFamily: "'Georgia', serif" }}>
                    Ability Score Increase — Choose your bonuses
                  </p>
                  {/* Mode toggle */}
                  <div style={{ display: "flex", gap: "0" }}>
                    {([
                      { label: "+2 / +1 to two scores", value: "2-1" as const },
                      { label: "+1 / +1 / +1 to three scores", value: "1-1-1" as const },
                    ]).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          if (opt.value !== xphbAsiMode) {
                            setXphbAsiMode(opt.value);
                            setXphbAsiChoices({});
                          }
                        }}
                        style={{
                          background: xphbAsiMode === opt.value
                            ? "linear-gradient(135deg, #8b6914, #c9a84c)"
                            : "rgba(0,0,0,0.4)",
                          border: xphbAsiMode === opt.value
                            ? "1px solid #c9a84c"
                            : "1px solid rgba(201,168,76,0.3)",
                          color: xphbAsiMode === opt.value ? "#1a1a2e" : "#a89060",
                          fontWeight: xphbAsiMode === opt.value ? "bold" : "normal",
                          padding: "7px 16px",
                          fontSize: "11px",
                          fontFamily: "'Georgia', serif",
                          cursor: "pointer",
                          letterSpacing: "0.3px",
                          borderRadius: opt.value === "2-1" ? "6px 0 0 6px" : "0 6px 6px 0",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* +2/+1 mode */}
                  {xphbAsiMode === "2-1" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div>
                        <span style={{ color: "#a89060", fontSize: "12px", fontFamily: "'Georgia', serif", marginRight: "10px" }}>
                          +2 to:
                        </span>
                        <div style={{ display: "inline-flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                          {ABILITY_NAMES.map((ab) => {
                            const isSelected = xphbAsiChoices[ab] === 2;
                            const isUsedBy1 = xphbAsiChoices[ab] === 1;
                            return (
                              <button
                                key={`xphb-2-${ab}`}
                                type="button"
                                onClick={() => {
                                  setXphbAsiChoices((prev) => {
                                    const next = { ...prev };
                                    if (isSelected) {
                                      delete next[ab];
                                    } else {
                                      // Remove any existing +2
                                      for (const k of Object.keys(next)) {
                                        if (next[k] === 2) delete next[k];
                                      }
                                      next[ab] = 2;
                                    }
                                    return next;
                                  });
                                }}
                                style={{
                                  ...chipBaseStyle,
                                  background: isSelected ? "rgba(201,168,76,0.25)" : "rgba(30,15,5,0.6)",
                                  borderColor: isSelected ? "rgba(201,168,76,0.6)" : "rgba(201,168,76,0.2)",
                                  color: isSelected ? "#e8d5a3" : "#a89060",
                                  cursor: isUsedBy1 ? "not-allowed" : "pointer",
                                  opacity: isUsedBy1 ? 0.4 : 1,
                                  fontWeight: isSelected ? "bold" : "normal",
                                }}
                                disabled={isUsedBy1}
                              >
                                {ab.slice(0, 3).toUpperCase()}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: "#a89060", fontSize: "12px", fontFamily: "'Georgia', serif", marginRight: "10px" }}>
                          +1 to:
                        </span>
                        <div style={{ display: "inline-flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                          {ABILITY_NAMES.map((ab) => {
                            const isSelected = xphbAsiChoices[ab] === 1;
                            const isUsedBy2 = xphbAsiChoices[ab] === 2;
                            return (
                              <button
                                key={`xphb-1-${ab}`}
                                type="button"
                                onClick={() => {
                                  setXphbAsiChoices((prev) => {
                                    const next = { ...prev };
                                    if (isSelected) {
                                      delete next[ab];
                                    } else {
                                      // Remove any existing +1
                                      for (const k of Object.keys(next)) {
                                        if (next[k] === 1) delete next[k];
                                      }
                                      next[ab] = 1;
                                    }
                                    return next;
                                  });
                                }}
                                style={{
                                  ...chipBaseStyle,
                                  background: isSelected ? "rgba(201,168,76,0.25)" : "rgba(30,15,5,0.6)",
                                  borderColor: isSelected ? "rgba(201,168,76,0.6)" : "rgba(201,168,76,0.2)",
                                  color: isSelected ? "#e8d5a3" : "#a89060",
                                  cursor: isUsedBy2 ? "not-allowed" : "pointer",
                                  opacity: isUsedBy2 ? 0.4 : 1,
                                  fontWeight: isSelected ? "bold" : "normal",
                                }}
                                disabled={isUsedBy2}
                              >
                                {ab.slice(0, 3).toUpperCase()}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* +1/+1/+1 mode */}
                  {xphbAsiMode === "1-1-1" && (
                    <div>
                      <span style={{ color: "#a89060", fontSize: "12px", fontFamily: "'Georgia', serif", marginRight: "10px" }}>
                        +1 to three different scores:
                      </span>
                      <div style={{ display: "inline-flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                        {ABILITY_NAMES.map((ab) => {
                          const isSelected = xphbAsiChoices[ab] === 1;
                          const selectedCount = Object.values(xphbAsiChoices).filter((v) => v === 1).length;
                          const isFull = selectedCount >= 3 && !isSelected;
                          return (
                            <button
                              key={`xphb-111-${ab}`}
                              type="button"
                              onClick={() => {
                                setXphbAsiChoices((prev) => {
                                  const next = { ...prev };
                                  if (isSelected) {
                                    delete next[ab];
                                  } else {
                                    next[ab] = 1;
                                  }
                                  return next;
                                });
                              }}
                              style={{
                                ...chipBaseStyle,
                                background: isSelected ? "rgba(201,168,76,0.25)" : "rgba(30,15,5,0.6)",
                                borderColor: isSelected ? "rgba(201,168,76,0.6)" : "rgba(201,168,76,0.2)",
                                color: isSelected ? "#e8d5a3" : "#a89060",
                                cursor: isFull ? "not-allowed" : "pointer",
                                opacity: isFull ? 0.4 : 1,
                                fontWeight: isSelected ? "bold" : "normal",
                              }}
                              disabled={isFull}
                            >
                              {ab.slice(0, 3).toUpperCase()}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* PHB Half-Elf choice ASI */}
              {form.rulesSource === "PHB" && raceInfo?.abilityBonuses?.some((b) => b.ability === "choice") && (() => {
                const choiceBonus = raceInfo.abilityBonuses!.find((b) => b.ability === "choice")!;
                const choiceCount = choiceBonus.choiceCount ?? 1;
                const excluded = new Set(choiceBonus.excludeAbilities ?? []);
                const availableAbilities = ABILITY_NAMES.filter((ab) => !excluded.has(ab));
                return (
                  <div style={{
                    background: "rgba(201,168,76,0.06)",
                    border: "1px solid rgba(201,168,76,0.25)",
                    borderRadius: "8px",
                    padding: "14px 16px",
                    marginBottom: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}>
                    <p style={{ margin: 0, color: "#c9a84c", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1.2px", fontFamily: "'Georgia', serif" }}>
                      {raceInfo.name} — Choose {choiceCount} ability score{choiceCount !== 1 ? "s" : ""} to gain +{choiceBonus.amount}
                      {racialAsiChoices.length > 0 && (
                        <span style={{ marginLeft: "8px" }}>({racialAsiChoices.length}/{choiceCount})</span>
                      )}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {availableAbilities.map((ab) => {
                        const isSelected = racialAsiChoices.includes(ab);
                        const isFull = racialAsiChoices.length >= choiceCount && !isSelected;
                        return (
                          <button
                            key={`asi-choice-${ab}`}
                            type="button"
                            onClick={() => {
                              setRacialAsiChoices((prev) => {
                                if (prev.includes(ab)) return prev.filter((a) => a !== ab);
                                if (prev.length >= choiceCount) return prev;
                                return [...prev, ab];
                              });
                            }}
                            style={{
                              ...chipBaseStyle,
                              background: isSelected ? "rgba(201,168,76,0.25)" : "rgba(30,15,5,0.6)",
                              borderColor: isSelected ? "rgba(201,168,76,0.6)" : "rgba(201,168,76,0.2)",
                              color: isSelected ? "#e8d5a3" : "#a89060",
                              cursor: isFull ? "not-allowed" : "pointer",
                              opacity: isFull ? 0.4 : 1,
                              fontWeight: isSelected ? "bold" : "normal",
                            }}
                            disabled={isFull}
                          >
                            {ab.charAt(0).toUpperCase() + ab.slice(1)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "12px" }}>
                {([
                  { label: "STR", name: "strength" },
                  { label: "DEX", name: "dexterity" },
                  { label: "CON", name: "constitution" },
                  { label: "INT", name: "intelligence" },
                  { label: "WIS", name: "wisdom" },
                  { label: "CHA", name: "charisma" },
                ] as const).map(({ label, name }) => (
                  <AbilityScoreInput key={name} label={label} name={name} value={form[name]} bonus={racialBonuses[name]} onChange={handleAbilityChange} />
                ))}
              </div>
            </div>

            {/* Combat Stats */}
            <div>
              <p style={sectionTitleStyle}>Combat</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                <div>
                  <label htmlFor="maxHp" style={labelStyle}>Max HP</label>
                  <input id="maxHp" name="maxHp" type="number" min={1} value={form.maxHp} onChange={handleChange} style={inputStyle} required disabled={isLoading} />
                </div>
                <div>
                  <label htmlFor="armorClass" style={labelStyle}>Armor Class</label>
                  <input id="armorClass" name="armorClass" type="number" min={1} max={30} value={form.armorClass} onChange={handleChange} style={inputStyle} required disabled={isLoading} />
                </div>
                <div>
                  <label htmlFor="speed" style={labelStyle}>Speed (ft)</label>
                  <input id="speed" name="speed" type="number" min={0} max={120} value={form.speed} onChange={handleChange} style={inputStyle} required disabled={isLoading} />
                </div>
              </div>
            </div>

            {/* Backstory */}
            <div>
              <p style={sectionTitleStyle}>Lore</p>
              <div>
                <label htmlFor="backstory" style={labelStyle}>Backstory</label>
                <textarea id="backstory" name="backstory" placeholder="Every hero has a tale... (optional)" value={form.backstory} onChange={handleChange} rows={5} style={{ ...inputStyle, resize: "vertical", minHeight: "100px" }} disabled={isLoading} />
              </div>
            </div>

            {error && (
              <div style={{ background: "rgba(139,42,30,0.2)", border: "1px solid #8b2a1e", borderRadius: "6px", padding: "12px 16px", color: "#e8d5a3", fontSize: "14px", fontFamily: "'Georgia', serif" }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", paddingTop: "8px" }}>
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
