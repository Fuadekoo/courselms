"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useParams, useRouter } from "next/navigation";
import {
  AlignLeft,
  ChevronRight,
  Menu,
  X,
  Bell,
  ShoppingCart,
  Search,
  UserRound,
} from "lucide-react";
import User from "./user";
import { Button, Input } from "@heroui/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { getUserName } from "@/actions/user/header";
import Logo from "./Logo";

export default function Header({
  setIsSide,
  isCollapsed = false,
  setIsCollapsed,
}: {
  setIsSide: React.Dispatch<React.SetStateAction<boolean>>;
  isCollapsed?: boolean;
  setIsCollapsed?: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const pathname = usePathname();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    getUserName().then(setUserName);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(
        `/${lang}/course?search=${encodeURIComponent(searchQuery.trim())}`
      );
    }
  };

  const pathSegments = pathname?.split("/").filter(Boolean) || [];

  // Generate breadcrumb items from path
  const breadcrumbItems = [
    // { label: "Home", href: "/", icon: <House className="size-4" /> },
    ...pathSegments
      .slice(1)
      .map((segment, index) => {
        // Skip course IDs (UUIDs or numeric segments) in breadcrumbs
        if (
          /^\d+$/.test(segment) ||
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            segment
          )
        ) {
          return null;
        }

        // Handle special cases for better labels
        let label =
          segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");

        // Custom labels for specific segments
        if (segment === "mycourse") {
          label = "My Course";
        } else if (segment === "course") {
          label = "Course";
        } else if (segment === "finalexam") {
          label = "Final Exam";
        } else if (segment === "certificate") {
          label = "Certificate";
        }

        return {
          label,
          href: `/${pathSegments.slice(0, index + 2).join("/")}`,
          icon: undefined,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null), // Remove null entries with proper typing
  ];

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-300",
        isCollapsed
          ? "md:left-16 md:w-[calc(100%-4rem)]"
          : "md:left-64 md:w-[calc(100%-16rem)]"
      )}
    >
      <div className="relative flex h-16 items-center justify-between px-4 md:px-6 gap-4">
        {/* Left Side: Logo + Sidebar Toggle */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <Button
            isIconOnly
            variant="light"
            size="sm"
            onPress={() => setIsSide((prev) => !prev)}
            className="md:hidden text-gray-600 dark:text-gray-400"
          >
            <AlignLeft className="size-5" />
          </Button>

          {/* Desktop Sidebar Toggle Button */}
          {setIsCollapsed && (
            <Button
              isIconOnly
              variant="light"
              size="sm"
              onPress={() => setIsCollapsed((prev) => !prev)}
              className="hidden md:flex text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label={isCollapsed ? "Open sidebar" : "Close sidebar"}
            >
              {isCollapsed ? (
                <Menu className="size-5" />
              ) : (
                <X className="size-5" />
              )}
            </Button>
          )}

          {/* Logo */}
          <Link href={`/${lang}/`} className="flex items-center gap-2">
            <div className="bg-blue-600 rounded-lg p-1.5">
              <Image
                src="/darulkubra.svg"
                alt="Darulkubra Logo"
                width={20}
                height={20}
                className="size-5 filter brightness-0 invert"
              />
            </div>
            <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {lang === "en" ? "Darulkubra" : "ዳሩልኩብራ"}
            </span>
          </Link>
        </div>

        {/* Center: Search Bar */}
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
            startContent={<Search className="size-4 text-gray-400" />}
            classNames={{
              base: "w-full",
              input: "text-sm",
              inputWrapper:
                "border-gray-300 dark:border-gray-700 hover:border-blue-500 focus-within:!border-blue-500 bg-gray-50 dark:bg-gray-800",
            }}
          />
        </form>

        {/* Right Side: Notifications, Cart, User */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <Button
            isIconOnly
            variant="light"
            size="sm"
            className="relative text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Notifications"
          >
            <Bell className="size-5" />
            <span className="absolute top-1 right-1 size-2 bg-red-500 rounded-full"></span>
          </Button>

          {/* Shopping Cart */}
          <Button
            isIconOnly
            variant="light"
            size="sm"
            className="relative text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Shopping Cart"
          >
            <ShoppingCart className="size-5" />
            <span className="absolute top-1 right-1 size-2 bg-red-500 rounded-full"></span>
          </Button>

          {/* User Profile */}
          <div className="flex items-center gap-2">
            <User />
            {userName && (
              <span className="hidden lg:block text-sm font-medium text-gray-700 dark:text-gray-300">
                {userName}
              </span>
            )}
          </div>

          {/* Language Selector */}
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
            className="text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {lang === "en" ? "አማ" : "EN"}
          </Button>
        </div>
      </div>
    </header>
  );
}
