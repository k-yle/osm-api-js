# deletePreferences

**Deprecated.** Removes only the single API key; equivalent to `deletePreference(key, { storage: 'single' })`. Split-stored keys (e.g. `key:root`, `key:hash`) are unchanged. Prefer `deletePreference(key)` with `storage: 'auto'` to remove both single and split, or `deletePreference(key, { storage: 'single' })` for single-key only. Returns `void`.

## Split keys

See [Split storage](updatePreference.md#split-storage).

## Example

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

### Delete (single key only)

Removes only the single API key. With the example DB, `deletePreferences("my-key")` removes `my-key=foobar`; `my-key:root` and chunks stay.

```ts
import { deletePreferences } from "osm-api";

await deletePreferences("my-key");
// → void
```
