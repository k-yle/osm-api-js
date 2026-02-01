import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { FetchOptions } from "../_osmFetch";
import type { PreferenceResult, StorageMode } from "./chunked";
import {
  assertPreferenceKey,
  resolveValueForKey,
  validatePreferenceValue,
} from "./chunked";
import { getPreferences } from "./getPreferences";

export interface GetPreferenceOptions extends FetchOptions {
  /** How to resolve the key: 'auto' (detect), 'single' (one API key), 'split' (multiple keys). Default 'auto'. */
  storage?: StorageMode;
  /** If provided, stored value is parsed as JSON and validated; returns PreferenceResult. */
  schema?: StandardSchemaV1;
}

/**
 * Gets a single preference by key. Resolves single vs split storage per `storage` option.
 * With `schema`, parses JSON and validates; returns `PreferenceResult<T>`. Without schema, returns raw string or null.
 *
 * @param key - Logical preference key.
 * @param options - Optional storage mode, schema, and fetch options.
 * @returns With schema: `{ value }` | `{ issues }` | null. Without schema: string | null.
 * @throws If storage is 'auto' and the key exists as both single and split (conflict).
 */
export async function getPreference(
  key: string,
  options?: GetPreferenceOptions
): Promise<string | null>;

export async function getPreference<S extends StandardSchemaV1>(
  key: string,
  options: GetPreferenceOptions & { schema: S }
): Promise<PreferenceResult<StandardSchemaV1.InferOutput<S>>>;

export async function getPreference(
  key: string,
  options?: GetPreferenceOptions
): Promise<string | null | PreferenceResult<unknown>> {
  assertPreferenceKey(key);
  const storage = options?.storage ?? "auto";
  const schema = options?.schema;
  const preferences = await getPreferences({
    ...options,
    handleStorage: "raw",
  });
  const raw = resolveValueForKey(preferences, key, storage);
  if (raw === null) return null;
  if (schema !== undefined) return validatePreferenceValue(raw, schema);
  return raw;
}
