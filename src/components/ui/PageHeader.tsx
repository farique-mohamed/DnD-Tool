import React from "react";
import { GOLD, GOLD_MUTED, SERIF } from "./theme";
import { useIsMobile } from "@/hooks/useIsMobile";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  style?: React.CSSProperties;
}

export const PageHeader = ({ title, subtitle, style }: PageHeaderProps) => {
  const isMobile = useIsMobile();

  return (
    <div
      style={{
        textAlign: "center",
        marginBottom: "24px",
        ...style,
      }}
    >
      <h1
        style={{
          color: GOLD,
          fontFamily: SERIF,
          fontSize: isMobile ? "20px" : "26px",
          fontWeight: "bold",
          letterSpacing: "2px",
          textTransform: "uppercase",
          margin: 0,
        }}
      >
        {title}
      </h1>

      <div
        style={{
          width: "80px",
          height: "2px",
          background: GOLD,
          opacity: 0.6,
          margin: "12px auto",
        }}
      />

      {subtitle && (
        <p
          style={{
            color: GOLD_MUTED,
            fontFamily: SERIF,
            fontSize: "14px",
            margin: 0,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
};
