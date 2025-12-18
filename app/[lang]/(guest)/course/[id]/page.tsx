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
import NoData from "@/components/noData";
import CourseAbout from "@/components/courseAbout";
import CourseMainDescription from "@/components/courseMainDescription";
import CourseRequirement from "@/components/courseRequirement";
import CourseFor from "@/components/courseFor";
import CourseActivity from "@/components/courseActivity";
import CourseTopOverview from "@/components/courseTopOverview";
import { Button, useDisclosure } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useCourseDiscount } from "@/hooks/useCourseDiscount";
import PriceDisplay from "@/components/PriceDisplay";
import { DollarSign } from "lucide-react";

export default function Page() {
  const params = useParams<{ lang: string; id: string }>();
  const lang = params?.lang || "en";
  const id = params?.id ?? "",
    searchParams = useSearchParams(),
    { data, loading } = useData({ func: getCourseForCustomer, args: [id] }),
    { isOpen, onOpenChange } = useDisclosure();
  const router = useRouter();

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

  // Check if course is free (after discount)
  const isFree = discountedBirrPrice === 0 && discountedDolarPrice === 0;

  const loginRedirect = () => {
    // Redirect to login page with course ID and affiliate code
    const affiliateCode = searchParams?.get("code") || "";
    const redirectUrl = `/${lang}/login?redirect=${encodeURIComponent(
      `/${lang}/course/${id}`
    )}${affiliateCode ? `&code=${affiliateCode}` : ""}`;
    router.push(redirectUrl);
  };

  // Keep previous page visible while loading (TopLoadingBar will show progress)
  if (loading) {
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
                  onPress={isFree ? onOpenChange : loginRedirect}
                  variant="solid"
                  color={isFree ? "success" : "primary"}
                  className="w-full"
                >
                  {isFree
                    ? lang == "en"
                      ? "Start Free Course"
                      : "ነፃ ኮርስ ይጀምሩ"
                    : lang == "en"
                    ? "Enroll Now"
                    : "አሁን ይመዝግቡ"}
                </Button>
              }
              data={[
                {
                  icon: <DollarSign className="" />,
                  label: lang == "en" ? "Price" : "ዋጋ",
                  value: (
                    <PriceDisplay
                      courseId={id}
                      birrPrice={data.birrPrice || data.price}
                      dolarPrice={data.dolarPrice || data.price}
                      className="text-lg"
                    />
                  ),
                },
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
        </div>
      )}
    </div>
  );
}
