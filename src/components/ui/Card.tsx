import React from "react";
import { GOLD, GOLD_GLOW } from "./theme";

interface CardProps {
  variant?: "default" | "light";
  padding?: string | number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

const variantStyles: Record<string, React.CSSProperties> = {
  default: {
    background: "rgba(0,0,0,0.6)",
    border: `2px solid ${GOLD}`,
    borderRadius: "12px",
    boxShadow: `0 0 20px ${GOLD_GLOW}`,
  },
  light: {
    background: "rgba(0,0,0,0.4)",
    border: "1px solid rgba(201,168,76,0.2)",
    borderRadius: "12px",
  },
};

export const Card = ({
  variant = "default",
  padding = "24px",
  style,
  children,
}: CardProps) => {
  return (
    <div
      style={{
        ...variantStyles[variant],
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
