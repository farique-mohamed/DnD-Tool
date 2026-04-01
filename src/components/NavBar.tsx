import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useTheme } from "@/hooks/useTheme";
import { darkPalette, lightPalette } from "@/components/ui/theme";

interface NavItem {
  label: string;
  href: string;
}

function getNavItems(role: string): NavItem[] {
  switch (role) {
    case "ADMIN":
      return [
        { label: "Search", href: "/search" },
        { label: "Admin Dashboard", href: "/admin" },
        { label: "User Management", href: "/admin/users" },
        { label: "Adventure Oversight", href: "/admin/adventures" },
        { label: "DM Requests", href: "/admin/dm-requests" },
        { label: "Global Settings", href: "/admin/settings" },
        { label: "Session Calendar", href: "/sessions" },
        { label: "NPC Generator", href: "/npc-generator" },
      ];
    case "DUNGEON_MASTER":
      return [
        { label: "Search", href: "/search" },
        { label: "Adventure Books", href: "/dm/adventure-books" },
        { label: "My Campaigns", href: "/adventures" },
        { label: "Session Calendar", href: "/sessions" },
        { label: "Spells", href: "/spells" },
        { label: "Classes", href: "/classes" },
        { label: "Races", href: "/races" },
        { label: "Backgrounds", href: "/backgrounds" },
        { label: "Monster Manual", href: "/dm/monster-manual" },
        { label: "Item Vault", href: "/items" },
        { label: "Rule Books", href: "/dm/rule-books" },
        { label: "Rules For DM", href: "/dm/rules" },
        { label: "Rules For Players", href: "/rules" },
        { label: "NPC Generator", href: "/npc-generator" },
        { label: "My Characters", href: "/characters" },
        { label: "Create New Character", href: "/characters/new" },
      ];
    case "PLAYER":
    default:
      return [
        { label: "Search", href: "/search" },
        { label: "My Adventures", href: "/adventures" },
        { label: "Session Calendar", href: "/sessions" },
        { label: "Spells", href: "/spells" },
        { label: "Classes", href: "/classes" },
        { label: "Races", href: "/races" },
        { label: "Backgrounds", href: "/backgrounds" },
        { label: "Item Vault", href: "/items" },
        { label: "Rules For Players", href: "/rules" },
        { label: "My Characters", href: "/characters" },
        { label: "Create New Character", href: "/characters/new" },
      ];
  }
}

function ThemeToggleButton({ isMobile }: { isMobile: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const palette = theme === "dark" ? darkPalette : lightPalette;
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        width: "100%",
        background: "transparent",
        border: `1px solid ${palette.borderAccent}`,
        color: palette.gold,
        borderRadius: "4px",
        padding: isMobile ? "12px 16px" : "8px 16px",
        fontFamily: "'Georgia', serif",
        fontSize: isMobile ? "15px" : "13px",
        cursor: "pointer",
        letterSpacing: "0.3px",
      }}
    >
      <span style={{ fontSize: isMobile ? "18px" : "16px" }}>
        {isDark ? "\u2600\uFE0F" : "\uD83C\uDF19"}
      </span>
      {isDark ? "Light Theme" : "Dark Theme"}
    </button>
  );
}

