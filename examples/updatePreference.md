# updatePreference

Writes one preference by key. Value is JSON-serialized. With `storage: 'auto'` (default), values ≤255 chars use a single API key; longer values use split storage. For schema (e.g. Zod) and types for get/update, see [Schema and types](#schema-and-types) below.

## Key format

The **logical key** (e.g. `mykey`, `foo:bar`, `ESS:editor-settings`) can contain colons. For split storage we append `:root` and `:hash` (8 hex chars) to form API keys; we do not treat `:` as reserved in your key. The key **must not** contain `/`, `?`, `#`, or `\` (unsafe in the OSM API path). If it does, the function **throws** with a message like `Preference key must not contain / ? # or \\ (unsafe in URL path): "your-key"`. Emojis and other non-ASCII are not validated; they may work depending on server encoding.

## Split storage

The OSM API allows one string per key, max 255 characters. For longer values, the library stores one logical preference as **split storage**: multiple API keys (a root manifest plus content-hashed chunks).

- **Single key:** one entry, e.g. `mykey` → `"short"`.
- **Split storage:** one logical key becomes several entries. Example after `updatePreference("ESS:editor-settings", longJsonString)` with `storage: 'auto'` (length > 255):

| Key (raw)                      | Value                                                         |
| ------------------------------ | ------------------------------------------------------------- |
| `ESS:editor-settings:root`     | `a1b2c3d4,e5f6g7h8` (comma-separated 8-char hashes, in order) |
| `ESS:editor-settings:a1b2c3d4` | first 255 chars of the serialized value                       |
| `ESS:editor-settings:e5f6g7h8` | remainder                                                     |

**How split write works (chunks first, then root, retries):**

To handle network errors better, the library writes split storage in this order:

1. **Chunks in parallel:** All chunk keys (`key:hash`) are written with `Promise.all`. Each chunk PUT is retried up to **3 times** (initial attempt + 2 retries) on failure. If a chunk still fails after retries, the function throws; some chunk keys may be written (orphans) but the root is not, so readers still see the previous state (or nothing).
2. **Root:** One PUT for `key:root` with a comma-separated list of chunk hashes. If this fails, the function throws; chunks are already written (orphans until the next successful update overwrites/cleans).
3. **Delete old chunks:** Chunk keys that are no longer in the new root are deleted (including orphan chunks from earlier failed writes).

**Max size for one split preference:**

In this format you can store about **7.1 KB** of text (7140 characters) per logical key. `PREFERENCE_SPLIT_MAX_PAYLOAD_BYTES` (exported from the package) is that maximum length in **characters**. It comes from the OSM limit of 255 chars per key value: the root value holds a comma-separated list of chunk hashes (8 chars each + comma), so at most 28 hashes fit; each chunk is ≤255 chars, so 28×255 = 7140. If your serialized value is longer, `updatePreference(..., { storage: "split" })` or `storage: "auto"` with a long value will throw. Check before writing:

```ts
import { PREFERENCE_SPLIT_MAX_PAYLOAD_BYTES, updatePreference } from "osm-api";

const serialized = JSON.stringify(largeObject);
if (serialized.length > PREFERENCE_SPLIT_MAX_PAYLOAD_BYTES) {
  // Store under multiple logical keys (e.g. mykey:0, mykey:1) or shorten the value
} else {
  await updatePreference("mykey", largeObject, { storage: "split" });
}
```

## Schema and types

> [!NOTE]
> Prefer using `updatePreference` with a runtime validation schema (e.g. [Zod](https://zod.dev)) so you get typed, validated data and clear parse/validation errors.

- **getPreference without schema:** Returns `string | null`. Your app must parse and validate (e.g. `JSON.parse` + manual checks).
- **getPreference with schema:** Returns `PreferenceResult<T>`: `{ value: T }` on success, `{ issues }` on parse/validation failure, or `null` if the key is missing. Validation failures are returned as `{ issues }` (no throw) so the caller can inspect and decide.
- **updatePreference with schema:** Value is validated before writing; **throws** if validation fails. Throwing avoids persisting invalid data; use `try/catch` to handle.

The schema can be any [Standard Schema](https://github.com/standard-schema/standard-schema)–compatible implementation (e.g. Zod, Valibot).

## Examples

### Database state

Lets assume the OSM DB has the following data in the user's preferences:

```yaml
# Single key
my-key=foobar

# Split key
my-key:root=a1b2c3d4,e5f6g7h8
my-key:a1b2c3d4={"theme":"dark","fontSize":14,"items":["a","b","c",
my-key:e5f6g7h8="d","e"]}
```

### Update with `storage: auto`

`auto` is the default. Single API key if serialized length ≤255; otherwise split (root + chunks). If **both** single and split exist for the same key it **throws** (use `storage: 'single'` or `'split'` to resolve, or delete the other form first with `deletePreference(key, { storage: 'single' })` or `deletePreference(key, { storage: 'split' })` then update).

With the example DB state above, `my-key` exists as both single and split, so the following **throws**. Use `storage: 'single'` or `'split'` (below) to update.

```ts
import { updatePreference } from "osm-api";

// With example DB state (both present) this throws:
await updatePreference("my-key", { theme: "dark" });
// or…
await updatePreference("my-key", { theme: "dark" }, { storage: "auto" });
// → throws  Use storage: 'single' or 'split' to update.
```

Example when only one storage form is present (e.g. after deleting the single key so only split remains):

```ts
import { deletePreference, updatePreference } from "osm-api";

// With example DB state (both present): remove single key so only split remains
await deletePreference("my-key", { storage: "single" });
// Now only the split keys (root + chunks) are present; update with auto works
await updatePreference("my-key", { theme: "dark" });
// → void  After: my-key={"theme":"dark"}  (single key written)
```

### Update with `storage: single`

One API key only. Throws if serialized length > 255.

```ts
await updatePreference("my-key", "foobar", { storage: "single" });
// → void  After: my-key="foobar"  (stored as JSON string, i.e. "foobar" with quotes in value)
```

### Update with `storage: split`

Always store as split (root + chunks), even if ≤255 chars.

```ts
await updatePreference("my-key", { data: "..." }, { storage: "split" });
// → void  After: my-key:root=..., my-key:hash1=..., ...
```

### With schema (validates before writing)

Pass a [Standard Schema](https://github.com/standard-schema/standard-schema)–compatible schema (e.g. [Zod](https://zod.dev)); the value is validated before writing. See [Schema and types](#schema-and-types) above.

Unlike `getPreference` with schema (which returns `{ issues }`), validation failure here **throws**. The thrown error message includes the schema issues (e.g. `Preference validation failed: [{"message":"..."}]`). Use `try/catch` to handle and log.

```ts
import { updatePreference } from "osm-api";
import { z } from "zod";

const mySchema = z.object({ theme: z.string(), fontSize: z.number() });
try {
  await updatePreference("settings", userInput, { schema: mySchema });
  // → void
} catch (err) {
  if (
    err instanceof Error &&
    /Preference validation failed/.test(err.message)
  ) {
    console.error("Validation failed:", err.message);
  }
  throw err;
}
```

## Error cases

- **Invalid key:** If the key contains `/`, `?`, `#`, or `\` → **throws** with a message (see [Key format](#key-format)).
- **Conflict (auto only):** The key exists as **both** a single key and split storage → **throws** with a message; use `storage: 'single'` or `'split'` to update.
- **Schema validation failure:** If `schema` is provided and validation fails, **throws** before writing.
- **Storage `single` and length > 255:** If serialized value exceeds 255 chars, **throws**.
- **Network / auth:** If a chunk write still fails after retries (3 attempts per chunk), the function throws; some chunk keys may be written (orphans) but the root is not. If the root write fails, the function throws; chunks are already written (orphans until the next successful update).
