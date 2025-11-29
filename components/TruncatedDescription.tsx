"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@heroui/react";

interface TruncatedDescriptionProps {
  text: string;
  maxLines?: number;
  className?: string;
  lang?: "en" | "am";
}

export default function TruncatedDescription({
  text,
  maxLines = 3,
  className = "",
  lang = "en",
}: TruncatedDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const checkIfTruncated = () => {
      if (!textRef.current) return;

      // Save original styles
      const originalStyle = textRef.current.style.cssText;
      
      // Get height when clamped
      const clampedHeight = textRef.current.scrollHeight;
      
      // Temporarily remove clamp to get full height
      textRef.current.style.webkitLineClamp = "none";
      textRef.current.style.overflow = "visible";
      textRef.current.style.display = "block";
      const fullHeight = textRef.current.scrollHeight;
      
      // Restore original styles
      textRef.current.style.cssText = originalStyle;
      
      // Show button if full height is significantly greater than clamped height
      // Add small buffer (10px) for rounding differences
      setShowButton(fullHeight > clampedHeight + 10);
    };

    // Check after component mounts and text is rendered
    const timeoutId = setTimeout(checkIfTruncated, 150);
    
    // Also check on resize
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(checkIfTruncated, 50);
    });
    
    if (textRef.current) {
      resizeObserver.observe(textRef.current);
    }
    
    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
    };
  }, [text, maxLines]);

  if (!text) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      <p
        ref={textRef}
        className="text-sm text-default-600 leading-relaxed transition-all duration-300"
        style={
          !isExpanded
            ? {
                display: "-webkit-box",
                WebkitLineClamp: maxLines,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }
            : undefined
        }
      >
        {text}
      </p>

      {showButton && (
        <Button
          variant="light"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-primary hover:text-primary-600 dark:hover:text-primary-400 -ml-2 h-auto py-1 px-2 min-w-0 font-medium"
          endContent={
            isExpanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )
          }
        >
          <span className="text-xs">
            {isExpanded
              ? lang === "en"
                ? "See less"
                : "ቀንስ"
              : lang === "en"
              ? "See more"
              : "ተጨማሪ ይመልከቱ"}
          </span>
        </Button>
      )}
    </div>
  );
}