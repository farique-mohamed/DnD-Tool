import Head from "next/head";
import { useState, useMemo } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { useIsMobile } from "@/hooks/useIsMobile";
import { VEHICLES, VEHICLE_SOURCES, stripTags, type VehicleInfo } from "@/lib/vehicleData";
import { getVehicleTokenUrl } from "@/lib/imageUtils";
import { EntityImage } from "@/components/ui/EntityImage";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GOLD = "#c9a84c";
const GOLD_MUTED = "#a89060";
const GOLD_BRIGHT = "#e8d5a3";
const GOLD_DIM = "rgba(201,168,76,0.15)";
const GOLD_BORDER = "rgba(201,168,76,0.25)";
const TEXT_DIM = "rgba(232,213,163,0.6)";
const SERIF = "'Georgia', 'Times New Roman', serif";

// ---------------------------------------------------------------------------
// Source badge color helper
// ---------------------------------------------------------------------------

const SOURCE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  PHB: { bg: "rgba(74,144,217,0.1)", border: "rgba(74,144,217,0.35)", text: "#7ab4e0" },
  XPHB: { bg: "rgba(46,204,113,0.1)", border: "rgba(46,204,113,0.35)", text: "#6dd5a0" },
  DMG: { bg: "rgba(155,89,182,0.1)", border: "rgba(155,89,182,0.35)", text: "#bb8fd9" },
  XDMG: { bg: "rgba(155,89,182,0.1)", border: "rgba(155,89,182,0.35)", text: "#bb8fd9" },
  AAG: { bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.35)", text: "#9597f5" },
  AI: { bg: "rgba(132,204,22,0.1)", border: "rgba(132,204,22,0.35)", text: "#a3d95c" },
  GoS: { bg: "rgba(52,152,219,0.1)", border: "rgba(52,152,219,0.35)", text: "#7cbde8" },
  BGDIA: { bg: "rgba(231,76,60,0.1)", border: "rgba(231,76,60,0.35)", text: "#e8887d" },
  MTF: { bg: "rgba(230,126,34,0.1)", border: "rgba(230,126,34,0.35)", text: "#e8a76d" },
  EFA: { bg: "rgba(14,165,233,0.1)", border: "rgba(14,165,233,0.35)", text: "#5dc4f0" },
};

function sourceColor(source: string) {
  return SOURCE_COLORS[source] ?? { bg: GOLD_DIM, border: GOLD_BORDER, text: GOLD_MUTED };
}

// ---------------------------------------------------------------------------
// Entry rendering helpers
// ---------------------------------------------------------------------------

function renderTextEntry(text: string, key: string | number) {
  return (
    <p
      key={key}
      style={{
        color: TEXT_DIM,
        fontSize: "13px",
        fontFamily: SERIF,
        lineHeight: "1.7",
        margin: "0 0 8px 0",
        whiteSpace: "pre-wrap",
      }}
    >
      {stripTags(text)}
    </p>
  );
}

