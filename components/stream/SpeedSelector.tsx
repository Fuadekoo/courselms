"use client";

import React from "react";
import { ChevronLeft } from "lucide-react";

interface SpeedSelectorProps {
  currentSpeed: number;
  onSpeedChange: (speed: number) => void;
  onBack: () => void;
}

const speedOptions = [
  { label: "0.25x", value: 0.25 },
  { label: "0.5x", value: 0.5 },
  { label: "0.75x", value: 0.75 },
  { label: "Normal", value: 1 },
  { label: "1.25x", value: 1.25 },
  { label: "1.5x", value: 1.5 },
  { label: "1.75x", value: 1.75 },
  { label: "2x", value: 2 },
];

export default function SpeedSelector({
  currentSpeed,
  onSpeedChange,
  onBack,
}: SpeedSelectorProps) {
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
        <span style={{ fontSize: "14px", fontWeight: 500 }}>Speed</span>
      </div>

      {/* Speed Options */}
      {speedOptions.map((option) => (
        <div
          key={option.value}
          onClick={() => {
            onSpeedChange(option.value);
            onBack();
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
                currentSpeed === option.value
                  ? "rgba(59, 130, 246, 1)"
                  : "rgba(0, 0, 0, 0.3)",
              marginRight: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {currentSpeed === option.value && (
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
              color: currentSpeed === option.value ? "#000" : "rgba(0, 0, 0, 0.7)",
              fontWeight: currentSpeed === option.value ? 500 : 400,
            }}
          >
            {option.label}
          </span>
        </div>
      ))}
    </div>
  );
}

