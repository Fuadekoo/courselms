"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

type DiscountType = "PERCENT";
type Frequency = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";

export interface PeriodicDiscountInput {
  id?: string;
  title: string;
  description?: string;
  type: DiscountType;
  value: number;
  startDate: Date | string;
  endDate?: Date | string | null;
  frequency: Frequency;
  daysOfWeek?: string | null;
  isActive: boolean;
}

export async function getPeriodicDiscounts() {
  try {
    // Use the lowercase periodicDiscount model which is course-specific
    const discounts = await prisma.periodicDiscount.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        course: {
          select: {
            id: true,
            titleEn: true,
            titleAm: true,
          },
        },
      },
    });

    // Group discounts by dates + rate + createdAt (within 2 seconds) to group related discounts
    // This groups discounts created together (for multi-course discounts)
    const groupedDiscounts = new Map<string, typeof discounts>();
    
    discounts.forEach((discount) => {
      // Round createdAt to nearest 2 seconds to group discounts created together
      const createdAtRounded = Math.floor(
        discount.createdAt.getTime() / 2000
      ) * 2000;
      
      // Create a unique key based on dates, rate, and creation time
      const groupKey = `${discount.startDate.toISOString()}_${discount.endDate.toISOString()}_${discount.discountRate}_${createdAtRounded}`;
      
      if (!groupedDiscounts.has(groupKey)) {
        groupedDiscounts.set(groupKey, []);
      }
      groupedDiscounts.get(groupKey)!.push(discount);
    });

    // Convert grouped discounts to expected format
    const formattedDiscounts: any[] = [];
    
    groupedDiscounts.forEach((group) => {
      // Use the most recent discount as the base
      const baseDiscount = group[0];
      const courseIds = group.map((d) => d.courseId);
      
      // Construct a default title from courses
      const courseNames = group
        .map((d) => d.course.titleEn)
        .slice(0, 3)
        .join(", ");
      const defaultTitle = group.length > 3 
        ? `${courseNames} and ${group.length - 3} more`
        : courseNames;

      // Use default title (actual title will be stored in description when creating/updating)
      formattedDiscounts.push({
        id: baseDiscount.id, // Use first discount ID as the main ID
        title: defaultTitle,
        description: JSON.stringify({ courseIds, title: defaultTitle }), // Store all course IDs and title
        type: "PERCENT" as const,
        value: baseDiscount.discountRate,
        startDate: baseDiscount.startDate.toISOString(),
        endDate: baseDiscount.endDate.toISOString(),
        frequency: "NONE" as const,
        daysOfWeek: null,
        isActive: true,
        createdAt: baseDiscount.createdAt.toISOString(),
        updatedAt: baseDiscount.createdAt.toISOString(),
        courseId: baseDiscount.courseId,
        course: baseDiscount.course,
        allDiscountIds: group.map((d) => d.id), // Store all related discount IDs
        allCourses: group.map((d) => d.course), // Store all courses
      });
    });

    return { data: formattedDiscounts, error: null };
  } catch (error) {
    console.error("Error fetching periodic discounts:", error);
    return {
      data: [],
      error: "Failed to fetch periodic discounts. Please try again.",
    };
  }
}

export async function getPeriodicDiscountById(id: string) {
  try {
    const discount = await prisma.periodicDiscount.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            titleEn: true,
            titleAm: true,
          },
        },
      },
    });

    if (!discount) {
      return { data: null, error: "Discount not found" };
    }

    // Convert to expected format
    const formattedDiscount = {
      id: discount.id,
      title: `Discount for ${discount.course.titleEn}`,
      description: null,
      type: "PERCENT" as const,
      value: discount.discountRate,
      startDate: discount.startDate.toISOString(),
      endDate: discount.endDate.toISOString(),
      frequency: "NONE" as const,
      daysOfWeek: null,
      isActive: true,
      createdAt: discount.createdAt.toISOString(),
      updatedAt: discount.createdAt.toISOString(),
      courseId: discount.courseId,
      course: discount.course,
    };

    return { data: formattedDiscount, error: null };
  } catch (error) {
    console.error(`Error fetching discount with ID ${id}:`, error);
    return {
      data: null,
      error: "Failed to fetch discount. Please try again.",
    };
  }
}

