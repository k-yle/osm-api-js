import React from "react";

export function StorageInspector({ rawSnapshot, mergedSnapshot, onRefresh }) {
  return (
    <section style={{ border: "1px solid #bbb", padding: 12, marginBottom: 12 }}>
      <h2 style={{ marginTop: 0 }}>4) Storage Inspector</h2>
      <p style={{ marginTop: 0 }}>
        Refreshes both <code>getPreferences()</code> (merged) and{" "}
        <code>getPreferences(&#123; handleStorage: "raw" &#125;)</code>.
      </p>
      <button onClick={onRefresh}>Refresh storage snapshot</button>
      <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 420px" }}>
          <h3 style={{ margin: "8px 0" }}>Merged (default)</h3>
          <pre
            style={{
              border: "1px solid #ddd",
              padding: 8,
              margin: 0,
              overflowX: "auto",
            }}
          >
            {JSON.stringify(mergedSnapshot, null, 2)}
          </pre>
        </div>
        <div style={{ flex: "1 1 420px" }}>
          <h3 style={{ margin: "8px 0" }}>Raw</h3>
          <pre
            style={{
              border: "1px solid #ddd",
              padding: 8,
              margin: 0,
              overflowX: "auto",
            }}
          >
            {JSON.stringify(rawSnapshot, null, 2)}
          </pre>
        </div>
      </div>
    </section>
  );
}
