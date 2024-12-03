# getNotesForArea

```ts
import { getNotesForArea } from "osm-api";

const bbox = [174.738948, -36.880984, 174.741083, -36.880065];

await getNotesForArea(bbox);
```

Response:

```json
[
  {
    "close_url": "https://api.openstreetmap.org/api/0.6/notes/55251/close.json",
    "comment_url": "https://api.openstreetmap.org/api/0.6/notes/55251/comment.json",
    "comments": [
      {
        "action": "opened",
        "date": "2024-01-24 06:33:43 UTC",
        "html": "<p>cycleway=no</p>",
        "text": "cycleway=no",
        "uid": 12248,
        "user": "kylenz_testing",
        "user_url": "https://api.openstreetmap.org/user/kylenz_testing"
      }
    ],
    "date_created": "2024-01-24 06:33:43 UTC",
    "id": 55251,
    "location": {
      "lat": -36.8300694,
      "lng": 174.7460568
    },
    "status": "open",
    "url": "https://api.openstreetmap.org/api/0.6/notes/55251.json"
  }
]
```
