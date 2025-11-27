"use client";
import { create } from "zustand";

export type Lang = "en" | "am";

function getCookie(name: string): string | undefined {
  // Avoid SSR usage
  if (typeof document === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="))
    ?.split("=")[1];
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; expires=${expires}; path=/; SameSite=Lax`;
}

interface LanguageState {
  lang: Lang;
  // Initialize from cookie if present; also sync <html lang>
  initFromCookie: () => void;
  // Set language, persist to cookie and sync <html lang>
  setLang: (lang: Lang) => void;
  // Helper: whether cookie is set
  hasCookie: () => boolean;
  // Toggle language
  toggleLang: () => void;
}

// Ensure we only attach once
let htmlLangObserverStarted = false;

/**
 * Call this once on the client to keep cookie/store in sync
 * when <html lang="..."> changes from anywhere (e.g., top bar selector).
 */
export function ensureHtmlLangObserver() {
  if (typeof window === "undefined" || htmlLangObserverStarted) return;
  htmlLangObserverStarted = true;

  const allowed: ReadonlyArray<Lang> = ["en", "am"];
  const obs = new MutationObserver(() => {
    const raw = document.documentElement.lang?.trim().toLowerCase();
    const next = allowed.includes(raw as Lang) ? (raw as Lang) : undefined;
    if (!next) return;

    const { lang } = useLanguageStore.getState();
    if (lang !== next) {
      // Update cookie and store (do not write html.lang here to avoid loops)
      // persist cookie
      const expires = new Date(Date.now() + 365 * 864e5).toUTCString();
      document.cookie = `local_lang=${encodeURIComponent(
        next
      )}; expires=${expires}; path=/; SameSite=Lax`;
      // update store
      useLanguageStore.setState({ lang: next });
      // optional notify
      window.dispatchEvent(new CustomEvent("langchange", { detail: next }));
    }
  });

  obs.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["lang"],
  });
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  lang: "en",
  initFromCookie: () => {
    const existing =
      typeof document !== "undefined"
        ? document.cookie
            .split("; ")
            .find((r) => r.startsWith("local_lang="))
            ?.split("=")[1]
        : undefined;
    if (existing) {
      const v = decodeURIComponent(existing) as Lang;
      set({ lang: v });
      if (
        typeof document !== "undefined" &&
        document.documentElement.lang !== v
      ) {
        document.documentElement.lang = v;
      }
    } else if (typeof document !== "undefined") {
      document.documentElement.lang = get().lang;
    }
  },
  setLang: (l: Lang) => {
    set({ lang: l });
    if (typeof document !== "undefined") {
      if (document.documentElement.lang !== l) {
        document.documentElement.lang = l;
      }
      const expires = new Date(Date.now() + 365 * 864e5).toUTCString();
      document.cookie = `local_lang=${encodeURIComponent(
        l
      )}; expires=${expires}; path=/; SameSite=Lax`;
      window.dispatchEvent(new CustomEvent("langchange", { detail: l }));
    }
  },
  hasCookie: () => {
    return (
      typeof document !== "undefined" && document.cookie.includes("local_lang=")
    );
  },
  toggleLang: () => {
    const next = get().lang === "en" ? "am" : "en";
    get().setLang(next);
  },
}));
