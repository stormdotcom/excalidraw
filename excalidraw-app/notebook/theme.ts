import { useCallback, useEffect, useState } from "react";

// Shared with the whiteboard (see app_constants STORAGE_KEYS.LOCAL_STORAGE_THEME)
// so both pages always use the same light / dark choice.
const THEME_KEY = "excalidraw-theme";

type ThemeSetting = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const readSetting = (): ThemeSetting => {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === "dark" || value === "system" ? value : "light";
  } catch {
    return "light";
  }
};

const systemPrefersDark = () =>
  !!window.matchMedia?.("(prefers-color-scheme: dark)").matches;

const resolve = (setting: ThemeSetting): ResolvedTheme =>
  setting === "system" ? (systemPrefersDark() ? "dark" : "light") : setting;

export const useNotebookTheme = () => {
  const [setting, setSetting] = useState<ThemeSetting>(readSetting);
  const [theme, setTheme] = useState<ResolvedTheme>(() =>
    resolve(readSetting()),
  );

  useEffect(() => {
    setTheme(resolve(setting));
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onSystemChange = () => setTheme(resolve(setting));
    // the whiteboard may change the theme in another tab
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_KEY) {
        setSetting(readSetting());
      }
    };
    if (setting === "system") {
      media?.addEventListener("change", onSystemChange);
    }
    window.addEventListener("storage", onStorage);
    return () => {
      media?.removeEventListener("change", onSystemChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [setting]);

  useEffect(() => {
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#121212" : "#f4f4f8");
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const next: ThemeSetting = theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // storage unavailable: still switch for this session
    }
    setSetting(next);
  }, [theme]);

  return { theme, toggleTheme };
};
