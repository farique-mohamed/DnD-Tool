// ---------------------------------------------------------------------------
// Navigation item definitions — grouped by category per role
// ---------------------------------------------------------------------------

export interface NavLink {
  label: string;
  href: string;
}

export interface NavGroup {
  label: string;
  children: NavLink[];
}

export type NavEntry = NavLink | NavGroup;

export function isNavGroup(entry: NavEntry): entry is NavGroup {
  return "children" in entry;
}

// ── Shared sub-menus ────────────────────────────────────────────────────────

const compendiumPlayer: NavGroup = {
  label: "Compendium",
  children: [
    { label: "Spells", href: "/spells" },
    { label: "Classes", href: "/classes" },
    { label: "Races", href: "/races" },
    { label: "Feats", href: "/feats" },
    { label: "Backgrounds", href: "/backgrounds" },
    { label: "Conditions", href: "/conditions" },
    { label: "Languages", href: "/languages" },
    { label: "Life Events", href: "/life" },
  ],
};

const compendiumDm: NavGroup = {
  label: "Compendium",
  children: [
    ...compendiumPlayer.children,
    { label: "Monster Manual", href: "/dm/monster-manual" },
  ],
};

const equipment: NavGroup = {
  label: "Equipment",
  children: [
    { label: "Item Vault", href: "/items" },
    { label: "Vehicles", href: "/vehicles" },
  ],
};

const rulesPlayer: NavGroup = {
  label: "Rules",
  children: [{ label: "Rules For Players", href: "/rules" }],
};

const rulesDm: NavGroup = {
  label: "Rules",
  children: [
    { label: "Rules For Players", href: "/rules" },
    { label: "Rules For DM", href: "/dm/rules" },
    { label: "Rule Books", href: "/dm/rule-books" },
  ],
};

const characters: NavGroup = {
  label: "Characters",
  children: [
    { label: "My Characters", href: "/characters" },
    { label: "Create New Character", href: "/characters/new" },
  ],
};

const dmTools: NavGroup = {
  label: "DM Tools",
  children: [
    { label: "Adventure Books", href: "/dm/adventure-books" },
    { label: "NPC Generator", href: "/npc-generator" },
  ],
};

const adminGroup: NavGroup = {
  label: "Admin",
  children: [
    { label: "Admin Dashboard", href: "/admin" },
    { label: "User Management", href: "/admin/users" },
    { label: "Adventure Oversight", href: "/admin/adventures" },
    { label: "DM Requests", href: "/admin/dm-requests" },
    { label: "Global Settings", href: "/admin/settings" },
  ],
};

// ── Top-level links ─────────────────────────────────────────────────────────

const search: NavLink = { label: "Search", href: "/search" };
const myAdventures: NavLink = { label: "My Adventures", href: "/adventures" };
const myCampaigns: NavLink = { label: "My Campaigns", href: "/adventures" };
const sessions: NavLink = { label: "Sessions", href: "/sessions" };
const settings: NavLink = { label: "Settings", href: "/settings" };

// ── Per-role menus ──────────────────────────────────────────────────────────

export function getNavEntries(role: string): NavEntry[] {
  switch (role) {
    case "ADMIN":
      return [
        search,
        adminGroup,
        compendiumDm,
        equipment,
        rulesDm,
        dmTools,
        characters,
        myCampaigns,
        sessions,
        settings,
      ];
    case "DUNGEON_MASTER":
      return [
        search,
        compendiumDm,
        equipment,
        rulesDm,
        dmTools,
        characters,
        myCampaigns,
        sessions,
        settings,
      ];
    case "PLAYER":
    default:
      return [
        search,
        compendiumPlayer,
        equipment,
        rulesPlayer,
        characters,
        myAdventures,
        sessions,
        settings,
      ];
  }
}
