"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

export default function Loading({ className }: { className?: string }) {
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Dynamically import and register the loader
    const loadNewtonsCradle = async () => {
      const { newtonsCradle } = await import("ldrs");
      newtonsCradle.register();
      
      // Create the custom element
      if (loaderRef.current && loaderRef.current.children.length === 0) {
        const loader = document.createElement("l-newtons-cradle");
        loader.setAttribute("size", "78");
        loader.setAttribute("speed", "1.4");
        loader.setAttribute("color", "rgb(14 165 233)");
        loaderRef.current.appendChild(loader);
      }
    };

    loadNewtonsCradle();
  }, []);

  return (
    <div
      className={cn(
        "size-full backdrop-blur-sm grid place-content-center",
        className
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <div ref={loaderRef} />
        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium animate-pulse">
          Loading...
        </p>
      </div>
    </div>
  );
}
