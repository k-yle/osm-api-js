# OpenStreetMap API for Javascript

[![Build Status](https://github.com/k-yle/osm-api-js/workflows/Build%20and%20Test/badge.svg)](https://github.com/k-yle/osm-api-js/actions)
[![Coverage Status](https://coveralls.io/repos/github/k-yle/osm-api-js/badge.svg?branch=main&t=LQmPNl)](https://coveralls.io/github/k-yle/osm-api-js?branch=main)
[![npm version](https://badge.fury.io/js/osm-api.svg)](https://badge.fury.io/js/osm-api)
[![npm](https://img.shields.io/npm/dt/osm-api.svg)](https://www.npmjs.com/package/osm-api)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/osm-api)

🗺️🌏 Javascript/Typescript wrapper around the OpenStreetMap API.

Benefits:

- Lightweight (24 kB gzipped)
- works in nodejs and the browser.
- converts OSM's XML into JSON automatically.
- uses OAuth 2, so that you don't need to expose your OAuth `client_secret`

## Install

```sh
npm install osm-api
```

## Usage

```js
const OSM = require("osm-api");
// or
import * as OSM from "osm-api";

// you can call methods that don't require authentication
await OSM.getFeature("way", 23906749);

// Once you login, you can call methods that require authentication.
// See the section below about authentication.
await OSM.createChangesetComment(114733070, "Thanks for your edit!");
```

If you don't use a bundler, you can also include the module using a `<script>` tag:

```html
<script src="https://unpkg.com/osm-api@1"></script>
<script>
  OSM.getFeature("way", 23906749);
  OSM.login({ ... });
  ...
</script>
```

## Examples

All methods return promises. Examples requests and responses are available for all methods:

> 🔑 means the method requires authentication

- Features
  - [`getFeature()`](./examples/getFeature.md)
  - [`getFeatures()`](./examples/getFeatures.md)
  - [`getFeatureAtVersion`](./examples/getFeatureAtVersion.md)
  - [`getFeatureHistory`](./examples/getFeatureHistory.md)
  - [`getWaysForNode`](./examples/getWaysForNode.md)
  - [`getRelationsForElement`](./examples/getRelationsForElement.md)
- Changesets
  - [`listChangesets`](./examples/getFeature.md)
  - [`getChangeset`](./examples/getChangeset.md)
  - [`getChangesetDiff`](./examples/getChangesetDiff.md)
  - 🔑 [`uploadChangeset`](./examples/uploadChangeset.md)
  - 🔑 [`createChangesetComment`](./examples/createChangesetComment.md)
- Users
  - [`getUser`](./examples/getUser.md)
  - [`getUsers`](./examples/getUsers.md)
  - [`getUIdFromDisplayName`](./examples/getUIdFromDisplayName.md)
- Misc
  - [`getCapabilities()`](./examples/getCapabilities.md)
  - [`getMapData`](./examples/getMapData.md)
- Authentication (browser only, not available in NodeJS)
  - `login`
  - `logout`
  - `isLoggedIn`
  - 🔑 `getAuthToken()`
  - `authReady`

## Authentication in the browser

When used in the browser, this library lets you authenticate to OSM using OAuth 2. This requires either:

1. Redirecting the user to the OAuth page, or
2. Opening a popup window.

### 1. Popup

If using a popup, you should create a separate landing page, such as `land.html`. This html file should contain the following code:

> 💡 If you don't want to create a separate page, you can set the redirect URL to your
> app's main page, as long as you include this HTML snippet.

```html
<script>
  if (window.opener) {
    window.opener.authComplete(location.href);
    window.close();
  }
</script>
```

To login, or check whether the user is logged in, use the following code:

```js
const OSM = require("osm-api");

OSM.login({
  mode: "popup",
  clientId: ".......",
  redirectUrl: "https://example.com/land.html",
})
  .then(() => {
    console.log("User is now logged in!");
  })
  .catch(() => {
    console.log("User cancelled the login, or there was an error");
  });

// you can check if a user is logged in using
OSM.isLoggedIn();

// and you can get the access_token using
OSM.getAuthToken();
```

### 2. Redirect

If you use the redirect method, you don't need a separate landing page.

```js
const OSM = require("osm-api");

// when you call this function, you will be immediately redirected to openstreetmap.org
OSM.login({
  mode: "redirect",
  clientId: ".......",
  redirectUrl: "https://example.com/land.html",
});
```

```js
const OSM = require("osm-api");

// If you login using the redirect method, you need to await
// this promise before you can call `isLoggedIn` or `getAuthToken`.
await OSM.authReady;

// you can check if a user is logged in using
OSM.isLoggedIn();

// and you can get the access_token using
OSM.getAuthToken();
```

## Authentication in NodeJS

In NodeJS, if you want to use a method that requires authentication, call the `configure()` function first:

```js
const OSM = require("osm-api");

OSM.configure({ bearerToken: "..." });
// or
OSM.configure({ basicAuth: { username: "...", password: "..." } });

// now you can call methods that require authentication.
// Example:
await OSM.createChangesetComment(114733070, "Thanks for your edit!");
```
