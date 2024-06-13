# getFeatures

```ts
import { getFeatures } from "osm-api";

await getFeatures("node", [1234, 1235]);
```

Response:

```json
[
  {
    "changeset": 243638,
    "id": 4305800016,
    "nodes": [4332338515, 4332338516, 4332338517, 4332338518, 4332338515],
    "tags": {
      "building": "house",
      "name:fr": "chez moi"
    },
    "timestamp": "2022-09-10T11:47:13Z",
    "type": "way",
    "uid": 12248,
    "user": "example_user",
    "version": 4
  }
]
```
