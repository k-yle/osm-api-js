# getPreference

Gets one preference by key. What you get depends on `storage`. Returns `string | null` (no schema) or `PreferenceResult<T>` (with schema).

## Split keys

See [Split storage](updatePreference.md#split-storage) for how split keys look.

## Schema and types

> [!NOTE]
> Prefer using `getPreference` with a runtime validation schema (e.g. [Zod](https://zod.dev)) so you get typed, validated data and clear parse/validation errors.

See [Schema and types](updatePreference.md#schema-and-types).

## Examples

### Database state

Assume the OSM DB has the following data in the user's preferences:

```yaml
# Single key
my-key=foobar

# Split key
my-key:root=a1b2c3d4,e5f6g7h8
my-key:a1b2c3d4={"theme":"dark","fontSize":14,"items":["a","b","c",
my-key:e5f6g7h8="d","e"]}
```

### Get with `storage: auto`

`auto` is the default. It looks for both single and split; if only one form exists, returns its value. If **both** exist for the same key it **throws** (use `storage: 'single'` or `'split'` to resolve). If neither exists, returns `null`.

With the example DB state above, `my-key` exists as both single and split, so the following **throws**. Use `storage: 'single'` or `'split'` (below) to read.

```ts
import { getPreference } from "osm-api";

// With example DB state (both present) this throws:
await getPreference("my-key");
// or…
await getPreference("my-key", { storage: "auto" });
// → throws  Use storage: 'single' or 'split' to get a value.
```

Example when only one storage form is present (e.g. after deleting the single key so only split remains):

```ts
import { deletePreference, getPreference } from "osm-api";

// With example DB state (both present): remove single key so only split remains
await deletePreference("my-key", { storage: "single" });
// Now only the split keys (root + chunks) are present
const value = await getPreference("my-key", { storage: "auto" });
// → string | null
console.log(value);
// With example DB: '{"theme":"dark","fontSize":14,"items":["a","b","c","d","e"]}'
```

### Get with `storage: single`

Reads only the single API key. Split keys are ignored. With the example DB state this returns the single key’s value.

```ts
const value = await getPreference("my-key", { storage: "single" });
// → string | null
console.log(value);
// With example DB: "foobar"
```

### Get with `storage: split`

Reads only split storage (root + chunks). Single key is ignored. With the example DB state this returns the concatenated split value.

```ts
const value = await getPreference("my-key", { storage: "split" });
// → string | null
console.log(value);
// With example DB: '{"theme":"dark","fontSize":14,"items":["a","b","c","d","e"]}'
```

### Usage without schema – returns string

Return type is `string | null`. With the example DB state use `storage: 'single'` or `'split'` (auto would throw).

```ts
// Single key: returns "foobar" with example DB
const value = await getPreference("my-key", { storage: "single" });
// or getPreference("my-key", { storage: "split" }) for the concatenated JSON string
// → string | null
console.log(value);
// With example DB (single): "foobar"  or  (split): '{"theme":"dark","fontSize":14,"items":["a","b","c","d","e"]}'
```

### Usage with schema – typed and validated return value

Return type is `PreferenceResult<T>` (`{ value }` | `{ issues }` | `null`). With the example DB state use `storage: 'split'` so the concatenated JSON is parsed and validated.

```ts
import { getPreference } from "osm-api";
import { z } from "zod";

const schema = z.object({
  theme: z.string(),
  fontSize: z.number(),
  items: z.array(z.string()),
});
const result = await getPreference("my-key", { schema, storage: "split" });
// → PreferenceResult<{ theme: string; fontSize: number; items: string[] }>

if (result === null) {
  console.log(null); // not set or missing chunk
} else if ("issues" in result) {
  console.log(result.issues); // parse or validation failed
} else {
  console.log(result.value);
  // With example DB: { theme: "dark", fontSize: 14, items: ["a", "b", "c", "d", "e"] }
}
```

### Root and chunks out of sync (`storage: split`)

When using `storage: 'split'` or `'auto'`, the value is read from the root manifest plus chunk keys. Preferences are fetched in **one request** (`getPreferences`); there are no per-chunk network calls.

- **Chunk key missing:** The chunk key is not in the returned map (never written, or deleted, or from a failed write). `unpackChunkedRaw` sees the key as `undefined` and returns `null`. So “root present but chunk missing” → `null` (same as key not present).
- **Network error:** If the single `getPreferences()` call fails (network/auth), it **throws**. There is no “network error for a chunk” — you either get the full map or the call fails.

So “out of sync” (root present, one or more chunks missing) and “key not present” both yield `null`; only a failed fetch throws.

```ts
// Example: root exists, one chunk missing (e.g. failed split write)
// DB: my-key:root=a1b2c3d4,e5f6g7h8   my-key:a1b2c3d4="first 255 chars"  (my-key:e5f6g7h8 missing)
const value = await getPreference("my-key", { storage: "split" });
// → null  (missing chunk; same as key not present)
```

Orphan roots (root present, chunks missing) and orphan chunks (chunks with no or different root) are **not** auto-deleted by `getPreference`. A later successful `updatePreference` with split storage deletes old chunks from the previous root and any orphan chunk keys for that prefix; see [Cleanup](#cleanup) below.

## Error cases

- **Invalid key:** If the key contains `/`, `?`, `#`, or `\` → **throws** (see [Key format](updatePreference.md#key-format)).
- **Key not present:** Returns `null` (no throw). Same for missing root/chunk when using `storage: 'split'` or `'auto'`.
- **Root present, chunk missing (out of sync):** Returns `null` (no throw). See [Root and chunks out of sync](#root-and-chunks-out-of-sync-split-storage) above.
- **Conflict (auto only):** The key exists as **both** a single key and split storage → **throws** with a message; retry with `storage: 'single'` or `storage: 'split'`.
- **With schema:** Stored value is invalid JSON or fails validation → returns `{ issues: [...] }` (no throw). Use `"issues" in result` to detect.

## Cleanup

- **Orphan roots** (root present, one or more chunks missing): Not auto-deleted. `getPreference` returns `null`. To remove the orphan root and any remaining chunks, call `deletePreference(key, { storage: 'split' })`.
- **Orphan chunks** (chunk keys with no root or a different root, e.g. from a failed write): Not auto-deleted by reads. A later successful `updatePreference(key, value, { storage: 'split' })` (or `'auto'` with long value) deletes old chunks from the previous root **and** any chunk keys for that prefix that are not in the new root, so orphan chunks are cleaned up on the next successful split write.
