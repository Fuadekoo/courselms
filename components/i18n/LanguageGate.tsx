"use client";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  useLanguageStore,
  type Lang,
  ensureHtmlLangObserver,
} from "./useLanguageStore";

type Lang = "en" | "am" | "ar";

const LANGS: Array<{ code: Lang; label: string }> = [
  { code: "en", label: "English" },
  { code: "am", label: "Amharic" },
  { code: "ar", label: "Arabic" },
];

function getCookie(name: string) {
  if (typeof document === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="))
    ?.split("=")[1];
}

function setCookie(name: string, value: string, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; expires=${expires}; path=/; SameSite=Lax`;
}

export default function LanguageGate() {
  const pathname = usePathname();
  const { initFromCookie, hasCookie, setLang, lang } = useLanguageStore();
  const [show, setShow] = useState(false);

  useEffect(() => {
    ensureHtmlLangObserver(); // keep <html lang> <-> cookie/store in sync
    initFromCookie();
    setShow(!hasCookie());
  }, []);

  // Try to act like the header language button if it exposes a handler
  const invokeHeaderLanguageChange = (l: Lang) => {
    const w = window as any;
    if (typeof w.__headerSetLanguage === "function") {
      // If your header registers a global setter, prefer it
      w.__headerSetLanguage(l);
      return true;
    }
    // Otherwise notify any header listener
    window.dispatchEvent(new CustomEvent("app:set-language", { detail: l }));
    return false;
  };

  const choose = (l: Lang) => {
    // Persist to cookie + store + <html lang>
    setLang(l);
    setShow(false);

    // Build target href exactly like header:
    const targetHref = `/${l}/${(pathname ?? "")
      .split("/")
      .slice(2)
      .join("/")}`;

    // Navigate and reload so SSR picks cookie and route param
    window.location.href = targetHref;
  };

  if (!show) return null;

  return (
    <>
      {/* Popup shown only on first visit (no cookie) */}
      {show && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#0f172a",
              color: "#fff",
              borderRadius: 12,
              padding: 20,
              width: "90%",
              maxWidth: 480,
              boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
            }}
          >
            <h2
              style={{
                margin: 0,
                marginBottom: 12,
                fontSize: 18,
                textAlign: "center",
              }}
            >
              Select your language
            </h2>
            <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
              <button
                onClick={() => choose("am")}
                style={{
                  flex: 1,
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: "1px solid #334155",
                  background: "#111827",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                አማርኛ (Amharic)
              </button>
              <button
                onClick={() => choose("en")}
                style={{
                  flex: 1,
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: "1px solid #334155",
                  background: "#111827",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                English
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating quick-switch buttons (left/right) */}
      {!show && (
        <>
          <button
            title="አማርኛ"
            onClick={() => choose("am")}
            style={{
              position: "fixed",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              background: lang === "am" ? "#3b82f6" : "#0f172a",
              color: "#fff",
              border: "1px solid #334155",
              borderRadius: 999,
              padding: "10px 12px",
              zIndex: 9998,
              cursor: "pointer",
            }}
          >
            AM
          </button>
          <button
            title="English"
            onClick={() => choose("en")}
            style={{
              position: "fixed",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              background: lang === "en" ? "#3b82f6" : "#0f172a",
              color: "#fff",
              border: "1px solid #334155",
              borderRadius: 999,
              padding: "10px 12px",
              zIndex: 9998,
              cursor: "pointer",
            }}
          >
            EN
          </button>
        </>
      )}
    </>
  );
}
