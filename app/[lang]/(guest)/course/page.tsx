"use client";

import useData from "@/hooks/useData";
import { getCoursesForCustomer } from "@/lib/data/course";
import React from "react";
import Loading from "@/components/loading";
import NoData from "@/components/noData";
import { useParams, useSearchParams } from "next/navigation";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
} from "@heroui/react";
import { Clock, Users, Star } from "lucide-react";
import Link from "next/link";

export default function Page() {
  const params = useParams<{ lang: string }>(),
    lang = params?.lang ?? "en",
    searchParams = useSearchParams(),
    { data, loading } = useData({
      func: getCoursesForCustomer,
      args: [],
    });

  return (
    <div className="min-h-screen">
      <main className="bg-gradient-to-b from-background to-sky-50 dark:to-sky-900/20">
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loading />
          </div>
        ) : !data || data.length <= 0 ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <NoData />
          </div>
        ) : (
          <section className="py-20">
            <div className="container mx-auto px-4">
              {/* Page Header */}
              <div className="text-center mb-12">
                <h1 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
                  {lang === "en" ? "Our Courses" : "ኮርሶቻችን"}
                </h1>
                <p className="text-lg text-default-600 max-w-2xl mx-auto">
                  {lang === "en"
                    ? "Explore our comprehensive range of courses designed to help you achieve your learning goals"
                    : "የእርስዎን የመማሪያ ግቦች ለማሳካት የተነደፉ ሰፊ ኮርሶችን ይመልከቱ"}
                </p>
              </div>

              {/* Courses Grid */}
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {data.map((course, i) => (
                  <Card
                    key={i}
                    className="flex flex-col hover:shadow-lg transition-shadow bg-background border border-divider"
                  >
                    {/* Thumbnail with Play Icon - Dark Mode Compatible */}
                    <div className="relative aspect-video bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900/30 dark:to-green-900/30 rounded-t-lg overflow-hidden">
                      {course.thumbnail ? (
                        <>
                          <img
                            src={course.thumbnail}
                            alt={
                              lang === "en" ? course.titleEn : course.titleAm
                            }
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/20 dark:bg-black/40"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 bg-white/90 dark:bg-white/20 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm hover:scale-110 transition-transform">
                              <div className="w-0 h-0 border-l-[12px] border-l-blue-500 dark:border-l-blue-400 border-y-[8px] border-y-transparent ml-1"></div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-green-500/20 dark:from-blue-400/30 dark:to-green-400/30"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 bg-white/90 dark:bg-white/20 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm">
                              <div className="w-0 h-0 border-l-[12px] border-l-blue-500 dark:border-l-blue-400 border-y-[8px] border-y-transparent ml-1"></div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Course Details Section - Matching Image Layout */}
                    <CardHeader className="flex-col items-start">
                      {/* Level Badge and Star Rating Row */}
                      <div className="flex items-start justify-between mb-3 w-full">
                        <Chip color="primary" variant="flat" size="sm">
                          {course.level}
                        </Chip>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">4.8</span>
                        </div>
                      </div>

                      {/* Title and Price Row */}
                      <div className="flex items-start justify-between mb-3 w-full">
                        <h3 className="text-xl font-bold flex-1">
                          {lang === "en" ? course.titleEn : course.titleAm}
                        </h3>
                        <div className="text-2xl font-bold text-primary ml-4">
                          {course.price > 0 ? `${course.price} ETB` : "Free"}
                        </div>
                      </div>

                      <p className="text-sm text-default-600 mb-4">
                        {lang === "en" ? course.aboutEn : course.aboutAm}
                      </p>
                    </CardHeader>

                    {/* Metadata and Action Section */}
                    <CardBody className="flex-1 pt-0">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-default-600">
                          <Clock className="h-4 w-4" />
                          <span>{course.duration}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-default-600">
                          <Users className="h-4 w-4" />
                          <span>{course._count?.activity || 0} activities</span>
                        </div>
                      </div>
                    </CardBody>

                    {/* Enroll Now Button */}
                    <CardFooter className="pt-4">
                      <Link
                        href={`/${lang}/course/${course.id}?code=${
                          searchParams?.get("code") || ""
                        }`}
                        className="w-full"
                      >
                        <Button color="primary" className="w-full">
                          {lang == "en" ? "Enroll Now" : "መዝግብ"}
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      {/* <Footer /> */}
    </div>
  );
}
