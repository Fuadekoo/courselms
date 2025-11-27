"use client";

import React from "react";

import UserLayout from "@/components/userLayout";
import {
  BadgeDollarSign,
  Book,
  BookOpen,
  Gauge,
  Megaphone,
  MessageCircle,
  MessageSquare,
  ShieldEllipsis,
  User,
  UserPen,
  Bell,
  Percent,
} from "lucide-react";
import { useParams, usePathname, useRouter } from "next/navigation";
import useData from "@/hooks/useData";
import { getPermission } from "@/actions/manager/manager";

export default function Layout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en",
    pathname = usePathname(),
    router = useRouter(),
    { data: permission } = useData({
      func: getPermission,
      args: [],
      onSuccess(data) {
        const p = data.map((v) => v.permission);
        if (!p.includes(pathname?.split("/")[2] ?? "")) {
          router.replace(`/${lang}/${p[0] ?? ""}`);
        }
      },
    });

  return (
    <UserLayout
      list={[
        {
          label: "Dashboard",
          url: "dashboard",
          icon: <Gauge className="size-5" />,
        },
        {
          label: "Manager",
          url: "manager",
          icon: <ShieldEllipsis className="size-5" />,
        },
        {
          label: "Instructor",
          url: "instructor",
          icon: <UserPen className="size-5" />,
        },
        { label: "Course", url: "course", icon: <Book className="size-5" /> },
        {
          label: "Affiliate",
          url: "affiliate",
          icon: <Megaphone className="size-5" />,
        },
        {
          label: "Seller",
          url: "seller",
          icon: <BadgeDollarSign className="size-5" />,
        },
        { label: "Student", url: "student", icon: <User className="size-5" /> },
        {
          label: "Message",
          url: "message",
          icon: <MessageCircle className="size-5" />,
        },
        {
          label: "Feedback",
          url: "feedback",
          icon: <MessageSquare className="size-5" />,
        },
        {
          label: "Course Materials",
          url: "courseMaterials",
          icon: <BookOpen className="size-5" />,
        },
        {
          label: "Public Announcements",
          url: "publicAnnouncment",
          icon: <Bell className="size-5" />,
        },
        {
          label: "Periodic Discounts",
          url: "periodicDiscount",
          icon: <Percent className="size-5" />,
        },
        // { label: "Student", url: "student" },
        // { label: "Ustaz", url: "ustaz" },
        // { label: "Test", url: "test" },
        // { label: "Employee", url: "employee" },
      ].filter((value) =>
        permission?.map((v) => v.permission).includes(value.url)
      )}
    >
      {children}
    </UserLayout>
  );
}
