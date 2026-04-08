import { useMemo } from "react";
import { sectionTitleStyle, chipBaseStyle, inputStyle } from "./shared";
import { getLevelUpChoices, FIGHTING_STYLE_DESCRIPTIONS } from "@/lib/levelUpChoicesData";
import type { LevelUpChoice } from "@/lib/levelUpChoicesData";
import { STANDARD_LANGUAGES, EXOTIC_LANGUAGES, RARE_LANGUAGES } from "@/lib/languageData";

interface ClassFeatureChoicesSectionProps {
  characterClass: string;
  rulesSource: "PHB" | "XPHB";
  subclass?: string;
  /** Record<storageKey, selectedValues[]> */
  selections: Record<string, string[]>;
  onSelectionsChange: (selections: Record<string, string[]>) => void;
  /** Languages already selected (race + background) to avoid duplicates */
  existingLanguages?: string[];
}

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

export function ClassFeatureChoicesSection({
  characterClass,
  rulesSource,
  subclass,
  selections,
  onSelectionsChange,
  existingLanguages = [],
}: ClassFeatureChoicesSectionProps) {
  const choices = useMemo(
    () => (characterClass ? getLevelUpChoices(characterClass, 1, rulesSource, subclass) : []),
    [characterClass, rulesSource, subclass],
  );

  if (choices.length === 0) return null;

  const storageKey = (choice: LevelUpChoice) => choice.featureName.replace(/\s+/g, "");

  const handleToggle = (choice: LevelUpChoice, value: string) => {
    const key = storageKey(choice);
    const current = selections[key] ?? [];
    let updated: string[];
    if (current.includes(value)) {
      updated = current.filter((v) => v !== value);
    } else if (current.length < choice.count) {
      updated = [...current, value];
    } else {
      return;
    }
    onSelectionsChange({ ...selections, [key]: updated });
  };

  const handleDropdownChange = (choice: LevelUpChoice, index: number, value: string) => {
    const key = storageKey(choice);
    const current = [...(selections[key] ?? [])];
    if (value === "") {
      current.splice(index, 1);
    } else {
      current[index] = value;
    }
    onSelectionsChange({ ...selections, [key]: current.filter(Boolean) });
  };

  const existingLangSet = new Set(existingLanguages.map((l) => l.toLowerCase()));

  return (
    <div>
      <p style={sectionTitleStyle}>Class Feature Choices</p>
      <p style={{ ...subLabelStyle, marginBottom: "16px" }}>
        Level 1 choices for <span style={{ color: "#c9a84c" }}>{characterClass}</span>
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {choices.map((choice) => {
          const key = storageKey(choice);
          const selected = selections[key] ?? [];

          if (choice.type === "fighting_style" || (choice.type === "skill" && choice.options) || (choice.type === "tool" && choice.options)) {
            // Chip-based selection
            const options = choice.options ?? [];
            return (
              <div key={key}>
                <p style={subLabelStyle}>
                  <span style={{ color: "#c9a84c" }}>{choice.featureName}</span> — {choice.description}
                  {" "}({selected.length}/{choice.count} selected)
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {options.map((opt) => {
                    const isSelected = selected.includes(opt);
                    return (
                      <span
                        key={opt}
                        style={isSelected ? activeChipStyle : inactiveChipStyle}
                        onClick={() => handleToggle(choice, opt)}
                      >
                        {opt}
                      </span>
                    );
                  })}
                </div>
                {/* Show fighting style description for selected */}
                {choice.type === "fighting_style" && selected.length > 0 && (
                  <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    {selected.map((sel) => {
                      const desc = FIGHTING_STYLE_DESCRIPTIONS[sel];
                      if (!desc) return null;
                      return (
                        <div
                          key={sel}
                          style={{
                            padding: "8px 14px",
                            background: "rgba(201,168,76,0.06)",
                            borderLeft: "3px solid rgba(201,168,76,0.5)",
                            borderRadius: "0 6px 6px 0",
                          }}
                        >
                          <span style={{ color: "#c9a84c", fontSize: "12px", fontWeight: "bold", fontFamily: "'EB Garamond', 'Georgia', serif" }}>
                            {sel}
                          </span>
                          <p style={{ color: "#e8d5a3", fontSize: "13px", fontFamily: "'EB Garamond', 'Georgia', serif", lineHeight: 1.5, margin: "4px 0 0" }}>
                            {desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          if (choice.type === "language") {
            // Language dropdown selection
            const availableStandard = STANDARD_LANGUAGES.filter(
              (l) => !existingLangSet.has(l.toLowerCase()) && !selected.includes(l),
            );
            const availableExotic = EXOTIC_LANGUAGES.filter(
              (l) => !existingLangSet.has(l.toLowerCase()) && !selected.includes(l),
            );
            const availableRare = RARE_LANGUAGES.filter(
              (l) => !existingLangSet.has(l.toLowerCase()) && !selected.includes(l),
            );

            return (
              <div key={key}>
                <p style={subLabelStyle}>
                  <span style={{ color: "#c9a84c" }}>{choice.featureName}</span> — {choice.description}
                  {" "}({selected.length}/{choice.count} selected)
                </p>
                {Array.from({ length: choice.count }).map((_, i) => (
                  <div key={`${key}-${i}`} style={{ marginBottom: i < choice.count - 1 ? "8px" : 0 }}>
                    <select
                      value={selected[i] ?? ""}
                      onChange={(e) => handleDropdownChange(choice, i, e.target.value)}
                      style={{ ...inputStyle, cursor: "pointer", maxWidth: "300px" }}
                    >
                      <option value="" style={{ background: "#1a1a2e" }}>Select a language...</option>
                      {selected[i] && (
                        <option value={selected[i]} style={{ background: "#1a1a2e" }}>{selected[i]}</option>
                      )}
                      {availableStandard.length > 0 && (
                        <optgroup label="Standard Languages">
                          {availableStandard.map((l) => (
                            <option key={l} value={l} style={{ background: "#1a1a2e" }}>{l}</option>
                          ))}
                        </optgroup>
                      )}
                      {availableExotic.length > 0 && (
                        <optgroup label="Exotic Languages">
                          {availableExotic.map((l) => (
                            <option key={l} value={l} style={{ background: "#1a1a2e" }}>{l}</option>
                          ))}
                        </optgroup>
                      )}
                      {availableRare.length > 0 && (
                        <optgroup label="Rare Languages">
                          {availableRare.map((l) => (
                            <option key={l} value={l} style={{ background: "#1a1a2e" }}>{l}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                ))}
              </div>
            );
          }

          // Cantrip or other types — just show the options as chips
          if (choice.options) {
            return (
              <div key={key}>
                <p style={subLabelStyle}>
                  <span style={{ color: "#c9a84c" }}>{choice.featureName}</span> — {choice.description}
                  {" "}({selected.length}/{choice.count} selected)
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {choice.options.map((opt) => {
                    const isSelected = selected.includes(opt);
                    return (
                      <span
                        key={opt}
                        style={isSelected ? activeChipStyle : inactiveChipStyle}
                        onClick={() => handleToggle(choice, opt)}
                      >
                        {opt}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
