# offline and pwa

Source requirements below are preserved verbatim from the master specification. They describe the target game, not a claim of implemented functionality. See ROADMAP.md and IMPLEMENTATION_STATUS.md for current evidence. User instructions take precedence over the master.

## 10. PWA, offline behavior, installation, and local data

There is no password gate in the default game.

The installed PWA should open directly to a polished title screen, then the two save slots. Do not ask for a PIN, passphrase, account, login, or network connection during ordinary play.

If a local app-lock feature is ever added later, it must be optional and must remember that the device has already been authorized until the user explicitly locks it again. It must never reset, replace, migrate, or otherwise modify save data merely because the lock state changes.

### 10.1 First-run flow

Target flow:

1. User visits the site online.
2. Minimal application shell loads.
3. Title screen appears immediately.
4. The app checks which versioned game-content packs are available locally.
5. If the full offline package is not present, show a clear `Make Available Offline` action or begin the download automatically if that produces the better iPhone experience.
6. Show exact progress and the approximate remaining asset count/size where available.
7. Service worker caches the application shell and immutable/versioned asset packs.
8. When complete, display `Ready for offline play`.
9. Encourage `Add to Home Screen` when the browser allows useful installation guidance.
10. User can start or load either save without another setup screen.

### 10.2 Subsequent launch

1. PWA opens with or without internet.
2. Display the title screen.
3. Present Continue, Save Slot 1, Save Slot 2, Settings, and Backup/Restore as appropriate.
4. Load all normal game content locally.
5. Do not perform required network calls during gameplay.

### 10.3 Storage responsibilities

Use:

- Cache Storage / service-worker caches for the application shell, sprites, atlases, maps, audio, fonts, and other versioned static assets.
- IndexedDB for save data, settings, content metadata, migration state, and small mutable local records.
- IndexedDB, not the browser HTTP cache, for game saves.

Request persistent storage with `navigator.storage.persist()` where supported, but never assume the browser grants it.

The game must remain safe if the service-worker cache is refreshed or replaced. Updating cached assets must never delete save slots.

### 10.4 Offline completeness

The offline indicator must distinguish:

- `Online, offline package incomplete`
- `Downloading offline package`
- `Offline ready`
- `Running offline`
- `Update available`

Before declaring the game offline-ready, validate that all mandatory asset bundles for the currently installed version are present.

Optional future content packs may be downloaded separately, but the installed core game must never boot into missing-texture or missing-audio failure because the network disappeared.

### 10.5 Save backup

Because mobile browser data can be cleared, add:

- Export Save Slot.
- Import Save Slot.
- Export Both Saves.
- A visible last-backup date.
- Schema/version validation on import.
- A clear warning before overwriting an occupied slot.

Use Web Share / file APIs where supported and a normal file-download fallback where not.

### 10.6 Hosting/privacy note

This is a personal project, but do not confuse a private source repository with private web hosting. GitHub Pages access characteristics depend on the repository/account configuration. Document the actual deployment visibility in the README once deployment is configured.

Do not add fake client-side security simply to make a public static site appear private.

## 43. Deployment and updates

Use GitHub Actions.

Pipeline:

1. install dependencies
2. lint
3. type-check
4. unit tests
5. browser tests
6. production build
7. deploy to GitHub Pages only if prior steps pass

Version offline content.

When a new app version is available:

- download it in the background when possible
- do not replace the active game mid-session
- show a small "Update ready" notice
- apply on explicit restart/reload
- keep save schema migrations backward-safe

Never wipe saves as part of an update.

---

