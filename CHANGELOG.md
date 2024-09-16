# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
