"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { StateType } from "@/lib/definations";

// Get all tags with their courses
export async function getTags() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "manager") {
      throw new Error("Unauthorized");
    }

    const tags = await prisma.tags.findMany({
      orderBy: { order: "asc" },
      include: {
        assigningCourseToTags: {
          orderBy: { order: "asc" },
          include: {
            course: {
              select: {
                id: true,
                titleEn: true,
                titleAm: true,
                thumbnail: true,
              },
            },
          },
        },
      },
    });

    return {
      success: true,
      data: tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        order: tag.order,
        courses: tag.assigningCourseToTags.map((assignment) => ({
          id: assignment.id,
          courseId: assignment.courseId,
          course: assignment.course,
          order: assignment.order,
        })),
      })),
    };
  } catch (error) {
    console.error("Error fetching tags:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch tags",
      data: [],
    };
  }
}

// Get all courses (for assignment)
export async function getCoursesForAssignment() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "manager") {
      throw new Error("Unauthorized");
    }

    const courses = await prisma.course.findMany({
      where: { status: true },
      select: {
        id: true,
        titleEn: true,
        titleAm: true,
        thumbnail: true,
      },
    });

    return {
      success: true,
      data: courses,
    };
  } catch (error) {
    console.error("Error fetching courses:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch courses",
      data: [],
    };
  }
}

// Create a new tag
export async function createTag(
  prevState: StateType,
  data: { name: string } | undefined
): Promise<StateType> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "manager") {
      return { status: false, cause: "unauthorized", message: "Unauthorized" };
    }

    if (!data?.name) {
      return { status: false, cause: "name", message: "Tag name is required" };
    }

    // Get the max order value
    const existingTags = await prisma.tags.findMany({
      select: { order: true },
      orderBy: { order: "desc" },
      take: 1,
    });
    const maxOrder = existingTags[0]?.order ?? 0;

    await prisma.tags.create({
      data: {
        name: data.name,
        order: maxOrder + 1,
      },
    });

    return { status: true };
  } catch (error) {
    console.error("Error creating tag:", error);
    return {
      status: false,
      cause: "error",
      message: error instanceof Error ? error.message : "Failed to create tag",
    };
  }
}

// Update tag name
export async function updateTag(
  prevState: StateType,
  data: { id: string; name: string } | undefined
): Promise<StateType> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "manager") {
      return { status: false, cause: "unauthorized", message: "Unauthorized" };
    }

    if (!data?.id || !data?.name) {
      return {
        status: false,
        cause: "data",
        message: "Tag ID and name are required",
      };
    }

    await prisma.tags.update({
      where: { id: data.id },
      data: { name: data.name },
    });

    return { status: true };
  } catch (error) {
    console.error("Error updating tag:", error);
    return {
      status: false,
      cause: "error",
      message: error instanceof Error ? error.message : "Failed to update tag",
    };
  }
}

// Delete a tag
export async function deleteTag(
  prevState: StateType,
  id: string | undefined
): Promise<StateType> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "manager") {
      return { status: false, cause: "unauthorized", message: "Unauthorized" };
    }

    if (!id) {
      return { status: false, cause: "id", message: "Tag ID is required" };
    }

    await prisma.tags.delete({
      where: { id },
    });

    return { status: true };
  } catch (error) {
    console.error("Error deleting tag:", error);
    return {
      status: false,
      cause: "error",
      message: error instanceof Error ? error.message : "Failed to delete tag",
    };
  }
}

// Reorder tags
export async function reorderTags(
  prevState: StateType,
  data: { tagIds: string[] } | undefined
): Promise<StateType> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "manager") {
      return { status: false, cause: "unauthorized", message: "Unauthorized" };
    }

    if (!data?.tagIds || data.tagIds.length === 0) {
      return {
        status: false,
        cause: "data",
        message: "Tag IDs are required",
      };
    }

    // Update order for each tag
    await Promise.all(
      data.tagIds.map((tagId, index) =>
        prisma.tags.update({
          where: { id: tagId },
          data: { order: index + 1 },
        })
      )
    );

    return { status: true };
  } catch (error) {
    console.error("Error reordering tags:", error);
    return {
      status: false,
      cause: "error",
      message: error instanceof Error ? error.message : "Failed to reorder tags",
    };
  }
}

