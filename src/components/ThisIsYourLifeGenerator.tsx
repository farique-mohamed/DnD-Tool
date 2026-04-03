import { useState, useCallback } from "react";
import { LIFE_CLASSES, LIFE_BACKGROUNDS } from "@/lib/lifeData";
import {
  d, roll, pickRandom, rollOnTable, resolveDiceExpressions,
  BIRTHPLACE_TABLE, PARENT_KNOWLEDGE_TABLE,
  HALF_ELF_PARENTS, HALF_ORC_PARENTS, TIEFLING_PARENTS,
  rollAlignment, OCCUPATION_TABLE, rollRelationship, rollStatus,
  rollNumberOfSiblings, rollBirthOrder,
  RAISED_BY_TABLE, ABSENT_PARENT_REASONS,
  rollFamilyLifestyle, rollChildhoodHome, rollChildhoodMemories,
  rollLifeEventCount, generateLifeEvent,
  generateName, getNameSetForRace,
  DND_RACES_SIMPLE, GENDERS, DEFAULT_BACKGROUND_REASONS,
  type StatusResult, type LifeEventResult,
} from "@/lib/thisIsYourLifeData";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ParentInfo {
  label: string; // "Mother" or "Father"
  name: string;
  alignment: string;
  occupation: string;
  relationship: string;
  status: StatusResult;
}

interface SiblingInfo {
  name: string;
  gender: string;
  species: string;
  birthOrder: string;
  alignment: string;
  occupation: string;
  relationship: string;
  status: StatusResult;
}

interface ParentsSection {
  species: string;
  knowledge: string;
  mother: ParentInfo;
  father: ParentInfo;
}

interface FamilySection {
  raisedBy: string;
  absentReason?: string;
  lifestyle: string;
  lifestyleModifier: number;
  childhoodHome: string;
  childhoodMemories: string;
}

interface PersonalDecisionsSection {
  backgroundReason: string;
  classReason: string;
}

export interface BackstoryResult {
  parents: ParentsSection;
  birthplace: string;
  siblings: SiblingInfo[];
  family: FamilySection;
  personalDecisions: PersonalDecisionsSection;
  lifeEvents: LifeEventResult[];
}

interface ThisIsYourLifeGeneratorProps {
  onUseBackstory: (text: string) => void;
  race: string;
  background: string;
  characterClass: string;
  charismaScore?: number;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const GOLD = "#c9a84c";
const GOLD_MUTED = "#a89060";
const GOLD_LABEL = "#b8934a";
const TEXT_LIGHT = "#e8d5a3";
const SERIF = "'Georgia', 'Times New Roman', serif";

const cardOuterStyle: React.CSSProperties = {
  background: "rgba(0,0,0,0.6)",
  border: `2px solid ${GOLD}`,
  borderRadius: "12px",
  boxShadow: "0 0 40px rgba(201,168,76,0.3), inset 0 0 60px rgba(0,0,0,0.5)",
  padding: "24px",
  marginBottom: "20px",
};

const sectionHeaderStyle: React.CSSProperties = {
  color: GOLD,
  fontSize: "14px",
  fontWeight: "bold",
  letterSpacing: "1.5px",
  textTransform: "uppercase" as const,
  fontFamily: SERIF,
  marginBottom: "14px",
  borderBottom: `1px solid rgba(201,168,76,0.25)`,
  paddingBottom: "8px",
};

const labelStyle: React.CSSProperties = {
  color: GOLD_LABEL,
  fontSize: "10px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.09em",
  fontFamily: SERIF,
  marginBottom: "2px",
};

const valueStyle: React.CSSProperties = {
  color: TEXT_LIGHT,
  fontSize: "13px",
  fontFamily: SERIF,
  lineHeight: "1.5",
};

const rerollBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "1px solid rgba(201,168,76,0.35)",
  color: GOLD_MUTED,
  borderRadius: "4px",
  padding: "2px 8px",
  fontSize: "10px",
  fontFamily: SERIF,
  cursor: "pointer",
  marginLeft: "8px",
  verticalAlign: "middle",
  lineHeight: "1.4",
};

