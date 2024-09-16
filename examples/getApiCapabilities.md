# getApiCapabilities

```ts
import { getApiCapabilities } from "osm-api";

await getApiCapabilities();
```

Response:

```json
{
  "attribution": "http://www.openstreetmap.org/copyright",
  "copyright": "OpenStreetMap and contributors",
  "generator": "OpenStreetMap server",
  "license": "http://opendatacommons.org/licenses/odbl/1-0/",
  "version": "0.6",
  "api": {
    "area": {
      "maximum": 0.25
    },
    "changesets": {
      "default_query_limit": 100,
      "maximum_elements": 10000,
      "maximum_query_limit": 100
    },
    "note_area": {
      "maximum": 25
    },
    "notes": {
      "default_query_limit": 100,
      "maximum_query_limit": 10000
    },
    "relationmembers": {
      "maximum": 32000
    },
    "status": {
      "api": "online",
      "database": "online",
      "gpx": "online"
    },
    "timeout": {
      "seconds": 300
    },
    "tracepoints": {
      "per_page": 5000
    },
    "version": {
      "maximum": "0.6",
      "minimum": "0.6"
    },
    "waynodes": {
      "maximum": 2000
    }
  },
  "policy": {
    "imagery": {
      "blacklist": [
        { "regex": ".*\\.google(apis)?\\..*/.*" },
        { "regex": "http://xdworld\\.vworld\\.kr:8080/.*" }
      ]
    }
  }
}
```
