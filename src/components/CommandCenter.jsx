import React, { useState, useRef, useEffect } from "react";

/**
 * CommandCenter — The core chat interface for interacting with Claude + MCP connectors.
 *
 * Renders the conversation thread with visual indicators for tool calls
 * and handles user input.
 */
export default function CommandCenter({ messages, isLoading, onSend }) {
  const [input, setInput] = useState("");
  const scrollRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput("");
  };

  return (
    <div style={styles.container}>
      {/* Message thread */}
      <div ref={scrollRef} style={styles.thread}>
        {messages.length === 0 && (
          <div style={styles.welcome}>
            <div style={styles.welcomeIcon}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a5 5 0 0 1 5 5v3a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5Z" />
                <path d="M20 21a8 8 0 1 0-16 0" />
              </svg>
            </div>
            <h2 style={styles.welcomeTitle}>Claude Connectors Hub</h2>
            <p style={styles.welcomeText}>
              Ask about your emails, calendar events, or anything else.
              Claude will use MCP connectors to fetch real data.
            </p>
            <div style={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  style={styles.suggestion}
                  onClick={() => { setInput(s); }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} style={styles.messageRow}>
            {msg.role === "user" && (
              <div style={styles.userBubble}>
                <span>{msg.content}</span>
              </div>
            )}
            {msg.role === "assistant" && (
              <div style={styles.assistantBubble}>
                {/* Show tool call badges if Claude used connectors */}
                {msg.toolCalls?.length > 0 && (
                  <div style={styles.toolBadges}>
                    {msg.toolCalls.map((tc, i) => (
                      <span key={i} style={styles.toolBadge}>
                        ⚡ {tc.server}: {tc.tool}
                      </span>
                    ))}
                  </div>
                )}
                <div style={styles.assistantText}>
                  {msg.content.split("\n").map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i < msg.content.split("\n").length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
            {msg.role === "error" && (
              <div style={styles.errorBubble}>
                <span style={{ fontWeight: 600 }}>Error:</span> {msg.content}
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div style={styles.messageRow}>
            <div style={styles.assistantBubble}>
              <div style={styles.loadingDots}>
                <span className="typing-dot" style={styles.dot} />
                <span className="typing-dot" style={styles.dot} />
                <span className="typing-dot" style={styles.dot} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={styles.inputRow}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your emails, calendar, or anything…"
          disabled={isLoading}
          style={styles.input}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          style={{
            ...styles.sendButton,
            opacity: isLoading || !input.trim() ? 0.4 : 1,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m22 2-7 20-4-9-9-4 20-7Z" />
            <path d="M22 2 11 13" />
          </svg>
        </button>
      </form>
    </div>
  );
}

const SUGGESTIONS = [
  "Summarize my unread emails",
  "What meetings do I have today?",
  "Any emails about the Q3 review?",
  "Find a free slot tomorrow afternoon",
];

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  thread: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  welcome: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "40px 20px",
    flex: 1,
  },
  welcomeIcon: {
    width: "64px",
    height: "64px",
    borderRadius: "16px",
    background: "var(--accent-glow)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "16px",
  },
  welcomeTitle: {
    fontSize: "22px",
    fontWeight: 600,
    margin: "0 0 8px",
    color: "var(--text-primary)",
  },
  welcomeText: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    maxWidth: "400px",
    lineHeight: 1.5,
    margin: "0 0 24px",
  },
  suggestions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    justifyContent: "center",
    maxWidth: "480px",
  },
  suggestion: {
    padding: "8px 14px",
    borderRadius: "20px",
    border: "1px solid var(--border)",
    background: "var(--bg-tertiary)",
    color: "var(--text-secondary)",
    fontSize: "13px",
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "all 0.15s ease",
  },
  messageRow: {
    display: "flex",
    flexDirection: "column",
  },
  userBubble: {
    alignSelf: "flex-end",
    background: "var(--accent)",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "16px 16px 4px 16px",
    maxWidth: "80%",
    fontSize: "14px",
    lineHeight: 1.5,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    background: "var(--bg-tertiary)",
    border: "1px solid var(--border)",
    padding: "12px 16px",
    borderRadius: "16px 16px 16px 4px",
    maxWidth: "85%",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  assistantText: {
    color: "var(--text-primary)",
    whiteSpace: "pre-wrap",
  },
  toolBadges: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    marginBottom: "8px",
  },
  toolBadge: {
    fontSize: "11px",
    fontFamily: '"JetBrains Mono", monospace',
    color: "var(--warning)",
    background: "rgba(255, 167, 38, 0.1)",
    padding: "2px 8px",
    borderRadius: "4px",
    border: "1px solid rgba(255, 167, 38, 0.2)",
  },
  errorBubble: {
    alignSelf: "flex-start",
    background: "rgba(239, 83, 80, 0.08)",
    border: "1px solid rgba(239, 83, 80, 0.2)",
    color: "var(--error)",
    padding: "10px 16px",
    borderRadius: "16px 16px 16px 4px",
    maxWidth: "85%",
    fontSize: "13px",
    lineHeight: 1.5,
  },
  loadingDots: {
    display: "flex",
    gap: "4px",
    padding: "4px 0",
  },
  dot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "var(--text-secondary)",
  },
  inputRow: {
    display: "flex",
    gap: "8px",
    padding: "16px 20px",
    borderTop: "1px solid var(--border)",
    background: "var(--bg-secondary)",
  },
  input: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid var(--border)",
    background: "var(--bg-tertiary)",
    color: "var(--text-primary)",
    fontSize: "14px",
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color 0.15s ease",
  },
  sendButton: {
    width: "44px",
    height: "44px",
    borderRadius: "12px",
    border: "none",
    background: "var(--accent)",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "opacity 0.15s ease",
    flexShrink: 0,
  },
};
