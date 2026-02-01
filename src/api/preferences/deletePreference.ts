import type { FetchOptions } from "../_osmFetch";
import type { StorageMode } from "./chunked";
import {
  assertPreferenceKey,
  deleteChunkedPreference,
  hasSingleKey,
  hasSplitKey,
} from "./chunked";
import { deletePreferences } from "./deletePreferences";
import { getPreferences } from "./getPreferences";

export interface DeletePreferenceOptions extends FetchOptions {
  /** What to remove: 'auto' (both single and split if present), 'single' (one API key only), 'split' (split storage only). Default 'auto'. */
  storage?: StorageMode;
}

/**
 * Deletes a single preference. Per storage mode: 'auto' removes both single key and split keys if present;
 * 'single' removes only the single key; 'split' removes only the split storage (root + chunks).
 *
 * @param key - Logical preference key.
 * @param options - Optional storage mode and fetch options.
 */
export async function deletePreference(
  key: string,
  options?: DeletePreferenceOptions
): Promise<void> {
  assertPreferenceKey(key);
  const storage = options?.storage ?? "auto";
  const preferences = await getPreferences({
    ...options,
    handleStorage: "raw",
  });
  if (storage === "single") {
    if (hasSingleKey(preferences, key)) {
      await deletePreferences(key, options);
    }
    return;
  }
  if (storage === "split") {
    await deleteChunkedPreference(key, options);
    return;
  }
  // auto: remove both
  if (hasSingleKey(preferences, key)) {
    await deletePreferences(key, options);
  }
  if (hasSplitKey(preferences, key)) {
    await deleteChunkedPreference(key, options);
  }
}
