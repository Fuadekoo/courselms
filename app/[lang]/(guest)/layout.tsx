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
        {/* Layer 1 - First blur layer (12px) */}
        <div
          className="absolute inset-0 opacity-55 dark:opacity-45"
          style={{
            backgroundImage: `url('/darulkubra.png')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            filter: "blur(12px) brightness(1.05)",
            transform: "scale(1.02)",
          }}
        />
        {/* Layer 2 - Second blur layer (24px) */}
        <div
          className="absolute inset-0 opacity-50 dark:opacity-40"
          style={{
            backgroundImage: `url('/darulkubra.png')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            filter: "blur(24px) brightness(1.05)",
            transform: "scale(1.03)",
          }}
        />
        {/* Layer 3 - Third blur layer (40px) - deep blur */}
        <div
          className="absolute inset-0 opacity-40 dark:opacity-30"
          style={{
            backgroundImage: `url('/darulkubra.png')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            filter: "blur(40px) brightness(1.05)",
            transform: "scale(1.04)",
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
