import React from "react";
import { GOLD, DANGER_RED, SUCCESS_GREEN_BORDER, ERROR_RED_BORDER, GOLD_BRIGHT, SERIF } from "./theme";

type AlertVariant = "error" | "success" | "info";

interface AlertProps {
  variant?: AlertVariant;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

const variantStyles: Record<AlertVariant, React.CSSProperties> = {
  error: {
    background: "rgba(139,42,30,0.2)",
    border: `1px solid ${ERROR_RED_BORDER}`,
    color: DANGER_RED,
  },
  success: {
    background: "rgba(74,124,42,0.15)",
    border: `1px solid ${SUCCESS_GREEN_BORDER}`,
    color: GOLD_BRIGHT,
  },
  info: {
    background: "rgba(201,168,76,0.1)",
    border: `1px solid ${GOLD}`,
    color: GOLD_BRIGHT,
  },
};

export const Alert = ({ variant = "info", style, children }: AlertProps) => {
  return (
    <div
      style={{
        fontFamily: SERIF,
        fontSize: "14px",
        lineHeight: "1.6",
        padding: "12px 16px",
        borderRadius: "8px",
        ...variantStyles[variant],
        ...style,
      }}
    >
      {children}
    </div>
  );
};
