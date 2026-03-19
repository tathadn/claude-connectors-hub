/**
 * OAuth 2.0 PKCE utilities for MCP connector authentication
 *
 * Implements the authorization code + PKCE flow used by
 * gmail.mcp.claude.com and gcal.mcp.claude.com.
 */

/** Base OAuth server URL per connector ID */
export const OAUTH_SERVERS = {
  gmail: "https://gmail.mcp.claude.com",
  googleCalendar: "https://gcal.mcp.claude.com",
};

function base64urlEncode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/** @returns {string} Random PKCE code verifier */
export function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64urlEncode(array.buffer);
}

/**
 * @param {string} verifier
 * @returns {Promise<string>} S256 code challenge
 */
export async function generateCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64urlEncode(digest);
}

/**
 * Dynamically register this app as an OAuth client with the MCP server.
 *
 * @param {string} serverBaseUrl
 * @param {string} redirectUri
 * @returns {Promise<{client_id: string, client_secret?: string}>}
 */
export async function registerClient(serverBaseUrl, redirectUri) {
  const res = await fetch(`${serverBaseUrl}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      redirect_uris: [redirectUri],
      client_name: "Claude Connectors Hub",
      token_endpoint_auth_method: "client_secret_post",
    }),
  });
  if (!res.ok) throw new Error(`Client registration failed: ${res.status}`);
  return res.json();
}

/**
 * Build the authorization URL to redirect the user to.
 *
 * @param {string} serverBaseUrl
 * @param {{clientId: string, redirectUri: string, codeChallenge: string, state: string}} params
 * @returns {string}
 */
export function buildAuthorizationUrl(serverBaseUrl, { clientId, redirectUri, codeChallenge, state }) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
  });
  return `${serverBaseUrl}/authorize?${params}`;
}

/**
 * Exchange authorization code for access token.
 *
 * @param {string} serverBaseUrl
 * @param {{code: string, codeVerifier: string, clientId: string, clientSecret: string, redirectUri: string}} params
 * @returns {Promise<{access_token: string, refresh_token?: string}>}
 */
export async function exchangeCodeForToken(serverBaseUrl, { code, codeVerifier, clientId, clientSecret, redirectUri }) {
  const res = await fetch(`${serverBaseUrl}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret || "",
      code_verifier: codeVerifier,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error_description || `Token exchange failed: ${res.status}`);
  }
  return res.json();
}
