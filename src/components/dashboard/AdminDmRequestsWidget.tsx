import { useAuth } from "@/hooks/useAuth";
import { api } from "@/utils/api";
import { DashboardCard } from "./DashboardCard";

export function AdminDmRequestsWidget() {
  const { user } = useAuth();
  const apiUtils = api.useUtils();
  const { data: requests, isLoading } = api.admin.getDmRequests.useQuery(
    undefined,
    { enabled: user?.role === "ADMIN" },
  );

  const approveMutation = api.admin.approveDmRequest.useMutation({
    onSuccess: () => {
      void apiUtils.admin.getDmRequests.invalidate();
    },
  });

  const display = requests?.slice(0, 3);
  const total = requests?.length ?? 0;

  return (
    <DashboardCard
      title="DM Requests"
      icon="📋"
      isLoading={isLoading}
      linkHref="/admin/dm-requests"
      linkLabel={total > 3 ? `View All (${total})` : "View All"}
    >
      {!display || display.length === 0 ? (
        <p
          style={{
            color: "#a89060",
            fontSize: "13px",
            fontFamily: "'EB Garamond', 'Georgia', serif",
            textAlign: "center",
            padding: "16px 0",
          }}
        >
          No pending requests.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {display.map((req) => (
            <div
              key={req.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                background: "rgba(0,0,0,0.3)",
                borderRadius: "8px",
              }}
            >
              <div>
                <div
                  style={{
                    color: "#e8d5a3",
                    fontSize: "13px",
                    fontWeight: "bold",
                    fontFamily: "'EB Garamond', 'Georgia', serif",
                  }}
                >
                  {req.user.username}
                </div>
                <div
                  style={{
                    color: "#8b7a5e",
                    fontSize: "10px",
                    fontFamily: "'EB Garamond', 'Georgia', serif",
                    marginTop: "2px",
                  }}
                >
                  {new Date(req.requestedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
              </div>
              <button
                onClick={() => approveMutation.mutate({ requestId: req.id })}
                disabled={approveMutation.isPending}
                style={{
                  background: "linear-gradient(135deg, #8b6914, #c9a84c)",
                  color: "#1a1a2e",
                  border: "none",
                  borderRadius: "6px",
                  padding: "6px 14px",
                  fontSize: "11px",
                  fontFamily: "'EB Garamond', 'Georgia', serif",
                  fontWeight: "bold",
                  cursor: approveMutation.isPending ? "not-allowed" : "pointer",
                  opacity: approveMutation.isPending ? 0.6 : 1,
                }}
              >
                Approve
              </button>
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  );
}
