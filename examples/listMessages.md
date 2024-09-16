# listMessages

```ts
import { listMessages } from "osm-api";

await listMessages("inbox");
```

Response:

```json
[
  {
    "id": 1234567,
    "from_user_id": 111234,
    "from_display_name": "alice",
    "to_user_id": 111235,
    "to_display_name": "bob",
    "title": "hey buddy",
    "sent_on": "2024-05-01T09:41:00Z",
    "message_read": true,
    "deleted": false,
    "body_format": "markdown"
  }
]
```
