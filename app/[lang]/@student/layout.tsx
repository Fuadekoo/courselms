import UserLayout from "@/components/userLayout";
import { LayoutDashboard, Library, GraduationCap, User } from "lucide-react";
import React from "react";

const studentNav = [
  {
    label: "dashboard",
    url: "dashboard",
    icon: <LayoutDashboard className="size-5" />,
  },
  { label: "Course", url: "course", icon: <Library className="size-5" /> },
  {
    label: "mycourse",
    url: "mycourse",
    icon: <GraduationCap className="size-5" />,
  },
  {
    label: "profile",
    url: "profile",
    icon: <User className="size-5" />,
  },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <UserLayout list={studentNav}>{children}</UserLayout>
  );
}
