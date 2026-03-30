import React from "react";
import { GOLD, GOLD_DARK, GOLD_BRIGHT, DANGER_RED, SERIF } from "./theme";

type ButtonVariant = "primary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  isLoading?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  style?: React.CSSProperties;
  type?: "button" | "submit" | "reset";
  children: React.ReactNode;
}

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: "6px 14px", fontSize: "12px" },
  md: { padding: "10px 22px", fontSize: "14px" },
  lg: { padding: "14px 32px", fontSize: "16px" },
};

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: `linear-gradient(135deg, ${GOLD_DARK}, ${GOLD})`,
    color: "#1a1a2e",
    border: "none",
    fontWeight: "bold",
  },
  ghost: {
    background: "transparent",
    color: GOLD,
    border: `1px solid ${GOLD}`,
  },
  danger: {
    background: `linear-gradient(135deg, #6b1a1a, ${DANGER_RED})`,
    color: "#fff",
    border: "none",
    fontWeight: "bold",
  },
};

export const Button = ({
  variant = "primary",
  size = "md",
  disabled = false,
  isLoading = false,
  onClick,
  style,
  type = "button",
  children,
}: ButtonProps) => {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      style={{
        fontFamily: SERIF,
        borderRadius: "8px",
        cursor: isDisabled ? "not-allowed" : "pointer",
        letterSpacing: "1px",
        textTransform: "uppercase",
        transition: "opacity 0.2s",
        opacity: isDisabled ? 0.5 : 1,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style,
      }}
    >
      {isLoading ? "Loading..." : children}
    </button>
  );
};
