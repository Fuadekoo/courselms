"use client";

import useData from "@/hooks/useData";
import { getCoursesByTags } from "@/actions/public/courses";
import React from "react";
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
import PriceDisplay from "@/components/PriceDisplay";
import TruncatedDescription from "@/components/TruncatedDescription";
import { cn } from "@/lib/utils";

export default function Page() {
  const params = useParams<{ lang: string }>(),
    lang = params?.lang ?? "en",
    searchParams = useSearchParams(),
    { data: response, loading } = useData({
      func: getCoursesByTags,
      args: [],
    });

  // Extract the tagged courses from the response
  const taggedCourses = response?.data || [];

  if (loading) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <main>
        {!taggedCourses || taggedCourses.length <= 0 ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <NoData />
          </div>
        ) : (
          <section className="py-20 bg-gradient-to-b from-transparent via-sky-50/20 to-transparent dark:via-sky-900/10">
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

              {/* Courses by Tags */}
              <div className="space-y-16">
                {taggedCourses.map((tag) => (
                  <div key={tag.id} className="space-y-8">
                    {/* Tag Header */}
                    <div className="text-center">
                      <h2 className="text-2xl md:text-3xl font-bold mb-2">{tag.name}</h2>
                      <div className="w-20 h-1 bg-primary mx-auto rounded-full"></div>
                    </div>
                    
                    {/* Tag Courses Grid */}
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                      {tag.courses.map((course, i) => (
                        <Card
                          key={i}
                          className="flex flex-col hover:shadow-lg transition-shadow bg-background border border-divider"
                        >
                          {/* Thumbnail */}
                          <Link
                            href={`/${lang}/course/${course.id}?code=${
                              searchParams?.get("code") || ""
                            }`}
                            className="relative aspect-video bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900/30 dark:to-green-900/30 rounded-t-lg overflow-hidden block"
                          >
                            {course.thumbnail ? (
                              <>
                                <img
                                  src={course.thumbnail}
                                  alt={lang === "en" ? course.titleEn : course.titleAm}
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
                          </Link>

                          {/* Course Details */}
                          <CardHeader className="flex-col items-start">
                            <div className="flex items-start justify-between mb-3 w-full">
                              <Chip color="primary" variant="flat" size="sm">
                                {course.level}
                              </Chip>
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm font-medium">4.8</span>
                              </div>
                            </div>

                            <div className="flex items-start justify-between mb-3 w-full">
                              <Link
                                href={`/${lang}/course/${course.id}?code=${
                                  searchParams?.get("code") || ""
                                }`}
                                className="flex-1 group"
                              >
                                <h3 className="text-xl font-bold group-hover:text-primary transition-colors cursor-pointer">
                                  {lang === "en" ? course.titleEn : course.titleAm}
                                </h3>
                              </Link>
                              <div
                                className={cn(
                                  "absolute top-0 right-0 px-2 py-1 rounded-bl-xl shadow-lg text-lg font-bold transition-all duration-300 ease-out backdrop-blur-sm",
                                  (course.birrPrice ?? 0) > 0 ||
                                    (course.dolarPrice ?? 0) > 0
                                    ? "bg-background/95 dark:bg-background/90 border-l border-b border-divider dark:border-white/10"
                                    : "bg-gradient-to-br from-success-500 to-success-600 dark:from-success-600 dark:to-success-700 text-white shadow-success-900/50"
                                )}
                              >
                                {(course.birrPrice ?? 0) > 0 ||
                                (course.dolarPrice ?? 0) > 0 ? (
                                  <PriceDisplay
                                    courseId={course.id}
                                    birrPrice={course.birrPrice || course.price}
                                    dolarPrice={course.dolarPrice || course.price}
                                    className="text-lg font-bold leading-tight"
                                    showDiscountBadge={false}
                                  />
                                ) : (
                                  <span className="font-bold text-xl">
                                    {lang == "en" ? "Free" : "ነፃ"}
                                  </span>
                                )}
                              </div>
                            </div>
                          </CardHeader>

                          <CardBody className="flex-1 pt-0">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-sm text-default-600">
                                <Clock className="h-4 w-4" />
                                <span>{course.duration}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-default-600">
                                <Users className="h-4 w-4" />
                                <span>
                                  {course.instructor.firstName} {course.instructor.fatherName}
                                </span>
                              </div>
                            </div>
                          </CardBody>

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
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}