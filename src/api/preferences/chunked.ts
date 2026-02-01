import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { Tags } from "../../types";
import type { FetchOptions } from "../_osmFetch";
import { deletePreferences } from "./deletePreferences";
import { getPreferences } from "./getPreferences";
import { updatePreferences } from "./updatePreferences";

/**
 * Result of a validated preference read (single key or split). Use with the
 * schema overload of {@link getPreference}.
 * - `null`: No stored data or read failed (missing key or split root/chunk).
 * - `{ value: T }`: Stored value was valid JSON and passed schema validation.
 * - `{ issues }`: Stored value was present but JSON parse or schema validation failed.
 * @internal Prefer {@link PreferenceResult} in public API.
 */
export type ChunkedPreferenceResult<T> =
  | { value: T }
  | { issues: readonly StandardSchemaV1.Issue[] }
  | null;

/** Alias of {@link ChunkedPreferenceResult}. Result of getPreference with schema. */
export type PreferenceResult<T> = ChunkedPreferenceResult<T>;

const VALUE_LIMIT = 255;
const HASH_LENGTH = 8;
/** Max hashes that fit in root value (255 chars): each hash 8 chars + comma */
const MAX_CHUNKS = Math.floor(VALUE_LIMIT / (HASH_LENGTH + 1));
const MAX_PAYLOAD_BYTES = MAX_CHUNKS * VALUE_LIMIT;

