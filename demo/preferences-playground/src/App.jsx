import React from "react";
import { useEffect, useState } from "react";
import * as OSM from "osm-api";
import { AuthPanel } from "./components/AuthPanel";
import { DataEditor } from "./components/DataEditor";
import { LogPanel } from "./components/LogPanel";
import { PreferenceActionsPanel } from "./components/PreferenceActionsPanel";
import { ScenarioGuide } from "./components/ScenarioGuide";
import { ServerPanel, getApiUrlForServer } from "./components/ServerPanel";
import { StorageInspector } from "./components/StorageInspector";

const SHORT_PRESET = JSON.stringify(
  {
    theme: "dark",
    fontSize: 14,
    items: ["a", "b", "c"],
  },
  null,
  2,
);

const LONG_PRESET = JSON.stringify(
  {
    theme: "dark",
    fontSize: 14,
    items: Array.from({ length: 120 }, (_, i) => `item-${i}`),
    note: "This payload is intentionally long to trigger split storage behavior.",
  },
  null,
  2,
);

function createLogEntry(action, request, response, error) {
  return {
    id: `${Date.now()}-${Math.random()}`,
    time: new Date().toLocaleTimeString(),
    action,
    request,
    response,
    error,
    status: error ? "error" : "success",
  };
}

function makeTokenPreview(token) {
  if (!token) return "none";
  if (token.length < 18) return token;
  return `${token.slice(0, 8)}...${token.slice(-6)}`;
}

export function App() {
  const [server, setServer] = useState("dev");
  const [authMode, setAuthMode] = useState("popup");
  const [clientId, setClientId] = useState("C4NEJIjmGvt2817yM7-0YUBTfmTI5Tx1M32WFoTwGTQ");
  const [redirectUrl, setRedirectUrl] = useState("http://127.0.0.1:4317/land.html");
  const [scopesText, setScopesText] = useState("read_prefs write_prefs");
  const [switchUser, setSwitchUser] = useState(false);
  const [authStatus, setAuthStatus] = useState({
    loggedIn: false,
    tokenPreview: "none",
  });

  const [demoKey, setDemoKey] = useState("my-key");
  const [jsonValue, setJsonValue] = useState(SHORT_PRESET);
  const [legacyValue, setLegacyValue] = useState("legacy-single-value");
  const [getStorage, setGetStorage] = useState("auto");
  const [updateStorage, setUpdateStorage] = useState("auto");
  const [deleteStorage, setDeleteStorage] = useState("auto");

  const [manualRootHashes, setManualRootHashes] = useState("deadbeef,facecafe");
  const [manualChunkHash, setManualChunkHash] = useState("deadbeef");
  const [manualChunkValue, setManualChunkValue] = useState("manual chunk value");

  const [mergedSnapshot, setMergedSnapshot] = useState({});
  const [rawSnapshot, setRawSnapshot] = useState({});
  const [logs, setLogs] = useState([]);

  function appendLog(action, request, response, error) {
    setLogs((current) => [createLogEntry(action, request, response, error), ...current]);
  }

  function clearLogs() {
    setLogs([]);
  }

  function loadShortPreset() {
    setJsonValue(SHORT_PRESET);
  }

  function loadLongPreset() {
    setJsonValue(LONG_PRESET);
  }

  async function refreshStorageSnapshot() {
    try {
      const merged = await OSM.getPreferences();
      const raw = await OSM.getPreferences({ handleStorage: "raw" });
      setMergedSnapshot(merged);
      setRawSnapshot(raw);
      appendLog("refreshStorageSnapshot", {}, { merged, raw });
    } catch (error) {
      const payload =
        error instanceof Error
          ? { name: error.name, message: error.message }
          : { message: String(error) };
      appendLog("refreshStorageSnapshot", {}, null, payload);
    }
  }

  useEffect(function synchronizeAuthAndDefaultServer() {
    OSM.configure({ apiUrl: getApiUrlForServer("dev") });
    async function applyAuthReadyResult() {
      await OSM.authReady;
      const token = OSM.getAuthToken ? OSM.getAuthToken() : undefined;
      setAuthStatus({
        loggedIn: OSM.isLoggedIn(),
        tokenPreview: makeTokenPreview(token),
      });
    }
    applyAuthReadyResult();
  }, []);

  return (
    <main style={{ fontFamily: "sans-serif", maxWidth: 1100, margin: "0 auto", padding: 12 }}>
      <h1 style={{ marginTop: 0 }}>OSM Preferences Demo App</h1>
      <p>
        Commit-focused playground for preference APIs, including split storage, conflict behavior,
        deprecated methods, and error simulations.
      </p>

      <ServerPanel server={server} onServerChange={setServer} onLog={appendLog} />

      <AuthPanel
        authMode={authMode}
        clientId={clientId}
        redirectUrl={redirectUrl}
        scopesText={scopesText}
        switchUser={switchUser}
        onAuthModeChange={setAuthMode}
        onClientIdChange={setClientId}
        onRedirectUrlChange={setRedirectUrl}
        onScopesTextChange={setScopesText}
        onSwitchUserChange={setSwitchUser}
        onAuthStatusChange={setAuthStatus}
        onLog={appendLog}
      />

      <p style={{ marginTop: -4 }}>
        Auth status: <strong>{authStatus.loggedIn ? "logged in" : "logged out"}</strong> | token:{" "}
        <code>{authStatus.tokenPreview}</code>
      </p>

      <DataEditor
        demoKey={demoKey}
        jsonValue={jsonValue}
        legacyValue={legacyValue}
        getStorage={getStorage}
        updateStorage={updateStorage}
        deleteStorage={deleteStorage}
        manualRootHashes={manualRootHashes}
        manualChunkHash={manualChunkHash}
        manualChunkValue={manualChunkValue}
        onDemoKeyChange={setDemoKey}
        onJsonValueChange={setJsonValue}
        onLegacyValueChange={setLegacyValue}
        onGetStorageChange={setGetStorage}
        onUpdateStorageChange={setUpdateStorage}
        onDeleteStorageChange={setDeleteStorage}
        onManualRootHashesChange={setManualRootHashes}
        onManualChunkHashChange={setManualChunkHash}
        onManualChunkValueChange={setManualChunkValue}
        onLoadShortPreset={loadShortPreset}
        onLoadLongPreset={loadLongPreset}
      />

      <PreferenceActionsPanel
        demoKey={demoKey}
        jsonValue={jsonValue}
        legacyValue={legacyValue}
        getStorage={getStorage}
        updateStorage={updateStorage}
        deleteStorage={deleteStorage}
        manualRootHashes={manualRootHashes}
        manualChunkHash={manualChunkHash}
        manualChunkValue={manualChunkValue}
        onLog={appendLog}
        onRefreshStorage={refreshStorageSnapshot}
        onLoadShortPreset={loadShortPreset}
        onLoadLongPreset={loadLongPreset}
      />

      <StorageInspector
        mergedSnapshot={mergedSnapshot}
        rawSnapshot={rawSnapshot}
        onRefresh={refreshStorageSnapshot}
      />

      <ScenarioGuide />
      <LogPanel logs={logs} onClear={clearLogs} />
    </main>
  );
}
