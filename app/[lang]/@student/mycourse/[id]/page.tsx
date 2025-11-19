/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  PlayCircle,
  CheckCircle2,
  Sparkles,
  X,
  ShieldAlert,
  Trophy,
  Lock,
  Circle,
  MessageCircle,
} from "lucide-react";
import { Accordion, AccordionItem, Skeleton } from "@heroui/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import useData from "@/hooks/useData";
import {
  getMySingleCourse,
  getMySingleCourseContent,
  unlockTheFinalExamAndQuiz,
  getFinalExamStatus,
  getActivityQuizStatus,
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
import { useSidebar } from "@/components/context/sidebar";

// ---------------- COURSE CONTENT COMPONENT ----------------
function CourseContent({
  contentData,
  contentLoading,
  onSelectVideo,
  lang,
  currentVideoUrl,
  courseId,
  finalExamLocked,
  examStatus,
}: {
  contentData: any;
  contentLoading: boolean;
  onSelectVideo: (url: string, title: string, subActivityId?: string, thumbnail?: string) => void;
  lang: string;
  currentVideoUrl: string;
  courseId: string;
  finalExamLocked: boolean;
  examStatus: string;
}) {
  const router = useRouter();
  const [activityQuizStatuses, setActivityQuizStatuses] = useState<
    Record<string, string>
  >({});
  const [statusesLoading, setStatusesLoading] = useState(false);

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

  if (contentLoading) {
    return (
      <div className="w-full p-4 space-y-4 pt-16">
        <Skeleton className="h-8 w-3/4 mb-4" />
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
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
      {/* INTRODUCTION */}
      <div
        className="px-4 py-2 cursor-pointer hover:bg-primary-100 rounded-lg m-2"
        onClick={() =>
          onSelectVideo(
            contentData.video,
            lang === "en" ? contentData.titleEn : contentData.titleAm,
            "" // Introduction video
          )
        }
      >
        <h3 className="font-semibold text-lg mb-2">Introduction</h3>
        <div className="flex items-center gap-3">
          <PlayCircle
            className={
              currentVideoUrl === contentData.video
                ? "text-primary"
                : "text-gray-400"
            }
          />
          <span
            className={currentVideoUrl === contentData.video ? "font-bold" : ""}
          >
            {lang === "en" ? contentData.titleEn : contentData.titleAm}
          </span>
        </div>
      </div>

      {/* SECTIONS */}
      <div className="px-4 py-2 flex items-center justify-between">
        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {lang === "en" ? "Course Sections" : "የኮርስ ክፍሎች"}
        </h4>
        <button
          onClick={() => {
            setStatusesLoading(true);
            contentData?.activity?.forEach((activity: any) => {
              refreshActivityQuizStatus(activity.id);
            });
            setTimeout(() => setStatusesLoading(false), 1000);
          }}
          disabled={statusesLoading}
          className="text-xs px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          {statusesLoading ? (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border border-slate-400 border-t-purple-500 rounded-full animate-spin" />
              <span>{lang === "en" ? "Updating..." : "በመዘመን ላይ..."}</span>
            </div>
          ) : lang === "en" ? (
            "Refresh Status"
          ) : (
            "ሁኔታ አድስ"
          )}
        </button>
      </div>

      <Accordion selectionMode="multiple" defaultExpandedKeys={["0"]}>
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
            <ul className="space-y-1 p-2">
              {activity.subActivity.map((sub: any) => {
                const isActive = sub.video === currentVideoUrl;
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
                      <div className="flex-shrink-0 w-16 h-10 rounded overflow-hidden bg-gray-200">
                        <img
                          src={sub.thumbnail}
                          alt={lang === "en" ? sub.titleEn : sub.titleAm}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-16 h-10 rounded bg-gray-200 flex items-center justify-center">
                        {isActive ? (
                          <PlayCircle className="text-primary w-5 h-5" />
                        ) : (
                          <CheckCircle2 className="text-gray-400 w-5 h-5" />
                        )}
                      </div>
                    )}
                    <span className="break-words overflow-wrap-anywhere flex-1">
                      {lang === "en" ? sub.titleEn : sub.titleAm}
                    </span>
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
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 shadow-lg">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 via-purple-500/10 to-emerald-500/10 dark:from-sky-400/10 dark:via-purple-400/10 dark:to-emerald-400/10" />

          <div className="relative p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`relative w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                    finalExamLocked
                      ? "bg-gradient-to-br from-amber-400 to-orange-500"
                      : "bg-gradient-to-br from-emerald-400 to-teal-500"
                  }`}
                >
                  {finalExamLocked ? (
                    <Lock className="w-7 h-7 text-white" />
                  ) : (
                    <Trophy className="w-7 h-7 text-white" />
                  )}
                  {/* Shine effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/30 to-transparent" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">
                    {lang === "en" ? "Final Exam" : "የመጨረሻ ፈተና"}
                  </h3>
                  {/* <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {finalExamLocked
                      ? lang === "en"
                        ? "Complete all activities to unlock"
                        : "ሁሉንም እንቅስቃሴዎች ይ桀ርሱ"
                      : examStatus === "done"
                      ? lang === "en"
                        ? "Exam completed successfully"
                        : "ፈተናው በተሳካ ሁኔታ ተጠናቋል"
                      : examStatus === "partial"
                      ? lang === "en"
                        ? "Resume your exam"
                        : "ፈተናዎን ይቀጥሉ"
                      : lang === "en"
                      ? "Test your knowledge"
                      : "እውቀትዎን ይሞክሩ"}
                  </p> */}

                  {/* Progress indicator for exam status */}
                  {!finalExamLocked && (
                    <div className="flex items-center gap-2 mt-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          examStatus === "done"
                            ? "bg-emerald-500"
                            : examStatus === "partial"
                            ? "bg-amber-500"
                            : "bg-slate-300"
                        }`}
                      />
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {examStatus === "done"
                          ? lang === "en"
                            ? "Completed"
                            : "ተጠናቋል"
                          : examStatus === "partial"
                          ? lang === "en"
                            ? "In Progress"
                            : "በሂደት ላይ"
                          : lang === "en"
                          ? "Not Started"
                          : "አልተጀመረም"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                {!finalExamLocked ? (
                  <button
                    onClick={() =>
                      router.push(`/${lang}/mycourse/${courseId}/finalexam`)
                    }
                    className="group relative px-6 py-3 rounded-xl font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 active:scale-95 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500"
                  >
                    {/* Button shine effect */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <span className="relative flex items-center gap-2">
                      {examStatus === "done" ? (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          {lang === "en" ? "Review Exam" : "ፈተናን ይገምግሙ"}
                        </>
                      ) : examStatus === "partial" ? (
                        <>
                          <PlayCircle className="w-5 h-5" />
                          {lang === "en" ? "Continue Exam" : "ፈተናን ይቀጥሉ"}
                        </>
                      ) : (
                        <>
                          <Trophy className="w-5 h-5" />
                          {lang === "en" ? "Start Exam" : "ፈተናን ይጀምሩ"}
                        </>
                      )}
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
                    <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                      {lang === "en" ? "Locked" : "ተቆልፏል"}
                    </span>
                  </div>
                )}

                {/* Small info text */}
                {/* <p className="text-xs text-slate-500 dark:text-slate-400 text-right max-w-32">
                  {lang === "en"
                    ? "Certification available"
                    : "የምስክር ወረቀት ይገኛል"}
                </p> */}
              </div>
            </div>
          </div>
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
  const { isCollapsed } = useSidebar();

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

  const [currentVideo, setCurrentVideo] = useState({
    url: "",
    title: "",
    subActivityId: "",
    thumbnail: "",
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (data?.video) {
      setCurrentVideo({
        url: data.video,
        title: lang === "en" ? data.titleEn : data.titleAm,
        subActivityId: "", // Introduction video doesn't have subActivityId
        thumbnail: data.thumbnail || "",
      });
    }
  }, [data, lang]);

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

  return (
    <div className="fixed inset-0 top-16 overflow-hidden">
      {loading ? (
        <Loading />
      ) : !data ? (
        <NoData />
      ) : (
        <div className="h-full overflow-hidden grid bg-gradient-to-br from-gray-50 via-gray-50/50 to-white dark:from-gray-950 dark:via-gray-900/50 dark:to-gray-900">
          {/* MAIN CONTENT AREA - Scrollable and responsive to both sidebars */}
          <div
            className={`overflow-hidden sm:overflow-auto lg:pr-[340px] transition-all duration-300 ${
              isCollapsed ? "md:ml-20" : "md:ml-72"
            } grid grid-rows-[auto_1fr] `}
          >
            {/* VIDEO PLAYER SECTION */}
            <div className="flex-shrink-0 bg-black dark:bg-black w-full mx-auto lg:max-w-none">
              {currentVideo.url && (
                <div className="relative w-full">
                  <div className="relative w-full aspect-video bg-black">
                    {currentVideo.thumbnail && (
                      <div 
                        className="absolute inset-0 z-[5] pointer-events-none subactivity-thumbnail-overlay transition-opacity duration-300"
                        id="subactivity-thumbnail-overlay"
                      >
                        <img
                          src={currentVideo.thumbnail}
                          alt={currentVideo.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="relative z-10">
                      <Player 
                        src={currentVideo.url} 
                        type="local"
                        onVideoPlay={() => {
                          // Hide thumbnail when video starts playing
                          const overlay = document.getElementById('subactivity-thumbnail-overlay');
                          if (overlay) {
                            overlay.style.opacity = "0";
                          }
                        }}
                        onVideoPause={() => {
                          // Show thumbnail when video is paused (if it exists)
                          if (currentVideo.thumbnail) {
                            const overlay = document.getElementById('subactivity-thumbnail-overlay');
                            if (overlay) {
                              overlay.style.opacity = "1";
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
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
                          currentVideoUrl={currentVideo.url}
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
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 dark:from-primary-400 dark:via-primary-500 dark:to-primary-600 rounded-xl shadow-lg">
                    <PlayCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">
                      {lang === "en" ? "Course Content" : "የኮርስ ይዘት"}
                    </h2>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                      {lang === "en"
                        ? "Select a lesson to continue"
                        : "ትምህርት ለመቀጠል ይምረጡ"}
                    </p>
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
                    currentVideoUrl={currentVideo.url}
                    courseId={courseId}
                    finalExamLocked={finalExamLocked}
                    examStatus={examStatus || "not-done"}
                  />
                </div>
              </div>

              {/* Fixed Progress Footer */}
              <div className="flex-shrink-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700/50 px-5 py-3 shadow-sm">
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-medium">
                    {lang === "en" ? "Your Progress" : "እድገትዎ"}
                  </span>
                  <span className="font-semibold text-primary-600 dark:text-primary-400">
                    {/* Progress percentage can be calculated here */}
                    0%
                  </span>
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
                      currentVideoUrl={currentVideo.url}
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
