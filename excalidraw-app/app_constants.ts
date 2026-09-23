// time constants (ms)
export const SAVE_TO_LOCAL_STORAGE_TIMEOUT = 300;
export const SYNC_BROWSER_TABS_TIMEOUT = 50;

export const STORAGE_KEYS = {
  LOCAL_STORAGE_ELEMENTS: "excalidraw",
  LOCAL_STORAGE_APP_STATE: "excalidraw-state",
  // legacy key holding the collab username, read once to seed the local user
  LOCAL_STORAGE_COLLAB: "excalidraw-collab",
  LOCAL_STORAGE_USER: "draw-local-user",
  LOCAL_STORAGE_THEME: "excalidraw-theme",
  VERSION_DATA_STATE: "version-dataState",
  VERSION_FILES: "version-files",

  IDB_LIBRARY: "excalidraw-library",

  // do not use apart from migrations
  __LEGACY_LOCAL_STORAGE_LIBRARY: "excalidraw-library",
} as const;

export const APP_SOURCE_URL = "https://github.com/stormdotcom/excalidraw";
export const EXCALIDRAW_SOURCE_URL = "https://github.com/excalidraw/excalidraw";
export const AUTHOR_NAME = "ajmalnasumudeen";
export const AUTHOR_URL = "https://ajmalnasumudeen.in";
