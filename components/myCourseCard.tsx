"use client";

import { Play } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@heroui/react";
import Image from "next/image";

interface MyCourseCardProps {
  id: string;
  titleEn: string;
  titleAm: string;
  thumbnail: string;
  aboutEn: string;
  aboutAm: string;
  progress: number;
  instructorName: string;
}

export default function MyCourseCard({
  id,
  titleEn,
  titleAm,
  thumbnail,
  aboutEn,
  aboutAm,
  progress,
  instructorName,
}: MyCourseCardProps) {
  const params = useParams<{ lang: string }>();
  const lang = params?.lang || "en";

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex flex-col md:flex-row">
        {/* Thumbnail - Left Side - Opens in-progress video */}
        <Link
          href={`/${lang}/mycourse/${id}?video=inprogress`}
          className="relative block w-full md:w-64 lg:w-72 aspect-video md:aspect-auto md:h-40 bg-gray-100 dark:bg-gray-800 overflow-hidden group flex-shrink-0"
        >
          <Image
            src={thumbnail}
            alt={lang === "en" ? titleEn : titleAm}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
            <div className="bg-white/90 dark:bg-gray-800/90 rounded-full p-2.5 md:p-3 group-hover:scale-110 transition-transform">
              <Play className="size-5 md:size-6 text-blue-600 dark:text-blue-400 fill-blue-600 dark:fill-blue-400" />
            </div>
          </div>
        </Link>

        {/* Content - Right Side */}
        <div className="flex-1 p-3 md:p-4 flex flex-col justify-between">
          <div className="space-y-2">
            {/* Title - Opens intro video */}
            <Link
              href={`/${lang}/mycourse/${id}?video=intro`}
              className="block group"
            >
              <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                {lang === "en" ? titleEn : titleAm}
              </h3>
            </Link>

            {/* Instructor */}
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
              {lang === "en" ? "A course by" : "ኮርስ በ"} {instructorName}
            </p>

            {/* Description */}
            <p 
              className="text-xs md:text-sm text-gray-700 dark:text-gray-300 line-clamp-2"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {lang === "en" ? aboutEn : aboutAm}
            </p>
          </div>

          {/* Progress and Button Section */}
          <div className="space-y-2 mt-3">
            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {lang === "en" ? "Progress" : "ሂደት"}
                </span>
                <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                  {progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-green-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Continue Button - Opens in-progress video */}
            <Button
              as={Link}
              href={`/${lang}/mycourse/${id}?video=inprogress`}
              color="primary"
              variant="bordered"
              className="w-full md:w-auto"
              size="sm"
            >
              {lang === "en" ? "Continue" : "ቀጥል"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