function renderEntries(entries: unknown[], depth = 0): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];

  entries.forEach((entry, i) => {
    if (typeof entry === "string") {
      nodes.push(renderTextEntry(entry, `s-${depth}-${i}`));
      return;
    }

    if (entry && typeof entry === "object") {
      const obj = entry as Record<string, unknown>;

      // Entries block (heading + nested entries)
      if (obj.type === "entries" && Array.isArray(obj.entries)) {
        nodes.push(
          <div key={`e-${depth}-${i}`} style={{ marginBottom: "12px" }}>
            {typeof obj.name === "string" && (
              <h4
                style={{
                  color: GOLD_BRIGHT,
                  fontSize: depth === 0 ? "14px" : "13px",
                  fontWeight: "bold",
                  fontFamily: SERIF,
                  margin: "0 0 4px 0",
                }}
              >
                {stripTags(obj.name)}
              </h4>
            )}
            {renderEntries(obj.entries as unknown[], depth + 1)}
          </div>,
        );
        return;
      }

      // Table
      if (obj.type === "table") {
        const colLabels = (obj.colLabels ?? []) as string[];
        const rows = (obj.rows ?? []) as string[][];
        nodes.push(
          <div key={`t-${depth}-${i}`} style={{ marginBottom: "12px", overflowX: "auto" }}>
            {typeof obj.caption === "string" && (
              <div
                style={{
                  color: GOLD,
                  fontSize: "12px",
                  fontFamily: SERIF,
                  fontWeight: "bold",
                  marginBottom: "6px",
                }}
              >
                {stripTags(obj.caption)}
              </div>
            )}
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "12px",
                fontFamily: SERIF,
              }}
            >
              {colLabels.length > 0 && (
                <thead>
                  <tr>
                    {colLabels.map((col, ci) => (
                      <th
                        key={ci}
                        style={{
                          textAlign: "left",
                          padding: "6px 8px",
                          borderBottom: `1px solid ${GOLD_BORDER}`,
                          color: GOLD,
                          fontWeight: "bold",
                          fontSize: "11px",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {stripTags(col)}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        style={{
                          padding: "5px 8px",
                          borderBottom: `1px solid ${GOLD_BORDER}`,
                          color: TEXT_DIM,
                          verticalAlign: "top",
                        }}
                      >
                        {stripTags(typeof cell === "string" ? cell : JSON.stringify(cell))}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>,
        );
        return;
      }

      // List
      if (obj.type === "list" && Array.isArray(obj.items)) {
        nodes.push(
          <ul
            key={`l-${depth}-${i}`}
            style={{
              color: TEXT_DIM,
              fontSize: "13px",
              fontFamily: SERIF,
              lineHeight: "1.7",
              margin: "0 0 8px 0",
              paddingLeft: "20px",
            }}
          >
            {(obj.items as unknown[]).map((item, li) => {
              if (typeof item === "string") {
                return <li key={li}>{stripTags(item)}</li>;
              }
              if (item && typeof item === "object") {
                const itemObj = item as Record<string, unknown>;
                if (itemObj.name && itemObj.entry) {
                  return (
                    <li key={li}>
                      <strong style={{ color: GOLD_BRIGHT }}>{stripTags(String(itemObj.name))}.</strong>{" "}
                      {stripTags(String(itemObj.entry))}
                    </li>
                  );
                }
                if (itemObj.entries && Array.isArray(itemObj.entries)) {
                  return <li key={li}>{renderEntries(itemObj.entries as unknown[], depth + 1)}</li>;
                }
              }
              return null;
            })}
          </ul>,
        );
        return;
      }

      // Fallback: if object has entries array, render them
      if (Array.isArray(obj.entries)) {
        nodes.push(
          <div key={`f-${depth}-${i}`} style={{ marginBottom: "8px" }}>
            {typeof obj.name === "string" && (
              <h4
                style={{
                  color: GOLD_BRIGHT,
                  fontSize: "13px",
                  fontWeight: "bold",
                  fontFamily: SERIF,
                  margin: "0 0 4px 0",
                }}
              >
                {stripTags(obj.name)}
              </h4>
            )}
            {renderEntries(obj.entries as unknown[], depth + 1)}
          </div>,
        );
      }
    }
  });

  return nodes;
}

// ---------------------------------------------------------------------------
// Vehicle list row
// ---------------------------------------------------------------------------

function VehicleRow({
  vehicle,
  isActive,
  onClick,
}: {
  vehicle: VehicleInfo;
  isActive: boolean;
  onClick: () => void;
}) {
  const sc = sourceColor(vehicle.source);

  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "10px 14px",
        background: isActive ? "rgba(201,168,76,0.1)" : "transparent",
        border: "none",
        borderLeft: isActive ? `3px solid ${GOLD}` : "3px solid transparent",
        borderBottom: `1px solid ${GOLD_BORDER}`,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        transition: "background 0.12s",
        fontFamily: SERIF,
      }}
      onMouseEnter={(e) => {
        if (!isActive)
          (e.currentTarget as HTMLButtonElement).style.background =
            "rgba(201,168,76,0.06)";
      }}
      onMouseLeave={(e) => {
        if (!isActive)
          (e.currentTarget as HTMLButtonElement).style.background =
            "transparent";
      }}
    >
      {/* Name + source badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
        <span
          style={{
            color: isActive ? GOLD : GOLD_BRIGHT,
            fontSize: "13px",
            fontFamily: SERIF,
            fontWeight: isActive ? "bold" : "normal",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            flex: 1,
            minWidth: 0,
          }}
        >
          {vehicle.name}
        </span>
        <span
          style={{
            flexShrink: 0,
            background: sc.bg,
            border: `1px solid ${sc.border}`,
            borderRadius: "3px",
            padding: "0px 5px",
            color: sc.text,
            fontSize: "10px",
            fontFamily: SERIF,
            letterSpacing: "0.3px",
          }}
        >
          {vehicle.source}
        </span>
      </div>

      {/* Type + terrain summary */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "nowrap", overflow: "hidden" }}>
        <span style={{ color: TEXT_DIM, fontSize: "10px", fontFamily: SERIF, flexShrink: 0 }}>
          {vehicle.vehicleType}
        </span>
        {vehicle.terrain.length > 0 && (
          <span
            style={{
              color: GOLD_MUTED,
              fontSize: "10px",
              fontFamily: SERIF,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {vehicle.terrain.join(", ")}
          </span>
        )}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Vehicle detail panel
// ---------------------------------------------------------------------------

function VehicleDetailPanel({
  vehicle,
  isMobile,
  onBack,
}: {
  vehicle: VehicleInfo;
  isMobile?: boolean;
  onBack?: () => void;
}) {
  const sc = sourceColor(vehicle.source);

  const metaRows: Array<{ label: string; value: string }> = [
    { label: "Type", value: vehicle.vehicleType },
    { label: "Size", value: vehicle.dimensions ? `${vehicle.size} (${vehicle.dimensions})` : vehicle.size },
    { label: "Terrain", value: vehicle.terrain.length > 0 ? vehicle.terrain.join(", ") : "—" },
    { label: "Crew", value: String(vehicle.crew) },
    { label: "Passengers", value: String(vehicle.passengers) },
  ];

  if (vehicle.cargo) metaRows.push({ label: "Cargo", value: vehicle.cargo });
  if (vehicle.cost) metaRows.push({ label: "Cost", value: vehicle.cost });
  if (vehicle.pace) metaRows.push({ label: "Travel Pace", value: vehicle.pace });

  metaRows.push({ label: "Speed", value: vehicle.speed });

  if (vehicle.ac > 0) {
    metaRows.push({ label: "AC", value: vehicle.acFrom ? `${vehicle.ac} (${vehicle.acFrom})` : String(vehicle.ac) });
  }
  if (vehicle.hp > 0) metaRows.push({ label: "HP", value: String(vehicle.hp) });
  if (vehicle.damageThreshold) metaRows.push({ label: "Damage Threshold", value: String(vehicle.damageThreshold) });
  if (vehicle.immunities.length > 0) {
    metaRows.push({ label: "Immunities", value: vehicle.immunities.join(", ") });
  }
  metaRows.push({ label: "Source", value: vehicle.source });

  return (
    <div
      style={{
        flex: 2,
        background: "rgba(0,0,0,0.6)",
        border: `2px solid ${GOLD}`,
        borderRadius: "12px",
        boxShadow:
          "0 0 40px rgba(201,168,76,0.3), inset 0 0 60px rgba(0,0,0,0.5)",
        padding: isMobile ? "20px 16px" : "32px 36px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        minWidth: 0,
        minHeight: 0,
        height: "100%",
        overflowY: "auto",
        boxSizing: "border-box",
      }}
    >
      {/* Back button (mobile only) */}
      {isMobile && onBack && (
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: `1px solid ${GOLD_BORDER}`,
            borderRadius: "6px",
            padding: "6px 14px",
            color: GOLD,
            fontSize: "12px",
            fontFamily: SERIF,
            cursor: "pointer",
            alignSelf: "flex-start",
            letterSpacing: "0.5px",
          }}
        >
          &larr; Back to list
        </button>
      )}

      {/* Header */}
      <div>
        <h2
          style={{
            color: GOLD,
            fontSize: "26px",
            fontWeight: "bold",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            fontFamily: SERIF,
            margin: 0,
            marginBottom: "6px",
          }}
        >
          {vehicle.name}
        </h2>
        <p
          style={{
            color: GOLD_MUTED,
            fontSize: "13px",
            fontFamily: SERIF,
            fontStyle: "italic",
            margin: 0,
          }}
        >
          {vehicle.size} vehicle{vehicle.dimensions ? ` (${vehicle.dimensions})` : ""} &middot; {vehicle.vehicleType}
        </p>
      </div>

      {/* Badges */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <span
          style={{
            background: sc.bg,
            border: `1px solid ${sc.border}`,
            borderRadius: "6px",
            padding: "4px 12px",
            color: sc.text,
            fontSize: "12px",
            fontFamily: SERIF,
            fontWeight: "bold",
          }}
        >
          {vehicle.source}
        </span>
        <span
          style={{
            background: GOLD_DIM,
            border: `1px solid ${GOLD_BORDER}`,
            borderRadius: "6px",
            padding: "4px 12px",
            color: GOLD_MUTED,
            fontSize: "12px",
            fontFamily: SERIF,
          }}
        >
          {vehicle.vehicleType}
        </span>
        {vehicle.terrain.length > 0 && (
          <span
            style={{
              background: GOLD_DIM,
              border: `1px solid ${GOLD_BORDER}`,
              borderRadius: "6px",
              padding: "4px 12px",
              color: GOLD_MUTED,
              fontSize: "12px",
              fontFamily: SERIF,
            }}
          >
            {vehicle.terrain.join(", ")}
          </span>
        )}
      </div>

      {/* Vehicle image */}
      <EntityImage
        src={getVehicleTokenUrl(vehicle.name, vehicle.source)}
        alt={vehicle.name}
        width={isMobile ? "100%" : 280}
        style={{ alignSelf: "center" }}
      />

      {/* Gradient divider */}
      <div
        style={{
          height: "1px",
          background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
          opacity: 0.5,
        }}
      />

      {/* Meta stats */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {metaRows.map(({ label, value }) => (
          <div
            key={label}
            style={{ display: "flex", gap: "8px", alignItems: "baseline" }}
          >
            <span
              style={{
                color: GOLD,
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "1.2px",
                fontFamily: SERIF,
                minWidth: "96px",
                flexShrink: 0,
              }}
            >
              {label}
            </span>
            <span
              style={{
                color: GOLD_BRIGHT,
                fontSize: "13px",
                fontFamily: SERIF,
                lineHeight: "1.5",
              }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Gradient divider */}
      <div
        style={{
          height: "1px",
          background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
          opacity: 0.5,
        }}
      />

      {/* Weapons */}
      {vehicle.weapons.length > 0 && (
        <div>
          <div
            style={{
              color: GOLD,
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "1.2px",
              fontFamily: SERIF,
              marginBottom: "12px",
            }}
          >
            Weapons
          </div>
          {vehicle.weapons.map((w, wi) => (
            <div
              key={wi}
              style={{
                marginBottom: "16px",
                background: "rgba(201,168,76,0.04)",
                border: `1px solid ${GOLD_BORDER}`,
                borderRadius: "8px",
                padding: "12px 16px",
              }}
            >
              <h4
                style={{
                  color: GOLD_BRIGHT,
                  fontSize: "14px",
                  fontWeight: "bold",
                  fontFamily: SERIF,
                  margin: "0 0 8px 0",
                }}
              >
                {w.count > 1 ? `${w.count} ` : ""}{w.name}{w.crew ? ` (Crew: ${w.crew}${w.count > 1 ? " each" : ""})` : ""}
              </h4>
              {/* Weapon stats */}
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "8px" }}>
                {w.ac != null && (
                  <span style={{ color: GOLD_MUTED, fontSize: "12px", fontFamily: SERIF }}>
                    AC: {w.ac}
                  </span>
                )}
                {w.hp != null && (
                  <span style={{ color: GOLD_MUTED, fontSize: "12px", fontFamily: SERIF }}>
                    HP: {w.hp}
                  </span>
                )}
                {w.costs.length > 0 && (
                  <span style={{ color: GOLD_MUTED, fontSize: "12px", fontFamily: SERIF }}>
                    Cost: {w.costs.join(", ")}
                  </span>
                )}
              </div>
              {/* Weapon description entries */}
              {w.entries.map((entry, ei) => (
                <p
                  key={`e-${ei}`}
                  style={{
                    color: TEXT_DIM,
                    fontSize: "13px",
                    fontFamily: SERIF,
                    lineHeight: "1.7",
                    margin: "0 0 4px 0",
                  }}
                >
                  {entry}
                </p>
              ))}
              {/* Weapon actions (attacks) */}
              {w.actions.map((action, ai) => (
                <div key={`a-${ai}`} style={{ marginTop: "6px" }}>
                  <span
                    style={{
                      color: GOLD_BRIGHT,
                      fontSize: "13px",
                      fontWeight: "bold",
                      fontFamily: SERIF,
                    }}
                  >
                    {action.name}.
                  </span>{" "}
                  {action.entries.map((ae, aei) => (
                    <span
                      key={aei}
                      style={{
                        color: TEXT_DIM,
                        fontSize: "13px",
                        fontFamily: SERIF,
                        lineHeight: "1.7",
                      }}
                    >
                      {ae}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Description / Entries */}
      {vehicle.entries.length > 0 && (
        <div>
          <div
            style={{
              color: GOLD,
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "1.2px",
              fontFamily: SERIF,
              marginBottom: "12px",
            }}
          >
            Description
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {renderEntries(vehicle.entries)}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty detail placeholder
// ---------------------------------------------------------------------------

function VehicleDetailEmpty({ isMobile }: { isMobile?: boolean }) {
  return (
    <div
      style={{
        flex: 2,
        background: "rgba(0,0,0,0.4)",
        border: `1px solid ${GOLD_BORDER}`,
        borderRadius: "12px",
        display: isMobile ? "none" : "flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: 0,
        minHeight: 0,
      }}
    >
      <p
        style={{
          color: GOLD_MUTED,
          fontSize: "14px",
          fontFamily: SERIF,
          fontStyle: "italic",
        }}
      >
        Select a vehicle to view its details.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page content
// ---------------------------------------------------------------------------

function VehiclesContent() {
  const isMobile = useIsMobile();
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleInfo | null>(null);

  const filteredVehicles = useMemo(() => {
    return VEHICLES.filter((vehicle) => {
      if (selectedSource && vehicle.source !== selectedSource) return false;
      if (searchQuery && !vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()))
        return false;
      return true;
    });
  }, [selectedSource, searchQuery]);

  return (
    <>
      <Head>
        <title>Vehicle Compendium — DnD Tool</title>
      </Head>

      {/* Outer wrapper fills viewport height minus Layout padding */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: isMobile ? "calc(100vh - 48px)" : "calc(100vh - 80px)",
          overflow: "hidden",
        }}
      >
        {/* Page header */}
        <div style={{ marginBottom: "20px", flexShrink: 0 }}>
          <h1
            style={{
              color: GOLD,
              fontSize: isMobile ? "20px" : "26px",
              fontWeight: "bold",
              letterSpacing: "2px",
              textTransform: "uppercase",
              marginBottom: "8px",
              fontFamily: SERIF,
            }}
          >
            Vehicle Compendium
          </h1>
          <p
            style={{
              color: GOLD_MUTED,
              fontSize: "14px",
              marginBottom: "12px",
              fontFamily: SERIF,
            }}
          >
            Browse and discover vehicles, ships, and war machines.
          </p>
          <div
            style={{
              width: "80px",
              height: "2px",
              background: GOLD,
              opacity: 0.6,
            }}
          />
        </div>

        {/* Two-column layout: list | detail */}
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: "24px",
            flex: 1,
            overflow: isMobile ? "auto" : "hidden",
            minHeight: 0,
          }}
        >
          {/* Left column: filters + vehicle list */}
          <div
            style={{
              flex: 3,
              minWidth: 0,
              display: isMobile && selectedVehicle ? "none" : "flex",
              flexDirection: "column",
              gap: "10px",
              height: isMobile ? "auto" : "100%",
              overflow: isMobile ? "visible" : "hidden",
            }}
          >
            {/* Search */}
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "rgba(30,15,5,0.9)",
                border: "1px solid rgba(201,168,76,0.4)",
                borderRadius: "6px",
                color: GOLD_BRIGHT,
                fontSize: "13px",
                fontFamily: SERIF,
                outline: "none",
                boxSizing: "border-box",
              }}
            />

            {/* Filter dropdowns row */}
            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: "8px",
                flexShrink: 0,
              }}
            >
              {/* Source filter */}
              <select
                value={selectedSource ?? ""}
                onChange={(e) => setSelectedSource(e.target.value || null)}
                style={{
                  flex: 1,
                  background: "rgba(30,15,5,0.9)",
                  border: "1px solid rgba(201,168,76,0.4)",
                  borderRadius: "6px",
                  padding: "8px 10px",
                  color: GOLD_BRIGHT,
                  fontSize: "12px",
                  fontFamily: SERIF,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="">All Sources</option>
                {VEHICLE_SOURCES.map((src) => (
                  <option key={src} value={src} style={{ background: "#1a0e05" }}>
                    {src}
                  </option>
                ))}
              </select>
            </div>

            {/* Results count */}
            <div
              style={{
                color: GOLD_MUTED,
                fontSize: "11px",
                fontFamily: SERIF,
                textAlign: "right",
                flexShrink: 0,
              }}
            >
              {filteredVehicles.length} vehicle{filteredVehicles.length !== 1 ? "s" : ""}
            </div>

            {/* Scrollable vehicle list */}
            <div
              style={{
                background: "rgba(0,0,0,0.5)",
                border: `1px solid ${GOLD_BORDER}`,
                borderRadius: "8px",
                overflow: "hidden",
                flex: 1,
                overflowY: "auto",
                minHeight: 0,
                ...(isMobile ? { maxHeight: "50vh" } : {}),
              }}
            >
              {filteredVehicles.length === 0 ? (
                <div style={{ padding: "24px 16px", textAlign: "center" }}>
                  <p
                    style={{
                      color: GOLD_MUTED,
                      fontSize: "13px",
                      fontFamily: SERIF,
                    }}
                  >
                    No vehicles match your filters.
                  </p>
                </div>
              ) : (
                filteredVehicles.map((vehicle) => (
                  <VehicleRow
                    key={`${vehicle.name}|${vehicle.source}`}
                    vehicle={vehicle}
                    isActive={
                      selectedVehicle?.name === vehicle.name &&
                      selectedVehicle?.source === vehicle.source
                    }
                    onClick={() => setSelectedVehicle(vehicle)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Right column: vehicle detail */}
          {selectedVehicle ? (
            <VehicleDetailPanel
              vehicle={selectedVehicle}
              isMobile={isMobile}
              onBack={() => setSelectedVehicle(null)}
            />
          ) : (
            <VehicleDetailEmpty isMobile={isMobile} />
          )}
        </div>
      </div>
    </>
  );
}

export default function VehiclesPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <VehiclesContent />
      </Layout>
    </ProtectedRoute>
  );
}
