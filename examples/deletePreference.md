# deletePreference

Removes one preference by key. What gets deleted depends on `storage`.

## Split keys

See [Split storage](updatePreference.md#split-storage) for how split keys look.

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

### Delete with `storage: auto`

`auto` is the default `storage`. It will delete both my-key and my-key:root + chunks.
In our example all four DB entries will be removed.

```ts
import { deletePreference } from "osm-api";

await deletePreference("my-key");
// or…
await deletePreference("my-key", { storage: "auto" });
// → void
```

### Delete with `storage: single`

`single` deletes only the specific key provided. The split keys are ignored.
In our example only the first DB entry will be removed.

```ts
import { deletePreference } from "osm-api";

await deletePreference("my-key", { storage: "single" });
// → void
```

### Delete with `storage: split`

`split` deletes only the split keys (root + chunks). The single key is ignored.
In our example only the three `my-key:*` DB entries will be removed.

```ts
import { deletePreference } from "osm-api";

await deletePreference("my-key", { storage: "split" });
// → void
```

## Error cases

- **Invalid key:** If the key contains `/`, `?`, `#`, or `\` → **throws** (see [Key format](updatePreference.md#key-format)).
- **Network / auth:** If the request fails (e.g. no auth, API down), the underlying fetch throws; no preferences are changed.
- No conflict error: unlike `getPreference`, delete does not throw when both single and split exist; with `auto` it deletes both.
