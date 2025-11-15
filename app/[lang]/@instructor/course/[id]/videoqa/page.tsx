"use client";

import React from "react";
import { useParams } from "next/navigation";
import InstructorVideoQA from "@/components/InstructorVideoQA";

export default function CourseVideoQAPage() {
  const params = useParams<{ lang: string; id: string }>();
  const lang = params?.lang || "en";
  const courseId = params?.id;

  return (
    <div className="container mx-auto px-4 py-6">
      <InstructorVideoQA lang={lang} courseId={courseId} />
    </div>
  );
}