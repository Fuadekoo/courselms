"use client";

import React from "react";
import { useCourseDiscount } from "@/hooks/useCourseDiscount";
import { Chip } from "@heroui/react";
import { useParams } from "next/navigation";
import { usePaymentMethod } from "@/hooks/usePaymentMethod";

interface PriceDisplayProps {
  courseId: string;
  birrPrice: number;
  dolarPrice: number;
  className?: string;
  showDiscountBadge?: boolean;
}

export default function PriceDisplay({
  courseId,
  birrPrice,
  dolarPrice,
  className = "",
  showDiscountBadge = true,
}: PriceDisplayProps) {
  const params = useParams();
  const lang = (params?.lang as string) || "en";
  const { isEthiopia, loading: locationLoading } = usePaymentMethod();

  // Determine which price to use based on location
  const originalPrice = isEthiopia ? birrPrice : dolarPrice;
  const currency = isEthiopia ? "ETB" : "USD";

  const {
    hasDiscount,
    originalPrice: originalWithDiscount,
    discountedPrice,
    discount,
    loading: discountLoading,
  } = useCourseDiscount(courseId, originalPrice);

  const loading = locationLoading || discountLoading;

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="h-6 w-20 bg-default-200 animate-pulse rounded"></div>
      </div>
    );
  }

  if (originalPrice === 0) {
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
            {isEthiopia ? "ETB " : "$"}
            {discountedPrice.toFixed(2)}
            {!isEthiopia && " USD"}
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
            {isEthiopia ? "ETB " : "$"}
            {originalWithDiscount.toFixed(2)}
            {!isEthiopia && " USD"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`text-2xl font-bold text-primary ${className}`}>
      {isEthiopia ? "ETB " : "$"}
      {originalPrice.toFixed(2)}
      {!isEthiopia && " USD"}
    </div>
  );
}
