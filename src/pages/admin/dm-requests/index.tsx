import Head from "next/head";
import { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { api } from "@/utils/api";

interface PendingRequest {
  id: string;
  requestedAt: Date;
  user: {
    id: string;
    username: string;
  };
}

interface ApproveDialogProps {
  request: PendingRequest;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

function ApproveDialog({
  request,
  onConfirm,
  onCancel,
  isLoading,
}: ApproveDialogProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "rgba(13,13,26,0.98)",
          border: "2px solid #c9a84c",
          borderRadius: "12px",
          boxShadow:
            "0 0 40px rgba(201,168,76,0.3), inset 0 0 60px rgba(0,0,0,0.5)",
          padding: "40px 36px",
          maxWidth: "420px",
          width: "100%",
          fontFamily: "'EB Garamond', 'Georgia', serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            color: "#c9a84c",
            fontSize: "18px",
            letterSpacing: "1px",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}
        >
          Confirm Promotion
        </h2>
        <div
          style={{
            width: "60px",
            height: "2px",
            background: "linear-gradient(90deg, transparent, #c9a84c, transparent)",
            marginBottom: "24px",
          }}
        />
        <p style={{ color: "#e8d5a3", fontSize: "14px", lineHeight: "1.7", marginBottom: "8px" }}>
          You are about to grant the title of{" "}
          <span style={{ color: "#c9a84c", fontWeight: "bold" }}>
            Dungeon Master
          </span>{" "}
          to:
        </p>
        <p
          style={{
            color: "#c9a84c",
            fontSize: "16px",
            fontWeight: "bold",
            letterSpacing: "0.5px",
            marginBottom: "24px",
            padding: "10px 16px",
            background: "rgba(201,168,76,0.1)",
            border: "1px solid rgba(201,168,76,0.3)",
            borderRadius: "6px",
          }}
        >
          {request.user.username}
        </p>
        <p style={{ color: "#a89060", fontSize: "13px", marginBottom: "28px" }}>
          This adventurer will gain authority over realms and monsters. Choose wisely.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            disabled={isLoading}
            style={{
              background: "transparent",
              border: "1px solid rgba(201,168,76,0.5)",
              color: "#c9a84c",
              borderRadius: "4px",
              padding: "10px 20px",
              fontFamily: "'EB Garamond', 'Georgia', serif",
              fontSize: "13px",
              cursor: "pointer",
              opacity: isLoading ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              background: "linear-gradient(135deg, #8b6914, #c9a84c)",
              color: "#1a1a2e",
              border: "none",
              borderRadius: "6px",
              padding: "10px 24px",
              fontSize: "13px",
              fontFamily: "'EB Garamond', 'Georgia', serif",
              fontWeight: "bold",
              cursor: isLoading ? "not-allowed" : "pointer",
              letterSpacing: "0.5px",
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? "Bestowing..." : "Grant Title"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface RejectDialogProps {
  request: PendingRequest;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

function RejectDialog({
  request,
  onConfirm,
  onCancel,
  isLoading,
}: RejectDialogProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "rgba(13,13,26,0.98)",
          border: "2px solid #c9a84c",
          borderRadius: "12px",
          boxShadow:
            "0 0 40px rgba(201,168,76,0.3), inset 0 0 60px rgba(0,0,0,0.5)",
          padding: "40px 36px",
          maxWidth: "420px",
          width: "100%",
          fontFamily: "'EB Garamond', 'Georgia', serif",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            color: "#e74c3c",
            fontSize: "18px",
            letterSpacing: "1px",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}
        >
          Deny Request
        </h2>
        <div
          style={{
            width: "60px",
            height: "2px",
            background: "linear-gradient(90deg, transparent, #e74c3c, transparent)",
            marginBottom: "24px",
          }}
        />
        <p style={{ color: "#e8d5a3", fontSize: "14px", lineHeight: "1.7", marginBottom: "8px" }}>
          Are you sure you want to deny{" "}
          <span style={{ color: "#c9a84c", fontWeight: "bold" }}>
            {request.user.username}
          </span>
          &apos;s request to become a Dungeon Master?
        </p>
        <p
          style={{
            color: "#c9a84c",
            fontSize: "16px",
            fontWeight: "bold",
            letterSpacing: "0.5px",
            marginBottom: "24px",
            padding: "10px 16px",
            background: "rgba(201,168,76,0.1)",
            border: "1px solid rgba(201,168,76,0.3)",
            borderRadius: "6px",
          }}
        >
          {request.user.username}
        </p>
        <p style={{ color: "#a89060", fontSize: "13px", marginBottom: "28px" }}>
          This adventurer will remain without the authority to lead campaigns.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            disabled={isLoading}
            style={{
              background: "transparent",
              border: "1px solid rgba(201,168,76,0.5)",
              color: "#c9a84c",
              borderRadius: "4px",
              padding: "10px 20px",
              fontFamily: "'EB Garamond', 'Georgia', serif",
              fontSize: "13px",
              cursor: "pointer",
              opacity: isLoading ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              background: "linear-gradient(135deg, #8b2a1e, #e74c3c)",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              padding: "10px 24px",
              fontSize: "13px",
              fontFamily: "'EB Garamond', 'Georgia', serif",
              fontWeight: "bold",
              cursor: isLoading ? "not-allowed" : "pointer",
              letterSpacing: "0.5px",
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? "Denying..." : "Deny Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DmRequestsContent() {
  const [pendingApproval, setPendingApproval] = useState<PendingRequest | null>(null);
  const [pendingRejection, setPendingRejection] = useState<PendingRequest | null>(null);
  const utils = api.useUtils();

  const { data: requests, isLoading, error } = api.admin.getDmRequests.useQuery();

  const approveMutation = api.admin.approveDmRequest.useMutation({
    onSuccess: async () => {
      await utils.admin.getDmRequests.invalidate();
      setPendingApproval(null);
    },
  });

  const rejectMutation = api.admin.rejectDmRequest.useMutation({
    onSuccess: async () => {
      await utils.admin.getDmRequests.invalidate();
      setPendingRejection(null);
    },
  });

  const handleApproveClick = (request: PendingRequest) => {
    setPendingApproval(request);
  };

  const handleRejectClick = (request: PendingRequest) => {
    setPendingRejection(request);
  };

  const handleConfirmApprove = () => {
    if (pendingApproval) {
      approveMutation.mutate({ requestId: pendingApproval.id });
    }
  };

  const handleConfirmReject = () => {
    if (pendingRejection) {
      rejectMutation.mutate({ requestId: pendingRejection.id });
    }
  };

  return (
    <>
      <Head>
        <title>DM Requests — DnD Tool</title>
      </Head>

      {pendingApproval && (
        <ApproveDialog
          request={pendingApproval}
          onConfirm={handleConfirmApprove}
          onCancel={() => setPendingApproval(null)}
          isLoading={approveMutation.isPending}
        />
      )}

      {pendingRejection && (
        <RejectDialog
          request={pendingRejection}
          onConfirm={handleConfirmReject}
          onCancel={() => setPendingRejection(null)}
          isLoading={rejectMutation.isPending}
        />
      )}

      <div style={{ maxWidth: "800px" }}>
        <h1
          style={{
            color: "#c9a84c",
            fontSize: "26px",
            fontWeight: "bold",
            letterSpacing: "2px",
            textTransform: "uppercase",
            marginBottom: "8px",
          }}
        >
          DM Requests
        </h1>
        <p style={{ color: "#a89060", fontSize: "14px", marginBottom: "32px" }}>
          Adventurers seeking the mantle of Dungeon Master await your judgement.
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

        {approveMutation.isError && (
          <div
            style={{
              background: "rgba(139,42,30,0.2)",
              border: "1px solid #8b2a1e",
              borderRadius: "8px",
              padding: "12px 16px",
              color: "#e74c3c",
              fontSize: "13px",
              marginBottom: "20px",
            }}
          >
            Failed to approve request. Please try again.
          </div>
        )}

        {rejectMutation.isError && (
          <div
            style={{
              background: "rgba(139,42,30,0.2)",
              border: "1px solid #8b2a1e",
              borderRadius: "8px",
              padding: "12px 16px",
              color: "#e74c3c",
              fontSize: "13px",
              marginBottom: "20px",
            }}
          >
            Failed to reject request. Please try again.
          </div>
        )}

        {isLoading && (
          <p style={{ color: "#a89060", fontSize: "14px" }}>
            Consulting the arcane records...
          </p>
        )}

        {error && (
          <p style={{ color: "#e74c3c", fontSize: "14px" }}>
            A dark magic has disrupted the records. Please refresh.
          </p>
        )}

        {!isLoading && !error && requests?.length === 0 && (
          <div
            style={{
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(201,168,76,0.2)",
              borderRadius: "12px",
              padding: "40px",
              textAlign: "center",
            }}
          >
            <p style={{ color: "#a89060", fontSize: "14px" }}>
              No pending requests. The realm is at peace.
            </p>
          </div>
        )}

        {!isLoading && !error && requests && requests.length > 0 && (
          <div
            style={{
              background: "rgba(0,0,0,0.6)",
              border: "2px solid #c9a84c",
              borderRadius: "12px",
              boxShadow:
                "0 0 40px rgba(201,168,76,0.3), inset 0 0 60px rgba(0,0,0,0.5)",
              overflow: "hidden",
            }}
          >
            {requests.map((request, index) => (
              <div
                key={request.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "18px 24px",
                  borderBottom:
                    index < requests.length - 1
                      ? "1px solid rgba(201,168,76,0.15)"
                      : "none",
                }}
              >
                <div>
                  <div
                    style={{
                      color: "#e8d5a3",
                      fontSize: "15px",
                      fontWeight: "bold",
                      marginBottom: "4px",
                    }}
                  >
                    {request.user.username}
                  </div>
                  <div style={{ color: "#a89060", fontSize: "12px" }}>
                    Requested:{" "}
                    {new Date(request.requestedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => handleRejectClick(request)}
                    style={{
                      background: "transparent",
                      border: "1px solid rgba(231,76,60,0.5)",
                      color: "#e74c3c",
                      borderRadius: "6px",
                      padding: "8px 16px",
                      fontSize: "13px",
                      fontFamily: "'EB Garamond', 'Georgia', serif",
                      cursor: "pointer",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApproveClick(request)}
                    style={{
                      background: "linear-gradient(135deg, #8b6914, #c9a84c)",
                      color: "#1a1a2e",
                      border: "none",
                      borderRadius: "6px",
                      padding: "8px 20px",
                      fontSize: "13px",
                      fontFamily: "'EB Garamond', 'Georgia', serif",
                      fontWeight: "bold",
                      cursor: "pointer",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default function DmRequestsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <DmRequestsContent />
      </Layout>
    </ProtectedRoute>
  );
}
