# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- [uploadChangeset] optionally handle merge conflicts, if you provide callback functions for `onAutomaticConflict` and `onManualConflict`.

## 4.0.0 (2026-02-11)

- 💥 BREAKING CHANGE: `uploadChangeset` now returns a object instead of a single changeset ID. This is because:
  1. the function supports chunking uploads into multiple changesets if it exceeds the limit of 10,000 features per changeset.
  2. For each feature that was created, the response now includes a mapping between the temporary ID used by the uploader, and the permanent ID allocated by the server.
- 💥 BREAKING CHANGE: The type defintions for `Changeset` have been changed to mark several properties as optional. (see [#14](https://github.com/osmlab/osm-api-js/issues/14))
- 💥 BREAKING CHANGE: `Changeset.created_at`, `Changeset.closed_at`, and `ChangesetComment.date` are now a `string`, not a `Date`. This makes it more consistent with the XML format, and easier to serialise to JSON.
- 💥 BREAKING CHANGE: `ChangesetComment.uid` is now a `number`, not a `string`. This matches the behaviour of OSM's new json API.
- 💥 BREAKING CHANGE: `Changeset.discussion` has been renamed to `Changeset.comments`. This matches the behaviour of OSM's new json API.

## 3.3.2 (2026-01-08)

- [getUsers] add type definitions for `social_links`, also switch to the JSON API

## 3.3.1 (2025-11-21)

- [uploadChangeset] fix tag values with linebreaks (`\n`) not handled properly

## 3.3.0 (2025-09-18)

- [uploadChangeset] add an `onProgress` callback, so that apps can show a progress bar while uploading
- [uploadChangeset] compress changesets with gzip before uploading (if JS's [`CompressionStream`](https://developer.mozilla.org/en-US/docs/Web/API/CompressionStream) is available natively)

## 3.2.0 (2025-07-27)

- Add new options to the `OsmUserRole` string union.
- Change `createChangesetComment` to return the changeset object instead of returning `undefined`.
- Add 5 new functions that only administrators/moderators can use.

## 3.1.0 (2025-07-23)

- Added a new function `closeNote`
- Fixed some note methods not working

## 3.0.0 (2025-07-08)

- 💥 BREAKING CHANGE: Fix authentication broken when using the `popup` mode due to [recent security changes](https://github.com/openstreetmap/openstreetmap-website/commit/2ff4d6)

## 2.7.0 (2025-06-02)

- Optionally support type-safe `Tags`. `Tags` is currently defined as `Record<string, string>`. If you want additional type-safety, you can specify the keys are the allowed. See the docs for more info.

## 2.6.1 (2025-05-19)

- Fix configuration issue which broke the type-definitions in the previous release

## 2.6.0 (2025-05-12)

- When uploading a changeset, if you don't specify a `created_by` tag, this library will add one itself, so that changesets always have a `created_by` tag.
- When uploading a changeset, the osmChange array is now automatically sorted, so that you don't have to worry about sorting in your own application.

## 2.5.1 (2025-05-05)

- Fix bug causing OAuth not to work when using redirect-mode

## 2.5.0 (2025-04-02)

- Allow custom HTTP headers or an `AbortSignal` to be passed to every API method.
- Added 2 new functions to get user-blocks
- Git repository moved to the [osmlab](https://github.com/osmlab) organisation.
- Automatically split large changesets into chunks before uploading, if the changeset were to exceed the maximum number of features allowed by the API.

## 2.4.0 (2025-01-16)

- Added a method to easily switch users (logout & log back in)

## 2.3.0 (2024-12-03)

- Added 4 new functions for notes & changeset subscriptions

## 2.2.0 (2024-09-16)

- Added 3 new functions for the preferences API
- Added 5 new functions for the new messaging API
- Added a new option `bbox` to `getNotesForQuery`
- Added a new option `limit` to `listChangesets`
- Added new function `getPermissions`
- Added new function `getApiCapabilities` and deprecated `getCapabilities`. The new function uses the recently-released JSON API, which has a different format.

## 2.1.3 (2024-07-30)

- Update dependencies to satisfy `npm audit`

## 2.1.2 (2024-06-30)

- Fix crash when using the `getChangeset` API

## 2.1.1 (2024-02-18)

- Fix bug in v2.1.0, and also apply new logic osmChange parser

## 2.1.0 (2024-02-17)

- Change how changeset tags are embedded into osmChange files ([more info](https://community.osm.org/t/108670/8))

## 2.0.0 (2024-01-25)

- 💥 BREAKING CHANGE: Require nodejs v18 or newer. This allows the `fetch` polyfill to be removed.
- (internal) modernise build infrastructure

## 1.0.6 (2024-01-24)

- export type defintions for the OsmPatch format

## 1.0.5 (2022-09-10)

- remove console.log and fix typedef

## 1.0.4 (2022-04-06)

- fix bug with changeset xml

## 1.0.3 (2022-04-01)

- fix bug with getRelationsForElement
- update dependencies

## 1.0.2 (2022-01-30)

- minors improvements to osmChange generation

## 1.0.1 (2021-12-24)

- fix an issue with escaping XML characters when uploading changeset

## 1.0.0 (2021-12-20)

- Initial release
