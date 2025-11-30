"use client";

import React from "react";
import GuestHeader from "@/components/GuestHeader";
import { cn } from "@/lib/utils";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn(
      "min-h-screen relative",
      "bg-gradient-to-br from-gray-50 via-gray-50/50 to-white dark:from-gray-950 dark:via-gray-900/50 dark:to-gray-900"
    )}>
      {/* Background layers - applied to all pages */}
      <>
        {/* Layer 1 - Top: Minimal blur (1px) */}
        <div
          className="absolute inset-0 opacity-55 dark:opacity-45"
          style={{
            backgroundImage: `url('/darulkubra.png')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            filter: "blur(1px) brightness(1.05)",
            transform: "scale(1.01)",
            maskImage: "linear-gradient(to bottom, black 0%, black 30%, rgba(0,0,0,0.8) 50%, rgba(0,0,0,0.4) 70%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 30%, rgba(0,0,0,0.8) 50%, rgba(0,0,0,0.4) 70%, transparent 100%)",
          }}
        />
        {/* Overlay for better content readability */}
        <div className="absolute inset-0 bg-white/20 dark:bg-gray-900/25 pointer-events-none" />
      </>
      
      <GuestHeader />
      <main className="w-full relative z-10 pt-0">
        {children}
      </main>
    </div>
  );
}
