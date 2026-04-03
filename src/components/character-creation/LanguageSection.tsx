import { useMemo } from "react";
import {
  sectionTitleStyle,
  labelStyle,
  inputStyle,
  chipBaseStyle,
} from "./shared";
import {
  STANDARD_LANGUAGES,
  EXOTIC_LANGUAGES,
  RARE_LANGUAGES,
  ALL_LANGUAGES,
} from "@/lib/languageData";
import type { RaceInfo } from "@/lib/raceData";

// Patterns that indicate a language choice rather than a fixed language
const CHOICE_PATTERNS = [
  "One extra language of your choice",
  "Two other languages of your choice",
];

function isChoiceEntry(lang: string): boolean {
  return CHOICE_PATTERNS.some((p) => lang.toLowerCase() === p.toLowerCase());
}

/** How many extra languages the race grants the player to choose. */
function getChoiceCount(raceLanguages: string[]): number {
  for (const lang of raceLanguages) {
    const lower = lang.toLowerCase();
    if (lower.includes("two other languages") || lower.includes("two extra languages")) return 2;
    if (lower.includes("one extra language") || lower.includes("one other language")) return 1;
  }
  return 0;
}

/** Extract fixed (non-choice) languages from the race data. */
function getFixedLanguages(raceLanguages: string[]): string[] {
  return raceLanguages.filter((l) => !isChoiceEntry(l));
}

interface LanguageSectionProps {
  raceInfo: RaceInfo | undefined;
  selectedLanguages: string[];
  onLanguagesChange: (languages: string[]) => void;
}

export function LanguageSection({
  raceInfo,
  selectedLanguages,
  onLanguagesChange,
}: LanguageSectionProps) {
  const raceLanguages = raceInfo?.languages ?? [];
  const fixedLanguages = useMemo(() => getFixedLanguages(raceLanguages), [raceLanguages]);
  const choiceCount = useMemo(() => getChoiceCount(raceLanguages), [raceLanguages]);

  // The chosen (non-fixed) languages the user has picked
  const chosenLanguages = useMemo(
    () => selectedLanguages.filter((l) => !fixedLanguages.includes(l)),
    [selectedLanguages, fixedLanguages],
  );

  // Languages that are already taken (fixed + chosen) — used to prevent duplicates
  const takenSet = useMemo(
    () => new Set([...fixedLanguages, ...chosenLanguages]),
    [fixedLanguages, chosenLanguages],
  );

  // When the race grants no choices but has fixed languages, allow 1 optional (DM discretion)
  const isDmDiscretion = choiceCount === 0 && fixedLanguages.length > 0;
  const effectiveChoiceCount = isDmDiscretion ? 1 : choiceCount;
  const canChooseMore = chosenLanguages.length < effectiveChoiceCount;

  // Available languages for the dropdown, grouped
  const availableStandard = useMemo(
    () => STANDARD_LANGUAGES.filter((l) => !takenSet.has(l)),
    [takenSet],
  );
  const availableExotic = useMemo(
    () => EXOTIC_LANGUAGES.filter((l) => !takenSet.has(l)),
    [takenSet],
  );
  const availableRare = useMemo(
    () => RARE_LANGUAGES.filter((l) => !takenSet.has(l)),
    [takenSet],
  );

  // Also allow any non-standard languages from the race's fixed list that might not be
  // in our canonical lists (e.g. "Auran", "Quori") to appear as fixed chips
  const hasAnyLanguage = fixedLanguages.length > 0 || choiceCount > 0;

  const handleAddLanguage = (lang: string) => {
    if (!lang || takenSet.has(lang)) return;
    if (chosenLanguages.length >= effectiveChoiceCount) return;
    onLanguagesChange([...selectedLanguages, lang]);
  };

  const handleRemoveLanguage = (lang: string) => {
    // Only allow removing chosen languages, not fixed ones
    if (fixedLanguages.includes(lang)) return;
    onLanguagesChange(selectedLanguages.filter((l) => l !== lang));
  };

  if (!raceInfo) {
    return (
      <div>
        <p style={sectionTitleStyle}>Languages</p>
        <p style={{ margin: 0, color: "#a89060", fontSize: "12px", fontFamily: "'Georgia', serif" }}>
          Select a race to see available languages.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p style={sectionTitleStyle}>Languages</p>

      {/* Fixed race languages */}
      {fixedLanguages.length > 0 && (
        <div style={{ marginBottom: (choiceCount > 0 || isDmDiscretion) ? "16px" : "0" }}>
          <p style={{ margin: "0 0 8px 0", color: "#a89060", fontSize: "12px", fontFamily: "'Georgia', serif" }}>
            <span style={{ color: "#c9a84c" }}>From Race</span>{" "}
            ({raceInfo.name}) — granted automatically
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {fixedLanguages.map((lang) => (
              <span
                key={`fixed-${lang}`}
                style={{
                  ...chipBaseStyle,
                  background: "rgba(201,168,76,0.12)",
                  borderColor: "rgba(201,168,76,0.35)",
                  color: "#a89060",
                  cursor: "default",
                  opacity: 0.85,
                }}
              >
                {lang}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Chosen extra languages */}
      {(choiceCount > 0 || isDmDiscretion) && (
        <div>
          <p style={{ margin: "0 0 8px 0", color: "#a89060", fontSize: "12px", fontFamily: "'Georgia', serif" }}>
            {isDmDiscretion ? (
              <>
                <span style={{ color: "#c9a84c" }}>Additional Language</span>{" "}
                <span style={{ fontStyle: "italic", color: "#a89060" }}>(DM&apos;s Discretion)</span>
              </>
            ) : (
              <>
                <span style={{ color: "#c9a84c" }}>Additional Languages</span>{" "}
                — choose {choiceCount} ({chosenLanguages.length}/{choiceCount} selected)
              </>
            )}
          </p>
          {isDmDiscretion && (
            <p style={{ margin: "0 0 8px 0", color: "#a89060", fontSize: "11px", fontFamily: "'Georgia', serif", fontStyle: "italic" }}>
              Under DM&apos;s discretion
            </p>
          )}

          {/* Selected extra language chips */}
          {chosenLanguages.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
              {chosenLanguages.map((lang) => (
                <span
                  key={`chosen-${lang}`}
                  style={{
                    ...chipBaseStyle,
                    background: "rgba(201,168,76,0.25)",
                    borderColor: "#c9a84c",
                    color: "#e8d5a3",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                  onClick={() => handleRemoveLanguage(lang)}
                >
                  {lang}
                  <span style={{ fontSize: "13px", lineHeight: 1, color: "#c9a84c" }}>×</span>
                </span>
              ))}
            </div>
          )}

          {/* Dropdown to add languages */}
          {canChooseMore && (
            <div>
              <label style={labelStyle}>Choose a Language</label>
              <select
                value=""
                onChange={(e) => handleAddLanguage(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer", maxWidth: "300px" }}
              >
                <option value="" disabled>Select a language...</option>
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
          )}
        </div>
      )}

      {/* Summary if no choices needed */}
      {!hasAnyLanguage && (
        <p style={{ margin: 0, color: "#a89060", fontSize: "12px", fontFamily: "'Georgia', serif" }}>
          This race does not grant any languages.
        </p>
      )}
    </div>
  );
}
