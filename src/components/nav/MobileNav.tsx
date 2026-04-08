import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useTheme } from "@/hooks/useTheme";
import { darkPalette, lightPalette, SERIF } from "@/components/ui/theme";
import type { ThemePalette } from "@/components/ui/theme";
import { getNavEntries, isNavGroup } from "./navItems";
import type { NavEntry, NavGroup, NavLink } from "./navItems";

// ── Theme toggle (full-width, for mobile overlay) ───────────────────────────

function ThemeToggleMobile({ palette }: { palette: ThemePalette }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
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
        padding: "12px 16px",
        fontFamily: SERIF,
        fontSize: "15px",
        cursor: "pointer",
        letterSpacing: "0.3px",
      }}
    >
      <span style={{ fontSize: "18px" }}>{isDark ? "\u2600\uFE0F" : "\uD83C\uDF19"}</span>
      {isDark ? "Light Theme" : "Dark Theme"}
    </button>
  );
}

// ── Expandable section for a NavGroup ───────────────────────────────────────

function MobileNavSection({
  group,
  palette,
  currentPath,
  onNavigate,
}: {
  group: NavGroup;
  palette: ThemePalette;
  currentPath: string;
  onNavigate: (href: string) => void;
}) {
  const hasActiveChild = group.children.some((c) => currentPath === c.href);
  const [expanded, setExpanded] = useState(hasActiveChild);

  return (
    <div>
      <button
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "14px 24px",
          background: "transparent",
          border: "none",
          color: hasActiveChild ? palette.gold : palette.textPrimary,
          fontSize: "16px",
          fontFamily: SERIF,
          fontWeight: "bold",
          cursor: "pointer",
          letterSpacing: "0.4px",
        }}
      >
        {group.label}
        <span
          style={{
            fontSize: "12px",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            display: "inline-block",
          }}
        >
          ▼
        </span>
      </button>

      {expanded && (
        <div style={{ paddingBottom: "4px" }}>
          {group.children.map((child) => {
            const isActive = currentPath === child.href;
            return (
              <button
                key={child.href}
                onClick={() => onNavigate(child.href)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "11px 24px 11px 40px",
                  background: isActive ? `${palette.gold}26` : "transparent",
                  border: "none",
                  borderLeft: isActive
                    ? `3px solid ${palette.gold}`
                    : "3px solid transparent",
                  color: isActive ? palette.gold : palette.textPrimary,
                  fontSize: "15px",
                  fontFamily: SERIF,
                  cursor: "pointer",
                  letterSpacing: "0.3px",
                }}
              >
                {child.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Top-level link (mobile) ─────────────────────────────────────────────────

function MobileTopLevelLink({
  item,
  palette,
  currentPath,
  onNavigate,
}: {
  item: NavLink;
  palette: ThemePalette;
  currentPath: string;
  onNavigate: (href: string) => void;
}) {
  const isActive = currentPath === item.href;

  return (
    <button
      onClick={() => onNavigate(item.href)}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        padding: "14px 24px",
        background: isActive ? `${palette.gold}26` : "transparent",
        border: "none",
        borderLeft: isActive
          ? `3px solid ${palette.gold}`
          : "3px solid transparent",
        color: isActive ? palette.gold : palette.textPrimary,
        fontSize: "16px",
        fontFamily: SERIF,
        cursor: "pointer",
        letterSpacing: "0.3px",
      }}
    >
      {item.label}
    </button>
  );
}

// ── Mobile NavBar ───────────────────────────────────────────────────────────

export function MobileNav({
  role,
  onLogout,
}: {
  role: string;
  onLogout: () => void;
}) {
  const router = useRouter();
  const { theme } = useTheme();
  const palette = theme === "dark" ? darkPalette : lightPalette;
  const [isOpen, setIsOpen] = useState(false);
  const entries: NavEntry[] = getNavEntries(role);

  // Close on route change
  useEffect(() => {
    const handleRouteChange = () => setIsOpen(false);
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => router.events.off("routeChangeComplete", handleRouteChange);
  }, [router.events]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("nav-open");
    } else {
      document.body.classList.remove("nav-open");
    }
    return () => document.body.classList.remove("nav-open");
  }, [isOpen]);

  const handleNavigate = (href: string) => {
    setIsOpen(false);
    void router.push(href);
  };

  return (
    <>
      {/* Hamburger button */}
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
          background: isOpen ? `${palette.gold}33` : palette.navBg,
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
            transform: isOpen ? "translateY(7px) rotate(45deg)" : "none",
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
            transform: isOpen ? "translateY(-7px) rotate(-45deg)" : "none",
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
            fontFamily: SERIF,
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
              onClick={() => handleNavigate("/dashboard")}
            >
              ⚔️ DnD Tool
            </div>
          </div>

          {/* Nav items */}
          <div style={{ flex: 1, padding: "8px 0" }}>
            {entries.map((entry) =>
              isNavGroup(entry) ? (
                <MobileNavSection
                  key={entry.label}
                  group={entry}
                  palette={palette}
                  currentPath={router.pathname}
                  onNavigate={handleNavigate}
                />
              ) : (
                <MobileTopLevelLink
                  key={entry.href}
                  item={entry}
                  palette={palette}
                  currentPath={router.pathname}
                  onNavigate={handleNavigate}
                />
              ),
            )}
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
            <ThemeToggleMobile palette={palette} />
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              style={{
                width: "100%",
                background: "transparent",
                border: `1px solid ${palette.borderAccent}`,
                color: palette.gold,
                borderRadius: "4px",
                padding: "12px 16px",
                fontFamily: SERIF,
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
