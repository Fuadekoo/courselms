"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

type LoaderType = "newtons-cradle" | "bouncy" | "dot-spinner" | "ring";

interface LoadingProps {
  className?: string;
  type?: LoaderType;
  size?: string;
  speed?: string;
  color?: string;
  message?: string;
}

export function LoadingVariants({
  className,
  type = "newtons-cradle",
  size = "78",
  speed = "1.4",
  color = "rgb(14 165 233)",
  message = "Loading...",
}: LoadingProps) {
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadLoader = async () => {
      const ldrs = await import("ldrs");

      // Register the appropriate loader
      switch (type) {
        case "newtons-cradle":
          ldrs.newtonsCradle.register();
          break;
        case "bouncy":
          ldrs.bouncy.register();
          break;
        case "dot-spinner":
          ldrs.dotSpinner.register();
          break;
        case "ring":
          ldrs.ring.register();
          break;
      }

      // Create the custom element
      if (loaderRef.current && loaderRef.current.children.length === 0) {
        const elementName = `l-${type}`;
        const loader = document.createElement(elementName);
        loader.setAttribute("size", size);
        loader.setAttribute("speed", speed);
        loader.setAttribute("color", color);
        loaderRef.current.appendChild(loader);
      }
    };

    loadLoader();
  }, [type, size, speed, color]);

  return (
    <div
      className={cn(
        "size-full backdrop-blur-sm grid place-content-center",
        className
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <div ref={loaderRef} />
        {message && (
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium animate-pulse">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

// Pre-configured variants for easy use

export function NewtonsCradleLoader({ className }: { className?: string }) {
  return (
    <LoadingVariants
      className={className}
      type="newtons-cradle"
      size="78"
      speed="1.4"
      color="rgb(14 165 233)"
    />
  );
}

export function BouncyLoader({ className }: { className?: string }) {
  return (
    <LoadingVariants
      className={className}
      type="bouncy"
      size="50"
      speed="1.75"
      color="rgb(14 165 233)"
    />
  );
}

export function DotSpinnerLoader({ className }: { className?: string }) {
  return (
    <LoadingVariants
      className={className}
      type="dot-spinner"
      size="50"
      speed="0.9"
      color="rgb(14 165 233)"
    />
  );
}

export function RingLoader({ className }: { className?: string }) {
  return (
    <LoadingVariants
      className={className}
      type="ring"
      size="50"
      speed="2"
      color="rgb(14 165 233)"
    />
  );
}

