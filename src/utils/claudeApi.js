/**
 * Claude API Client with MCP Connector Support
 *
 * This module handles communication with the Anthropic /v1/messages endpoint,
 * including MCP (Model Context Protocol) server configuration for Gmail
 * and Google Calendar integration.
 */

// Available MCP connector configurations
export const MCP_CONNECTORS = {
  gmail: {
    type: "url",
    url: "https://gmail.mcp.claude.com/mcp",
    name: "gmail",
    label: "Gmail",
    icon: "mail",
    description: "Read, search, and draft emails",
  },
  googleCalendar: {
    type: "url",
    url: "https://gcal.mcp.claude.com/mcp",
    name: "google-calendar",
    label: "Google Calendar",
    icon: "calendar",
    description: "View events, find free slots, manage meetings",
  },
};

// System prompt that instructs Claude how to use connectors
const SYSTEM_PROMPT = `You are a productivity assistant with access to the user's Gmail and Google Calendar via MCP connectors.

When answering questions:
- Use the available MCP tools to fetch real data from Gmail and Google Calendar
- Present information in a clear, structured way
- For emails: include sender, subject, date, and a brief summary
- For calendar events: include title, time, location, and attendees
- If a query involves both email and calendar, use both connectors
- Always be concise and actionable in your responses

If a connector is unavailable or returns an error, gracefully inform the user.`;

/**
 * Send a message to Claude with MCP connector support
 *
 * @param {Object} options
 * @param {string} options.message - The user's query
 * @param {Array} options.history - Previous conversation messages
 * @param {string[]} options.connectors - Which MCP connectors to enable ('gmail', 'googleCalendar')
 * @param {string} options.apiKey - Anthropic API key
 * @param {Object} options.tokens - OAuth access tokens keyed by connector ID
 * @returns {Promise<Object>} - Parsed API response
 */
export async function sendMessage({ message, history = [], connectors = [], apiKey, tokens = {} }) {
  if (!apiKey) {
    throw new Error("API key is required. Set VITE_ANTHROPIC_API_KEY in your .env file.");
  }

  // Build the MCP servers array from selected connectors
  const mcpServers = connectors
    .map((id) => {
      const connector = MCP_CONNECTORS[id];
      if (!connector) return null;
      const server = {
        type: connector.type,
        url: connector.url,
        name: connector.name,
      };
      if (tokens[id]) server.authorization_token = tokens[id];
      return server;
    })
    .filter(Boolean);

  // Construct the messages array with conversation history
  const messages = [
    ...history,
    { role: "user", content: message },
  ];

  const requestBody = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system: SYSTEM_PROMPT,
    messages,
  };

  // Only include mcp_servers if connectors are selected
  if (mcpServers.length > 0) {
    requestBody.mcp_servers = mcpServers;
    requestBody.tools = mcpServers.map((server) => ({
      type: "mcp_toolset",
      mcp_server_name: server.name,
    }));
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "mcp-client-2025-11-20",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `API request failed: ${response.status}`);
  }

  return response.json();
}
