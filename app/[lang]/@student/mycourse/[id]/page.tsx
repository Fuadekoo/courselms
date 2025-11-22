/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
import NoData from "@/components/noData";
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
}) {
  const router = useRouter();
  const [activityQuizStatuses, setActivityQuizStatuses] = useState<
    Record<string, string>
  >({});
  const [statusesLoading, setStatusesLoading] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

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

  // Update expanded section with professional priority logic
  useEffect(() => {
    if (!contentData?.activity || contentData.activity.length === 0) return;

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
    const currentVideoSectionIndex = contentData.activity.findIndex(
      (activity: any) =>
        activity.subActivity.some((sub: any) => sub.video === currentVideoUrl)
    );

    if (currentVideoSectionIndex !== -1) {
      console.log(
        "✅ Priority 1: Opening section with current video URL:",
        currentVideoSectionIndex
      );
      setExpandedKeys(new Set([String(currentVideoSectionIndex)]));
      return;
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
          lastAccessedSectionIndex
        );
        setExpandedKeys(new Set([String(lastAccessedSectionIndex)]));
        return;
      }
    }

    // Priority 3: In-progress section (partially completed OR has current video that's not completed)
    // Find all sections with partial progress or active video
    const inProgressSections = contentData.activity
      .map((activity: any, index: number) => {
        const completedCount = activity.subActivity.filter(
          (sub: any) =>
            contentData?.progress?.subActivityProgress?.[sub.id] === true
        ).length;

        const totalCount = activity.subActivity.length;

        // Check if this section contains a video being watched but not completed
        const hasActiveIncompleteVideo = currentVideoFromStore?.subActivityId
          ? activity.subActivity.some((sub: any) => {
              const isThisVideo =
                sub.id === currentVideoFromStore.subActivityId;
              const isNotCompleted =
                contentData?.progress?.subActivityProgress?.[sub.id] !== true;
              return isThisVideo && isNotCompleted;
            })
          : false;

        // Calculate completion percentage for sorting
        const completionPercentage = (completedCount / totalCount) * 100;

        console.log(`📊 Section ${index} analysis:`, {
          completedCount,
          totalCount,
          hasActiveIncompleteVideo,
          isInProgress:
            (completedCount > 0 && completedCount < totalCount) ||
            hasActiveIncompleteVideo,
          subActivitiesIds: activity.subActivity.map((s: any) => s.id),
          currentVideoSubActivityId: currentVideoFromStore?.subActivityId,
        });

        // Section is in-progress if:
        // 1. Has some completed but not all, OR
        // 2. Has a video being watched that's not completed yet
        if (
          (completedCount > 0 && completedCount < totalCount) ||
          hasActiveIncompleteVideo
        ) {
          return {
            index,
            completionPercentage,
            completedCount,
            hasActiveVideo: hasActiveIncompleteVideo,
          };
        }
        return null;
      })
      .filter(
        (
          item: {
            index: number;
            completionPercentage: number;
            completedCount: number;
            hasActiveVideo: boolean;
          } | null
        ): item is {
          index: number;
          completionPercentage: number;
          completedCount: number;
          hasActiveVideo: boolean;
        } => item !== null
      );

    // Prioritize sections with active videos, then earliest incomplete
    console.log("🔍 In-progress sections found:", inProgressSections);

    if (inProgressSections.length > 0) {
      const sectionWithActiveVideo = inProgressSections.find(
        (section: {
          index: number;
          completionPercentage: number;
          completedCount: number;
          hasActiveVideo: boolean;
        }) => section.hasActiveVideo
      );
      const targetSection = sectionWithActiveVideo || inProgressSections[0];
      console.log("✅ Priority 3: Opening in-progress section:", {
        sectionIndex: targetSection.index,
        hasActiveVideo: targetSection.hasActiveVideo,
        completedCount: targetSection.completedCount,
        allInProgressSections: inProgressSections,
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
  }, [currentVideoUrl, contentData, currentVideoFromStore]);

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

  return (
    <div className="flex flex-col overflow-auto  ">
      <Accordion
        selectionMode="single"
        selectedKeys={expandedKeys}
        onSelectionChange={(keys) => setExpandedKeys(keys as Set<string>)}
      >
        {contentData.activity.map((activity: any, index: number) => (
          <AccordionItem
            key={activity.id || index}
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
                    onClick={() =>
                      onSelectVideo(
                        sub.video,
                        lang === "en" ? sub.titleEn : sub.titleAm,
                        sub.id,
                        sub.thumbnail || undefined
                      )
                    }
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
  const lang = params?.lang || "en";
  const courseId = params?.id || "";
  const { data: session } = useSession();
  const studentId = (session?.user as any)?.id;

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
        // Refresh content data to get updated progress
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
      {loading ? (
        <Loading />
      ) : !data ? (
        <NoData />
      ) : (
        <div className="h-full overflow-hidden grid bg-gradient-to-br from-gray-50 via-gray-50/50 to-white dark:from-gray-950 dark:via-gray-900/50 dark:to-gray-900">
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
                  defaultValue="qa"
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
                            <CourseMaterials courseId={courseId} lang={lang} />
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
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PROFESSIONAL FLOATING ACTION BUTTON - MOBILE/TABLET */}
        </div>
      )}
    </div>
  );
}
