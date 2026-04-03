import React from "react";
import { GOLD, GOLD_GLOW, GOLD_BRIGHT, SERIF, DARK_NAVY_2 } from "./theme";

interface LoadingSkeletonProps {
  message?: string;
  height?: string | number;
}

const ANIMATION_NAME = "dnd-pulse";

export const LoadingSkeleton = ({
  message = "Loading...",
  height = 200,
}: LoadingSkeletonProps) => {
  return (
    <>
      <style>{`
        @keyframes ${ANIMATION_NAME} {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: typeof height === "number" ? `${height}px` : height,
          width: "100%",
          background: `linear-gradient(135deg, ${DARK_NAVY_2} 0%, rgba(0,0,0,0.4) 100%)`,
          border: `1px solid rgba(201,168,76,0.2)`,
          borderRadius: "12px",
          boxShadow: `0 0 12px ${GOLD_GLOW}`,
        }}
      >
        <span
          style={{
            color: GOLD_BRIGHT,
            fontFamily: SERIF,
            fontSize: "15px",
            letterSpacing: "1px",
            animation: `${ANIMATION_NAME} 1.8s ease-in-out infinite`,
          }}
        >
          <span style={{ color: GOLD, marginRight: "8px" }}>&#9876;</span>
          {message}
        </span>
      </div>
    </>
  );
};
