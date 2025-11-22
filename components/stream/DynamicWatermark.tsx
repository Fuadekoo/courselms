"use client";
import React, { useState, useEffect, useRef } from "react";
import { useStudentProfile } from "@/hooks/useStudentData";
import { useUserStore } from "@/stores/useUserStore";

interface Position {
  top: number;
  left: number;
}

const DynamicWatermark: React.FC = () => {
  const { profile } = useStudentProfile();
  const { userId } = useUserStore();
  const [position, setPosition] = useState<Position>({ top: 10, left: 10 });
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if user is logged in
  const isLoggedIn = !!userId && !!profile;

  // Get user info
  const getUserInfo = () => {
    if (!isLoggedIn || !profile) {
      return {
        message: "The video is protected by Darulkubra",
      };
    }

    // Construct full name
    const nameParts = [
      profile.firstName,
      profile.fatherName,
      profile.lastName,
    ].filter(Boolean);
    const fullName = nameParts.join(" ") || "Unknown";

    // Format phone number (mask middle digits for privacy)
    const phoneNumber = profile.phoneNumber || "N/A";
    const maskedPhone =
      phoneNumber.length > 4
        ? `${phoneNumber.slice(0, 2)}***${phoneNumber.slice(-2)}`
        : phoneNumber;

    // Get current timestamp
    const timestamp = new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    return {
      fullName,
      phoneNumber: maskedPhone,
      timestamp,
    };
  };

  // Generate random position
  const generateRandomPosition = (): Position => {
    // Get the video player container (parent element with position: relative)
    const container = containerRef.current?.parentElement;
    
    if (!container) {
      // Fallback: use window dimensions if container not found
      const watermarkWidth = 250;
      const watermarkHeight = isLoggedIn ? 80 : 40;
      const padding = 20;
      const maxTop = Math.max(padding, (window.innerHeight || 400) - watermarkHeight - padding);
      const maxLeft = Math.max(padding, (window.innerWidth || 640) - watermarkWidth - padding);
      
      return {
        top: Math.max(padding, Math.floor(Math.random() * maxTop)),
        left: Math.max(padding, Math.floor(Math.random() * maxLeft)),
      };
    }

    // Get container dimensions
    const containerHeight = container.clientHeight || container.getBoundingClientRect().height;
    const containerWidth = container.clientWidth || container.getBoundingClientRect().width;
    
    const watermarkWidth = 250; // Approximate width of watermark
    const watermarkHeight = isLoggedIn ? 80 : 40; // Height varies based on content

    // Generate random position with padding
    const padding = 20;
    const maxTop = Math.max(padding, containerHeight - watermarkHeight - padding);
    const maxLeft = Math.max(padding, containerWidth - watermarkWidth - padding);

    const top = Math.max(padding, Math.floor(Math.random() * maxTop));
    const left = Math.max(padding, Math.floor(Math.random() * maxLeft));

    return { top, left };
  };

  // Update position every 10 seconds
  useEffect(() => {
    // Initial position - wait a bit for container to render
    const updatePosition = () => {
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        setPosition(generateRandomPosition());
      }, 100);
    };

    // Set initial position
    updatePosition();

    // Change position every 10 seconds
    intervalRef.current = setInterval(() => {
      updatePosition();
    }, 10000); // 10 seconds

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isLoggedIn, profile]);

  const userInfo = getUserInfo();

  return (
    <div
      ref={containerRef}
      className="dynamic-watermark"
      style={{
        position: "absolute",
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 1000,
        pointerEvents: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        transition: "top 0.5s ease-in-out, left 0.5s ease-in-out",
      }}
    >
      <div
        style={{
          background: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(4px)",
          padding: "8px 12px",
          borderRadius: "6px",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
          color: "rgba(255, 255, 255, 0.9)",
          fontSize: "12px",
          fontFamily: "monospace",
          lineHeight: "1.4",
          textAlign: "left",
          minWidth: "200px",
        }}
      >
        {isLoggedIn && userInfo.fullName ? (
          <div>
            <div style={{ fontWeight: 600, marginBottom: "4px" }}>
              {userInfo.fullName}
            </div>
            <div style={{ fontSize: "11px", opacity: 0.8 }}>
              📱 {userInfo.phoneNumber}
            </div>
            <div style={{ fontSize: "10px", opacity: 0.7, marginTop: "2px" }}>
              🕒 {userInfo.timestamp}
            </div>
          </div>
        ) : (
          <div style={{ fontWeight: 600, textAlign: "center" }}>
            {userInfo.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicWatermark;

