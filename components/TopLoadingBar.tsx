"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useUIStore } from "@/stores/uiStore";

export default function TopLoadingBar() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prevPathnameRef = useRef<string | null>(null);
  const isInitialMount = useRef(true);
  const loadingStates = useUIStore((state) => state.loadingStates);
  const hasAnyLoading = Object.values(loadingStates).some((isLoading) => isLoading);

  useEffect(() => {
    // Skip on initial mount - only show on actual navigation
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevPathnameRef.current = pathname;
      return;
    }

    // Only trigger if pathname actually changed (navigation occurred)
    if (prevPathnameRef.current === pathname) {
      return;
    }

    // Mark that navigation started
    prevPathnameRef.current = pathname;
    setLoading(true);
    setProgress(0);
    
    // Clear all previous loading states when route changes
    const { loadingStates } = useUIStore.getState();
    Object.keys(loadingStates).forEach((key) => {
      useUIStore.getState().setLoadingState(key, false);
    });
  }, [pathname, searchParams]);

  // Monitor loading states and update progress
  useEffect(() => {
    if (!loading) return;

    // If there's any loading, keep progress at 90%
    if (hasAnyLoading) {
      setProgress(90);
      return;
    }

    // All data loaded - complete the bar
    if (progress < 100) {
      setProgress(100);
      // Hide after completion
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 200);
    }
  }, [hasAnyLoading, loading, progress]);

  // Progress animation while waiting for data
  useEffect(() => {
    if (!loading || !hasAnyLoading) return;

    let currentProgress = 10;
    const interval = setInterval(() => {
      if (currentProgress >= 90) {
        clearInterval(interval);
        return;
      }
      // Slow progress while waiting for data
      currentProgress = Math.min(currentProgress + 2, 90);
      setProgress(currentProgress);
    }, 100);

    return () => clearInterval(interval);
  }, [loading, hasAnyLoading]);

  // Export loading state to global store so pages can hide content
  useEffect(() => {
    useUIStore.getState().setGlobalLoading(loading);
  }, [loading]);

  if (!loading && progress === 0) return null;

  return (
    <>
      {/* Overlay to block content while loading */}
      {loading && (
        <div
          className="fixed inset-0 top-16 z-[9998] bg-white dark:bg-gray-900 pointer-events-none"
          style={{
            opacity: loading ? 1 : 0,
            transition: "opacity 0.2s ease-out",
          }}
        />
      )}
      {/* Loading bar */}
      <div
        className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent pointer-events-none"
        style={{
          opacity: loading ? 1 : 0,
          transition: "opacity 0.15s ease-out",
        }}
      >
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-primary-600 shadow-lg shadow-primary-500/50 relative overflow-hidden"
          style={{
            width: `${progress}%`,
            transition: "width 0.1s linear",
            boxShadow: "0 0 10px rgba(14, 165, 233, 0.5), 0 0 5px rgba(14, 165, 233, 0.3)",
          }}
        >
          {/* Shimmer effect */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
            style={{
              animation: "shimmer 1.5s infinite",
              transform: "translateX(-100%)",
            }}
          />
        </div>
        <style jsx global>{`
          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(200%);
            }
          }
        `}</style>
      </div>
    </>
  );
}

