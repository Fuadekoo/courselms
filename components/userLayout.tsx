"use client";

import React from "react";
import Header from "./header";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

function UserLayoutContent({
  children,
  list,
}: {
  children: React.ReactNode;
  list: { label: string; url: string; icon: React.ReactNode }[];
}) {
  const pathname = usePathname();
  const isHomePage = pathname?.includes("/home");
  
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
      {/* Layer 2 - Upper-Mid: Light blur (2.5px) - Hidden */}
      {/* <div
        className="absolute inset-0 opacity-52 dark:opacity-42"
        style={{
          backgroundImage: `url('/darulkubra.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          filter: "blur(2.5px) brightness(1.05)",
          transform: "scale(1.01)",
          maskImage: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.9) 70%, rgba(0,0,0,0.5) 85%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.9) 70%, rgba(0,0,0,0.5) 85%, transparent 100%)",
        }}
      /> */}
      {/* Layer 3 - Mid: Moderate blur (4px) - Hidden */}
      {/* <div
        className="absolute inset-0 opacity-50 dark:opacity-40"
        style={{
          backgroundImage: `url('/darulkubra.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          filter: "blur(4px) brightness(1.05)",
          transform: "scale(1.01)",
          maskImage: "linear-gradient(to bottom, transparent 0%, transparent 20%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0.9) 80%, rgba(0,0,0,0.7) 90%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, transparent 20%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0.9) 80%, rgba(0,0,0,0.7) 90%, transparent 100%)",
        }}
      /> */}
      {/* Layer 4 - Lower-Mid: Medium blur (48px) - Hidden */}
      {/* <div
        className="absolute inset-0 opacity-48 dark:opacity-38"
        style={{
          backgroundImage: `url('/darulkubra.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          filter: "blur(48px) brightness(1.05)",
          transform: "scale(1.01)",
          maskImage: "linear-gradient(to bottom, transparent 0%, transparent 40%, rgba(0,0,0,0.3) 55%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0.95) 85%, black 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, transparent 40%, rgba(0,0,0,0.3) 55%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0.95) 85%, black 100%)",
        }}
      /> */}
      {/* Layer 5 - Bottom: More blurred (72px) - Hidden */}
      {/* <div
        className="absolute inset-0 opacity-45 dark:opacity-35"
        style={{
          backgroundImage: `url('/darulkubra.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          filter: "blur(72px) brightness(1.05)",
          transform: "scale(1.01)",
          maskImage: "linear-gradient(to bottom, transparent 0%, transparent 60%, rgba(0,0,0,0.4) 75%, rgba(0,0,0,0.8) 85%, black 95%, black 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, transparent 60%, rgba(0,0,0,0.4) 75%, rgba(0,0,0,0.8) 85%, black 95%, black 100%)",
        }}
      /> */}
          {/* Overlay for better content readability */}
          <div className="absolute inset-0 bg-white/20 dark:bg-gray-900/25 pointer-events-none" />
        </>
      
      {/* Sidebar removed - navigation moved to profile dropdown */}
      <Header navItems={list} />
      <main className={cn(
        "pt-16 transition-all duration-300 relative z-10",
        isHomePage && "pt-0"
      )}>
        {isHomePage ? (
          <div className="w-full">
            {children}
          </div>
        ) : (
          <div className="px-4 md:px-6 py-6">
            {children}
          </div>
        )}
      </main>
    </div>
  );
}

export default function UserLayout({
  children,
  list,
}: {
  children: React.ReactNode;
  list: { label: string; url: string; icon: React.ReactNode }[];
}) {
  return (
    <UserLayoutContent list={list}>
      {children}
    </UserLayoutContent>
  );
}
