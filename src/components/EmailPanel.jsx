import React from "react";

/**
 * EmailPanel — Displays email data extracted from Gmail MCP connector results.
 *
 * Shows email summaries in a compact list with sender, subject, and preview.
 */
export default function EmailPanel({ emails = [] }) {
  if (emails.length === 0) {
    return (
      <div style={styles.emptyState}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
        <p style={{ margin: "8px 0 0", fontSize: "13px", color: "var(--text-secondary)" }}>
          Ask about your emails to see them here
        </p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>Emails</h3>
      <div style={styles.emailList}>
        {emails.map((email, i) => (
          <div key={email.id || i} style={styles.emailCard}>
            <div style={styles.emailHeader}>
              <span style={{
                ...styles.sender,
                fontWeight: email.unread ? 600 : 400,
              }}>
                {email.from}
              </span>
              {email.unread && <span style={styles.unreadDot} />}
              {email.date && (
                <span style={styles.date}>{formatDate(email.date)}</span>
              )}
            </div>
            <div style={styles.subject}>{email.subject}</div>
            {email.snippet && (
              <div style={styles.snippet}>{email.snippet}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
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
  emailList: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  emailCard: {
    padding: "10px 12px",
    borderRadius: "8px",
    background: "var(--bg-tertiary)",
    border: "1px solid var(--border)",
    cursor: "pointer",
    transition: "border-color 0.15s ease",
  },
  emailHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "2px",
  },
  sender: {
    fontSize: "13px",
    color: "var(--text-primary)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  unreadDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "var(--accent)",
    flexShrink: 0,
  },
  date: {
    fontSize: "11px",
    color: "var(--text-secondary)",
    marginLeft: "auto",
    flexShrink: 0,
    fontFamily: '"JetBrains Mono", monospace',
  },
  subject: {
    fontSize: "13px",
    fontWeight: 500,
    color: "var(--text-primary)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  snippet: {
    fontSize: "12px",
    color: "var(--text-secondary)",
    marginTop: "2px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
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
