"use client";

import { useEffect } from "react";

/**
 * Suppresses harmless browser extension connection errors
 * that occur when extensions try to connect but fail
 */
export default function ErrorSuppressor() {
  useEffect(() => {
    // Suppress "Could not establish connection" errors from browser extensions
    const handleError = (event: ErrorEvent) => {
      const message = event.message || "";
      if (
        message.includes("Could not establish connection") ||
        message.includes("Receiving end does not exist")
      ) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        reason?.message ||
        reason?.toString() ||
        "";

      if (
        message.includes("Could not establish connection") ||
        message.includes("Receiving end does not exist")
      ) {
        event.preventDefault();
        return false;
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
}