/** Characters disallowed in preference keys (unsafe in URL path). */
const PREFERENCE_KEY_DISALLOWED = /[/?#\\]/;

/**
 * Validates that a preference key does not contain characters unsafe in the OSM API path.
 * @throws If key contains / ? # or \\
 */
export function assertPreferenceKey(key: string): void {
  if (PREFERENCE_KEY_DISALLOWED.test(key)) {
    throw new Error(
      `Preference key must not contain / ? # or \\ (unsafe in URL path): "${key}"`
    );
  }
}

/** @internal First 8 hex chars of SHA-256 of content. Same algorithm in Swift etc. for interoperability. */
async function chunkHash(content: string): Promise<string> {
  const buf = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(content)
  );
  const hex = [...new Uint8Array(buf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex.slice(0, HASH_LENGTH);
}

function rootKey(prefix: string): string {
  return `${prefix}:root`;
}

function chunkKey(prefix: string, hash: string): string {
  return `${prefix}:${hash}`;
}

/** True if key is a chunk key for prefix (prefix:8hex). */
function isChunkKeyForPrefix(key: string, prefix: string): boolean {
  const suffix = prefix.length + 1;
  return (
    key.startsWith(prefix + ":") &&
    key.length === suffix + HASH_LENGTH &&
    /^[\da-f]{8}$/i.test(key.slice(suffix))
  );
}

function unpackChunkedRaw(preferences: Tags, prefix: string): string | null {
  const root = preferences[rootKey(prefix)];
  if (root === undefined || root === "") {
    return null;
  }
  const hashes = root.split(",").filter(Boolean);
  const parts: string[] = [];
  for (const h of hashes) {
    const key = chunkKey(prefix, h);
    const chunk = preferences[key];
    if (chunk === undefined) {
      return null;
    }
    parts.push(chunk);
  }
  return parts.join("");
}

/** Storage mode for single-key preference ops: auto (detect/by length), single (one API key), split (multiple keys). */
export type StorageMode = "auto" | "single" | "split";

/** Whether the map has a single key for this logical preference. */
export function hasSingleKey(preferences: Tags, key: string): boolean {
  return key in preferences;
}

/** Whether the map has split storage for this logical preference (prefix:root present). */
export function hasSplitKey(preferences: Tags, key: string): boolean {
  return rootKey(key) in preferences;
}

/**
 * Resolve the string value for a key from a preferences map according to storage mode.
 * @throws If storage is 'auto' and both single and split are present (conflict).
 */
export function resolveValueForKey(
  preferences: Tags,
  key: string,
  storage: StorageMode
): string | null {
  const single = hasSingleKey(preferences, key);
  const split = hasSplitKey(preferences, key);
  if (storage === "single") {
    return single ? (preferences[key] ?? null) : null;
  }
  if (storage === "split") {
    return unpackChunkedRaw(preferences, key);
  }
  // auto
  if (single && split) {
    throw new Error(
      `Preference "${key}" exists as both a single key and split storage. Set storage: 'single' or 'split' to resolve.`
    );
  }
  if (single) return preferences[key] ?? null;
  if (split) return unpackChunkedRaw(preferences, key);
  return null;
}

export interface PackChunkedResult {
  rootKey: string;
  rootValue: string;
  chunks: Record<string, string>;
  oldKeysToDelete: string[];
}

/**
 * Splits a value into multiple preference entries (split storage). Use with
 * {@link unpackChunked} for round-trip. Safe write order: write all `chunks` in
 * parallel (with retries), then `rootKey`/`rootValue`, then `oldKeysToDelete`.
 * Chunks-first so readers never see a root pointing to missing chunks.
 *
 * @param prefix - Logical key (e.g. `ESS`, `ESS:editor-settings`). URL-safe.
 * @param value - String to store. Must not exceed {@link packChunked.MAX_PAYLOAD_BYTES}.
 * @param previousRootValue - Comma-separated hashes from previous root; used to compute `oldKeysToDelete`.
 * @param valueLimit - Max chars per chunk. Default 255 (OSM limit).
 * @returns Keys/values to write and keys to delete after updating root.
 * @throws If value length exceeds {@link packChunked.MAX_PAYLOAD_BYTES}.
 */
export async function packChunked(
  prefix: string,
  value: string,
  previousRootValue?: string,
  valueLimit: number = VALUE_LIMIT
): Promise<PackChunkedResult> {
  if (value.length > MAX_PAYLOAD_BYTES) {
    throw new Error(
      `Preference value exceeds maximum size (${MAX_PAYLOAD_BYTES} bytes). Use a shorter value or split across multiple prefixes.`
    );
  }

  const numberChunks =
    value.length === 0 ? 1 : Math.ceil(value.length / valueLimit);
  const chunkStrings = Array.from({ length: numberChunks }, (_, index) =>
    value.slice(index * valueLimit, (index + 1) * valueLimit)
  );

  const hashes: string[] = [];
  const chunks: Record<string, string> = {};
  for (const chunk of chunkStrings) {
    const h = await chunkHash(chunk);
    hashes.push(h);
    chunks[chunkKey(prefix, h)] = chunk;
  }

  const rootValue = hashes.join(",");
  const previousHashes = previousRootValue
    ? previousRootValue.split(",").filter(Boolean)
    : [];
  const newSet = new Set(hashes);
  const oldKeysToDelete = previousHashes
    .filter((h) => !newSet.has(h))
    .map((h) => chunkKey(prefix, h));

  return {
    rootKey: rootKey(prefix),
    rootValue,
    chunks,
    oldKeysToDelete,
  };
}

/** Max payload size in characters. Check before calling to avoid throwing. */
packChunked.MAX_PAYLOAD_BYTES = MAX_PAYLOAD_BYTES;

/** Max length (chars) for one logical preference when stored as split. */
export const PREFERENCE_SPLIT_MAX_PAYLOAD_BYTES = MAX_PAYLOAD_BYTES;

/** Number of attempts (including initial) for each chunk PUT when writing split storage. */
const CHUNK_PUT_ATTEMPTS = 3;

/** Parse JSON and validate with schema; return result or issues. Used by getPreference and split reads. */
export async function validatePreferenceValue<S extends StandardSchemaV1>(
  raw: string,
  schema: S
): Promise<PreferenceResult<StandardSchemaV1.InferOutput<S>>> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      issues: [{ message: "Invalid JSON" }],
    };
  }
  const result = await Promise.resolve(schema["~standard"].validate(parsed));
  if ("value" in result) {
    return { value: result.value };
  }
  return { issues: result.issues };
}

async function validateChunkedRaw<S extends StandardSchemaV1>(
  raw: string,
  schema: S
): Promise<ChunkedPreferenceResult<StandardSchemaV1.InferOutput<S>>> {
  return validatePreferenceValue(raw, schema);
}

/**
 * Reads a split-storage preference from a preferences map. Returns the concatenated
 * string or `null` if no root or a chunk is missing.
 *
 * @param preferences - Result of {@link getPreferences}.
 * @param prefix - Same prefix used when writing.
 */
