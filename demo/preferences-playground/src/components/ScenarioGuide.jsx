import React from "react";

const EXAMPLE_LINKS = [
  ["getPreferences", "https://github.com/osmlab/osm-api-js/blob/main/examples/getPreferences.md"],
  ["getPreference", "https://github.com/osmlab/osm-api-js/blob/main/examples/getPreference.md"],
  [
    "updatePreference",
    "https://github.com/osmlab/osm-api-js/blob/main/examples/updatePreference.md",
  ],
  [
    "deletePreference",
    "https://github.com/osmlab/osm-api-js/blob/main/examples/deletePreference.md",
  ],
  [
    "updatePreferences (deprecated)",
    "https://github.com/osmlab/osm-api-js/blob/main/examples/updatePreferences.md",
  ],
  [
    "deletePreferences (deprecated)",
    "https://github.com/osmlab/osm-api-js/blob/main/examples/deletePreferences.md",
  ],
  ["dev-server", "https://github.com/osmlab/osm-api-js/blob/main/examples/dev-server.md"],
];

const SOURCE_LINKS = [
  [
    "getPreferences.ts",
    "https://github.com/osmlab/osm-api-js/blob/main/src/api/preferences/getPreferences.ts",
  ],
  [
    "getPreference.ts",
    "https://github.com/osmlab/osm-api-js/blob/main/src/api/preferences/getPreference.ts",
  ],
  [
    "updatePreference.ts",
    "https://github.com/osmlab/osm-api-js/blob/main/src/api/preferences/updatePreference.ts",
  ],
  [
    "deletePreference.ts",
    "https://github.com/osmlab/osm-api-js/blob/main/src/api/preferences/deletePreference.ts",
  ],
  ["chunked.ts", "https://github.com/osmlab/osm-api-js/blob/main/src/api/preferences/chunked.ts"],
];

export function ScenarioGuide() {
  return (
    <section style={{ border: "1px solid #bbb", padding: 12, marginBottom: 12 }}>
      <h2 style={{ marginTop: 0 }}>5) What to test and see</h2>
      <p style={{ marginTop: 0 }}>
        Use these guided flows to reproduce commit-specific preference behavior.
      </p>

      <h3>Step-by-step scenarios</h3>
      <ol>
        <li>
          Baseline single write/read: click <code>Run baseline scenario</code> in Example Actions.
          <div>Expected: single value is readable with storage=single.</div>
        </li>
        <li>
          Split write/read: click <code>Run split scenario</code>.
          <div>Expected: root + chunks in raw storage, split read succeeds.</div>
        </li>
        <li>
          Auto conflict: click <code>Run conflict scenario</code>.
          <div>
            Expected: when both single and split exist, auto read/update throw conflict errors.
          </div>
        </li>
        <li>
          Cleanup: click <code>Run cleanup scenario</code>.
          <div>
            Expected: explicit storage cleanup resolves conflict, then auto calls work again.
          </div>
        </li>
      </ol>

      <h3>Error simulation helpers</h3>
      <ul>
        <li>Invalid key chars test (`/ ? # \\`).</li>
        <li>Malformed JSON + schema issues test.</li>
        <li>Single-storage overflow test (&gt;255 chars serialized).</li>
        <li>Manual broken root/chunk simulation controls.</li>
      </ul>

      <h3>Example docs</h3>
      <ul>
        {EXAMPLE_LINKS.map(([label, url]) => (
          <li key={label}>
            <a href={url} target="_blank" rel="noreferrer">
              {label}
            </a>
          </li>
        ))}
      </ul>

      <h3>Source links</h3>
      <ul>
        {SOURCE_LINKS.map(([label, url]) => (
          <li key={label}>
            <a href={url} target="_blank" rel="noreferrer">
              {label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
