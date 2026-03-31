"use client";

import useData from "@/hooks/useData";
import { getCoursesByTags } from "@/actions/public/courses";
import React, { useMemo } from "react";
import NoData from "@/components/noData";
import { useParams, useSearchParams } from "next/navigation";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  Skeleton,
} from "@heroui/react";
import { Clock, Users, Star, PlayCircle, BookOpen } from "lucide-react";
import Link from "next/link";
import PriceDisplay from "@/components/PriceDisplay";
import { cn } from "@/lib/utils";

const PAGE_CONTENT = {
  en: {
    title: "Our Academic Programs",
    subtitle: "Achieve mastery in Islamic sciences through our structured curriculum and expert-led instruction.",
    enroll: "Enroll Now",
    free: "Free",
    level: "Level",
    noData: "No courses found matching your criteria.",
  },
  am: {
    title: "የጥናት መርሃ-ግብሮቻችን",
    subtitle: "በሊቃውንት የተዘጋጁ ስልታዊ ትምህርቶችን በመከታተል የእስልምና እውቀትዎን ያዳብሩ።",
    enroll: "አሁኑኑ ይመዝገቡ",
    free: "ነፃ",
    level: "ደረጃ",
    noData: "ምንም አይነት ኮርስ አልተገኘም።",
  }
};

export default function Page() {
  const params = useParams<{ lang: "en" | "am" }>();
  const lang = params?.lang ?? "en";
  const t = PAGE_CONTENT[lang] || PAGE_CONTENT.en;
  
  const searchParams = useSearchParams();
  const search = searchParams?.get("search") || "";
  
  const courseArgs = useMemo(() => [{ search }], [search]);
  const { data: response, loading } = useData({
    func: getCoursesByTags,
    args: [courseArgs[0]],
  });

  const taggedCourses = response?.data || [];

  // Skeleton Loader for professional UX
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 space-y-10">
        <div className="flex flex-col items-center gap-4 mb-12">
          <Skeleton className="h-10 w-48 rounded-lg" />
          <Skeleton className="h-6 w-96 rounded-lg" />
        </div>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="h-[400px] space-y-5 p-4">
              <Skeleton className="rounded-lg h-40" />
              <div className="space-y-3">
                <Skeleton className="h-6 w-3/4 rounded-lg" />
                <Skeleton className="h-6 w-1/2 rounded-lg" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main>
        {!taggedCourses || taggedCourses.length <= 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <NoData />
            <p className="text-default-500 font-medium">{t.noData}</p>
          </div>
        ) : (
          <section className="py-16 md:py-24">
            <div className="container mx-auto px-4">
              {/* Section Header */}
              <div className="flex flex-col items-center text-center mb-20">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary mb-4">
                  <BookOpen size={32} />
                </div>
                <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">
                  {t.title}
                </h1>
                <p className="text-lg text-default-500 max-w-2xl leading-relaxed">
                  {t.subtitle}
                </p>
              </div>

              {/* Tag Groups */}
              <div className="space-y-24">
                {taggedCourses.map((tag: any) => (
                  <div key={tag.id} className="space-y-10">
                    <div className="flex items-center gap-4">
                      <h2 className="text-2xl md:text-3xl font-bold whitespace-nowrap">
                        {lang === "en" ? tag.name : (tag.nameAm || tag.name)}
                      </h2>
                      <div className="h-[1px] w-full bg-divider"></div>
                    </div>

                    <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                      {tag.courses.map((course: any) => (
                        <Card
                          key={course.id}
                          isPressable
                          className="group border-none bg-default-50/50 dark:bg-default-100/10 hover:bg-background transition-all duration-300 shadow-sm hover:shadow-2xl"
                        >
                          {/* Visual Thumbnail */}
                          <CardHeader className="p-0 relative overflow-hidden aspect-video">
                            <img
                              src={course.thumbnail || "/errorphoto.png"}
                              alt={lang === "en" ? course.titleEn : course.titleAm}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <PlayCircle className="text-white w-12 h-12 stroke-[1.5]" />
                            </div>
                            
                            {/* Price Badge Overlay */}
                            <div className="absolute top-3 right-3 z-20">
                              <div className="px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-md shadow-lg border border-divider">
                                {(course.birrPrice ?? 0) > 0 || (course.dolarPrice ?? 0) > 0 ? (
                                  <PriceDisplay
                                    courseId={course.id}
                                    birrPrice={course.birrPrice || course.price}
                                    dolarPrice={course.dolarPrice || course.price}
                                    className="text-sm font-bold text-primary"
                                    showDiscountBadge={false}
                                  />
                                ) : (
                                  <span className="text-sm font-bold text-success">{t.free}</span>
                                )}
                              </div>
                            </div>
                          </CardHeader>

                          <CardBody className="px-5 py-6">
                            <div className="flex items-center gap-2 mb-3">
                              <Chip size="sm" variant="dot" color="primary" className="border-none p-0 h-auto font-bold uppercase tracking-wider text-[10px]">
                                {course.level || "General"}
                              </Chip>
                              <div className="flex items-center gap-1 ml-auto">
                                <Star className="h-3 w-3 fill-warning text-warning" />
                                <span className="text-xs font-bold">4.9</span>
                              </div>
                            </div>

                            <h3 className="text-xl font-bold mb-4 line-clamp-2 min-h-[3.5rem] group-hover:text-primary transition-colors">
                              {lang === "en" ? course.titleEn : course.titleAm}
                            </h3>

                            <div className="flex flex-col gap-2 border-t border-divider pt-4">
                              <div className="flex items-center gap-2 text-default-500">
                                <Clock size={16} />
                                <span className="text-sm">{course.duration}</span>
                              </div>
                              <div className="flex items-center gap-2 text-default-500">
                                <Users size={16} />
                                <span className="text-sm font-medium">
                                  {course.instructor.firstName} {course.instructor.fatherName}
                                </span>
                              </div>
                            </div>
                          </CardBody>

                          <CardFooter className="px-5 pb-6 pt-0">
                            <Button 
                              as={Link}
                              href={`/${lang}/course/${course.id}?code=${searchParams?.get("code") || ""}`}
                              color="primary" 
                              variant="solid"
                              className="w-full font-bold h-12 shadow-lg shadow-primary/20"
                            >
                              {t.enroll}
                            </Button>
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