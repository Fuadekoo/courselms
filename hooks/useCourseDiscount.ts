"use client";

import { useEffect, useState } from "react";
import { getActiveDiscountForCourse } from "@/actions/manager/periodic-discount";

interface Discount {
  id: string;
  title: string;
  value: number;
  type: "PERCENT";
  endDate: string | null;
}

interface DiscountResult {
  discount: Discount | null;
  originalPrice: number;
  discountedPrice: number;
  discountAmount: number;
  hasDiscount: boolean;
}

export function useCourseDiscount(courseId: string, originalPrice: number) {
  const [discountData, setDiscountData] = useState<DiscountResult>({
    discount: null,
    originalPrice,
    discountedPrice: originalPrice,
    discountAmount: 0,
    hasDiscount: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiscount = async () => {
      if (!courseId || originalPrice <= 0) {
        setDiscountData({
          discount: null,
          originalPrice,
          discountedPrice: originalPrice,
          discountAmount: 0,
          hasDiscount: false,
        });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const result = await getActiveDiscountForCourse(courseId);

        if (result.data && result.data.value) {
          const discountPercent = result.data.value;
          const discountAmount = (originalPrice * discountPercent) / 100;
          const discountedPrice = originalPrice - discountAmount;

          setDiscountData({
            discount: result.data,
            originalPrice,
            discountedPrice: Math.max(0, discountedPrice),
            discountAmount,
            hasDiscount: true,
          });
        } else {
          setDiscountData({
            discount: null,
            originalPrice,
            discountedPrice: originalPrice,
            discountAmount: 0,
            hasDiscount: false,
          });
        }
      } catch (error) {
        console.error("Error fetching discount:", error);
        setDiscountData({
          discount: null,
          originalPrice,
          discountedPrice: originalPrice,
          discountAmount: 0,
          hasDiscount: false,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDiscount();
  }, [courseId, originalPrice]);

  return { ...discountData, loading };
}
