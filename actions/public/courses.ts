"use server";

import prisma from "@/lib/db";

interface GetCoursesByTagsOptions {
  featuredOnly?: boolean;
  limitPerTag?: number;
  includeCourseCount?: boolean;
}

// Get courses organized by tags for public display
export async function getCoursesByTags(options: GetCoursesByTagsOptions = {}) {
  const { 
    featuredOnly = false, 
    limitPerTag,
    includeCourseCount = true
  } = options;
  try {
    // Get all active tags with their courses
    const tags = await prisma.tags.findMany({
      orderBy: { order: "asc" },
      where: featuredOnly ? { 
        OR: [
          { name: { contains: 'Quran', mode: 'insensitive' } },
          { name: { contains: 'Arabic', mode: 'insensitive' } },
          { name: { contains: 'Memorization', mode: 'insensitive' } }
        ]
      } : {},
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
      .map((tag) => {
        // Get active courses for this tag
        const activeCourses = tag.assigningCourseToTags
          .filter(assignment => assignment.course?.status === true)
          .map((assignment) => ({
            ...assignment.course,
            price: assignment.course?.price ? Number(assignment.course.price) : null,
            birrPrice: assignment.course?.birrPrice ? Number(assignment.course.birrPrice) : null,
            dolarPrice: assignment.course?.dolarPrice ? Number(assignment.course.dolarPrice) : null,
            enrollmentCount: 0, // This would come from analytics in a real app
            isFeatured: assignment.course?.level === 'BEGINNER' || assignment.course?.level === 'INTERMEDIATE'
          }));

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
          order: tag.order,
          slug: tag.name.toLowerCase().replace(/\s+/g, '-'),
          icon: getTagIcon(tag.name),
          isFeatured: featuredOnly,
          courseCount: includeCourseCount ? courses.length : undefined,
          description: getTagDescription(tag.name),
          averageRating,
          reviewCount,
          courses,
        };
      })
      .filter(tag => tag.courses.length > 0)
      .sort((a, b) => a.order - b.order);

    return {
      success: true,
      data: processedTags,
    };
  } catch (error) {
    console.error("Error fetching courses by tags:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch courses by tags",
      data: [],
    };
  }
}

// Helper function to get appropriate icon for each tag
function getTagIcon(tagName: string): string {
  const iconMap: Record<string, string> = {
    'quran': 'book-open',
    'arabic': 'language',
    'hadith': 'book-text',
    'fiqh': 'scale',
    'memorization': 'brain',
    'tajweed': 'volume-2',
    'tajwid': 'volume-2',
    'tawheed': 'star',
    'seerah': 'users',
    'islamic history': 'clock'
  };

  const lowerTag = tagName.toLowerCase();
  return Object.entries(iconMap).find(([key]) => 
    lowerTag.includes(key)
  )?.[1] || 'book';
}

// Helper function to get tag descriptions
function getTagDescription(tagName: string): string {
  const descriptions: Record<string, string> = {
    'quran': 'Learn to read, understand and memorize the Holy Quran with expert guidance',
    'arabic': 'Master the Arabic language to better understand the Quran and Islamic texts',
    'hadith': 'Study the sayings and teachings of Prophet Muhammad (PBUH)',
    'fiqh': 'Learn Islamic jurisprudence and practical rulings for daily life',
    'memorization': 'Systematic approach to memorizing the Quran with proper tajweed',
    'tajweed': 'Perfect your Quranic recitation with proper pronunciation rules',
    'tawheed': 'Deepen your understanding of Islamic monotheism',
    'seerah': 'Study the life and teachings of Prophet Muhammad (PBUH)',
    'islamic history': 'Explore the rich history of Islam and Muslim civilizations'
  };

  const lowerTag = tagName.toLowerCase();
  return Object.entries(descriptions).find(([key]) => 
    lowerTag.includes(key)
  )?.[1] || `Explore our ${tagName} courses`;
}