export function unpackChunked(preferences: Tags, prefix: string): string | null;

/**
 * Reads a split-storage preference and validates it with a schema. Stored value is
 * assumed to be JSON. Use when you already have a preferences map (e.g. from
 * {@link getPreferences}) and want typed, validated output without an extra fetch.
 *
 * @param preferences - Result of {@link getPreferences}.
 * @param prefix - Same prefix used when writing.
 * @param schema - Any [Standard Schema](https://github.com/standard-schema/standard-schema) implementation (e.g. Zod 4, Valibot).
 * @returns `{ value }` on success, `{ issues }` on parse/validation failure, or `null` if no data or chunk missing.
 */
export function unpackChunked<S extends StandardSchemaV1>(
  preferences: Tags,
  prefix: string,
  schema: S
): Promise<ChunkedPreferenceResult<StandardSchemaV1.InferOutput<S>>>;

export function unpackChunked(
  preferences: Tags,
  prefix: string,
  schema?: StandardSchemaV1
): string | null | Promise<ChunkedPreferenceResult<unknown>> {
  const raw = unpackChunkedRaw(preferences, prefix);
  if (raw === null) return null;
  if (schema !== undefined) return validateChunkedRaw(raw, schema);
  return raw;
}

/**
 * Fetches and reassembles a split-storage preference (root + chunks).
 *
 * @param prefix - Logical key used when storing.
 * @returns The stored string, or `null` if not set or corrupted.
 */
export async function getChunkedPreference(
  prefix: string,
  options?: FetchOptions
): Promise<string | null>;

/**
 * Fetches and reassembles a split-storage preference, then parses JSON and validates
 * with a schema. Stored value is assumed to be JSON; store with
 * `JSON.stringify(...)` (or validate then stringify) for round-trip. Pass any
 * [Standard Schema](https://github.com/standard-schema/standard-schema) implementation
 * (e.g. Zod 4, Valibot).
 *
 * @param prefix - Logical key used when storing.
 * @param schema - Schema to validate and infer output type.
 * @param options - Optional fetch options.
 * @returns `{ value: T }` on success, `{ issues }` on parse/validation failure, or `null` if no data or chunk missing.
 */
export async function getChunkedPreference<S extends StandardSchemaV1>(
  prefix: string,
  schema: S,
  options?: FetchOptions
): Promise<ChunkedPreferenceResult<StandardSchemaV1.InferOutput<S>>>;

export async function getChunkedPreference(
  prefix: string,
  schemaOrOptions?: StandardSchemaV1 | FetchOptions,
  options?: FetchOptions
): Promise<string | null | ChunkedPreferenceResult<unknown>> {
  assertPreferenceKey(prefix);
  const isSchema =
    schemaOrOptions !== undefined &&
    typeof schemaOrOptions === "object" &&
    schemaOrOptions !== null &&
    "~standard" in schemaOrOptions;
  const schema = isSchema ? (schemaOrOptions as StandardSchemaV1) : undefined;
  const fetchOptions =
    schema === undefined ? (schemaOrOptions as FetchOptions) : options;
  const preferences = await getPreferences({
    ...fetchOptions,
    handleStorage: "raw",
  });
  const raw = unpackChunkedRaw(preferences, prefix);
  if (raw === null) return null;
  if (schema !== undefined) return validateChunkedRaw(raw, schema);
  return raw;
}

/**
 * Writes one chunk with retries. Used by setChunkedPreference so chunk PUTs can
 * be retried on transient network errors.
 */
async function putChunkWithRetry(
  key: string,
  chunkValue: string,
  options: FetchOptions | undefined,
  attempts: number
): Promise<void> {
  let lastErr: unknown;
  let attempt = 0;
  while (attempt < attempts) {
    try {
      await updatePreferences(key, chunkValue, options);
      return;
    } catch (e) {
      lastErr = e;
      attempt++;
    }
  }
  throw lastErr;
}

