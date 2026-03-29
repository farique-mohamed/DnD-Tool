import { useState, useRef, useEffect } from "react";
import { api } from "@/utils/api";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  DICE_TYPES,
  ROLL_LABELS,
  type DiceType,
  type RollLabel,
  type RollMode,
} from "@/lib/diceConstants";

const DEFAULT_DICE_COUNTS: Record<DiceType, number> = {
  d4: 0,
  d6: 0,
  d8: 0,
  d10: 0,
  d12: 0,
  d20: 1,
  d100: 0,
};

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diffMs = now - new Date(date).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export function DiceRoller() {
  const [isOpen, setIsOpen] = useState(false);
  const [label, setLabel] = useState<RollLabel>("General");
  const [rollMode, setRollMode] = useState<RollMode>("NORMAL");
  const [diceCounts, setDiceCounts] = useState<Record<DiceType, number>>({
    ...DEFAULT_DICE_COUNTS,
  });
  const [latestRollId, setLatestRollId] = useState<string | null>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const utils = api.useUtils();

  const historyQuery = api.dice.globalHistory.useQuery(
    { limit: 50 },
    { enabled: isOpen }
  );

  const rollMutation = api.dice.roll.useMutation({
    onSuccess: (data) => {
      setLatestRollId(data.id);
      void utils.dice.globalHistory.invalidate();
      setLabel("General");
      setRollMode("NORMAL");
      setDiceCounts({ ...DEFAULT_DICE_COUNTS });
      setTimeout(() => setLatestRollId(null), 2000);
    },
    onError: () => {
      // error handled inline via rollMutation.error
    },
  });

  // Scroll history to top when new roll arrives
  useEffect(() => {
    if (latestRollId && historyRef.current) {
      historyRef.current.scrollTop = 0;
    }
  }, [latestRollId, historyQuery.data]);

  const handleRoll = () => {
    const diceArray =
      rollMode !== "NORMAL"
        ? [{ count: 1, diceType: "d20" as DiceType }]
        : DICE_TYPES.filter((dt) => diceCounts[dt] > 0).map((dt) => ({
            count: diceCounts[dt],
            diceType: dt,
          }));

    if (diceArray.length === 0) return;

    rollMutation.mutate({
      label,
      rollMode,
      dice: diceArray,
    });
  };

  const handleContainerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !rollMutation.isPending) {
      handleRoll();
    }
  };

  const updateDieCount = (dt: DiceType, delta: number) => {
    setDiceCounts((prev) => ({
      ...prev,
      [dt]: Math.min(10, Math.max(0, prev[dt] + delta)),
    }));
  };

  const rollDisplay =
    rollMode !== "NORMAL"
      ? `Roll d20 (${rollMode === "ADVANTAGE" ? "Advantage" : "Disadvantage"})`
      : DICE_TYPES.filter((dt) => diceCounts[dt] > 0)
          .map((dt) => `${diceCounts[dt]}${dt}`)
          .join("+") || "Select a Die";

  const isLocked = rollMode !== "NORMAL";

  const diceExpression =
    rollMode !== "NORMAL"
      ? "2d20 (taking the " +
        (rollMode === "ADVANTAGE" ? "higher" : "lower") +
        ")"
      : DICE_TYPES.filter((dt) => diceCounts[dt] > 0)
          .map((dt) => `${diceCounts[dt]}${dt}`)
          .join(" + ") || "";

  // Mobile popup sizing
  const popupWidth = isMobile ? "calc(100vw - 24px)" : "380px";
  const popupRight = isMobile ? "12px" : "24px";
  const popupBottom = isMobile ? "80px" : "96px";
  const popupMaxHeight = isMobile ? "calc(100vh - 120px)" : "600px";

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        title="Roll the Bones"
        style={{
          position: "fixed",
          bottom: isMobile ? "16px" : "24px",
          right: isMobile ? "16px" : "24px",
          zIndex: 1000,
          width: isMobile ? "48px" : "56px",
          height: isMobile ? "48px" : "56px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #8b6914, #c9a84c)",
          border: "2px solid #c9a84c",
          boxShadow: isOpen
            ? "0 0 24px rgba(201,168,76,0.8), 0 0 8px rgba(201,168,76,0.5)"
            : "0 0 16px rgba(201,168,76,0.5)",
          cursor: "pointer",
          fontSize: isMobile ? "20px" : "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "box-shadow 0.2s",
        }}
      >
        🎲
      </button>

      {/* Popup panel */}
      {isOpen && (
        <div
          onKeyDown={handleContainerKeyDown}
          style={{
            position: "fixed",
            bottom: popupBottom,
            right: popupRight,
            zIndex: 999,
            width: popupWidth,
            maxHeight: popupMaxHeight,
            overflow: "hidden",
            background: "rgba(0,0,0,0.6)",
            border: "2px solid #c9a84c",
            borderRadius: "12px",
            boxShadow:
              "0 0 40px rgba(201,168,76,0.3), inset 0 0 60px rgba(0,0,0,0.5)",
            display: "flex",
            flexDirection: "column",
            fontFamily: "'Georgia', 'Times New Roman', serif",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px 20px 12px",
              borderBottom: "1px solid rgba(201,168,76,0.3)",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div>
              <div
                style={{
                  color: "#c9a84c",
                  fontSize: "16px",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                }}
              >
                🎲 Roll the Bones
              </div>
              <div
                style={{
                  color: "#a89060",
                  fontSize: "11px",
                  marginTop: "2px",
                  letterSpacing: "1px",
                }}
              >
                Cast your fate to the dice
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "none",
                border: "none",
                color: "#a89060",
                fontSize: "18px",
                cursor: "pointer",
                lineHeight: 1,
                padding: "0 0 0 8px",
                fontFamily: "'Georgia', serif",
                minHeight: "auto",
              }}
              title="Close"
            >
              ×
            </button>
          </div>

          {/* History feed */}
          <div
            ref={historyRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: isMobile ? "10px 16px 14px" : "10px 20px 14px",
              maxHeight: isMobile ? "180px" : "260px",
            }}
          >
            {historyQuery.isLoading && (
              <div
                style={{
                  color: "#a89060",
                  fontSize: "12px",
                  textAlign: "center",
                  padding: "20px 0",
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                }}
              >
                Consulting the fates...
              </div>
            )}

            {historyQuery.data && historyQuery.data.length === 0 && (
              <div
                style={{
                  color: "#a89060",
                  fontSize: "12px",
                  textAlign: "center",
                  padding: "20px 0",
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  fontStyle: "italic",
                }}
              >
                No rolls yet. Be the first to roll!
              </div>
            )}

            {historyQuery.data?.map((roll: NonNullable<typeof historyQuery.data>[number], index: number) => {
                const isSingleD20 = roll.diceType === "d20";
                const isNatMax = isSingleD20 && roll.result === 20;
                const isNatOne = isSingleD20 && roll.result === 1;
                const isLatest = roll.id === latestRollId;
                const rollModeValue = (roll as { rollMode?: string }).rollMode;
                const isAdv = rollModeValue === "ADVANTAGE";
                const isDis = rollModeValue === "DISADVANTAGE";

                return (
                  <div
                    key={roll.id}
                    style={{
                      padding: "8px 0",
                      borderBottom:
                        index < historyQuery.data!.length - 1
                          ? "1px solid rgba(201,168,76,0.1)"
                          : "none",
                      opacity: isLatest ? 1 : 0.9,
                      transition: "opacity 0.4s",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        justifyContent: "space-between",
                        gap: "8px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: "6px",
                          minWidth: 0,
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            color: "#c9a84c",
                            fontSize: "12px",
                            fontWeight: "bold",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "90px",
                            display: "inline-block",
                          }}
                          title={roll.username}
                        >
                          {roll.username}
                        </span>
                        <span
                          style={{
                            color: "#e8d5a3",
                            fontSize: "13px",
                            fontFamily: "'Georgia', 'Times New Roman', serif",
                          }}
                        >
                          {roll.diceType} →{" "}
                          <strong
                            style={{
                              color: isNatMax
                                ? "#c9a84c"
                                : isNatOne
                                ? "#e74c3c"
                                : "#e8d5a3",
                              fontSize: "15px",
                            }}
                          >
                            {roll.result}
                          </strong>
                        </span>
                        {isAdv && (
                          <span
                            style={{
                              color: "#2ecc71",
                              fontSize: "10px",
                              fontWeight: "bold",
                              whiteSpace: "nowrap",
                              border: "1px solid rgba(46,204,113,0.5)",
                              borderRadius: "3px",
                              padding: "1px 4px",
                              fontFamily: "'Georgia', 'Times New Roman', serif",
                            }}
                          >
                            Adv
                          </span>
                        )}
                        {isDis && (
                          <span
                            style={{
                              color: "#e67e22",
                              fontSize: "10px",
                              fontWeight: "bold",
                              whiteSpace: "nowrap",
                              border: "1px solid rgba(230,126,34,0.5)",
                              borderRadius: "3px",
                              padding: "1px 4px",
                              fontFamily: "'Georgia', 'Times New Roman', serif",
                            }}
                          >
                            Dis
                          </span>
                        )}
                        {isNatMax && (
                          <span
                            style={{
                              color: "#c9a84c",
                              fontSize: "11px",
                              fontWeight: "bold",
                              whiteSpace: "nowrap",
                            }}
                          >
                            ✨ NAT 20!
                          </span>
                        )}
                        {isNatOne && (
                          <span
                            style={{
                              color: "#e74c3c",
                              fontSize: "11px",
                              fontWeight: "bold",
                              whiteSpace: "nowrap",
                            }}
                          >
                            NAT 1 💀
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          color: "#a89060",
                          fontSize: "10px",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        {formatRelativeTime(roll.rolledAt)}
                      </span>
                    </div>
                    {roll.label && (
                      <div
                        style={{
                          color: "#a89060",
                          fontSize: "11px",
                          fontStyle: "italic",
                          marginTop: "2px",
                          paddingLeft: "2px",
                          fontFamily: "'Georgia', 'Times New Roman', serif",
                        }}
                      >
                        {roll.label}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>

          {/* Input area */}
          <div
            style={{
              padding: isMobile ? "14px 16px" : "14px 20px",
              borderBottom: "1px solid rgba(201,168,76,0.2)",
              flexShrink: 0,
            }}
          >
          {/* Roll Mode toggle */}
            <div
              style={{
                color: "#c9a84c",
                fontSize: "10px",
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                marginBottom: "6px",
                fontFamily: "'Georgia', 'Times New Roman', serif",
              }}
            >
              Roll Mode
            </div>
            <div
              style={{
                display: "flex",
                gap: "6px",
                marginBottom: "12px",
              }}
            >
              {(
                [
                  ["NORMAL", "Normal"],
                  ["ADVANTAGE", "Advantage"],
                  ["DISADVANTAGE", "Disadvantage"],
                ] as const
              ).map(([mode, modeLabel]) => {
                const isActive = rollMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setRollMode(mode)}
                    style={{
                      flex: 1,
                      background: isActive
                        ? "linear-gradient(135deg, #8b6914, #c9a84c)"
                        : "transparent",
                      color: isActive ? "#1a1a2e" : "#c9a84c",
                      border: isActive
                        ? "1px solid #c9a84c"
                        : "1px solid rgba(201,168,76,0.5)",
                      borderRadius: "6px",
                      padding: "6px 4px",
                      fontSize: "11px",
                      fontFamily: "'Georgia', 'Times New Roman', serif",
                      fontWeight: "bold",
                      cursor: "pointer",
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                      minHeight: "auto",
                    }}
                  >
                    {modeLabel}
                  </button>
                );
              })}
            </div>

            {/* Dice selector label */}
            <div
              style={{
                color: "#c9a84c",
                fontSize: "10px",
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                marginBottom: "6px",
                fontFamily: "'Georgia', 'Times New Roman', serif",
              }}
            >
              Dice
            </div>

            {/* Locked note for advantage/disadvantage */}
            {isLocked && (
              <div
                style={{
                  color: "#a89060",
                  fontSize: "11px",
                  fontStyle: "italic",
                  marginBottom: "6px",
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                }}
              >
                {rollMode === "ADVANTAGE"
                  ? "Advantage: rolling 2d20, taking the higher"
                  : "Disadvantage: rolling 2d20, taking the lower"}
              </div>
            )}

            {/* Dice count grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "4px",
                marginBottom: "8px",
              }}
            >
              {DICE_TYPES.map((dt) => {
                const count = isLocked ? (dt === "d20" ? 1 : 0) : diceCounts[dt];
                const isActive = count > 0;
                const disabled = isLocked;
                const isFullWidth = dt === "d100";

                return (
                  <div
                    key={dt}
                    style={{
                      gridColumn: isFullWidth ? "1 / -1" : undefined,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "5px 8px",
                      borderRadius: "6px",
                      border: isActive
                        ? "1px solid rgba(201,168,76,0.6)"
                        : "1px solid rgba(201,168,76,0.15)",
                      background: isActive
                        ? "rgba(201,168,76,0.08)"
                        : "transparent",
                      opacity: disabled && dt !== "d20" ? 0.35 : 1,
                      transition: "all 0.15s",
                    }}
                  >
                    <span
                      style={{
                        color: isActive ? "#c9a84c" : "#a89060",
                        fontSize: "12px",
                        fontWeight: "bold",
                        fontFamily: "'Georgia', 'Times New Roman', serif",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        width: "34px",
                        flexShrink: 0,
                      }}
                    >
                      {dt}
                    </span>
                    <button
                      onClick={() => !disabled && updateDieCount(dt, -1)}
                      disabled={disabled || count === 0}
                      style={{
                        width: "24px",
                        height: "24px",
                        background: "transparent",
                        border: "1px solid rgba(201,168,76,0.4)",
                        borderRadius: "4px",
                        color: "#c9a84c",
                        fontSize: "14px",
                        lineHeight: 1,
                        cursor: disabled || count === 0 ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "'Georgia', serif",
                        opacity: disabled || count === 0 ? 0.4 : 1,
                        flexShrink: 0,
                        minHeight: "auto",
                      }}
                    >
                      −
                    </button>
                    <span
                      style={{
                        color: "#e8d5a3",
                        fontSize: "13px",
                        fontFamily: "'Georgia', 'Times New Roman', serif",
                        fontWeight: "bold",
                        minWidth: "20px",
                        textAlign: "center",
                      }}
                    >
                      {count}
                    </span>
                    <button
                      onClick={() => !disabled && updateDieCount(dt, 1)}
                      disabled={disabled || count === 10}
                      style={{
                        width: "24px",
                        height: "24px",
                        background: "transparent",
                        border: "1px solid rgba(201,168,76,0.4)",
                        borderRadius: "4px",
                        color: "#c9a84c",
                        fontSize: "14px",
                        lineHeight: 1,
                        cursor: disabled || count === 10 ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "'Georgia', serif",
                        opacity: disabled || count === 10 ? 0.4 : 1,
                        flexShrink: 0,
                        minHeight: "auto",
                      }}
                    >
                      +
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Expression preview */}
            {diceExpression && (
              <div
                style={{
                  color: "#c9a84c",
                  fontSize: "11px",
                  fontStyle: "italic",
                  marginBottom: "10px",
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  letterSpacing: "0.5px",
                }}
              >
                {diceExpression}
              </div>
            )}

              {/* Roll Type label */}
            <div
              style={{
                color: "#c9a84c",
                fontSize: "10px",
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                marginBottom: "4px",
                fontFamily: "'Georgia', 'Times New Roman', serif",
              }}
            >
              Roll Type
            </div>

            {/* Label dropdown */}
            <select
              value={label}
              onChange={(e) => setLabel(e.target.value as RollLabel)}
              style={{
                width: "100%",
                background: "rgba(30,15,5,0.9)",
                border: "1px solid rgba(201,168,76,0.4)",
                borderRadius: "6px",
                padding: "8px 10px",
                color: "#e8d5a3",
                fontSize: "12px",
                fontFamily: "'Georgia', 'Times New Roman', serif",
                marginBottom: "12px",
                boxSizing: "border-box",
                outline: "none",
                cursor: "pointer",
              }}
            >
              {ROLL_LABELS.map((rl) => (
                <option key={rl} value={rl} style={{ background: "#1a0e05" }}>
                  {rl}
                </option>
              ))}
            </select>



            {/* Roll button */}
            <button
              onClick={handleRoll}
              disabled={
                rollMutation.isPending || rollDisplay === "Select a Die"
              }
              style={{
                width: "100%",
                background:
                  rollMutation.isPending || rollDisplay === "Select a Die"
                    ? "rgba(139,105,20,0.5)"
                    : "linear-gradient(135deg, #8b6914, #c9a84c)",
                color: "#1a1a2e",
                border: "none",
                borderRadius: "6px",
                padding: "10px 20px",
                fontSize: "14px",
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontWeight: "bold",
                cursor:
                  rollMutation.isPending || rollDisplay === "Select a Die"
                    ? "not-allowed"
                    : "pointer",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              {rollMutation.isPending ? "Rolling..." : rollDisplay}
            </button>

            {/* Error message */}
            {rollMutation.error && (
              <div
                style={{
                  color: "#e74c3c",
                  fontSize: "11px",
                  marginTop: "6px",
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                }}
              >
                {rollMutation.error.message}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
