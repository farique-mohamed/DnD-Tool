import { useState, useMemo } from "react";
import { api } from "@/utils/api";
import {
  Card,
  Button,
  Modal,
  Input,
  Badge,
  Alert,
  GOLD,
  GOLD_BRIGHT,
  GOLD_MUTED,
  GOLD_DARK,
  DANGER_RED,
  SUCCESS_GREEN_BORDER,
  SERIF,
  INPUT_BG,
} from "@/components/ui";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatSessionDate(dateVal: string | Date): string {
  const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatSessionTime(dateVal: string | Date): string {
  const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h} hour${h > 1 ? "s" : ""}`;
}

function getStatusColor(status: string): string {
  switch (status) {
    case "SCHEDULED":
      return SUCCESS_GREEN_BORDER;
    case "COMPLETED":
      return GOLD;
    case "CANCELLED":
      return DANGER_RED;
    default:
      return GOLD_MUTED;
  }
}

/** Convert a Date (or ISO string) to the `datetime-local` input value format */
function toDatetimeLocalValue(dateVal: string | Date): string {
  const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SessionData {
  id: string;
  title: string;
  description?: string | null;
  scheduledAt: string | Date;
  duration?: number | null;
  location?: string | null;
  inGameDate?: string | null;
  status: string;
}

interface SessionFormData {
  title: string;
  scheduledAt: string;
  duration: string;
  location: string;
  inGameDate: string;
  description: string;
}

const EMPTY_FORM: SessionFormData = {
  title: "",
  scheduledAt: "",
  duration: "",
  location: "",
  inGameDate: "",
  description: "",
};

// ---------------------------------------------------------------------------
// Calendar Date Picker
// ---------------------------------------------------------------------------

const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function CalendarDatePicker({
  value,
  onChange,
}: {
  /** Selected date as YYYY-MM-DD string (or empty) */
  value: string;
  onChange: (dateStr: string) => void;
}) {
  const today = useMemo(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
  }, []);

  // Determine initial display month from value or today
  const initialDisplay = useMemo(() => {
    if (value) {
      const parts = value.split("-");
      return { year: parseInt(parts[0]!, 10), month: parseInt(parts[1]!, 10) - 1 };
    }
    return { year: today.year, month: today.month };
  }, []); // intentionally run once on mount

  const [displayYear, setDisplayYear] = useState(initialDisplay.year);
  const [displayMonth, setDisplayMonth] = useState(initialDisplay.month);

  // Parse selected date
  const selected = useMemo(() => {
    if (!value) return null;
    const parts = value.split("-");
    return {
      year: parseInt(parts[0]!, 10),
      month: parseInt(parts[1]!, 10) - 1,
      day: parseInt(parts[2]!, 10),
    };
  }, [value]);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(displayYear, displayMonth, 1).getDay();
    const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(displayYear, displayMonth, 0).getDate();

    const cells: { day: number; currentMonth: boolean }[] = [];

    // Previous month trailing days
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push({ day: daysInPrevMonth - i, currentMonth: false });
    }
    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, currentMonth: true });
    }
    // Next month leading days to fill the grid
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (let d = 1; d <= remaining; d++) {
        cells.push({ day: d, currentMonth: false });
      }
    }
    return cells;
  }, [displayYear, displayMonth]);

  const goPrevMonth = () => {
    if (displayMonth === 0) {
      setDisplayMonth(11);
      setDisplayYear((y) => y - 1);
    } else {
      setDisplayMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (displayMonth === 11) {
      setDisplayMonth(0);
      setDisplayYear((y) => y + 1);
    } else {
      setDisplayMonth((m) => m + 1);
    }
  };

  const handleDayClick = (day: number, currentMonth: boolean) => {
    if (!currentMonth) return;
    const mm = String(displayMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    onChange(`${displayYear}-${mm}-${dd}`);
  };

  const isToday = (day: number, currentMonth: boolean) =>
    currentMonth &&
    day === today.day &&
    displayMonth === today.month &&
    displayYear === today.year;

  const isSelected = (day: number, currentMonth: boolean) =>
    currentMonth &&
    selected !== null &&
    day === selected.day &&
    displayMonth === selected.month &&
    displayYear === selected.year;

  const navBtnStyle: React.CSSProperties = {
    background: "none",
    border: `1px solid ${GOLD_DARK}`,
    borderRadius: "4px",
    color: GOLD,
    fontFamily: SERIF,
    fontSize: "14px",
    cursor: "pointer",
    padding: "2px 8px",
    lineHeight: 1,
  };

  return (
    <div
      style={{
        background: INPUT_BG,
        border: `1px solid ${GOLD_DARK}`,
        borderRadius: "6px",
        padding: "10px",
      }}
    >
      {/* Month/Year header with nav */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px",
        }}
      >
        <button type="button" onClick={goPrevMonth} style={navBtnStyle}>
          &#9664;
        </button>
        <span
          style={{
            color: GOLD,
            fontFamily: SERIF,
            fontSize: "13px",
            fontWeight: "bold",
            letterSpacing: "0.5px",
          }}
        >
          {MONTH_NAMES[displayMonth]} {displayYear}
        </span>
        <button type="button" onClick={goNextMonth} style={navBtnStyle}>
          &#9654;
        </button>
      </div>

      {/* Day name headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            style={{
              textAlign: "center",
              color: GOLD_MUTED,
              fontFamily: SERIF,
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              padding: "4px 0",
            }}
          >
            {name}
          </div>
        ))}

        {/* Day cells */}
        {calendarDays.map((cell, idx) => {
          const todayMatch = isToday(cell.day, cell.currentMonth);
          const selectedMatch = isSelected(cell.day, cell.currentMonth);

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleDayClick(cell.day, cell.currentMonth)}
              disabled={!cell.currentMonth}
              style={{
                background: selectedMatch
                  ? `linear-gradient(135deg, ${GOLD_DARK}, ${GOLD})`
                  : "transparent",
                border: todayMatch && !selectedMatch
                  ? `1px solid ${GOLD}`
                  : "1px solid transparent",
                borderRadius: "4px",
                color: !cell.currentMonth
                  ? `${GOLD_DARK}`
                  : selectedMatch
                    ? "#1a0e04"
                    : GOLD_BRIGHT,
                fontFamily: SERIF,
                fontSize: "12px",
                fontWeight: selectedMatch || todayMatch ? "bold" : "normal",
                padding: "6px 0",
                textAlign: "center",
                cursor: cell.currentMonth ? "pointer" : "default",
                transition: "background 0.15s",
              }}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Session Form (used in create + edit modals)
// ---------------------------------------------------------------------------

function SessionForm({
  form,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  isLoading,
}: {
  form: SessionFormData;
  onChange: (f: SessionFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  isLoading: boolean;
}) {
  const labelStyle: React.CSSProperties = {
    display: "block",
    color: GOLD_MUTED,
    fontSize: "11px",
    fontFamily: SERIF,
    textTransform: "uppercase",
    letterSpacing: "0.8px",
    marginBottom: "4px",
  };

  const inputWrapStyle: React.CSSProperties = {
    marginBottom: "14px",
  };

  const textareaStyle: React.CSSProperties = {
    width: "100%",
    minHeight: "70px",
    background: INPUT_BG,
    border: `1px solid ${GOLD_DARK}`,
    borderRadius: "6px",
    color: GOLD_BRIGHT,
    fontFamily: SERIF,
    fontSize: "13px",
    padding: "8px 10px",
    resize: "vertical",
    outline: "none",
    boxSizing: "border-box",
  };

  return (
    <div>
      <div style={inputWrapStyle}>
        <label style={labelStyle}>Title *</label>
        <Input
          value={form.title}
          onChange={(e) => onChange({ ...form, title: e.target.value })}
          placeholder="e.g. Session 12: The Dragon's Lair"
          required
          style={{ width: "100%" }}
        />
      </div>

      <div style={inputWrapStyle}>
        <label style={labelStyle}>Date *</label>
        <CalendarDatePicker
          value={form.scheduledAt ? form.scheduledAt.split("T")[0]! : ""}
          onChange={(dateStr) => {
            const time = form.scheduledAt?.includes("T")
              ? form.scheduledAt.split("T")[1]!
              : "19:00";
            onChange({ ...form, scheduledAt: `${dateStr}T${time}` });
          }}
        />
      </div>

      <div style={inputWrapStyle}>
        <label style={labelStyle}>Time *</label>
        <input
          type="time"
          value={
            form.scheduledAt?.includes("T")
              ? form.scheduledAt.split("T")[1]!
              : ""
          }
          onChange={(e) => {
            const date = form.scheduledAt?.includes("T")
              ? form.scheduledAt.split("T")[0]!
              : "";
            if (date) {
              onChange({ ...form, scheduledAt: `${date}T${e.target.value}` });
            }
          }}
          required
          style={{
            width: "100%",
            background: INPUT_BG,
            border: `1px solid ${GOLD_DARK}`,
            borderRadius: "6px",
            color: GOLD_BRIGHT,
            fontFamily: SERIF,
            fontSize: "13px",
            padding: "8px 10px",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
        }}
      >
        <div style={inputWrapStyle}>
          <label style={labelStyle}>Duration (minutes)</label>
          <Input
            type="number"
            value={form.duration}
            onChange={(e) => onChange({ ...form, duration: e.target.value })}
            placeholder="e.g. 180"
            min="0"
            style={{ width: "100%" }}
          />
        </div>

        <div style={inputWrapStyle}>
          <label style={labelStyle}>Location</label>
          <Input
            value={form.location}
            onChange={(e) => onChange({ ...form, location: e.target.value })}
            placeholder="e.g. Discord, Roll20"
            style={{ width: "100%" }}
          />
        </div>
      </div>

      <div style={inputWrapStyle}>
        <label style={labelStyle}>In-Game Date</label>
        <Input
          value={form.inGameDate}
          onChange={(e) => onChange({ ...form, inGameDate: e.target.value })}
          placeholder="e.g. Day 45 of the Campaign"
          style={{ width: "100%" }}
        />
      </div>

      <div style={inputWrapStyle}>
        <label style={labelStyle}>Description</label>
        <textarea
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          placeholder="Optional notes about the session..."
          style={textareaStyle}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "10px",
          marginTop: "8px",
        }}
      >
        <Button variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={onSubmit}
          isLoading={isLoading}
          disabled={!form.title || !form.scheduledAt}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sessions Tab
// ---------------------------------------------------------------------------

interface SessionsTabProps {
  adventureId: string;
  isOwner: boolean;
}

export function SessionsTab({ adventureId, isOwner }: SessionsTabProps) {
  const utils = api.useUtils();

  // Data
  const { data: sessions = [], isLoading } =
    api.adventure.listSessions.useQuery({ adventureId });

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionData | null>(
    null,
  );
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [form, setForm] = useState<SessionFormData>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  // Mutations
  const createSession = api.adventure.createSession.useMutation({
    onSuccess: () => {
      void utils.adventure.listSessions.invalidate({ adventureId });
      void utils.adventure.getUpcomingSessions.invalidate();
      setShowCreateModal(false);
      setForm(EMPTY_FORM);
      setError(null);
    },
    onError: (err) => setError(err.message),
  });

  const updateSession = api.adventure.updateSession.useMutation({
    onSuccess: () => {
      void utils.adventure.listSessions.invalidate({ adventureId });
      void utils.adventure.getUpcomingSessions.invalidate();
      setEditingSession(null);
      setForm(EMPTY_FORM);
      setError(null);
    },
    onError: (err) => setError(err.message),
  });

  const updateSessionStatus = api.adventure.updateSessionStatus.useMutation({
    onSuccess: () => {
      void utils.adventure.listSessions.invalidate({ adventureId });
      void utils.adventure.getUpcomingSessions.invalidate();
    },
    onError: (err) => setError(err.message),
  });

  const deleteSession = api.adventure.deleteSession.useMutation({
    onSuccess: () => {
      void utils.adventure.listSessions.invalidate({ adventureId });
      void utils.adventure.getUpcomingSessions.invalidate();
      setDeleteConfirmId(null);
    },
    onError: (err) => setError(err.message),
  });

  // Handlers
  const handleOpenCreate = () => {
    setForm(EMPTY_FORM);
    setError(null);
    setShowCreateModal(true);
  };

  const handleCreate = () => {
    if (!form.title || !form.scheduledAt) return;
    createSession.mutate({
      adventureId,
      title: form.title,
      scheduledAt: new Date(form.scheduledAt),
      duration: form.duration ? parseInt(form.duration, 10) : undefined,
      location: form.location || undefined,
      inGameDate: form.inGameDate || undefined,
      description: form.description || undefined,
    });
  };

  const handleOpenEdit = (session: SessionData) => {
    setForm({
      title: session.title,
      scheduledAt: toDatetimeLocalValue(session.scheduledAt),
      duration: session.duration ? String(session.duration) : "",
      location: session.location ?? "",
      inGameDate: session.inGameDate ?? "",
      description: session.description ?? "",
    });
    setError(null);
    setEditingSession(session);
  };

  const handleUpdate = () => {
    if (!editingSession || !form.title || !form.scheduledAt) return;
    updateSession.mutate({
      sessionId: editingSession.id,
      title: form.title,
      scheduledAt: new Date(form.scheduledAt),
      duration: form.duration ? parseInt(form.duration, 10) : undefined,
      location: form.location || undefined,
      inGameDate: form.inGameDate || undefined,
      description: form.description || undefined,
    });
  };

  const handleStatusChange = (sessionId: string, status: string) => {
    updateSessionStatus.mutate({
      sessionId,
      status: status as "SCHEDULED" | "COMPLETED" | "CANCELLED",
    });
  };

  const handleDelete = (sessionId: string) => {
    deleteSession.mutate({ sessionId });
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div>
      {/* Header row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h3
          style={{
            color: GOLD,
            fontSize: "14px",
            fontWeight: "bold",
            fontFamily: SERIF,
            textTransform: "uppercase",
            letterSpacing: "1px",
            margin: 0,
          }}
        >
          Sessions
        </h3>
        {isOwner && (
          <Button variant="primary" size="sm" onClick={handleOpenCreate}>
            Schedule Session
          </Button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ marginBottom: "16px" }}>
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <p
          style={{
            color: GOLD_MUTED,
            fontSize: "13px",
            fontFamily: SERIF,
            textAlign: "center",
            padding: "24px 0",
          }}
        >
          Consulting the arcane records...
        </p>
      ) : (sessions as SessionData[]).length === 0 ? (
        <p
          style={{
            color: GOLD_MUTED,
            fontSize: "14px",
            fontFamily: SERIF,
            textAlign: "center",
            padding: "32px 0",
          }}
        >
          No sessions scheduled yet.
          {isOwner && ' Click "Schedule Session" to plan your next gathering.'}
        </p>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {(sessions as SessionData[]).map((session) => (
            <Card
              key={session.id}
              variant="light"
              style={{ padding: "16px 20px" }}
            >
              {/* Date and time */}
              <div
                style={{
                  color: GOLD_MUTED,
                  fontSize: "12px",
                  fontFamily: SERIF,
                  letterSpacing: "0.5px",
                  marginBottom: "6px",
                }}
              >
                {formatSessionDate(session.scheduledAt)} at{" "}
                {formatSessionTime(session.scheduledAt)}
              </div>

              {/* Title */}
              <div
                style={{
                  color: GOLD,
                  fontSize: "15px",
                  fontWeight: "bold",
                  fontFamily: SERIF,
                  marginBottom: "8px",
                }}
              >
                {session.title}
              </div>

              {/* Meta row */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom:
                    session.inGameDate || session.description ? "8px" : "0",
                }}
              >
                {session.duration && (
                  <span
                    style={{
                      color: GOLD_BRIGHT,
                      fontSize: "12px",
                      fontFamily: SERIF,
                    }}
                  >
                    Duration: {formatDuration(session.duration)}
                  </span>
                )}
                {session.location && (
                  <span
                    style={{
                      color: GOLD_BRIGHT,
                      fontSize: "12px",
                      fontFamily: SERIF,
                    }}
                  >
                    Location: {session.location}
                  </span>
                )}
                <Badge color={getStatusColor(session.status)}>
                  {session.status}
                </Badge>
              </div>

              {/* In-game date */}
              {session.inGameDate && (
                <div
                  style={{
                    color: GOLD_MUTED,
                    fontSize: "12px",
                    fontFamily: SERIF,
                    fontStyle: "italic",
                    marginBottom: session.description ? "6px" : "0",
                  }}
                >
                  In-game: {session.inGameDate}
                </div>
              )}

              {/* Description */}
              {session.description && (
                <div
                  style={{
                    color: GOLD_BRIGHT,
                    fontSize: "12px",
                    fontFamily: SERIF,
                    opacity: 0.8,
                    marginTop: "4px",
                  }}
                >
                  {session.description}
                </div>
              )}

              {/* DM controls */}
              {isOwner && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginTop: "12px",
                    paddingTop: "10px",
                    borderTop: `1px solid ${GOLD_DARK}33`,
                  }}
                >
                  {session.status === "SCHEDULED" && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleStatusChange(session.id, "COMPLETED")
                        }
                      >
                        Mark Complete
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleStatusChange(session.id, "CANCELLED")
                        }
                      >
                        Cancel Session
                      </Button>
                    </>
                  )}
                  {session.status === "CANCELLED" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleStatusChange(session.id, "SCHEDULED")
                      }
                    >
                      Reschedule
                    </Button>
                  )}
                  {session.status === "COMPLETED" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleStatusChange(session.id, "SCHEDULED")
                      }
                    >
                      Reschedule
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(session)}
                  >
                    Edit
                  </Button>
                  {deleteConfirmId === session.id ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span
                        style={{
                          color: DANGER_RED,
                          fontSize: "11px",
                          fontFamily: SERIF,
                        }}
                      >
                        Delete?
                      </span>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(session.id)}
                        isLoading={deleteSession.isPending}
                      >
                        Yes
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmId(null)}
                      >
                        No
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setDeleteConfirmId(session.id)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Schedule Session"
      >
        <SessionForm
          form={form}
          onChange={setForm}
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          submitLabel="Schedule"
          isLoading={createSession.isPending}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={editingSession !== null}
        onClose={() => setEditingSession(null)}
        title="Edit Session"
      >
        <SessionForm
          form={form}
          onChange={setForm}
          onSubmit={handleUpdate}
          onCancel={() => setEditingSession(null)}
          submitLabel="Save Changes"
          isLoading={updateSession.isPending}
        />
      </Modal>
    </div>
  );
}
