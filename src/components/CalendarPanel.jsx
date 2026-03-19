import React from "react";

/**
 * CalendarPanel — Displays calendar events extracted from MCP tool results.
 *
 * When Claude uses the Google Calendar MCP connector, this panel
 * renders the returned events in a clean timeline format.
 */
export default function CalendarPanel({ events = [] }) {
  if (events.length === 0) {
    return (
      <div style={styles.emptyState}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 2v4" /><path d="M16 2v4" />
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <path d="M3 10h18" />
          <path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" />
        </svg>
        <p style={{ margin: "8px 0 0", fontSize: "13px", color: "var(--text-secondary)" }}>
          Ask about your schedule to see events here
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>Upcoming Events</h3>
      <div style={styles.eventList}>
        {events.map((event, i) => (
          <div key={event.id || i} style={styles.eventCard}>
            <div style={styles.timeBadge}>
              {formatTime(event.start)}
            </div>
            <div style={styles.eventDetails}>
              <span style={styles.eventTitle}>{event.title}</span>
              {event.location && (
                <span style={styles.eventMeta}>📍 {event.location}</span>
              )}
              {event.attendees?.length > 0 && (
                <span style={styles.eventMeta}>
                  👥 {event.attendees.slice(0, 3).join(", ")}
                  {event.attendees.length > 3 && ` +${event.attendees.length - 3}`}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatTime(dateString) {
  if (!dateString) return "All day";
  try {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateString;
  }
}

const styles = {
  container: {
    padding: "16px",
  },
  heading: {
    fontSize: "12px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "var(--text-secondary)",
    margin: "0 0 12px",
  },
  eventList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  eventCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "10px 12px",
    borderRadius: "8px",
    background: "var(--bg-tertiary)",
    border: "1px solid var(--border)",
  },
  timeBadge: {
    fontSize: "11px",
    fontWeight: 600,
    fontFamily: '"JetBrains Mono", monospace',
    color: "var(--accent)",
    background: "var(--accent-glow)",
    padding: "3px 8px",
    borderRadius: "4px",
    whiteSpace: "nowrap",
  },
  eventDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    minWidth: 0,
  },
  eventTitle: {
    fontSize: "14px",
    fontWeight: 500,
    color: "var(--text-primary)",
  },
  eventMeta: {
    fontSize: "12px",
    color: "var(--text-secondary)",
  },
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "32px 16px",
    textAlign: "center",
  },
};