export async function createPeriodicDiscount(
  data: Omit<PeriodicDiscountInput, "id">
) {
  try {
    // Extract courseIds from description
    let courseIds: string[] = [];

    if (data.description) {
      try {
        const parsed = JSON.parse(data.description);
        if (parsed.courseIds && Array.isArray(parsed.courseIds)) {
          courseIds = parsed.courseIds;
        } else if (parsed.courseId) {
          courseIds = [parsed.courseId];
        }
      } catch {
        // Ignore parsing errors
      }
    }

    if (courseIds.length === 0) {
      return {
        data: null,
        error:
          "At least one course ID is required. Please provide courseIds in description field.",
      };
    }

    // Validate value - must be between 1 and 100 for percentage
    if (data.value <= 0 || data.value > 100) {
      return {
        data: null,
        error: "Percentage must be between 1 and 100",
      };
    }

    // Validate date range
    const startDate = new Date(data.startDate);
    const endDate = data.endDate ? new Date(data.endDate) : null;

    if (!endDate) {
      return {
        data: null,
        error: "End date is required",
      };
    }

    if (endDate <= startDate) {
      return {
        data: null,
        error: "End date must be after start date",
      };
    }

    // Create one discount record for each course
    // Use a small delay to ensure they're created within the same 2-second window for grouping
    const createdDiscounts = await Promise.all(
      courseIds.map((courseId) =>
        prisma.periodicDiscount.create({
          data: {
            courseId: courseId,
            discountRate: Math.round(data.value),
            startDate: startDate,
            endDate: endDate,
          },
          include: {
            course: {
              select: {
                id: true,
                titleEn: true,
                titleAm: true,
              },
            },
          },
        })
      )
    );

    // Format the first discount to match expected interface
    const formattedDiscount = {
      id: createdDiscounts[0].id,
      title: data.title,
      description: JSON.stringify({ courseIds, title: data.title }), // Store title and courseIds
      type: "PERCENT" as const,
      value: createdDiscounts[0].discountRate,
      startDate: createdDiscounts[0].startDate.toISOString(),
      endDate: createdDiscounts[0].endDate.toISOString(),
      frequency: "NONE" as const,
      daysOfWeek: null,
      isActive: true,
      createdAt: createdDiscounts[0].createdAt.toISOString(),
      updatedAt: createdDiscounts[0].createdAt.toISOString(),
      courseId: createdDiscounts[0].courseId,
      course: createdDiscounts[0].course,
      allDiscountIds: createdDiscounts.map((d) => d.id),
      allCourses: createdDiscounts.map((d) => d.course),
    };

    revalidatePath("/periodic-discounts");
    return { data: formattedDiscount, error: null };
  } catch (error) {
    console.error("Error creating periodic discount:", error);
    return {
      data: null,
      error: "Failed to create discount. Please try again.",
    };
  }
}

export async function updatePeriodicDiscount(
  id: string,
  data: Partial<PeriodicDiscountInput>
) {
  try {
    // Check if discount exists
    const existingDiscount = await prisma.periodicDiscount.findUnique({
      where: { id },
    });

    if (!existingDiscount) {
      return {
        data: null,
        error: "Discount not found",
      };
    }

    // Find all related discounts (same dates and rate)
    const relatedDiscounts = await prisma.periodicDiscount.findMany({
      where: {
        startDate: existingDiscount.startDate,
        endDate: existingDiscount.endDate,
        discountRate: existingDiscount.discountRate,
      },
      include: {
        course: {
          select: {
            id: true,
            titleEn: true,
            titleAm: true,
          },
        },
      },
    });

    // Extract courseIds from description if provided
    let courseIds: string[] = [];
    if (data.description) {
      try {
        const parsed = JSON.parse(data.description);
        if (parsed.courseIds && Array.isArray(parsed.courseIds)) {
          courseIds = parsed.courseIds;
        }
      } catch {
        // If parsing fails, use existing courseIds
        courseIds = relatedDiscounts.map((d) => d.courseId);
      }
    } else {
      courseIds = relatedDiscounts.map((d) => d.courseId);
    }

    // Validate value if being updated - must be between 1 and 100
    if (data.value !== undefined) {
      if (data.value <= 0 || data.value > 100) {
        return {
          data: null,
          error: "Percentage must be between 1 and 100",
        };
      }
    }

    // Validate date range if dates are being updated
    const startDate = data.startDate
      ? new Date(data.startDate)
      : existingDiscount.startDate;

    const endDate =
      data.endDate !== undefined
        ? data.endDate
          ? new Date(data.endDate)
          : null
        : existingDiscount.endDate;

    if (endDate && endDate <= startDate) {
      return {
        data: null,
        error: "End date must be after start date",
      };
    }

    // Delete all related discounts first
    await prisma.periodicDiscount.deleteMany({
      where: {
        id: { in: relatedDiscounts.map((d) => d.id) },
      },
    });

    // Create new discounts with updated data
    const updatedDiscounts = await Promise.all(
      courseIds.map((courseId) =>
        prisma.periodicDiscount.create({
          data: {
            courseId: courseId,
            discountRate: data.value !== undefined 
              ? Math.round(data.value) 
              : existingDiscount.discountRate,
            startDate: startDate,
            endDate: endDate!,
          },
          include: {
            course: {
              select: {
                id: true,
                titleEn: true,
                titleAm: true,
              },
            },
          },
        })
      )
    );

    // Format the first discount to match expected interface
    const title = data.title || `Discount ${updatedDiscounts[0].id}`;
    const formattedDiscount = {
      id: updatedDiscounts[0].id,
      title: title,
      description: JSON.stringify({ courseIds, title }), // Store title and courseIds
      type: "PERCENT" as const,
      value: updatedDiscounts[0].discountRate,
      startDate: updatedDiscounts[0].startDate.toISOString(),
      endDate: updatedDiscounts[0].endDate.toISOString(),
      frequency: "NONE" as const,
      daysOfWeek: null,
      isActive: true,
      createdAt: updatedDiscounts[0].createdAt.toISOString(),
      updatedAt: updatedDiscounts[0].createdAt.toISOString(),
      courseId: updatedDiscounts[0].courseId,
      course: updatedDiscounts[0].course,
      allDiscountIds: updatedDiscounts.map((d) => d.id),
      allCourses: updatedDiscounts.map((d) => d.course),
    };

    revalidatePath("/periodic-discounts");
    return { data: formattedDiscount, error: null };
  } catch (error) {
    console.error(`Error updating discount with ID ${id}:`, error);
    return {
      data: null,
      error: "Failed to update discount. Please try again.",
    };
  }
}

