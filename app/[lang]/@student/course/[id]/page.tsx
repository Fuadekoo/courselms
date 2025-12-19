"use client";

// import "./youtube.css";
import React from "react";
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
import { getCourseForCustomer } from "@/lib/data/course";
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

export default function Page() {
  const params = useParams<{ lang: string; id: string }>();
  const lang = params?.lang || "en";
  const id = params?.id ?? "",
    searchParams = useSearchParams(),
    { data, loading } = useData({ func: getCourseForCustomer, args: [id] }),
    { isOpen, onOpen, onOpenChange } = useDisclosure();
  const globalLoading = useGlobalLoading();

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
          <CourseTopOverview
            {...{
              title: lang == "en" ? data.titleEn : data.titleAm,
              by: `${data.instructor.firstName} ${data.instructor.fatherName}`,
              thumbnail: data.thumbnail,
              video: data.video,
            }}
          />
          <div className="p-4 rounded-xl border border-primary-500/30 space-y-8">
            <CourseAbout data={lang == "en" ? data.aboutEn : data.aboutAm} />
            <CourseMainDescription
              btn={
                <Button 
                  onPress={handleEnroll} 
                  variant="solid" 
                  color="primary"
                  isLoading={isEnrolling}
                  isDisabled={isEnrolling}
                >
                  {lang == "en" ? "Enroll" : "ይመዝገቡ"}
                </Button>
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
            <CourseActivity data={data.activity} />
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
              originalBirrPrice={data.birrPrice}
              originalDolarPrice={data.dolarPrice}
            />
          )}
        </div>
      )}
    </div>
  );
}
