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
  params,
}: Readonly<{
  pending: React.ReactNode;
  inactive: React.ReactNode;
  manager: React.ReactNode;
  seller: React.ReactNode;
  affiliate: React.ReactNode;
  instructor: React.ReactNode;
  student: React.ReactNode;
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  await params; // Await params to satisfy Next.js requirements
  const session = await auth();
  if (!session) return children;

  const user = await prisma.user.findFirst({
    where: { id: session.user?.id || "unknown" },
    select: { status: true, role: true },
  });

  if (!user) return children;

  return user.status == "pending"
    ? pending ?? children
    : user.status == "inactive"
    ? inactive ?? children
    : session.user?.role === "manager"
    ? manager ?? children
    : session.user?.role === "seller"
    ? seller ?? children
    : session.user?.role === "affiliate"
    ? affiliate ?? children
    : session.user?.role === "instructor"
    ? instructor ?? children
    : session.user?.role === "student"
    ? student ?? children
    : children;
}
