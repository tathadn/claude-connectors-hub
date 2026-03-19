import { useState, useCallback, useRef, useEffect } from "react";
import {
  OAUTH_SERVERS,
  generateCodeVerifier,
  generateCodeChallenge,
  registerClient,
  buildAuthorizationUrl,
  exchangeCodeForToken,
} from "../utils/oauth";

/**
 * useOAuth — manages OAuth 2.0 PKCE flow for MCP connectors
 *
 * Opens a popup window for each connector's OAuth flow. The popup
 * lands back on this app's origin, detects the code, and posts a
 * message back to this window to complete the exchange.
 *
 * @returns {{ tokens, authStatus, startOAuth, clearToken }}
 */
export function useOAuth() {
  // { [connectorId]: access_token }
  const [tokens, setTokens] = useState({});
  // { [connectorId]: 'idle' | 'pending' | 'error' }
  const [authStatus, setAuthStatus] = useState({});
  // Stores in-flight PKCE state keyed by connectorId
  const pendingRef = useRef({});

  // Listen for postMessage from the OAuth callback popup
  useEffect(() => {
    function handleMessage(event) {
      if (event.origin !== window.location.origin) return;
      const { type, connectorId, code, error } = event.data || {};
      if (type !== "oauth_callback") return;

      if (error || !code) {
        setAuthStatus((prev) => ({ ...prev, [connectorId]: "error" }));
        return;
      }

      const pending = pendingRef.current[connectorId];
      if (!pending) return;

      const serverBaseUrl = OAUTH_SERVERS[connectorId];
      const redirectUri = window.location.origin + "/";

      exchangeCodeForToken(serverBaseUrl, {
        code,
        codeVerifier: pending.codeVerifier,
        clientId: pending.clientId,
        clientSecret: pending.clientSecret,
        redirectUri,
      })
        .then(({ access_token }) => {
          setTokens((prev) => ({ ...prev, [connectorId]: access_token }));
          setAuthStatus((prev) => ({ ...prev, [connectorId]: "idle" }));
          delete pendingRef.current[connectorId];
        })
        .catch(() => {
          setAuthStatus((prev) => ({ ...prev, [connectorId]: "error" }));
        });
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  /**
   * Start OAuth flow for the given connector in a popup window.
   * @param {string} connectorId - 'gmail' | 'googleCalendar'
   */
  const startOAuth = useCallback(async (connectorId) => {
    const serverBaseUrl = OAUTH_SERVERS[connectorId];
    if (!serverBaseUrl) return;

    setAuthStatus((prev) => ({ ...prev, [connectorId]: "pending" }));

    try {
      const redirectUri = window.location.origin + "/";
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      // Encode connectorId into state so the callback knows which connector it belongs to
      const state = `${connectorId}:${crypto.randomUUID()}`;

      const { client_id, client_secret } = await registerClient(serverBaseUrl, redirectUri);
      pendingRef.current[connectorId] = { codeVerifier, clientId: client_id, clientSecret: client_secret };

      const authUrl = buildAuthorizationUrl(serverBaseUrl, {
        clientId: client_id,
        redirectUri,
        codeChallenge,
        state,
      });

      const popup = window.open(authUrl, `oauth_${connectorId}`, "width=500,height=650,scrollbars=yes");
      if (!popup) {
        throw new Error("Popup blocked. Please allow popups for this site and try again.");
      }
    } catch (err) {
      setAuthStatus((prev) => ({ ...prev, [connectorId]: "error" }));
      console.error(`OAuth error for ${connectorId}:`, err);
    }
  }, []);

  /**
   * Clear the stored token for a connector (forces re-auth on next use).
   * @param {string} connectorId
   */
  const clearToken = useCallback((connectorId) => {
    setTokens((prev) => {
      const next = { ...prev };
      delete next[connectorId];
      return next;
    });
    setAuthStatus((prev) => ({ ...prev, [connectorId]: "idle" }));
  }, []);

  return { tokens, authStatus, startOAuth, clearToken };
}
