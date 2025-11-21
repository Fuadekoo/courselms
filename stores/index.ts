// Export all stores
export { useStudentStore } from "./useStudentStore";
export { useUserStore } from "./useUserStore";
export { useCourseStore } from "./useCourseStore";

// Export existing stores
export { useCourseRegistrationStore } from "./courseRegistrationStore";
export { useExamStore } from "./examStore";
export { useVideoQAStore, useVideoQAFilteredQuestions } from "./videoQAStore";
export { useUploadStore } from "./uploadStore";
export { useUIStore } from "./uiStore";
export { useSubActivityThumbnailStore } from "./subActivityThumbnailStore";
export {
  useStudentProgressStore,
  useCurrentVideo,
  useOverallProgress,
  useSubActivityCompletion,
  useFinalExamStatus,
} from "./studentProgressStore";
export {
  useCourseFilterStore,
  useCourseFilterSearch,
  useCourseFilterLevel,
  useCourseFilterPagination,
  useCourseFilterView,
} from "./courseFilterStore";
export {
  usePaymentStore,
  useSelectedCourse,
  usePaymentMethod,
  usePaymentProcessing,
  usePaymentStatus,
} from "./paymentStore";

// Export all hooks
export {
  useStudentProfile,
  useStudentDashboard,
  useStudentCourses,
  useStudentFullData,
} from "@/hooks/useStudentData";

export { useUserData } from "@/hooks/useUserData";

export { useCoursesList, useCourseDetail } from "@/hooks/useCourseData";

// Re-export types
export type { VideoQuestion, VideoResponse } from "./videoQAStore";
export type { ExamQuestion } from "./examStore";