// Assign multiple courses to tag
export async function assignCoursesToTag(
  prevState: StateType,
  data: { tagId: string; courseIds: string[] } | undefined
): Promise<StateType> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "manager") {
      return { status: false, cause: "unauthorized", message: "Unauthorized" };
    }

    if (!data?.tagId || !data?.courseIds || data.courseIds.length === 0) {
      return {
        status: false,
        cause: "data",
        message: "Tag ID and Course IDs are required",
      };
    }

    // Get existing assignments to avoid duplicates
    const existingAssignments = await prisma.assigningCourseToTags.findMany({
      where: {
        tagId: data.tagId,
        courseId: { in: data.courseIds },
      },
      select: { courseId: true },
    });

    const existingCourseIds = existingAssignments.map(a => a.courseId);
    const newCourseIds = data.courseIds.filter(id => !existingCourseIds.includes(id));

    if (newCourseIds.length === 0) {
      return {
        status: false,
        cause: "exists",
        message: "All selected courses are already assigned to this tag",
      };
    }

    // Get the max order value for this tag
    const maxOrderResult = await prisma.assigningCourseToTags.findMany({
      where: { tagId: data.tagId },
      select: { order: true },
      orderBy: { order: "desc" },
      take: 1,
    });
    // Start order from 1 for new assignments
    let currentMaxOrder = Math.max(0, maxOrderResult[0]?.order ?? 0);

    // Create assignments for new courses
    const assignments = newCourseIds.map((courseId, index) => ({
      tagId: data.tagId,
      courseId,
      order: currentMaxOrder + index + 1,
    }));

    await prisma.assigningCourseToTags.createMany({
      data: assignments,
    });

    return { 
      status: true, 
      message: `${newCourseIds.length} courses assigned successfully` 
    };
  } catch (error) {
    console.error("Error assigning courses to tag:", error);
    return {
      status: false,
      cause: "error",
      message:
        error instanceof Error ? error.message : "Failed to assign courses to tag",
    };
  }
}

// Assign course to tag
export async function assignCourseToTag(
  prevState: StateType,
  data: { tagId: string; courseId: string } | undefined
): Promise<StateType> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "manager") {
      return { status: false, cause: "unauthorized", message: "Unauthorized" };
    }

    if (!data?.tagId || !data?.courseId) {
      return {
        status: false,
        cause: "data",
        message: "Tag ID and Course ID are required",
      };
    }

    // Check if assignment already exists
    const existing = await prisma.assigningCourseToTags.findUnique({
      where: {
        courseId_tagId: {
          courseId: data.courseId,
          tagId: data.tagId,
        },
      },
    });

    if (existing) {
      return {
        status: false,
        cause: "exists",
        message: "Course is already assigned to this tag",
      };
    }

    // Get the max order value for this tag
    const existingAssignments = await prisma.assigningCourseToTags.findMany({
      where: { tagId: data.tagId },
      select: { order: true },
      orderBy: { order: 'desc' },
      take: 1,
    });
    // Ensure order starts from 1 for new assignments
    const maxOrder = Math.max(0, existingAssignments[0]?.order ?? 0);

    await prisma.assigningCourseToTags.create({
      data: {
        tagId: data.tagId,
        courseId: data.courseId,
        order: maxOrder + 1,
      },
    });

    return { status: true };
  } catch (error) {
    console.error("Error assigning course to tag:", error);
    return {
      status: false,
      cause: "error",
      message:
        error instanceof Error ? error.message : "Failed to assign course to tag",
    };
  }
}

// Remove course from tag
export async function removeCourseFromTag(
  prevState: StateType,
  id: string | undefined
): Promise<StateType> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "manager") {
      return { status: false, cause: "unauthorized", message: "Unauthorized" };
    }

    if (!id) {
      return {
        status: false,
        cause: "id",
        message: "Assignment ID is required",
      };
    }

    await prisma.assigningCourseToTags.delete({
      where: { id },
    });

    return { status: true };
  } catch (error) {
    console.error("Error removing course from tag:", error);
    return {
      status: false,
      cause: "error",
      message:
        error instanceof Error ? error.message : "Failed to remove course from tag",
    };
  }
}

// Reorder courses within a tag
export async function reorderCoursesInTag(
  prevState: StateType,
  data: { tagId: string; assignmentIds: string[] } | undefined
): Promise<StateType> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "manager") {
      return { status: false, cause: "unauthorized", message: "Unauthorized" };
    }

    if (!data?.tagId || !data?.assignmentIds || data.assignmentIds.length === 0) {
      return {
        status: false,
        cause: "data",
        message: "Tag ID and assignment IDs are required",
      };
    }

    // Update order for each assignment
    await Promise.all(
      data.assignmentIds.map((assignmentId, index) =>
        prisma.assigningCourseToTags.update({
          where: { id: assignmentId },
          data: { order: index + 1 },
        })
      )
    );

    return { status: true };
  } catch (error) {
    console.error("Error reordering courses in tag:", error);
    return {
      status: false,
      cause: "error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to reorder courses in tag",
    };
  }
}


