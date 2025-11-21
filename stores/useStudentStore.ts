import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

// Types
interface DashboardStats {
  totalCourses: number;
  coursesInProgress: number;
  completedCourses: number;
  certificatesEarned: number;
}

interface CourseProgress {
  id: string;
  titleEn: string;
  titleAm: string;
  thumbnail: string;
  progress: number;
  totalSubActivities: number;
  completedSubActivities: number;
  category: string;
}

interface ProfileData {
  id: string;
  username: string | null;
  firstName: string | null;
  fatherName: string | null;
  lastName: string | null;
  gender: string | null;
  phoneNumber: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  age: number | null;
  role: string | null;
  enrolledCoursesCount: number;
  completedCoursesCount: number;
  questionsAnswered: number;
}

interface StudentState {
  // Data
  profile: ProfileData | null;
  dashboardStats: DashboardStats | null;
  graphData: CourseProgress[] | null;
  continueLearning: CourseProgress[] | null;
  enrolledCourses: CourseProgress[] | null;

  // Loading states
  isLoadingProfile: boolean;
  isLoadingDashboard: boolean;
  isLoadingCourses: boolean;

  // Timestamps for cache invalidation (5 minutes)
  profileTimestamp: number | null;
  dashboardTimestamp: number | null;
  coursesTimestamp: number | null;

  // Actions
  setProfile: (profile: ProfileData) => void;
  setDashboardStats: (stats: DashboardStats) => void;
  setGraphData: (data: CourseProgress[]) => void;
  setContinueLearning: (data: CourseProgress[]) => void;
  setEnrolledCourses: (data: CourseProgress[]) => void;

  setLoadingProfile: (loading: boolean) => void;
  setLoadingDashboard: (loading: boolean) => void;
  setLoadingCourses: (loading: boolean) => void;

  // Cache helpers
  isProfileFresh: () => boolean;
  isDashboardFresh: () => boolean;
  isCoursesFresh: () => boolean;

  // Clear cache
  clearProfile: () => void;
  clearDashboard: () => void;
  clearCourses: () => void;
  clearAll: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useStudentStore = create<StudentState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        profile: null,
        dashboardStats: null,
        graphData: null,
        continueLearning: null,
        enrolledCourses: null,

        isLoadingProfile: false,
        isLoadingDashboard: false,
        isLoadingCourses: false,

        profileTimestamp: null,
        dashboardTimestamp: null,
        coursesTimestamp: null,

        // Setters
        setProfile: (profile) =>
          set({
            profile,
            profileTimestamp: Date.now(),
            isLoadingProfile: false,
          }),

        setDashboardStats: (dashboardStats) =>
          set({
            dashboardStats,
            dashboardTimestamp: Date.now(),
            isLoadingDashboard: false,
          }),

        setGraphData: (graphData) =>
          set({
            graphData,
            coursesTimestamp: Date.now(),
            isLoadingCourses: false,
          }),

        setContinueLearning: (continueLearning) =>
          set({
            continueLearning,
            isLoadingCourses: false,
          }),

        setEnrolledCourses: (enrolledCourses) =>
          set({
            enrolledCourses,
            isLoadingCourses: false,
          }),

        setLoadingProfile: (isLoadingProfile) => set({ isLoadingProfile }),
        setLoadingDashboard: (isLoadingDashboard) =>
          set({ isLoadingDashboard }),
        setLoadingCourses: (isLoadingCourses) => set({ isLoadingCourses }),

        // Cache freshness checkers
        isProfileFresh: () => {
          const timestamp = get().profileTimestamp;
          if (!timestamp) return false;
          return Date.now() - timestamp < CACHE_DURATION;
        },

        isDashboardFresh: () => {
          const timestamp = get().dashboardTimestamp;
          if (!timestamp) return false;
          return Date.now() - timestamp < CACHE_DURATION;
        },

        isCoursesFresh: () => {
          const timestamp = get().coursesTimestamp;
          if (!timestamp) return false;
          return Date.now() - timestamp < CACHE_DURATION;
        },

        // Clear functions
        clearProfile: () =>
          set({
            profile: null,
            profileTimestamp: null,
          }),

        clearDashboard: () =>
          set({
            dashboardStats: null,
            dashboardTimestamp: null,
          }),

        clearCourses: () =>
          set({
            graphData: null,
            continueLearning: null,
            enrolledCourses: null,
            coursesTimestamp: null,
          }),

        clearAll: () =>
          set({
            profile: null,
            dashboardStats: null,
            graphData: null,
            continueLearning: null,
            enrolledCourses: null,
            profileTimestamp: null,
            dashboardTimestamp: null,
            coursesTimestamp: null,
          }),
      }),
      {
        name: "student-storage",
        partialize: (state) => ({
          profile: state.profile,
          dashboardStats: state.dashboardStats,
          graphData: state.graphData,
          continueLearning: state.continueLearning,
          enrolledCourses: state.enrolledCourses,
          profileTimestamp: state.profileTimestamp,
          dashboardTimestamp: state.dashboardTimestamp,
          coursesTimestamp: state.coursesTimestamp,
        }),
      }
    ),
    { name: "StudentStore" }
  )
);
