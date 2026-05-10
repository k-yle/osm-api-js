import React from "react";
import * as OSM from "osm-api";

function toErrorPayload(error) {
  if (error instanceof Error) {
    return { name: error.name, message: error.message };
  }
  return { message: String(error) };
}

function createDemoSchema() {
  return {
    "~standard": {
      version: 1,
      vendor: "preferences-playground",
      validate(value) {
        const issues = [];
        if (!value || typeof value !== "object" || Array.isArray(value)) {
          return { issues: [{ message: "Expected object" }] };
        }
        if (typeof value.theme !== "string") {
          issues.push({ message: "theme must be a string" });
        }
        if (typeof value.fontSize !== "number") {
          issues.push({ message: "fontSize must be a number" });
        }
        if (issues.length > 0) return { issues };
        return { value };
      },
    },
  };
}

export function PreferenceActionsPanel({
  demoKey,
  jsonValue,
  legacyValue,
  getStorage,
  updateStorage,
  deleteStorage,
  manualRootHashes,
  manualChunkHash,
  manualChunkValue,
  onLog,
  onRefreshStorage,
  onLoadShortPreset,
  onLoadLongPreset,
}) {
  async function runAction(action, request, operation) {
    try {
      const response = await operation();
      onLog(action, request, response);
      return response;
    } catch (error) {
      onLog(action, request, null, toErrorPayload(error));
      return null;
    }
  }

  async function actionGetPreferencesMerged() {
    await runAction("getPreferences(merged)", {}, async () => await OSM.getPreferences());
  }

  async function actionGetPreferencesRaw() {
    await runAction(
      "getPreferences(raw)",
      { handleStorage: "raw" },
      async () => await OSM.getPreferences({ handleStorage: "raw" }),
    );
  }

  async function actionGetPreference() {
    await runAction(
      "getPreference",
      { key: demoKey, storage: getStorage },
      async () => await OSM.getPreference(demoKey, { storage: getStorage }),
    );
  }

  async function actionGetPreferenceWithSchema() {
    const schema = createDemoSchema();
    await runAction(
      "getPreference(schema)",
      { key: demoKey, storage: getStorage, schema: "demoSchema" },
      async () => await OSM.getPreference(demoKey, { storage: getStorage, schema }),
    );
  }

  async function actionUpdatePreference() {
    const parsedValue = JSON.parse(jsonValue);
    await runAction(
      "updatePreference",
      { key: demoKey, storage: updateStorage, value: parsedValue },
      async () => await OSM.updatePreference(demoKey, parsedValue, { storage: updateStorage }),
    );
  }

  async function actionDeletePreference() {
    await runAction(
      "deletePreference",
      { key: demoKey, storage: deleteStorage },
      async () => await OSM.deletePreference(demoKey, { storage: deleteStorage }),
    );
  }

  async function actionUpdatePreferencesDeprecated() {
    await runAction(
      "updatePreferences(deprecated)",
      { key: demoKey, value: legacyValue },
      async () => await OSM.updatePreferences(demoKey, legacyValue),
    );
  }

  async function actionDeletePreferencesDeprecated() {
    await runAction(
      "deletePreferences(deprecated)",
      { key: demoKey },
      async () => await OSM.deletePreferences(demoKey),
    );
  }

  async function actionInvalidKeyError() {
    await runAction(
      "invalidKeyTest",
      { key: `${demoKey}/bad` },
      async () => await OSM.getPreference(`${demoKey}/bad`),
    );
  }

  async function actionMalformedJsonAndSchema() {
    await runAction(
      "writeMalformedJsonViaDeprecated",
      { key: demoKey, value: "{not-json}" },
      async () => await OSM.updatePreferences(demoKey, "{not-json}"),
    );
    await actionGetPreferenceWithSchema();
  }

  async function actionSingleOverflowError() {
    const tooLong = "x".repeat(300);
    await runAction(
      "singleOverflowTest",
      { key: demoKey, storage: "single", length: tooLong.length },
      async () => await OSM.updatePreference(demoKey, tooLong, { storage: "single" }),
    );
  }

  async function actionSimulateBrokenRoot() {
    await runAction(
      "manualSetRoot",
      { key: `${demoKey}:root`, value: manualRootHashes },
      async () => await OSM.updatePreferences(`${demoKey}:root`, manualRootHashes),
    );
  }

  async function actionSimulateOrphanChunk() {
    await runAction(
      "manualSetChunk",
      { key: `${demoKey}:${manualChunkHash}`, value: manualChunkValue },
      async () => await OSM.updatePreferences(`${demoKey}:${manualChunkHash}`, manualChunkValue),
    );
  }

  async function actionDeleteManualChunk() {
    await runAction(
      "manualDeleteChunk",
      { key: `${demoKey}:${manualChunkHash}` },
      async () => await OSM.deletePreferences(`${demoKey}:${manualChunkHash}`),
    );
  }

  async function actionDeleteManualRoot() {
    await runAction(
      "manualDeleteRoot",
      { key: `${demoKey}:root` },
      async () => await OSM.deletePreferences(`${demoKey}:root`),
    );
  }

  async function runScenarioBaseline() {
    onLoadShortPreset();
    await runAction("scenario:baseline:load-short", {}, async () => "loaded short preset");
    const parsed = JSON.parse('{"theme":"dark","fontSize":14,"items":["a","b"]}');
    await runAction(
      "scenario:baseline:update-single",
      { key: demoKey, storage: "single", value: parsed },
      async () => await OSM.updatePreference(demoKey, parsed, { storage: "single" }),
    );
    await runAction(
      "scenario:baseline:get-single",
      { key: demoKey, storage: "single" },
      async () => await OSM.getPreference(demoKey, { storage: "single" }),
    );
    await onRefreshStorage();
  }

  async function runScenarioSplit() {
    onLoadLongPreset();
    await runAction("scenario:split:load-long", {}, async () => "loaded long preset");
    const longValue = {
      theme: "dark",
      fontSize: 14,
      items: Array.from({ length: 120 }, (_, i) => `item-${i}`),
      note: "long payload for split storage demo",
    };
    await runAction(
      "scenario:split:update-split",
      { key: demoKey, storage: "split" },
      async () => await OSM.updatePreference(demoKey, longValue, { storage: "split" }),
    );
    await runAction(
      "scenario:split:get-split",
      { key: demoKey, storage: "split" },
      async () => await OSM.getPreference(demoKey, { storage: "split" }),
    );
    await runAction(
      "scenario:split:get-raw",
      { handleStorage: "raw" },
      async () => await OSM.getPreferences({ handleStorage: "raw" }),
    );
    await onRefreshStorage();
  }

  async function runScenarioConflict() {
    const longValue = {
      theme: "conflict",
      fontSize: 16,
      items: Array.from({ length: 120 }, (_, i) => `conflict-${i}`),
    };
    await runAction(
      "scenario:conflict:ensure-split",
      { key: demoKey },
      async () => await OSM.updatePreference(demoKey, longValue, { storage: "split" }),
    );
    await runAction(
      "scenario:conflict:add-single-deprecated",
      { key: demoKey, value: legacyValue },
      async () => await OSM.updatePreferences(demoKey, legacyValue),
    );
    await runAction(
      "scenario:conflict:get-auto-expected-error",
      { key: demoKey, storage: "auto" },
      async () => await OSM.getPreference(demoKey, { storage: "auto" }),
    );
    await runAction(
      "scenario:conflict:update-auto-expected-error",
      { key: demoKey, storage: "auto" },
      async () =>
        await OSM.updatePreference(demoKey, { theme: "x", fontSize: 12 }, { storage: "auto" }),
    );
  }

  async function runScenarioCleanup() {
    await runAction(
      "scenario:cleanup:delete-single",
      { key: demoKey, storage: "single" },
      async () => await OSM.deletePreference(demoKey, { storage: "single" }),
    );
    await runAction(
      "scenario:cleanup:get-auto",
      { key: demoKey, storage: "auto" },
      async () => await OSM.getPreference(demoKey, { storage: "auto" }),
    );
    await runAction(
      "scenario:cleanup:update-auto",
      { key: demoKey, storage: "auto" },
      async () =>
        await OSM.updatePreference(demoKey, { theme: "clean", fontSize: 18 }, { storage: "auto" }),
    );
    await onRefreshStorage();
  }

  return (
    <section style={{ border: "1px solid #bbb", padding: 12, marginBottom: 12 }}>
      <h2 style={{ marginTop: 0 }}>4) Example Actions</h2>
      <p style={{ marginTop: 0 }}>
        Run actions from the updated preference examples and inspect outputs in the log.
      </p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <button onClick={() => actionGetPreferencesMerged()}>getPreferences (merged)</button>
        <button onClick={() => actionGetPreferencesRaw()}>getPreferences (raw)</button>
        <button onClick={() => actionGetPreference()}>getPreference</button>
        <button onClick={() => actionGetPreferenceWithSchema()}>getPreference with schema</button>
        <button onClick={() => actionUpdatePreference()}>updatePreference</button>
        <button onClick={() => actionDeletePreference()}>deletePreference</button>
        <button onClick={() => actionUpdatePreferencesDeprecated()}>
          updatePreferences (deprecated)
        </button>
        <button onClick={() => actionDeletePreferencesDeprecated()}>
          deletePreferences (deprecated)
        </button>
      </div>

      <h3>Scenario one-click runs</h3>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <button onClick={() => runScenarioBaseline()}>Run baseline scenario</button>
        <button onClick={() => runScenarioSplit()}>Run split scenario</button>
        <button onClick={() => runScenarioConflict()}>Run conflict scenario</button>
        <button onClick={() => runScenarioCleanup()}>Run cleanup scenario</button>
      </div>

      <h3>Error-case tests</h3>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <button onClick={() => actionInvalidKeyError()}>Invalid key chars</button>
        <button onClick={() => actionMalformedJsonAndSchema()}>
          Malformed JSON + schema issues
        </button>
        <button onClick={() => actionSingleOverflowError()}>Single overflow (&gt;255 chars)</button>
      </div>

      <h3>Manual split corruption tools</h3>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <button onClick={() => actionSimulateBrokenRoot()}>Set root with hashes (manual)</button>
        <button onClick={() => actionSimulateOrphanChunk()}>Set chunk key (manual)</button>
        <button onClick={() => actionDeleteManualChunk()}>Delete chunk key (manual)</button>
        <button onClick={() => actionDeleteManualRoot()}>Delete root key (manual)</button>
        <button onClick={() => onRefreshStorage()}>Refresh after manual edits</button>
      </div>

      <p style={{ marginBottom: 0 }}>
        Split max payload characters: <code>{OSM.PREFERENCE_SPLIT_MAX_PAYLOAD_BYTES}</code>
      </p>
    </section>
  );
}
