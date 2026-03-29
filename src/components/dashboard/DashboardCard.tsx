import { useRouter } from "next/router";
import type { ReactNode } from "react";

export function DashboardCard({
  title,
  icon,
  children,
  linkHref,
  linkLabel,
  isLoading,
}: {
  title: string;
  icon: string;
  children: ReactNode;
  linkHref?: string;
  linkLabel?: string;
  isLoading?: boolean;
}) {
  const router = useRouter();

  return (
    <div
      style={{
        background: "rgba(0,0,0,0.4)",
        border: "1px solid rgba(201,168,76,0.2)",
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        transition: "border-color 0.2s",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)")
      }
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "16px",
        }}
      >
        <span style={{ fontSize: "18px" }}>{icon}</span>
        <h3
          style={{
            color: "#c9a84c",
            fontSize: "13px",
            fontWeight: "bold",
            letterSpacing: "1px",
            textTransform: "uppercase",
            fontFamily: "'Georgia', serif",
            margin: 0,
          }}
        >
          {title}
        </h3>
      </div>

      {isLoading ? (
        <p
          style={{
            color: "#a89060",
            fontSize: "13px",
            fontFamily: "'Georgia', serif",
          }}
        >
          Consulting the arcane records...
        </p>
      ) : (
        <div style={{ flex: 1 }}>{children}</div>
      )}

      {linkHref && linkLabel && !isLoading && (
        <div
          style={{
            marginTop: "16px",
            paddingTop: "12px",
            borderTop: "1px solid rgba(201,168,76,0.1)",
          }}
        >
          <button
            onClick={() => void router.push(linkHref)}
            style={{
              background: "none",
              border: "none",
              color: "#c9a84c",
              fontSize: "12px",
              fontFamily: "'Georgia', serif",
              cursor: "pointer",
              padding: 0,
              letterSpacing: "0.5px",
            }}
          >
            {linkLabel} →
          </button>
        </div>
      )}
    </div>
  );
}
