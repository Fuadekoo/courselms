"use server";

import { auth } from "../auth";
import prisma from "../db";
import { StateType } from "../definations";

export async function enrollInFreeCourse(
  prevState: StateType,
  data: { courseId: string; affiliateCode?: string } | undefined | null
): Promise<StateType> {
  try {
    if (!data || !data.courseId) {
      return {
        status: false,
        cause: "No data provided",
        message: "Course ID is required",
      };
    }

    // Check if user is authenticated
    const session = await auth();
    if (!session?.user?.id) {
      return {
        status: false,
        cause: "unauthorized",
        message: "Please login to enroll in courses",
      };
    }

    // Get course details
    const course = await prisma.course.findFirst({
      where: { id: data.courseId },
      select: {
        id: true,
        birrPrice: true,
        dolarPrice: true,
        instructorRate: true,
        affiliateRate: true,
      },
    });

    if (!course) {
      return {
        status: false,
        cause: "course_not_found",
        message: "Course not found",
      };
    }

    // Verify course is free
    const birrPrice = course.birrPrice ? Number(course.birrPrice) : 0;
    const dolarPrice = course.dolarPrice ? Number(course.dolarPrice) : 0;

    if (birrPrice > 0 || dolarPrice > 0) {
      return {
        status: false,
        cause: "not_free",
        message: "This course is not free",
      };
    }

    // Get user
    const user = await prisma.user.findFirst({
      where: { id: session.user.id, role: "student" },
    });

    if (!user) {
      return {
        status: false,
        cause: "user_not_found",
        message: "User not found",
      };
    }

    // Check if already enrolled
    const existingOrder = await prisma.order.findFirst({
      where: {
        userId: user.id,
        courseId: course.id,
        status: "paid",
      },
    });

    if (existingOrder) {
      return {
        status: true,
        message: "Already enrolled in this course",
      };
    }

    // Get affiliate if code provided
    let affiliate = null;
    if (data.affiliateCode) {
      affiliate = await prisma.user.findFirst({
        where: { code: data.affiliateCode },
        select: {
          code: true,
          IncomeRate: { where: { courseId: course.id } },
        },
      });
    }

    // Create order with status "paid" for free course
    await prisma.order.create({
      data: {
        userId: user.id,
        courseId: course.id,
        status: "paid",
        totalPrice: 0,
        price: 0,
        date: new Date(),
        instructorIncome: 0,
        paymentType: "free",
        currency: "FREE",
        birrPrice: 0,
        dolarPrice: 0,
        ...(affiliate
          ? {
              code: affiliate.code,
              income: affiliate.IncomeRate[0]?.rate || course.affiliateRate,
            }
          : {}),
      },
    });

    return {
      status: true,
      message: "Successfully enrolled in free course",
    };
  } catch (error) {
    console.error("Free course enrollment error:", error);
    return {
      status: false,
      cause: "Unknown Error",
      message: "An unexpected error occurred while enrolling in the course",
    };
  }
}

