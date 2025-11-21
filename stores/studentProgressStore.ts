import { create } from "zustand";

export interface SubActivityProgress {
  [subActivityId: string]: boolean;
}

export interface ActivityQuizProgress {
  [activityId: string]: {
    status: "not-done" | "partial" | "done";
    attempts: number;
    lastAttempt?: Date;
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
  
  // Completion tracking
  completedSubActivities: Set<string>;
  isCompleting: boolean;
  
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
  
  reset: () => void;
}

const initialState = {
  currentVideo: null,
  subActivityProgress: {},
  activityQuizProgress: {},
  finalExamStatus: "not-started" as const,
  overallProgress: 0,
  completedSubActivities: new Set<string>(),
  isCompleting: false,
};

export const useStudentProgressStore = create<StudentProgressState>((set) => ({
  ...initialState,

  setCurrentVideo: (video) => set({ currentVideo: video }),
  
  clearCurrentVideo: () => set({ currentVideo: null }),
  
  setSubActivityProgress: (progress) =>
    set({
      subActivityProgress: progress,
      completedSubActivities: new Set(
        Object.entries(progress)
          .filter(([, completed]) => completed)
          .map(([id]) => id)
      ),
    }),
  
  markSubActivityComplete: (subActivityId) =>
    set((state) => ({
      subActivityProgress: {
        ...state.subActivityProgress,
        [subActivityId]: true,
      },
      completedSubActivities: new Set([
        ...state.completedSubActivities,
        subActivityId,
      ]),
    })),
  
  setActivityQuizProgress: (progress) => set({ activityQuizProgress: progress }),
  
  updateActivityQuizStatus: (activityId, status) =>
    set((state) => ({
      activityQuizProgress: {
        ...state.activityQuizProgress,
        [activityId]: {
          ...state.activityQuizProgress[activityId],
          status,
          attempts: (state.activityQuizProgress[activityId]?.attempts || 0) + 1,
          lastAttempt: new Date(),
        },
      },
    })),
  
  setFinalExamStatus: (status) => set({ finalExamStatus: status }),
  
  setOverallProgress: (progress) => set({ overallProgress: progress }),
  
  setIsCompleting: (completing) => set({ isCompleting: completing }),
  
  reset: () => set({ ...initialState, completedSubActivities: new Set() }),
}));

// Selector hooks
export const useCurrentVideo = () =>
  useStudentProgressStore((state) => state.currentVideo);

export const useOverallProgress = () =>
  useStudentProgressStore((state) => state.overallProgress);

export const useSubActivityCompletion = (subActivityId: string) =>
  useStudentProgressStore(
    (state) => state.completedSubActivities.has(subActivityId)
  );

export const useFinalExamStatus = () =>
  useStudentProgressStore((state) => state.finalExamStatus);

