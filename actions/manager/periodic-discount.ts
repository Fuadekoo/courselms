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
    // Use PeriodicDiscount (uppercase) model which supports multiple courses
    const discounts = await (prisma as any).PeriodicDiscount.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { data: discounts, error: null };
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
    const discount = await (prisma as any).PeriodicDiscount.findUnique({
      where: { id },
    });

    if (!discount) {
      return { data: null, error: "Discount not found" };
    }

    return { data: discount, error: null };
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
    // Validate required fields
    if (!data.title || data.value === undefined) {
      return {
        data: null,
        error: "Title and value are required fields",
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

    if (endDate && endDate <= startDate) {
      return {
        data: null,
        error: "End date must be after start date",
      };
    }

    // Validate daysOfWeek for weekly frequency
    if (data.frequency === "WEEKLY" && !data.daysOfWeek) {
      return {
        data: null,
        error: "Days of week are required for weekly frequency",
      };
    }

    const discount = await (prisma as any).PeriodicDiscount.create({
      data: {
        title: data.title,
        description: data.description || null,
        type: "PERCENT",
        value: data.value,
        startDate: startDate,
        endDate: endDate || null,
        frequency: data.frequency,
        daysOfWeek: data.daysOfWeek || null,
        isActive: data.isActive,
      },
    });

    revalidatePath("/periodic-discounts");
    return { data: discount, error: null };
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
    const existingDiscount = await (prisma as any).PeriodicDiscount.findUnique({
      where: { id },
    });

    if (!existingDiscount) {
      return {
        data: null,
        error: "Discount not found",
      };
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
      : new Date(existingDiscount.startDate);

    const endDate =
      data.endDate !== undefined
        ? data.endDate
          ? new Date(data.endDate)
          : null
        : existingDiscount.endDate
        ? new Date(existingDiscount.endDate)
        : null;

    if (endDate && endDate <= startDate) {
      return {
        data: null,
        error: "End date must be after start date",
      };
    }

    const updatedDiscount = await (prisma as any).PeriodicDiscount.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.type && { type: "PERCENT" }),
        ...(data.value !== undefined && { value: data.value }),
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate !== undefined && {
          endDate: data.endDate ? new Date(data.endDate) : null,
        }),
        ...(data.frequency && { frequency: data.frequency }),
        ...(data.daysOfWeek !== undefined && { daysOfWeek: data.daysOfWeek }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    revalidatePath("/periodic-discounts");
    return { data: updatedDiscount, error: null };
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
    const existingDiscount = await (prisma as any).PeriodicDiscount.findUnique({
      where: { id },
    });

    if (!existingDiscount) {
      return {
        success: false,
        error: "Discount not found",
      };
    }

    await (prisma as any).PeriodicDiscount.delete({
      where: { id },
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
    const existingDiscount = await (prisma as any).PeriodicDiscount.findUnique({
      where: { id },
    });

    if (!existingDiscount) {
      return {
        data: null,
        error: "Discount not found",
      };
    }

    const updatedDiscount = await (prisma as any).PeriodicDiscount.update({
      where: { id },
      data: { isActive: !existingDiscount.isActive },
    });

    revalidatePath("/periodic-discounts");
    return { data: updatedDiscount, error: null };
  } catch (error) {
    console.error(`Error toggling status for discount ${id}:`, error);
    return {
      data: null,
      error: "Failed to update discount status. Please try again.",
    };
  }
}

// Get active discount for a specific course
export async function getActiveDiscountForCourse(courseId: string) {
  try {
    const now = new Date();
    const discounts = await (prisma as any).PeriodicDiscount.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      orderBy: { createdAt: "desc" },
    });

    // Find discount that includes this course
    for (const discount of discounts) {
      try {
        if (discount.description) {
          const parsed = JSON.parse(discount.description);
          if (parsed.courseIds && Array.isArray(parsed.courseIds)) {
            if (parsed.courseIds.includes(courseId)) {
              return { data: discount, error: null };
            }
          }
        }
      } catch {
        // Skip if parsing fails
        continue;
      }
    }

    return { data: null, error: null };
  } catch (error) {
    console.error(`Error fetching discount for course ${courseId}:`, error);
    return {
      data: null,
      error: "Failed to fetch discount. Please try again.",
    };
  }
}
