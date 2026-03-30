import React from "react";
import { INPUT_BG, GOLD_BRIGHT, SERIF } from "./theme";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  style?: React.CSSProperties;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ style, ...props }, ref) => {
    return (
      <input
        ref={ref}
        {...props}
        style={{
          background: INPUT_BG,
          border: "1px solid rgba(201,168,76,0.4)",
          borderRadius: "6px",
          color: GOLD_BRIGHT,
          fontFamily: SERIF,
          fontSize: "14px",
          padding: "10px 14px",
          outline: "none",
          boxSizing: "border-box",
          width: "100%",
          ...style,
        }}
      />
    );
  },
);

Input.displayName = "Input";
