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
  Video,
  Tags,
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
          label: lang === "en" ? "Dashboard" : "ዳሽቦርድ",
          url: "dashboard",
          icon: <Gauge className="size-5" />,
        },
        {
          label: lang === "en" ? "Manager" : "አስተዳዳሪ",
          url: "manager",
          icon: <ShieldEllipsis className="size-5" />,
        },
        {
          label: lang === "en" ? "Instructor" : "አስተማሪ",
          url: "instructor",
          icon: <UserPen className="size-5" />,
        },
        {
          label: lang === "en" ? "Course" : "ኮርስ",
          url: "course",
          icon: <Book className="size-5" />,
        },
        {
          label: lang === "en" ? "Affiliate" : "ተባባሪ",
          url: "affiliate",
          icon: <Megaphone className="size-5" />,
        },
        {
          label: lang === "en" ? "Seller" : "ሻጭ",
          url: "seller",
          icon: <BadgeDollarSign className="size-5" />,
        },
        {
          label: lang === "en" ? "Student" : "ተማሪ",
          url: "student",
          icon: <User className="size-5" />,
        },
        {
          label: lang === "en" ? "Message" : "መልዕክት",
          url: "message",
          icon: <MessageCircle className="size-5" />,
        },
        {
          label: lang === "en" ? "Feedback" : "ግብረመልስ",
          url: "feedback",
          icon: <MessageSquare className="size-5" />,
        },
        {
          label: lang === "en" ? "Course Materials" : "የኮርስ ቁሳቁሶች",
          url: "courseMaterials",
          icon: <BookOpen className="size-5" />,
        },
        {
          label: lang === "en" ? "Public Announcements" : "የህዝብ ማስታወቂያዎች",
          url: "publicAnnouncment",
          icon: <Bell className="size-5" />,
        },
        {
          label: lang === "en" ? "Periodic Discounts" : "ወቅታዊ ቅናሾች",
          url: "periodicDiscount",
          icon: <Percent className="size-5" />,
        },
        {
          label: lang === "en" ? "Video Conversion" : "የቪዲዮ መለወጥ",
          url: "videoConversion",
          icon: <Video className="size-5" />,
        },
        {
          label: lang === "en" ? "Assign Course to Tags" : "ኮርስ ወደ መለያዎች መመደብ",
          url: "assigningCourseToTags",
          icon: <Tags className="size-5" />,
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
