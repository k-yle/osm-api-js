import type { Tags } from "../../types";
import { type FetchOptions, osmFetch } from "../_osmFetch";
import { mergePreferencesToLogical } from "./chunked";

/** How storage appears in the output: raw (API as-is) or merged (one entry per logical preference). */
export type HandleStorage = "raw" | "merged";

export interface GetPreferencesOptions extends FetchOptions {
  /** Default 'merged'. Use 'raw' to get API keys as returned (including split keys). */
  handleStorage?: HandleStorage;
}

/**
 * Fetches all preferences for the logged-in user. OSM API returns full key-value only.
 *
 * @param options - Optional handleStorage ('raw' | 'merged') and fetch options.
 * @returns Record<string, string> with logical keys (default merged), or raw Tags when handleStorage is 'raw'.
 */
export async function getPreferences(
  options?: GetPreferencesOptions
): Promise<Record<string, string> | Tags> {
  const raw = await osmFetch<{ preferences: Tags }>(
    "/0.6/user/preferences.json",
    undefined,
    options
  );
  const prefs = raw.preferences;
  if (options?.handleStorage === "raw") {
    return prefs;
  }
  return mergePreferencesToLogical(prefs);
}
