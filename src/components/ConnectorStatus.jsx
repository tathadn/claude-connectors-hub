/**
 * ConnectorStatus — Shows the health/toggle state of each MCP connector.
 *
 * Status dot colors:
 *   gray   — connector is off
 *   orange — connector is on but OAuth is pending or not yet authenticated
 *   red    — OAuth error
 *   green  — connector is on and authenticated
 */

const ICONS = {
  mail: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  ),
  calendar: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2v4" /><path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  ),
};

const Spinner = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
    style={{ animation: "spin 0.8s linear infinite" }}>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export default function ConnectorStatus({ connectors, activeConnectors, tokens, authStatus, onToggle, onReconnect }) {
  return (
    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
      {Object.entries(connectors).map(([id, connector]) => {
        const isActive = activeConnectors.includes(id);
        const hasToken = Boolean(tokens?.[id]);
        const status = authStatus?.[id];
        const isPending = status === "pending";
        const isError = status === "error";

        // Derive dot color
        let dotColor = "var(--text-secondary)"; // off
        if (isActive) {
          if (hasToken) dotColor = "var(--success)";
          else if (isPending) dotColor = "var(--warning)";
          else if (isError) dotColor = "var(--error)";
          else dotColor = "var(--warning)";
        }

        // Button accent when active
        const borderColor = isActive
          ? hasToken ? "var(--accent)" : isError ? "var(--error)" : "var(--warning)"
          : "var(--border)";
        const bgColor = isActive
          ? hasToken ? "var(--accent-glow)" : isError ? "rgba(239,83,80,0.1)" : "rgba(255,167,38,0.1)"
          : "var(--bg-tertiary)";
        const textColor = isActive
          ? hasToken ? "var(--accent)" : isError ? "var(--error)" : "var(--warning)"
          : "var(--text-secondary)";

        return (
          <div key={id} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <button
              onClick={() => onToggle(id)}
              disabled={isPending}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 14px",
                borderRadius: "8px",
                border: `1px solid ${borderColor}`,
                background: bgColor,
                color: textColor,
                cursor: isPending ? "default" : "pointer",
                fontSize: "13px",
                fontFamily: "inherit",
                transition: "all 0.2s ease",
                opacity: isPending ? 0.8 : 1,
              }}
              title={connector.description}
            >
              {/* Status dot or spinner */}
              {isPending ? (
                <Spinner />
              ) : (
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
              )}
              {ICONS[connector.icon]}
              <span style={{ fontWeight: 500 }}>
                {isPending ? "Connecting…" : connector.label}
              </span>
            </button>

            {/* Reconnect button shown when active but auth failed or token expired */}
            {isActive && isError && (
              <button
                onClick={() => onReconnect(id)}
                style={{
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: "1px solid var(--error)",
                  background: "rgba(239,83,80,0.1)",
                  color: "var(--error)",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontFamily: "inherit",
                }}
                title="Retry authentication"
              >
                Retry
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
