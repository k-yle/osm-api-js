import React from "react";

export function LogPanel({ logs, onClear }) {
  return (
    <section style={{ border: "1px solid #bbb", padding: 12, marginBottom: 12 }}>
      <h2 style={{ marginTop: 0 }}>6) Request/Response Log</h2>
      <button onClick={onClear}>Clear log</button>
      <div style={{ marginTop: 12 }}>
        {logs.length === 0 ? (
          <p>No entries yet.</p>
        ) : (
          logs.map((entry) => (
            <div key={entry.id} style={{ border: "1px solid #ddd", padding: 8, marginBottom: 8 }}>
              <div>
                <strong>{entry.action}</strong> - {entry.status} - {entry.time}
              </div>
              <pre style={{ marginBottom: 6, overflowX: "auto" }}>
                request: {JSON.stringify(entry.request, null, 2)}
              </pre>
              {entry.status === "success" ? (
                <pre style={{ marginBottom: 0, overflowX: "auto" }}>
                  response: {JSON.stringify(entry.response, null, 2)}
                </pre>
              ) : (
                <pre style={{ marginBottom: 0, overflowX: "auto" }}>
                  error: {JSON.stringify(entry.error, null, 2)}
                </pre>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
