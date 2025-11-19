"use client";

import useData from "@/hooks/useData";
import { getCoursesForLoginCustomer } from "@/lib/data/course";
import React from "react";
import CourseCard from "@/components/courseCard";
import { useParams, useSearchParams } from "next/navigation";
import { Button } from "@heroui/react";
import Link from "next/link";
import ScrollablePageWrapper from "@/components/layout/ScrollablePageWrapper";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { BookOpen } from "lucide-react";

export default function Page() {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang ?? "en";
  const searchParams = useSearchParams();
  const { data, loading } = useData({
    func: getCoursesForLoginCustomer,
    args: [],
  });

  if (loading) {
    return (
      <ScrollablePageWrapper>
        <PageHeader
          title={lang === "en" ? "Available Courses" : "ያሉ ኮርሶች"}
          subtitle={
            lang === "en"
              ? "Loading available courses..."
              : "ያሉ ኮርሶች በመጫን ላይ..."
          }
        />
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card p-4">
              <div className="h-48 skeleton mb-4" />
              <div className="h-6 w-3/4 skeleton mb-2" />
              <div className="h-4 w-1/2 skeleton" />
            </div>
          ))}
        </div>
      </ScrollablePageWrapper>
    );
  }

  if (!data || data.length <= 0) {
    return (
      <ScrollablePageWrapper>
        <PageHeader
          title={lang === "en" ? "Available Courses" : "ያሉ ኮርሶች"}
          subtitle={
            lang === "en"
              ? "Browse and enroll in available courses."
              : "ያሉ ኮርሶችን ይመልከቱ እና ይመዝገቡ።"
          }
        />
        <EmptyState
          icon={<BookOpen className="size-16" />}
          title={lang === "en" ? "No Courses Available" : "ኮርስ የለም"}
          description={
            lang === "en"
              ? "There are currently no courses available for enrollment."
              : "በአሁኑ ጊዜ ለምዝገባ የሚገኝ ኮርስ የለም።"
          }
        />
      </ScrollablePageWrapper>
    );
  }

  return (
    <ScrollablePageWrapper>
      <PageHeader
        title={lang === "en" ? "Available Courses" : "ያሉ ኮርሶች"}
        subtitle={
          lang === "en"
            ? "Browse and enroll in available courses."
            : "ያሉ ኮርሶችን ይመልከቱ እና ይመዝገቡ።"
        }
      />
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr">
        {data.map((course, i) => (
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
    </ScrollablePageWrapper>
  );
}
