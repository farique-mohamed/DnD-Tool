import React from "react";
import { INPUT_BG, GOLD_BRIGHT, SERIF } from "./theme";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  style?: React.CSSProperties;
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ style, children, ...props }, ref) => {
    return (
      <select
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
          cursor: "pointer",
          ...style,
        }}
      >
        {children}
      </select>
    );
  },
);

Select.displayName = "Select";
