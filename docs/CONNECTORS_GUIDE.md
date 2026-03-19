# MCP Connectors Guide

A deep-dive into how this project uses Claude's Model Context Protocol (MCP) connectors to integrate with external services.

## What is MCP?

The **Model Context Protocol** is a standard that allows AI models like Claude to interact with external tools and services in a structured way. Instead of the model guessing or hallucinating data, MCP lets Claude _actually call_ APIs like Gmail and Google Calendar to fetch real information.

## How MCP Works in This Project

### 1. Declaring MCP Servers

When making an API call, you pass an `mcp_servers` array that tells Claude which external services it can access:

```javascript
const requestBody = {
  model: "claude-sonnet-4-20250514",
  max_tokens: 1000,
  messages: [{ role: "user", content: "What's on my calendar today?" }],

  // This is the key addition — MCP servers
  mcp_servers: [
    {
      type: "url",
      url: "https://gcal.mcp.claude.com/mcp",
      name: "google-calendar",
    },
  ],
};
```

Claude sees these servers as available tools. When a user query requires external data, Claude automatically decides which tool to call, constructs the right parameters, and processes the result.

### 2. Understanding the Response

A response from Claude with MCP tool use contains multiple content block types:

```json
{
  "content": [
    {
      "type": "text",
      "text": "Let me check your calendar..."
    },
    {
      "type": "mcp_tool_use",
      "id": "toolu_abc123",
      "name": "list_events",
      "server_name": "google-calendar",
      "input": {
        "timeMin": "2025-03-18T00:00:00Z",
        "timeMax": "2025-03-18T23:59:59Z"
      }
    },
    {
      "type": "mcp_tool_result",
      "tool_use_id": "toolu_abc123",
      "content": [
        {
          "type": "text",
          "text": "{\"items\": [{\"summary\": \"Team Standup\", ...}]}"
        }
      ]
    },
    {
      "type": "text",
      "text": "You have 3 meetings today..."
    }
  ]
}
```

### 3. Parsing by Block Type

**Critical**: Always parse by `type`, never by position. Blocks can appear in any order:

```javascript
const blocks = response.content;

// Claude's text responses
const text = blocks
  .filter((b) => b.type === "text")
  .map((b) => b.text)
  .join("\n\n");

// What tools Claude invoked
const toolCalls = blocks
  .filter((b) => b.type === "mcp_tool_use")
  .map((b) => ({
    tool: b.name,
    server: b.server_name,
    input: b.input,
  }));

// The actual data from external services
const toolResults = blocks
  .filter((b) => b.type === "mcp_tool_result")
  .map((b) => {
    const raw = b.content?.[0]?.text || "";
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  });
```

## Available Connectors

### Gmail (`gmail.mcp.claude.com`)

| Capability     | Description                        |
| -------------- | ---------------------------------- |
| Read emails    | Fetch inbox, search by query       |
| Draft emails   | Compose new drafts                 |
| Search         | Find emails by sender, subject, date |
| Labels         | Read and filter by labels          |

### Google Calendar (`gcal.mcp.claude.com`)

| Capability      | Description                        |
| --------------- | ---------------------------------- |
| List events     | Fetch events for a date range      |
| Create events   | Schedule new meetings              |
| Check free/busy | Find available time slots          |
| Manage RSVPs    | Accept/decline invitations         |

## Multi-Connector Queries

One of the most powerful features is combining connectors in a single query. Claude intelligently routes to the right service:

```
User: "Check if I have any emails or meetings about the budget review"
```

Claude will:
1. Search Gmail for emails containing "budget review"
2. Search Google Calendar for events with "budget review"
3. Synthesize both results into a unified answer

This is enabled simply by including both MCP servers in the request:

```javascript
mcp_servers: [
  { type: "url", url: "https://gmail.mcp.claude.com/mcp", name: "gmail" },
  { type: "url", url: "https://gcal.mcp.claude.com/mcp", name: "google-calendar" },
];
```

## Error Handling

MCP tool results can include errors. Always check:

```javascript
const result = blocks.find((b) => b.type === "mcp_tool_result");

if (result?.is_error) {
  // The connector returned an error (auth expired, rate limit, etc.)
  console.error("MCP error:", result.content?.[0]?.text);
}
```

Common error scenarios:
- **Authentication expired**: User needs to re-authorize the connector
- **Rate limiting**: Too many requests to the external service
- **Service unavailable**: The external API is down
- **Permission denied**: Connector doesn't have access to requested data

## Security Considerations

1. **API keys**: Never expose your Anthropic API key in client-side code in production. Use a backend proxy.
2. **MCP authentication**: MCP servers handle OAuth with external services. Your app never sees the user's Google credentials.
3. **Data scope**: Claude only accesses what the MCP server exposes. It cannot make arbitrary API calls.

## Adding More Connectors

As Anthropic expands the MCP ecosystem, you can add new connectors by:

1. Finding the MCP server URL for the service
2. Adding it to the `MCP_CONNECTORS` object in `src/utils/claudeApi.js`
3. Creating a corresponding panel component if needed

```javascript
// Example: Adding a hypothetical Slack connector
slack: {
  type: "url",
  url: "https://slack.mcp.claude.com/mcp",
  name: "slack",
  label: "Slack",
  icon: "message-square",
  description: "Read and send Slack messages",
},
```
