"use client";

import { cn } from "@heroui/react";
import { Course, User } from "@prisma/client";
import { ChartBarIncreasing, Clock, Logs, Play } from "lucide-react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

export default function CourseCardAffiliate({
  id,
  titleEn,
  titleAm,
  instructor,
  aboutEn,
  aboutAm,
  thumbnail,
  level,
  duration,
  _count: { activity },
  price,
  btn,
  titleLink,
}: Omit<
  Course,
  | "video"
  | "currency"
  | "language"
  | "access"
  | "certificate"
  | "instructorRate"
  | "sellerRate"
  | "affiliateRate"
  | "price"
> & {
  price: number;
  instructor: Pick<User, "firstName" | "fatherName">;
  _count: { activity: number };
  btn: React.ReactNode;
  titleLink?: string;
}) {
  const searchParams = useSearchParams();
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";

  return (
    <div className="h-full relative bg-background dark:bg-background/95 rounded-xl overflow-hidden flex flex-col border border-divider dark:border-white/10 shadow-lg dark:shadow-2xl dark:shadow-black/20 hover:shadow-xl dark:hover:shadow-black/30 transition-all duration-500 ease-out hover:scale-[1.02] hover:-translate-y-1">
      <Link
        href={`/${lang}/course/${id}?code=${searchParams?.get("code") || ""}`}
        style={{
          backgroundImage: `url('${thumbnail}')`,
        }}
        className="aspect-video bg-cover bg-center bg-no-repeat grid place-content-center flex-shrink-0 relative group overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out"></div>
        <div className="bg-foreground/10 dark:bg-foreground/20 backdrop-blur-sm grid place-content-center relative z-10 transition-all duration-300 ease-out">
          <div className="p-4 bg-foreground/50 dark:bg-foreground/60 rounded-full group-hover:scale-125 group-hover:bg-primary-500 transition-all duration-500 ease-out">
            <Play className="size-4 stroke-background fill-background" />
          </div>
        </div>
      </Link>

      <div className="px-6 py-4 divide-y divide-divider dark:divide-white/10 flex-1 flex flex-col min-h-0">
        <div className="pb-4 flex flex-col gap-3 flex-1 min-h-0">
          <Link
            href={
              titleLink ||
              `/${lang}/course/${id}?code=${searchParams?.get("code") || ""}`
            }
            className="text-lg font-bold text-foreground dark:text-white overflow-hidden hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-300 ease-out leading-tight min-h-[3.5rem] group"
          >
            <span
              className="group-hover:text-primary transition-colors duration-300"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                textOverflow: "ellipsis",
              }}
            >
              {lang == "en" ? titleEn : titleAm}
            </span>
          </Link>

          <p className="space-x-2 text-sm whitespace-nowrap overflow-hidden text-ellipsis text-foreground/60 dark:text-foreground/50 transition-colors duration-300 min-h-[1.25rem]">
            <span>{lang == "en" ? "course by" : "ኮርስ "}</span>
            <span className="font-semibold text-foreground/80 dark:text-foreground/70">
              {lang == "en" ? "" : "በ"}
              {instructor.firstName} {instructor.fatherName}
            </span>
          </p>

          <p
            className="text-sm text-foreground/70 dark:text-foreground/60 overflow-hidden leading-relaxed transition-colors duration-300 min-h-[3.75rem]"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              textOverflow: "ellipsis",
            }}
          >
            {lang == "en" ? aboutEn : aboutAm}
          </p>
        </div>

        <div className="py-4 grid grid-cols-3 gap-3 text-xs flex-shrink-0">
          {[
            {
              Icon: ChartBarIncreasing,
              title: lang == "en" ? "level" : "ደረጃ",
              value: level,
            },
            {
              Icon: Clock,
              title: lang == "en" ? "duration" : "ቆይታ",
              value: duration,
            },
            {
              Icon: Logs,
              title: lang == "en" ? "activities" : "እንቅስቃሴዎች",
              value: activity,
            },
          ].map(({ Icon, title, value }, i) => (
            <div
              key={i + ""}
              className="flex gap-2 items-center group/stat hover:scale-105 transition-transform duration-300 ease-out"
            >
              <Icon className="size-8 text-primary-500 dark:text-primary-400 flex-shrink-0 transition-colors duration-300 group-hover/stat:text-primary-600 dark:group-hover/stat:text-primary-300" />
              <div className="min-w-0">
                <p className="text-foreground/60 dark:text-foreground/50 capitalize text-[10px] leading-tight transition-colors duration-300">
                  {title}
                </p>
                <p className="font-semibold text-foreground dark:text-white truncate transition-colors duration-300">
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 pb-2 grid mt-auto flex-shrink-0">{btn}</div>
      </div>

      <div
        className={cn(
          "absolute top-0 right-0 px-5 py-2 rounded-bl-xl shadow-lg font-bold text-sm transition-all duration-300 ease-out backdrop-blur-sm",
          price > 0
            ? "bg-background/95 dark:bg-background/90 text-foreground dark:text-white border-l border-b border-divider dark:border-white/10"
            : "bg-gradient-to-br from-success-500 to-success-600 dark:from-success-600 dark:to-success-700 text-white shadow-success-900/50"
        )}
      >
        {price > 0 ? `${price} ETB` : "Free"}
      </div>
    </div>
  );
}
