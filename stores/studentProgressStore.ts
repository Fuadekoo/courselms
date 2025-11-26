import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export interface SubActivityProgress {
  [subActivityId: string]: boolean;
}

export interface ActivityQuizProgress {
  [activityId: string]: {
    status: "not-done" | "partial" | "done";
    attempts: number;
    lastAttempt?: string; // Store as string for persistence
  };
}

export interface StudentProgressState {
  // Current video/lesson
  currentVideo: {
    url: string;
    title: string;
    subActivityId: string;
    thumbnail: string;
  } | null;
  
  // Progress tracking
  subActivityProgress: SubActivityProgress;
  activityQuizProgress: ActivityQuizProgress;
  finalExamStatus: "not-started" | "in-progress" | "completed";
  overallProgress: number;
  
  // Completion tracking (stored as array for persistence)
  completedSubActivities: string[];
  isCompleting: boolean;
  
  // Course-specific state
  currentCourseId: string | null;
  
  // Actions
  setCurrentVideo: (video: {
    url: string;
    title: string;
    subActivityId: string;
    thumbnail: string;
  }) => void;
  clearCurrentVideo: () => void;
  
  setSubActivityProgress: (progress: SubActivityProgress) => void;
  markSubActivityComplete: (subActivityId: string) => void;
  
  setActivityQuizProgress: (progress: ActivityQuizProgress) => void;
  updateActivityQuizStatus: (
    activityId: string,
    status: "not-done" | "partial" | "done"
  ) => void;
  
  setFinalExamStatus: (status: "not-started" | "in-progress" | "completed") => void;
  setOverallProgress: (progress: number) => void;
  
  setIsCompleting: (completing: boolean) => void;
  setCurrentCourseId: (courseId: string | null) => void;
  
  // Helper to check if sub-activity is completed
  isSubActivityCompleted: (subActivityId: string) => boolean;
  
  // Get progress for a specific course
  getCourseProgress: (courseId: string) => {
    completed: number;
    total: number;
    percentage: number;
  };
  
  reset: () => void;
  resetCourse: (courseId: string) => void;
}

const initialState = {
  currentVideo: null,
  subActivityProgress: {} as SubActivityProgress,
  activityQuizProgress: {} as ActivityQuizProgress,
  finalExamStatus: "not-started" as const,
  overallProgress: 0,
  completedSubActivities: [] as string[],
  isCompleting: false,
  currentCourseId: null,
};

export const useStudentProgressStore = create<StudentProgressState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setCurrentVideo: (video) => 
          set({ currentVideo: video }, false, "setCurrentVideo"),
        
        clearCurrentVideo: () => 
          set({ currentVideo: null }, false, "clearCurrentVideo"),
        
        setSubActivityProgress: (progress) =>
          set(
            {
              subActivityProgress: progress,
              completedSubActivities: Object.entries(progress)
                .filter(([, completed]) => completed)
                .map(([id]) => id),
            },
            false,
            "setSubActivityProgress"
          ),
        
        markSubActivityComplete: (subActivityId) =>
          set(
            (state) => ({
              subActivityProgress: {
                ...state.subActivityProgress,
                [subActivityId]: true,
              },
              completedSubActivities: state.completedSubActivities.includes(subActivityId)
                ? state.completedSubActivities
                : [...state.completedSubActivities, subActivityId],
            }),
            false,
            "markSubActivityComplete"
          ),
        
        setActivityQuizProgress: (progress) => 
          set({ activityQuizProgress: progress }, false, "setActivityQuizProgress"),
        
        updateActivityQuizStatus: (activityId, status) =>
          set(
            (state) => ({
              activityQuizProgress: {
                ...state.activityQuizProgress,
                [activityId]: {
                  ...state.activityQuizProgress[activityId],
                  status,
                  attempts: (state.activityQuizProgress[activityId]?.attempts || 0) + 1,
                  lastAttempt: new Date().toISOString(),
                },
              },
            }),
            false,
            "updateActivityQuizStatus"
          ),
        
        setFinalExamStatus: (status) => 
          set({ finalExamStatus: status }, false, "setFinalExamStatus"),
        
        setOverallProgress: (progress) => 
          set({ overallProgress: progress }, false, "setOverallProgress"),
        
        setIsCompleting: (completing) => 
          set({ isCompleting: completing }, false, "setIsCompleting"),
        
        setCurrentCourseId: (courseId) => 
          set({ currentCourseId: courseId }, false, "setCurrentCourseId"),
        
        isSubActivityCompleted: (subActivityId) => {
          const state = get();
          return state.completedSubActivities.includes(subActivityId) ||
                 state.subActivityProgress[subActivityId] === true;
        },
        
        getCourseProgress: (courseId) => {
          const state = get();
          // This would need course data to calculate properly
          // For now, return based on completed sub-activities
          const completed = state.completedSubActivities.length;
          const total = Object.keys(state.subActivityProgress).length || 1;
          return {
            completed,
            total,
            percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
          };
        },
        
        reset: () => 
          set({ ...initialState, completedSubActivities: [] }, false, "reset"),
        
        resetCourse: (courseId) =>
          set(
            (state) => {
              // Reset only progress related to this course
              // This is a simplified version - you might want to track course-specific progress
              if (state.currentCourseId === courseId) {
                return {
                  ...initialState,
                  currentCourseId: courseId,
                  completedSubActivities: [],
                };
              }
              return state;
            },
            false,
            "resetCourse"
          ),
      }),
      {
        name: "student-progress-storage",
        partialize: (state) => ({
          subActivityProgress: state.subActivityProgress,
          activityQuizProgress: state.activityQuizProgress,
          finalExamStatus: state.finalExamStatus,
          overallProgress: state.overallProgress,
          completedSubActivities: state.completedSubActivities,
          currentCourseId: state.currentCourseId,
          // Don't persist currentVideo as it's session-specific
        }),
      }
    ),
    { name: "StudentProgressStore" }
  )
);

// Selector hooks (optimized to prevent unnecessary re-renders)
export const useCurrentVideo = () =>
  useStudentProgressStore((state) => state.currentVideo);

export const useOverallProgress = () =>
  useStudentProgressStore((state) => state.overallProgress);

export const useSubActivityCompletion = (subActivityId: string) =>
  useStudentProgressStore((state) => 
    state.completedSubActivities.includes(subActivityId) ||
    state.subActivityProgress[subActivityId] === true
  );

export const useFinalExamStatus = () =>
  useStudentProgressStore((state) => state.finalExamStatus);

export const useCompletedSubActivities = () =>
  useStudentProgressStore((state) => new Set(state.completedSubActivities));

export const useSubActivityProgress = () =>
  useStudentProgressStore((state) => state.subActivityProgress);

export const useActivityQuizProgress = () =>
  useStudentProgressStore((state) => state.activityQuizProgress);

export const useCurrentCourseId = () =>
  useStudentProgressStore((state) => state.currentCourseId);

