import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { useTheme } from "@/hooks/useTheme";
import { darkPalette, lightPalette, SERIF, HEADING_FONT } from "@/components/ui/theme";
import type { ThemePalette } from "@/components/ui/theme";
import { getNavEntries, isNavGroup } from "./navItems";
import type { NavEntry, NavGroup, NavLink } from "./navItems";

// ── Theme toggle (icon only) ────────────────────────────────────────────────

function ThemeToggleIcon({ palette }: { palette: ThemePalette }) {
  const { theme, toggleTheme } = useTheme();
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
        width: "36px",
        height: "36px",
        background: "transparent",
        border: `1px solid ${palette.borderAccent}`,
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "18px",
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {isDark ? "\u2600\uFE0F" : "\uD83C\uDF19"}
    </button>
  );
}

// ── Dropdown menu for a NavGroup ────────────────────────────────────────────

function DropdownMenu({
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
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const hasActiveChild = group.children.some((c) => currentPath === c.href);

  const handleEnter = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setOpen(true);
  };

  const handleLeave = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{ position: "relative" }}
    >
      <button
        aria-haspopup="true"
        aria-expanded={open}
        style={{
          background: "transparent",
          border: "none",
          color: hasActiveChild ? palette.gold : palette.textPrimary,
          fontFamily: SERIF,
          fontSize: "14px",
          cursor: "pointer",
          padding: "8px 12px",
          letterSpacing: "0.3px",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          whiteSpace: "nowrap",
          transition: "color 0.15s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = palette.gold;
        }}
        onMouseLeave={(e) => {
          if (!hasActiveChild) {
            (e.currentTarget as HTMLButtonElement).style.color =
              palette.textPrimary;
          }
        }}
      >
        {group.label}
        <span
          style={{
            fontSize: "10px",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            display: "inline-block",
          }}
        >
          ▼
        </span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            minWidth: "200px",
            background: palette.navBg,
            border: `1px solid ${palette.borderColor}`,
            borderRadius: "6px",
            boxShadow: `0 8px 24px rgba(0,0,0,0.4)`,
            padding: "6px 0",
            zIndex: 1200,
          }}
        >
          {group.children.map((child) => {
            const isActive = currentPath === child.href;
            return (
              <button
                key={child.href}
                onClick={() => {
                  setOpen(false);
                  onNavigate(child.href);
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "9px 18px",
                  background: isActive ? `${palette.gold}1a` : "transparent",
                  border: "none",
                  color: isActive ? palette.gold : palette.textPrimary,
                  fontFamily: SERIF,
                  fontSize: "13px",
                  cursor: "pointer",
                  letterSpacing: "0.3px",
                  transition: "background 0.12s, color 0.12s",
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
                {child.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Top-level link ──────────────────────────────────────────────────────────

function TopLevelLink({
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
        background: "transparent",
        border: "none",
        color: isActive ? palette.gold : palette.textPrimary,
        fontFamily: SERIF,
        fontSize: "14px",
        cursor: "pointer",
        padding: "8px 12px",
        letterSpacing: "0.3px",
        whiteSpace: "nowrap",
        transition: "color 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.color = palette.gold;
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLButtonElement).style.color =
            palette.textPrimary;
        }
      }}
    >
      {item.label}
    </button>
  );
}

// ── Desktop NavBar ──────────────────────────────────────────────────────────

export function DesktopNav({
  role,
  onLogout,
}: {
  role: string;
  onLogout: () => void;
}) {
  const router = useRouter();
  const { theme } = useTheme();
  const palette = theme === "dark" ? darkPalette : lightPalette;
  const entries: NavEntry[] = getNavEntries(role);

  const handleNavigate = (href: string) => {
    void router.push(href);
  };

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        width: "100%",
        height: "56px",
        background: palette.navBg,
        borderBottom: `1px solid ${palette.borderColor}`,
        display: "flex",
        alignItems: "center",
        fontFamily: SERIF,
        zIndex: 1100,
        padding: "0 24px",
        boxSizing: "border-box",
        backdropFilter: "blur(8px)",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        onClick={() => handleNavigate("/dashboard")}
        style={{
          color: palette.gold,
          fontSize: "18px",
          fontWeight: "bold",
          fontFamily: HEADING_FONT,
          letterSpacing: "1.5px",
          cursor: "pointer",
          marginRight: "28px",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        ⚔️ DnD Tool
      </div>

      {/* Menu items */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "2px",
          flex: 1,
          overflow: "visible",
        }}
      >
        {entries.map((entry) =>
          isNavGroup(entry) ? (
            <DropdownMenu
              key={entry.label}
              group={entry}
              palette={palette}
              currentPath={router.pathname}
              onNavigate={handleNavigate}
            />
          ) : (
            <TopLevelLink
              key={entry.href}
              item={entry}
              palette={palette}
              currentPath={router.pathname}
              onNavigate={handleNavigate}
            />
          ),
        )}
      </div>

      {/* Right side: theme toggle + logout */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginLeft: "16px",
          flexShrink: 0,
        }}
      >
        <ThemeToggleIcon palette={palette} />
        <button
          onClick={onLogout}
          style={{
            background: "transparent",
            border: `1px solid ${palette.borderAccent}`,
            color: palette.gold,
            borderRadius: "4px",
            padding: "6px 14px",
            fontFamily: SERIF,
            fontSize: "13px",
            cursor: "pointer",
            letterSpacing: "0.3px",
            whiteSpace: "nowrap",
          }}
        >
          🏃 Flee the Dungeon
        </button>
      </div>
    </nav>
  );
}
