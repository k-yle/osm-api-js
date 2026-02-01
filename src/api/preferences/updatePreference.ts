import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { FetchOptions } from "../_osmFetch";
import type { StorageMode } from "./chunked";
import {
  assertPreferenceKey,
  hasSingleKey,
  hasSplitKey,
  writePreferenceValue,
} from "./chunked";
import { getPreferences } from "./getPreferences";

export interface UpdatePreferenceOptions extends FetchOptions {
  /** How to store: 'auto' (by length), 'single' (one API key, error if >255), 'split' (multiple keys). Default 'auto'. */
  storage?: StorageMode;
  /** If provided, value is validated before writing. */
  schema?: StandardSchemaV1;
}

/**
 * Writes a single preference. Value is JSON-serialized. With schema, value is validated first.
 * Storage mode: 'auto' uses single key if serialized length ≤255 else split; 'single' errors if >255; 'split' always uses split storage.
 *
 * @param key - Logical preference key.
 * @param value - Value to store (object, array, string, number, boolean). Will be JSON.stringify'd.
 * @param options - Optional storage mode, schema, and fetch options.
 * @throws If schema validation fails. If storage is 'single' and serialized value exceeds 255 chars. If storage is 'auto' and the key exists as both single and split (conflict).
 */
export async function updatePreference(
  key: string,
  value: unknown,
  options?: UpdatePreferenceOptions
): Promise<void> {
  assertPreferenceKey(key);
  const storage = options?.storage ?? "auto";
  const schema = options?.schema;
  let serialized: string;
  if (schema === undefined) {
    serialized = JSON.stringify(value);
  } else {
    const result = await Promise.resolve(schema["~standard"].validate(value));
    if ("value" in result) {
      serialized = JSON.stringify(result.value);
    } else {
      throw new Error(
        `Preference validation failed: ${JSON.stringify(result.issues)}`
      );
    }
  }
  if (storage === "auto") {
    const preferences = await getPreferences({
      ...options,
      handleStorage: "raw",
    });
    if (hasSingleKey(preferences, key) && hasSplitKey(preferences, key)) {
      throw new Error(
        `Preference "${key}" exists as both a single key and split storage. Set storage: 'single' or 'split' to resolve.`
      );
    }
  }
  await writePreferenceValue(key, serialized, storage, options);
}
