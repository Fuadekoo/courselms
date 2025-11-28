"use client";

import React from "react";
import { ChevronLeft } from "lucide-react";

export interface QualityOption {
  label: string;
  value: string;
  url: string;
}

export interface HlsLevel {
  width?: number;
  height?: number;
  bitrate?: number;
  name?: string;
}

interface QualitySelectorProps {
  qualities: QualityOption[];
  currentQuality: string;
  onQualityChange: (quality: string) => void;
  onBack: () => void;
  hlsLevels?: HlsLevel[];
  currentHlsLevel?: number;
  isHls?: boolean;
}

export default function QualitySelector({
  qualities,
  currentQuality,
  onQualityChange,
  onBack,
  hlsLevels = [],
  currentHlsLevel = -1,
  isHls = false,
}: QualitySelectorProps) {
  // Convert HLS levels to quality options
  const getHlsQualityOptions = (): QualityOption[] => {
    // Always show "Auto" option for HLS, even if levels aren't loaded yet
    const options: QualityOption[] = [
      { label: "Auto", value: "auto", url: "" },
    ];

    // If levels are available, add them
    if (hlsLevels.length > 0) {
      // Sort levels by height (highest first) for consistent display
      const sortedLevels = [...hlsLevels].sort((a, b) => {
        const heightA = a.height || 0;
        const heightB = b.height || 0;
        return heightB - heightA; // Descending order
      });

      sortedLevels.forEach((level, index) => {
        const height = level.height || 0;
        let label = "";

        if (height >= 1080) label = "1080p";
        else if (height >= 720) label = "720p";
        else if (height >= 480) label = "480p";
        else if (height >= 360) label = "360p";
        else if (height >= 270) label = "270p";
        else if (height > 0) label = `${height}p`;
        else label = `Level ${index + 1}`;

        // Add bitrate info if available
        if (level.bitrate) {
          const bitrateMbps = (level.bitrate / 1000000).toFixed(1);
          label += ` (${bitrateMbps} Mbps)`;
        }

        options.push({
          label,
          value: label.split(" ")[0], // Use just the resolution part (e.g., "1080p")
          url: "",
        });
      });
    } else if (isHls) {
      // If HLS but levels not loaded yet, show a loading message
      options.push({
        label: "Loading qualities...",
        value: "loading",
        url: "",
      });
    }

    return options;
  };

  const qualityOptions = isHls
    ? getHlsQualityOptions()
    : [{ label: "Auto", value: "auto", url: "" }, ...qualities];

  // Debug: Log quality options
  React.useEffect(() => {
    console.log("[QualitySelector] Quality Options:", {
      isHls,
      optionsCount: qualityOptions.length,
      options: qualityOptions,
      hlsLevelsCount: hlsLevels.length,
    });
  }, [isHls, qualityOptions, hlsLevels.length]);

  // Determine current quality display
  const getCurrentQualityValue = () => {
    if (isHls) {
      if (currentHlsLevel === -1) return "auto";
      const level = hlsLevels[currentHlsLevel];
      if (level) {
        const height = level.height || 0;
        if (height >= 1080) return "1080p";
        if (height >= 720) return "720p";
        if (height >= 480) return "480p";
        if (height >= 360) return "360p";
        if (height >= 270) return "270p";
      }
      return "auto";
    }
    return currentQuality;
  };

  const displayQuality = getCurrentQualityValue();

  return (
    <div
      style={{
        position: "absolute",
        bottom: "60px",
        right: "16px",
        background: "rgba(255, 255, 255, 0.95)",
        borderRadius: "8px",
        padding: "8px 0",
        minWidth: "200px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
        zIndex: 200,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "8px 16px",
          borderBottom: "1px solid rgba(0, 0, 0, 0.1)",
          cursor: "pointer",
        }}
        onClick={onBack}
      >
        <ChevronLeft size={16} style={{ marginRight: "8px" }} />
        <span style={{ fontSize: "14px", fontWeight: 500 }}>Quality</span>
      </div>

      {/* Quality Options */}
      {qualityOptions.length === 0 ? (
        <div
          style={{
            padding: "12px 16px",
            color: "rgba(0, 0, 0, 0.5)",
            fontSize: "14px",
          }}
        >
          No quality options available
        </div>
      ) : (
        qualityOptions
          .filter((q) => q.value !== "loading") // Filter out loading option
          .map((quality) => (
            <div
              key={quality.value}
              onClick={() => {
                if (quality.value !== "loading") {
                  onQualityChange(quality.value);
                  onBack();
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px 16px",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(0, 0, 0, 0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              {/* Radio Button */}
              <div
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  border: "2px solid",
                  borderColor:
                    displayQuality === quality.value
                      ? "rgba(59, 130, 246, 1)"
                      : "rgba(0, 0, 0, 0.3)",
                  marginRight: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                {displayQuality === quality.value && (
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: "rgba(59, 130, 246, 1)",
                    }}
                  />
                )}
              </div>
              <span
                style={{
                  fontSize: "14px",
                  color:
                    displayQuality === quality.value
                      ? "#000"
                      : "rgba(0, 0, 0, 0.7)",
                  fontWeight: displayQuality === quality.value ? 500 : 400,
                }}
              >
                {quality.label}
              </span>
            </div>
          ))
      )}
    </div>
  );
}