/**
 * Stores a value as a split-storage preference (root + chunks). Write order:
 * all chunks in parallel (each chunk retried up to 3 times), then root, then
 * delete old chunk keys. Chunks-first so readers never see a root without all
 * chunks present. Check
 * `value.length <= packChunked.MAX_PAYLOAD_BYTES` before calling to avoid throwing.
 *
 * @param prefix - Logical key (e.g. `ESS:editor-settings`).
 * @param value - String to store.
 * @throws If value length exceeds {@link packChunked.MAX_PAYLOAD_BYTES}.
 * @throws If any chunk write or root write fails after retries; some chunk
 * keys may be written (orphans) but root is not, so readers see previous state.
 */
export async function setChunkedPreference(
  prefix: string,
  value: string,
  options?: FetchOptions
): Promise<void> {
  assertPreferenceKey(prefix);
  const preferences = await getPreferences({
    ...options,
    handleStorage: "raw",
  });
  const previousRoot = preferences[rootKey(prefix)];

  const {
    rootKey: rk,
    rootValue: rv,
    chunks,
    oldKeysToDelete,
  } = await packChunked(prefix, value, previousRoot);

  const newHashes = new Set(rv.split(",").filter(Boolean));
  const orphanChunkKeys = Object.keys(preferences).filter(
    (k) => isChunkKeyForPrefix(k, prefix) && !newHashes.has(k.slice(prefix.length + 1))
  );
  const keysToDelete = [...new Set([...oldKeysToDelete, ...orphanChunkKeys])];

  await Promise.all(
    Object.entries(chunks).map(([key, chunkValue]) =>
      putChunkWithRetry(key, chunkValue, options, CHUNK_PUT_ATTEMPTS)
    )
  );
  await updatePreferences(rk, rv, options);

  for (const key of keysToDelete) {
    await deletePreferences(key, options);
  }
}

/**
 * Removes a split-storage preference: deletes root and all its chunks.
 */
export async function deleteChunkedPreference(
  prefix: string,
  options?: FetchOptions
): Promise<void> {
  assertPreferenceKey(prefix);
  const preferences = await getPreferences({
    ...options,
    handleStorage: "raw",
  });
  const root = preferences[rootKey(prefix)];
  if (root === undefined || root === "") {
    return;
  }
  const hashes = root.split(",").filter(Boolean);
  await deletePreferences(rootKey(prefix), options);
  for (const h of hashes) {
    await deletePreferences(chunkKey(prefix, h), options);
  }
}

/**
 * Builds a logical key map from raw preferences: each split prefix (X:root + X:hash*)
 * becomes one entry X → concatenated value; other keys are passed through.
 * Used by getPreferences (default merged). Chunk keys are identified as prefix + ":"
 * + 8 hex chars for any prefix that has a ":root" key (so logical keys can contain ":").
 */
export function mergePreferencesToLogical(
  preferences: Tags
): Record<string, string> {
  const merged: Record<string, string> = {};
  const rootPrefixes = Object.keys(preferences)
    .filter((k) => k.endsWith(":root"))
    .map((k) => k.slice(0, -5));
  for (const key of Object.keys(preferences)) {
    if (key.endsWith(":root")) {
      const prefix = key.slice(0, -5);
      const value = unpackChunkedRaw(preferences, prefix);
      if (value !== null) {
        merged[prefix] = value;
      }
    } else if (
      !rootPrefixes.some((prefix) => isChunkKeyForPrefix(key, prefix))
    ) {
      const v = preferences[key];
      if (v !== undefined) {
        merged[key] = v;
      }
    }
  }
  return merged;
}

/**
 * Writes a preference value according to storage mode. Used by updatePreference.
 * @throws If storage is 'single' and value length exceeds 255.
 */
export async function writePreferenceValue(
  key: string,
  value: string,
  storage: StorageMode,
  options?: FetchOptions
): Promise<void> {
  if (storage === "single") {
    if (value.length > VALUE_LIMIT) {
      throw new Error(
        "Preference value exceeds 255 characters (OSM limit). Use storage: 'auto' or 'split' for longer values."
      );
    }
    await updatePreferences(key, value, options);
    return;
  }
  if (storage === "split") {
    await setChunkedPreference(key, value, options);
    return;
  }
  // auto
  await (value.length <= VALUE_LIMIT
    ? updatePreferences(key, value, options)
    : setChunkedPreference(key, value, options));
}
