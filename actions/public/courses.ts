"use server";

import prisma from "@/lib/db";
import { fuzzySearch } from "@/lib/utils/fuzzySearch";

interface GetCoursesByTagsOptions {
  featuredOnly?: boolean;
  limitPerTag?: number;
  includeCourseCount?: boolean;
  search?: string;
}

// Get courses organized by tags for public display
export async function getCoursesByTags(options: GetCoursesByTagsOptions = {}) {
  const {
    featuredOnly = false,
    limitPerTag,
    includeCourseCount = true,
    search = "",
  } = options;
  try {
    // Get all active tags with their courses
    const tags = await prisma.tags.findMany({
      orderBy: { order: "asc" },
      where: featuredOnly
        ? {
            OR: [
              { name: { contains: "Quran" } },
              { name: { contains: "Arabic" } },
              { name: { contains: "Memorization" } },
            ],
          }
        : {},
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
                price: true,
                birrPrice: true,
                dolarPrice: true,
                level: true,
                language: true,
                duration: true,
                status: true,
                instructor: {
                  select: {
                    firstName: true,
                    fatherName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Process tags and courses
    const processedTags = tags
      .map((tag: any) => {
        // Get active courses for this tag
        let activeCourses = tag.assigningCourseToTags
          .filter((assignment: any) => assignment.course?.status === true)
          .map((assignment: any) => ({
            ...assignment.course,
            price: assignment.course?.price
              ? Number(assignment.course.price)
              : null,
            birrPrice: assignment.course?.birrPrice
              ? Number(assignment.course.birrPrice)
              : null,
            dolarPrice: assignment.course?.dolarPrice
              ? Number(assignment.course.dolarPrice)
              : null,
            enrollmentCount: 0, // This would come from analytics in a real app
            isFeatured:
              assignment.course?.level === "BEGINNER" ||
              assignment.course?.level === "INTERMEDIATE",
          }));

        // Apply fuzzy search if search query is provided
        if (search && search.trim()) {
          const lowerSearch = search.toLowerCase();
          const tagNameMatches = tag.name.toLowerCase().includes(lowerSearch);

          if (!tagNameMatches) {
            activeCourses = fuzzySearch(activeCourses as any, search);
          }
        }

        // Get top courses if limit is specified
        const courses = limitPerTag
          ? activeCourses.slice(0, limitPerTag)
          : activeCourses;

        // Calculate average rating (would come from reviews in a real app)
        const averageRating = 4.5; // Placeholder
        const reviewCount = 42; // Placeholder

        return {
          id: tag.id,
          name: tag.name,
          nameAm: tag.nameAm,
          order: tag.order,
          slug: tag.name.toLowerCase().replace(/\s+/g, "-"),
          icon: getTagIcon(tag.name),
          isFeatured: featuredOnly,
          courseCount: includeCourseCount ? courses.length : undefined,
          description: getTagDescription(tag.name),
          descriptionAm: getTagDescriptionAm(tag.name),
          averageRating,
          reviewCount,
          courses,
        };
      })
      .filter((tag) => tag.courses.length > 0)
      .sort((a, b) => a.order - b.order);

    return {
      success: true,
      data: processedTags,
    };
  } catch (error) {
    // If migrations haven't been applied yet, Prisma throws P2021 (table missing).
    // Return a safe empty response so the app doesn't 500 during setup.
    const prismaCode =
      typeof error === "object" && error && "code" in error
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (error as any).code
        : undefined;
    if (prismaCode === "P2021") {
      return { success: true, data: [] as any[] };
    }

    console.error("Error fetching courses by tags:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch courses by tags",
      data: [],
    };
  }
}

// Helper function to get appropriate icon for each tag
function getTagIcon(tagName: string): string {
  const iconMap: Record<string, string> = {
    quran: "book-open",
    arabic: "language",
    hadith: "book-text",
    fiqh: "scale",
    memorization: "brain",
    tajweed: "volume-2",
    tajwid: "volume-2",
    tawheed: "star",
    seerah: "users",
    "islamic history": "clock",
  };

  const lowerTag = tagName.toLowerCase();
  return (
    Object.entries(iconMap).find(([key]) => lowerTag.includes(key))?.[1] ||
    "book"
  );
}

// Helper function to get tag descriptions
function getTagDescription(tagName: string): string {
  const descriptions: Record<string, string> = {
    quran:
      "Learn to read, understand and memorize the Holy Quran with expert guidance",
    arabic:
      "Master the Arabic language to better understand the Quran and Islamic texts",
    hadith: "Study the sayings and teachings of Prophet Muhammad (PBUH)",
    fiqh: "Learn Islamic jurisprudence and practical rulings for daily life",
    memorization:
      "Systematic approach to memorizing the Quran with proper tajweed",
    tajweed: "Perfect your Quranic recitation with proper pronunciation rules",
    tawheed: "Deepen your understanding of Islamic monotheism",
    seerah: "Study the life and teachings of Prophet Muhammad (PBUH)",
    "islamic history":
      "Explore the rich history of Islam and Muslim civilizations",
  };

  const lowerTag = tagName.toLowerCase();
  return (
    Object.entries(descriptions).find(([key]) => lowerTag.includes(key))?.[1] ||
    `Explore our ${tagName} courses`
  );
}

// Helper function to get tag descriptions in Amharic
function getTagDescriptionAm(tagName: string): string {
  const descriptions: Record<string, string> = {
    quran: "ቅዱስ ቁርአንን በእውቀት ማንበብ፣ መረዳት እና መማሪያ",
    arabic: "ቁርአንን እና የእስልምና ጽሑፎችን ለመረዳት የአረብኛ ቋንቋ ይማሩ",
    hadith: "የነብይ ሙሀመድ (ሰ.ወ.ሰ) ትምህርቶችን እና ንግግርን ያጥኑ",
    fiqh: "የእስልምና ፍቺ እና የተለመዱ የዕለት መንፈሳዊ እይታዎች",
    memorization: "ቁርአንን በትክክለኛው ታጅዊድ በስርተኝነት መማሪያ",
    tajweed: "ቁርአንን በትክክለኛው አነጋገጃ የንግግር ማሟያዎች",
    tawheed: "የእስልምና አንድነትን በዝምብለት መረዳት",
    seerah: "የነብይ ሙሀመድ (ሰ.ወ.ሰ) ሕይወትን እና ትምህርቶችን ያጥኑ",
    "islamic history": "የእስልምናን እና የሙስሊም ሥልጣኔዎችን ታሪክ",
  };

  const lowerTag = tagName.toLowerCase();
  return (
    Object.entries(descriptions).find(([key]) => lowerTag.includes(key))?.[1] ||
    `የ${tagName} ኮርሶቻችንን ይመልከቱ`
  );
}
