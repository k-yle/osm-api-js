# getCapabilities

> [!CAUTION]
> This method is deprecated, use [`getApiCapabilities`](./getApiCapabilities.md) instead.

```ts
import { getCapabilities } from "osm-api";

await getCapabilities();
```

Response:

```json
{
  "limits": {
    "maxArea": 0.25,
    "maxChangesetElements": 10000,
    "maxNoteArea": 25,
    "maxTimeout": 300,
    "maxTracepointPerPage": 5000,
    "maxWayNodes": 2000
  },
  "policy": {
    "imageryBlacklist": []
  }
}
```
