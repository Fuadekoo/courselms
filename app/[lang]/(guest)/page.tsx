"use client";

import React, { useEffect } from "react";
import { toast } from "sonner";
import { HeroSection } from "@/components/guest/hero-section";
import CoursePage from "./course/page";
import { FeaturesSection } from "@/components/guest/features-section";
// import { TestimonialsSection } from "@/components/guest/testimonial";
import { Footer } from "@/components/guest/footer";
import { OurStudentsSection } from "@/components/guest/out-students";
import PublicAnnouncement from "@/components/guest/public-announcment";

export default function Page() {
  useEffect(() => {
    toast.dismiss();
  }, []);

  return (
    <div className="h-full">
      <PublicAnnouncement />
      <HeroSection />
      <CoursePage />
      <FeaturesSection />
      {/* <TestimonialsSection /> */}
      <OurStudentsSection />
      <Footer />
    </div>
  );
}
