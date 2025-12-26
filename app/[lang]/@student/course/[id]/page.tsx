"use client";

// import "./youtube.css";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  ChartBarIncreasing,
  Clock,
  Languages,
  Logs,
  MonitorSmartphone,
  ReceiptText,
} from "lucide-react";
import Payment from "@/components/Payment";
import useData from "@/hooks/useData";
import { getCourseForCustomer, checkUserEnrollment } from "@/lib/data/course";
import { useGlobalLoading } from "@/stores/uiStore";
import NoData from "@/components/noData";
import CourseAbout from "@/components/courseAbout";
import CourseMainDescription from "@/components/courseMainDescription";
import CourseRequirement from "@/components/courseRequirement";
import CourseFor from "@/components/courseFor";
import CourseActivity from "@/components/courseActivity";
import CourseTopOverview from "@/components/courseTopOverview";
import { Button, useDisclosure } from "@heroui/react";
import { useCourseDiscount } from "@/hooks/useCourseDiscount";
import { enrollInFreeCourse } from "@/lib/action/freeCourse";
import useAction from "@/hooks/useAction";
import { useRouter } from "next/navigation";
import { getCurrentUserInfo } from "@/lib/action";

export default function Page() {
  const params = useParams<{ lang: string; id: string }>();
  const lang = params?.lang || "en";
  const id = params?.id ?? "";
  const searchParams = useSearchParams();
  const { data, loading } = useData({ func: getCourseForCustomer, args: [id] });
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const globalLoading = useGlobalLoading();
  
  // Video player state for free subactivities
  const [currentVideo, setCurrentVideo] = useState<string>("");
  const [currentThumbnail, setCurrentThumbnail] = useState<string>("");
  const [shouldAutoplay, setShouldAutoplay] = useState<boolean>(false);
  const videoPlayerRef = useRef<HTMLDivElement>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);

  // Check enrollment status when course data loads
  useEffect(() => {
    const checkEnrollment = async () => {
      if (!data?.id) return;

      try {
        const result = await getCurrentUserInfo();
        if (result.status && result.userId) {
          const enrolled = await checkUserEnrollment(result.userId, data.id);
          setIsEnrolled(enrolled);
        }
      } catch (error) {
        console.error("Error checking enrollment:", error);
      } finally {
        setCheckingEnrollment(false);
      }
    };

    checkEnrollment();
  }, [data?.id]);

  // Set initial video (always use main course video as introduction)
  useEffect(() => {
    if (data) {
      // Always use main course video as the introduction video on page load/refresh
      if (data.video) {
        setCurrentVideo(data.video);
        setCurrentThumbnail(data.thumbnail);
      }
      // Don't autoplay on initial load
      setShouldAutoplay(false);
    }
  }, [data]);
  
  // Handle video selection from free subactivities
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
      
      // Scroll to video player after a short delay to ensure DOM is updated
      setTimeout(() => {
        if (videoPlayerRef.current) {
          videoPlayerRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 100);
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

  // Get discount for the course
  const birrDiscount = useCourseDiscount(id, data?.birrPrice || 0);
  const dolarDiscount = useCourseDiscount(id, data?.dolarPrice || 0);

  // Calculate discounted prices
  const discountedBirrPrice = birrDiscount.hasDiscount
    ? birrDiscount.discountedPrice
    : data?.birrPrice || 0;
  const discountedDolarPrice = dolarDiscount.hasDiscount
    ? dolarDiscount.discountedPrice
    : data?.dolarPrice || 0;

  // Check if course is free
  const isFreeCourse = (discountedBirrPrice === 0 && discountedDolarPrice === 0) ||
    (data?.birrPrice === 0 && data?.dolarPrice === 0);

  const router = useRouter();
  const { action: enrollAction, isPending: isEnrolling } = useAction(
    enrollInFreeCourse,
    undefined,
    {
      loading: lang === "en" ? "Enrolling..." : "በመመዝገብ ላይ...",
      success: lang === "en" ? "Successfully enrolled" : "በተሳካ ሁኔታ ተመዝግቧል",
      error: lang === "en" ? "Failed to enroll" : "መመዝገብ አልተሳካም",
      onSuccess() {
        router.push(`/${lang}/mycourse/${id}`);
      },
    }
  );

  const handleEnroll = () => {
    if (isFreeCourse) {
      enrollAction({
        courseId: id,
        affiliateCode: searchParams?.get("code") || undefined,
      });
    } else {
      onOpen();
    }
  };

  // Keep previous page visible while loading (TopLoadingBar will show progress)
  if (globalLoading || loading) {
    return null;
  }

  return (
    <div className="h-dvh">
      {!data ? (
        <NoData />
      ) : (
        <div className="px-2 md:pl-4 lg:pl-6 xl:pl-8 pt-4 md:pt-6 pb-6 md:pr-[28rem] lg:pr-[32rem] h-full flex flex-col gap-6 md:gap-8 overflow-y-auto overflow-x-hidden smooth-">
          <div ref={videoPlayerRef}>
          <CourseTopOverview
            {...{
              title: lang == "en" ? data.titleEn : data.titleAm,
              by: `${data.instructor.firstName} ${data.instructor.fatherName}`,
                thumbnail: currentThumbnail || data.thumbnail,
                video: currentVideo || data.video,
                autoplay: shouldAutoplay,
            }}
          />
          </div>
          <div className="p-4 rounded-xl border border-primary-500/30 space-y-8">
            <CourseAbout data={lang == "en" ? data.aboutEn : data.aboutAm} />
            <CourseMainDescription
              btn={
                isEnrolled ? (
                  <Button
                    onPress={() => router.push(`/${lang}/mycourse/${id}`)}
                    variant="solid"
                    color="success"
                  >
                    {lang == "en" ? "Continue" : "ቀጥል"}
                  </Button>
                ) : (
                  <Button
                    onPress={handleEnroll}
                    variant="solid"
                    color="primary"
                    isLoading={isEnrolling}
                    isDisabled={isEnrolling || checkingEnrollment}
                  >
                    {checkingEnrollment
                      ? (lang == "en" ? "Loading..." : "በመጫን ላይ...")
                      : lang == "en" ? "Enroll" : "ይመዝገቡ"}
                  </Button>
                )
              }
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
                    data.duration ||
                    (lang == "en" ? "Not specified" : "አልተገለጸም"),
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
              ]}
            />
            <CourseRequirement data={data.requirement} />
            <CourseFor data={data.courseFor} />
            <CourseActivity
              data={data.activity}
              onSelectVideo={handleSelectVideo}
              currentVideoUrl={currentVideo}
            />
          </div>
          {!isFreeCourse && (
            <Payment
              isOpen={isOpen}
              id={data.id}
              onOpenChange={onOpenChange}
              affiliateCode={searchParams?.get("code") || ""}
              title={lang == "en" ? data.titleEn : data.titleAm}
              price={data.price}
              birrPrice={discountedBirrPrice}
              dolarPrice={discountedDolarPrice}
              originalBirrPrice={data.birrPrice ?? undefined}
              originalDolarPrice={data.dolarPrice ?? undefined}
            />
          )}
        </div>
      )}
    </div>
  );
}
