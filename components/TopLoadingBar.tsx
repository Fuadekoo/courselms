"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function TopLoadingBar() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Start loading when route changes
    setLoading(true);
    setProgress(0);

    // Simulate progress with realistic timing
    let currentProgress = 0;
    const interval = setInterval(() => {
      if (currentProgress >= 90) {
        clearInterval(interval);
        return;
      }
      // Accelerate progress faster at the start, slower near the end
      const increment = currentProgress < 30 ? 20 : currentProgress < 60 ? 12 : 6;
      currentProgress = Math.min(currentProgress + increment, 90);
      setProgress(currentProgress);
    }, 80);

    // Complete when route change is done (after a short delay)
    const timeout = setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 150);
    }, 400);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [pathname, searchParams]);

  if (!loading && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent pointer-events-none"
      style={{
        opacity: loading ? 1 : 0,
        transition: "opacity 0.2s ease-out",
      }}
    >
      <div
        className="h-full bg-gradient-to-r from-primary-500 via-primary-600 to-primary-500 shadow-lg shadow-primary-500/50 relative overflow-hidden"
        style={{
          width: `${progress}%`,
          transition: "width 0.15s ease-out",
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
  );
}

