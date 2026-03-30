import Head from "next/head";
import Link from "next/link";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { api } from "@/utils/api";
import { useIsMobile } from "@/hooks/useIsMobile";

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: string | number;
  href?: string;
}) {
  const content = (
    <div
      style={{
        background: "rgba(0,0,0,0.4)",
        border: "1px solid rgba(201,168,76,0.2)",
        borderRadius: "12px",
        padding: "24px",
        textAlign: "center",
        cursor: href ? "pointer" : "default",
        transition: "border-color 0.2s",
      }}
      onMouseEnter={(e) => {
        if (href) {
          (e.currentTarget as HTMLDivElement).style.borderColor =
            "rgba(201,168,76,0.5)";
        }
      }}
      onMouseLeave={(e) => {
        if (href) {
          (e.currentTarget as HTMLDivElement).style.borderColor =
            "rgba(201,168,76,0.2)";
        }
      }}
    >
      <div
        style={{
          color: "#c9a84c",
          fontSize: "32px",
          fontWeight: "bold",
          fontFamily: "'Georgia', 'Times New Roman', serif",
          marginBottom: "8px",
        }}
      >
        {value}
      </div>
      <div
        style={{
          color: "#a89060",
          fontSize: "13px",
          fontFamily: "'Georgia', 'Times New Roman', serif",
          letterSpacing: "0.5px",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: "none" }}>
        {content}
      </Link>
    );
  }

  return content;
}

function AdminDashboardContent() {
  const isMobile = useIsMobile();
  const { data: stats, isLoading, error } = api.admin.getStats.useQuery();

  return (
    <>
      <Head>
        <title>Admin Dashboard — DnD Tool</title>
      </Head>

      <div style={{ maxWidth: "900px" }}>
        <h1
          style={{
            color: "#c9a84c",
            fontSize: isMobile ? "20px" : "26px",
            fontWeight: "bold",
            letterSpacing: "2px",
            textTransform: "uppercase",
            marginBottom: "8px",
            fontFamily: "'Georgia', 'Times New Roman', serif",
          }}
        >
          Admin Dashboard
        </h1>
        <p
          style={{
            color: "#a89060",
            fontSize: "14px",
            marginBottom: "32px",
            fontFamily: "'Georgia', 'Times New Roman', serif",
          }}
        >
          The Realm&apos;s Command Center
        </p>
        <div
          style={{
            width: "80px",
            height: "2px",
            background: "#c9a84c",
            marginBottom: "32px",
            opacity: 0.6,
          }}
        />

        {isLoading && (
          <p
            style={{
              color: "#a89060",
              fontSize: "14px",
              fontFamily: "'Georgia', 'Times New Roman', serif",
            }}
          >
            Consulting the arcane records...
          </p>
        )}

        {error && (
          <p
            style={{
              color: "#e74c3c",
              fontSize: "14px",
              fontFamily: "'Georgia', 'Times New Roman', serif",
            }}
          >
            A dark magic has disrupted the records.
          </p>
        )}

        {!isLoading && !error && stats && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
              gap: "16px",
            }}
          >
            <StatCard label="Total Users" value={stats.totalUsers} />
            <StatCard label="Total Characters" value={stats.totalCharacters} />
            <StatCard label="Total Adventures" value={stats.totalAdventures} />
            <StatCard
              label="Active Encounters"
              value={stats.activeEncounters}
            />
            <StatCard label="Total Dice Rolls" value={stats.totalDiceRolls} />
            <StatCard
              label="Recent Signups (7 Days)"
              value={stats.recentSignups}
            />
            <StatCard
              label="Pending DM Requests"
              value={stats.pendingDmRequests}
              href="/admin/dm-requests"
            />
            <div
              style={{
                background: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(201,168,76,0.2)",
                borderRadius: "12px",
                padding: "24px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  color: "#a89060",
                  fontSize: "13px",
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  marginBottom: "16px",
                }}
              >
                Users by Role
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-around",
                  gap: "12px",
                }}
              >
                <div>
                  <div
                    style={{
                      color: "#3a7bd5",
                      fontSize: "22px",
                      fontWeight: "bold",
                      fontFamily: "'Georgia', 'Times New Roman', serif",
                    }}
                  >
                    {stats.usersByRole.PLAYER}
                  </div>
                  <div
                    style={{
                      color: "#a89060",
                      fontSize: "11px",
                      marginTop: "4px",
                      fontFamily: "'Georgia', 'Times New Roman', serif",
                    }}
                  >
                    Players
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      color: "#c9a84c",
                      fontSize: "22px",
                      fontWeight: "bold",
                      fontFamily: "'Georgia', 'Times New Roman', serif",
                    }}
                  >
                    {stats.usersByRole.DUNGEON_MASTER}
                  </div>
                  <div
                    style={{
                      color: "#a89060",
                      fontSize: "11px",
                      marginTop: "4px",
                      fontFamily: "'Georgia', 'Times New Roman', serif",
                    }}
                  >
                    DMs
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      color: "#e74c3c",
                      fontSize: "22px",
                      fontWeight: "bold",
                      fontFamily: "'Georgia', 'Times New Roman', serif",
                    }}
                  >
                    {stats.usersByRole.ADMIN}
                  </div>
                  <div
                    style={{
                      color: "#a89060",
                      fontSize: "11px",
                      marginTop: "4px",
                      fontFamily: "'Georgia', 'Times New Roman', serif",
                    }}
                  >
                    Admins
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <AdminDashboardContent />
      </Layout>
    </ProtectedRoute>
  );
}
