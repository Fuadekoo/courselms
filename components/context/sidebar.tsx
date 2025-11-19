"use client";

import React, { createContext, useContext, ReactNode, useCallback } from "react";
import { useUIStore } from "@/stores/uiStore";

interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  isSide: boolean;
  setIsSide: React.Dispatch<React.SetStateAction<boolean>>;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed);
  const setSidebarCollapsedStore = useUIStore((state) => state.setSidebarCollapsed);
  const sidebarVisible = useUIStore((state) => state.sidebarVisible);
  const setSidebarVisibleStore = useUIStore((state) => state.setSidebarVisible);

  // Create Dispatch-compatible setters that support both boolean and function updates
  const setIsCollapsed = useCallback(
    (value: React.SetStateAction<boolean>) => {
      if (typeof value === "function") {
        setSidebarCollapsedStore(value(sidebarCollapsed));
      } else {
        setSidebarCollapsedStore(value);
      }
    },
    [sidebarCollapsed, setSidebarCollapsedStore]
  );

  const setIsSide = useCallback(
    (value: React.SetStateAction<boolean>) => {
      if (typeof value === "function") {
        setSidebarVisibleStore(value(sidebarVisible));
      } else {
        setSidebarVisibleStore(value);
      }
    },
    [sidebarVisible, setSidebarVisibleStore]
  );

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed: sidebarCollapsed,
        setIsCollapsed,
        isSide: sidebarVisible,
        setIsSide,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

