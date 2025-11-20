"use client";

import { useTheme } from "next-themes";
import {
  useParams,
  usePathname,
  useRouter,
  useSelectedLayoutSegment,
} from "next/navigation";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { Moon, Sun, X } from "lucide-react";
import { Button, Tooltip } from "@heroui/react";
import { useState, useEffect } from "react";

export default function SideBar({
  isSide,
  setIsSide,
  lists,
  isCollapsed,
  setIsCollapsed,
}: {
  isSide: boolean;
  setIsSide: React.Dispatch<React.SetStateAction<boolean>>;
  lists: { label: string; url: string; icon: React.ReactNode }[];
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";
  const pathname = usePathname();
  const selectedSegment = useSelectedLayoutSegment() || "";
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isSide && (
        <div
          onClick={() => setIsSide(false)}
          className="fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm md:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "transition-all duration-300",
          "md:z-50 max-md:z-[60]", // Higher z-index for mobile to appear above header
          // Desktop styles - Fixed positioning
          "md:fixed md:left-0 md:top-0 md:flex md:flex-col md:h-screen",
          isCollapsed ? "md:w-16" : "md:w-64",
          // Mobile styles
          "max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:w-80 max-md:transform",
          isSide ? "max-md:translate-x-0" : "max-md:-translate-x-full"
        )}
      >
        <div
          className={cn(
            "bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 grid grid-rows-[auto_1fr_auto] h-full transition-all duration-300 relative overflow-hidden",
            isCollapsed ? "md:w-16" : "md:w-64",
            "max-md:w-80"
          )}
        >
          {/* Header Section */}
          <div
            className={cn(
              "relative flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800",
              isCollapsed && "md:justify-center md:px-2"
            )}
          >
            <div
              className={cn(
                "flex items-center gap-3 transition-all duration-300",
                isCollapsed && "md:justify-center"
              )}
            >
              <div className="relative group">
                <div className="relative bg-blue-600 dark:bg-blue-500 rounded-lg p-2">
                  <Image
                    src="/darulkubra.svg"
                    alt="Darul Kubra Logo"
                    width={24}
                    height={24}
                    className="size-6 transition-transform duration-300 group-hover:scale-110 filter brightness-0 invert"
                  />
                </div>
              </div>
              {!isCollapsed && (
                <Link
                  href="/"
                  className="text-sm font-semibold text-gray-900 dark:text-gray-100"
                >
                  {lang === "en" ? "DARUL KUBRA" : "ዳሩል ኩብራ"}
                </Link>
              )}
            </div>

            {/* Close Button - Mobile Only */}
            <Button
              isIconOnly
              variant="light"
              size="sm"
              onPress={() => setIsSide(false)}
              className="md:hidden text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-all duration-200 rounded-lg"
            >
              <X className="size-5" />
            </Button>
          </div>

          {/* Navigation Section */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <nav className="p-2 space-y-1">
              {lists.map(({ label, url, icon }, i) => {
                const isActive = selectedSegment === url;
                return (
                  <Tooltip
                    key={i}
                    content={label}
                    placement="right"
                    isDisabled={!isCollapsed}
                    delay={500}
                  >
                    <Button
                      as={Link}
                      href={`/${lang}/${url}`}
                      onPress={() => setTimeout(() => setIsSide(false), 300)}
                      variant="light"
                      size="md"
                      startContent={
                        <div
                          className={cn(
                            "transition-all duration-200",
                            isActive
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-gray-600 dark:text-gray-400"
                          )}
                        >
                          {icon}
                        </div>
                      }
                      className={cn(
                        "w-full justify-start font-medium transition-all duration-200 rounded-lg",
                        isCollapsed && "md:justify-center md:px-0 md:min-w-0",
                        isActive
                          ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                      )}
                    >
                      {!isCollapsed && (
                        <span className="truncate text-sm">
                          {label}
                        </span>
                      )}
                    </Button>
                  </Tooltip>
                );
              })}
            </nav>
          </div>

          {/* Footer Section */}
          <div className="p-2 border-t border-gray-200 dark:border-gray-800">
            <div
              className={cn(
                "flex gap-3",
                isCollapsed ? "flex-col" : "flex-row"
              )}
            >
              <Tooltip
                content={
                  theme === "dark"
                    ? "Switch to Light Mode"
                    : "Switch to Dark Mode"
                }
                placement="right"
                isDisabled={!isCollapsed}
              >
                <Button
                  isIconOnly={isCollapsed}
                  variant="light"
                  color="secondary"
                  size="sm"
                  onPress={() => setTheme(theme === "light" ? "dark" : "light")}
                  startContent={
                    theme === "dark" ? (
                      <Sun className="size-4 text-amber-500" />
                    ) : (
                      <Moon className="size-4 text-indigo-600 dark:text-indigo-400" />
                    )
                  }
                  className="transition-all duration-200 hover:scale-105 active:scale-95 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {!isCollapsed && (
                    <span className="text-xs font-semibold">
                      {theme === "dark" ? "Light" : "Dark"}
                    </span>
                  )}
                </Button>
              </Tooltip>

              <Tooltip
                content={`Switch to ${lang === "en" ? "Amharic" : "English"}`}
                placement="right"
                isDisabled={!isCollapsed}
              >
                <Button
                  isIconOnly={isCollapsed}
                  variant="light"
                  color="secondary"
                  size="sm"
                  onPress={() =>
                    router.push(
                      `/${lang === "en" ? "am" : "en"}/${pathname
                        ?.split("/")
                        .slice(2)
                        .join("/")}`
                    )
                  }
                  className="transition-all duration-200 hover:scale-105 active:scale-95 font-semibold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <span className="text-xs font-bold">
                    {lang === "en" ? "አማ" : "EN"}
                  </span>
                  {!isCollapsed && (
                    <span className="text-xs opacity-70 ml-1">
                      {lang === "en" ? "አማርኛ" : "English"}
                    </span>
                  )}
                </Button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
