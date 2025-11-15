import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import React from "react";

export default async function Layout({
  pending,
  inactive,
  manager,
  seller,
  affiliate,
  instructor,
  student,
  children,
}: {
  pending: React.ReactNode;
  inactive: React.ReactNode;
  manager: React.ReactNode;
  seller: React.ReactNode;
  affiliate: React.ReactNode;
  instructor: React.ReactNode;
  student: React.ReactNode;
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const session = await auth();
  if (!session) return children;

  const user = await prisma.user.findFirst({
    where: { id: session.user?.id || "unknown" },
    select: { status: true, role: true },
  });

  if (!user) return children;

  return user.status == "pending"
    ? pending
    : user.status == "inactive"
    ? inactive
    : session.user?.role === "manager"
    ? manager
    : session.user?.role === "seller"
    ? seller
    : session.user?.role === "affiliate"
    ? affiliate
    : session.user?.role === "instructor"
    ? instructor
    : session.user?.role === "student"
    ? student
    : children;
}
