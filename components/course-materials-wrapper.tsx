"use client";

import { CourseMaterialsSelector } from "./course-materials-selector";

interface CourseMaterialsWrapperProps {
  coursePackages: Array<{
    id: string;
    titleEn: string;
    titleAm: string;
    aboutEn: string;
    aboutAm: string;
    courseMaterials: string | null;
    pdfData?: string | null;
    aiProvider: string | null;
    status: boolean;
    _count: {
      order: number;
    };
  }>;
}

export function CourseMaterialsWrapper({ coursePackages }: CourseMaterialsWrapperProps) {
  return <CourseMaterialsSelector coursePackages={coursePackages} />;
}

