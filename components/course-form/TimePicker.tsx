"use client";
import React, { useState, useEffect } from "react";
import { Clock, X, ChevronDown } from "lucide-react";

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  className?: string;
}

export default function TimePicker({
  value,
  onChange,
  label,
  placeholder = "00:00:00",
  className = "",
}: TimePickerProps) {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Parse initial value
  useEffect(() => {
    if (value && !isInitialized) {
      const timeParts = value.split(":");
      if (timeParts.length >= 2) {
        setHours(parseInt(timeParts[0]) || 0);
        setMinutes(parseInt(timeParts[1]) || 0);
        setSeconds(parseInt(timeParts[2]) || 0);
        setIsInitialized(true);
      }
    }
  }, [value, isInitialized]);

  const updateTime = (
    newHours: number,
    newMinutes: number,
    newSeconds: number
  ) => {
    const timeString = `${newHours.toString().padStart(2, "0")}:${newMinutes
      .toString()
      .padStart(2, "0")}:${newSeconds.toString().padStart(2, "0")}`;
    onChange(timeString);
  };

  const formatDisplayValue = () => {
    if (!value) return placeholder;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const clearTime = () => {
    setHours(0);
    setMinutes(0);
    setSeconds(0);
    updateTime(0, 0, 0);
  };

  const handleTimeChange = (
    type: "hours" | "minutes" | "seconds",
    delta: number
  ) => {
    let newHours = hours;
    let newMinutes = minutes;
    let newSeconds = seconds;

    switch (type) {
      case "hours":
        newHours = Math.max(0, Math.min(23, hours + delta));
        break;
      case "minutes":
        newMinutes = Math.max(0, Math.min(59, minutes + delta));
        break;
      case "seconds":
        newSeconds = Math.max(0, Math.min(59, seconds + delta));
        break;
    }

    setHours(newHours);
    setMinutes(newMinutes);
    setSeconds(newSeconds);
    updateTime(newHours, newMinutes, newSeconds);
  };

  const handleDirectEdit = (
    type: "hours" | "minutes" | "seconds",
    value: string
  ) => {
    const numValue = parseInt(value) || 0;
    let newHours = hours;
    let newMinutes = minutes;
    let newSeconds = seconds;

    switch (type) {
      case "hours":
        newHours = Math.max(0, Math.min(23, numValue));
        break;
      case "minutes":
        newMinutes = Math.max(0, Math.min(59, numValue));
        break;
      case "seconds":
        newSeconds = Math.max(0, Math.min(59, numValue));
        break;
    }

    setHours(newHours);
    setMinutes(newMinutes);
    setSeconds(newSeconds);
    updateTime(newHours, newMinutes, newSeconds);
  };

  return (
    <div className={`relative overflow-visible ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        {label}
      </label>

      <div
        className="relative cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border-2 border-gray-200 rounded-lg shadow-sm hover:border-blue-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-200">
          <div className="flex items-center gap-2 sm:gap-3">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <span className="text-gray-900 font-mono text-sm sm:text-base">
              {formatDisplayValue()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                clearTime();
              }}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
            </button>
            <ChevronDown
              className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-400 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>

        {isOpen && (
          <>
            {/* Backdrop for overlap effect */}
            <div
              className="fixed inset-0 bg-black/20 z-[9998]"
              onClick={() => setIsOpen(false)}
            />
            {/* TimePicker Modal */}
            <div
              className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] w-full min-w-[240px] max-w-[90vw]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-2 sm:p-4" onClick={(e) => e.stopPropagation()}>
                <div className="grid grid-cols-3 gap-1 sm:gap-4">
                  {/* Hours */}
                  <div className="text-center">
                    <h4 className="text-xs sm:text-sm font-medium text-gray-600 mb-2 sm:mb-3">
                      Hours
                    </h4>
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTimeChange("hours", 1);
                        }}
                        className="w-full py-1 sm:py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-xs sm:text-base"
                      >
                        ↑
                      </button>
                      <div className="w-10 h-10 sm:w-16 sm:h-16 mx-auto flex items-center justify-center bg-gray-50 rounded-lg border-2 border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-200">
                        <input
                          key={`hours-${hours}`}
                          type="number"
                          min="0"
                          max="23"
                          value={hours.toString().padStart(2, "0")}
                          onChange={(e) =>
                            handleDirectEdit("hours", e.target.value)
                          }
                          className="w-full h-full text-center text-sm sm:text-2xl font-bold text-gray-900 font-mono bg-transparent border-none outline-none"
                          style={{ MozAppearance: "textfield" }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTimeChange("hours", -1);
                        }}
                        className="w-full py-1 sm:py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-xs sm:text-base"
                      >
                        ↓
                      </button>
                    </div>
                  </div>

                  {/* Minutes */}
                  <div className="text-center">
                    <h4 className="text-xs sm:text-sm font-medium text-gray-600 mb-2 sm:mb-3">
                      Minutes
                    </h4>
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTimeChange("minutes", 1);
                        }}
                        className="w-full py-1 sm:py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-xs sm:text-base"
                      >
                        ↑
                      </button>
                      <div className="w-10 h-10 sm:w-16 sm:h-16 mx-auto flex items-center justify-center bg-gray-50 rounded-lg border-2 border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-200">
                        <input
                          key={`minutes-${minutes}`}
                          type="number"
                          min="0"
                          max="59"
                          value={minutes.toString().padStart(2, "0")}
                          onChange={(e) =>
                            handleDirectEdit("minutes", e.target.value)
                          }
                          className="w-full h-full text-center text-sm sm:text-2xl font-bold text-gray-900 font-mono bg-transparent border-none outline-none"
                          style={{ MozAppearance: "textfield" }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTimeChange("minutes", -1);
                        }}
                        className="w-full py-1 sm:py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-xs sm:text-base"
                      >
                        ↓
                      </button>
                    </div>
                  </div>

                  {/* Seconds */}
                  <div className="text-center">
                    <h4 className="text-xs sm:text-sm font-medium text-gray-600 mb-2 sm:mb-3">
                      Seconds
                    </h4>
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTimeChange("seconds", 1);
                        }}
                        className="w-full py-1 sm:py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-xs sm:text-base"
                      >
                        ↑
                      </button>
                      <div className="w-10 h-10 sm:w-16 sm:h-16 mx-auto flex items-center justify-center bg-gray-50 rounded-lg border-2 border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all duration-200">
                        <input
                          key={`seconds-${seconds}`}
                          type="number"
                          min="0"
                          max="59"
                          value={seconds.toString().padStart(2, "0")}
                          onChange={(e) =>
                            handleDirectEdit("seconds", e.target.value)
                          }
                          className="w-full h-full text-center text-sm sm:text-2xl font-bold text-gray-900 font-mono bg-transparent border-none outline-none"
                          style={{ MozAppearance: "textfield" }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTimeChange("seconds", -1);
                        }}
                        className="w-full py-1 sm:py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-xs sm:text-base"
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
