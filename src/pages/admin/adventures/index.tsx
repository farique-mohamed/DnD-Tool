import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { api } from "@/utils/api";
import { useIsMobile } from "@/hooks/useIsMobile";

function SourceBadge({ source }: { source: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "4px",
        fontSize: "10px",
        fontWeight: "bold",
        fontFamily: "'EB Garamond', 'Georgia', serif",
        letterSpacing: "0.5px",
        color: "#e8d5a3",
        background: "rgba(201,168,76,0.15)",
        border: "1px solid rgba(201,168,76,0.3)",
        textTransform: "uppercase",
      }}
    >
      {source}
    </span>
  );
}

function AdventureOversightContent() {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading, error } = api.admin.getAdventures.useQuery({
    search: search || undefined,
    page,
    pageSize,
  });

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

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
        <title>Adventure Oversight — DnD Tool</title>
      </Head>

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
          Adventure Oversight
        </h1>
        <p
          style={{
            color: "#a89060",
            fontSize: "14px",
            marginBottom: "32px",
            fontFamily: "'EB Garamond', 'Georgia', serif",
          }}
        >
          Monitor all quests across the realm
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

        {/* Search */}
        <div style={{ marginBottom: "24px" }}>
          <input
            type="text"
            placeholder="Search by adventure name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ ...inputStyle, width: "100%", maxWidth: "400px" }}
          />
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
                        "Adventure",
                        "Source",
                        "DM",
                        "Players",
                        "Monsters",
                        "Items",
                        "Encounter",
                        "Created",
                      ].map((header) => (
                        <th
                          key={header}
                          style={{
                            padding: "14px 14px",
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
                    {data.adventures.map((adventure, index) => (
                      <tr
                        key={adventure.id}
                        style={{
                          borderBottom:
                            index < data.adventures.length - 1
                              ? "1px solid rgba(201,168,76,0.1)"
                              : "none",
                        }}
                      >
                        <td
                          style={{
                            padding: "14px 14px",
                            fontSize: "14px",
                          }}
                        >
                          <Link
                            href={`/adventures/${adventure.id}`}
                            style={{
                              color: "#e8d5a3",
                              textDecoration: "none",
                              fontWeight: "bold",
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLAnchorElement).style.color =
                                "#c9a84c";
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLAnchorElement).style.color =
                                "#e8d5a3";
                            }}
                          >
                            {adventure.name}
                          </Link>
                        </td>
                        <td style={{ padding: "14px 14px" }}>
                          <SourceBadge source={adventure.source} />
                        </td>
                        <td
                          style={{
                            padding: "14px 14px",
                            color: "#c9a84c",
                            fontSize: "13px",
                          }}
                        >
                          {adventure.user.username}
                        </td>
                        <td
                          style={{
                            padding: "14px 14px",
                            color: "#e8d5a3",
                            fontSize: "13px",
                          }}
                        >
                          {adventure._count.players}
                        </td>
                        <td
                          style={{
                            padding: "14px 14px",
                            color: "#e8d5a3",
                            fontSize: "13px",
                          }}
                        >
                          {adventure._count.monsters}
                        </td>
                        <td
                          style={{
                            padding: "14px 14px",
                            color: "#e8d5a3",
                            fontSize: "13px",
                          }}
                        >
                          {adventure._count.items}
                        </td>
                        <td
                          style={{
                            padding: "14px 14px",
                            fontSize: "12px",
                          }}
                        >
                          {adventure.encounter ? (
                            <span style={{ color: "#2ecc71" }}>
                              Round {adventure.encounter.round}
                            </span>
                          ) : (
                            <span style={{ color: "#a89060" }}>None</span>
                          )}
                        </td>
                        <td
                          style={{
                            padding: "14px 14px",
                            color: "#a89060",
                            fontSize: "12px",
                          }}
                        >
                          {new Date(adventure.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Mobile Card List */}
            {isMobile && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {data.adventures.map((adventure) => (
                  <div
                    key={adventure.id}
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
                        marginBottom: "8px",
                      }}
                    >
                      <Link
                        href={`/adventures/${adventure.id}`}
                        style={{
                          color: "#e8d5a3",
                          textDecoration: "none",
                          fontWeight: "bold",
                          fontSize: "15px",
                        }}
                      >
                        {adventure.name}
                      </Link>
                      <SourceBadge source={adventure.source} />
                    </div>
                    <div
                      style={{
                        color: "#c9a84c",
                        fontSize: "12px",
                        marginBottom: "12px",
                      }}
                    >
                      DM: {adventure.user.username}
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
                          {adventure._count.players}
                        </div>
                        <div style={{ color: "#a89060", fontSize: "10px" }}>
                          Players
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
                          {adventure._count.monsters}
                        </div>
                        <div style={{ color: "#a89060", fontSize: "10px" }}>
                          Monsters
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
                          {adventure._count.items}
                        </div>
                        <div style={{ color: "#a89060", fontSize: "10px" }}>
                          Items
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ color: "#a89060", fontSize: "11px" }}>
                        {new Date(adventure.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </span>
                      {adventure.encounter ? (
                        <span
                          style={{
                            color: "#2ecc71",
                            fontSize: "11px",
                            fontWeight: "bold",
                          }}
                        >
                          Encounter: Round {adventure.encounter.round}
                        </span>
                      ) : (
                        <span style={{ color: "#a89060", fontSize: "11px" }}>
                          No Encounter
                        </span>
                      )}
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

            {data.adventures.length === 0 && (
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
                  No adventures found matching your search.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default function AdventureOversightPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <AdventureOversightContent />
      </Layout>
    </ProtectedRoute>
  );
}
