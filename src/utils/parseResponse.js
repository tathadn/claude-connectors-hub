/**
 * MCP Response Parser
 *
 * Parses Claude API responses that may contain mixed content blocks:
 * - text: Claude's natural language response
 * - mcp_tool_use: Shows which MCP tool was invoked
 * - mcp_tool_result: Contains data returned from MCP servers
 *
 * This is the core parsing logic that makes MCP connectors useful —
 * without it, you'd just get raw JSON blocks mixed with text.
 */

/**
 * Parse a Claude API response into structured sections
 *
 * @param {Object} response - Raw API response from /v1/messages
 * @returns {Object} Parsed response with text, tools, and results
 */
export function parseResponse(response) {
  if (!response?.content || !Array.isArray(response.content)) {
    return {
      text: "No response received.",
      toolCalls: [],
      toolResults: [],
      raw: response,
    };
  }

  const blocks = response.content;

  // Extract text blocks — Claude's natural language responses
  const textBlocks = blocks
    .filter((block) => block.type === "text")
    .map((block) => block.text);

  // Extract MCP tool invocations — shows what Claude asked the connectors to do
  const toolCalls = blocks
    .filter((block) => block.type === "mcp_tool_use")
    .map((block) => ({
      id: block.id,
      tool: block.name,
      server: block.server_name || "unknown",
      input: block.input,
    }));

  // Extract MCP tool results — the actual data from Gmail/Calendar
  const toolResults = blocks
    .filter((block) => block.type === "mcp_tool_result")
    .map((block) => {
      const rawText = block.content?.[0]?.text || "";
      let parsed = null;

      try {
        parsed = JSON.parse(rawText);
      } catch {
        // Not JSON — treat as plain text
      }

      return {
        toolUseId: block.tool_use_id,
        isError: block.is_error || false,
        raw: rawText,
        parsed,
      };
    });

  return {
    text: textBlocks.join("\n\n"),
    toolCalls,
    toolResults,
    raw: response,
  };
}

/**
 * Extract calendar events from parsed tool results
 *
 * @param {Array} toolResults - Parsed tool results from parseResponse
 * @returns {Array} Calendar event objects
 */
export function extractCalendarEvents(toolResults) {
  const events = [];

  for (const result of toolResults) {
    if (result.parsed?.items) {
      // Google Calendar API returns events in an `items` array
      events.push(
        ...result.parsed.items.map((item) => ({
          id: item.id,
          title: item.summary || "Untitled Event",
          start: item.start?.dateTime || item.start?.date,
          end: item.end?.dateTime || item.end?.date,
          location: item.location || null,
          attendees: item.attendees?.map((a) => a.email) || [],
        }))
      );
    }
  }

  return events;
}

/**
 * Extract email summaries from parsed tool results
 *
 * @param {Array} toolResults - Parsed tool results from parseResponse
 * @returns {Array} Email summary objects
 */
export function extractEmails(toolResults) {
  const emails = [];

  for (const result of toolResults) {
    if (result.parsed?.messages) {
      emails.push(
        ...result.parsed.messages.map((msg) => ({
          id: msg.id,
          from: msg.from || "Unknown",
          subject: msg.subject || "(No subject)",
          snippet: msg.snippet || "",
          date: msg.date || null,
          unread: msg.labelIds?.includes("UNREAD") || false,
        }))
      );
    }
  }

  return emails;
}

/**
 * Build a conversation history array for multi-turn conversations
 *
 * @param {Array} messages - Array of { role, content } objects
 * @param {Object} latestResponse - The latest API response to append
 * @returns {Array} Updated messages array
 */
export function appendToHistory(messages, latestResponse) {
  if (!latestResponse?.content) return messages;

  // Extract just the text content for history (skip tool blocks for brevity)
  const assistantText = latestResponse.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n\n");

  return [
    ...messages,
    { role: "assistant", content: assistantText },
  ];
}
