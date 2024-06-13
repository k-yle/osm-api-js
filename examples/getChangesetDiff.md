# getChangesetDiff

```ts
import { getChangesetDiff } from "osm-api";

await getChangesetDiff(12345);
```

Response:

```json
{
  "create": [
    {
      "changeset": 227200,
      "id": 4330788674,
      "lat": -36.8809317,
      "lon": 174.7397472,
      "tags": {
        "building": "house"
      },
      "timestamp": "2021-12-16T09:29:15Z",
      "type": "node",
      "uid": 12248,
      "user": "example_user",
      "version": 1
    }
    /* see getFeature */
  ],
  "delete": [
    /* see getFeature */
  ],
  "modify": [
    /* see getFeature */
  ]
}
```
