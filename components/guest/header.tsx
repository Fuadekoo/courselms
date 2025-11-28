"use client";

import { useState } from "react";
import {
  Button,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
} from "@heroui/react";
import Link from "next/link";
import { useParams } from "next/navigation";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const params = useParams();
  const lang = (params?.lang as string) || "en";

  const menuItems = [
    { label: lang === "en" ? "Courses" : "ኮርሶች", href: "#courses" },
    { label: lang === "en" ? "Features" : "ባህሪያት", href: "#features" },
    { label: lang === "en" ? "Testimonials" : "መመስከሪያዎች", href: "#testimonials" },
    { label: lang === "en" ? "Pricing" : "ዋጋ", href: "#pricing" },
  ];

  return (
    <Navbar
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
      maxWidth="xl"
      className="border-b border-divider bg-background/80 backdrop-blur-md"
      isBordered
    >
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? (lang === "en" ? "Close menu" : "ሜኑን ዝጋ") : (lang === "en" ? "Open menu" : "ሜኑን ክፈት")}
          className="md:hidden"
        />
        <NavbarBrand>
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary">Darulkubra</span>
          </Link>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden md:flex gap-8" justify="center">
        {menuItems.map((item) => (
          <NavbarItem key={item.href}>
            <Link
              href={item.href}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              {item.label}
            </Link>
          </NavbarItem>
        ))}
      </NavbarContent>

      <NavbarContent justify="end" className="hidden md:flex">
        <NavbarItem>
          <Button variant="light" color="primary">
            {lang === "en" ? "Login" : "ግባ"}
          </Button>
        </NavbarItem>
        <NavbarItem>
          <Button color="primary">{lang === "en" ? "Sign Up" : "ተመዝግብ"}</Button>
        </NavbarItem>
      </NavbarContent>

      <NavbarMenu>
        {menuItems.map((item, index) => (
          <NavbarMenuItem key={`${item.href}-${index}`}>
            <Link
              className="w-full text-lg"
              href={item.href}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.label}
            </Link>
          </NavbarMenuItem>
        ))}
        <NavbarMenuItem>
          <div className="flex flex-col gap-2 pt-4 border-t w-full">
            <Button variant="light" color="primary" fullWidth>
              {lang === "en" ? "Login" : "ግባ"}
            </Button>
            <Button color="primary" fullWidth>
              {lang === "en" ? "Sign Up" : "ተመዝግብ"}
            </Button>
          </div>
        </NavbarMenuItem>
      </NavbarMenu>
    </Navbar>
  );
}
