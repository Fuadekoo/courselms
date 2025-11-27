"use client";
import React, { useState, useEffect } from "react";
import { Settings, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type QualityLevel = "auto" | "HD" | "720p" | "360p" | "144p";

interface QualityControlProps {
  currentQuality: QualityLevel;
  availableLevels: QualityLevel[];
  onQualityChange: (quality: QualityLevel) => void;
  networkSpeed?: number; // in Mbps
  className?: string;
}

const qualityLabels: Record<QualityLevel, string> = {
  auto: "Auto",
  HD: "HD (1080p)",
  "720p": "720p",
  "360p": "360p",
  "144p": "144p",
};

const qualityBitrates: Record<QualityLevel, number> = {
  auto: 0, // Will be determined automatically
  HD: 5000, // 5 Mbps
  "720p": 2500, // 2.5 Mbps
  "360p": 800, // 800 kbps
  "144p": 250, // 250 kbps
};

export default function QualityControl({
  currentQuality,
  availableLevels,
  onQualityChange,
  networkSpeed,
  className,
}: QualityControlProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Auto-detect network speed and suggest quality
  // This is handled by the HLS player component itself
  // This effect is kept for potential future use
  useEffect(() => {
    if (currentQuality === "auto" && networkSpeed !== undefined) {
      // Auto quality switching is handled by HLS.js in the player
      // This component just displays the current state
    }
  }, [networkSpeed, currentQuality]);

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-black/60 hover:bg-black/80 text-white text-sm transition-colors"
        aria-label="Quality settings"
      >
        <Settings className="w-4 h-4" />
        <span className="hidden sm:inline">
          {qualityLabels[currentQuality]}
        </span>
        {networkSpeed !== undefined && currentQuality === "auto" && (
          <span className="hidden md:inline text-xs opacity-75">
            ({networkSpeed.toFixed(1)} Mbps)
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full right-0 mb-2 z-50 bg-black/95 rounded-lg shadow-lg min-w-[150px] overflow-hidden">
            {availableLevels.map((level) => (
              <button
                key={level}
                onClick={() => {
                  onQualityChange(level);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors flex items-center justify-between",
                  currentQuality === level && "bg-white/20"
                )}
              >
                <span>{qualityLabels[level]}</span>
                {currentQuality === level && <Check className="w-4 h-4" />}
              </button>
            ))}
            {networkSpeed !== undefined && (
              <div className="px-4 py-2 text-xs text-white/60 border-t border-white/10">
                Network: {networkSpeed.toFixed(1)} Mbps
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export { qualityLabels, qualityBitrates };