export function NavBar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const { theme } = useTheme();
  const palette = theme === "dark" ? darkPalette : lightPalette;

  const navItems = user ? getNavItems(user.role) : [];

  // Close mobile nav on route change
  useEffect(() => {
    const handleRouteChange = () => setIsOpen(false);
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => router.events.off("routeChangeComplete", handleRouteChange);
  }, [router.events]);

  // Lock body scroll when mobile nav is open
  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.classList.add("nav-open");
    } else {
      document.body.classList.remove("nav-open");
    }
    return () => document.body.classList.remove("nav-open");
  }, [isOpen, isMobile]);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    void router.replace("/");
  };

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    void router.push(href);
  };

  // ---------- Mobile: hamburger + overlay ----------
  if (isMobile) {
    return (
      <>
        {/* Hamburger button — position: fixed so it stays in place */}
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={isOpen ? "Close navigation" : "Open navigation"}
          style={{
            position: "fixed",
            top: "12px",
            left: "12px",
            zIndex: 1100,
            width: "44px",
            height: "44px",
            background: isOpen
              ? `${palette.gold}33`
              : palette.navBg,
            border: `1px solid ${palette.borderAccent}`,
            borderRadius: "8px",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            padding: "0",
          }}
        >
          <span
            style={{
              display: "block",
              width: "22px",
              height: "2px",
              background: palette.gold,
              borderRadius: "1px",
              transition: "transform 0.2s, opacity 0.2s",
              transform: isOpen
                ? "translateY(7px) rotate(45deg)"
                : "none",
            }}
          />
          <span
            style={{
              display: "block",
              width: "22px",
              height: "2px",
              background: palette.gold,
              borderRadius: "1px",
              transition: "opacity 0.2s",
              opacity: isOpen ? 0 : 1,
            }}
          />
          <span
            style={{
              display: "block",
              width: "22px",
              height: "2px",
              background: palette.gold,
              borderRadius: "1px",
              transition: "transform 0.2s, opacity 0.2s",
              transform: isOpen
                ? "translateY(-7px) rotate(-45deg)"
                : "none",
            }}
          />
        </button>

        {/* Full-screen overlay */}
        {isOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1050,
              background: palette.overlayBg,
              display: "flex",
              flexDirection: "column",
              fontFamily: "'Georgia', 'Times New Roman', serif",
              overflowY: "auto",
            }}
          >
            {/* Logo area */}
            <div
              style={{
                padding: "16px 20px 16px 68px",
                borderBottom: `1px solid ${palette.borderColor}`,
              }}
            >
              <div
                style={{
                  color: palette.gold,
                  fontSize: "18px",
                  fontWeight: "bold",
                  letterSpacing: "1px",
                  cursor: "pointer",
                }}
                onClick={() => handleNavClick("/dashboard")}
              >
                ⚔️ DnD Tool
              </div>
              {user && (
                <div
                  style={{
                    color: palette.textSecondary,
                    fontSize: "11px",
                    marginTop: "6px",
                    letterSpacing: "0.5px",
                  }}
                >
                  {user.username}
                </div>
              )}
            </div>

            {/* Nav items */}
            <div style={{ flex: 1, padding: "16px 0" }}>
              {navItems.map((item) => {
                const isActive = router.pathname === item.href;
                return (
                  <button
                    key={item.href}
                    onClick={() => handleNavClick(item.href)}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      padding: "14px 24px",
                      background: isActive
                        ? `${palette.gold}26`
                        : "transparent",
                      border: "none",
                      borderLeft: isActive
                        ? `3px solid ${palette.gold}`
                        : "3px solid transparent",
                      color: isActive ? palette.gold : palette.textPrimary,
                      fontSize: "16px",
                      fontFamily: "'Georgia', 'Times New Roman', serif",
                      cursor: "pointer",
                      letterSpacing: "0.3px",
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Theme toggle + Logout */}
            <div
              style={{
                padding: "16px 24px 32px",
                borderTop: `1px solid ${palette.borderColor}`,
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <ThemeToggleButton isMobile={true} />
              <button
                onClick={handleLogout}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: `1px solid ${palette.borderAccent}`,
                  color: palette.gold,
                  borderRadius: "4px",
                  padding: "12px 16px",
                  fontFamily: "'Georgia', serif",
                  fontSize: "15px",
                  cursor: "pointer",
                  letterSpacing: "0.3px",
                }}
              >
                🏃 Flee the Dungeon
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // ---------- Desktop: sidebar ----------
  return (
    <nav
      style={{
        width: "220px",
        height: "100vh",
        background: palette.navBg,
        borderRight: `1px solid ${palette.borderColor}`,
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Georgia', 'Times New Roman', serif",
        flexShrink: 0,
        position: "sticky",
        top: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "24px 20px 20px",
          borderBottom: `1px solid ${palette.borderColor}`,
        }}
      >
        <div
          style={{
            color: palette.gold,
            fontSize: "18px",
            fontWeight: "bold",
            letterSpacing: "1px",
            cursor: "pointer",
          }}
          onClick={() => void router.push("/dashboard")}
        >
          ⚔️ DnD Tool
        </div>
        {user && (
          <div
            style={{
              color: palette.textSecondary,
              fontSize: "11px",
              marginTop: "6px",
              letterSpacing: "0.5px",
            }}
          >
            {user.username}
          </div>
        )}
      </div>

      {/* Nav Items */}
      <div style={{ flex: 1, padding: "16px 0", overflowY: "auto" }}>
        {navItems.map((item) => {
          const isActive = router.pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => handleNavClick(item.href)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "10px 20px",
                background: isActive
                  ? `${palette.gold}26`
                  : "transparent",
                border: "none",
                borderLeft: isActive
                  ? `3px solid ${palette.gold}`
                  : "3px solid transparent",
                color: isActive ? palette.gold : palette.textPrimary,
                fontSize: "13px",
                fontFamily: "'Georgia', 'Times New Roman', serif",
                cursor: "pointer",
                letterSpacing: "0.3px",
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    `${palette.gold}14`;
                  (e.currentTarget as HTMLButtonElement).style.color =
                    palette.gold;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    palette.textPrimary;
                }
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Theme toggle + Logout */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: `1px solid ${palette.borderColor}`,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <ThemeToggleButton isMobile={false} />
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            background: "transparent",
            border: `1px solid ${palette.borderAccent}`,
            color: palette.gold,
            borderRadius: "4px",
            padding: "8px 16px",
            fontFamily: "'Georgia', serif",
            fontSize: "13px",
            cursor: "pointer",
            letterSpacing: "0.3px",
          }}
        >
          🏃 Flee the Dungeon
        </button>
      </div>
    </nav>
  );
}