export async function deletePeriodicDiscount(id: string) {
  try {
    // Check if discount exists
    const existingDiscount = await prisma.periodicDiscount.findUnique({
      where: { id },
    });

    if (!existingDiscount) {
      return {
        success: false,
        error: "Discount not found",
      };
    }

    // Find all related discounts (same dates and rate) and delete them all
    await prisma.periodicDiscount.deleteMany({
      where: {
        startDate: existingDiscount.startDate,
        endDate: existingDiscount.endDate,
        discountRate: existingDiscount.discountRate,
      },
    });

    revalidatePath("/periodic-discounts");
    return { success: true, error: null };
  } catch (error) {
    console.error(`Error deleting discount with ID ${id}:`, error);
    return {
      success: false,
      error: "Failed to delete discount. Please try again.",
    };
  }
}

export async function toggleDiscountStatus(id: string) {
  try {
    // Note: The current periodicDiscount model doesn't have isActive field
    // Instead, we can delete the discount to "deactivate" it
    // Or we can check if it's within the date range

    const existingDiscount = await prisma.periodicDiscount.findUnique({
      where: { id },
    });

    if (!existingDiscount) {
      return {
        data: null,
        error: "Discount not found",
      };
    }

    // For simplicity, delete the discount to "deactivate" it
    // In a production system, you might want to add an isActive field to the schema
    await prisma.periodicDiscount.delete({
      where: { id },
    });

    revalidatePath("/periodic-discounts");
    return { data: { deleted: true }, error: null };
  } catch (error) {
    console.error(`Error toggling status for discount ${id}:`, error);
    return {
      data: null,
      error: "Failed to update discount status. Please try again.",
    };
  }
}

// Get active discount for a specific course
// Uses the periodicDiscount model (lowercase) which is course-specific
export async function getActiveDiscountForCourse(courseId: string) {
  try {
    const now = new Date();

    // Use the lowercase periodicDiscount model which is course-specific
    const discount = await prisma.periodicDiscount.findFirst({
      where: {
        courseId: courseId,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!discount) {
      return { data: null, error: null };
    }

    // Convert to the expected format for the hook
    // The periodicDiscount model uses discountRate as Int (percentage)
    return {
      data: {
        id: discount.id,
        title: `Course Discount`,
        type: "PERCENT" as const,
        value: discount.discountRate, // discountRate is the percentage (e.g., 15 for 15%)
        currency: null,
        startDate: discount.startDate.toISOString(),
        endDate: discount.endDate.toISOString(),
        frequency: "NONE" as const,
        daysOfWeek: null,
        isActive: true,
        createdAt: discount.createdAt.toISOString(),
      },
      error: null,
    };
  } catch (error) {
    console.error(`Error fetching discount for course ${courseId}:`, error);
    return {
      data: null,
      error: "Failed to fetch discount. Please try again.",
    };
  }
}
