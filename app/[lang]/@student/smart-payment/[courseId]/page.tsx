"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import SmartPaymentMethod from "@/components/SmartPaymentMethod";
import { Card, CardBody, CardHeader } from "@heroui/react";
import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import { usePaymentStore } from "@/stores";

export default function SmartPaymentPage() {
  const params = useParams<{ lang: string; courseId: string }>();
  const lang = params?.lang || "en";
  const courseId = params?.courseId;

  // Use Zustand payment store
  const {
    selectedCourseId,
    courseDetails,
    paymentMethod,
    isProcessing,
    paymentStatus,
    selectCourse,
    setPaymentMethod,
    startPayment,
    reset,
  } = usePaymentStore();

  // Set course on mount
  useEffect(() => {
    if (courseId) {
      selectCourse(courseId, {
        titleEn: "Sample Course",
        titleAm: "ናሙና ኮርስ",
        price: 500,
        birrPrice: 500,
        dolarPrice: 10,
      });
    }

    return () => {
      // Clean up on unmount
      reset();
    };
  }, [courseId, selectCourse, reset]);

  // Mock course data - replace with actual course data
  const courseData = {
    id: selectedCourseId || courseId,
    title: courseDetails?.titleEn || "Sample Course",
    price: courseDetails?.price || 500,
    description: "Learn something amazing with this course",
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePaymentInitiated = (paymentData: any) => {
    console.log("Payment initiated:", paymentData);
    
    // Update store
    setPaymentMethod(paymentData.paymentType);
    startPayment();

    // Here you would handle the actual payment initiation
    // For Chapa: redirect to Chapa payment page
    // For Stripe: redirect to Stripe checkout

    if (paymentData.paymentType === "chapa") {
      // Handle Chapa payment
      console.log("Redirecting to Chapa payment...");
      // window.location.href = `/payment/chapa?courseId=${courseId}&amount=${paymentData.amount}`;
    } else {
      // Handle Stripe payment
      console.log("Redirecting to Stripe payment...");
      // window.location.href = `/payment/stripe?courseId=${courseId}&amount=${paymentData.amount}`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/${lang}/course`}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Link>

          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {lang === "en" ? "Smart Payment" : "ዘመናዊ ክፍያ"}
              </h1>
              <p className="text-gray-600">
                {lang === "en"
                  ? "Payment method automatically selected based on your location"
                  : "የክፍያ ዘዴ በአካባቢዎ ላይ በመመስረት በራስ-ሰር ይመርጣል"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Course Info */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">
                {lang === "en" ? "Course Details" : "የኮርስ ዝርዝሮች"}
              </h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{courseData.title}</h3>
                  <p className="text-gray-600">{courseData.description}</p>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      {lang === "en" ? "Total Amount:" : "ጠቅላላ መጠን:"}
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {courseData.price.toLocaleString()}
                      <span className="text-sm text-gray-500 ml-1">
                        (Auto-detected currency)
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Smart Payment Method */}
          <div>
            <SmartPaymentMethod
              courseId={courseId || ""}
              amount={courseData.price}
              onPaymentInitiated={handlePaymentInitiated}
            />
          </div>
        </div>

        {/* Info Section */}
        <Card className="mt-8">
          <CardBody>
            <div className="text-center">
              <h3 className="font-semibold mb-2">
                {lang === "en" ? "How it works" : "እንዴት እንደሚሰራ"}
              </h3>
              <p className="text-gray-600 text-sm">
                {lang === "en"
                  ? "We automatically detect your location and show you the most convenient payment method. Ethiopian users see Chapa (mobile money), while international users see Stripe (credit cards)."
                  : "አካባቢዎን በራስ-ሰር እንወስናለን እና በጣም ምቹ የሆነውን የክፍያ ዘዴ እናሳይዎታለን። ኢትዮጵያውያን ተጠቃሚዎች ቻፓ (ሞባይል ገንዘብ) ያያሉ፣ ዓለም አቀፍ ተጠቃሚዎች ደግሞ ስትራይፕ (ክሬዲት ካርድ) ያያሉ።"}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
