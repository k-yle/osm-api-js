# getChangeset

```ts
import { getChangeset } from "osm-api";

await getChangeset(12345, /* includeDiscussion */ true);
```

Response:

```json
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
```
