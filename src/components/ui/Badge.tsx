import React from "react";
import { GOLD, SERIF } from "./theme";

interface BadgeProps {
  color?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export const Badge = ({ color = GOLD, style, children }: BadgeProps) => {
  return (
    <span
      style={{
        background: `${color}22`,
        color,
        fontFamily: SERIF,
        fontSize: "10px",
        padding: "2px 8px",
        borderRadius: "4px",
        letterSpacing: "0.5px",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
};
