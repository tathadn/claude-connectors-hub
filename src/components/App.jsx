import React, { useMemo, useEffect } from "react";
import { useClaude } from "../hooks/useClaude";
import { extractCalendarEvents, extractEmails } from "../utils/parseResponse";
import CommandCenter from "./CommandCenter";
import ConnectorStatus from "./ConnectorStatus";
import CalendarPanel from "./CalendarPanel";
import EmailPanel from "./EmailPanel";

/**
 * App — Main application shell for Claude Connectors Hub
 *
 * Orchestrates the dashboard layout: command center, side panels,
 * connector status indicators, and the useClaude hook.
 */
export default function App() {
  // Detect OAuth callback when this page loads inside a popup window
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const error = params.get("error");
    if ((code || error) && window.opener) {
      const connectorId = state?.split(":")[0];
      window.opener.postMessage(
        { type: "oauth_callback", connectorId, code: code || null, error: error || null },
        window.location.origin
      );
      window.close();
    }
  }, []);

  const {
    messages,
    isLoading,
    activeConnectors,
    availableConnectors,
    tokens,
    authStatus,
    send,
    toggleConnector,
    reconnect,
    clearHistory,
    hasApiKey,
  } = useClaude();

  // Extract structured data from the latest assistant message
  const { events, emails } = useMemo(() => {
    const assistantMsgs = messages.filter((m) => m.role === "assistant");
    const latest = assistantMsgs[assistantMsgs.length - 1];
    if (!latest?.toolResults) return { events: [], emails: [] };
    return {
      events: extractCalendarEvents(latest.toolResults),
      emails: extractEmails(latest.toolResults),
    };
  }, [messages]);

  // API key missing state
  if (!hasApiKey) {
    return (
      <div style={styles.keyMissing}>
        <div style={styles.keyMissingCard}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777Zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
          </svg>
          <h2 style={{ margin: "16px 0 8px", fontSize: "20px" }}>API Key Required</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.5, maxWidth: "400px", textAlign: "center" }}>
            Create a <code style={styles.code}>.env</code> file in the project root with your Anthropic API key:
          </p>
          <pre style={styles.codeBlock}>
            VITE_ANTHROPIC_API_KEY=sk-ant-...
          </pre>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
            Get your key at{" "}
            <a href="https://console.anthropic.com/" target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>
              console.anthropic.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.layout}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logo}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a5 5 0 0 1 5 5v3a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5Z" />
              <path d="M20 21a8 8 0 1 0-16 0" />
            </svg>
          </div>
          <span style={styles.headerTitle}>Connectors Hub</span>
        </div>
        <ConnectorStatus
          connectors={availableConnectors}
          activeConnectors={activeConnectors}
          tokens={tokens}
          authStatus={authStatus}
          onToggle={toggleConnector}
          onReconnect={reconnect}
        />
        <button onClick={clearHistory} style={styles.clearButton} title="Clear conversation">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        </button>
      </header>

      {/* Main Content */}
      <div style={styles.main}>
        {/* Command Center (chat area) */}
        <div style={styles.chatPanel}>
          <CommandCenter
            messages={messages}
            isLoading={isLoading}
            onSend={send}
          />
        </div>

        {/* Side panels (calendar + email) */}
        <aside style={styles.sidebar}>
          <div style={styles.sidePanel}>
            <CalendarPanel events={events} />
          </div>
          <div style={styles.sidePanel}>
            <EmailPanel emails={emails} />
          </div>
        </aside>
      </div>
    </div>
  );
}

const styles = {
  layout: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "var(--bg-primary)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "12px 20px",
    borderBottom: "1px solid var(--border)",
    background: "var(--bg-secondary)",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginRight: "auto",
  },
  logo: {
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    background: "var(--accent-glow)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: "16px",
    fontWeight: 600,
    color: "var(--text-primary)",
  },
  clearButton: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    border: "1px solid var(--border)",
    background: "var(--bg-tertiary)",
    color: "var(--text-secondary)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s ease",
  },
  main: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  chatPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  sidebar: {
    width: "320px",
    borderLeft: "1px solid var(--border)",
    background: "var(--bg-secondary)",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
  },
  sidePanel: {
    borderBottom: "1px solid var(--border)",
  },
  keyMissing: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    background: "var(--bg-primary)",
  },
  keyMissingCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "40px",
    borderRadius: "16px",
    border: "1px solid var(--border)",
    background: "var(--bg-secondary)",
  },
  code: {
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: "13px",
    background: "var(--bg-tertiary)",
    padding: "2px 6px",
    borderRadius: "4px",
  },
  codeBlock: {
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: "13px",
    background: "var(--bg-tertiary)",
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid var(--border)",
    margin: "12px 0",
    color: "var(--success)",
  },
};
