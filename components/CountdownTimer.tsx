"use client";

import { useEffect, useState } from "react";

interface CountdownTimerProps {
  endDate: string | Date | null;
  className?: string;
}

export default function CountdownTimer({
  endDate,
  className = "",
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    if (!endDate) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const end = new Date(endDate).getTime();
      const now = new Date().getTime();
      const difference = end - now;

      if (difference <= 0) {
        setTimeLeft(null);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  if (!timeLeft) {
    return null;
  }

  // Use green if there are days remaining or more than 12 hours, red if less than 12 hours
  const totalHours = timeLeft.days * 24 + timeLeft.hours;
  const isUrgent = timeLeft.days === 0 && totalHours < 12;
  const textColor = isUrgent 
    ? "text-red-600 dark:text-red-500" 
    : "text-green-600 dark:text-green-500";

  return (
    <div className={`text-[8px] font-medium ${textColor} ${className}`}>
      <span className="leading-none">
        {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
      </span>
    </div>
  );
}

