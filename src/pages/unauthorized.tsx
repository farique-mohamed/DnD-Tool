import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

const REDIRECT_SECONDS = 20;

export default function UnauthorizedPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    if (countdown <= 0) {
      void router.replace("/");
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, router]);

  return (
    <>
      <Head>
        <title>Unauthorized — DnD Tool</title>
      </Head>
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 50%, #16213e 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'EB Garamond', 'Georgia', serif",
        padding: "20px",
      }}>
        <div style={{
          maxWidth: "600px",
          width: "100%",
          textAlign: "center",
          padding: "48px 40px",
          background: "rgba(0,0,0,0.6)",
          border: "2px solid #c9a84c",
          borderRadius: "12px",
          boxShadow: "0 0 40px rgba(201,168,76,0.3), inset 0 0 60px rgba(0,0,0,0.5)",
        }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>🛡️</div>

          <h1 style={{
            color: "#c9a84c",
            fontSize: "28px",
            fontWeight: "bold",
            marginBottom: "8px",
            textTransform: "uppercase",
            letterSpacing: "2px",
            textShadow: "0 0 20px rgba(201,168,76,0.5)",
          }}>
            ⚔️ Unauthorized Adventurer ⚔️
          </h1>

          <div style={{
            width: "80px",
            height: "2px",
            background: "#c9a84c",
            margin: "16px auto",
            opacity: 0.6,
          }} />

          <p style={{
            color: "#e8d5a3",
            fontSize: "15px",
            lineHeight: "1.8",
            marginBottom: "12px",
          }}>
            Thou hast attempted to enter the <em>Dungeon Master&apos;s Sacred Chamber</em> without proper adventurer credentials!
          </p>

          <p style={{
            color: "#a89060",
            fontSize: "14px",
            lineHeight: "1.7",
            marginBottom: "12px",
          }}>
            The arcane security wards have detected thy unauthorized presence. Even the lowliest goblin knows one must possess a valid Login Scroll before venturing into these hallowed halls.
          </p>

          <p style={{
            color: "#e8d5a3",
            fontSize: "14px",
            lineHeight: "1.7",
            marginBottom: "32px",
            fontStyle: "italic",
          }}>
            &ldquo;Roll for Charisma... you rolled a 1. The Dungeon Master is not impressed.&rdquo;
          </p>

          <div style={{
            background: "rgba(201,168,76,0.1)",
            border: "1px solid rgba(201,168,76,0.4)",
            borderRadius: "8px",
            padding: "24px",
            marginBottom: "32px",
          }}>
            <div style={{
              fontSize: "72px",
              fontWeight: "bold",
              color: countdown <= 3 ? "#e74c3c" : "#c9a84c",
              lineHeight: "1",
              marginBottom: "8px",
              transition: "color 0.3s ease",
              textShadow: countdown <= 3
                ? "0 0 20px rgba(231,76,60,0.6)"
                : "0 0 20px rgba(201,168,76,0.6)",
            }}>
              {countdown}
            </div>
            <p style={{ color: "#a89060", fontSize: "13px", margin: 0 }}>
              Banishment to the Login Scroll commences in{" "}
              <span style={{ color: "#c9a84c", fontWeight: "bold" }}>
                {countdown} {countdown === 1 ? "second" : "seconds"}
              </span>
              ...
            </p>
          </div>

          <button
            onClick={() => void router.replace("/")}
            style={{
              background: "linear-gradient(135deg, #8b6914, #c9a84c)",
              color: "#1a1a2e",
              border: "none",
              borderRadius: "6px",
              padding: "12px 28px",
              fontSize: "14px",
              fontFamily: "'EB Garamond', 'Georgia', serif",
              fontWeight: "bold",
              cursor: "pointer",
              letterSpacing: "0.5px",
            }}
          >
            🏃 Flee to the Login Scroll (Cowardly Exit)
          </button>

          <p style={{
            color: "#4a4060",
            fontSize: "11px",
            marginTop: "24px",
          }}>
            This message brought to you by the Dungeon Master&apos;s Arcane Security System™
          </p>
        </div>
      </div>
    </>
  );
}
