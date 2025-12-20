"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  ChartBarIncreasing,
  ChartPie,
  Clock,
  Languages,
  Logs,
  MonitorSmartphone,
  ReceiptText,
} from "lucide-react";
import useData from "@/hooks/useData";
import { getCourse } from "@/actions/manager/course";
import CourseAbout from "@/components/courseAbout";
import CourseMainDescription from "@/components/courseMainDescription";
import CourseRequirement from "@/components/courseRequirement";
import CourseFor from "@/components/courseFor";
import CourseActivity from "@/components/courseActivity";
import CourseTopOverview from "@/components/courseTopOverview";
import { useGlobalLoading } from "@/stores/uiStore";

export default function Page() {
  const params = useParams<{ lang: string; id: string }>();
  const lang = params?.lang || "en";
  const id = params?.id ?? "",
    { data, loading } = useData({ func: getCourse, args: [id] });

  const globalLoading = useGlobalLoading();

  // Video player state for subactivity previews
  const [currentVideo, setCurrentVideo] = useState<string>("");
  const [currentThumbnail, setCurrentThumbnail] = useState<string>("");
  const [shouldAutoplay, setShouldAutoplay] = useState<boolean>(false);

  // Set initial video (main course video)
  useEffect(() => {
    if (data?.video) {
      setCurrentVideo(data.video);
      setCurrentThumbnail(data.thumbnail);
      // Don't autoplay on initial load
      setShouldAutoplay(false);
    }
  }, [data]);

  // Handle video selection from subactivities
  const handleSelectVideo = useCallback(
    (
      video: string,
      title: string,
      subActivityId?: string,
      thumbnail?: string
    ) => {
      setCurrentVideo(video);
      setCurrentThumbnail(thumbnail || "");
      setShouldAutoplay(true); // Enable autoplay when subactivity is selected
    },
    []
  );

  // Reset autoplay after video starts playing
  useEffect(() => {
    if (shouldAutoplay && currentVideo) {
      // Reset autoplay flag after a short delay to allow video to start
      const timer = setTimeout(() => {
        setShouldAutoplay(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [shouldAutoplay, currentVideo]);

  // Keep previous page visible while loading (TopLoadingBar will show progress)
  if (globalLoading || loading) return null;

  return (
    data && (
      <div className="h-full px-2 2xl:pl-20 md:pr-[20rem] 2xl:pr-[31.5rem] pb-20 flex flex-col gap-10 overflow-auto">
        <CourseTopOverview
          {...{
            title: lang == "en" ? data.titleEn : data.titleAm,
            by: `${data.instructor.firstName} ${data.instructor.fatherName} ${data.instructor.lastName}`,
            thumbnail: currentThumbnail || data.thumbnail,
            video: currentVideo || data.video,
            autoplay: shouldAutoplay,
          }}
        />
        <div className="p-4 rounded-xl border border-primary-500/30 space-y-10">
          <CourseAbout data={lang == "en" ? data.aboutEn : data.aboutAm} />
          <CourseMainDescription
            data={[
              {
                icon: <ChartBarIncreasing className="" />,
                label: lang == "en" ? "Level" : "ደረጃ",
                value: data.level,
              },
              {
                icon: <Languages className="" />,
                label: lang == "en" ? "Language" : "ቋንቋ",
                value: data.language,
              },
              {
                icon: <Clock className="" />,
                label: lang == "en" ? "Duration" : "ቆይታ",
                value:
                  data.duration || (lang == "en" ? "Not specified" : "አልተገለጸም"),
              },
              {
                icon: <Logs className="" />,
                label: lang == "en" ? "Activities" : "ተግባራት",
                value: data.activity.reduce(
                  (a, c) => a + c.subActivity.length,
                  0
                ),
              },
              {
                icon: <MonitorSmartphone className="" />,
                label: "",
                value: lang == "en" ? data.accessEn : data.accessAm,
              },
              ...(data.certificate
                ? [
                    {
                      icon: <ReceiptText className="" />,
                      label: "",
                      value:
                        lang == "en"
                          ? "Certificate of completion"
                          : "የማጠናቀቂያ የምስክር ወረቀት",
                    },
                  ]
                : []),
              {
                icon: <ChartPie className="" />,
                label: "Instructor Rate",
                value: `${data.instructorRate} %`,
              },
              {
                icon: <ChartPie className="" />,
                label: "Seller Rate",
                value: `${data.sellerRate} ETB`,
              },
              {
                icon: <ChartPie className="" />,
                label: "Affiliate Rate",
                value: `${data.affiliateRate} ETB`,
              },
            ]}
          />
          <CourseRequirement data={data.requirement} />
          <CourseFor data={data.courseFor} />
          <CourseActivity
            data={data.activity}
            onSelectVideo={handleSelectVideo}
            currentVideoUrl={currentVideo}
            allowAllSubactivities={true}
          />
        </div>
      </div>
    )
  );
}
