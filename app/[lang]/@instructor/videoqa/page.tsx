"use client";

import React from "react";
import { useParams } from "next/navigation";
import InstructorVideoQA from "@/components/InstructorVideoQA";

export default function VideoQAPage() {
  const params = useParams<{ lang: string; courseId?: string }>();
  const lang = params?.lang || "en";
  const courseId = params?.courseId; // Optional course filter

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header Section - Fixed */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 md:p-6 mb-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {lang === "en" ? "Video Q&A Management" : "የቪዲዮ ጥያቄ እና መልስ አስተዳደር"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {lang === "en" 
              ? "Manage and respond to student questions about your course videos"
              : "ስለ ኮርስ ቪዲዮዎችዎ የተማሪዎች ጥያቄዎችን ይመልሱ እና ያስተዳድሩ"}
          </p>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 md:px-6 pb-6">
            <InstructorVideoQA lang={lang} courseId={courseId} />
          </div>
        </div>
      </div>
    </div>
  );
}