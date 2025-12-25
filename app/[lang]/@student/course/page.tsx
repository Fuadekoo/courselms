"use client";

import useData from "@/hooks/useData";
import { getCoursesByTags } from "@/actions/public/courses";
import React, { useMemo } from "react";
import { useGlobalLoading } from "@/stores/uiStore";
import CourseCard from "@/components/courseCard";
import { useParams, useSearchParams } from "next/navigation";
import { Button } from "@heroui/react";
import Link from "next/link";

export default function Page() {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang ?? "en";
  const searchParams = useSearchParams();
  const search = searchParams?.get("search") || "";
  // keep args stable so fetch doesn't re-run unnecessarily
  const courseArgs = useMemo(() => [{ search }], [search]);
  const { data: response, loading } = useData({
    func: getCoursesByTags,
    args: courseArgs,
  });

  // Ensure taggedCourses is always an array
  const coursesToDisplay = Array.isArray(response?.data) ? response.data : [];
  const globalLoading = useGlobalLoading();

  // Keep previous page visible while loading (TopLoadingBar will show progress)
  if (globalLoading || loading) {
    return null;
  }

  return (
    <div className="px-4 md:px-6 py-6 space-y-8">
      {coursesToDisplay.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          {lang === "en" ? "No courses available" : "ኮርስ የለም"}
        </div>
      ) : (
        coursesToDisplay.map((tag) => (
          <section key={tag.id} className="space-y-4">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">
              {tag.name}
            </h2>
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr">
              {tag.courses.map((course, i) => (
                <CourseCard
                  key={i + ""}
                  {...course}
                  titleLink={`/${lang}/course/${course.id}?code=${
                    searchParams?.get("code") || ""
                  }`}
                  btn={
                    <Link
                      href={`/${lang}/course/${course.id}?code=${
                        searchParams?.get("code") || ""
                      }`}
                      className="w-full"
                    >
                      <Button color="primary" className="w-full">
                        {lang == "en" ? "Enroll" : "መዝግብ"}
                      </Button>
                    </Link>
                  }
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
