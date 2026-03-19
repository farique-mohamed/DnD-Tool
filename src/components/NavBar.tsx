import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";

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
        { label: "Adventures", href: "/adventures" },
        { label: "Monster Manual", href: "/dm/monster-manual" },
        { label: "Rules For DM", href: "/dm/rules" },
        { label: "Rules For Players", href: "/rules" },
        { label: "My Characters", href: "/characters" },
        { label: "Create New Character", href: "/characters/new" },
      ];
    case "PLAYER":
    default:
      return [
        { label: "Adventures", href: "/adventures" },
        { label: "Rules For Players", href: "/rules" },
        { label: "My Characters", href: "/characters" },
        { label: "Create New Character", href: "/characters/new" },
      ];
  }
}

export function NavBar() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const navItems = user ? getNavItems(user.role) : [];

  const handleLogout = () => {
    logout();
    void router.replace("/");
  };

  const handleNavClick = (href: string) => {
    void router.push(href);
  };

  return (
    <nav
      style={{
        width: "220px",
        minHeight: "100vh",
        background: "rgba(0,0,0,0.7)",
        borderRight: "1px solid rgba(201,168,76,0.3)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Georgia', 'Times New Roman', serif",
        flexShrink: 0,
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
