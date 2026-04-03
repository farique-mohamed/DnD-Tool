import { useState } from "react";
import { api } from "@/utils/api";
import { getClassByName, getClassByNameAndSource } from "@/lib/classData";
import type { FeatureDescription } from "@/lib/classData";
import { type CharacterData, FEATURE_USAGE_CONFIG } from "./shared";
import { RenderFeatureEntry } from "./RenderFeatureEntry";
import { SpellProgressionTable } from "./SpellProgressionTable";

export function ClassFeaturesTab({ character }: { character: CharacterData }) {
  const utils = api.useUtils();
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const [localFeatureUses, setLocalFeatureUses] = useState<
    Record<string, number>
  >(() => {
    try {
      return JSON.parse(character.featureUses || "{}") as Record<
        string,
        number
      >;
    } catch {
      return {};
    }
  });

  const updateFeatureUses = api.character.updateFeatureUses.useMutation({
    onSuccess: async () => {
      await utils.character.getById.invalidate({ id: character.id });
    },
  });

  const classInfo = character.rulesSource
    ? (getClassByNameAndSource(
        character.characterClass,
        character.rulesSource,
      ) ?? getClassByName(character.characterClass))
    : getClassByName(character.characterClass);

  if (!classInfo) {
    return (
      <div
        style={{
          color: "#a89060",
          fontFamily: "'Georgia', serif",
          fontSize: "14px",
          padding: "20px 0",
        }}
      >
        Class data not available for {character.characterClass}.
      </div>
    );
  }

  const toggleKey = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const abilityScoresForFeature: Record<string, number> = {
    strength: character.strength,
    dexterity: character.dexterity,
    constitution: character.constitution,
    intelligence: character.intelligence,
    wisdom: character.wisdom,
    charisma: character.charisma,
  };

  const toggleFeatureUse = (
    featName: string,
    slotIdx: number,
    currentUsed: number,
    maxUses: number,
  ) => {
    const newUsed =
      slotIdx < currentUsed
        ? currentUsed - 1
        : Math.min(currentUsed + 1, maxUses);
    const next = { ...localFeatureUses, [featName]: newUsed };
    setLocalFeatureUses(next);
    updateFeatureUses.mutate({ id: character.id, featureUses: next });
  };

  const handlePoolChange = (
    featName: string,
    newUsed: number,
    maxUses: number,
  ) => {
    const clamped = Math.max(0, Math.min(newUsed, maxUses));
    const next = { ...localFeatureUses, [featName]: clamped };
    setLocalFeatureUses(next);
    updateFeatureUses.mutate({ id: character.id, featureUses: next });
  };

  // Group features by level, up to character.level
  const featuresByLevel: Record<number, typeof classInfo.levelFeatures> = {};
  for (const feat of classInfo.levelFeatures) {
    if (feat.level > character.level) continue;
    if (!featuresByLevel[feat.level]) featuresByLevel[feat.level] = [];
    featuresByLevel[feat.level]!.push(feat);
  }

  // Inject actual subclass features when a subclass is selected
  if (character.subclass) {
    const selectedSubclass = classInfo.subclasses.find(
      (sc) => sc.name === character.subclass,
    );
    if (selectedSubclass) {
      for (const scFeat of selectedSubclass.features) {
        if (scFeat.level > character.level) continue;
        if (!featuresByLevel[scFeat.level]) featuresByLevel[scFeat.level] = [];
        // Avoid adding duplicates (the placeholder "Roguish Archetype feature" etc. is already there)
        const alreadyPresent = featuresByLevel[scFeat.level]!.some(
          (f) =>
            f.featureName === scFeat.featureName && f.level === scFeat.level,
        );
        if (!alreadyPresent) {
          featuresByLevel[scFeat.level]!.push(scFeat);
        }
      }
    }
  }

  const levels = Object.keys(featuresByLevel)
    .map(Number)
    .sort((a, b) => a - b);

  const findDescription = (
    featureName: string,
    level: number,
  ): FeatureDescription | undefined => {
    // For subclass features, also match on subclassName
    const selectedSubclass = character.subclass
      ? classInfo.subclasses.find((sc) => sc.name === character.subclass)
      : undefined;
    return classInfo.featureDescriptions.find(
      (d) =>
        d.name === featureName &&
        d.level === level &&
        (!d.isSubclassFeature ||
          d.subclassName === selectedSubclass?.shortName),
    );
  };

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
      <SpellProgressionTable character={character} />
      {levels.map((level) => (
        <div key={level} style={{ marginBottom: "24px" }}>
          <p style={sectionTitle}>Level {level}</p>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {featuresByLevel[level]!.map((feat) => {
              const key = `${feat.featureName}-${feat.level}`;
              const isExpanded = expandedKeys.has(key);
              const desc = findDescription(feat.featureName, feat.level);
              const isSubclass = feat.isSubclassFeature;
              const usageConfig = FEATURE_USAGE_CONFIG[feat.featureName];
              const maxUses = usageConfig
                ? usageConfig.maxUses(character.level, abilityScoresForFeature)
                : 0;
              const usedCount = localFeatureUses[feat.featureName] ?? 0;
              const showUsage = !!usageConfig && maxUses > 0;
              const usePool =
                showUsage && !isFinite(maxUses) === false && maxUses > 20;

              return (
                <div
                  key={key}
                  style={{
                    background: "rgba(0,0,0,0.5)",
                    border: "1px solid rgba(201,168,76,0.3)",
                    borderRadius: "10px",
                    padding: "14px 18px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        color: "#e8d5a3",
                        fontSize: "14px",
                        fontWeight: "bold",
                        fontFamily: "'Georgia', serif",
                        flex: 1,
                      }}
                    >
                      {feat.featureName}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        fontFamily: "'Georgia', serif",
                        letterSpacing: "0.5px",
                        background: isSubclass
                          ? "rgba(168,144,96,0.15)"
                          : "rgba(201,168,76,0.12)",
                        border: isSubclass
                          ? "1px solid rgba(168,144,96,0.3)"
                          : "1px solid rgba(201,168,76,0.25)",
                        color: isSubclass ? "#a89060" : "#c9a84c",
                      }}
                    >
                      {isSubclass ? "Subclass Feature" : "Class Feature"}
                    </span>
                    {desc && (
                      <button
                        onClick={() => toggleKey(key)}
                        style={{
                          background: "transparent",
                          border: "1px solid rgba(201,168,76,0.3)",
                          color: "#a89060",
                          borderRadius: "4px",
                          padding: "2px 10px",
                          fontSize: "11px",
                          fontFamily: "'Georgia', serif",
                          cursor: "pointer",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {isExpanded ? "Hide" : "Details"}
                      </button>
                    )}
                  </div>

                  {/* Feature usage tracker */}
                  {showUsage && isFinite(maxUses) && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginTop: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          color: "#b8934a",
                          fontSize: "11px",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          fontFamily: "'Georgia', serif",
                        }}
                      >
                        Uses:
                      </span>
                      {usePool ? (
                        // Pool-style (e.g. Lay on Hands): show number input
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <input
                            type="number"
                            min={0}
                            max={maxUses}
                            value={usedCount}
                            onChange={(e) =>
                              handlePoolChange(
                                feat.featureName,
                                parseInt(e.target.value) || 0,
                                maxUses,
                              )
                            }
                            style={{
                              width: "64px",
                              padding: "4px 8px",
                              background: "rgba(30,15,5,0.9)",
                              border: "1px solid rgba(201,168,76,0.4)",
                              borderRadius: "6px",
                              color: "#e8d5a3",
                              fontSize: "13px",
                              fontFamily: "'Georgia', serif",
                              outline: "none",
                              textAlign: "center",
                            }}
                          />
                          <span
                            style={{
                              color: "#a89060",
                              fontSize: "12px",
                              fontFamily: "'Georgia', serif",
                            }}
                          >
                            / {maxUses} used
                          </span>
                        </div>
                      ) : (
                        // Pip-style
                        Array.from({ length: maxUses }, (_, j) => (
                          <button
                            key={j}
                            onClick={() =>
                              toggleFeatureUse(
                                feat.featureName,
                                j,
                                usedCount,
                                maxUses,
                              )
                            }
                            style={{
                              background:
                                j < usedCount
                                  ? "rgba(201,168,76,0.4)"
                                  : "transparent",
                              border: "1px solid #c9a84c",
                              borderRadius: "50%",
                              width: "22px",
                              height: "22px",
                              color: j < usedCount ? "#8b6914" : "#c9a84c",
                              cursor: "pointer",
                              fontSize: "12px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontFamily: "'Georgia', serif",
                            }}
                          >
                            {j < usedCount ? "●" : "○"}
                          </button>
                        ))
                      )}
                      <span
                        style={{
                          fontSize: "10px",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          background:
                            usageConfig.recharge === "short"
                              ? "rgba(91,155,213,0.12)"
                              : "rgba(74,124,42,0.12)",
                          border: `1px solid ${usageConfig.recharge === "short" ? "rgba(91,155,213,0.3)" : "rgba(74,124,42,0.3)"}`,
                          color:
                            usageConfig.recharge === "short"
                              ? "#5b9bd5"
                              : "#4a7c2a",
                          fontFamily: "'Georgia', serif",
                        }}
                      >
                        {usageConfig.recharge === "short"
                          ? "Short Rest"
                          : "Long Rest"}
                      </span>
                      {!usePool && (
                        <span
                          style={{
                            color: "#a89060",
                            fontSize: "12px",
                            fontFamily: "'Georgia', serif",
                          }}
                        >
                          {maxUses - usedCount} / {maxUses} remaining
                        </span>
                      )}
                    </div>
                  )}

                  {isExpanded && desc && (
                    <div
                      style={{
                        marginTop: "12px",
                        borderTop: "1px solid rgba(201,168,76,0.1)",
                        paddingTop: "12px",
                      }}
                    >
                      {desc.entries.map((entry, i) => (
                        <RenderFeatureEntry key={i} entry={entry} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
