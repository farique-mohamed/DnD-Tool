import { AbilityScoreInput } from "./AbilityScoreInput";
import { sectionTitleStyle, chipBaseStyle, ABILITY_NAMES, type AbilityName, type FormState } from "./shared";
import type { RaceInfo } from "@/lib/raceData";
import { useIsMobile } from "@/hooks/useIsMobile";

interface AbilityScoreSectionProps {
  form: FormState;
  racialBonuses: Record<AbilityName, number>;
  raceInfo: RaceInfo | undefined;
  xphbAsiMode: "2-1" | "1-1-1";
  xphbAsiChoices: Record<string, number>;
  racialAsiChoices: string[];
  onAbilityChange: (name: string, value: number) => void;
  onXphbAsiModeChange: (mode: "2-1" | "1-1-1") => void;
  onXphbAsiChoicesChange: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  onRacialAsiChoicesChange: React.Dispatch<React.SetStateAction<string[]>>;
}

export function AbilityScoreSection({
  form,
  racialBonuses,
  raceInfo,
  xphbAsiMode,
  xphbAsiChoices,
  racialAsiChoices,
  onAbilityChange,
  onXphbAsiModeChange,
  onXphbAsiChoicesChange,
  onRacialAsiChoicesChange,
}: AbilityScoreSectionProps) {
  const isMobile = useIsMobile();
  return (
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
          <p style={{ margin: 0, color: "#c9a84c", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1.2px", fontFamily: "'EB Garamond', 'Georgia', serif" }}>
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
                    onXphbAsiModeChange(opt.value);
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
                  fontFamily: "'EB Garamond', 'Georgia', serif",
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
                <span style={{ color: "#a89060", fontSize: "12px", fontFamily: "'EB Garamond', 'Georgia', serif", marginRight: "10px" }}>
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
                          onXphbAsiChoicesChange((prev) => {
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
                <span style={{ color: "#a89060", fontSize: "12px", fontFamily: "'EB Garamond', 'Georgia', serif", marginRight: "10px" }}>
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
                          onXphbAsiChoicesChange((prev) => {
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
              <span style={{ color: "#a89060", fontSize: "12px", fontFamily: "'EB Garamond', 'Georgia', serif", marginRight: "10px" }}>
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
                        onXphbAsiChoicesChange((prev) => {
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
            <p style={{ margin: 0, color: "#c9a84c", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1.2px", fontFamily: "'EB Garamond', 'Georgia', serif" }}>
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
                      onRacialAsiChoicesChange((prev) => {
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

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(6, 1fr)", gap: "12px" }}>
        {([
          { label: "STR", name: "strength" },
          { label: "DEX", name: "dexterity" },
          { label: "CON", name: "constitution" },
          { label: "INT", name: "intelligence" },
          { label: "WIS", name: "wisdom" },
          { label: "CHA", name: "charisma" },
        ] as const).map(({ label, name }) => (
          <AbilityScoreInput key={name} label={label} name={name} value={form[name]} bonus={racialBonuses[name]} onChange={onAbilityChange} />
        ))}
      </div>
    </div>
  );
}
