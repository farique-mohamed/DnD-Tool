import { type CharacterData, proficiencyBonus, mod, modStr, SAVING_THROW_PROFICIENCIES, SKILLS, ABILITY_NAMES } from "./shared";
import { useRaces } from "@/hooks/useStaticData";
import type { RaceInfo } from "@/lib/raceData";
import { LoadingSkeleton } from "@/components/ui";
import { FeatCard } from "./FeatCard";

function RaceFeaturesSection({
  character,
  sectionTitle,
}: {
  character: CharacterData;
  sectionTitle: React.CSSProperties;
}) {
  const { data: raceHookData, isLoading: racesHookLoading } = useRaces();

  if (racesHookLoading || !raceHookData) return <LoadingSkeleton />;
  const { getRaceByNameAndSource, getRaceByName } = raceHookData;

  const raceInfo: RaceInfo | undefined =
    getRaceByNameAndSource(character.race, character.rulesSource ?? "PHB") ??
    getRaceByName(character.race);

  if (!raceInfo) {
    return (
      <div
        style={{
          background: "rgba(0,0,0,0.5)",
          border: "1px solid rgba(201,168,76,0.3)",
          borderRadius: "12px",
          padding: "20px 24px",
        }}
      >
        <p style={sectionTitle}>Race Features</p>
        <p
          style={{
            color: "#a89060",
            fontSize: "13px",
            fontFamily: "'Georgia', serif",
            fontStyle: "italic",
          }}
        >
          Race features not available for &ldquo;{character.race}&rdquo;.
        </p>
      </div>
    );
  }

  const badgeStyle: React.CSSProperties = {
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: "12px",
    fontSize: "11px",
    fontFamily: "'Georgia', serif",
    letterSpacing: "0.04em",
    background: "rgba(201,168,76,0.1)",
    border: "1px solid rgba(201,168,76,0.3)",
    color: "#c9a84c",
  };

  return (
    <div
      style={{
        background: "rgba(0,0,0,0.5)",
        border: "1px solid rgba(201,168,76,0.3)",
        borderRadius: "12px",
        padding: "20px 24px",
      }}
    >
      <p style={sectionTitle}>
        {raceInfo.name} {raceInfo.source === "XPHB" ? "(2024)" : "(2014)"} —
        Race Features
      </p>

      {/* Meta info: speed, size, languages */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        <span style={badgeStyle}>Speed: {raceInfo.speed} ft.</span>
        <span style={badgeStyle}>Size: {raceInfo.size}</span>
        {(() => {
          // Show the character's actual saved languages instead of the race template
          let langs: string[] = [];
          try {
            langs = character.languages ? JSON.parse(character.languages) : [];
          } catch { /* fallback to empty */ }
          // Fall back to race template if character has no saved languages
          const displayLangs = langs.length > 0 ? langs : raceInfo.languages;
          return displayLangs.map((lang) => (
            <span key={lang} style={badgeStyle}>
              {lang}
            </span>
          ));
        })()}
      </div>

      {/* Ability Score Increase (PHB 2014 races) */}
      {raceInfo.abilityScoreIncrease && (
        <div
          style={{
            marginBottom: "14px",
            padding: "8px 14px",
            background: "rgba(201,168,76,0.06)",
            borderLeft: "3px solid #c9a84c",
            borderRadius: "0 6px 6px 0",
          }}
        >
          <span
            style={{
              color: "#b8934a",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "1.2px",
              fontFamily: "'Georgia', serif",
              fontWeight: "bold",
            }}
          >
            Ability Score Increase
          </span>
          <p
            style={{
              color: "#e8d5a3",
              fontSize: "13px",
              fontFamily: "'Georgia', serif",
              lineHeight: 1.5,
              margin: "4px 0 0",
            }}
          >
            {raceInfo.abilityScoreIncrease}
          </p>
        </div>
      )}

      {/* Racial traits */}
      {raceInfo.traits.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {raceInfo.traits.map((trait) => (
            <div
              key={trait.name}
              style={{
                padding: "10px 14px",
                background: "rgba(201,168,76,0.04)",
                borderLeft: "3px solid rgba(201,168,76,0.5)",
                borderRadius: "0 6px 6px 0",
              }}
            >
              <span
                style={{
                  color: "#c9a84c",
                  fontSize: "13px",
                  fontWeight: "bold",
                  fontFamily: "'Georgia', serif",
                }}
              >
                {trait.name}
              </span>
              <p
                style={{
                  color: "#e8d5a3",
                  fontSize: "13px",
                  fontFamily: "'Georgia', serif",
                  lineHeight: 1.5,
                  margin: "4px 0 0",
                }}
              >
                {trait.description}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* No traits fallback (e.g., PHB Human) */}
      {raceInfo.traits.length === 0 && !raceInfo.abilityScoreIncrease && (
        <p
          style={{
            color: "#a89060",
            fontSize: "13px",
            fontFamily: "'Georgia', serif",
            fontStyle: "italic",
          }}
        >
          No additional racial traits.
        </p>
      )}
    </div>
  );
}

export function OverviewTab({ character, isMobile }: { character: CharacterData; isMobile?: boolean }) {
  const prof = proficiencyBonus(character.level);
  const savingProfs =
    SAVING_THROW_PROFICIENCIES[character.characterClass] ?? [];

  const abilityScores: Record<string, number> = {
    strength: character.strength,
    dexterity: character.dexterity,
    constitution: character.constitution,
    intelligence: character.intelligence,
    wisdom: character.wisdom,
    charisma: character.charisma,
  };

  // Skill proficiencies (read-only from character data)
  const proficientSkills: string[] = (() => {
    try {
      return JSON.parse(character.skillProficiencies || "[]") as string[];
    } catch {
      return [];
    }
  })();

  // Skill expertise (read-only from character data)
  const expertiseSkills: string[] = (() => {
    try {
      return JSON.parse(character.skillExpertise || "[]") as string[];
    } catch {
      return [];
    }
  })();

  const sectionTitle: React.CSSProperties = {
    color: "#c9a84c",
    fontSize: "12px",
    fontWeight: "bold",
    letterSpacing: "2px",
    textTransform: "uppercase",
    marginBottom: "16px",
    paddingBottom: "8px",
    borderBottom: "1px solid rgba(201,168,76,0.2)",
    fontFamily: "'Georgia', serif",
  };

  return (
    <div>
      <div
        style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "20px" }}
      >
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Ability Scores */}
          <div
            style={{
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(201,168,76,0.3)",
              borderRadius: "12px",
              padding: "20px 24px",
            }}
          >
            <p style={sectionTitle}>Ability Scores</p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "12px",
              }}
            >
              {ABILITY_NAMES.map(({ key, label }) => (
                <div
                  key={key}
                  style={{
                    textAlign: "center",
                    background: "rgba(201,168,76,0.05)",
                    border: "1px solid rgba(201,168,76,0.2)",
                    borderRadius: "8px",
                    padding: "12px 8px",
                  }}
                >
                  <div
                    style={{
                      color: "#b8934a",
                      fontSize: "10px",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      fontFamily: "'Georgia', serif",
                      marginBottom: "6px",
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      color: "#e8d5a3",
                      fontSize: "22px",
                      fontWeight: "bold",
                      fontFamily: "'Georgia', serif",
                      lineHeight: 1,
                    }}
                  >
                    {abilityScores[key]}
                  </div>
                  <div
                    style={{
                      color: "#a89060",
                      fontSize: "13px",
                      fontFamily: "'Georgia', serif",
                      marginTop: "4px",
                    }}
                  >
                    {modStr(abilityScores[key]!)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Race Features */}
          <RaceFeaturesSection
            character={character}
            sectionTitle={sectionTitle}
          />

          {/* Saving Throws */}
          <div
            style={{
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(201,168,76,0.3)",
              borderRadius: "12px",
              padding: "20px 24px",
            }}
          >
            <p style={sectionTitle}>Saving Throws</p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {ABILITY_NAMES.map(({ key, label }) => {
                const isProficient = savingProfs.includes(key);
                const total =
                  mod(abilityScores[key]!) + (isProficient ? prof : 0);
                const totalStr = total >= 0 ? `+${total}` : `${total}`;
                return (
                  <div
                    key={key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <span
                      style={{
                        color: isProficient ? "#c9a84c" : "#a89060",
                        fontSize: "12px",
                      }}
                    >
                      {isProficient ? "●" : "○"}
                    </span>
                    <span
                      style={{
                        color: "#e8d5a3",
                        fontSize: "13px",
                        fontFamily: "'Georgia', serif",
                        flex: 1,
                      }}
                    >
                      {label}
                    </span>
                    <span
                      style={{
                        color: "#e8d5a3",
                        fontSize: "13px",
                        fontFamily: "'Georgia', serif",
                        fontWeight: isProficient ? "bold" : "normal",
                      }}
                    >
                      {totalStr}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: Skills */}
        <div
          style={{
            background: "rgba(0,0,0,0.5)",
            border: "1px solid rgba(201,168,76,0.3)",
            borderRadius: "12px",
            padding: "20px 24px",
            maxHeight: "550px",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              marginBottom: "16px",
              paddingBottom: "8px",
              borderBottom: "1px solid rgba(201,168,76,0.2)",
            }}
          >
            <p
              style={{
                ...sectionTitle,
                marginBottom: 0,
                paddingBottom: 0,
                borderBottom: "none",
              }}
            >
              Skills
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            {SKILLS.map(({ name, ability }) => {
              const score = abilityScores[ability] ?? 10;
              const baseMod = mod(score);
              const hasExpertise = expertiseSkills.includes(name);
              const isProficient = proficientSkills.includes(name);
              const total = hasExpertise
                ? baseMod + prof * 2
                : isProficient
                  ? baseMod + prof
                  : baseMod;
              const skillStr = total >= 0 ? `+${total}` : `${total}`;
              const abilityLabel =
                ABILITY_NAMES.find((a) => a.key === ability)?.label ?? "";
              const indicator = hasExpertise ? "★" : isProficient ? "●" : "○";
              const indicatorColor =
                hasExpertise || isProficient ? "#c9a84c" : "#a89060";
              const isHighlighted = hasExpertise || isProficient;
              return (
                <div
                  key={name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    borderRadius: "4px",
                    padding: "2px 4px",
                  }}
                >
                  <span style={{ color: indicatorColor, fontSize: "12px" }}>
                    {indicator}
                  </span>
                  <span
                    style={{
                      color: "#e8d5a3",
                      fontSize: "13px",
                      fontFamily: "'Georgia', serif",
                      flex: 1,
                      fontWeight: isHighlighted ? "bold" : "normal",
                    }}
                  >
                    {name}
                  </span>
                  <span
                    style={{
                      color: "#a89060",
                      fontSize: "11px",
                      fontFamily: "'Georgia', serif",
                    }}
                  >
                    ({abilityLabel})
                  </span>
                  <span
                    style={{
                      color: isHighlighted ? "#c9a84c" : "#e8d5a3",
                      fontSize: "13px",
                      fontFamily: "'Georgia', serif",
                      fontWeight: isHighlighted ? "bold" : "normal",
                    }}
                  >
                    {skillStr}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Backstory */}
      {character.backstory && (
        <div
          style={{
            background: "rgba(0,0,0,0.5)",
            border: "1px solid rgba(201,168,76,0.3)",
            borderRadius: "12px",
            padding: "20px 24px",
            marginTop: "20px",
          }}
        >
          <p style={sectionTitle}>Backstory</p>
          <p
            style={{
              color: "#e8d5a3",
              fontSize: "14px",
              fontFamily: "'Georgia', serif",
              lineHeight: 1.7,
              whiteSpace: "pre-wrap",
            }}
          >
            {character.backstory}
          </p>
        </div>
      )}

      {/* Feats */}
      {(() => {
        const feats: string[] = (() => {
          try {
            return character.feats
              ? (JSON.parse(character.feats) as string[])
              : [];
          } catch {
            return [];
          }
        })();
        if (feats.length === 0) return null;
        return (
          <div
            style={{
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(201,168,76,0.3)",
              borderRadius: "12px",
              padding: "20px 24px",
              marginTop: "20px",
            }}
          >
            <p style={sectionTitle}>Feats</p>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {feats.map((featName) => (
                <FeatCard
                  key={featName}
                  featName={featName}
                  rulesSource={character.rulesSource || "PHB"}
                />
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
