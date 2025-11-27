"use server";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface PublicAnnouncementInput {
  id?: string;
  message: string;
  photo?: string | null;
  startDate?: Date | string;
  endDate?: Date | string | null;
  isActive?: boolean;
}

export async function getPublicAnnouncements(
  options: {
    activeOnly?: boolean;
    limit?: number;
  } = {}
) {
  try {
    const { activeOnly = false, limit } = options;

    const now = new Date();

    const announcements = await prisma.publicAnnouncement.findMany({
      where: activeOnly
        ? {
            OR: [
              {
                createdAt: { lte: now },
              },
            ],
          }
        : {},
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return { data: announcements, error: null };
  } catch (error) {
    console.error("Error fetching public announcements:", error);
    return {
      data: [],
      error: "Failed to fetch announcements. Please try again.",
    };
  }
}

export async function getPublicAnnouncementById(id: string) {
  try {
    const announcement = await prisma.publicAnnouncement.findUnique({
      where: { id },
    });

    if (!announcement) {
      return { data: null, error: "Announcement not found" };
    }

    return { data: announcement, error: null };
  } catch (error) {
    console.error(`Error fetching announcement with ID ${id}:`, error);
    return {
      data: null,
      error: "Failed to fetch announcement. Please try again.",
    };
  }
}

export async function createPublicAnnouncement(
  data: Omit<PublicAnnouncementInput, "id">
) {
  try {
    // Validate required fields
    if (!data.message) {
      return {
        data: null,
        error: "Message is required",
      };
    }

    // Validate date range if both dates are provided
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);

      if (end <= start) {
        return {
          data: null,
          error: "End date must be after start date",
        };
      }
    }

    const announcement = await prisma.publicAnnouncement.create({
      data: {
        message: data.message,
        photo: data.photo || null,
      },
    });

    revalidatePath("/admin/announcements");
    return { data: announcement, error: null };
  } catch (error) {
    console.error("Error creating public announcement:", error);
    return {
      data: null,
      error: "Failed to create announcement. Please try again.",
    };
  }
}

export async function updatePublicAnnouncement(
  id: string,
  data: Partial<PublicAnnouncementInput>
) {
  try {
    // Check if announcement exists
    const existingAnnouncement = await prisma.publicAnnouncement.findUnique({
      where: { id },
    });

    if (!existingAnnouncement) {
      return {
        data: null,
        error: "Announcement not found",
      };
    }

    // Skip date validation as fields don't exist in schema

    const updatedAnnouncement = await prisma.publicAnnouncement.update({
      where: { id },
      data: {
        message: data.message,
        photo: data.photo !== undefined ? data.photo : undefined,
      },
    });

    revalidatePath("/admin/announcements");
    return { data: updatedAnnouncement, error: null };
  } catch (error) {
    console.error(`Error updating announcement with ID ${id}:`, error);
    return {
      data: null,
      error: "Failed to update announcement. Please try again.",
    };
  }
}

export async function deletePublicAnnouncement(id: string) {
  try {
    // Check if announcement exists
    const existingAnnouncement = await prisma.publicAnnouncement.findUnique({
      where: { id },
    });

    if (!existingAnnouncement) {
      return {
        success: false,
        error: "Announcement not found",
      };
    }

    await prisma.publicAnnouncement.delete({
      where: { id },
    });

    revalidatePath("/admin/announcements");
    return { success: true, error: null };
  } catch (error) {
    console.error(`Error deleting announcement with ID ${id}:`, error);
    return {
      success: false,
      error: "Failed to delete announcement. Please try again.",
    };
  }
}

export async function toggleAnnouncementStatus(id: string) {
  try {
    const updatedAnnouncement = await prisma.publicAnnouncement.update({
      where: { id },
      data: { message: "Updated" },
    });

    revalidatePath("/admin/announcements");
    return { data: updatedAnnouncement, error: null };
  } catch (error) {
    console.error(`Error toggling status for announcement ${id}:`, error);
    return {
      data: null,
      error: "Failed to update announcement status. Please try again.",
    };
  }
}
