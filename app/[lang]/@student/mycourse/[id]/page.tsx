/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  PlayCircle,
  CheckCircle2,
  Sparkles,
  X,
  Circle,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { Accordion, AccordionItem } from "@heroui/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import useData from "@/hooks/useData";
import { useStudentProgressStore } from "@/stores";
import {
  getMySingleCourse,
  getMySingleCourseContent,
  unlockTheFinalExamAndQuiz,
  getFinalExamStatus,
  getActivityQuizStatus,
  completeSubActivity,
} from "@/actions/student/mycourse";
import Loading from "@/components/loading";
import Player from "@/components/stream/Player";
import TraditionalQA from "@/components/TraditionalQA";
import { useSession } from "next-auth/react";
import ChatComponent from "@/components/ui/chatComponent";
import CourseAnnouncements from "@/components/CourseAnnouncements";
import CourseFeedback from "@/components/CourseFeedback";
import CourseMaterials from "@/components/CourseMaterials";

// ---------------- COURSE CONTENT COMPONENT ----------------
function CourseContent({
  contentData,
  contentLoading,
  onSelectVideo,
  lang,
  currentVideoUrl,
  currentVideoFromStore,
  courseId,
  finalExamLocked,
  examStatus,
  forceOpenSectionIndex,
}: {
  contentData: any;
  contentLoading: boolean;
  onSelectVideo: (
    url: string,
    title: string,
    subActivityId?: string,
    thumbnail?: string
  ) => void;
  lang: string;
  currentVideoUrl: string;
  currentVideoFromStore: {
    url: string;
    title: string;
    subActivityId: string;
    thumbnail: string;
  } | null;
  courseId: string;
  finalExamLocked: boolean;
  examStatus: string;
  forceOpenSectionIndex?: number | null;
}) {
  const router = useRouter();
  const [activityQuizStatuses, setActivityQuizStatuses] = useState<
    Record<string, string>
  >({});
  const [statusesLoading, setStatusesLoading] = useState(false);

  // Compute initial expanded section synchronously using useMemo
  const initialExpandedSection = useMemo(() => {
    if (!contentData?.activity || contentData.activity.length === 0) {
      return "0"; // Default to first section
    }

    // Priority 1: Force open section (from query params or parent)
    if (
      forceOpenSectionIndex !== null &&
      forceOpenSectionIndex !== undefined &&
      forceOpenSectionIndex >= 0 &&
      forceOpenSectionIndex < contentData.activity.length
    ) {
      console.log("🎯 Initial: Force opening section:", forceOpenSectionIndex);
      return String(forceOpenSectionIndex);
    }

    // Priority 2: Current playing video section
    // First, try exact match
    let currentVideoSectionIndex = contentData.activity.findIndex(
      (activity: any) =>
        activity.subActivity.some((sub: any) => sub.video === currentVideoUrl)
    );

    // If no exact match, try matching by subActivityId from store
    if (
      currentVideoSectionIndex === -1 &&
      currentVideoFromStore?.subActivityId
    ) {
      currentVideoSectionIndex = contentData.activity.findIndex(
        (activity: any) =>
          activity.subActivity.some(
            (sub: any) => sub.id === currentVideoFromStore.subActivityId
          )
      );
    }

    // If still no match, try partial URL matching (filename)
    if (currentVideoSectionIndex === -1 && currentVideoUrl) {
      const currentVideoFilename =
        currentVideoUrl.split("/").pop() || currentVideoUrl;
      currentVideoSectionIndex = contentData.activity.findIndex(
        (activity: any) =>
          activity.subActivity.some((sub: any) => {
            const subVideoFilename = sub.video?.split("/").pop() || sub.video;
            return (
              subVideoFilename === currentVideoFilename ||
              sub.video?.includes(currentVideoFilename)
            );
          })
      );
    }

    if (currentVideoSectionIndex !== -1) {
      console.log(
        "🎯 Initial: Opening section with current video:",
        currentVideoSectionIndex
      );
      return String(currentVideoSectionIndex);
    }

    // Priority 3: Last accessed video from store
    if (currentVideoFromStore && currentVideoFromStore.subActivityId) {
      const lastAccessedSectionIndex = contentData.activity.findIndex(
        (activity: any) =>
          activity.subActivity.some(
            (sub: any) => sub.id === currentVideoFromStore.subActivityId
          )
      );
      if (lastAccessedSectionIndex !== -1) {
        console.log(
          "🎯 Initial: Opening section with last accessed video:",
          lastAccessedSectionIndex
        );
        return String(lastAccessedSectionIndex);
      }
    }

    // Priority 4: In-progress video (first non-completed after completed ones)
    let hasCompletedAny = false;
    for (let i = 0; i < contentData.activity.length; i++) {
      const activity = contentData.activity[i];
      for (const sub of activity.subActivity) {
        const isCompleted =
          contentData?.progress?.subActivityProgress?.[sub.id] === true;
        if (isCompleted) {
          hasCompletedAny = true;
        }
        if (hasCompletedAny && !isCompleted && sub.id) {
          console.log("🎯 Initial: Opening in-progress section:", i);
          return String(i);
        }
      }
    }

    // Priority 5: Partially completed sections
    for (let i = 0; i < contentData.activity.length; i++) {
      const activity = contentData.activity[i];
      const completedCount = activity.subActivity.filter(
        (sub: any) =>
          contentData?.progress?.subActivityProgress?.[sub.id] === true
      ).length;
      const totalCount = activity.subActivity.length;
      if (completedCount > 0 && completedCount < totalCount) {
        console.log("🎯 Initial: Opening partially completed section:", i);
        return String(i);
      }
    }

    // Priority 6: Last completed section (when no in-progress video exists)
    const fullyCompletedSections = contentData.activity
      .map((activity: any, index: number) => {
        const completedCount = activity.subActivity.filter(
          (sub: any) =>
            contentData?.progress?.subActivityProgress?.[sub.id] === true
        ).length;
        const totalCount = activity.subActivity.length;
        return completedCount === totalCount && totalCount > 0 ? index : null;
      })
      .filter((index: number | null): index is number => index !== null);

    if (fullyCompletedSections.length > 0) {
      const lastCompletedIndex = Math.max(...fullyCompletedSections);
      const nextSectionIndex = lastCompletedIndex + 1;

      // If there's a next section after the last completed one, open it
      if (nextSectionIndex < contentData.activity.length) {
        console.log(
          "🎯 Initial: Opening next section after last completed:",
          nextSectionIndex
        );
        return String(nextSectionIndex);
      } else {
        // Otherwise, open the last completed section
        console.log(
          "🎯 Initial: Opening last completed section:",
          lastCompletedIndex
        );
        return String(lastCompletedIndex);
      }
    }

    // Default: First section
    console.log("🎯 Initial: Using default section: 0");
    return "0";
  }, [
    contentData,
    forceOpenSectionIndex,
    currentVideoUrl,
    currentVideoFromStore,
  ]);

  // Initialize expandedKeys with computed initial section
  // This ensures the accordion has a section expanded from the start
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => {
    return new Set([initialExpandedSection]);
  });

  // Update expandedKeys when initialExpandedSection changes (e.g., when contentData loads)
  useEffect(() => {
    if (initialExpandedSection && contentData?.activity) {
      const newKeys = new Set([initialExpandedSection]);
      console.log("🎯 Updating expanded section:", {
        section: initialExpandedSection,
        hasContentData: !!contentData,
        activitiesCount: contentData.activity.length,
        newKeys: Array.from(newKeys),
      });
      setExpandedKeys(newKeys);
    }
  }, [initialExpandedSection, contentData]);

  // Handle forced section opening from parent (HIGHEST PRIORITY - runs first)
  useEffect(() => {
    if (
      forceOpenSectionIndex !== null &&
      forceOpenSectionIndex !== undefined &&
      contentData?.activity &&
      forceOpenSectionIndex >= 0 &&
      forceOpenSectionIndex < contentData.activity.length
    ) {
      const sectionKey = String(forceOpenSectionIndex);
      console.log("🎯 Force opening section:", {
        index: forceOpenSectionIndex,
        sectionKey,
        totalSections: contentData.activity.length,
        sectionTitle:
          contentData.activity[forceOpenSectionIndex]?.titleEn ||
          contentData.activity[forceOpenSectionIndex]?.titleAm,
      });
      // Immediately set the expanded keys
      setExpandedKeys(new Set([sectionKey]));
    }
  }, [forceOpenSectionIndex, contentData]);

  // Fetch quiz statuses for all activities
  useEffect(() => {
    const fetchQuizStatuses = async () => {
      if (!contentData?.activity || statusesLoading) return;

      setStatusesLoading(true);
      try {
        const statusPromises = contentData.activity
          .filter((activity: any) => activity.hasQuiz)
          .map(async (activity: any) => {
            const status = await getActivityQuizStatus(activity.id);
            return { activityId: activity.id, status };
          });

        const results = await Promise.all(statusPromises);
        const statusMap = results.reduce((acc, { activityId, status }) => {
          acc[activityId] = status;
          return acc;
        }, {} as Record<string, string>);

        setActivityQuizStatuses(statusMap);
      } catch (error) {
        console.error("Error fetching quiz statuses:", error);
      } finally {
        setStatusesLoading(false);
      }
    };

    fetchQuizStatuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentData?.activity]);

  // Function to refresh quiz status for a specific activity
  const refreshActivityQuizStatus = async (activityId: string) => {
    try {
      const status = await getActivityQuizStatus(activityId);
      setActivityQuizStatuses((prev) => ({
        ...prev,
        [activityId]: status,
      }));
    } catch (error) {
      console.error("Error refreshing quiz status:", error);
    }
  };

  // Update expanded section with professional priority logic (for dynamic updates)
  useEffect(() => {
    if (!contentData?.activity || contentData.activity.length === 0) return;

    // If forceOpenSectionIndex is set, skip automatic logic (parent is controlling it)
    if (forceOpenSectionIndex !== null && forceOpenSectionIndex !== undefined) {
      console.log(
        "⏭️ Skipping auto-logic, using forceOpenSectionIndex:",
        forceOpenSectionIndex
      );
      return;
    }

    /**
     * Smart section expansion priority:
     * 1. Current playing video section (from URL/active player)
     * 2. Last accessed video section (from Zustand store)
     * 3. First in-progress section (where user should continue)
     * 4. Most recently completed section (last activity)
     * 5. First section (fallback for new courses)
     */

    console.log("🎯 Accordion Logic Debug:", {
      currentVideoUrl,
      currentVideoFromStore,
      hasProgress: !!contentData?.progress?.subActivityProgress,
      progressDetails: contentData?.progress?.subActivityProgress,
      totalSections: contentData.activity.length,
    });

    // Priority 1: Currently playing video section (from URL)
    // First, try exact match
    let currentVideoSectionIndex = contentData.activity.findIndex(
      (activity: any) =>
        activity.subActivity.some((sub: any) => sub.video === currentVideoUrl)
    );

    // If no exact match, try matching by filename or subActivityId from store
    if (
      currentVideoSectionIndex === -1 &&
      currentVideoFromStore?.subActivityId
    ) {
      currentVideoSectionIndex = contentData.activity.findIndex(
        (activity: any) =>
          activity.subActivity.some(
            (sub: any) => sub.id === currentVideoFromStore.subActivityId
          )
      );
    }

    // If still no match, try partial URL matching (filename)
    if (currentVideoSectionIndex === -1 && currentVideoUrl) {
      const currentVideoFilename =
        currentVideoUrl.split("/").pop() || currentVideoUrl;
      currentVideoSectionIndex = contentData.activity.findIndex(
        (activity: any) =>
          activity.subActivity.some((sub: any) => {
            const subVideoFilename = sub.video?.split("/").pop() || sub.video;
            return (
              subVideoFilename === currentVideoFilename ||
              sub.video?.includes(currentVideoFilename)
            );
          })
      );
    }

    if (currentVideoSectionIndex !== -1) {
      console.log("✅ Priority 1: Opening section with current video URL:", {
        sectionIndex: currentVideoSectionIndex,
        currentVideoUrl,
        matched: true,
      });
      setExpandedKeys(new Set([String(currentVideoSectionIndex)]));
      return;
    } else {
      console.log("⚠️ Priority 1: No section found for current video:", {
        currentVideoUrl,
        currentVideoFromStore,
        availableVideos: contentData.activity.map((a: any, idx: number) => ({
          sectionIndex: idx,
          videos: a.subActivity.map((s: any) => ({
            id: s.id,
            video: s.video,
            title: s.titleEn || s.titleAm,
          })),
        })),
      });
    }

    // Priority 2: Last accessed video from store (user's recent context)
    // This handles cases where user was watching a video but hasn't completed it yet
    if (currentVideoFromStore && currentVideoFromStore.subActivityId) {
      const lastAccessedSectionIndex = contentData.activity.findIndex(
        (activity: any) =>
          activity.subActivity.some(
            (sub: any) => sub.id === currentVideoFromStore.subActivityId
          )
      );

      if (lastAccessedSectionIndex !== -1) {
        console.log(
          "✅ Priority 2: Opening section with last accessed video:",
          {
            sectionIndex: lastAccessedSectionIndex,
            videoId: currentVideoFromStore.subActivityId,
            videoTitle: currentVideoFromStore.title,
          }
        );
        setExpandedKeys(new Set([String(lastAccessedSectionIndex)]));
        return;
      }
    }

    // Also check if currentVideoFromStore URL matches any video (for intro video or other cases)
    if (currentVideoFromStore && currentVideoFromStore.url) {
      const currentVideoSectionIndex = contentData.activity.findIndex(
        (activity: any) =>
          activity.subActivity.some(
            (sub: any) => sub.video === currentVideoFromStore.url
          )
      );

      if (currentVideoSectionIndex !== -1) {
        console.log(
          "✅ Priority 2b: Opening section with current video URL from store:",
          currentVideoSectionIndex
        );
        setExpandedKeys(new Set([String(currentVideoSectionIndex)]));
        return;
      }
    }

    // Priority 3: In-progress section (first non-completed video after completed ones)
    // Find the first video that should be watched next (in-progress video)
    let hasCompletedAny = false;
    let inProgressSectionIndex = -1;

    for (let i = 0; i < contentData.activity.length; i++) {
      const activity = contentData.activity[i];

      for (const sub of activity.subActivity) {
        const isCompleted =
          contentData?.progress?.subActivityProgress?.[sub.id] === true;

        if (isCompleted) {
          hasCompletedAny = true;
        }

        // If we've completed some videos and found a non-completed one, that's our in-progress video
        if (hasCompletedAny && !isCompleted && sub.id) {
          inProgressSectionIndex = i;
          console.log("✅ Priority 3: Found in-progress video section:", {
            sectionIndex: inProgressSectionIndex,
            videoId: sub.id,
            videoTitle: lang === "en" ? sub.titleEn : sub.titleAm,
            hasCompletedAny,
            matchesCurrentVideo:
              currentVideoFromStore?.subActivityId === sub.id,
          });
          setExpandedKeys(new Set([String(inProgressSectionIndex)]));
          return;
        }
      }
    }

    // Also check for partially completed sections (some done, not all)
    const partiallyCompletedSections = contentData.activity
      .map((activity: any, index: number) => {
        const completedCount = activity.subActivity.filter(
          (sub: any) =>
            contentData?.progress?.subActivityProgress?.[sub.id] === true
        ).length;
        const totalCount = activity.subActivity.length;

        // Section is in-progress if it has some completed but not all
        if (completedCount > 0 && completedCount < totalCount) {
          return { index, completedCount, totalCount };
        }
        return null;
      })
      .filter(
        (
          item: {
            index: number;
            completedCount: number;
            totalCount: number;
          } | null
        ): item is {
          index: number;
          completedCount: number;
          totalCount: number;
        } => item !== null
      );

    if (partiallyCompletedSections.length > 0) {
      const targetSection = partiallyCompletedSections[0];
      console.log("✅ Priority 3b: Opening partially completed section:", {
        sectionIndex: targetSection.index,
        completedCount: targetSection.completedCount,
        totalCount: targetSection.totalCount,
      });
      setExpandedKeys(new Set([String(targetSection.index)]));
      return;
    }

    console.log(
      "⚠️ No in-progress sections found, continuing to Priority 4..."
    );

    // Priority 4: Last fully completed section (most recent activity)
    const fullyCompletedSections = contentData.activity
      .map((activity: any, index: number) => {
        const completedCount = activity.subActivity.filter(
          (sub: any) =>
            contentData?.progress?.subActivityProgress?.[sub.id] === true
        ).length;

        const totalCount = activity.subActivity.length;

        // Section is fully completed
        return completedCount === totalCount && totalCount > 0 ? index : null;
      })
      .filter((index: number | null): index is number => index !== null);

    if (fullyCompletedSections.length > 0) {
      // Open the next section after the last completed one (if it exists)
      // Otherwise, open the last completed section
      const lastCompletedIndex = Math.max(...fullyCompletedSections);
      const nextSectionIndex = lastCompletedIndex + 1;

      if (nextSectionIndex < contentData.activity.length) {
        console.log(
          "✅ Priority 4: Opening next section after completed:",
          nextSectionIndex
        );
        setExpandedKeys(new Set([String(nextSectionIndex)]));
      } else {
        console.log(
          "✅ Priority 4: Opening last completed section:",
          lastCompletedIndex
        );
        setExpandedKeys(new Set([String(lastCompletedIndex)]));
      }
      return;
    }

    // Priority 5: Default to first section for new courses
    console.log("✅ Priority 5: Opening first section (default)");
    setExpandedKeys(new Set(["0"]));
  }, [
    currentVideoUrl,
    contentData,
    currentVideoFromStore,
    forceOpenSectionIndex,
    lang,
  ]);

  if (contentLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    );
  }

  if (!contentData || !Array.isArray(contentData.activity)) {
    return (
      <div className="p-4 text-center text-gray-500">
        No course content available.
      </div>
    );
  }

  // Debug: Log current expanded keys
  console.log("🔍 Accordion Render - expandedKeys:", {
    expandedKeys: Array.from(expandedKeys),
    size: expandedKeys.size,
    hasContentData: !!contentData,
    activitiesCount: contentData?.activity?.length || 0,
  });

  return (
    <div className="flex flex-col overflow-auto  ">
      <Accordion
        selectionMode="single"
        selectedKeys={expandedKeys}
        onSelectionChange={(keys) => {
          console.log(
            "🔄 Accordion selection changed:",
            Array.from(keys as Set<string>)
          );
          setExpandedKeys(keys as Set<string>);
        }}
      >
        {contentData.activity.map((activity: any, index: number) => (
          <AccordionItem
            key={String(index)}
            aria-label={`Section ${index + 1}`}
            title={
              <span className="break-words overflow-wrap-anywhere">
                {`${lang === "en" ? "Section" : "ክፍል"} ${index + 1}: ${
                  lang === "en" ? activity.titleEn : activity.titleAm
                }`}
              </span>
            }
          >
            <ul className="space-y-1 px-2 pb-2 pt-0">
              {activity.subActivity.map((sub: any) => {
                const isActive = sub.video === currentVideoUrl;
                const isCompleted =
                  contentData?.progress?.subActivityProgress?.[sub.id] === true;
                return (
                  <li
                    key={sub.id}
                    onClick={() => {
                      // Open the accordion section containing this video
                      setExpandedKeys(new Set([String(index)]));
                      // Select the video
                      onSelectVideo(
                        sub.video,
                        lang === "en" ? sub.titleEn : sub.titleAm,
                        sub.id,
                        sub.thumbnail || undefined
                      );
                    }}
                    className={`flex items-center gap-2 cursor-pointer p-3 rounded ${
                      isActive
                        ? "bg-primary-100 font-bold"
                        : "hover:bg-primary-100"
                    }`}
                  >
                    {sub.thumbnail ? (
                      <div className="flex-shrink-0 w-16 h-10 rounded overflow-hidden bg-gray-200 relative">
                        <img
                          src={sub.thumbnail}
                          alt={lang === "en" ? sub.titleEn : sub.titleAm}
                          className="w-full h-full object-cover"
                        />
                        {isCompleted && (
                          <div className="absolute top-1 right-1 bg-green-500 rounded-full p-0.5">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-16 h-10 rounded bg-gray-200 flex items-center justify-center">
                        {isActive ? (
                          <PlayCircle className="text-primary w-5 h-5" />
                        ) : isCompleted ? (
                          <CheckCircle2 className="text-green-500 w-5 h-5" />
                        ) : (
                          <PlayCircle className="text-gray-400 w-5 h-5" />
                        )}
                      </div>
                    )}
                    <span className="break-words overflow-wrap-anywhere flex-1">
                      {lang === "en" ? sub.titleEn : sub.titleAm}
                    </span>
                    {isCompleted && !isActive && (
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    )}
                  </li>
                );
              })}

              {/* Always show quiz for now */}
              {true && (
                <li
                  onClick={() => {
                    refreshActivityQuizStatus(activity.id);
                    router.push(
                      `/${lang}/mycourse/${contentData.id}/${activity.id}`
                    );
                  }}
                  className="flex items-center justify-between p-3 rounded hover:bg-primary-100 cursor-pointer transition-all duration-200"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-purple-500" />
                    <span>{lang === "en" ? "Quiz" : "ፈተና"}</span>
                  </div>

                  {/* Quiz Status Indicator */}
                  <div className="flex items-center gap-2">
                    {statusesLoading ? (
                      <div className="w-4 h-4 border-2 border-slate-300 border-t-purple-500 rounded-full animate-spin" />
                    ) : (
                      <>
                        {(() => {
                          const status = activityQuizStatuses[activity.id];
                          switch (status) {
                            case "done":
                              return (
                                <div className="flex items-center gap-1">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                    {lang === "en" ? "Completed" : "ተጠናቋል"}
                                  </span>
                                </div>
                              );
                            case "partial":
                              return (
                                <div className="flex items-center gap-1">
                                  <div className="w-4 h-4 rounded-full border-2 border-amber-500">
                                    <div className="w-2 h-2 bg-amber-500 rounded-full m-0.5" />
                                  </div>
                                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                                    {lang === "en" ? "In Progress" : "በሂደት ላይ"}
                                  </span>
                                </div>
                              );
                            case "not-done":
                              return (
                                <div className="flex items-center gap-1">
                                  <Circle className="w-4 h-4 text-slate-400" />
                                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                    {lang === "en" ? "Not Started" : "አልተጀመረም"}
                                  </span>
                                </div>
                              );
                            case "no-quiz":
                              return (
                                <span className="text-xs text-slate-400">
                                  {lang === "en" ? "No Quiz" : "ፈተና የለም"}
                                </span>
                              );
                            default:
                              return (
                                <div className="flex items-center gap-1">
                                  <Circle className="w-4 h-4 text-slate-300" />
                                  <span className="text-xs text-slate-400">
                                    {lang === "en" ? "Unknown" : "ያልታወቀ"}
                                  </span>
                                </div>
                              );
                          }
                        })()}
                      </>
                    )}
                  </div>
                </li>
              )}
            </ul>
          </AccordionItem>
        ))}
      </Accordion>

      {/* FINAL EXAM BUTTON */}
      <div className="mt-6 mx-4 mb-4">
        <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {lang === "en" ? "Final Exam" : "የመጨረሻ ፈተና"}
          </h3>
          {!finalExamLocked ? (
            <button
              onClick={() =>
                router.push(`/${lang}/mycourse/${courseId}/finalexam`)
              }
              className="px-4 py-2 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              {examStatus === "done"
                ? lang === "en"
                  ? "Review Exam"
                  : "ፈተናን ይገምግሙ"
                : examStatus === "partial"
                ? lang === "en"
                  ? "Continue Exam"
                  : "ፈተናን ይቀጥሉ"
                : lang === "en"
                ? "Start Exam"
                : "ፈተናን ይጀምሩ"}
            </button>
          ) : (
            <span className="text-sm text-amber-600 dark:text-amber-400">
              {lang === "en" ? "Locked" : "ተቆልፏል"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------- MAIN PAGE ----------------
export default function Page() {
  const params = useParams<{ lang: string; id: string }>();
  const searchParams = useSearchParams();
  const lang = params?.lang || "en";
  const courseId = params?.id || "";
  const { data: session } = useSession();
  const studentId = (session?.user as any)?.id;

  // Get video query parameter
  const videoParam = searchParams?.get("video");

  const { data, loading } = useData({
    func: getMySingleCourse,
    args: [studentId, courseId],
  });

  const { data: contentData, loading: contentLoading } = useData({
    func: getMySingleCourseContent,
    args: [studentId, courseId],
  });

  const { data: locks } = useData({
    func: unlockTheFinalExamAndQuiz,
    args: [courseId],
  });

  const { data: examStatus } = useData({
    func: getFinalExamStatus,
    args: [courseId],
  });

  const finalExamLocked = Boolean((locks as any)?.finalExamLocked);

  // Use Zustand store for progress tracking
  const {
    currentVideo,
    setCurrentVideo,
    completedSubActivities,
    markSubActivityComplete,
    setSubActivityProgress,
    setOverallProgress,
  } = useStudentProgressStore();

  // Local UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [hasAutoCompleted, setHasAutoCompleted] = useState<Set<string>>(
    new Set()
  );
  const [forceOpenSectionIndex, setForceOpenSectionIndex] = useState<
    number | null
  >(null);

  useEffect(() => {
    if (data?.video) {
      setCurrentVideo({
        url: data.video,
        title: lang === "en" ? data.titleEn : data.titleAm,
        subActivityId: "", // Introduction video doesn't have subActivityId
        thumbnail: data.thumbnail || "",
      });
    }
  }, [data, lang, setCurrentVideo]);

  // Initialize completed sub-activities from content data
  useEffect(() => {
    if (contentData?.progress?.subActivityProgress) {
      setSubActivityProgress(contentData.progress.subActivityProgress);
    }
    if (contentData?.progress?.percentage) {
      setOverallProgress(contentData.progress.percentage);
    }
  }, [contentData, setSubActivityProgress, setOverallProgress]);

  // Handle query parameter for video selection
  useEffect(() => {
    if (!contentData || !data) return;

    // Find the first in-progress video (first non-completed video after some completed ones)
    const findInProgressVideo = () => {
      if (!contentData?.activity) return null;

      let hasCompletedAny = false;

      // Find the first non-completed video after we've seen at least one completed video
      for (const activity of contentData.activity) {
        for (const sub of activity.subActivity) {
          const isCompleted =
            contentData?.progress?.subActivityProgress?.[sub.id] === true;

          if (isCompleted) {
            hasCompletedAny = true;
          }

          // If we've completed some videos and found a non-completed one, that's our in-progress video
          if (hasCompletedAny && !isCompleted && sub.id) {
            return {
              video: sub,
              activityIndex: contentData.activity.indexOf(activity),
            };
          }
        }
      }

      // If no in-progress video found, return null (all completed or none started)
      return null;
    };

    if (videoParam === "intro" && data?.video) {
      // Open intro video
      setCurrentVideo({
        url: data.video,
        title: lang === "en" ? data.titleEn : data.titleAm,
        subActivityId: "", // Introduction video has no subActivityId
        thumbnail: data.thumbnail || "",
      });
    } else if (videoParam === "inprogress") {
      // Find and open in-progress video
      const inProgressVideo = findInProgressVideo();

      if (inProgressVideo) {
        setCurrentVideo({
          url: inProgressVideo.video.video,
          title:
            lang === "en"
              ? inProgressVideo.video.titleEn
              : inProgressVideo.video.titleAm,
          subActivityId: inProgressVideo.video.id,
          thumbnail: inProgressVideo.video.thumbnail || "",
        });
        // Force open the accordion section containing the in-progress video
        console.log(
          "🔄 Setting forceOpenSectionIndex to:",
          inProgressVideo.activityIndex
        );
        setForceOpenSectionIndex(inProgressVideo.activityIndex);
        // Reset after a longer delay to ensure accordion opens
        setTimeout(() => {
          console.log("🔄 Resetting forceOpenSectionIndex");
          setForceOpenSectionIndex(null);
        }, 2000);
      } else if (data?.video) {
        // Fallback to intro if no in-progress video found
        setCurrentVideo({
          url: data.video,
          title: lang === "en" ? data.titleEn : data.titleAm,
          subActivityId: "",
          thumbnail: data.thumbnail || "",
        });
        setForceOpenSectionIndex(null);
      }
    }
    // If no video param, default behavior (intro video) is handled by the other useEffect
  }, [videoParam, contentData, data, lang, setCurrentVideo]);

  const handleSelectVideo = (
    videoUrl: string,
    videoTitle: string,
    subActivityId?: string,
    thumbnail?: string
  ) => {
    setCurrentVideo({
      url: videoUrl,
      title: videoTitle,
      subActivityId: subActivityId || "",
      thumbnail: thumbnail || "",
    });
    setIsSidebarOpen(false);
  };

  // Auto-complete when video reaches 90% or ends
  const handleVideoProgress = (progress: number) => {
    // Auto-complete if video reaches 90% and not already completed
    if (
      progress >= 90 &&
      currentVideo &&
      currentVideo.subActivityId &&
      !isCurrentCompleted &&
      !hasAutoCompleted.has(currentVideo.subActivityId) &&
      !isCompleting
    ) {
      setHasAutoCompleted(
        new Set([...hasAutoCompleted, currentVideo.subActivityId])
      );
      handleComplete();
    }
  };

  const handleVideoEnd = () => {
    // Auto-complete on video end if not already completed
    if (
      currentVideo &&
      currentVideo.subActivityId &&
      !isCurrentCompleted &&
      !hasAutoCompleted.has(currentVideo.subActivityId) &&
      !isCompleting
    ) {
      setHasAutoCompleted(
        new Set([...hasAutoCompleted, currentVideo.subActivityId])
      );
      handleComplete();
    }
  };

  const handleComplete = async () => {
    if (!currentVideo || !currentVideo.subActivityId || isCompleting) return;

    setIsCompleting(true);
    try {
      const result = await completeSubActivity(currentVideo.subActivityId);
      if (result?.status) {
        // Update store with completion
        markSubActivityComplete(currentVideo.subActivityId);

        // Find which section contains this video to keep accordion open
        if (contentData?.activity && currentVideo.subActivityId) {
          const sectionIndex = contentData.activity.findIndex((activity: any) =>
            activity.subActivity.some(
              (sub: any) => sub.id === currentVideo.subActivityId
            )
          );
          if (sectionIndex !== -1) {
            setForceOpenSectionIndex(sectionIndex);
          }
        }

        // Refresh content data to get updated progress
        // Use router refresh instead of full page reload for better UX
        window.location.reload();
      }
    } catch (error) {
      console.error("Error completing sub-activity:", error);
    } finally {
      setIsCompleting(false);
    }
  };

  // Check if current sub-activity is completed
  const isCurrentCompleted =
    !!currentVideo &&
    !!currentVideo.subActivityId &&
    completedSubActivities.has(currentVideo.subActivityId);

  return (
    <div className="fixed inset-0 top-16 overflow-hidden">
      <div
        className={`h-full overflow-hidden grid bg-gradient-to-br from-gray-50 via-gray-50/50 to-white dark:from-gray-950 dark:via-gray-900/50 dark:to-gray-900 ${
          loading ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
            <Loading />
          </div>
        )}
        {data && (
          <>
            {/* MAIN CONTENT AREA - Scrollable and responsive to right sidebar */}
            <div className="overflow-hidden sm:overflow-auto lg:pr-[340px] transition-all duration-300 grid grid-rows-[auto_1fr]">
              {/* VIDEO PLAYER SECTION */}
              <div className="flex-shrink-0 bg-black dark:bg-black w-full mx-auto lg:max-w-none">
                {currentVideo && currentVideo.url && (
                  <div className="relative w-full">
                    <div className="relative w-full aspect-video bg-black">
                      <Player
                        src={currentVideo.url}
                        type="local"
                        title={currentVideo.title}
                        poster={currentVideo.thumbnail} // Pass thumbnail as poster
                        onVideoProgress={handleVideoProgress}
                        onVideoEnd={handleVideoEnd}
                      />
                    </div>
                  </div>
                )}

                {/* Complete Button - Only show for sub-activities (not introduction video) */}
                {currentVideo && currentVideo.subActivityId && (
                  <div className="bg-white dark:bg-gray-900 px-4 py-4 flex justify-end items-center">
                    <button
                      onClick={handleComplete}
                      disabled={isCompleting || isCurrentCompleted}
                      className={`px-6 py-3 rounded-lg font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${
                        isCurrentCompleted
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-blue-600 hover:bg-blue-700"
                      }`}
                    >
                      {isCompleting ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>
                            {lang === "en" ? "Completing..." : "በመጠናቀቅ ላይ..."}
                          </span>
                        </div>
                      ) : isCurrentCompleted ? (
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-5 h-5" />
                          <span>{lang === "en" ? "Completed" : "ተጠናቋል"}</span>
                        </div>
                      ) : (
                        <span>{lang === "en" ? "Complete" : "ጨርስ"}</span>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* COURSE CONTENT & TABS */}
              <div className="relative bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm pb-2 flex-1 flex flex-col overflow-hidden sm:overflow-visible">
                <div className="w-full mx-auto sm:px-6 lg:px-8 sm:py-6 lg:py-8 h-full flex flex-col overflow-hidden sm:overflow-visible">
                  {/* Mobile Tab Navigation with Horizontal Scroll */}
                  <Tabs
                    defaultValue="content"
                    className="h-full flex flex-col sm:h-auto"
                  >
                    {/* Content Tabs Below Player */}
                    <div className="bg-white dark:bg-gray-900 flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
                      <div className="overflow-x-auto scrollbar-hide scroll-smooth">
                        <TabsList className="flex space-x-4 bg-transparent p-0 min-w-max h-12 px-4">
                          <TabsTrigger
                            value="content"
                            className="text-sm font-medium px-4 py-3 bg-transparent border-none rounded-none data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:font-semibold data-[state=inactive]:text-gray-500 transition-all duration-200 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 whitespace-nowrap h-full lg:hidden flex items-center"
                          >
                            {lang === "en" ? "Course Content" : "የትምህርት ይዘት"}
                          </TabsTrigger>
                          <TabsTrigger
                            value="qa"
                            className="text-sm font-medium px-4 py-3 bg-transparent border-none rounded-none data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:font-semibold data-[state=inactive]:text-gray-500 transition-all duration-200 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 whitespace-nowrap h-full flex items-center"
                          >
                            {lang === "en" ? "Q&A" : "ጥያቄ እና መልስ"}
                          </TabsTrigger>
                          <TabsTrigger
                            value="ai"
                            className="text-sm font-medium px-4 py-3 bg-transparent border-none rounded-none data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:font-semibold data-[state=inactive]:text-gray-500 transition-all duration-200 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 whitespace-nowrap h-full flex items-center"
                          >
                            {lang === "en" ? "AI Assistant" : "AI ረዳት"}
                          </TabsTrigger>
                          <TabsTrigger
                            value="announcements"
                            className="text-sm font-medium px-4 py-3 bg-transparent border-none rounded-none data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:font-semibold data-[state=inactive]:text-gray-500 transition-all duration-200 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 whitespace-nowrap h-full flex items-center"
                          >
                            {lang === "en" ? "Announcements" : "ማሳወቂያዎች"}
                          </TabsTrigger>
                          <TabsTrigger
                            value="feedback"
                            className="text-sm font-medium px-4 py-3 bg-transparent border-none rounded-none data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-red-600 data-[state=active]:font-semibold data-[state=inactive]:text-gray-500 transition-all duration-200 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 whitespace-nowrap h-full flex items-center"
                          >
                            {lang === "en" ? "Feedback" : "ግብረመልስ"}
                          </TabsTrigger>
                          <TabsTrigger
                            value="materials"
                            className="text-sm font-medium px-4 py-3 bg-transparent border-none rounded-none data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:font-semibold data-[state=inactive]:text-gray-500 transition-all duration-200 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 whitespace-nowrap h-full flex items-center"
                          >
                            {lang === "en" ? "Materials" : "ቅረጾች"}
                          </TabsTrigger>
                        </TabsList>
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto sm:overflow-visible">
                      <div className="sm:px-4 sm:py-2">
                        <TabsContent value="content" className="mt-0 lg:hidden">
                          <CourseContent
                            contentData={contentData ?? null}
                            contentLoading={contentLoading}
                            onSelectVideo={handleSelectVideo}
                            lang={lang}
                            currentVideoUrl={currentVideo?.url || ""}
                            currentVideoFromStore={currentVideo}
                            courseId={courseId}
                            finalExamLocked={finalExamLocked}
                            examStatus={examStatus || "not-done"}
                            forceOpenSectionIndex={forceOpenSectionIndex}
                          />
                        </TabsContent>
                        <TabsContent value="qa" className="mt-0">
                          <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20 rounded-lg border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
                            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-gray-700 p-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg flex-shrink-0">
                                  <MessageCircle className="w-5 h-5 text-white" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    {lang === "en"
                                      ? "Questions & Answers"
                                      : "ጥያቄዎች እና መልሶች"}
                                  </h2>
                                </div>
                              </div>
                            </div>
                            <div className="p-4">
                              <TraditionalQA courseId={courseId} lang={lang} />
                            </div>
                          </div>
                        </TabsContent>
                        <TabsContent value="ai" className="mt-0">
                          <div className="rounded-lg border border-purple-200 dark:border-gray-700 shadow-sm overflow-hidden">
                            <div className="p-2">
                              <ChatComponent courseId={courseId} />
                            </div>
                          </div>
                        </TabsContent>
                        <TabsContent value="announcements" className="mt-0">
                          <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20 rounded-lg border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
                            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-gray-700 p-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg flex-shrink-0">
                                  <MessageCircle className="w-5 h-5 text-white" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    {lang === "en"
                                      ? "Course Announcements"
                                      : "የኮርስ ማሳወቂያዎች"}
                                  </h2>
                                </div>
                              </div>
                            </div>
                            <div className="p-4">
                              <CourseAnnouncements
                                courseId={courseId}
                                lang={lang}
                              />
                            </div>
                          </div>
                        </TabsContent>
                        <TabsContent value="feedback" className="mt-0">
                          <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20 rounded-lg border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
                            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-gray-700 p-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-lg flex-shrink-0">
                                  <MessageCircle className="w-5 h-5 text-white" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h2 className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                    {lang === "en"
                                      ? "Course Feedback"
                                      : "የኮርስ ግብረመልስ"}
                                  </h2>
                                </div>
                              </div>
                            </div>
                            <div className="p-4">
                              <CourseFeedback courseId={courseId} lang={lang} />
                            </div>
                          </div>
                        </TabsContent>
                        <TabsContent value="materials" className="mt-0">
                          <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20 rounded-lg border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
                            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-gray-700 p-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow-lg flex-shrink-0">
                                  <MessageCircle className="w-5 h-5 text-white" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                    {lang === "en"
                                      ? "Course Materials"
                                      : "የኮርስ ቅረጾች"}
                                  </h2>
                                </div>
                              </div>
                            </div>
                            <div className="p-4">
                              <CourseMaterials
                                courseId={courseId}
                                lang={lang}
                              />
                            </div>
                          </div>
                        </TabsContent>
                      </div>
                    </div>
                  </Tabs>
                </div>
              </div>
            </div>

            {/* SIDEBAR - DESKTOP LAYOUT (Fixed Right) - Udemy-like width */}
            <aside className="hidden lg:block fixed right-0 top-16 bottom-0 w-[340px] z-30">
              <div className="h-full flex flex-col border-l border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 shadow-xl">
                {/* Fixed Header */}
                <div className="flex-shrink-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700/50 px-5 py-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">
                        {lang === "en" ? "Course Content" : "የኮርስ ይዘት"}
                      </h2>
                    </div>
                  </div>
                </div>

                {/* Progress Section */}
                <div className="flex-shrink-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700/50 px-5 py-3 shadow-sm">
                  <div className="space-y-3">
                    {/* Overall Course Progress */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span className="font-medium">
                          {lang === "en" ? "Course Progress" : "የኮርስ እድገት"}
                        </span>
                        <span className="font-semibold text-primary-600 dark:text-primary-400">
                          {contentData?.progress?.percentage || 0}%
                        </span>
                      </div>
                      {contentData?.progress && (
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${contentData.progress.percentage || 0}%`,
                            }}
                          />
                        </div>
                      )}
                      {contentData?.progress && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {contentData.progress.completed || 0} /{" "}
                          {contentData.progress.total || 0}{" "}
                          {lang === "en" ? "completed" : "ተጠናቋል"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 dark:hover:scrollbar-thumb-gray-500 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
                  <div className="px-2 py-3">
                    <CourseContent
                      contentData={contentData ?? null}
                      contentLoading={contentLoading}
                      onSelectVideo={handleSelectVideo}
                      lang={lang}
                      currentVideoUrl={currentVideo?.url || ""}
                      currentVideoFromStore={currentVideo}
                      courseId={courseId}
                      finalExamLocked={finalExamLocked}
                      examStatus={examStatus || "not-done"}
                      forceOpenSectionIndex={forceOpenSectionIndex}
                    />
                  </div>
                </div>
              </div>
            </aside>

            {/* SIDEBAR MODAL - MOBILE/TABLET (Professional) */}
            {isSidebarOpen && (
              <div className="fixed inset-0 z-50 lg:hidden">
                {/* Enhanced Backdrop */}
                <div
                  className="fixed inset-0 bg-black/70 backdrop-blur-md transition-all duration-300"
                  onClick={() => setIsSidebarOpen(false)}
                />

                {/* Enhanced Sidebar Container with Slide Animation */}
                <div className="fixed inset-y-0 right-0 w-full max-w-sm sm:max-w-md bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-out">
                  {/* Professional Header */}
                  <div className="sticky top-0 z-10 bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-500 dark:to-primary-400 px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl">
                          <PlayCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-white tracking-tight">
                            {lang === "en" ? "Course Content" : "የኮርስ ይዘት"}
                          </h2>
                          <p className="text-xs text-white/80 font-medium">
                            {lang === "en" ? "Select a lesson" : "ትምህርት ይምረጡ"}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-200 group"
                        aria-label="Close course content"
                      >
                        <X className="w-5 h-5 text-white group-hover:rotate-90 transition-transform duration-200" />
                      </button>
                    </div>
                  </div>

                  {/* Enhanced Content with Custom Scrollbar */}
                  <div className="h-[calc(100vh-72px)] overflow-y-auto bg-gray-50 dark:bg-gray-950 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
                    <div className="p-3">
                      <CourseContent
                        contentData={contentData ?? null}
                        contentLoading={contentLoading}
                        onSelectVideo={handleSelectVideo}
                        lang={lang}
                        currentVideoUrl={currentVideo?.url || ""}
                        currentVideoFromStore={currentVideo}
                        courseId={courseId}
                        finalExamLocked={finalExamLocked}
                        examStatus={examStatus || "not-done"}
                        forceOpenSectionIndex={forceOpenSectionIndex}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PROFESSIONAL FLOATING ACTION BUTTON - MOBILE/TABLET */}
          </>
        )}
      </div>
    </div>
  );
}
