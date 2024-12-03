# getNotesForQuery

```ts
import { getNotesForQuery } from "osm-api";

await getNotesForQuery({
  q: "cafés",
  // several other options are are available, see the type defintions for details
});
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
