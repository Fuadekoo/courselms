"use client";

import useData from "@/hooks/useData";
// import { getCoursesForCustomer } from "@/lib/data/course";
import { getAllMyCourses } from "@/actions/student/mycourse";
import React from "react";
import Loading from "@/components/loading";
import NoData from "@/components/noData";
import CourseCard from "@/components/courseCard";
import { useParams } from "next/navigation";
import { Button } from "@heroui/react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function Page() {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang ?? "en";
  const { data: session } = useSession();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const studentId = (session?.user as any)?.id;

  const { data, loading } = useData({
    func: getAllMyCourses,
    args: [studentId],
  });

  return (
    <div className=" overflow-y-auto">
      {loading ? (
        <Loading />
      ) : !data || data.length <= 0 ? (
        <NoData />
      ) : (
        <div className="z-30 px-4 py-20 md:px-10 md:py-24 h-full grid gap-5 grid-cols-1 md:grid-cols-3 2xl:grid-cols-4 auto-rows-fr">
          {data.map(({ id, ...value }, i) => (
            <CourseCard
              key={i + ""}
              {...{ ...value, id }}
              titleLink={`/${lang}/mycourse/${id}`}
              btn={
                <Button
                  color="primary"
                  as={Link}
                  href={`/${lang}/mycourse/${id}`}
                  className=""
                >
                  {lang == "en" ? "View Course" : "ኮርሱን ይመልከቱ"}
                </Button>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
