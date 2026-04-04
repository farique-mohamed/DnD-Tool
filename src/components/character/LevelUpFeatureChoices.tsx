// ---------------------------------------------------------------------------
// LevelUpFeatureChoices — renders dynamic choices during level-up
// (languages, skills, fighting styles, tool proficiencies, etc.)
// ---------------------------------------------------------------------------

import { useState, useCallback } from "react";
import type { LevelUpChoice } from "@/lib/levelUpChoicesData";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Tracks the user's selections for each choice (keyed by featureName+type) */
export type FeatureSelections = Record<string, string[]>;

interface Props {
  choices: LevelUpChoice[];
  existingLanguages: string[];
  existingSkills: string[];
  selections: FeatureSelections;
  onSelectionChange: (selections: FeatureSelections) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function choiceKey(choice: LevelUpChoice): string {
  return `${choice.featureName}__${choice.type}`;
}

const SECTION_LABEL_STYLE: React.CSSProperties = {
  color: "#b8934a",
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontFamily: "'Georgia', serif",
  marginBottom: "8px",
};

const DESC_STYLE: React.CSSProperties = {
  color: "#a89060",
  fontSize: "12px",
  fontFamily: "'Georgia', serif",
  marginBottom: "10px",
};

const PILL_BASE: React.CSSProperties = {
  borderRadius: "20px",
  padding: "4px 12px",
  fontSize: "11px",
  fontFamily: "'Georgia', serif",
  cursor: "pointer",
  border: "1px solid rgba(201,168,76,0.2)",
  background: "rgba(30,15,5,0.6)",
  color: "#a89060",
};

const PILL_SELECTED: React.CSSProperties = {
  ...PILL_BASE,
  background: "rgba(201,168,76,0.25)",
  border: "1px solid rgba(201,168,76,0.6)",
  color: "#e8d5a3",
  fontWeight: "bold",
};

const SELECT_STYLE: React.CSSProperties = {
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
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LevelUpFeatureChoices({
  choices,
  existingLanguages,
  existingSkills,
  selections,
  onSelectionChange,
}: Props) {
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});

  const toggleOption = useCallback(
    (key: string, option: string, maxCount: number) => {
      const current = selections[key] ?? [];
      let updated: string[];
      if (current.includes(option)) {
        updated = current.filter((o) => o !== option);
      } else {
        if (current.length >= maxCount) return;
        updated = [...current, option];
      }
      onSelectionChange({ ...selections, [key]: updated });
    },
    [selections, onSelectionChange],
  );

  const setDropdownValue = useCallback(
    (key: string, index: number, value: string) => {
      const current = [...(selections[key] ?? [])];
      current[index] = value;
      onSelectionChange({ ...selections, [key]: current });
    },
    [selections, onSelectionChange],
  );

  if (choices.length === 0) return null;

  return (
    <>
      {choices.map((choice) => {
        const key = choiceKey(choice);
        const selected = selections[key] ?? [];
        const options = choice.options ?? [];
        const search = searchTerms[key] ?? "";

        // For language/tool choices with many options, use dropdown(s)
        const useDropdown =
          choice.type === "language" || (choice.type === "tool" && options.length > 6);

        // For skill/fighting_style with reasonable option counts, use pills
        const usePills = !useDropdown;

        // Filter out already-known items from options
        const filteredOptions = options.filter((opt) => {
          if (choice.type === "language") return !existingLanguages.includes(opt);
          if (choice.type === "skill") return !existingSkills.includes(opt);
          return true;
        });

        const searchedOptions = search
          ? filteredOptions.filter((o) =>
              o.toLowerCase().includes(search.toLowerCase()),
            )
          : filteredOptions;

        return (
          <div key={key} style={{ marginBottom: "20px" }}>
            <p style={SECTION_LABEL_STYLE}>{choice.featureName}</p>
            <p style={DESC_STYLE}>
              {choice.description}
              {selected.length > 0 && (
                <span style={{ color: "#c9a84c", marginLeft: "8px" }}>
                  ({selected.filter((s) => s !== "").length}/{choice.count})
                </span>
              )}
            </p>

            {useDropdown && (
              <>
                {/* Search for language choices */}
                {filteredOptions.length > 10 && (
                  <input
                    type="text"
                    placeholder={`Search ${choice.type === "language" ? "languages" : "tools"}...`}
                    value={search}
                    onChange={(e) =>
                      setSearchTerms({ ...searchTerms, [key]: e.target.value })
                    }
                    style={{
                      ...SELECT_STYLE,
                      marginBottom: "8px",
                    }}
                  />
                )}
                {Array.from({ length: choice.count }).map((_, idx) => (
                  <select
                    key={`${key}-${idx}`}
                    value={selected[idx] ?? ""}
                    onChange={(e) => setDropdownValue(key, idx, e.target.value)}
                    style={SELECT_STYLE}
                  >
                    <option value="">-- Select --</option>
                    {searchedOptions.map((opt) => {
                      // Disable if already selected in another dropdown for this choice
                      const alreadyPicked = selected.some(
                        (s, i) => i !== idx && s === opt,
                      );
                      return (
                        <option key={opt} value={opt} disabled={alreadyPicked}>
                          {opt}
                        </option>
                      );
                    })}
                  </select>
                ))}
              </>
            )}

            {usePills && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {filteredOptions.map((opt) => {
                  const isSelected = selected.includes(opt);
                  const isFull = selected.length >= choice.count && !isSelected;
                  return (
                    <button
                      key={opt}
                      onClick={
                        isFull ? undefined : () => toggleOption(key, opt, choice.count)
                      }
                      style={{
                        ...(isSelected ? PILL_SELECTED : PILL_BASE),
                        opacity: isFull ? 0.5 : 1,
                        cursor: isFull ? "not-allowed" : "pointer",
                      }}
                    >
                      {isSelected && "\u2605 "}
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

// ---------------------------------------------------------------------------
// Validation helper — check all choices are filled
// ---------------------------------------------------------------------------

export function validateFeatureChoices(
  choices: LevelUpChoice[],
  selections: FeatureSelections,
): string | null {
  for (const choice of choices) {
    const key = choiceKey(choice);
    const selected = (selections[key] ?? []).filter((s) => s !== "");
    if (selected.length < choice.count) {
      return `Please make ${choice.count} selection${choice.count > 1 ? "s" : ""} for "${choice.featureName}" (${choice.type}).`;
    }
  }
  return null;
}

/**
 * Categorize selections by type for saving to backend.
 * Returns { languages: string[], skills: string[], fightingStyles: string[], tools: string[], other: Record<string, string[]> }
 */
export function categorizeSelections(
  choices: LevelUpChoice[],
  selections: FeatureSelections,
): {
  languages: string[];
  skills: string[];
  others: Record<string, string[]>;
} {
  const languages: string[] = [];
  const skills: string[] = [];
  const others: Record<string, string[]> = {};

  for (const choice of choices) {
    const key = choiceKey(choice);
    const selected = (selections[key] ?? []).filter((s) => s !== "");
    if (selected.length === 0) continue;

    if (choice.type === "language") {
      languages.push(...selected);
    } else if (choice.type === "skill") {
      skills.push(...selected);
    } else {
      // fighting_style, tool, cantrip — group by featureName
      const storageKey = choice.featureName.replace(/\s+/g, "");
      others[storageKey] = [...(others[storageKey] ?? []), ...selected];
    }
  }

  return { languages, skills, others };
}
