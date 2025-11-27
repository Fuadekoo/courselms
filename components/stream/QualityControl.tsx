"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Settings, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type QualityLevelValue =
  | "auto"
  | "1080p"
  | "720p"
  | "480p"
  | "360p"
  | "270p"
  | "144p"
  | string; // fallback for custom values

export interface HlsLevel {
  width?: number;
  height?: number;
  bitrate?: number;
  name?: string;
}

export interface QualityOption {
  label: string;
  value: QualityLevelValue;
}

interface QualityControlProps {
  // Mode flags
  isHls?: boolean;

  // HLS data
  hlsLevels?: HlsLevel[];
  currentHlsLevel?: number; // -1 means auto

  // Non-HLS data
  nonHlsQualities?: QualityOption[]; // [{label: '1080p', value: '1080p'}]

  // Current selection
  currentQuality: QualityLevelValue; // 'auto' | '1080p' | ... (for non-HLS) or label mapping (HLS)

  // Events
  onQualityChange: (quality: QualityLevelValue) => void;

  // Optional network info (display-only)
  networkSpeedMbps?: number;

  // Styling
  className?: string;
}

function formatBitrate(bps?: number): string | undefined {
  if (!bps) return undefined;
  if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(1)} Mbps`;
  if (bps >= 1_000) return `${(bps / 1_000).toFixed(0)} kbps`;
  return `${bps} bps`;
}

function levelToLabel(level: HlsLevel, fallbackIndex: number): string {
  const h = level.height || 0;
  if (h >= 1080) return "1080p";
  if (h >= 720) return "720p";
  if (h >= 480) return "480p";
  if (h >= 360) return "360p";
  if (h >= 270) return "270p";
  if (h >= 144) return "144p";
  if (h > 0) return `${h}p`;
  return `Level ${fallbackIndex + 1}`;
}

export default function QualityControl({
  isHls = false,
  hlsLevels = [],
  currentHlsLevel = -1,
  nonHlsQualities = [],
  currentQuality,
  onQualityChange,
  networkSpeedMbps,
  className,
}: QualityControlProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Build options list
  const options: QualityOption[] = useMemo(() => {
    if (isHls) {
      const opts: QualityOption[] = [{ label: "Auto", value: "auto" }];
      if (hlsLevels.length > 0) {
        const sorted = [...hlsLevels].sort((a, b) => (b.height || 0) - (a.height || 0));
        sorted.forEach((lvl, idx) => {
          const label = levelToLabel(lvl, idx);
          const br = formatBitrate(lvl.bitrate);
          opts.push({ label: br ? `${label} (${br})` : label, value: label });
        });
      }
      return opts;
    }

    // Non-HLS: prepend Auto and then provided qualities
    return [{ label: "Auto", value: "auto" }, ...nonHlsQualities];
  }, [isHls, hlsLevels, nonHlsQualities]);

  // Determine which option is selected for display
  const selectedValue: QualityLevelValue = useMemo(() => {
    if (isHls) {
      if (currentHlsLevel === -1) return "auto";
      const lvl = hlsLevels[currentHlsLevel];
      if (!lvl) return "auto";
      return levelToLabel(lvl, currentHlsLevel);
    }
    return currentQuality;
  }, [isHls, currentHlsLevel, hlsLevels, currentQuality]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const target = e.target as HTMLElement;
      if (!target.closest("[data-quality-control]") && !target.closest("[data-quality-toggle]") ) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  // Button label
  const buttonLabel = selectedValue === "auto" ? "Auto" : `${selectedValue}`;

  return (
    <div ref={containerRef} className={cn("relative", className)} data-quality-control>
      <button
        type="button"
        aria-label="Quality"
        title="Quality"
        data-quality-toggle
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={cn(
          "flex items-center gap-1 rounded-full px-3 h-10 text-white shadow",
          "bg-[rgba(59,130,246,0.6)] hover:bg-[rgba(59,130,246,0.8)]"
        )}
        style={{ fontSize: 14 }}
      >
        <Settings size={16} />
        <span>{buttonLabel}</span>
        <ChevronDown size={14} />
      </button>

      {open && (
        <div
          className="absolute bottom-12 right-0 min-w-[220px] rounded-md bg-white/95 shadow-lg p-1 z-[250]"
          role="menu"
          aria-label="Quality options"
        >
          {/* Optional Network Speed */}
          {typeof networkSpeedMbps === "number" && (
            <div className="px-3 py-2 text-xs text-black/60 border-b border-black/10">
              Network: ~{networkSpeedMbps.toFixed(1)} Mbps
            </div>
          )}

          {options.map((opt) => {
            const isSelected = selectedValue === opt.value;
            return (
              <div
                key={opt.value}
                role="menuitemradio"
                aria-checked={isSelected}
                onClick={(e) => {
                  e.stopPropagation();
                  onQualityChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between px-3 py-2 cursor-pointer rounded-md",
                  "hover:bg-black/5"
                )}
              >
                <span className={cn("text-sm", isSelected ? "text-black font-medium" : "text-black/80")}>{opt.label}</span>
                {isSelected && <Check size={16} className="text-blue-600" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
