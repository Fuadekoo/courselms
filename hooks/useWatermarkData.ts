"use client";
import { useEffect } from 'react';
import { useWatermarkStore } from '@/stores/useWatermarkStore';
import { useStudentProfile } from '@/hooks/useStudentData';
import { useUserStore } from '@/stores/useUserStore';

/**
 * Hook to sync user data to watermark store (cookies)
 * Call this after successful login to save user data
 */
export function useWatermarkData() {
  const { profile } = useStudentProfile();
  const { userName } = useUserStore();
  const { setUserData, clearUserData } = useWatermarkStore();

  // Auto-sync when profile or username changes
  useEffect(() => {
    if (profile && (profile.firstName || profile.phoneNumber || userName)) {
      // Construct full name
      const nameParts = [
        profile.firstName,
        profile.fatherName,
        profile.lastName,
      ].filter(Boolean);
      const fullName = nameParts.join(" ") || userName || null;

      // Save to watermark store (which saves to cookies)
      setUserData(
        userName || profile.phoneNumber || null,
        profile.phoneNumber || null,
        fullName
      );
    } else if (!profile && !userName) {
      // Clear if no user data
      clearUserData();
    }
  }, [profile, userName, setUserData, clearUserData]);

  return {
    setUserData,
    clearUserData,
  };
}

