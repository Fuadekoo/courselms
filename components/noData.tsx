"use client";

import React from "react";
import { motion } from "framer-motion";

export default function NoData({ message }: { message?: string }) {
  return (
    <motion.div
      layoutId="nodata"
      layout
      initial={{ scale: 0, opacity: 0 }}
      exit={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="size-full grid place-content-center py-12"
    >
      <div className="flex flex-col items-center gap-6">
        {/* Minimalist Document with Magnifying Glass Illustration */}
        <svg
          width="200"
          height="200"
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-gray-300 dark:text-gray-700"
        >
          {/* Background subtle shapes */}
          <circle cx="40" cy="160" r="20" fill="currentColor" opacity="0.1" />
          <circle cx="160" cy="40" r="30" fill="currentColor" opacity="0.1" />

          {/* Document */}
          <g className="text-gray-400 dark:text-gray-600">
            {/* Document body */}
            <path
              d="M50 40 L50 160 L130 160 L130 60 L110 40 Z"
              stroke="currentColor"
              strokeWidth="2.5"
              fill="white"
              className="dark:fill-gray-800"
            />
            {/* Folded corner */}
            <path
              d="M110 40 L110 60 L130 60"
              stroke="currentColor"
              strokeWidth="2.5"
              fill="none"
            />

            {/* Document content - rows of dots */}
            <g className="text-gray-300 dark:text-gray-700">
              {/* Row 1 */}
              <circle cx="70" cy="80" r="3" fill="currentColor" />
              <circle cx="85" cy="80" r="3" fill="currentColor" />
              <circle cx="100" cy="80" r="3" fill="currentColor" />

              {/* Row 2 */}
              <circle cx="70" cy="100" r="3" fill="currentColor" />
              <circle cx="85" cy="100" r="3" fill="currentColor" />
              <circle cx="100" cy="100" r="3" fill="currentColor" />

              {/* Row 3 */}
              <circle cx="70" cy="120" r="3" fill="currentColor" />
              <circle cx="85" cy="120" r="3" fill="currentColor" />
              <circle cx="100" cy="120" r="3" fill="currentColor" />
            </g>
          </g>

          {/* Magnifying Glass */}
          <g className="text-gray-400 dark:text-gray-600">
            {/* Glass circle */}
            <circle
              cx="140"
              cy="110"
              r="30"
              stroke="currentColor"
              strokeWidth="3"
              fill="white"
              fillOpacity="0.5"
              className="dark:fill-gray-800 dark:fill-opacity-50"
            />
            {/* Handle */}
            <line
              x1="162"
              y1="132"
              x2="180"
              y2="150"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
        </svg>

        {/* Text */}
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
            No Data Found
          </h3>
          {message && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {message}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
