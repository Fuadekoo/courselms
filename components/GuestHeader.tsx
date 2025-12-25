"use client";

import { Moon, Sun, Menu, X, Home, Users, Search } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  useParams,
  usePathname,
  useSelectedLayoutSegment,
  useRouter,
} from "next/navigation";
import { useTheme } from "next-themes";
import { Button, Input } from "@heroui/react";
import Logo from "./Logo";

export default function GuestHeader() {
  const { lang = "en" } = useParams<{ lang: string }>() ?? {};
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const selectedSegment = useSelectedLayoutSegment();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(
        `/${lang}/course?search=${encodeURIComponent(searchQuery.trim())}`
      );
    }
  };

  const links = useMemo(
    () => [
      {
        label: lang == "en" ? "Affiliate Registration" : "ተባባሪ",
        url: "affiliate",
        icon: Users,
      },
    ],
    [lang]
  );

  // Build target href exactly like your UI snippet
  const targetHref = `/${lang == "en" ? "am" : "en"}/${(pathname ?? "")
    .split("/")
    .slice(2)
    .join("/")}`;

  // Persist cookie + sync html lang, then navigate to targetHref
  const onLangClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const nextLang: "en" | "am" = lang === "en" ? "am" : "en";
    const expires = new Date(Date.now() + 365 * 864e5).toUTCString();
    document.cookie = `local_lang=${encodeURIComponent(
      nextLang
    )}; expires=${expires}; path=/; SameSite=Lax`;
    if (document.documentElement.lang !== nextLang) {
      document.documentElement.lang = nextLang;
    }
    window.location.href = `/${nextLang}/${(pathname ?? "")
      .split("/")
      .slice(2)
      .join("/")}`;
  };

  return (
    <>
      {/* Header/Navbar */}
      <header
        className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all duration-300"
        data-lang={lang}
      >
        <div className="container flex h-16 items-center gap-4 px-4 mx-auto max-w-7xl">
          {/* Left: Menu Toggle (Mobile) + Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 hover:bg-default-100 rounded-lg transition-colors"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
            <Logo />
          </div>

          {/* Center: Search Bar - Takes available space */}
          <form
            onSubmit={handleSearch}
            className="flex-1 max-w-lg hidden md:block"
          >
            <Input
              type="text"
              placeholder={
                lang === "en" ? "Search courses..." : "ኮርሶችን ፈልግ..."
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

          {/* Right: Navigation + Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-4 mr-2">
              {links.map((item) => {
                const isActive = (selectedSegment || "") === item.url;
                return (
                  <Link
                    key={item.url}
                    href={`/${lang}/${item.url}`}
                    aria-label={item.label}
                    className={`relative text-sm font-medium transition-colors group ${
                      isActive
                        ? "text-primary"
                        : "text-foreground/60 hover:text-primary"
                    }`}
                  >
                    <span className="relative z-10">{item.label}</span>
                    <span
                      className={`absolute left-0 -bottom-1 h-[2px] rounded-full bg-primary transition-all duration-300 ${
                        isActive
                          ? "w-full"
                          : "w-0 group-hover:w-full"
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>

            {/* Theme Toggle */}
            <Button
              isIconOnly
              variant="light"
              size="sm"
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="hover:bg-default-100"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* Language Switcher */}
            <Link
              href={targetHref}
              onClick={onLangClick}
              aria-label="Switch language"
              className="max-[425px]:hidden"
            >
              <Button
                isIconOnly
                color="primary"
                variant="flat"
                size="sm"
                className="font-semibold"
              >
                {lang == "en" ? "አማ" : "En"}
              </Button>
            </Link>

            {/* Login/Signup - Desktop */}
            <div className="hidden md:flex items-center gap-1">
              <Link href={`/${lang}/login`}>
                <Button variant="light" color="primary" size="sm">
                  {lang == "en" ? "Login" : "መግቢያ"}
                </Button>
              </Link>
              <Link href={`/${lang}/signup`}>
                <Button color="primary" size="sm">
                  {lang == "en" ? "Sign Up" : "መዝግብ"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-background border-r shadow-xl transform transition-transform duration-300 ease-in-out md:hidden ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <Logo />
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-2 hover:bg-default-100 rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile Search Bar */}
          <div className="p-4 border-b">
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
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {links.map((item) => {
                const isActive = (selectedSegment || "") === item.url;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.url}
                    href={`/${lang}/${item.url}`}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-foreground/60 hover:bg-default-100 hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Sidebar Footer - Auth Buttons */}
          <div className="p-4 border-t space-y-2">
            <Link href={`/${lang}/login`} className="block">
              <Button
                variant="light"
                color="primary"
                fullWidth
                size="lg"
                onClick={() => setIsMenuOpen(false)}
              >
                {lang == "en" ? "Login" : "መግቢያ"}
              </Button>
            </Link>
            <Link href={`/${lang}/signup`} className="block">
              <Button
                color="primary"
                fullWidth
                size="lg"
                onClick={() => setIsMenuOpen(false)}
              >
                {lang == "en" ? "Sign Up" : "መዝግብ"}
              </Button>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
