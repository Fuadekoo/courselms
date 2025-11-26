"use client";

import React, { useEffect } from "react";
import { toast } from "sonner";
import { HeroSection } from "@/components/guest/hero-section";
import CoursePage from "../../(guest)/course/page";
import { FeaturesSection } from "@/components/guest/features-section";
import { Footer } from "@/components/guest/footer";
import { OurStudentsSection } from "@/components/guest/out-students";

export default function Page() {
  useEffect(() => {
    toast.dismiss();
  }, []);

  return (
    <div className="w-full">
      <HeroSection />
      <CoursePage />
      <FeaturesSection />
      <OurStudentsSection />
      <Footer />
    </div>
  );
}
