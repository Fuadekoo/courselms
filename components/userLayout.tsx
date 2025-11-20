"use client";

import React from "react";
import Header from "./header";
import { cn } from "@/lib/utils";

function UserLayoutContent({
  children,
  list,
}: {
  children: React.ReactNode;
  list: { label: string; url: string; icon: React.ReactNode }[];
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-950 dark:via-blue-950/20 dark:to-purple-950/10 relative">
      {/* Professional dark mode background pattern */}
      <div className="dark:absolute dark:inset-0 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 dark:opacity-100">
        <div className="dark:absolute dark:inset-0 dark:bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.03)_0%,transparent_50%)] dark:opacity-100"></div>
        <div className="dark:absolute dark:inset-0 dark:bg-[linear-gradient(45deg,rgba(30,58,138,0.02)_0%,transparent_50%,rgba(67,56,202,0.02)_100%)] dark:opacity-100"></div>
        <div className="dark:absolute dark:inset-0 dark:bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.02)_0%,transparent_70%)] dark:opacity-100"></div>
      </div>
      
      {/* Sidebar removed - navigation moved to profile dropdown */}
      <Header navItems={list} />
      <main className={cn(
        "pt-16 transition-all duration-300 bg-gradient-to-br from-transparent via-white/50 to-white/80 dark:from-transparent dark:via-gray-900/50 dark:to-gray-900/80 relative z-10"
      )}>
        <div className="px-4 md:px-6 py-6">
          {children}
        </div>
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
