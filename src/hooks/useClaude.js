import { useState, useCallback, useRef } from "react";
import { sendMessage, MCP_CONNECTORS } from "../utils/claudeApi";
import { parseResponse, appendToHistory } from "../utils/parseResponse";
import { useOAuth } from "./useOAuth";

/**
 * useClaude — React hook for Claude API + MCP Connectors
 *
 * Manages conversation state, connector selection, OAuth tokens,
 * API calls, and response parsing in a single reusable hook.
 *
 * Usage:
 *   const { send, messages, isLoading, connectors, toggleConnector } = useClaude();
 *   await send("What meetings do I have today?");
 */
export function useClaude() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // Connectors start inactive — OAuth is triggered when the user enables one
  const [activeConnectors, setActiveConnectors] = useState([]);
  const historyRef = useRef([]);

  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  const { tokens, authStatus, startOAuth, clearToken } = useOAuth();

  /**
   * Toggle a connector on/off. Enabling a connector with no token
   * automatically starts the OAuth flow for that connector.
   */
  const toggleConnector = useCallback(
    (connectorId) => {
      setActiveConnectors((prev) => {
        if (prev.includes(connectorId)) {
          return prev.filter((c) => c !== connectorId);
        }
        // Kick off OAuth if we don't have a token yet
        if (!tokens[connectorId]) {
          startOAuth(connectorId);
        }
        return [...prev, connectorId];
      });
    },
    [tokens, startOAuth]
  );

  /**
   * Retry authentication for a connector (e.g. after an error or expiry).
   */
  const reconnect = useCallback(
    (connectorId) => {
      clearToken(connectorId);
      startOAuth(connectorId);
    },
    [clearToken, startOAuth]
  );

  /**
   * Send a message to Claude with active MCP connectors
   */
  const send = useCallback(
    async (userMessage) => {
      if (!userMessage.trim()) return;

      setError(null);
      setIsLoading(true);

      // Add user message to UI immediately
      const userMsg = {
        id: Date.now(),
        role: "user",
        content: userMessage,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);

      try {
        // Call Claude API with MCP connectors and their OAuth tokens
        const rawResponse = await sendMessage({
          message: userMessage,
          history: historyRef.current,
          connectors: activeConnectors,
          apiKey,
          tokens,
        });

        // Parse the response to separate text, tool calls, and results
        const parsed = parseResponse(rawResponse);

        // Add assistant message to UI
        const assistantMsg = {
          id: Date.now() + 1,
          role: "assistant",
          content: parsed.text,
          toolCalls: parsed.toolCalls,
          toolResults: parsed.toolResults,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMsg]);

        // Update conversation history for multi-turn context
        historyRef.current = [
          ...historyRef.current,
          { role: "user", content: userMessage },
          ...appendToHistory([], rawResponse).slice(-1),
        ];
      } catch (err) {
        setError(err.message);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            role: "error",
            content: err.message,
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [activeConnectors, apiKey, tokens]
  );

  /**
   * Clear conversation history
   */
  const clearHistory = useCallback(() => {
    setMessages([]);
    historyRef.current = [];
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    activeConnectors,
    availableConnectors: MCP_CONNECTORS,
    tokens,
    authStatus,
    send,
    toggleConnector,
    reconnect,
    clearHistory,
    hasApiKey: Boolean(apiKey),
  };
}
