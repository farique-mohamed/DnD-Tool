import Head from "next/head";
import { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { api } from "@/utils/api";
import { useIsMobile } from "@/hooks/useIsMobile";

type Role = "PLAYER" | "DUNGEON_MASTER" | "ADMIN";

const ROLE_COLORS: Record<Role, string> = {
  PLAYER: "#3a7bd5",
  DUNGEON_MASTER: "#c9a84c",
  ADMIN: "#e74c3c",
};

const ROLE_LABELS: Record<Role, string> = {
  PLAYER: "Player",
  DUNGEON_MASTER: "Dungeon Master",
  ADMIN: "Admin",
};

interface User {
  id: string;
  username: string;
  role: Role;
  createdAt: Date;
  _count: {
    characters: number;
    adventures: number;
    diceRolls: number;
  };
}

interface ConfirmDialogProps {
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  confirmStyle?: React.CSSProperties;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
  loadingLabel?: string;
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  confirmStyle,
  onConfirm,
  onCancel,
  isLoading,
  loadingLabel,
}: ConfirmDialogProps) {
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
          {title}
        </h2>
        <div
          style={{
            width: "60px",
            height: "2px",
            background:
              "linear-gradient(90deg, transparent, #c9a84c, transparent)",
            marginBottom: "24px",
          }}
        />
        <div
          style={{
            color: "#e8d5a3",
            fontSize: "14px",
            lineHeight: "1.7",
            marginBottom: "28px",
          }}
        >
          {message}
        </div>
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
          }}
        >
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
              ...confirmStyle,
            }}
          >
            {isLoading ? (loadingLabel ?? "Processing...") : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: "4px",
        fontSize: "11px",
        fontWeight: "bold",
        fontFamily: "'EB Garamond', 'Georgia', serif",
        letterSpacing: "0.5px",
        color: ROLE_COLORS[role],
        background: `${ROLE_COLORS[role]}20`,
        border: `1px solid ${ROLE_COLORS[role]}40`,
        textTransform: "uppercase",
      }}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}

