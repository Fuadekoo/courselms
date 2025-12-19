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
      "relative",
      "bg-gradient-to-br from-gray-50 via-gray-50/50 to-white dark:from-gray-950 dark:via-gray-900/50 dark:to-gray-900"
    )}>
      {/* Background layers - applied to all pages */}
        <>
          {/* Layer 1 - First blur layer (12px) */}
          <div
            className="absolute inset-0 opacity-55 dark:opacity-45"
            style={{
              backgroundImage: `url('/darulkubra.png')`,
              backgroundSize: "40%",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              filter: "blur(12px) brightness(1.05)",
              transform: "scale(1)",
            }}
          />
          {/* Layer 2 - Second blur layer (24px) */}
          <div
            className="absolute inset-0 opacity-50 dark:opacity-40"
            style={{
              backgroundImage: `url('/darulkubra.png')`,
              backgroundSize: "35%",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              filter: "blur(24px) brightness(1.05)",
              transform: "scale(1)",
            }}
          />
          {/* Layer 3 - Third blur layer (40px) - deep blur */}
          <div
            className="absolute inset-0 opacity-40 dark:opacity-30"
            style={{
              backgroundImage: `url('/darulkubra.png')`,
              backgroundSize: "30%",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              filter: "blur(40px) brightness(1.05)",
              transform: "scale(1)",
            }}
          />
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
