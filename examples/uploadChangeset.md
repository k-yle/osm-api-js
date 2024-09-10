# uploadChangeset

```ts
import { uploadChangeset } from "osm-api";

await uploadChangeset(
  {
    // tags
    created_by: "iD",
    comment: "change surface to unpaved",
  },
  {
    // OsmDiff
    create: [
      /* list of `OsmFeature`s */
    ],
    modify: [],
    delete: [],
  }
);
```

Response:

```json
12345
```

(changeset number)

## Updating existing features

```ts

import { getFeature } from "osm-api";
const id = 12345;
const type = "node";

const featureResponse = await getFeature(type, id);
if (featureResponse.length > 0) {
  const feature = featureResponse[0];
  if (feature.tags) {
    feature.tags["amenity"] = "restaurant";
  } else {
    feature.tags = { "amenity": "restaurant" };
  }
  await uploadChangeset(
    {
      created_by: "id",
      comment: "tagging as resturant",
    },
    {
      create: [],
      modify: [feature],
      delete: [],
    });
}
```

## Creating new features
To create a new node, several of the fields will have be be blanked out
```ts
import { OsmNode } from "osm-api";

const lat = 123.456;
const lon = 789.123;
const tags = {
  "amenity": "restaurant",
};

const newNode: OsmNode = {
  type: "node",
  lat: lat,
  lon: lon,
  tags: tags,
  id: -1, // Negative ID for new nodes
  changeset: -1,
  timestamp: '',
  uid: -1,
  user: '',
  version: 0,
};
```
Then you can add it to the changeset `create: [newNode]` as above.
