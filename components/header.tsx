"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useParams, useRouter, useSearchParams } from "next/navigation";
import { ShoppingCart, Search, Sun, Moon, Menu, X } from "lucide-react";
import User from "./user";
import { Button, Input } from "@heroui/react";
import { cn } from "@/lib/utils";
import { useUserData } from "@/hooks/useUserData";
import Logo from "./Logo";
import { useTheme } from "next-themes";

export default function Header({
  navItems = [],
}: {
  navItems?: { label: string; url: string; icon: React.ReactNode }[];
}) {
  const pathname = usePathname();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { userName, isLoading: isLoadingUser } = useUserData();
  const [searchQuery, setSearchQuery] = useState(searchParams?.get("search") || "");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync search query with URL
  useEffect(() => {
    setSearchQuery(searchParams?.get("search") || "");
  }, [searchParams]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
      router.push(
      `/${lang}/course${
        searchQuery.trim() ? `?search=${encodeURIComponent(searchQuery.trim())}` : ""
      }`
      );
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-300",
          "left-0 w-full"
        )}
      >
        <div className="relative flex h-16 items-center justify-between px-4 md:px-6 gap-4">
          {/* Left Side: Logo and Mobile Menu Button */}
          <div className="flex items-center gap-3 lg:gap-4 lg:ml-12">
            {/* Mobile Menu Button */}
            <Button
              isIconOnly
              variant="light"
              size="sm"
              onPress={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-gray-700 dark:text-gray-300"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </Button>
            <Logo />
          </div>

          {/* Center: Search Bar - Hidden on mobile, shown on tablet+ */}
          <form
            onSubmit={handleSearch}
            className="flex-1 max-w-2xl hidden md:block"
          >
            <Input
              type="text"
              placeholder={
                lang === "en" ? "What do you want to learn?" : "ምን መማር ይፈልጋሉ?"
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startContent={<Search className="size-4 text-primary-500" />}
              classNames={{
                base: "w-full",
                input: "text-sm",
                inputWrapper:
                  "border-gray-300 dark:border-gray-700 hover:border-primary-500 focus-within:!border-primary-500 bg-gray-50 dark:bg-gray-800",
              }}
            />
          </form>

          {/* Right Side: Desktop Actions */}
          <div className="items-center gap-3 hidden md:flex">
            {/* Shopping Cart */}
            <Button
              isIconOnly
              variant="light"
              size="sm"
              onPress={() => router.push(`/${lang}/mycourse`)}
              className="relative text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="size-5" />
              <span className="absolute top-1 right-1 size-2 bg-red-500 rounded-full"></span>
            </Button>

            {/* User Profile */}
            {!isLoadingUser && (
              <User userName={userName} navItems={navItems} />
            )}
            {isLoadingUser && (
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
            )}

            {/* Theme Toggle */}
            {mounted && (
              <Button
                isIconOnly
                variant="light"
                size="sm"
                onPress={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                aria-label={
                  theme === "dark"
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
              >
                {theme === "dark" ? (
                  <Sun className="size-5 text-amber-500" />
                ) : (
                  <Moon className="size-5 text-indigo-600 dark:text-indigo-400" />
                )}
              </Button>
            )}

            {/* Language Selector - Hidden on screens 425px and smaller */}
            <Button
              variant="flat"
              size="sm"
              onPress={() =>
                router.push(
                  `/${lang === "en" ? "am" : "en"}/${
                    pathname?.split("/").slice(2).join("/") || ""
                  }`
                )
              }
              className="max-[425px]:hidden text-xs font-medium text-primary-700 dark:text-primary-300 bg-primary-100 dark:bg-primary-900/30 hover:bg-primary-200 dark:hover:bg-primary-800"
            >
              {lang === "en" ? "አማ" : "EN"}
            </Button>
          </div>

          {/* Mobile: Language and Login - Visible on mobile when menu is closed (below 768px only) */}
          {!isMobileMenuOpen && (
            <div className="flex items-center gap-2 md:hidden">
              {/* Language Selector - Mobile - Hidden on screens 425px and smaller */}
              <Button
                variant="flat"
                size="sm"
                onPress={() =>
                  router.push(
                    `/${lang === "en" ? "am" : "en"}/${
                      pathname?.split("/").slice(2).join("/") || ""
                    }`
                  )
                }
                className="max-[425px]:hidden text-xs font-medium text-primary-700 dark:text-primary-300 bg-primary-100 dark:bg-primary-900/30"
              >
                {lang === "en" ? "አማ" : "EN"}
              </Button>

              {/* Login Button - Mobile (if not logged in) */}
              {!isLoadingUser && !userName && (
                <Button
                  variant="flat"
                  size="sm"
                  color="primary"
                  onPress={() => router.push(`/${lang}/login`)}
                  className="text-xs font-medium"
                >
                  {lang === "en" ? "Login" : "ግባ"}
                </Button>
              )}

              {/* User Icon - Mobile (if logged in) */}
              {!isLoadingUser && userName && <User userName={userName} navItems={navItems} />}
              
              {/* Loading Placeholder - Mobile */}
              {isLoadingUser && (
                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
              )}
            </div>
          )}
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer */}
      <div
        className={cn(
          "fixed top-16 left-0 z-50 h-[calc(100vh-4rem)] w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out md:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full overflow-y-auto p-4 gap-4">
          {/* Mobile Search Bar */}
          <form onSubmit={handleSearch} className="w-full">
            <Input
              type="text"
              placeholder={
                lang === "en" ? "What do you want to learn?" : "ምን መማር ይፈልጋሉ?"
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startContent={<Search className="size-4 text-primary-500" />}
              classNames={{
                base: "w-full",
                input: "text-sm",
                inputWrapper:
                  "border-gray-300 dark:border-gray-700 hover:border-primary-500 focus-within:!border-primary-500 bg-gray-50 dark:bg-gray-800",
              }}
            />
          </form>

          {/* Shopping Cart - Mobile */}
          <Button
            variant="light"
            onPress={() => {
              router.push(`/${lang}/mycourse`);
              setIsMobileMenuOpen(false);
            }}
            className="justify-start text-gray-700 dark:text-gray-300"
            startContent={<ShoppingCart className="size-5" />}
          >
            {lang === "en" ? "My Courses" : "የእኔ ኮርሶች"}
            <span className="ml-2 size-2 bg-red-500 rounded-full"></span>
          </Button>

          {/* Theme Toggle - Mobile */}
          {mounted && (
            <Button
              variant="light"
              onPress={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="justify-start text-gray-700 dark:text-gray-300"
              startContent={
                theme === "dark" ? (
                  <Sun className="size-5 text-amber-500" />
                ) : (
                  <Moon className="size-5 text-indigo-600 dark:text-indigo-400" />
                )
              }
            >
              {theme === "dark"
                ? lang === "en"
                  ? "Light Mode"
                  : "ብርሃን ሞድ"
                : lang === "en"
                ? "Dark Mode"
                : "ጨለማ ሞድ"}
            </Button>
          )}

          {/* Language button removed from mobile menu - only visible on large screens and up */}

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700 my-2" />

          {/* User Section - Mobile */}
          {isLoadingUser ? (
            <div className="flex flex-col gap-2 px-2">
              <div className="h-4 w-24 bg-gray-200 animate-pulse rounded" />
              <div className="h-10 w-full bg-gray-200 animate-pulse rounded" />
            </div>
          ) : userName ? (
            <div className="flex flex-col gap-2">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 px-2">
                {userName}
              </div>
              <User userName={userName} navItems={navItems} />
            </div>
          ) : (
            <Button
              color="primary"
              onPress={() => {
                router.push(`/${lang}/login`);
                setIsMobileMenuOpen(false);
              }}
              className="w-full font-medium"
            >
              {lang === "en" ? "Login" : "ግባ"}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
