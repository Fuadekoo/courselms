"use client";
import { useWatermarkData } from '@/hooks/useWatermarkData';

/**
 * Component to sync user data to watermark store (cookies)
 * This component should be included in the layout to auto-sync on every page
 */
export default function WatermarkSync() {
  // This hook automatically syncs user data to cookies
  useWatermarkData();
  
  // This component doesn't render anything
  return null;
}

