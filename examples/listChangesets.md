# listChangesets

```ts
import { listChangesets } from "osm-api";

await listChangesets({
  // for a list of possible queries,
  // see https://github.com/k-yle/osm-api-js/blob/5c3bd7193a22fead983cb4337140df2c72da7a8c/src/api/changesets/getChangesets.ts#L29-L48
});
```

Response:

```json
[
  {
    "changes_count": 10,
    "closed_at": "2022-09-10T11:30:13.000Z",
    "comments_count": 0,
    "created_at": "2022-09-10T11:30:12.000Z",
    "id": 243637,
    "max_lat": -36.8804809,
    "max_lon": 174.7397571,
    "min_lat": -36.880627,
    "min_lon": 174.739496,
    "open": false,
    "tags": {
      "changesets_count": "5",
      "comment": "delete and redraw building",
      "created_by": "iD 2.21.1",
      "host": "https://openstreetmap.org/edit",
      "imagery_used": "LINZ NZ Aerial Imagery",
      "locale": "en-NZ"
    },
    "uid": 12248,
    "user": "example_user"
  }
]
```
