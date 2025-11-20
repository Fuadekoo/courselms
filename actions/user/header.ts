"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function getUserName() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        firstName: true,
        fatherName: true,
        lastName: true,
      },
    });

    if (!user) {
      return null;
    }

    return `${user.firstName} ${user.fatherName} ${user.lastName}`.trim();
  } catch (error) {
    return null;
  }
}

