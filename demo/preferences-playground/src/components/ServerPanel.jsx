import React from "react";
import * as OSM from "osm-api";

const DEV_API_URL = "https://master.apis.dev.openstreetmap.org";
const LIVE_API_URL = "https://api.openstreetmap.org";

export function getApiUrlForServer(server) {
  return server === "live" ? LIVE_API_URL : DEV_API_URL;
}

export function ServerPanel({ server, onServerChange, onLog }) {
  function applyServer(nextServer) {
    const apiUrl = getApiUrlForServer(nextServer);
    OSM.configure({ apiUrl });
    onServerChange(nextServer);
    onLog("configure", { apiUrl }, { ok: true });
  }

  return (
    <section style={{ border: "1px solid #bbb", padding: 12, marginBottom: 12 }}>
      <h2 style={{ marginTop: 0 }}>1) Environment</h2>
      <p style={{ marginTop: 0 }}>
        Toggle between development and live OSM API servers. Default is dev.
      </p>
      <label>
        Server:
        <select
          value={server}
          onChange={(event) => applyServer(event.target.value)}
          style={{ marginLeft: 8 }}
        >
          <option value="dev">dev (default)</option>
          <option value="live">live</option>
        </select>
      </label>
      <p style={{ marginBottom: 0 }}>
        Active apiUrl: <code>{getApiUrlForServer(server)}</code>
      </p>
    </section>
  );
}
