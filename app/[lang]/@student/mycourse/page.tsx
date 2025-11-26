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

  const { data: allCourses, loading: allCoursesLoading } = useData({
    func: getCoursesForLoginCustomer,
    args: [],
  });

  const loading = myCoursesLoading || allCoursesLoading;
  const globalLoading = useGlobalLoading();

  if (globalLoading) {
    return null; // Hide content while TopLoadingBar is active
  }

  return (
    <div className="px-4 md:px-6 py-6 space-y-8">
      {/* My Courses Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">
          {lang === "en" ? "My Courses" : "የእኔ ኮርሶች"}
        </h2>
        {myCoursesLoading ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            {lang === "en" ? "Loading courses..." : "ኮርሶች በመጫን ላይ..."}
          </div>
        ) : !myCourses || myCourses.length === 0 ? (
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

      {/* All Courses Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">
          {lang === "en" ? "All Courses" : "ሁሉም ኮርሶች"}
        </h2>
        {loading ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            {lang === "en" ? "Loading courses..." : "ኮርሶች በመጫን ላይ..."}
          </div>
        ) : !allCourses || allCourses.length <= 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            {lang === "en" ? "No courses available" : "ኮርስ የለም"}
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr">
            {allCourses.map(({ id, ...value }, i) => (
              <CourseCard
                key={i + ""}
                {...{ ...value, id }}
                titleLink={`/${lang}/course/${id}?code=${
                  searchParams?.get("code") || ""
                }`}
                btn={
                  <Link
                    href={`/${lang}/course/${id}?code=${
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
        )}
      </section>
    </div>
  );
}
