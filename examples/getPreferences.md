# getPreferences

Fetches all preferences for the logged-in user. Default is `handleStorage: 'merged'`: one entry per logical key (split keys merged). Use `handleStorage: 'raw'` for API keys as returned. Returns `Record<string, string>` (merged or raw).

## Split keys

See [Split storage](updatePreference.md#split-storage) for how values >255 chars are stored.

## Example

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

### Get with `handleStorage: merged`

`merged` is the default. One entry per logical key; split keys merged into a single value. This helper does not support types or a parser at the moment—values are raw strings. For typed, validated reads use [getPreference](getPreference.md) with a schema; see [Schema and types](updatePreference.md#schema-and-types) in updatePreference.md.

```ts
import { getPreferences } from "osm-api";

const merged = await getPreferences();
// or…
const merged = await getPreferences({ handleStorage: "merged" });
// → Record<string, string>
console.log(merged);
// With example DB: { "my-key": "{\"theme\":\"dark\",\"fontSize\":14,\"items\":[\"a\",\"b\",\"c\",\"d\",\"e\"]}" }
```

### Get with `handleStorage: raw`

API keys as returned. Split keys appear as separate entries.

```ts
const raw = await getPreferences({ handleStorage: "raw" });
// → Record<string, string>
console.log(raw);
// With example DB: { "my-key": "foobar", "my-key:root": "a1b2c3d4,e5f6g7h8", "my-key:a1b2c3d4": "{\"theme\":\"dark\",\"fontSize\":14,\"items\":[\"a\",\"b\",\"c\",", "my-key:e5f6g7h8": "\"d\",\"e\"]}" }
```
