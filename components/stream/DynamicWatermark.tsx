"use client";
import React, { useState, useEffect, useRef } from "react";
import { useStudentProfile } from "@/hooks/useStudentData";
import { useUserStore } from "@/stores/useUserStore";

interface Position {
  top: number;
  left: number;
}

const DynamicWatermark: React.FC = () => {
  // Hooks must be called unconditionally
  const { profile } = useStudentProfile();
  const { userId } = useUserStore();
  
  const [position, setPosition] = useState<Position>({ top: 10, left: 10 });
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    try {
      // Get the video player container (parent element with position: relative)
      const container = containerRef.current?.parentElement;
      
      if (!container) {
        // Fallback: use window dimensions if container not found
        const watermarkWidth = 250;
        const watermarkHeight = isLoggedIn ? 80 : 40;
        const padding = 20;
        const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 400;
        const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 640;
        const maxTop = Math.max(padding, windowHeight - watermarkHeight - padding);
        const maxLeft = Math.max(padding, windowWidth - watermarkWidth - padding);
        
        return {
          top: Math.max(padding, Math.floor(Math.random() * maxTop)),
          left: Math.max(padding, Math.floor(Math.random() * maxLeft)),
        };
      }

      // Get container dimensions
      const rect = container.getBoundingClientRect();
      const containerHeight = rect.height || container.clientHeight || 400;
      const containerWidth = rect.width || container.clientWidth || 640;
      
      const watermarkWidth = 250; // Approximate width of watermark
      const watermarkHeight = isLoggedIn ? 80 : 40; // Height varies based on content

      // Generate random position with padding
      const padding = 20;
      const maxTop = Math.max(padding, containerHeight - watermarkHeight - padding);
      const maxLeft = Math.max(padding, containerWidth - watermarkWidth - padding);

      // Ensure valid values
      const top = Math.max(padding, Math.min(maxTop, Math.floor(Math.random() * maxTop)));
      const left = Math.max(padding, Math.min(maxLeft, Math.floor(Math.random() * maxLeft)));

      return { top, left };
    } catch (error) {
      console.error('Error generating watermark position:', error);
      // Return safe default position
      return { top: 20, left: 20 };
    }
  };

  // Update position every 10 seconds
  useEffect(() => {
    // Mark as mounted
    setIsMounted(true);

    // Initial position - wait a bit for container to render
    const updatePosition = () => {
      // Use setTimeout to ensure DOM is ready
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        const newPosition = generateRandomPosition();
        setPosition(newPosition);
        // Debug log (remove in production if needed)
        // console.log('Watermark position updated:', newPosition);
      }, 300);
    };

    // Set initial position after a short delay to ensure container is rendered
    const initialTimeout = setTimeout(() => {
      updatePosition();
    }, 500);

    // Change position every 10 seconds
    intervalRef.current = setInterval(() => {
      updatePosition();
    }, 10000); // 10 seconds

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      clearTimeout(initialTimeout);
    };
  }, [isLoggedIn, profile]);

  const userInfo = getUserInfo();

  // Always render, but show default position until mounted
  const displayPosition = isMounted ? position : { top: 20, left: 20 };

  return (
    <div
      ref={containerRef}
      className="dynamic-watermark"
      style={{
        position: "absolute",
        top: `${displayPosition.top}px`,
        left: `${displayPosition.left}px`,
        zIndex: 1000,
        pointerEvents: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        transition: isMounted ? "top 0.5s ease-in-out, left 0.5s ease-in-out" : "none",
        opacity: 1,
        visibility: "visible",
        display: "block",
      }}
    >
      <div
        style={{
          background: "rgba(0, 0, 0, 0.85)",
          backdropFilter: "blur(4px)",
          padding: "10px 14px",
          borderRadius: "8px",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)",
          color: "rgba(255, 255, 255, 0.95)",
          fontSize: "13px",
          fontFamily: "monospace",
          lineHeight: "1.5",
          textAlign: "left",
          minWidth: "220px",
          whiteSpace: "nowrap",
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

