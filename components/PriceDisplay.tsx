"use client";

import React from "react";
import { useCourseDiscount } from "@/hooks/useCourseDiscount";
import { Chip } from "@heroui/react";
import { useParams } from "next/navigation";
import { usePaymentMethod } from "@/hooks/usePaymentMethod";
import CountdownTimer from "@/components/CountdownTimer";

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
    // Use larger text when in badge context (showDiscountBadge=false)
    const mainTextSize = showDiscountBadge ? "text-xs" : "text-lg";
    const strikeTextSize = showDiscountBadge ? "text-[9px]" : "text-sm";

    return (
      <div className={`flex flex-col gap-0 ${className}`}>
        <div className="flex items-center gap-1 flex-wrap">
          <span
            className={`${mainTextSize} font-bold text-primary leading-tight`}
          >
            {isEthiopia ? "ETB " : "$"}
            {discountedPrice.toFixed(2)}
            {!isEthiopia && " USD"}
          </span>
          {showDiscountBadge && (
            <Chip
              size="sm"
              color="danger"
              variant="flat"
              className="font-bold text-[7px] px-0.5 py-0 min-w-0 h-3 leading-none scale-90"
            >
              -{discount.value}%
            </Chip>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span
            className={`${strikeTextSize} text-red-600 dark:text-red-500 line-through leading-tight`}
          >
            {isEthiopia ? "ETB " : "$"}
            {originalWithDiscount.toFixed(2)}
            {!isEthiopia && " USD"}
          </span>
        </div>
        {discount.endDate && (
          <CountdownTimer
            endDate={discount.endDate}
            className={`mt-0 ${showDiscountBadge ? "text-[8px]" : "text-xs"}`}
          />
        )}
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
