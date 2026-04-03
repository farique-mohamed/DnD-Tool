import Head from "next/head";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/useIsMobile";
import type { UserRoleType } from "@/lib/constants";

import { WelcomeWidget } from "@/components/dashboard/WelcomeWidget";
import { MyCharactersWidget } from "@/components/dashboard/MyCharactersWidget";
import { QuickActionsWidget } from "@/components/dashboard/QuickActionsWidget";
import { MyAdventuresWidget } from "@/components/dashboard/MyAdventuresWidget";
import { MyCampaignsWidget } from "@/components/dashboard/MyCampaignsWidget";
import { AdminDmRequestsWidget } from "@/components/dashboard/AdminDmRequestsWidget";
import { UpcomingSessionsWidget } from "@/components/dashboard/UpcomingSessionsWidget";

type WidgetConfig = {
  key: string;
  component: React.ReactNode;
  colSpan: number;
};

function getWidgetsForRole(role: UserRoleType): WidgetConfig[] {
  const welcome = { key: "welcome", component: <WelcomeWidget />, colSpan: 3 };
  const campaigns = { key: "campaigns", component: <MyCampaignsWidget />, colSpan: 2 };
  const characters = { key: "characters", component: <MyCharactersWidget />, colSpan: 2 };
  const quickActions = { key: "quick-actions", component: <QuickActionsWidget />, colSpan: 1 };
  const adventures = { key: "adventures", component: <MyAdventuresWidget />, colSpan: 2 };
  const dmRequests = { key: "dm-requests", component: <AdminDmRequestsWidget />, colSpan: 1 };
  const upcomingSessions = { key: "upcoming-sessions", component: <UpcomingSessionsWidget />, colSpan: 1 };

  switch (role) {
    case "ADMIN":
      // Row 1: Welcome(3) | Row 2: DmRequests(1)+Campaigns(2) | Row 3: Characters(2)+Sessions(1) | Row 4: Adventures(2)+QuickActions(1)
      return [welcome, dmRequests, campaigns, characters, upcomingSessions, adventures, quickActions];
    case "DUNGEON_MASTER":
      // Row 1: Welcome(3) | Row 2: Campaigns(2)+Sessions(1) | Row 3: Characters(2)+QuickActions(1) | Row 4: Adventures(2)
      return [welcome, campaigns, upcomingSessions, characters, quickActions, adventures];
    case "PLAYER":
    default:
      // Row 1: Welcome(3) | Row 2: Characters(2)+Sessions(1) | Row 3: Adventures(2)+QuickActions(1)
      return [welcome, characters, upcomingSessions, adventures, quickActions];
  }
}

function DashboardContent() {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  if (!user) return null;

  const widgets = getWidgetsForRole(user.role);

  return (
    <>
      <Head>
        <title>Dashboard — DnD Tool</title>
      </Head>
      <div
        style={{
          maxWidth: "1100px",
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: isMobile ? "16px" : "20px",
        }}
      >
        {widgets.map((w) => (
          <div
            key={w.key}
            style={{
              gridColumn: isMobile ? "span 1" : `span ${w.colSpan}`,
            }}
          >
            {w.component}
          </div>
        ))}
      </div>
    </>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <Layout>
        <DashboardContent />
      </Layout>
    </ProtectedRoute>
  );
}
