import React from "react";
import * as OSM from "osm-api";

function normalizeScopes(text) {
  return text
    .split(/[,\s]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function tokenPreview(token) {
  if (!token) return "none";
  if (token.length < 18) return token;
  return `${token.slice(0, 8)}...${token.slice(-6)}`;
}

export function AuthPanel({
  authMode,
  clientId,
  redirectUrl,
  scopesText,
  switchUser,
  onAuthModeChange,
  onClientIdChange,
  onRedirectUrlChange,
  onScopesTextChange,
  onSwitchUserChange,
  onAuthStatusChange,
  onLog,
}) {
  async function refreshAuthStatus() {
    const token = OSM.getAuthToken ? OSM.getAuthToken() : undefined;
    const state = {
      loggedIn: OSM.isLoggedIn(),
      tokenPreview: tokenPreview(token),
    };
    onAuthStatusChange(state);
    onLog("authStatus", {}, state);
  }

  async function runLogin() {
    const scopes = normalizeScopes(scopesText);
    await OSM.login({
      mode: authMode,
      clientId,
      redirectUrl,
      scopes,
      switchUser,
    });
    await refreshAuthStatus();
  }

  async function runLogout() {
    OSM.logout();
    await refreshAuthStatus();
  }

  async function waitForAuthReady() {
    await OSM.authReady;
    await refreshAuthStatus();
  }

  return (
    <section style={{ border: "1px solid #bbb", padding: 12, marginBottom: 12 }}>
      <h2 style={{ marginTop: 0 }}>2) Auth (library flow)</h2>
      <p style={{ marginTop: 0 }}>
        Uses <code>login</code>, <code>logout</code>, <code>isLoggedIn</code>, and{" "}
        <code>authReady</code>.
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <label>
          Mode:
          <select
            value={authMode}
            onChange={(event) => onAuthModeChange(event.target.value)}
            style={{ marginLeft: 8 }}
          >
            <option value="popup">popup</option>
            <option value="redirect">redirect</option>
          </select>
        </label>

        <label>
          Client ID:
          <input
            value={clientId}
            onChange={(event) => onClientIdChange(event.target.value)}
            placeholder="Your OSM OAuth client id"
            style={{ marginLeft: 8, width: 280 }}
          />
        </label>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <label>
          Redirect URL:
          <input
            value={redirectUrl}
            onChange={(event) => onRedirectUrlChange(event.target.value)}
            style={{ marginLeft: 8, width: 360 }}
          />
        </label>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <label>
          Scopes:
          <input
            value={scopesText}
            onChange={(event) => onScopesTextChange(event.target.value)}
            style={{ marginLeft: 8, width: 360 }}
          />
        </label>

        <label>
          <input
            type="checkbox"
            checked={switchUser}
            onChange={(event) => onSwitchUserChange(event.target.checked)}
            style={{ marginRight: 6 }}
          />
          switchUser
        </label>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => runLogin()}>Login</button>
        <button onClick={() => runLogout()}>Logout</button>
        <button onClick={() => refreshAuthStatus()}>Refresh auth status</button>
        <button onClick={() => waitForAuthReady()}>Await authReady</button>
      </div>
    </section>
  );
}