function UserManagementContent() {
  const isMobile = useIsMobile();
  const utils = api.useUtils();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "">("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [roleChangeTarget, setRoleChangeTarget] = useState<{
    user: User;
    newRole: Role;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const { data, isLoading, error } = api.admin.getUsers.useQuery({
    search: search || undefined,
    role: roleFilter || undefined,
    page,
    pageSize,
  });

  const updateRoleMutation = api.admin.updateUserRole.useMutation({
    onSuccess: async () => {
      await utils.admin.getUsers.invalidate();
      await utils.admin.getStats.invalidate();
      setRoleChangeTarget(null);
      setErrorMessage("");
    },
    onError: (err) => {
      setErrorMessage(err.message);
    },
  });

  const deleteUserMutation = api.admin.deleteUser.useMutation({
    onSuccess: async () => {
      await utils.admin.getUsers.invalidate();
      await utils.admin.getStats.invalidate();
      setDeleteTarget(null);
      setErrorMessage("");
    },
    onError: (err) => {
      setErrorMessage(err.message);
    },
  });

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  const handleRoleChange = (user: User, newRole: Role) => {
    if (newRole !== user.role) {
      setRoleChangeTarget({ user, newRole });
    }
  };

  const confirmRoleChange = () => {
    if (roleChangeTarget) {
      updateRoleMutation.mutate({
        userId: roleChangeTarget.user.id,
        role: roleChangeTarget.newRole,
      });
    }
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteUserMutation.mutate({ userId: deleteTarget.id });
    }
  };

  const inputStyle: React.CSSProperties = {
    background: "rgba(30,15,5,0.9)",
    border: "1px solid rgba(201,168,76,0.4)",
    color: "#e8d5a3",
    fontFamily: "'EB Garamond', 'Georgia', serif",
    borderRadius: "6px",
    padding: "10px 14px",
    fontSize: "13px",
    outline: "none",
  };

  return (
    <>
      <Head>
        <title>User Management — DnD Tool</title>
      </Head>

      {roleChangeTarget && (
        <ConfirmDialog
          title="Grant New Title"
          message={
            <>
              <p style={{ marginBottom: "8px" }}>
                You are about to change the role of{" "}
                <span style={{ color: "#c9a84c", fontWeight: "bold" }}>
                  {roleChangeTarget.user.username}
                </span>{" "}
                to:
              </p>
              <p
                style={{
                  padding: "10px 16px",
                  background: "rgba(201,168,76,0.1)",
                  border: "1px solid rgba(201,168,76,0.3)",
                  borderRadius: "6px",
                  color: ROLE_COLORS[roleChangeTarget.newRole],
                  fontWeight: "bold",
                  fontSize: "15px",
                }}
              >
                {ROLE_LABELS[roleChangeTarget.newRole]}
              </p>
            </>
          }
          confirmLabel="Grant Title"
          onConfirm={confirmRoleChange}
          onCancel={() => setRoleChangeTarget(null)}
          isLoading={updateRoleMutation.isPending}
          loadingLabel="Bestowing..."
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Banish From Realm"
          message={
            <p>
              Are you sure you want to banish{" "}
              <span style={{ color: "#c9a84c", fontWeight: "bold" }}>
                {deleteTarget.username}
              </span>{" "}
              from the realm? This cannot be undone.
            </p>
          }
          confirmLabel="Banish Forever"
          confirmStyle={{
            background: "linear-gradient(135deg, #8b2a1e, #e74c3c)",
            color: "#fff",
          }}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          isLoading={deleteUserMutation.isPending}
          loadingLabel="Banishing..."
        />
      )}

      <div style={{ maxWidth: "1000px" }}>
        <h1
          style={{
            color: "#c9a84c",
            fontSize: isMobile ? "20px" : "26px",
            fontWeight: "bold",
            letterSpacing: "2px",
            textTransform: "uppercase",
            marginBottom: "8px",
            fontFamily: "'EB Garamond', 'Georgia', serif",
          }}
        >
          User Management
        </h1>
        <p
          style={{
            color: "#a89060",
            fontSize: "14px",
            marginBottom: "32px",
            fontFamily: "'EB Garamond', 'Georgia', serif",
          }}
        >
          Every soul that walks these halls
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

        {errorMessage && (
          <div
            style={{
              background: "rgba(139,42,30,0.2)",
              border: "1px solid #8b2a1e",
              borderRadius: "8px",
              padding: "12px 16px",
              color: "#e74c3c",
              fontSize: "13px",
              marginBottom: "20px",
              fontFamily: "'EB Garamond', 'Georgia', serif",
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Search & Filter Row */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >
          <input
            type="text"
            placeholder="Search by username..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ ...inputStyle, flex: 1, minWidth: "180px" }}
          />
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as Role | "");
              setPage(1);
            }}
            style={{ ...inputStyle, minWidth: "160px", cursor: "pointer" }}
          >
            <option value="">All Roles</option>
            <option value="PLAYER">Player</option>
            <option value="DUNGEON_MASTER">Dungeon Master</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>

        {isLoading && (
          <p
            style={{
              color: "#a89060",
              fontSize: "14px",
              fontFamily: "'EB Garamond', 'Georgia', serif",
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
              fontFamily: "'EB Garamond', 'Georgia', serif",
            }}
          >
            A dark magic has disrupted the records.
          </p>
        )}

        {!isLoading && !error && data && (
          <>
            {/* Desktop Table */}
            {!isMobile && (
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
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontFamily: "'EB Garamond', 'Georgia', serif",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1px solid rgba(201,168,76,0.3)",
                      }}
                    >
                      {[
                        "Username",
                        "Role",
                        "Characters",
                        "Adventures",
                        "Dice Rolls",
                        "Joined",
                        "Actions",
                      ].map((header) => (
                        <th
                          key={header}
                          style={{
                            padding: "14px 16px",
                            textAlign: "left",
                            color: "#a89060",
                            fontSize: "11px",
                            fontWeight: "bold",
                            letterSpacing: "1px",
                            textTransform: "uppercase",
                          }}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.users.map((user, index) => (
                      <tr
                        key={user.id}
                        style={{
                          borderBottom:
                            index < data.users.length - 1
                              ? "1px solid rgba(201,168,76,0.1)"
                              : "none",
                        }}
                      >
                        <td
                          style={{
                            padding: "14px 16px",
                            color: "#e8d5a3",
                            fontSize: "14px",
                            fontWeight: "bold",
                          }}
                        >
                          {user.username}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <RoleBadge role={user.role as Role} />
                        </td>
                        <td
                          style={{
                            padding: "14px 16px",
                            color: "#e8d5a3",
                            fontSize: "13px",
                          }}
                        >
                          {user._count.characters}
                        </td>
                        <td
                          style={{
                            padding: "14px 16px",
                            color: "#e8d5a3",
                            fontSize: "13px",
                          }}
                        >
                          {user._count.adventures}
                        </td>
                        <td
                          style={{
                            padding: "14px 16px",
                            color: "#e8d5a3",
                            fontSize: "13px",
                          }}
                        >
                          {user._count.diceRolls}
                        </td>
                        <td
                          style={{
                            padding: "14px 16px",
                            color: "#a89060",
                            fontSize: "12px",
                          }}
                        >
                          {new Date(user.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              alignItems: "center",
                            }}
                          >
                            <select
                              value={user.role}
                              onChange={(e) =>
                                handleRoleChange(
                                  user as User,
                                  e.target.value as Role
                                )
                              }
                              style={{
                                ...inputStyle,
                                padding: "6px 8px",
                                fontSize: "11px",
                                cursor: "pointer",
                              }}
                            >
                              <option value="PLAYER">Player</option>
                              <option value="DUNGEON_MASTER">
                                Dungeon Master
                              </option>
                              <option value="ADMIN">Admin</option>
                            </select>
                            <button
                              onClick={() => setDeleteTarget(user as User)}
                              style={{
                                background: "transparent",
                                border: "1px solid rgba(231,76,60,0.5)",
                                color: "#e74c3c",
                                borderRadius: "4px",
                                padding: "6px 12px",
                                fontSize: "11px",
                                fontFamily: "'EB Garamond', 'Georgia', serif",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                              }}
                            >
                              Banish
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Mobile Card List */}
            {isMobile && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {data.users.map((user) => (
                  <div
                    key={user.id}
                    style={{
                      background: "rgba(0,0,0,0.4)",
                      border: "1px solid rgba(201,168,76,0.2)",
                      borderRadius: "12px",
                      padding: "18px",
                      fontFamily: "'EB Garamond', 'Georgia', serif",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "12px",
                      }}
                    >
                      <span
                        style={{
                          color: "#e8d5a3",
                          fontSize: "15px",
                          fontWeight: "bold",
                        }}
                      >
                        {user.username}
                      </span>
                      <RoleBadge role={user.role as Role} />
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: "8px",
                        marginBottom: "12px",
                      }}
                    >
                      <div style={{ textAlign: "center" }}>
                        <div
                          style={{
                            color: "#c9a84c",
                            fontSize: "16px",
                            fontWeight: "bold",
                          }}
                        >
                          {user._count.characters}
                        </div>
                        <div style={{ color: "#a89060", fontSize: "10px" }}>
                          Characters
                        </div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div
                          style={{
                            color: "#c9a84c",
                            fontSize: "16px",
                            fontWeight: "bold",
                          }}
                        >
                          {user._count.adventures}
                        </div>
                        <div style={{ color: "#a89060", fontSize: "10px" }}>
                          Adventures
                        </div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div
                          style={{
                            color: "#c9a84c",
                            fontSize: "16px",
                            fontWeight: "bold",
                          }}
                        >
                          {user._count.diceRolls}
                        </div>
                        <div style={{ color: "#a89060", fontSize: "10px" }}>
                          Dice Rolls
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        color: "#a89060",
                        fontSize: "11px",
                        marginBottom: "12px",
                      }}
                    >
                      Joined:{" "}
                      {new Date(user.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                      }}
                    >
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleRoleChange(
                            user as User,
                            e.target.value as Role
                          )
                        }
                        style={{
                          ...inputStyle,
                          padding: "8px 10px",
                          fontSize: "12px",
                          flex: 1,
                          cursor: "pointer",
                        }}
                      >
                        <option value="PLAYER">Player</option>
                        <option value="DUNGEON_MASTER">Dungeon Master</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                      <button
                        onClick={() => setDeleteTarget(user as User)}
                        style={{
                          background: "transparent",
                          border: "1px solid rgba(231,76,60,0.5)",
                          color: "#e74c3c",
                          borderRadius: "4px",
                          padding: "8px 14px",
                          fontSize: "12px",
                          fontFamily: "'EB Garamond', 'Georgia', serif",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Banish
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "16px",
                  marginTop: "24px",
                  fontFamily: "'EB Garamond', 'Georgia', serif",
                }}
              >
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(201,168,76,0.5)",
                    color: "#c9a84c",
                    borderRadius: "4px",
                    padding: "8px 16px",
                    fontFamily: "'EB Garamond', 'Georgia', serif",
                    fontSize: "13px",
                    cursor: page === 1 ? "not-allowed" : "pointer",
                    opacity: page === 1 ? 0.4 : 1,
                  }}
                >
                  Previous
                </button>
                <span
                  style={{
                    color: "#a89060",
                    fontSize: "13px",
                  }}
                >
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(201,168,76,0.5)",
                    color: "#c9a84c",
                    borderRadius: "4px",
                    padding: "8px 16px",
                    fontFamily: "'EB Garamond', 'Georgia', serif",
                    fontSize: "13px",
                    cursor: page === totalPages ? "not-allowed" : "pointer",
                    opacity: page === totalPages ? 0.4 : 1,
                  }}
                >
                  Next
                </button>
              </div>
            )}

            {data.users.length === 0 && (
              <div
                style={{
                  background: "rgba(0,0,0,0.4)",
                  border: "1px solid rgba(201,168,76,0.2)",
                  borderRadius: "12px",
                  padding: "40px",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    color: "#a89060",
                    fontSize: "14px",
                    fontFamily: "'EB Garamond', 'Georgia', serif",
                  }}
                >
                  No adventurers found matching your search.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default function UserManagementPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <UserManagementContent />
      </Layout>
    </ProtectedRoute>
  );
}
