"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Accordion, AccordionItem, Skeleton } from "@heroui/react";
import { PlayCircle, CheckCircle2 } from "lucide-react";

interface SubActivity {
  id: string;
  titleEn: string;
  titleAm: string;
  video: string;
  thumbnail?: string | null;
}

interface Activity {
  titleEn: string;
  titleAm: string;
  subActivity: SubActivity[];
}

interface ContentProps {
  activities: Activity[];
  onSelectVideo: (
    video: string,
    title: string,
    subActivityId?: string,
    thumbnail?: string
  ) => void;
  lang: string;
  currentVideoUrl: string;
  loading: boolean;
}

export default function Content({
  activities,
  onSelectVideo,
  lang,
  currentVideoUrl,
  loading,
}: ContentProps) {
  // Compute initial expanded section based on current video
  const initialExpandedSection = useMemo(() => {
    if (!activities || activities.length === 0) {
      return "0";
    }

    // Find section containing the current video
    const currentVideoSectionIndex = activities.findIndex((activity) =>
      activity.subActivity.some((sub) => sub.video === currentVideoUrl)
    );

    if (currentVideoSectionIndex !== -1) {
      return String(currentVideoSectionIndex);
    }

    // Default to first section
    return "0";
  }, [activities, currentVideoUrl]);

  // Initialize expandedKeys with computed initial section
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => {
    return new Set([initialExpandedSection]);
  });

  // Update expandedKeys when currentVideoUrl changes
  useEffect(() => {
    if (currentVideoUrl && activities) {
      const currentVideoSectionIndex = activities.findIndex((activity) =>
        activity.subActivity.some((sub) => sub.video === currentVideoUrl)
      );

      if (currentVideoSectionIndex !== -1) {
        setExpandedKeys(new Set([String(currentVideoSectionIndex)]));
      }
    }
  }, [currentVideoUrl, activities]);

  // Update when initialExpandedSection changes
  useEffect(() => {
    if (initialExpandedSection) {
      setExpandedKeys(new Set([initialExpandedSection]));
    }
  }, [initialExpandedSection]);

  if (loading) {
    return (
      <div className="w-full p-4 space-y-4">
        <Skeleton className="h-8 w-3/4 mb-4" />
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </div>
    );
  }

  if (!Array.isArray(activities) || activities.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No course content available.
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-4 px-4 pt-4">
        {lang === "en" ? "Course Content" : "የትምህርት ይዘት"}
      </h2>
      <Accordion
        selectionMode="single"
        selectedKeys={expandedKeys}
        onSelectionChange={(keys) => setExpandedKeys(keys as Set<string>)}
      >
        {activities.map((activity, index: number) => (
          <AccordionItem
            key={index}
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
              {activity.subActivity.map((sub) => {
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
                    className={`flex items-center gap-3 cursor-pointer p-3 rounded ${
                      isActive
                        ? "bg-primary-100 font-bold"
                        : "hover:bg-gray-100"
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
            </ul>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
