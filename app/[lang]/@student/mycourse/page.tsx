"use client";

import useData from "@/hooks/useData";
import { getMyCoursesWithProgress } from "@/actions/student/mycourse";
import { getCoursesForLoginCustomer } from "@/lib/data/course";
import React from "react";
import Loading from "@/components/loading";
import MyCourseCard from "@/components/myCourseCard";
import CourseCard from "@/components/courseCard";
import { useParams, useSearchParams } from "next/navigation";
import { Button } from "@heroui/react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function Page() {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang ?? "en";
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const studentId = (session?.user as any)?.id;

  const { data: myCourses, loading: myCoursesLoading } = useData({
    func: getMyCoursesWithProgress,
    args: [],
  });

  const { data: allCourses, loading: allCoursesLoading } = useData({
    func: getCoursesForLoginCustomer,
    args: [],
  });

  const loading = myCoursesLoading || allCoursesLoading;

  return (
    <div className="px-4 md:px-6 py-6 space-y-8">
      {/* My Courses Section */}
      {myCourses && myCourses.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {lang === "en" ? "My Courses" : "የእኔ ኮርሶች"}
          </h2>
          {loading ? (
            <Loading />
          ) : (
            <div className="space-y-4">
              {myCourses.map((course) => (
                <MyCourseCard key={course.id} {...course} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* All Courses Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {lang === "en" ? "All Courses" : "ሁሉም ኮርሶች"}
        </h2>
        {loading ? (
          <Loading />
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
