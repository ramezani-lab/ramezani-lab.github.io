"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { THEME_STORAGE_KEY } from "./theme-key";

export type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  /** Recomputes the resolved theme; called when the OS preference changes. */
  syncSystem: () => void;
}

function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolve(theme: Theme): "light" | "dark" {
  if (theme !== "system") return theme;
  return systemPrefersDark() ? "dark" : "light";
}

/**
 * Writes the resolved theme to the document: the class Tailwind's `dark:`
 * variant and the token overrides key off, plus `color-scheme` so native
 * controls and scrollbars follow.
 */
function applyToDocument(resolved: "light" | "dark") {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

/**
 * Theme state, persisted by zustand. The first paint is handled by the
 * blocking script in the head, which reads the same key; this store takes over
 * once the app hydrates. Default is the light (cream) theme.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "light",
      resolvedTheme: "light",

      setTheme: (theme) => {
        const resolvedTheme = resolve(theme);
        applyToDocument(resolvedTheme);
        set({ theme, resolvedTheme });
      },

      syncSystem: () => {
        if (get().theme !== "system") return;
        const resolvedTheme = resolve("system");
        applyToDocument(resolvedTheme);
        set({ resolvedTheme });
      },
    }),
    {
      name: THEME_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        // Align the resolved value with what the head script already painted.
        state?.setTheme(state.theme);
      },
    },
  ),
);
