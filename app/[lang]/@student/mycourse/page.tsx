"use client";

import useData from "@/hooks/useData";
import { getMyCoursesWithProgress } from "@/actions/student/mycourse";
import { getCoursesForLoginCustomer } from "@/lib/data/course";
import React from "react";
import { useGlobalLoading } from "@/stores/uiStore";
import MyCourseCard from "@/components/myCourseCard";
import CourseCard from "@/components/courseCard";
import { useParams, useSearchParams } from "next/navigation";
import { Button } from "@heroui/react";
import Link from "next/link";

export default function Page() {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang ?? "en";
  const searchParams = useSearchParams();

  const { data: myCourses, loading: myCoursesLoading } = useData({
    func: getMyCoursesWithProgress,
    args: [],
  });

  const { data: availableCoursesResponse, loading: allCoursesLoading } = useData({
    func: getCoursesForLoginCustomer,
    args: [],
  });

  const availableCourses = Array.isArray(availableCoursesResponse?.data)
    ? availableCoursesResponse.data
    : [];

  const globalLoading = useGlobalLoading();

  // Keep previous page visible while loading (TopLoadingBar will show progress)
  if (globalLoading || myCoursesLoading || allCoursesLoading) {
    return null;
  }

  return (
    <div className="px-4 md:px-6 py-6 space-y-8">
      {/* My Courses Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">
          {lang === "en" ? "My Courses" : "የእኔ ኮርሶች"}
        </h2>
        {!myCourses || myCourses.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            {lang === "en"
              ? "You haven't purchased any courses yet"
              : "እስካሁን ምንም ኮርስ አልገዛም"}
          </div>
        ) : (
          <div className="space-y-4">
            {myCourses.map((course) => (
              <MyCourseCard key={course.id} {...course} />
            ))}
          </div>
        )}
      </section>

      {/* All Courses Section (grouped by tag) */}
      <section className="space-y-4">
        {!availableCourses || availableCourses.length <= 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            {lang === "en" ? "No courses available" : "ኮርስ የለም"}
          </div>
        ) : (
          <div className="space-y-8">
            {availableCourses.map((tag: any) => (
              <div key={tag.id} className="space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold">{tag.name}</h3>
                  <span className="text-sm text-default-500">
                    {tag.courses.length} {lang === "en" ? "courses" : "ኮርሶች"}
                  </span>
                </div>
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr">
                  {tag.courses.map((course: any, i: number) => (
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
                            {lang == "en" ? "Get started" : "ጀምር"}
                          </Button>
                        </Link>
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
