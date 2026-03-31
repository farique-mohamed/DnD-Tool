import React from "react";
import { GOLD, GOLD_MUTED, SERIF } from "./theme";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const Modal = ({ open, onClose, title, children, style }: ModalProps) => {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "rgba(15,8,3,0.95)",
          border: `2px solid ${GOLD}`,
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "600px",
          width: "90%",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          ...style,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <h2
              style={{
                color: GOLD,
                fontSize: "18px",
                fontWeight: "bold",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                fontFamily: SERIF,
                margin: 0,
              }}
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: GOLD_MUTED,
                fontSize: "20px",
                cursor: "pointer",
                padding: "0 4px",
                fontFamily: SERIF,
              }}
            >
              ✕
            </button>
          </div>
        )}

        <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
};
