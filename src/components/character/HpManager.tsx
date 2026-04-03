import { useState } from "react";
import { api } from "@/utils/api";
import { isWarlock } from "@/lib/spellSlotData";
import { getConditionsBySource, DISEASES } from "@/lib/conditionData";
import { type CharacterData, mod, HIT_DIE_AVERAGE, HIT_DIE_SIZE } from "./shared";

export function HpManager({ character }: { character: CharacterData }) {
  const utils = api.useUtils();
  const [damageAmount, setDamageAmount] = useState<string>("");
  const [healAmount, setHealAmount] = useState<string>("");
  const [tempHpAmount, setTempHpAmount] = useState<string>("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showShortRest, setShowShortRest] = useState(false);
  const [hitDiceToSpend, setHitDiceToSpend] = useState<string>("1");

  const activeConditions: string[] = (() => {
    try {
      return JSON.parse(character.activeConditions || "[]") as string[];
    } catch {
      return [];
    }
  })();

  const activeDiseases: string[] = (() => {
    try {
      return JSON.parse(character.activeDiseases || "[]") as string[];
    } catch {
      return [];
    }
  })();

  const allConditions = getConditionsBySource("PHB");

  const updateDiseases = api.character.updateActiveDiseases.useMutation({
    onSuccess: async () => {
      await utils.character.getById.invalidate({ id: character.id });
    },
    onError: (err) => {
      setFeedback(err.message);
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const toggleDisease = (name: string) => {
    const newList = activeDiseases.includes(name)
      ? activeDiseases.filter((d) => d !== name)
      : [...activeDiseases, name];
    updateDiseases.mutate({ id: character.id, activeDiseases: newList });
  };

  const updateConditions = api.character.updateActiveConditions.useMutation({
    onSuccess: async () => {
      await utils.character.getById.invalidate({ id: character.id });
    },
    onError: (err) => {
      setFeedback(err.message);
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const toggleCondition = (name: string) => {
    const newList = activeConditions.includes(name)
      ? activeConditions.filter((c) => c !== name)
      : [...activeConditions, name];
    updateConditions.mutate({ id: character.id, activeConditions: newList });
  };

  const updateHp = api.character.updateHp.useMutation({
    onSuccess: async () => {
      await utils.character.getById.invalidate({ id: character.id });
      setDamageAmount("");
      setHealAmount("");
      setTempHpAmount("");
    },
    onError: (err) => {
      setFeedback(err.message);
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const longRest = api.character.longRest.useMutation({
    onSuccess: async () => {
      await utils.character.getById.invalidate({ id: character.id });
    },
    onError: (err) => {
      setFeedback(err.message);
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const shortRest = api.character.shortRest.useMutation({
    onSuccess: async () => {
      await utils.character.getById.invalidate({ id: character.id });
      setShowShortRest(false);
      setHitDiceToSpend("1");
    },
    onError: (err) => {
      setFeedback(err.message);
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  const handleDamage = () => {
    const n = parseInt(damageAmount);
    if (!n || n <= 0) return;
    updateHp.mutate({ id: character.id, type: "damage", amount: n });
  };

  const handleHeal = () => {
    const n = parseInt(healAmount);
    if (!n || n <= 0) return;
    updateHp.mutate({ id: character.id, type: "heal", amount: n });
  };

  const handleSetTempHp = () => {
    const n = parseInt(tempHpAmount);
    if (isNaN(n) || n < 0) return;
    updateHp.mutate({ id: character.id, type: "setTempHp", amount: n });
  };

  const handleLongRest = () => {
    if (
      !window.confirm(
        "Take a long rest? This will fully restore HP, clear temp HP, and reset all spell slots.",
      )
    )
      return;
    longRest.mutate({ id: character.id });
  };

  const handleShortRest = () => {
    const dice = parseInt(hitDiceToSpend);
    if (isNaN(dice) || dice < 1) return;
    const conMod = mod(character.constitution);
    const hitDieAvg = HIT_DIE_AVERAGE[character.characterClass] ?? 5;
    const hpRecovered = Math.max(0, (hitDieAvg + conMod) * dice);
    shortRest.mutate({
      id: character.id,
      hpRecovered,
      isWarlock: isWarlock(character.characterClass),
    });
  };

  const conMod = mod(character.constitution);
  const hitDieAvg = HIT_DIE_AVERAGE[character.characterClass] ?? 5;
  const hitDieSize = HIT_DIE_SIZE[character.characterClass] ?? 8;
  const diceCount = parseInt(hitDiceToSpend) || 0;
  const previewHeal = Math.max(0, (hitDieAvg + conMod) * diceCount);

  const isLoading = updateHp.isPending;
  const hpPercent = Math.max(
    0,
    Math.min(100, (character.currentHp / character.maxHp) * 100),
  );

  const inputStyle: React.CSSProperties = {
    width: "70px",
    padding: "8px 10px",
    background: "rgba(30,15,5,0.9)",
    border: "1px solid rgba(201,168,76,0.4)",
    borderRadius: "6px",
    color: "#e8d5a3",
    fontSize: "14px",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    outline: "none",
    textAlign: "center",
  };

  const restButtonStyle: React.CSSProperties = {
    background: "transparent",
    border: "1px solid rgba(201,168,76,0.4)",
    color: "#c9a84c",
    borderRadius: "6px",
    padding: "6px 16px",
    fontFamily: "'Georgia', serif",
    fontSize: "12px",
    cursor: "pointer",
    letterSpacing: "0.5px",
  };

  return (
    <div style={{ marginTop: "20px" }}>
      {/* HP Display */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "6px",
        }}
      >
        <span
          style={{
            color: "#b8934a",
            fontSize: "11px",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontFamily: "'Georgia', serif",
          }}
        >
          Hit Points
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            style={{
              color: "#e8d5a3",
              fontSize: "14px",
              fontFamily: "'Georgia', serif",
            }}
          >
            {character.currentHp} / {character.maxHp}
          </span>
          {character.tempHp > 0 && (
            <span
              style={{
                color: "#5b9bd5",
                fontSize: "13px",
                fontFamily: "'Georgia', serif",
              }}
            >
              +{character.tempHp} temp
            </span>
          )}
        </div>
      </div>

      {/* HP bar */}
      <div
        style={{
          background: "rgba(255,255,255,0.1)",
          borderRadius: "4px",
          height: "10px",
          overflow: "hidden",
          position: "relative",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            width: `${hpPercent}%`,
            height: "100%",
            background:
              hpPercent > 50
                ? "#4a7c2a"
                : hpPercent > 25
                  ? "#c9a84c"
                  : "#e74c3c",
            borderRadius: "4px",
            transition: "width 0.3s",
            position: "absolute",
          }}
        />
        {character.tempHp > 0 && (
          <div
            style={{
              width: `${Math.min(100, (character.tempHp / character.maxHp) * 100)}%`,
              height: "100%",
              background: "rgba(91,155,213,0.5)",
              borderRadius: "4px",
              position: "absolute",
              right: 0,
            }}
          />
        )}
      </div>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          alignItems: "flex-end",
        }}
      >
        {/* Damage */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span
            style={{
              color: "#b8934a",
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontFamily: "'Georgia', serif",
            }}
          >
            Damage
          </span>
          <div style={{ display: "flex", gap: "6px" }}>
            <input
              type="number"
              min={1}
              value={damageAmount}
              onChange={(e) => setDamageAmount(e.target.value)}
              placeholder="0"
              style={inputStyle}
              disabled={isLoading}
              onKeyDown={(e) => e.key === "Enter" && handleDamage()}
            />
            <button
              onClick={handleDamage}
              disabled={isLoading || !damageAmount}
              style={{
                background: "linear-gradient(135deg, #8b1a1a, #c0392b)",
                color: "#f8d7d7",
                border: "none",
                borderRadius: "6px",
                padding: "8px 14px",
                fontSize: "13px",
                fontFamily: "'Georgia', serif",
                fontWeight: "bold",
                cursor: isLoading || !damageAmount ? "not-allowed" : "pointer",
                opacity: isLoading || !damageAmount ? 0.6 : 1,
              }}
            >
              Hit
            </button>
          </div>
        </div>

        {/* Heal */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span
            style={{
              color: "#b8934a",
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontFamily: "'Georgia', serif",
            }}
          >
            Heal
          </span>
          <div style={{ display: "flex", gap: "6px" }}>
            <input
              type="number"
              min={1}
              value={healAmount}
              onChange={(e) => setHealAmount(e.target.value)}
              placeholder="0"
              style={inputStyle}
              disabled={isLoading}
              onKeyDown={(e) => e.key === "Enter" && handleHeal()}
            />
            <button
              onClick={handleHeal}
              disabled={isLoading || !healAmount}
              style={{
                background: "linear-gradient(135deg, #2a5c1a, #4a7c2a)",
                color: "#d7f8d7",
                border: "none",
                borderRadius: "6px",
                padding: "8px 14px",
                fontSize: "13px",
                fontFamily: "'Georgia', serif",
                fontWeight: "bold",
                cursor: isLoading || !healAmount ? "not-allowed" : "pointer",
                opacity: isLoading || !healAmount ? 0.6 : 1,
              }}
            >
              Heal
            </button>
          </div>
        </div>

        {/* Temp HP */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span
            style={{
              color: "#5b9bd5",
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontFamily: "'Georgia', serif",
            }}
          >
            Temp HP
          </span>
          <div style={{ display: "flex", gap: "6px" }}>
            <input
              type="number"
              min={0}
              value={tempHpAmount}
              onChange={(e) => setTempHpAmount(e.target.value)}
              placeholder="0"
              style={{ ...inputStyle, borderColor: "rgba(91,155,213,0.5)" }}
              disabled={isLoading}
              onKeyDown={(e) => e.key === "Enter" && handleSetTempHp()}
            />
            <button
              onClick={handleSetTempHp}
              disabled={isLoading || tempHpAmount === ""}
              style={{
                background: "linear-gradient(135deg, #1a3a5c, #2d6a9f)",
                color: "#d0e8f8",
                border: "none",
                borderRadius: "6px",
                padding: "8px 14px",
                fontSize: "13px",
                fontFamily: "'Georgia', serif",
                fontWeight: "bold",
                cursor:
                  isLoading || tempHpAmount === "" ? "not-allowed" : "pointer",
                opacity: isLoading || tempHpAmount === "" ? 0.6 : 1,
              }}
            >
              Set
            </button>
          </div>
        </div>
      </div>

      {/* Rest section */}
      <div
        style={{
          marginTop: "16px",
          paddingTop: "12px",
          borderTop: "1px solid rgba(201,168,76,0.1)",
        }}
      >
        <span
          style={{
            color: "#b8934a",
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontFamily: "'Georgia', serif",
          }}
        >
          Rest
        </span>
        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
          <button
            onClick={() => setShowShortRest((v) => !v)}
            disabled={shortRest.isPending}
            style={restButtonStyle}
          >
            Short Rest
          </button>
          <button
            onClick={handleLongRest}
            disabled={longRest.isPending}
            style={restButtonStyle}
          >
            {longRest.isPending ? "Resting..." : "Long Rest"}
          </button>
        </div>

        {/* Short rest inline panel */}
        {showShortRest && (
          <div
            style={{
              marginTop: "12px",
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(201,168,76,0.25)",
              borderRadius: "8px",
              padding: "14px 16px",
            }}
          >
            <p
              style={{
                color: "#b8934a",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontFamily: "'Georgia', serif",
                marginBottom: "8px",
              }}
            >
              Short Rest — Spend Hit Dice
            </p>
            <p
              style={{
                color: "#a89060",
                fontSize: "12px",
                fontFamily: "'Georgia', serif",
                marginBottom: "10px",
              }}
            >
              d{hitDieSize} + {conMod >= 0 ? `+${conMod}` : conMod} CON per die
              (avg {hitDieAvg + conMod} HP each)
            </p>
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
                  fontSize: "13px",
                  fontFamily: "'Georgia', serif",
                }}
              >
                Hit dice to spend:
              </span>
              <input
                type="number"
                min={1}
                max={character.level}
                value={hitDiceToSpend}
                onChange={(e) => setHitDiceToSpend(e.target.value)}
                style={{
                  width: "60px",
                  padding: "6px 8px",
                  background: "rgba(30,15,5,0.9)",
                  border: "1px solid rgba(201,168,76,0.4)",
                  borderRadius: "6px",
                  color: "#e8d5a3",
                  fontSize: "14px",
                  fontFamily: "'Georgia', serif",
                  outline: "none",
                  textAlign: "center",
                }}
              />
              {diceCount > 0 && (
                <span
                  style={{
                    color: "#c9a84c",
                    fontSize: "13px",
                    fontFamily: "'Georgia', serif",
                  }}
                >
                  = +{previewHeal} HP
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              <button
                onClick={handleShortRest}
                disabled={shortRest.isPending || diceCount < 1}
                style={{
                  background: "linear-gradient(135deg, #8b6914, #c9a84c)",
                  color: "#1a1a2e",
                  border: "none",
                  borderRadius: "6px",
                  padding: "7px 18px",
                  fontSize: "13px",
                  fontFamily: "'Georgia', serif",
                  fontWeight: "bold",
                  cursor:
                    shortRest.isPending || diceCount < 1
                      ? "not-allowed"
                      : "pointer",
                  opacity: shortRest.isPending || diceCount < 1 ? 0.6 : 1,
                }}
              >
                {shortRest.isPending ? "Resting..." : "Rest"}
              </button>
              <button
                onClick={() => setShowShortRest(false)}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(201,168,76,0.3)",
                  color: "#a89060",
                  borderRadius: "6px",
                  padding: "7px 14px",
                  fontSize: "13px",
                  fontFamily: "'Georgia', serif",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Conditions */}
      <div
        style={{
          marginTop: "12px",
          paddingTop: "12px",
          borderTop: "1px solid rgba(201,168,76,0.1)",
        }}
      >
        <p
          style={{
            color: "#c9a84c",
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "1px",
            fontFamily: "'Georgia', serif",
            margin: "0 0 8px 0",
          }}
        >
          Conditions
        </p>

        {/* Active condition pills */}
        {activeConditions.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
            {activeConditions.map((condName) => {
              const condData = allConditions.find((c) => c.name === condName);
              return (
                <button
                  key={condName}
                  onClick={() => toggleCondition(condName)}
                  disabled={updateConditions.isPending}
                  title={condData && condData.entries.length > 0 ? condData.entries[0] : condName}
                  style={{
                    background: "rgba(231,76,60,0.2)",
                    border: "1px solid rgba(231,76,60,0.5)",
                    borderRadius: "20px",
                    padding: "3px 10px",
                    fontSize: "10px",
                    fontFamily: "'Georgia', serif",
                    color: "#e74c3c",
                    cursor: updateConditions.isPending ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  {condName}
                  <span style={{ fontSize: "12px", lineHeight: 1 }}>&times;</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Dropdown to add conditions */}
        {(() => {
          const inactiveConditions = allConditions.filter(
            (c) => !activeConditions.includes(c.name),
          );
          if (inactiveConditions.length === 0) return null;
          return (
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  toggleCondition(e.target.value);
                }
              }}
              disabled={updateConditions.isPending}
              style={{
                width: "100%",
                maxWidth: "260px",
                padding: "6px 10px",
                background: "rgba(30,15,5,0.9)",
                border: "1px solid rgba(201,168,76,0.4)",
                borderRadius: "6px",
                color: "#e8d5a3",
                fontSize: "12px",
                fontFamily: "'Georgia', 'Times New Roman', serif",
                outline: "none",
                cursor: updateConditions.isPending ? "not-allowed" : "pointer",
                opacity: updateConditions.isPending ? 0.6 : 1,
              }}
            >
              <option value="" disabled>
                Add a condition...
              </option>
              {inactiveConditions.map((cond) => (
                <option key={cond.name} value={cond.name}>
                  {cond.name}
                </option>
              ))}
            </select>
          );
        })()}
      </div>

      {/* Diseases */}
      <div
        style={{
          marginTop: "12px",
          paddingTop: "12px",
          borderTop: "1px solid rgba(201,168,76,0.1)",
        }}
      >
        <p
          style={{
            color: "#bb8fd9",
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "1px",
            fontFamily: "'Georgia', serif",
            margin: "0 0 8px 0",
          }}
        >
          Diseases
        </p>

        {/* Active disease pills */}
        {activeDiseases.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
            {activeDiseases.map((diseaseName) => {
              const diseaseData = DISEASES.find((d) => d.name === diseaseName);
              return (
                <button
                  key={diseaseName}
                  onClick={() => toggleDisease(diseaseName)}
                  disabled={updateDiseases.isPending}
                  title={diseaseData && diseaseData.entries.length > 0 ? diseaseData.entries[0] : diseaseName}
                  style={{
                    background: "rgba(155,89,182,0.2)",
                    border: "1px solid rgba(155,89,182,0.5)",
                    borderRadius: "20px",
                    padding: "3px 10px",
                    fontSize: "10px",
                    fontFamily: "'Georgia', serif",
                    color: "#bb8fd9",
                    cursor: updateDiseases.isPending ? "not-allowed" : "pointer",
                    fontWeight: "bold",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  {diseaseName}
                  <span style={{ fontSize: "12px", lineHeight: 1 }}>&times;</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Dropdown to add diseases */}
        {(() => {
          const inactiveDiseases = DISEASES.filter(
            (d) => !activeDiseases.includes(d.name),
          );
          if (inactiveDiseases.length === 0) return null;
          return (
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  toggleDisease(e.target.value);
                }
              }}
              disabled={updateDiseases.isPending}
              style={{
                width: "100%",
                maxWidth: "260px",
                padding: "6px 10px",
                background: "rgba(30,15,5,0.9)",
                border: "1px solid rgba(155,89,182,0.4)",
                borderRadius: "6px",
                color: "#e8d5a3",
                fontSize: "12px",
                fontFamily: "'Georgia', 'Times New Roman', serif",
                outline: "none",
                cursor: updateDiseases.isPending ? "not-allowed" : "pointer",
                opacity: updateDiseases.isPending ? 0.6 : 1,
              }}
            >
              <option value="" disabled>
                Add a disease...
              </option>
              {inactiveDiseases.map((disease) => (
                <option key={disease.name} value={disease.name}>
                  {disease.name}
                </option>
              ))}
            </select>
          );
        })()}
      </div>

      {feedback && (
        <div
          style={{
            marginTop: "10px",
            color: "#e74c3c",
            fontSize: "12px",
            fontFamily: "'Georgia', serif",
          }}
        >
          {feedback}
        </div>
      )}
    </div>
  );
}
