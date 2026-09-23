# Offline A4 notebook: review and next-model prompt

## Recommendation

Keep Excalidraw as the drawing engine and put a notebook shell around it. Do not
replace the pen renderer or turn the existing whiteboard into a notebook. The
starter lives at `/notes.html`; open it from **Main menu → A4 notebooks**.

The notebook has its own HTML entry and storage. It does not import the main
app's profile, external scene loader, or Sentry initialization. No account,
backend, or new npm dependency is required.

### Features to choose

- **Now / starter implemented:** A4 portrait paper guides; blank, ruled, and grid
  paper; multiple notes; add/switch pages; title editing; recent notes; local
  autosave; JSON backup download; focus mode; fullscreen with focus fallback.
- **Reuse the existing engine:** handwriting, pen pressure when the device and
  browser supply it, erasing, selection, shapes, typed text, undo/redo, and local
  image insertion. Pressure capture exists in
  `packages/excalidraw/components/App.tsx` (`simulatePressure`, `event.pressure`).
  Browser pressure is supported through [PointerEvent.pressure](https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent/pressure).
  This is not a claim of tested Apple Pencil latency or native palm rejection.
- **Best next additions:** backup restore, page reorder/duplicate/trash, folders,
  title/typed-text search, digital tape, bundled planner templates, and split view.
  These can all be deterministic client code without accounts or model downloads.
