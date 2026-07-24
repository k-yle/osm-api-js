import React from "react";

export function DataEditor({
  demoKey,
  jsonValue,
  legacyValue,
  getStorage,
  updateStorage,
  deleteStorage,
  manualRootHashes,
  manualChunkHash,
  manualChunkValue,
  onDemoKeyChange,
  onJsonValueChange,
  onLegacyValueChange,
  onGetStorageChange,
  onUpdateStorageChange,
  onDeleteStorageChange,
  onManualRootHashesChange,
  onManualChunkHashChange,
  onManualChunkValueChange,
  onLoadShortPreset,
  onLoadLongPreset,
}) {
  return (
    <section style={{ border: "1px solid #bbb", padding: 12, marginBottom: 12 }}>
      <h2 style={{ marginTop: 0 }}>3) Demo Data</h2>
      <p style={{ marginTop: 0 }}>Edit key/value and storage options before running actions.</p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <label>
          Logical key:
          <input
            value={demoKey}
            onChange={(event) => onDemoKeyChange(event.target.value)}
            style={{ marginLeft: 8, width: 280 }}
          />
        </label>
        <label>
          Legacy raw value:
          <input
            value={legacyValue}
            onChange={(event) => onLegacyValueChange(event.target.value)}
            style={{ marginLeft: 8, width: 280 }}
          />
        </label>
      </div>

      <div style={{ marginBottom: 8 }}>
        <label>
          JSON for updatePreference:
          <textarea
            value={jsonValue}
            onChange={(event) => onJsonValueChange(event.target.value)}
            style={{ display: "block", width: "100%", minHeight: 120, marginTop: 6 }}
          />
        </label>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <button onClick={onLoadShortPreset}>Load short preset</button>
        <button onClick={onLoadLongPreset}>Load long preset</button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <label>
          getPreference storage:
          <select
            value={getStorage}
            onChange={(event) => onGetStorageChange(event.target.value)}
            style={{ marginLeft: 8 }}
          >
            <option value="auto">auto</option>
            <option value="single">single</option>
            <option value="split">split</option>
          </select>
        </label>

        <label>
          updatePreference storage:
          <select
            value={updateStorage}
            onChange={(event) => onUpdateStorageChange(event.target.value)}
            style={{ marginLeft: 8 }}
          >
            <option value="auto">auto</option>
            <option value="single">single</option>
            <option value="split">split</option>
          </select>
        </label>

        <label>
          deletePreference storage:
          <select
            value={deleteStorage}
            onChange={(event) => onDeleteStorageChange(event.target.value)}
            style={{ marginLeft: 8 }}
          >
            <option value="auto">auto</option>
            <option value="single">single</option>
            <option value="split">split</option>
          </select>
        </label>
      </div>

      <h3>Manual split corruption fields</h3>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <label>
          Root hashes:
          <input
            value={manualRootHashes}
            onChange={(event) => onManualRootHashesChange(event.target.value)}
            style={{ marginLeft: 8, width: 240 }}
          />
        </label>
        <label>
          Chunk hash:
          <input
            value={manualChunkHash}
            onChange={(event) => onManualChunkHashChange(event.target.value)}
            style={{ marginLeft: 8, width: 160 }}
          />
        </label>
      </div>
      <div>
        <label>
          Chunk value:
          <textarea
            value={manualChunkValue}
            onChange={(event) => onManualChunkValueChange(event.target.value)}
            style={{ display: "block", width: "100%", minHeight: 80, marginTop: 6 }}
          />
        </label>
      </div>
    </section>
  );
}
