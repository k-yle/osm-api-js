# OSM Preferences Playground

Minimal Vite + React demo app for the preference-related examples changed in commits:

- `56061af` (split preference storage introduction)
- `3f2f55c` (storage transition/merge fixes)

## Run

From this folder:

```bash
npm install
npm run dev
```

Open the printed local URL.

If your environment does not have `npm`, the same commands can be run with Bun:

```bash
bun install
bun run dev
```

## What this app demonstrates

- Server toggle (`dev` default, `live` optional) via `configure({ apiUrl })`
- Library auth flow (`login`, `logout`, `isLoggedIn`, `authReady`)
- Preference APIs:
  - `getPreferences` (merged + raw)
  - `getPreference` (`auto`, `single`, `split`)
  - `updatePreference` (`auto`, `single`, `split`)
  - `deletePreference` (`auto`, `single`, `split`)
  - `updatePreferences` and `deletePreferences` (deprecated behavior)
- Step-by-step scenario runs:
  - baseline single
  - split
  - conflict
  - cleanup
- Error simulation:
  - invalid key chars
  - malformed JSON + schema issues
  - single overflow
  - manual broken root/chunk states

## Example docs and source

The app includes direct links to:

- example docs under `examples/*.md`
- source under `src/api/preferences/*.ts`

## Notes

- Inline styles only, no UI framework.
- Uses React with readability-first hooks (minimal effects).
