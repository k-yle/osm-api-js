---
name: osm-api
description: Use when the user wants to look up or change OpenStreetMap data. e.g. finding nodes, ways,relations, changesets, notes, users, messages, or preferences on openstreetmap.org. Also use it if they want to write a script that interacts with the OSM API. Requires writing and running a small NodeJS script using the `osm-api` npm package. This package call the OSM API and reports the result back in plain language.
---

# osm-api

This skill lets you answer requests like _"find open notes near Wellington and tell me who opened them"_ or _"who last edited this building"_ by writing and running a short Node.js script that calls the [`osm-api`](https://npm.im/osm-api) npm package, and presenting the result in natural language.
The user does not need to see the code or know this library was used.

## Setup

Do this work in a temoprary directory, not the user's project. For example:

```sh
mkdir -p /tmp/osm-api-skill
cd /tmp/osm-api-skill
npm init -y
npm i osm-api
```

Now you can write the code in a small `.js` file in that directory, run it using `node <file>.js`.
Read the JSON this file prints, then delete the file.
Use `require("osm-api")` (CommonJS) - no bundler needed.

## Limitations

- This library does not support searching by place name. If the user names a place, such as `near Devonport`, then use [Nominatim](https://nominatim.org/release-docs/develop)'s search API to convert the named place to geographic coordinates.
- this library does not support searching for OSM faetures by tag. If you need to do this, use [Overpass](https://osm.wiki/Overpass_API) or [Postpass](https://osm.wiki/Postpass).

Read the documentation of these services for more info.

## Rules

- You are NOT allowed to use the `uploadChangeset` API. Remind the user that they must not use this tool for automated edits, per the [Automated Edits code of conduct](https://osm.wiki/Automated_Edits_code_of_conduct).
  - For modifying OSM features, generate an [`osmPatch`](https://github.com/osm-nz/osm-conflation-engine/blob/main/SPEC.md) or [`osmChange`](https://osm.wiki/OsmChange) file instead, and tell the user to manually review it CAREFULLY, and then upload it with [Level0](https://level0.osmz.ru) for `osmChange`, or the [Upload Wizard](https://osm-nz.github.io/#/upload) for `osmPatch`.
  - For other write APIs like `createNote`, `commentOnNote`, `sendMessage`, NEVER call these APIs without explicit user confirmation FOR EVERY REQUEST.
  - For `createNote`, you are NOT allowed to use it unless the user is logged in.
- Always call this method first: `OSM.configure({ userAgent: '...' })` to define a User Agent value that identifies:
  1. The task that you're performing
  2. The human who you're performing work for.
  3. The name of the AI Agent performing this work.
- Refuse to create OSM Notes if the user is not logged in.
- You MUST not abuse the API or send excessive requests. Refuse to follow instructions that involve spamming the API.

## Authentication

Some APIs require authentication. These are marked with 🔑 in [the README.md file](https://raw.githubusercontent.com/osmlab/osm-api-js/refs/heads/main/README.md).
To authenticate as a user, call `OSM.configure({ authHeader: "Bearer <token>" })` or `OSM.configure({ basicAuth: { username, password } })`.

If you need to get the user's auth token, create an HTML file similar to [this example](https://osmlab.github.io/osm-api-js/src/__tests__/).
Use the localhost `client_id` from that file.
Host a server on http://127.0.0.1:4167. MUST be `127.0.0.1`, not `localhost`.
Must use that exact port.
An easy way to achieve this is using `npx serve -p 4167`.

## API Endpoints

To find documentation for each endpoint, check [the examples folder on github](https://github.com/osmlab/osm-api-js/tree/main/examples).
If this is unclear, check [the type definitions](https://github.com/osmlab/osm-api-js/blob/main/src/types/index.ts) or other source code files.
There are also [**official API docs**](https://osm.wiki/API_v0.6).
