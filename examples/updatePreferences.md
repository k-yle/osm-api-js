# updatePreferences

**Deprecated.** Writes a single API key only (raw string, ≤255 chars); equivalent in scope to `updatePreference(key, value, { storage: 'single' })` (one key, no split). Note: `updatePreference` JSON-serializes values, so stored bytes differ. Prefer `updatePreference` for JSON, schema, or split storage. Returns `void`.

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

### Add (single key only)

Adding a key not in the example above. After the call, the key is set.

```ts
import { updatePreferences } from "osm-api";

await updatePreferences("other-key", "value");
// → void
```

### Update (single key only)

With the example DB, `my-key=foobar`. After the call, `my-key` is overwritten.

```ts
await updatePreferences("my-key", "value");
// → void
```
