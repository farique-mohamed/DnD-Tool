import { useState } from "react";
import {
  GOLD,
  GOLD_MUTED,
  GOLD_BRIGHT,
  SERIF,
  SAVING_THROW_PROFICIENCIES,
  ABILITY_NAMES_SHORT,
  SKILLS_LIST,
  parseJsonArray,
  abilityModifier,
  modString,
} from "./shared";
import { DmNotesSection } from "./DmNotesSection";
import { DmInventoryPanel } from "./DmInventoryPanel";

type CharSheetTab = "sheet" | "notes" | "inventory";

export function CharacterSheetModal({
  character,
  username,
  adventureId,
  toUserId,
  adventurePlayerId,
  adventureItems,
  playerNote,
  onClose,
}: {
  character: Record<string, unknown>;
  username: string;
  adventureId: string;
  toUserId: string;
  adventurePlayerId: string;
  adventureItems: { id: string; name: string; source: string }[];
  playerNote?: string;
  onClose: () => void;
}) {
  const [charSheetTab, setCharSheetTab] = useState<CharSheetTab>("sheet");

  const name = character.name as string | undefined;
  const race = character.race as string | undefined;
  const charClass = character.characterClass as string | undefined;
  const level = (character.level as number | undefined) ?? 1;
  const subclass = character.subclass as string | undefined;
  const alignment = character.alignment as string | undefined;
  const backstory = character.backstory as string | undefined;
  const background = character.background as string | undefined;
  const characterId = character.id as string;
  const classSource = (character.rulesSource as string) ?? "PHB";

  const str = (character.strength as number | undefined) ?? 10;
  const dex = (character.dexterity as number | undefined) ?? 10;
  const con = (character.constitution as number | undefined) ?? 10;
  const int = (character.intelligence as number | undefined) ?? 10;
  const wis = (character.wisdom as number | undefined) ?? 10;
  const cha = (character.charisma as number | undefined) ?? 10;
  const maxHp = (character.maxHp as number | undefined) ?? 0;
  const currentHp = (character.currentHp as number | undefined) ?? 0;
  const tempHp = (character.tempHp as number | undefined) ?? 0;
  const ac = (character.armorClass as number | undefined) ?? 10;
  const speed = (character.speed as number | undefined) ?? 30;

  const abilityScores: Record<string, number> = {
    strength: str,
    dexterity: dex,
    constitution: con,
    intelligence: int,
    wisdom: wis,
    charisma: cha,
  };

  const prof = Math.ceil(level / 4) + 1;
  const initiative = abilityModifier(dex);
  const initiativeStr = initiative >= 0 ? `+${initiative}` : `${initiative}`;

  const savingProfs = SAVING_THROW_PROFICIENCIES[charClass ?? ""] ?? [];
  const proficientSkills = parseJsonArray(character.skillProficiencies);
  const expertiseSkills = parseJsonArray(character.skillExpertise);
  const activeConditions = parseJsonArray(character.activeConditions);
  const feats = parseJsonArray(character.feats);

  const sectionTitle: React.CSSProperties = {
    color: GOLD,
    fontSize: "12px",
    fontWeight: "bold",
    letterSpacing: "2px",
    textTransform: "uppercase",
    marginBottom: "12px",
    paddingBottom: "8px",
    borderBottom: "1px solid rgba(201,168,76,0.2)",
    fontFamily: SERIF,
  };

  const charSheetTabs: Array<{ key: CharSheetTab; label: string }> = [
    { key: "sheet", label: "Character Sheet" },
    { key: "notes", label: "Notes" },
    { key: "inventory", label: "Inventory" },
  ];

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        zIndex: 1000,
        overflowY: "auto",
        padding: "40px 20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "linear-gradient(180deg, rgba(20,12,5,0.98) 0%, rgba(10,6,2,0.98) 100%)",
          border: "2px solid rgba(201,168,76,0.5)",
          borderRadius: "16px",
          padding: "32px",
          maxWidth: "800px",
          width: "100%",
          position: "relative",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "1px solid rgba(201,168,76,0.3)",
            color: GOLD_MUTED,
            borderRadius: "4px",
            padding: "4px 12px",
            fontFamily: SERIF,
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          Close
        </button>

        {/* Header */}
        <div style={{ marginBottom: "16px" }}>
          <p
            style={{
              color: GOLD_MUTED,
              fontSize: "11px",
              fontFamily: SERIF,
              letterSpacing: "1px",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}
          >
            {username}&apos;s Character
          </p>
          <h2
            style={{
              color: GOLD,
              fontSize: "24px",
              fontWeight: "bold",
              fontFamily: SERIF,
              letterSpacing: "1px",
              marginBottom: "4px",
            }}
          >
            {name ?? "Unknown"}
          </h2>
          <p
            style={{
              color: GOLD_BRIGHT,
              fontSize: "14px",
              fontFamily: SERIF,
              lineHeight: 1.6,
            }}
          >
            Level {level} {race ?? ""} {charClass ?? ""}
            {subclass ? ` (${subclass})` : ""}
            {alignment ? ` \u2014 ${alignment}` : ""}
            {background ? ` \u2014 ${background}` : ""}
          </p>
        </div>

        {/* Tab bar */}
        <div
          style={{
            display: "flex",
            gap: "0",
            borderBottom: "1px solid rgba(201,168,76,0.3)",
            marginBottom: "24px",
          }}
        >
          {charSheetTabs.map((tab) => {
            const isActive = charSheetTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setCharSheetTab(tab.key)}
                style={{
                  padding: "10px 20px",
                  background: isActive ? "rgba(201,168,76,0.15)" : "transparent",
                  border: "none",
                  borderBottom: isActive
                    ? "2px solid #c9a84c"
                    : "2px solid transparent",
                  color: isActive ? GOLD : GOLD_MUTED,
                  fontSize: "12px",
                  fontFamily: SERIF,
                  fontWeight: "bold",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Character Sheet tab */}
        {charSheetTab === "sheet" && (
          <>
            {/* Ability Scores */}
            <div
              style={{
                background: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(201,168,76,0.3)",
                borderRadius: "12px",
                padding: "20px 24px",
                marginBottom: "16px",
              }}
            >
              <p style={sectionTitle}>Ability Scores</p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(6, 1fr)",
                  gap: "12px",
                }}
              >
                {ABILITY_NAMES_SHORT.map(({ key, label }) => (
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
                        fontFamily: SERIF,
                        marginBottom: "6px",
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        color: GOLD_BRIGHT,
                        fontSize: "22px",
                        fontWeight: "bold",
                        fontFamily: SERIF,
                        lineHeight: 1,
                      }}
                    >
                      {abilityScores[key]}
                    </div>
                    <div
                      style={{
                        color: GOLD_MUTED,
                        fontSize: "13px",
                        fontFamily: SERIF,
                        marginTop: "4px",
                      }}
                    >
                      {modString(abilityScores[key]!)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Combat Stats */}
            <div
              style={{
                background: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(201,168,76,0.3)",
                borderRadius: "12px",
                padding: "20px 24px",
                marginBottom: "16px",
              }}
            >
              <p style={sectionTitle}>Combat</p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "16px",
                  fontSize: "13px",
                  fontFamily: SERIF,
                }}
              >
                <div>
                  <div style={{ color: GOLD_MUTED, fontSize: "10px", letterSpacing: "1px", marginBottom: "4px" }}>HP</div>
                  <div style={{ color: GOLD_BRIGHT, fontSize: "18px", fontWeight: "bold" }}>
                    {currentHp}/{maxHp}
                    {tempHp > 0 && (
                      <span style={{ color: GOLD_MUTED, fontSize: "13px", fontWeight: "normal" }}>
                        {" "}(+{tempHp} temp)
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div style={{ color: GOLD_MUTED, fontSize: "10px", letterSpacing: "1px", marginBottom: "4px" }}>AC</div>
                  <div style={{ color: GOLD_BRIGHT, fontSize: "18px", fontWeight: "bold" }}>{ac}</div>
                </div>
                <div>
                  <div style={{ color: GOLD_MUTED, fontSize: "10px", letterSpacing: "1px", marginBottom: "4px" }}>SPEED</div>
                  <div style={{ color: GOLD_BRIGHT, fontSize: "18px", fontWeight: "bold" }}>{speed} ft.</div>
                </div>
                <div>
                  <div style={{ color: GOLD_MUTED, fontSize: "10px", letterSpacing: "1px", marginBottom: "4px" }}>INITIATIVE</div>
                  <div style={{ color: GOLD_BRIGHT, fontSize: "18px", fontWeight: "bold" }}>{initiativeStr}</div>
                </div>
                <div>
                  <div style={{ color: GOLD_MUTED, fontSize: "10px", letterSpacing: "1px", marginBottom: "4px" }}>PROFICIENCY</div>
                  <div style={{ color: GOLD_BRIGHT, fontSize: "18px", fontWeight: "bold" }}>+{prof}</div>
                </div>
              </div>
            </div>

            {/* Saving Throws & Skills side by side */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                marginBottom: "16px",
              }}
            >
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
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {ABILITY_NAMES_SHORT.map(({ key, label }) => {
                    const isProficient = savingProfs.includes(key);
                    const total =
                      abilityModifier(abilityScores[key]!) + (isProficient ? prof : 0);
                    const totalStr = total >= 0 ? `+${total}` : `${total}`;
                    return (
                      <div
                        key={key}
                        style={{ display: "flex", alignItems: "center", gap: "10px" }}
                      >
                        <span style={{ color: isProficient ? GOLD : GOLD_MUTED, fontSize: "12px" }}>
                          {isProficient ? "\u25CF" : "\u25CB"}
                        </span>
                        <span
                          style={{
                            color: GOLD_BRIGHT,
                            fontSize: "13px",
                            fontFamily: SERIF,
                            flex: 1,
                          }}
                        >
                          {label}
                        </span>
                        <span
                          style={{
                            color: GOLD_BRIGHT,
                            fontSize: "13px",
                            fontFamily: SERIF,
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

              {/* Skills */}
              <div
                style={{
                  background: "rgba(0,0,0,0.5)",
                  border: "1px solid rgba(201,168,76,0.3)",
                  borderRadius: "12px",
                  padding: "20px 24px",
                  maxHeight: "400px",
                  overflowY: "auto",
                }}
              >
                <p style={sectionTitle}>Skills</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                  {SKILLS_LIST.map(({ name: skillName, ability }) => {
                    const score = abilityScores[ability] ?? 10;
                    const baseMod = abilityModifier(score);
                    const hasExpertise = expertiseSkills.includes(skillName);
                    const isProficient = proficientSkills.includes(skillName);
                    const total = hasExpertise
                      ? baseMod + prof * 2
                      : isProficient
                        ? baseMod + prof
                        : baseMod;
                    const skillStr = total >= 0 ? `+${total}` : `${total}`;
                    const indicator = hasExpertise ? "\u2605" : isProficient ? "\u25CF" : "\u25CB";
                    const indicatorColor = hasExpertise || isProficient ? GOLD : GOLD_MUTED;
                    const isHighlighted = hasExpertise || isProficient;
                    const abilityLabel = ABILITY_NAMES_SHORT.find((a) => a.key === ability)?.label ?? "";
                    return (
                      <div
                        key={skillName}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "2px 4px",
                        }}
                      >
                        <span style={{ color: indicatorColor, fontSize: "12px" }}>{indicator}</span>
                        <span
                          style={{
                            color: GOLD_BRIGHT,
                            fontSize: "13px",
                            fontFamily: SERIF,
                            flex: 1,
                            fontWeight: isHighlighted ? "bold" : "normal",
                          }}
                        >
                          {skillName}
                        </span>
                        <span style={{ color: GOLD_MUTED, fontSize: "11px", fontFamily: SERIF }}>
                          ({abilityLabel})
                        </span>
                        <span
                          style={{
                            color: isHighlighted ? GOLD : GOLD_BRIGHT,
                            fontSize: "13px",
                            fontFamily: SERIF,
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

            {/* Active Conditions */}
            {activeConditions.length > 0 && (
              <div
                style={{
                  background: "rgba(0,0,0,0.5)",
                  border: "1px solid rgba(201,168,76,0.3)",
                  borderRadius: "12px",
                  padding: "20px 24px",
                  marginBottom: "16px",
                }}
              >
                <p style={sectionTitle}>Active Conditions</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {activeConditions.map((cond) => (
                    <span
                      key={cond}
                      style={{
                        background: "rgba(231,76,60,0.15)",
                        border: "1px solid rgba(201,168,76,0.4)",
                        borderRadius: "20px",
                        padding: "4px 14px",
                        fontSize: "12px",
                        fontFamily: SERIF,
                        color: "#e74c3c",
                        fontWeight: "bold",
                      }}
                    >
                      {cond}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Feats */}
            {feats.length > 0 && (
              <div
                style={{
                  background: "rgba(0,0,0,0.5)",
                  border: "1px solid rgba(201,168,76,0.3)",
                  borderRadius: "12px",
                  padding: "20px 24px",
                  marginBottom: "16px",
                }}
              >
                <p style={sectionTitle}>Feats</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {feats.map((feat) => (
                    <span
                      key={feat}
                      style={{
                        background: "rgba(201,168,76,0.1)",
                        border: "1px solid rgba(201,168,76,0.3)",
                        borderRadius: "20px",
                        padding: "4px 14px",
                        fontSize: "12px",
                        fontFamily: SERIF,
                        color: GOLD_BRIGHT,
                      }}
                    >
                      {feat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Backstory */}
            {backstory && (
              <div
                style={{
                  background: "rgba(0,0,0,0.5)",
                  border: "1px solid rgba(201,168,76,0.3)",
                  borderRadius: "12px",
                  padding: "20px 24px",
                  marginBottom: "16px",
                }}
              >
                <p style={sectionTitle}>Backstory</p>
                <p
                  style={{
                    color: GOLD_BRIGHT,
                    fontSize: "14px",
                    fontFamily: SERIF,
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {backstory}
                </p>
              </div>
            )}
          </>
        )}

        {/* Notes tab */}
        {charSheetTab === "notes" && (
          <>
            {/* Player's Note to DM (read-only) */}
            <div
              style={{
                background: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(101,168,126,0.3)",
                borderLeft: "3px solid rgba(101,168,126,0.6)",
                borderRadius: "12px",
                padding: "20px 24px",
                marginBottom: "16px",
              }}
            >
              <p
                style={{
                  color: GOLD,
                  fontSize: "12px",
                  fontWeight: "bold",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  marginBottom: "12px",
                  paddingBottom: "8px",
                  borderBottom: "1px solid rgba(201,168,76,0.2)",
                  fontFamily: SERIF,
                }}
              >
                Player&apos;s Note
              </p>
              {playerNote ? (
                <p
                  style={{
                    color: GOLD_BRIGHT,
                    fontSize: "13px",
                    fontFamily: SERIF,
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                    margin: 0,
                  }}
                >
                  {playerNote}
                </p>
              ) : (
                <p
                  style={{
                    color: GOLD_MUTED,
                    fontSize: "13px",
                    fontFamily: SERIF,
                    fontStyle: "italic",
                    margin: 0,
                  }}
                >
                  No note from player.
                </p>
              )}
            </div>
          <DmNotesSection
            adventureId={adventureId}
            characterId={characterId}
            toUserId={toUserId}
            playerNotes={null}
          />
          </>
        )}

        {/* Inventory tab */}
        {charSheetTab === "inventory" && (
          <DmInventoryPanel
            adventureId={adventureId}
            adventurePlayerId={adventurePlayerId}
            adventureItems={adventureItems}
            characterClass={charClass ?? ""}
            classSource={classSource}
            background={background ?? ""}
          />
        )}
      </div>
    </div>
  );
}
