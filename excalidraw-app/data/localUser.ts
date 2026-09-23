import { getRandomUsername } from "@excalidraw/random-username";
import { STORAGE_KEYS } from "../app_constants";
import { importLegacyUsernameFromLocalStorage } from "./localStorage";

/**
 * Anonymous, device-local identity. There is no server-side account — the
 * user is identified solely by this record in localStorage.
 */
export type LocalUser = {
  id: string;
  name: string;
  createdAt: number;
};

const generateId = () => {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
};

const saveLocalUser = (user: LocalUser) => {
  try {
    localStorage.setItem(STORAGE_KEYS.LOCAL_STORAGE_USER, JSON.stringify(user));
  } catch (error: any) {
    // storage full or disabled (private mode) — identity is then per-session
    console.error(error);
  }
};

export const getLocalUser = (): LocalUser => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOCAL_STORAGE_USER);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.id === "string" && typeof parsed?.name === "string") {
        return parsed;
      }
    }
  } catch (error: any) {
    console.error(error);
  }
  const user: LocalUser = {
    id: generateId(),
    name: importLegacyUsernameFromLocalStorage() || getRandomUsername(),
    createdAt: Date.now(),
  };
  saveLocalUser(user);
  return user;
};

export const renameLocalUser = (name: string): LocalUser => {
  const user = { ...getLocalUser(), name: name.trim() || getRandomUsername() };
  saveLocalUser(user);
  return user;
};
