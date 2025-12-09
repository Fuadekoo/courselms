"use client";

import React, { useRef, useState } from "react";
import useOnBlur from "@/hooks/useOnBlur";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Popover({
  trigger,
  children,
  className,
  align = "top-left",
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  align?: "bottom-left" | "bottom-right" | "top-left" | "top-right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useOnBlur(ref, open, () => {
    setTimeout(() => setOpen(false), 300);
  });
  return (
    <div className={cn("space-y-1", className)}>
      <div onClick={() => setOpen((prev) => !prev)} className={cn("")}>
        {trigger}
      </div>
      <div className="relative">
        <AnimatePresence>
          {open && (
            <motion.div
              ref={ref}
              layout
              className={cn(
                "z-30 absolute top-14 right-0  ",
                align === "bottom-left"
                  ? "bottom-0 left-0"
                  : align === "bottom-right"
                  ? "bottom-0 right-0"
                  : align === "top-left"
                  ? "top-0 left-0"
                  : align === "top-right" && "top-0 right-0"
              )}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
