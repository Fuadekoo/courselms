"use client";

import React from "react";
import { ChevronRight } from "lucide-react";

interface SettingsMenuProps {
  currentQuality: string;
  currentSpeed: number;
  onQualityClick: () => void;
  onSpeedClick: () => void;
  isHls?: boolean;
  hlsLevels?: any[];
  currentHlsLevel?: number;
}

export default function SettingsMenu({
  currentQuality,
  currentSpeed,
  onQualityClick,
  onSpeedClick,
  isHls = false,
  hlsLevels = [],
  currentHlsLevel = -1,
}: SettingsMenuProps) {
  const getSpeedLabel = (speed: number) => {
    if (speed === 1) return "Normal";
    return `${speed}x`;
  };

  const getQualityLabel = () => {
    if (isHls && hlsLevels.length > 0) {
      if (currentHlsLevel === -1) {
        return "Auto";
      }
      const level = hlsLevels[currentHlsLevel];
      if (level) {
        const height = level.height || 0;
        if (height >= 1080) return "1080p";
        if (height >= 720) return "720p";
        if (height >= 480) return "480p";
        if (height >= 360) return "360p";
        if (height >= 270) return "270p";
        return `${height}p`;
      }
      return "Auto";
    }
    return currentQuality === "auto" ? "Auto" : currentQuality;
  };

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
      {/* Quality Option */}
      <div
        onClick={onQualityClick}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
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
        <div>
          <div style={{ fontSize: "14px", fontWeight: 500, marginBottom: "2px" }}>
            Quality
          </div>
          <div style={{ fontSize: "12px", color: "rgba(0, 0, 0, 0.6)" }}>
            {getQualityLabel()}
          </div>
        </div>
        <ChevronRight size={16} style={{ color: "rgba(0, 0, 0, 0.4)" }} />
      </div>

      {/* Speed Option */}
      <div
        onClick={onSpeedClick}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
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
        <div>
          <div style={{ fontSize: "14px", fontWeight: 500, marginBottom: "2px" }}>
            Speed
          </div>
          <div style={{ fontSize: "12px", color: "rgba(0, 0, 0, 0.6)" }}>
            {getSpeedLabel(currentSpeed)}
          </div>
        </div>
        <ChevronRight size={16} style={{ color: "rgba(0, 0, 0, 0.4)" }} />
      </div>
    </div>
  );
}