const selectStyle: React.CSSProperties = {
  background: "rgba(30,15,5,0.9)",
  border: "1px solid rgba(201,168,76,0.4)",
  borderRadius: "6px",
  color: TEXT_LIGHT,
  fontFamily: SERIF,
  fontSize: "13px",
  padding: "8px 12px",
  outline: "none",
  cursor: "pointer",
};

const inputFieldStyle: React.CSSProperties = {
  ...selectStyle,
  width: "80px",
};

const tagStyle: React.CSSProperties = {
  display: "inline-block",
  background: "rgba(201,168,76,0.1)",
  border: "1px solid rgba(201,168,76,0.2)",
  borderRadius: "4px",
  padding: "1px 7px",
  fontSize: "11px",
  fontFamily: SERIF,
  color: GOLD_MUTED,
  marginRight: "6px",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSpeciesDescription(race: string): string {
  const lower = race.toLowerCase();
  if (lower.includes("half-elf")) return pickRandom(HALF_ELF_PARENTS);
  if (lower.includes("half-orc")) return pickRandom(HALF_ORC_PARENTS);
  if (lower.includes("tiefling")) return pickRandom(TIEFLING_PARENTS);
  return `Both parents were ${race}s.`;
}

function generateParent(label: string, race: string, gender: "male" | "female"): ParentInfo {
  const name = generateName(race, gender);
  return {
    label,
    name: `${name.first} ${name.surname}`,
    alignment: rollAlignment(),
    occupation: rollOnTable(OCCUPATION_TABLE),
    relationship: rollRelationship(),
    status: rollStatus(),
  };
}

function generateSibling(race: string): SiblingInfo {
  const gender = pickRandom(GENDERS);
  const name = generateName(race, gender);
  // Small chance of different species
  let species = race;
  if (d(20) === 1) {
    species = pickRandom(DND_RACES_SIMPLE.filter((r) => r.toLowerCase() !== race.toLowerCase()));
  }
  return {
    name: `${name.first} ${name.surname}`,
    gender: gender === "male" ? "Male" : "Female",
    species,
    birthOrder: rollBirthOrder(),
    alignment: rollAlignment(),
    occupation: rollOnTable(OCCUPATION_TABLE),
    relationship: rollRelationship(),
    status: rollStatus(),
  };
}

function getBackgroundReason(background: string): string {
  // First try life.json data
  const lifeEntry = LIFE_BACKGROUNDS.find(
    (b) => b.name.toLowerCase() === background.toLowerCase()
      || b.name.toLowerCase().includes(background.toLowerCase())
  );
  if (lifeEntry && lifeEntry.reasons.length > 0) {
    return pickRandom(lifeEntry.reasons);
  }
  // Fallback to defaults
  const defaults = DEFAULT_BACKGROUND_REASONS[background];
  if (defaults && defaults.length > 0) {
    return pickRandom(defaults);
  }
  // Generic fallback
  return `Circumstances in my life led me naturally to the path of a ${background}.`;
}

function getClassReason(characterClass: string): string {
  const lifeEntry = LIFE_CLASSES.find(
    (c) => c.name.toLowerCase() === characterClass.toLowerCase()
  );
  if (lifeEntry && lifeEntry.reasons.length > 0) {
    return pickRandom(lifeEntry.reasons);
  }
  return `I was drawn to the ways of the ${characterClass} through a series of events in my life.`;
}

function generateFullResult(
  race: string,
  background: string,
  characterClass: string,
  charismaModifier: number,
  age: number,
): BackstoryResult {
  // Parents
  const knowledge = rollOnTable(PARENT_KNOWLEDGE_TABLE);
  const species = getSpeciesDescription(race);
  const mother = generateParent("Mother", race, "female");
  const father = generateParent("Father", race, "male");

  // Birthplace
  const birthplace = rollOnTable(BIRTHPLACE_TABLE);

  // Siblings
  const sibCount = rollNumberOfSiblings(race);
  const siblings: SiblingInfo[] = [];
  for (let i = 0; i < sibCount; i++) {
    siblings.push(generateSibling(race));
  }

  // Family
  const raisedByRoll = rollOnTable(RAISED_BY_TABLE);
  let absentReason: string | undefined;
  if (raisedByRoll !== "Both parents") {
    absentReason = pickRandom(ABSENT_PARENT_REASONS);
  }
  const { lifestyle, modifier: lifestyleModifier } = rollFamilyLifestyle();
  const childhoodHome = rollChildhoodHome(lifestyleModifier);
  const childhoodMemories = rollChildhoodMemories(charismaModifier);

  // Personal decisions
  const backgroundReason = getBackgroundReason(background);
  const classReason = getClassReason(characterClass);

  // Life events
  const eventCount = rollLifeEventCount(age, race);
  const loveCounter = { value: 0 };
  const lifeEvents: LifeEventResult[] = [];
  for (let i = 0; i < eventCount; i++) {
    lifeEvents.push(generateLifeEvent(loveCounter));
  }

  return {
    parents: { species, knowledge, mother, father },
    birthplace,
    siblings,
    family: {
      raisedBy: raisedByRoll,
      absentReason,
      lifestyle,
      lifestyleModifier,
      childhoodHome,
      childhoodMemories,
    },
    personalDecisions: { backgroundReason, classReason },
    lifeEvents,
  };
}

function buildBackstoryText(
  result: BackstoryResult,
  race: string,
  background: string,
  characterClass: string,
): string {
  const lines: string[] = [];

  lines.push("=== PARENTS ===");
  lines.push(`Species: ${result.parents.species}`);
  lines.push(result.parents.knowledge);
  for (const p of [result.parents.mother, result.parents.father]) {
    lines.push(`${p.label}: ${p.name} (${p.alignment}, ${p.occupation}, ${p.relationship})`);
    lines.push(`  Status: ${p.status.label}${p.status.detail ? ` — ${p.status.detail}` : ""}`);
  }

  lines.push("");
  lines.push(`=== BIRTHPLACE ===`);
  lines.push(result.birthplace);

  lines.push("");
  lines.push("=== SIBLINGS ===");
  if (result.siblings.length === 0) {
    lines.push("No siblings.");
  } else {
    result.siblings.forEach((s, i) => {
      lines.push(`${i + 1}. ${s.name} (${s.gender} ${s.species}, ${s.birthOrder})`);
      lines.push(`   ${s.alignment}, ${s.occupation}, ${s.relationship}`);
      lines.push(`   Status: ${s.status.label}${s.status.detail ? ` — ${s.status.detail}` : ""}`);
    });
  }

  lines.push("");
  lines.push("=== FAMILY & UPBRINGING ===");
  lines.push(`Raised by: ${result.family.raisedBy}`);
  if (result.family.absentReason) lines.push(`Absent parent: ${result.family.absentReason}`);
  lines.push(`Family lifestyle: ${result.family.lifestyle}`);
  lines.push(`Childhood home: ${result.family.childhoodHome}`);
  lines.push(`Childhood memories: ${result.family.childhoodMemories}`);

  lines.push("");
  lines.push("=== PERSONAL DECISIONS ===");
  lines.push(`I became a ${background} because: ${result.personalDecisions.backgroundReason}`);
  lines.push(`I became a ${characterClass} because: ${result.personalDecisions.classReason}`);

  lines.push("");
  lines.push("=== LIFE EVENTS ===");
  result.lifeEvents.forEach((ev, i) => {
    lines.push(`${i + 1}. [${ev.category}] ${ev.description}`);
  });

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LabelValue({ label, value, tag }: { label: string; value: string; tag?: string }) {
  return (
    <div style={{ marginBottom: "8px" }}>
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>
        {tag && <span style={tagStyle}>{tag}</span>}
        {value}
      </div>
    </div>
  );
}

function ParentCard({ parent }: { parent: ParentInfo }) {
  return (
    <div style={{
      background: "rgba(201,168,76,0.04)",
      border: "1px solid rgba(201,168,76,0.12)",
      borderRadius: "8px",
      padding: "12px 14px",
      marginBottom: "10px",
    }}>
      <div style={{ ...labelStyle, fontSize: "11px", marginBottom: "6px", color: GOLD }}>
        {parent.label}
      </div>
      <LabelValue label="Name" value={parent.name} />
      <LabelValue label="Alignment" value={parent.alignment} />
      <LabelValue label="Occupation" value={parent.occupation} />
      <LabelValue label="Relationship" value={parent.relationship} />
      <LabelValue
        label="Status"
        value={`${parent.status.label}${parent.status.detail ? ` — ${parent.status.detail}` : ""}`}
      />
    </div>
  );
}

function SiblingCard({ sibling, index }: { sibling: SiblingInfo; index: number }) {
  return (
    <div style={{
      background: "rgba(201,168,76,0.04)",
      border: "1px solid rgba(201,168,76,0.12)",
      borderRadius: "8px",
      padding: "12px 14px",
      marginBottom: "10px",
    }}>
      <div style={{ ...labelStyle, fontSize: "11px", marginBottom: "6px", color: GOLD }}>
        Sibling #{index + 1}
      </div>
      <LabelValue label="Name" value={sibling.name} />
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        <LabelValue label="Gender" value={sibling.gender} />
        <LabelValue label="Species" value={sibling.species} />
        <LabelValue label="Birth Order" value={sibling.birthOrder} />
      </div>
      <LabelValue label="Alignment" value={sibling.alignment} />
      <LabelValue label="Occupation" value={sibling.occupation} />
      <LabelValue label="Relationship" value={sibling.relationship} />
      <LabelValue
        label="Status"
        value={`${sibling.status.label}${sibling.status.detail ? ` — ${sibling.status.detail}` : ""}`}
      />
    </div>
  );
}

function SectionCard({
  title,
  onReroll,
  children,
}: {
  title: string;
  onReroll: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={cardOuterStyle}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h3 style={sectionHeaderStyle}>{title}</h3>
        <button type="button" style={rerollBtnStyle} onClick={onReroll}>
          reroll
        </button>
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ThisIsYourLifeGenerator({
  onUseBackstory,
  race,
  background,
  characterClass,
  charismaScore,
}: ThisIsYourLifeGeneratorProps) {
  const [result, setResult] = useState<BackstoryResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [chaModifier, setChaModifier] = useState<number>(0);
  const [age, setAge] = useState<number>(25);

  // Compute CHA modifier from score or use own selector
  const effectiveChaModifier = charismaScore !== undefined
    ? Math.floor((charismaScore - 10) / 2)
    : chaModifier;

  const canRoll = race && background && characterClass;

  const rollAll = useCallback(() => {
    if (!canRoll) return;
    setResult(generateFullResult(race, background, characterClass, effectiveChaModifier, age));
    setCopied(false);
  }, [race, background, characterClass, effectiveChaModifier, age, canRoll]);

  // Section rerollers
  const rerollParents = useCallback(() => {
    if (!result) return;
    const knowledge = rollOnTable(PARENT_KNOWLEDGE_TABLE);
    const species = getSpeciesDescription(race);
    const mother = generateParent("Mother", race, "female");
    const father = generateParent("Father", race, "male");
    setResult({ ...result, parents: { species, knowledge, mother, father } });
  }, [result, race]);

  const rerollBirthplace = useCallback(() => {
    if (!result) return;
    setResult({ ...result, birthplace: rollOnTable(BIRTHPLACE_TABLE) });
  }, [result]);

  const rerollSiblings = useCallback(() => {
    if (!result) return;
    const sibCount = rollNumberOfSiblings(race);
    const siblings: SiblingInfo[] = [];
    for (let i = 0; i < sibCount; i++) siblings.push(generateSibling(race));
    setResult({ ...result, siblings });
  }, [result, race]);

  const rerollFamily = useCallback(() => {
    if (!result) return;
    const raisedBy = rollOnTable(RAISED_BY_TABLE);
    let absentReason: string | undefined;
    if (raisedBy !== "Both parents") {
      absentReason = pickRandom(ABSENT_PARENT_REASONS);
    }
    const { lifestyle, modifier } = rollFamilyLifestyle();
    const childhoodHome = rollChildhoodHome(modifier);
    const childhoodMemories = rollChildhoodMemories(effectiveChaModifier);
    setResult({
      ...result,
      family: { raisedBy, absentReason, lifestyle, lifestyleModifier: modifier, childhoodHome, childhoodMemories },
    });
  }, [result, effectiveChaModifier]);

  const rerollDecisions = useCallback(() => {
    if (!result) return;
    setResult({
      ...result,
      personalDecisions: {
        backgroundReason: getBackgroundReason(background),
        classReason: getClassReason(characterClass),
      },
    });
  }, [result, background, characterClass]);

  const rerollLifeEvents = useCallback(() => {
    if (!result) return;
    const eventCount = rollLifeEventCount(age, race);
    const loveCounter = { value: 0 };
    const lifeEvents: LifeEventResult[] = [];
    for (let i = 0; i < eventCount; i++) lifeEvents.push(generateLifeEvent(loveCounter));
    setResult({ ...result, lifeEvents });
  }, [result, age, race]);

  const handleUseBackstory = () => {
    if (!result) return;
    onUseBackstory(buildBackstoryText(result, race, background, characterClass));
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(buildBackstoryText(result, race, background, characterClass));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ------- Render -------

  return (
    <div style={{ marginTop: "36px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
        <h2 style={{
          color: GOLD,
          fontSize: "18px",
          fontWeight: "bold",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          fontFamily: SERIF,
          margin: 0,
        }}>
          This Is Your Life
        </h2>
      </div>
      <p style={{
        color: GOLD_MUTED,
        fontSize: "13px",
        fontFamily: SERIF,
        marginBottom: "20px",
        lineHeight: "1.6",
      }}>
        Consult the ancient tomes &mdash; let fate write your origin. Based on{" "}
        <em>Xanathar&apos;s Guide to Everything</em>.
      </p>

      {/* Prerequisites warning */}
      {!canRoll && (
        <div style={{
          background: "rgba(139,42,30,0.15)",
          border: "1px solid rgba(201,168,76,0.3)",
          borderRadius: "8px",
          padding: "14px 18px",
          marginBottom: "20px",
          color: TEXT_LIGHT,
          fontSize: "13px",
          fontFamily: SERIF,
          lineHeight: "1.6",
        }}>
          <strong style={{ color: GOLD }}>Prerequisites required:</strong> You must select a{" "}
          <strong>Race</strong>, <strong>Background</strong>, and <strong>Class</strong>{" "}
          above before the fates can be consulted.
          <div style={{ marginTop: "8px", fontSize: "12px", color: GOLD_MUTED }}>
            {!race && <span style={{ marginRight: "12px" }}>Missing: Race</span>}
            {!background && <span style={{ marginRight: "12px" }}>Missing: Background</span>}
            {!characterClass && <span>Missing: Class</span>}
          </div>
        </div>
      )}

      {/* Controls row */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "16px",
        alignItems: "flex-end",
        marginBottom: "20px",
      }}>
        {/* CHA modifier (only show if no charismaScore prop) */}
        {charismaScore === undefined && (
          <div>
            <div style={{ ...labelStyle, marginBottom: "6px" }}>Charisma Modifier</div>
            <select
              value={chaModifier}
              onChange={(e) => setChaModifier(Number(e.target.value))}
              style={selectStyle}
            >
              {Array.from({ length: 11 }, (_, i) => i - 5).map((v) => (
                <option key={v} value={v}>
                  {v >= 0 ? `+${v}` : v}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Age */}
        <div>
          <div style={{ ...labelStyle, marginBottom: "6px" }}>Character Age</div>
          <input
            type="number"
            min={1}
            max={9999}
            value={age}
            onChange={(e) => setAge(Math.max(1, Number(e.target.value) || 1))}
            style={inputFieldStyle}
          />
        </div>

        {/* Roll button */}
        <button
          type="button"
          onClick={rollAll}
          disabled={!canRoll}
          style={{
            background: canRoll
              ? "linear-gradient(135deg, #8b6914, #c9a84c)"
              : "rgba(100,100,100,0.3)",
            color: canRoll ? "#1a1a2e" : "#666",
            border: "none",
            borderRadius: "6px",
            padding: "10px 28px",
            fontSize: "14px",
            fontFamily: SERIF,
            fontWeight: "bold",
            cursor: canRoll ? "pointer" : "not-allowed",
            letterSpacing: "0.5px",
          }}
        >
          Roll the Fates
        </button>

        {/* Info badges */}
        {canRoll && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={tagStyle}>{race}</span>
            <span style={tagStyle}>{background}</span>
            <span style={tagStyle}>{characterClass}</span>
            <span style={{ ...tagStyle, color: TEXT_LIGHT }}>
              CHA {effectiveChaModifier >= 0 ? `+${effectiveChaModifier}` : effectiveChaModifier}
            </span>
            <span style={{ ...tagStyle, color: TEXT_LIGHT }}>Age {age}</span>
          </div>
        )}
      </div>

      {/* ====== Results ====== */}
      {result && (
        <>
          {/* Parents */}
          <SectionCard title="Parents" onReroll={rerollParents}>
            <LabelValue label="Species" value={result.parents.species} />
            <LabelValue label="Parent Knowledge" value={result.parents.knowledge} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "10px" }}>
              <div style={{ flex: "1 1 280px" }}>
                <ParentCard parent={result.parents.mother} />
              </div>
              <div style={{ flex: "1 1 280px" }}>
                <ParentCard parent={result.parents.father} />
              </div>
            </div>
          </SectionCard>

          {/* Birthplace */}
          <SectionCard title="Birthplace" onReroll={rerollBirthplace}>
            <LabelValue label="Born at" value={result.birthplace} />
          </SectionCard>

          {/* Siblings */}
          <SectionCard title={`Siblings (${result.siblings.length})`} onReroll={rerollSiblings}>
            {result.siblings.length === 0 ? (
              <div style={valueStyle}>You have no siblings.</div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                {result.siblings.map((s, i) => (
                  <div key={i} style={{ flex: "1 1 280px" }}>
                    <SiblingCard sibling={s} index={i} />
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Family & Upbringing */}
          <SectionCard title="Family & Upbringing" onReroll={rerollFamily}>
            <LabelValue label="Raised By" value={result.family.raisedBy} />
            {result.family.absentReason && (
              <LabelValue label="Absent Parent Reason" value={result.family.absentReason} />
            )}
            <LabelValue label="Family Lifestyle" value={result.family.lifestyle} />
            <LabelValue label="Childhood Home" value={result.family.childhoodHome} />
            <LabelValue label="Childhood Memories" value={result.family.childhoodMemories} />
          </SectionCard>

          {/* Personal Decisions */}
          <SectionCard title="Personal Decisions" onReroll={rerollDecisions}>
            <LabelValue
              label={`Why I became a ${background}`}
              value={result.personalDecisions.backgroundReason}
            />
            <LabelValue
              label={`Why I became a ${characterClass}`}
              value={result.personalDecisions.classReason}
            />
          </SectionCard>

          {/* Life Events */}
          <SectionCard title={`Life Events (${result.lifeEvents.length})`} onReroll={rerollLifeEvents}>
            {result.lifeEvents.map((ev, i) => (
              <div key={i} style={{
                borderBottom: i < result.lifeEvents.length - 1
                  ? "1px solid rgba(201,168,76,0.1)"
                  : "none",
                paddingBottom: "10px",
                marginBottom: "10px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <span style={{
                    color: GOLD,
                    fontSize: "12px",
                    fontWeight: "bold",
                    fontFamily: SERIF,
                    minWidth: "18px",
                  }}>
                    {i + 1}.
                  </span>
                  <span style={tagStyle}>{ev.category}</span>
                </div>
                <div style={{ ...valueStyle, paddingLeft: "26px" }}>
                  {ev.description}
                </div>
              </div>
            ))}
          </SectionCard>

          {/* Action buttons */}
          <div style={{
            display: "flex",
            gap: "10px",
            justifyContent: "flex-end",
            paddingTop: "4px",
            paddingBottom: "20px",
            flexWrap: "wrap",
          }}>
            <button
              type="button"
              onClick={() => void handleCopy()}
              style={{
                background: "transparent",
                border: "1px solid rgba(201,168,76,0.5)",
                color: GOLD,
                borderRadius: "4px",
                padding: "9px 18px",
                fontFamily: SERIF,
                fontSize: "13px",
                cursor: "pointer",
                letterSpacing: "0.3px",
              }}
            >
              {copied ? "Copied!" : "Copy Text"}
            </button>
            <button
              type="button"
              onClick={handleUseBackstory}
              style={{
                background: "linear-gradient(135deg, #8b6914, #c9a84c)",
                color: "#1a1a2e",
                border: "none",
                borderRadius: "6px",
                padding: "10px 22px",
                fontSize: "13px",
                fontFamily: SERIF,
                fontWeight: "bold",
                cursor: "pointer",
                letterSpacing: "0.5px",
              }}
            >
              Add to Backstory
            </button>
          </div>
        </>
      )}
    </div>
  );
}
