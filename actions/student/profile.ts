"use server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { StateType } from "@/lib/definations";

export async function getProfile() {
  const session = await auth();
  if (!session?.user?.id) {
    // Return null instead of throwing - let the calling code handle unauthorized users
    return null;
  }
  const userId = session.user.id;
  
  // Get user profile
  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      firstName: true,
      fatherName: true,
      lastName: true,
      gender: true,
      phoneNumber: true,
      country: true,
      region: true,
      city: true,
      age: true,
      role: true,
    },
  });

  if (!profile) {
    // Return null if profile not found instead of throwing
    return null;
  }

  // Get enrolled courses count
  const paidOrdersForCount = await prisma.order.findMany({
    where: {
      userId: userId,
      status: "paid",
    },
    select: { courseId: true },
    distinct: ["courseId"],
  });
  const enrolledCoursesCount = paidOrdersForCount.length;

  // Get completed courses (courses where all activities are done)
  const paidOrders = await prisma.order.findMany({
    where: { userId: userId, status: "paid" },
    select: { courseId: true },
    distinct: ["courseId"],
  });

  const courseIds = paidOrders.map((order) => order.courseId);
  
  let completedCoursesCount = 0;
  if (courseIds.length > 0) {
    // For each course, check if all activities are completed
    for (const courseId of courseIds) {
      const activities = await prisma.activity.findMany({
        where: { courseId },
        select: {
          id: true,
          subActivity: { select: { id: true } },
        },
      });

      const totalSubActivities = activities.reduce(
        (sum, activity) => sum + activity.subActivity.length,
        0
      );

      if (totalSubActivities > 0) {
        const completedSubActivities = await prisma.studentProgress.count({
          where: {
            userId,
            isCompleted: true,
            subActivityId: {
              in: activities.flatMap((a) => a.subActivity.map((s) => s.id)),
            },
          },
        });

        if (completedSubActivities >= totalSubActivities) {
          completedCoursesCount++;
        }
      }
    }
  }

  // Get total questions answered
  const questionsAnswered = await prisma.studentQuiz.count({
    where: { userId },
  });

  return {
    ...profile,
    enrolledCoursesCount,
    completedCoursesCount,
    questionsAnswered,
  };
}

export async function updateProfile(
  prevState: StateType,
  data:
    | {
        firstName: string;
        fatherName: string;
        lastName: string;
        country: string;
        region: string;
        city: string;
      }
    | undefined
): Promise<StateType> {
  const session = await auth();
  if (!session?.user?.id) {
    return { status: false, cause: "Unauthorized", message: "You must be logged in" };
  }

  if (!data) {
    return { status: false, cause: "no_data", message: "No data provided" };
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName: data.firstName || "",
        fatherName: data.fatherName || "",
        lastName: data.lastName || "",
        country: data.country || "",
        region: data.region || "",
        city: data.city || "",
      },
    });

    return { status: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    return { status: false, cause: "update_error", message: "Failed to update profile" };
  }
}