- **Feasible later:** local PDF annotation using a bundled
  [PDF.js worker](https://mozilla.github.io/pdf.js/getting_started/), and audio
  recording using [MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder).
  Recording needs microphone permission and supported codecs. Audio replay needs
  explicit stroke timestamps; Excalidraw does not provide lecture synchronization.
- **Exclude from this lightweight scope:** handwriting/math recognition, AI
  summaries/chat/quizzes, cloud sync, sign-in, collaboration, server uploads,
  remote template catalogs. Offline AI is a separate model-size, quality, memory,
  and device-support project. Manual flashcards remain a small offline option.

## Core architecture delivered

- `excalidraw-app/notes.html`: independent entry, same-origin content policy;
  remote fonts, embeds, and outbound API connections are blocked. The localhost
  WebSocket allowance supports development hot reload.
- `excalidraw-app/notebook/index.tsx`: mounts notes and registers the existing PWA.
  Removes the two remote-only font families from this entry's font registry.
- `model.ts`: versioned notebook and page types; UUID identity; A4 coordinates
  794 × 1123 (approximately 96 CSS pixels/inch), unrelated to device pixel ratio.
- `storage.ts`: dedicated `draw-notebooks-v1` IndexedDB database, separate from
  whiteboard localStorage and file garbage collection. Atomic revision checks
  reject stale writes from other tabs instead of overwriting them.
- `NotebookApp.tsx`: recent notes, page navigation, bounded 700ms autosave,
  serialized writes, save-before-navigation, failure recovery controls, backup,
  focus/fullscreen. Commits edits made during an in-flight save before leaving.
- `PageEditor.tsx`: one Excalidraw instance for the active page; remounting isolates
  undo history. Stores elements, binary image files, and sanitized app state.
  SVG paper follows the editor's scroll/zoom and is outside the editable scene.
- `vite.config.mts`: two HTML build entries; precaches bundled fonts and both
  entries; excludes `/notes.html` from the whiteboard navigation fallback.
- `woff2-vite-plugins.js`: optional local UI font behavior, enabled for this app.
  The whiteboard's existing CDN preload behavior is otherwise retained.
- `FontPicker.tsx`: only shows registered default fonts, allowing the notebook
  entry to omit remote-only families without presenting broken font choices.

### Deliberate starter limitations

1. Paper is a visual guide. Ink can extend beyond the A4 boundary. There is no
   print/PDF export yet. A page export must explicitly compose paper and ink;
   ordinary Excalidraw export would omit this SVG paper. Those export controls
   are disabled here for that reason.
2. Backup **download** exists; backup **restore** is the first remaining task.
   The format is `{ format: "draw-notebook", notebook: Notebook }` and includes
   image data. Do not market download alone as a finished backup workflow.
3. Each save writes one whole notebook, including image data. Suitable for the
   starter, not large PDF collections or hours of audio. Split metadata, pages,
   and attachments into separate stores with transactional migrations before
   adding those workloads. Home currently loads complete notebooks too.
4. One active editor only. Undo resets when changing pages. Returning to a page
   fits it and selects the pen. The core does not implement continuous scrolling
   across pages, live thumbnails, page deletion/reorder, folders, or split view.
5. Recent notes refresh on load and local saves. Other-tab updates are detected
   at save time; there is no live multi-tab merge or cross-device synchronization.
6. Browser storage can be cleared or evicted. A pending final edit cannot be
   guaranteed after forced termination. Save status is truthful; download a
   separate copy. Later add a user-triggered request for
   [persistent storage](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/persist)
   with a fallback when denied.
7. Offline reload requires the built app to have been loaded and the service
   worker/assets cached first. Development mode does not install the worker.
   First-ever loading an uncached website without connectivity is not promised.
   Initial app download and service-worker update checks still use the host;
   editing and storage require no service calls.
8. [Fullscreen](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API)
   support varies; the visible focus button works without it. Four-finger tap is
   intentionally omitted because it can conflict with OS gestures.
9. Validate real Apple Pencil pressure, palm behavior, orientation changes,
   long sessions, and iPad Safari/installed-PWA behavior on hardware before
   claiming Notability-level handwriting. English notebook UI is a starter.

## Copy this prompt into the next model

```text
Extend the offline A4 notebook in this Excalidraw fork. Read NOTEBOOK_HANDOFF.md
and the code under excalidraw-app/notebook before changing anything. Preserve
the existing whiteboard at / and the independent notebook at /notes.html.

Constraints:
- Everything happens in the browser. No auth, backend, telemetry, cloud storage,
  external APIs, CDN dependencies, remote assets/templates, model downloads,
  cloud AI, OCR services, or automatic sync.
- Reuse the existing Excalidraw drawing, pressure, image, eraser, selection,
  undo/redo and zoom behavior. Avoid a drawing-engine rewrite.
- Keep the same-origin content policy and ship every required worker/font/asset.
- Never reuse whiteboard storage keys or its image cleanup for notebook data.
- Preserve existing notes through schema migrations. Do not reset data on load
  errors or silently accept last-writer-wins across tabs.
- Keep changes scoped and independently testable. Do not implement every phase
  simultaneously. Finish Phase 1 first, then report what is ready for Phase 2.

Phase 1 — make the core dependable and complete:
1. Implement local JSON backup restore for the existing draw-notebook envelope.
   Validate format/version, sizes, page IDs, element payloads, and image data.
   Reject unsupported schemas and external resource URLs. Restore as a new note
   with fresh notebook/page IDs; preserve all element/file/binding IDs within each
   scene. Do not overwrite an existing note on import. Include export→import→reload
   tests with text, bound shapes, handwriting, multiple pages and images.
2. Add duplicate/reorder pages and recoverable trash for notes/pages. A note must
   retain at least one page. Handle active-page deletion and undo boundaries.
3. Add local folders, recent sorting and title/typed-text search. Clearly state
   that handwriting is not searchable. Include empty and failure states.
4. Refactor persistence into metadata/page/attachment stores before large files;
   migrate schema v1 transactionally. Write only dirty pages, deduplicate assets,
   avoid loading all scene data for the home list, and recover gracefully from
   quota errors. Keep revision conflict checks and serialization.
5. Add storage usage, an optional persistent-storage request, and explicit backup
   reminders. Never say 'saved' before the IndexedDB transaction completes.
6. Add A4 print/export that includes paper and ink, correct physical page sizing,
   and predictable overflow policy. Preserve off-page ink; do not silently delete
   it. Offer fit-page/fit-width. Keep printable templates outside ordinary editing.
7. Test installed production PWA: load once, wait for caching, disconnect, reload
   /notes.html directly, create/write/add pages, insert a local image, close/reopen,
   and restore a backup. Confirm no remote runtime requests are required.

Phase 2 — useful study tools, no new heavy dependencies:
- Digital tape: note metadata for masks, with cover/reveal, resize/move/delete,
  keyboard access and persistence. Never destroy the underlying strokes. Decide
  whether a mask can be selected without revealing it; test export privacy.
- Bundled planners: weekly timetable, daily study plan, Cornell notes, dot grid.
  Generate them from local deterministic definitions. Changing a template must
  never erase handwriting. Real thumbnails must show actual page content.
- Split view: two independently scoped editors/panes; focused pane receives
  shortcuts. Start with distinct notes; prevent two editable copies of the same
  note until shared state and conflict handling are explicitly designed.
- Optional manually authored flashcards and reveal practice, without AI.

Phase 3 — optional heavier capabilities (separate changes):
- PDF annotation: locally bundle PDF.js and its worker. Read user-selected bytes,
  never upload. Keep original PDF bytes as an attachment, lazily rasterize visible
  pages with bounded resolution/memory, and store annotations separately. Handle
  rotated/password-protected/corrupt PDFs. Export composed annotations with paper
  dimensions preserved. Do not pretend a background image is semantic PDF editing.
- Audio: use getUserMedia/MediaRecorder only after a record-button click. Feature
  detect MIME types, save incremental chunks to IndexedDB, release microphone
  tracks on stop/error/unmount, and handle denied permission/background suspension.
- Note replay: save recording ID and monotonic elapsed time on stroke creation,
  accounting for pause/resume. In explicit replay mode, tapping a stroke seeks
  local audio. Editing or moving a stroke must not change its original timestamp.
  Do not infer timing from mutable Excalidraw 'updated' timestamps.

Visual direction: quiet white paper on a cool blue-gray desk, local Assistant UI
font, restrained blue focus/selection states, readable page list and 44px targets.
Keep a reachable Exit focus control and keyboard Escape. Respect system gestures.
Do not imitate proprietary Notability assets or claim native iPad feature parity.

Acceptance tests: image/ink persistence, rapid page switching, editing during
in-flight saves, simultaneous saves, cross-tab conflicts, save failures, malformed
imports, migration rollback, focus/fullscreen fallback, keyboard-only navigation,
tablet layout and real Apple Pencil behavior. Run targeted Vitest, typecheck,
lint and production build. Document hardware/browser tests you could not run.
```
