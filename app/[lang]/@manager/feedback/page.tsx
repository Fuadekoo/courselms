/* eslint-disable @typescript-eslint/no-explicit-any */
 "use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Star, Search, Filter, Calendar, User } from "lucide-react";
import useData from "@/hooks/useData";
import { getCoursesList } from "@/actions/manager/course";
import { getFeedback, getAverageRating } from "@/lib/data/courseMaterials";
import ScrollablePageWrapper from "@/components/layout/ScrollablePageWrapper";
import PageHeader from "@/components/layout/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Loading from "@/components/loading";

interface FeedbackItem {
  id: string;
  feedback: string;
  rating: number;
  createdAt: Date;
  user: { firstName: string; fatherName: string };
}

export default function Page() {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";

  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [ratingFilter, setRatingFilter] = useState<number | 0>(0);
  const [search, setSearch] = useState("");

  // Load courses for selector
  const { data: courses, loading: loadingCourses } = useData({
    func: getCoursesList,
    args: [],
  });

  // Initialize selected course once courses are available
  useEffect(() => {
    if (!selectedCourseId && courses && courses.length > 0) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  // Load feedback and average rating for selected course
  const { data: feedbackList, loading: loadingFeedback } = useData({
    func: getFeedback,
    args: [selectedCourseId || ""],
  });

  const { data: avg, loading: loadingAvg } = useData({
    func: getAverageRating,
    args: [selectedCourseId || ""],
  });

  // Derived filters
  const filteredFeedbacks = useMemo(() => {
    const list = (feedbackList as FeedbackItem[] | undefined) || [];
    return list
      .filter((f) => (ratingFilter ? f.rating === ratingFilter : true))
      .filter((f) => {
        if (!search.trim()) return true;
        const term = search.trim().toLowerCase();
        const name = `${f.user.firstName} ${f.user.fatherName}`.toLowerCase();
        return (
          f.feedback.toLowerCase().includes(term) || name.includes(term)
        );
      });
  }, [feedbackList, ratingFilter, search]);

  // Rating distribution (from all feedback of the course)
  const distribution = useMemo(() => {
    const base = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<1 | 2 | 3 | 4 | 5, number>;
    const list = (feedbackList as FeedbackItem[] | undefined) || [];
    for (const f of list) {
      const r = Math.max(1, Math.min(5, Math.round(f.rating))) as 1 | 2 | 3 | 4 | 5;
      base[r]++;
    }
    return base;
  }, [feedbackList]);

  const totalReviews = useMemo(() => Object.values(distribution).reduce((a, c) => a + c, 0), [distribution]);

  const renderStars = (value: number) => (
    <div className="flex gap-1" aria-label={`Rating: ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
        />
      ))}
    </div>
  );

  if (loadingCourses) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  if (!courses || courses.length === 0) {
    return (
      <ScrollablePageWrapper>
        <PageHeader
          title={lang === "en" ? "Course Feedback" : "የኮርስ አስተያየት"}
          subtitle={lang === "en" ? "View and analyze student feedback for your courses." : "የተማሪዎችን አስተያየት ይመልከቱ እና ይተንትኑ።"}
        />
        <EmptyState
          icon={<Star className="size-16" />}
          title={lang === "en" ? "No Courses Available" : "ኮርስ የለም"}
          description={lang === "en" ? "There are no courses available to view feedback for." : "አስተያየት ለማየት የሚገኝ ኮርስ የለም።"}
        />
      </ScrollablePageWrapper>
    );
  }

  return (
    <ScrollablePageWrapper>
      <PageHeader
        title={lang === "en" ? "Course Feedback" : "የኮርስ አስተያየት"}
        subtitle={lang === "en" ? "View and analyze student feedback for your courses." : "የተማሪዎችን አስተያየት ይመልከቱ እና ይተንትኑ።"}
      />

      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
        <div className="flex-1 min-w-[220px]">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            {lang === "en" ? "Course" : "ኮርስ"}
          </label>
          <div className="relative">
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full appearance-none rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {loadingCourses && <option>{lang === "en" ? "Loading..." : "በመጫን ላይ..."}</option>}
              {(!courses || courses.length === 0) && !loadingCourses && (
                <option>{lang === "en" ? "No courses available" : "ኮርስ የለም"}</option>
              )}
              {courses?.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {lang === "en" ? c.titleEn : c.titleAm}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
              <Filter className="w-4 h-4" />
            </span>
          </div>
        </div>

        <div className="w-full lg:w-60">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            {lang === "en" ? "Rating" : "ደረጃ"}
          </label>
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={0}>{lang === "en" ? "All ratings" : "ሁሉም ደረጃዎች"}</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>{r} {lang === "en" ? "stars" : "ኮከቦች"}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[220px]">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            {lang === "en" ? "Search" : "መፈለጊያ"}
          </label>
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === "en" ? "Search feedback or student name..." : "ግብረመልስ ወይም ስም ይፈልጉ..."}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">{lang === "en" ? "Average rating" : "መካከለኛ ደረጃ"}</p>
              <div className="flex items-center gap-2 mt-2">
                {renderStars(Math.round(Number(avg?.average || 0)))}
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{Number(avg?.average || 0).toFixed(1)}</span>
                <span className="text-sm text-gray-500">({avg?.count || 0} {lang === "en" ? "reviews" : "ግምገማ"})</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <p className="text-sm text-gray-600 dark:text-gray-300">{lang === "en" ? "Rating distribution" : "የደረጃ ስርጭት"}</p>
          <div className="mt-3 space-y-2">
            {[5, 4, 3, 2, 1].map((r) => {
              const count = distribution[r as 1 | 2 | 3 | 4 | 5] || 0;
              const pct = totalReviews ? Math.round((count / totalReviews) * 100) : 0;
              return (
                <div key={r} className="flex items-center gap-3">
                  <div className="w-10 text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <span>{r}</span>
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  </div>
                  <div className="flex-1 h-2 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div className="h-full bg-yellow-400" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="w-12 text-right text-xs text-gray-500">{pct}%</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">{lang === "en" ? "Reviews" : "ግምገማዎች"}</h2>
          {loadingCourses || loadingAvg || loadingFeedback ? (
            <span className="text-xs text-gray-500">{lang === "en" ? "Loading..." : "በመጫን ላይ..."}</span>
          ) : (
            <span className="text-xs text-gray-500">{filteredFeedbacks.length} {lang === "en" ? "results" : "ውጤቶች"}</span>
          )}
        </div>

        {/* Empty states */}
        {!selectedCourseId || (courses && courses.length === 0) ? (
          <div className="text-center text-sm text-gray-500 py-8">{lang === "en" ? "Please select a course to view feedback." : "ግብረመልስ ለማየት ኮርስ ይምረጡ።"}</div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-8">{lang === "en" ? "No feedback found for current filters." : "ለአሁኑ ማጣሪያዎች ግብረመልስ አልተገኘም።"}</div>
        ) : (
          <div className="space-y-4">
            {filteredFeedbacks.map((feedback: FeedbackItem) => (
              <div key={feedback.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 grid place-content-center">
                      <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 justify-between">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {feedback.user.firstName} {feedback.user.fatherName}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-sm">
                          {renderStars(feedback.rating)}
                          <div className="flex items-center gap-1 text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(feedback.createdAt).toLocaleDateString(
                                lang === "en" ? "en-US" : "am-ET",
                                { year: "numeric", month: "short", day: "numeric" }
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{feedback.feedback}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ScrollablePageWrapper>
  );
}
