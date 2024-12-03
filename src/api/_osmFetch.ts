import { getAuthToken } from "../auth";
import { getConfig } from "../config";
import { xmlParser } from "./_xml";

const toBase64 = (text: string): string => {
  if (typeof btoa === "undefined") {
    return Buffer.from(text, "binary").toString("base64");
  }
  return btoa(text);
};

/** @internal */
export async function osmFetch<T>(
  path: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  qsObject?: Record<string, any>,
  fetchOptions?: RequestInit
): Promise<T> {
  const { apiUrl, authHeader, basicAuth, userAgent } = getConfig();

  const maybeBasicAuthHeader =
    basicAuth &&
    `Basic ${toBase64(`${basicAuth.username}:${basicAuth.password}`)}`;

  const maybeOAuth2Token = getAuthToken() && `Bearer ${getAuthToken()}`;

  let qs = new URLSearchParams(qsObject).toString();
  qs &&= `?${qs}`;

  const response = await fetch(`${apiUrl}/api${path}${qs}`, {
    ...fetchOptions,
    headers: {
      Authorization:
        authHeader || maybeBasicAuthHeader || maybeOAuth2Token || "",
      "User-Agent": userAgent,
      ...fetchOptions?.headers,
    },
  });

  const contentType = response.headers.get("Content-Type");

  if (contentType?.startsWith("application/xml")) {
    const xml = await response.text();
    const json = await xmlParser.parse(xml);
    return json as T;
  }

  if (contentType?.startsWith("application/json")) {
    return response.json();
  }

  if (response.ok) {
    // some other content type, but not an error
    // (e.g. plaintext when creating a changeset)
    return (await response.text()) as unknown as T;
  }

  const error = new Error(`OSM API: ${await response.text()}`);
  error.cause = response.status;
  throw error;
}
