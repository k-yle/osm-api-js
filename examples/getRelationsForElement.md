# getRelationsForElement

```ts
import { getRelationsForElement } from "osm-api";

await getRelationsForElement("node", 123456789);
```

Response:

```json
[
  {
    "changeset": 243638,
    "id": 4305800016,
    "members": [
      { "ref": 4003, "role": "outer", "type": "way" },
      { "ref": 4004, "role": "inner", "type": "way" }
    ],
    "tags": {
      "building": "house",
      "name:fr": "chez moi"
    },
    "timestamp": "2022-09-10T11:47:13Z",
    "type": "relation",
    "uid": 12248,
    "user": "example_user",
    "version": 4
  }
]
```
