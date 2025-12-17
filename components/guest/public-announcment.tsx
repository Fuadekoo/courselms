"use client";

import React, { useEffect, useState, useRef } from "react";
import { Card, CardBody, Button } from "@heroui/react";
import { Bell, X, ChevronLeft, ChevronRight } from "lucide-react";
import { getPublicAnnouncements } from "@/actions/manager/public-announcement";
import { useParams } from "next/navigation";

interface Announcement {
  id: string;
  message: string;
  photo?: string | null;
  createdAt: Date | string;
}

export default function PublicAnnouncement() {
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only fetch on client side and ensure we're not in an error state
    if (typeof window !== "undefined") {
      fetchAnnouncements();
    }
  }, []);

  // Handle click outside to close announcement
  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setIsVisible(false);
      }
    };

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isVisible]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const result = await getPublicAnnouncements({
        activeOnly: true,
        limit: 5,
      });
      if (result?.data && result.data.length > 0) {
        setAnnouncements(result.data);
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
      // Silently fail - don't show announcements if there's an error
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading || announcements.length === 0 || !isVisible) {
    return null;
  }

  const currentAnnouncement = announcements[currentIndex];
  const hasMultiple = announcements.length > 1;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  };

  const handlePrev = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + announcements.length) % announcements.length
    );
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <div 
      ref={cardRef}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4 animate-in slide-in-from-top-5 duration-500"
    >
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-2 border-primary/20 shadow-2xl">
        <CardBody className="p-4 md:p-6">
          <div className="flex items-start gap-4">
            {/* Bell Icon */}
            <div className="flex-shrink-0 mt-1">
              <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                <Bell className="h-6 w-6 text-primary animate-pulse" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="text-lg font-bold text-foreground">
                  {lang === "en" ? "Announcement" : "ማስታወቂያ"}
                </h3>
                <div className="flex items-center gap-2">
                  {/* Navigation Dots */}
                  {hasMultiple && (
                    <div className="flex gap-1">
                      {announcements.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentIndex(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentIndex
                              ? "bg-primary w-6"
                              : "bg-primary/30"
                          }`}
                          aria-label={`Go to announcement ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                  {/* Close Button */}
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    onPress={handleClose}
                    className="min-w-6 w-6 h-6"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Image */}
              {currentAnnouncement.photo && (
                <div className="mb-3 rounded-lg overflow-hidden bg-default-100">
                  <img
                    src={currentAnnouncement.photo}
                    alt="Announcement"
                    className="w-full h-auto max-h-96 object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}

              {/* Message */}
              <p className="text-default-700 dark:text-default-300 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                {currentAnnouncement.message}
              </p>

              {/* Navigation Arrows */}
              {hasMultiple && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-divider">
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    onPress={handlePrev}
                    aria-label="Previous announcement"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <span className="text-xs text-default-500">
                    {currentIndex + 1} / {announcements.length}
                  </span>
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    onPress={handleNext}
                    aria-label="Next announcement"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
