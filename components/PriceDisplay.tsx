"use client";

import React from "react";
import { useCourseDiscount } from "@/hooks/useCourseDiscount";
import { Chip } from "@heroui/react";
import { useParams } from "next/navigation";

interface PriceDisplayProps {
  courseId: string;
  price: number;
  currency?: string;
  className?: string;
  showDiscountBadge?: boolean;
}

export default function PriceDisplay({
  courseId,
  price,
  currency = "ETB",
  className = "",
  showDiscountBadge = true,
}: PriceDisplayProps) {
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const { hasDiscount, originalPrice, discountedPrice, discount, loading } =
    useCourseDiscount(courseId, price);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="h-6 w-20 bg-default-200 animate-pulse rounded"></div>
      </div>
    );
  }

  if (price === 0) {
    return (
      <div className={`text-2xl font-bold text-success ${className}`}>
        {lang === "en" ? "Free" : "ነፃ"}
      </div>
    );
  }

  if (hasDiscount && discount) {
    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-2xl font-bold text-primary">
            {discountedPrice.toFixed(2)} {currency}
          </span>
          {showDiscountBadge && (
            <Chip
              size="sm"
              color="danger"
              variant="flat"
              className="font-semibold"
            >
              -{discount.value}%
            </Chip>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg text-default-400 line-through">
            {originalPrice.toFixed(2)} {currency}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`text-2xl font-bold text-primary ${className}`}>
      {price.toFixed(2)} {currency}
    </div>
  );
}
