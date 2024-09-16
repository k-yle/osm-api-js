# getMessage

```ts
import { getMessage } from "osm-api";

await getMessage(1234567);
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
    "body_format": "markdown",
    "body": "On 2024-05-01 09:41:00 UTC alice wrote:\r\n\r\n sup bro, how u doing?"
  }
]
```
