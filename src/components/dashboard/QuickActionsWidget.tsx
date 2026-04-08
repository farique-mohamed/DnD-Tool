import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import { DashboardCard } from "./DashboardCard";

const ACTIONS = [
  { label: "Create Character", href: "/characters/new", icon: "🛡️", roles: ["PLAYER", "DUNGEON_MASTER", "ADMIN"] },
  { label: "View Spells", href: "/spells", icon: "✨", roles: ["PLAYER", "DUNGEON_MASTER", "ADMIN"] },
  { label: "View Classes", href: "/classes", icon: "⚔️", roles: ["PLAYER", "DUNGEON_MASTER", "ADMIN"] },
  { label: "Item Vault", href: "/items", icon: "🎒", roles: ["PLAYER", "DUNGEON_MASTER", "ADMIN"] },
  { label: "Adventure Books", href: "/dm/adventure-books", icon: "📖", roles: ["DUNGEON_MASTER", "ADMIN"] },
  { label: "Monster Manual", href: "/dm/monster-manual", icon: "🐉", roles: ["DUNGEON_MASTER", "ADMIN"] },
  { label: "DM Requests", href: "/admin/dm-requests", icon: "📋", roles: ["ADMIN"] },
] as const;

export function QuickActionsWidget() {
  const router = useRouter();
  const { user } = useAuth();

  const filtered = ACTIONS.filter(
    (a) => user && (a.roles as readonly string[]).includes(user.role),
  );

  return (
    <DashboardCard title="Quick Actions" icon="⚡">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
        }}
      >
        {filtered.map((action) => (
          <button
            key={action.href}
            onClick={() => void router.push(action.href)}
            style={{
              background: "transparent",
              border: "1px solid rgba(201,168,76,0.3)",
              borderRadius: "8px",
              padding: "10px 8px",
              color: "#c9a84c",
              fontSize: "11px",
              fontFamily: "'EB Garamond', 'Georgia', serif",
              cursor: "pointer",
              transition: "border-color 0.2s, background 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(201,168,76,0.7)";
              e.currentTarget.style.background = "rgba(201,168,76,0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <span>{action.icon}</span>
            {action.label}
          </button>
        ))}
      </div>
    </DashboardCard>
  );
}
