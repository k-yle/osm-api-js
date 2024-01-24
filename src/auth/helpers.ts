import { getConfig } from "../config";

/** @internal return a sha256 hash, encoded using base64-url */
export async function sha256(text: string) {
  const data = new TextEncoder().encode(text);
  const buf = await window.crypto.subtle.digest("SHA-256", data);

  // eslint-disable-next-line unicorn/prefer-code-point -- not sure if this autofix is safe
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));

  return base64.replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

/** @internal */
export function getRandomString() {
  return [...window.crypto.getRandomValues(new Uint32Array(32))]
    .map((m) => `0${m.toString(16)}`.slice(-2))
    .join("");
}

/** @internal */
export function getOAuthBaseUrl() {
  let baseUrl = getConfig().apiUrl;

  // special step for the main instance of OSM...
  if (baseUrl === "https://api.openstreetmap.org") {
    baseUrl = "https://www.openstreetmap.org";
  }
  return baseUrl;
}
