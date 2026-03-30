import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/useIsMobile";

interface NavItem {
  label: string;
  href: string;
}

function getNavItems(role: string): NavItem[] {
  switch (role) {
    case "ADMIN":
      return [
        { label: "DM Requests", href: "/admin/dm-requests" },
        { label: "Global Settings", href: "/admin/settings" },
      ];
    case "DUNGEON_MASTER":
      return [
        { label: "Adventure Books", href: "/dm/adventure-books" },
        { label: "My Campaigns", href: "/adventures" },
        { label: "Spells", href: "/spells" },
        { label: "Classes", href: "/classes" },
        { label: "Races", href: "/races" },
        { label: "Monster Manual", href: "/dm/monster-manual" },
        { label: "Item Vault", href: "/items" },
        { label: "Rule Books", href: "/dm/rule-books" },
        { label: "Rules For DM", href: "/dm/rules" },
        { label: "Rules For Players", href: "/rules" },
        { label: "My Characters", href: "/characters" },
        { label: "Create New Character", href: "/characters/new" },
      ];
    case "PLAYER":
    default:
      return [
        { label: "My Adventures", href: "/adventures" },
        { label: "Spells", href: "/spells" },
        { label: "Classes", href: "/classes" },
        { label: "Races", href: "/races" },
        { label: "Item Vault", href: "/items" },
        { label: "Rules For Players", href: "/rules" },
        { label: "My Characters", href: "/characters" },
        { label: "Create New Character", href: "/characters/new" },
      ];
  }
}

export function NavBar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

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
            background: isOpen
              ? "rgba(201,168,76,0.2)"
              : "rgba(0,0,0,0.7)",
            border: "1px solid rgba(201,168,76,0.5)",
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
              background: "#c9a84c",
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
              background: "#c9a84c",
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
              background: "#c9a84c",
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
              background:
                "linear-gradient(135deg, rgba(13,13,26,0.97) 0%, rgba(26,26,46,0.97) 50%, rgba(22,33,62,0.97) 100%)",
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
                borderBottom: "1px solid rgba(201,168,76,0.2)",
              }}
            >
              <div
                style={{
                  color: "#c9a84c",
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
                    color: "#a89060",
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
                        ? "rgba(201,168,76,0.15)"
                        : "transparent",
                      border: "none",
                      borderLeft: isActive
                        ? "3px solid #c9a84c"
                        : "3px solid transparent",
                      color: isActive ? "#c9a84c" : "#e8d5a3",
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

            {/* Logout */}
            <div
              style={{
                padding: "16px 24px 32px",
                borderTop: "1px solid rgba(201,168,76,0.2)",
              }}
            >
              <button
                onClick={handleLogout}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "1px solid rgba(201,168,76,0.5)",
                  color: "#c9a84c",
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
        background: "rgba(0,0,0,0.7)",
        borderRight: "1px solid rgba(201,168,76,0.3)",
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
          borderBottom: "1px solid rgba(201,168,76,0.2)",
        }}
      >
        <div
          style={{
            color: "#c9a84c",
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
              color: "#a89060",
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
                  ? "rgba(201,168,76,0.15)"
                  : "transparent",
                border: "none",
                borderLeft: isActive
                  ? "3px solid #c9a84c"
                  : "3px solid transparent",
                color: isActive ? "#c9a84c" : "#e8d5a3",
                fontSize: "13px",
                fontFamily: "'Georgia', 'Times New Roman', serif",
                cursor: "pointer",
                letterSpacing: "0.3px",
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(201,168,76,0.08)";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "#c9a84c";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "#e8d5a3";
                }
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Logout */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid rgba(201,168,76,0.2)",
        }}
      >
        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            background: "transparent",
            border: "1px solid rgba(201,168,76,0.5)",
            color: "#c9a84c",
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
